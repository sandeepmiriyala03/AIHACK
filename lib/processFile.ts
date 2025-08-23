import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import xlsx from "xlsx";
import Tesseract from "tesseract.js";
import nlp from "compromise";
import pdfParse from "pdf-parse";
import pptx2json from "pptx2json";
import sharp from "sharp";
import { Converter } from "pdf-poppler";
import pLimit from "p-limit"; // concurrency limiter, npm install p-limit

const CHUNK_SIZE = 20000; // chunk size characters
const CHUNK_OVERLAP = 500; // characters of overlap between chunks
const MAX_CONCURRENT_CHUNKS = 3; // concurrency for chunk analysis

interface ImageInfo {
  dimensions?: string;
  format?: string | undefined;
}

interface ChunkEntities {
  people: string[];
  organizations: string[];
  numbers: string[];
  dates: string[];
}

interface ChunkAnalysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
  entities: ChunkEntities;
}

interface ProcessResult {
  total_chunks: number;
  file_type: string;
  image_info?: ImageInfo;
  analysis: ChunkAnalysis[];
  final_summary: string;
}

/** Extract keywords by frequency */
function extractKeywords(text: string, maxCount = 10): string[] {
  const doc = nlp(text);
  const words = doc.nouns().out("array").concat(doc.verbs().out("array"));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, maxCount);
}

/** Extract summary sentences by scoring */
function extractiveSummarize(text: string, maxCount = 3): string[] {
  const sentences = text.split(/(?<=[.?!])\s+/).filter(Boolean);
  const doc = nlp(text);
  const tokens = doc.nouns().out("array").concat(doc.verbs().out("array"));
  const freq: Record<string, number> = {};
  for (const token of tokens) freq[token] = (freq[token] || 0) + 1;
  const scored = sentences.map(sentence => {
    const sentenceTokens = sentence.toLowerCase().split(/\W+/);
    let score = 0;
    for (const token of sentenceTokens) if (freq[token]) score += freq[token];
    return { sentence, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map(s => s.sentence);
}

/** Extract highlights as summary or first lines */
function extractHighlights(text: string, maxCount = 3): string[] {
  const summarized = extractiveSummarize(text, maxCount);
  if (summarized.length) return summarized;
  return text
    .split(/(?<=[.?!])\s+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, maxCount);
}

/** Extract named entities */
function extractEntities(text: string): ChunkEntities {
  const doc = nlp(text);
  const dateMatches =
    text.match(/\b(?:\d{1,2}[\/\.-]){2}\d{2,4}\b|\b\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2}\b/g) || [];
  return {
    people: doc.people().out("array"),
    organizations: doc.organizations().out("array"),
    numbers: doc.numbers().out("array"),
    dates: dateMatches,
  };
}

/** Get image metadata with sharp */
async function getImageMetadata(buffer: Buffer): Promise<ImageInfo> {
  try {
    const img = sharp(buffer);
    const { width, height, format } = await img.metadata();
    return {
      dimensions: width && height ? `${width}x${height}` : undefined,
      format,
    };
  } catch {
    return {};
  }
}

/** Chunk text with overlap */
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0, end = chunkSize;
  while (start < text.length) {
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    end = start + chunkSize;
  }
  return chunks;
}

/** Convert PDF pages to PNG images using pdf-poppler */
async function pdfToImages(pdfPath: string, outputDir: string): Promise<string[]> {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const converter = new Converter(pdfPath);
  await converter.convert({
    format: "png",
    out_dir: outputDir,
    out_prefix: "page",
    page_range: "1-",
  });

  return fs.readdirSync(outputDir)
    .filter(f => f.startsWith("page") && f.endsWith(".png"))
    .map(f => path.join(outputDir, f));
}

/** OCR images with tesseract.js, returning concatenated text */
async function ocrImages(imagePaths: string[], languages: string): Promise<string> {
  let fullText = "";
  for (const imgPath of imagePaths) {
    try {
      const { data: { text } } = await Tesseract.recognize(imgPath, languages, {
        logger: m => console.log(m.status, Math.floor(m.progress * 100) + "%"),
      });
      fullText += text + "\n";
    } catch (err) {
      console.error("OCR error on image:", imgPath, err);
    }
  }
  return fullText;
}

/** Simple heuristic for OCR languages based on text sample scripts */
function chooseOcrLanguages(textSample: string): string {
  const indicScriptRegex = /[\u0900-\u097F]/; // Devanagari range as example
  if (indicScriptRegex.test(textSample)) {
    return "san"; // Sanskrit language code
  }
  // Default Latin+English
  return "eng";
}

export async function processFile(filePath: string): Promise<ProcessResult> {
  const buffer = fs.readFileSync(filePath);

  const fileTypeModule = await import("file-type");
  const fromBuffer = fileTypeModule.fileTypeFromBuffer;
  if (!fromBuffer) throw new Error("file-type: fileTypeFromBuffer function not found");
  const detectedType = await fromBuffer(buffer);
  if (!detectedType) throw new Error("Unable to determine file type");
  const mime = detectedType.mime;
  const ext = detectedType.ext;

  let text = "";
  let imageInfo: ImageInfo = {};

  if (mime === "application/pdf" || ext === "pdf") {
    const data = await pdfParse(buffer);
    text = data.text.trim();

    // Fallback to OCR if text too short (scanned)
    if (!text || text.length < 50) {
      const tempDir = "./tmp_pdf_images";
      const images = await pdfToImages(filePath, tempDir);
      // Use sample of page 1 text for language decision (could leave empty)
      let sampleText = "";
      if (images.length > 0) {
        // Could add logic to analyze image or use fixed san
        sampleText = "";
      }
      const languages = chooseOcrLanguages(sampleText) + "+eng"; // Sanskrit + English fallback
      text = await ocrImages(images, languages);

      // Cleanup
      images.forEach(img => fs.unlinkSync(img));
      fs.rmdirSync(tempDir, { recursive: true });
    }
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    ext === "xlsx" || ext === "xls"
  ) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    text = xlsx.utils.sheet_to_csv(firstSheet);
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    ext === "pptx"
  ) {
    text = await new Promise<string>((resolve, reject) => {
      pptx2json.parse(
        filePath,
        null,
        (err: Error | null, data: { slides: { shapes?: { text?: string }[] }[] }) => {
          if (err) return reject(err);
          const slidesText = data.slides.map(slide =>
            slide.shapes ? slide.shapes.map(shape => shape.text || "").join(" ") : ""
          ).join("\n");
          resolve(slidesText);
        }
      );
    });
  } else if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "bmp"].includes(ext)
  ) {
    let preprocessedBuffer = sharp(buffer).grayscale().normalize();
    // Optional binarize:
    // preprocessedBuffer = preprocessedBuffer.threshold(128);
    const processedBuffer = await preprocessedBuffer.toBuffer();

    const languages = chooseOcrLanguages("");
    const ocr = await Tesseract.recognize(processedBuffer, languages + "+eng");
    text = ocr.data.text;
    imageInfo = await getImageMetadata(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mime}`);
  }

  // Chunk text with overlap
  const textChunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);

  // Concurrency limiter pool
  const limit = pLimit(MAX_CONCURRENT_CHUNKS);

  // Analyze all chunks with limited concurrency
  const analysis = await Promise.all(
    textChunks.map((chunkText, idx) =>
      limit(async () => ({
        chunk_number: idx + 1,
        keywords: extractKeywords(chunkText, 12),
        highlights: extractHighlights(chunkText, 4),
        summary: extractiveSummarize(chunkText, 3),
        entities: extractEntities(chunkText),
      }))
    )
  );

  const finalSummary = analysis.map(a => a.summary.join(" ")).join(" ");

  return {
    total_chunks: analysis.length,
    file_type: ext,
    ...(Object.keys(imageInfo).length ? { image_info: imageInfo } : {}),
    analysis,
    final_summary: finalSummary,
  };
}

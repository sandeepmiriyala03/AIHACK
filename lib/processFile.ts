import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import nlp from "compromise";
import pdfParse from "pdf-parse";
import pptx2json from "pptx2json";
import { Converter } from "pdf-poppler";
import pLimit from "p-limit";

const CHUNK_SIZE = 20000;
const CHUNK_OVERLAP = 500;
const MAX_CONCURRENT_CHUNKS = 3;

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

/**
 * Extract keywords from text based on frequency of nouns and verbs.
 */
function extractKeywords(text: string, maxCount = 10): string[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const freq: Record<string, number> = {};

  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort(([_, freqA], [__, freqB]) => freqB - freqA)
    .slice(0, maxCount)
    .map(([word]) => word);
}


// Example usage:
const text = "This is a sample text. This text is a test text to test the function.";
console.log(extractKeywords(text, 5)); // ["text", "is", "a", "this", "test"]

/**
 * Summarize text by scoring sentences with keyword frequency.
 */
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

/**
 * Extract highlights: either summary or first lines.
 */
function extractHighlights(text: string, maxCount = 3): string[] {
  const summarized = extractiveSummarize(text, maxCount);
  if (summarized.length) return summarized;
  return text
    .split(/(?<=[.?!])\s+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, maxCount);
}

/**
 * Extract named entities: people, organizations, numbers, dates.
 */
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

/**
 * Split large text into chunks with defined overlap.
 */
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  let end = chunkSize;
  while (start < text.length) {
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    end = start + chunkSize;
  }
  return chunks;
}

/**
 * Convert PDF pages to PNG images using pdf-poppler.
 */
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

/**
 * Perform OCR on a set of images with specified languages.
 */
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

/**
 * Simple heuristic to choose OCR languages based on text sample.
 */
function chooseOcrLanguages(textSample: string): string {
  const indicScriptRegex = /[\u0900-\u097F]/; // Devanagari block example
  if (indicScriptRegex.test(textSample)) {
    return "san";
  }
  return "eng";
}

/**
 * Main function to process a file, extract text, optionally fallback to OCR for PDFs,
 * chunk text, and analyze each chunk.
 */
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
  const imageInfo: ImageInfo = {};

  if (mime === "application/pdf" || ext === "pdf") {
    const data = await pdfParse(buffer);
    text = data.text.trim();

   // OCR fallback if scanned PDF (little to no embedded text or very sparse text)
if (!text || text.trim().replace(/\s/g, "").length < 20) {
  const tempDir = "./tmp_pdf_images";
  const images = await pdfToImages(filePath, tempDir);
  
  // Provide some sample text for language detection if available, else just use English
  const sampleText = text || ""; 
  const languages = chooseOcrLanguages(sampleText) + "+eng";

  text = await ocrImages(images, languages);

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
  } else {
    throw new Error(`Unsupported file type: ${mime}`);
  }

  const textChunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);

  const limit = pLimit(MAX_CONCURRENT_CHUNKS);

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

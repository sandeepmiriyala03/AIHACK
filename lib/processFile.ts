import fs from "fs";
import mammoth from "mammoth";
import xlsx from "xlsx";
import Tesseract from "tesseract.js";
import nlp from "compromise";
import pdfParse from "pdf-parse";
import pptx2json from "pptx2json";
import sharp from "sharp";

const CHUNK_SIZE = 10000; // characters per chunk, adjust for memory/quality

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

function extractiveSummarize(text: string, maxCount = 3): string[] {
  const sentences = text.split(/(?<=[.?!])\s+/).filter(Boolean);
  const doc = nlp(text);
  const tokens = doc.nouns().out("array").concat(doc.verbs().out("array"));
  const freq: Record<string, number> = {};
  for (const token of tokens) freq[token] = (freq[token] || 0) + 1;
  const scored = sentences.map(sentence => {
    const sentenceTokens = sentence.toLowerCase().split(/\W+/);
    let score = 0;
    for (const token of sentenceTokens) {
      if (freq[token]) score += freq[token];
    }
    return { sentence, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map(s => s.sentence);
}

function extractHighlights(text: string, maxCount = 3): string[] {
  const summarized = extractiveSummarize(text, maxCount);
  if (summarized.length) return summarized;
  return text
    .split(/(?<=[.?!])\s+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, maxCount);
}

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

function chunkText(text: string, chunkSize = CHUNK_SIZE): string[] {
  const sentences = text.split(/(?<=[.?!])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current) {
      chunks.push(current.trim());
      current = sentence + " ";
    } else {
      current += sentence + " ";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function processFile(filePath: string): Promise<ProcessResult> {
  const buffer: Buffer = fs.readFileSync(filePath);

  const fileTypeModule = await import("file-type");
  const fromBuffer = typeof fileTypeModule.fileTypeFromBuffer === "function"
    ? fileTypeModule.fileTypeFromBuffer
    : undefined;
  if (!fromBuffer) throw new Error("file-type: fileTypeFromBuffer function not found");
  const detectedType = await fromBuffer(buffer);
  if (!detectedType) throw new Error("Unable to determine file type");
  const mime: string = detectedType.mime;
  const ext: string = detectedType.ext;
  let text = "";
  let imageInfo: ImageInfo = {};

  if (mime === "application/pdf" || ext === "pdf") {
    const data: { text: string } = await pdfParse(buffer);
    text = data.text;
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const result: { value: string } = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    ext === "xlsx" ||
    ext === "xls"
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
          const slidesText = data.slides
            .map(slide =>
              slide.shapes
                ? slide.shapes
                    .map(shape => (shape.text ? shape.text : ""))
                    .join(" ")
                : ""
            )
            .join("\n");
          resolve(slidesText);
        }
      );
    });
  } else if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "bmp"].includes(ext)
  ) {
    const preprocessedBuffer = await sharp(buffer)
      .grayscale()
      .normalize()
      .toBuffer();
    const ocr = await Tesseract.recognize(preprocessedBuffer, "eng");
    text = ocr.data.text;
    imageInfo = await getImageMetadata(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mime}`);
  }

  const textChunks = chunkText(text, CHUNK_SIZE);

  const analysis = await Promise.all(
    textChunks.map(async (chunkText, idx) => ({
      chunk_number: idx + 1,
      keywords: extractKeywords(chunkText, 12),
      highlights: extractHighlights(chunkText, 4),
      summary: extractiveSummarize(chunkText, 3),
      entities: extractEntities(chunkText),
    }))
  );

  const finalSummary = analysis.map(a => a.summary.join(" ")).join(" ");

  const result: ProcessResult = {
    total_chunks: analysis.length,
    file_type: ext,
    ...(Object.keys(imageInfo).length && { image_info: imageInfo }),
    analysis,
    final_summary: finalSummary,
  };

  return result;
}

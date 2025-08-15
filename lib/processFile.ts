import fs from "fs";
import mammoth from "mammoth";
import xlsx from "xlsx";
import Tesseract from "tesseract.js";
import nlp from "compromise";
import pdfParse from "pdf-parse";
import pptx2json from "pptx2json";

function extractKeywords(text: string, maxCount = 10): string[] {
  const doc = nlp(text);
  const words: string[] = doc.nouns().out("array").concat(doc.verbs().out("array"));
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, maxCount);
}

function extractHighlights(text: string, maxCount = 3): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, maxCount);
}

export async function processFile(filePath: string) {
  const buffer: Buffer = fs.readFileSync(filePath);

  const fileTypeModule = await import("file-type");
  const fromBuffer =
    typeof fileTypeModule.fileTypeFromBuffer === "function"
      ? fileTypeModule.fileTypeFromBuffer
      : undefined;

  if (typeof fromBuffer !== "function") {
    throw new Error("file-type: fileTypeFromBuffer function not found");
  }

  const detectedType = await fromBuffer(buffer);

  if (!detectedType) {
    throw new Error("Unable to determine file type");
  }

  const mime: string = detectedType.mime;
  const ext: string = detectedType.ext;
  let text = "";

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
    const ocr = await Tesseract.recognize(buffer, "eng");
    text = ocr.data.text;
  } else {
    throw new Error(`Unsupported file type: ${mime}`);
  }

  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const summary = lines.slice(0, 3);
  const keywords = extractKeywords(text);
  const highlights = extractHighlights(text, 3);

  return {
    total_chunks: 1,
    file_type: ext,
    analysis: [
      {
        chunk_number: 1,
        keywords,
        highlights,
        summary,
      },
    ],
  };
}

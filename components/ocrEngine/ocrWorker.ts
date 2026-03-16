// components/ocrEngine/ocrWorker.ts

import Tesseract from "tesseract.js";

export type OCRProgress = {
  status: string;
  progress?: number;
};

/**
 * Run OCR on a single image using Tesseract.js
 */
export async function ocrRecognizeImage(
  file: Blob | string,
  lang: string,
  onProgress?: (p: OCRProgress) => void
): Promise<string> {
  try {
    const result = await Tesseract.recognize(file, lang, {
      logger: (m) => {
        // Send progress updates to caller
        if (onProgress) onProgress(m);
      },
    });

    return result.data?.text ?? "";
  } catch (err) {
    console.error("OCR ERROR:", err);
    return "";
  }
}

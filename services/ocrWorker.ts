// modules/aksharatantra/services/ocrWorker.ts
import Tesseract from 'tesseract.js';

export type OCRProgress = { status: string; progress?: number };

export async function ocrRecognizeImage(fileBlob: Blob | string, lang = 'tel', onProgress?: (p: OCRProgress) => void) {
  // fileBlob can be object URL or Blob
  const workerOptions = {
    // If you host tessdata in /public/tessdata, provide langPath
    // langPath: '/tessdata',
  };

  const result = await Tesseract.recognize(fileBlob, lang, {
    logger: (m) => {
      if (onProgress) onProgress({ status: m.status, progress: m.progress });
    }
  });
  return (result?.data?.text || '').toString();
}

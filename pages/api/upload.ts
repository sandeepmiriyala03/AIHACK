import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { processFile } from "../../lib/processFile";

// Minimal Multer File interface with buffer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Extend NextApiRequest to include multer's file property
interface MulterRequest extends NextApiRequest {
  file: MulterFile;
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

function runMiddleware(
  req: unknown,
  res: unknown,
  fn: (req: unknown, res: unknown, next: (err?: unknown) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result?: unknown) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    return;
  }

  try {
    await runMiddleware(
      req as unknown,
      res as unknown,
      upload.single("file") as unknown as (
        req: unknown,
        res: unknown,
        next: (err?: unknown) => void
      ) => void
    );

    const mreq = req as MulterRequest;

    if (!mreq.file || !mreq.file.buffer) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Write buffer to temp file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(
      tempDir,
      `${Date.now()}-${mreq.file.originalname}`
    );

    try {
      await fs.writeFile(tempFilePath, mreq.file.buffer);

      // Call your existing processFile function with the file path
      const result = await processFile(tempFilePath);

      res.status(200).json(result);
    } finally {
      // Cleanup: delete temp file regardless of success/error
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // ignore cleanup errors
      }
    }
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) message = err.message;
    res.status(500).json({ error: `Upload error: ${message}` });
  }
}

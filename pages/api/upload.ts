import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { processFile } from "../../lib/processFile";

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

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
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve();
      }
    });
  });
}

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`Received ${req.method} request to ${req.url}`);

  if (req.method !== "POST") {
    console.warn(`Method not allowed: ${req.method}`);
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
      console.warn("No file or empty buffer in upload");
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    console.log(`Uploading file: ${mreq.file.originalname} (${mreq.file.size} bytes)`);

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${Date.now()}-${mreq.file.originalname}`);

    try {
      await fs.writeFile(tempFilePath, mreq.file.buffer);
      console.log(`Written file to temp path: ${tempFilePath}`);

      const result = await processFile(tempFilePath);
      console.log("File processed successfully");

      res.status(200).json(result);
    } finally {
      try {
        await fs.unlink(tempFilePath);
        console.log(`Deleted temp file: ${tempFilePath}`);
      } catch (unlinkErr) {
        console.error("Error deleting temp file:", unlinkErr);
      }
    }
  } catch (err) {
    console.error("Upload error:", err);
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    res.status(500).json({ error: `Upload error: ${message}` });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import fs from "fs";
import os from "os";
import { processFile } from "../../lib/processFile";

// Minimal Multer File interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Extend NextApiRequest to include multer's file property
interface MulterRequest extends NextApiRequest {
  file: MulterFile;
}

const upload = multer({ dest: os.tmpdir() });

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
    // Use unknown and cast, to satisfy eslint and TypeScript
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

    if (!mreq.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filePath = mreq.file.path;

    try {
      const result = await processFile(filePath);

      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore errors
      }

      res.status(200).json(result);
    } catch (error) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore errors
        }
      }
      let message = "Unknown error";
      if (error instanceof Error) message = error.message;
      res.status(500).json({ error: message });
    }
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) message = err.message;
    res.status(500).json({ error: `Upload error: ${message}` });
  }
}

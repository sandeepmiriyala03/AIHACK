// lib/sandboxFiles.ts (server only: uses Buffer)
// Reads screenshots and the PDF back from the agent-browser sandbox, and only accepts
// a result that really is the expected file type, so an empty or broken file is never sent.

import { sniffBase64, type FileKind } from "./siteTest";

/** Turns whatever a sandbox file read returns into bytes; undefined if it is text or unknown. */
export async function toBytes(value: unknown, maxBytes: number): Promise<Buffer | undefined> {
  if (!value) return undefined;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
  const withArrayBuffer = value as { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof withArrayBuffer.arrayBuffer === "function") return Buffer.from(new Uint8Array(await withArrayBuffer.arrayBuffer()));
  if (typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function") {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of value as AsyncIterable<unknown>) {
      if (typeof chunk === "string") return undefined; // decoded as text: binary is already corrupted
      const buf = Buffer.isBuffer(chunk) ? chunk : chunk instanceof Uint8Array ? Buffer.from(chunk) : undefined;
      if (!buf) return undefined;
      size += buf.length;
      if (size > maxBytes) return undefined;
      chunks.push(buf);
    }
    return Buffer.concat(chunks);
  }
  return undefined;
}

/**
 * Reads a binary file (screenshot or PDF) from the sandbox as base64.
 * Tries the sandbox's readFile first, then `base64` inside the sandbox, and only accepts
 * the result if it really is the expected file type, so an empty or broken file is never sent.
 */
export async function readSandboxFile(
  sandbox: unknown,
  path: string,
  maxBytes: number,
  expect: FileKind,
): Promise<{ b64?: string; kind?: FileKind; note: string }> {
  const sb = sandbox as unknown as {
    readFile?: (o: { path: string }) => Promise<unknown>;
    runCommand?: (cmd: string, args?: string[]) => Promise<{ exitCode?: number; stdout?: (() => Promise<string>) | string }>;
  };
  const accept = (b64: string | undefined) => {
    if (!b64) return undefined;
    const kind = sniffBase64(b64);
    return kind === expect || (expect === "jpeg" && kind === "png") ? kind : undefined;
  };

  if (typeof sb.readFile === "function") {
    try {
      const bytes = await toBytes(await sb.readFile.call(sandbox, { path }), maxBytes);
      const b64 = bytes?.toString("base64");
      const kind = accept(b64);
      if (kind) return { b64, kind, note: `read ${bytes!.length} bytes` };
    } catch {
      /* try the next way */
    }
  }
  if (typeof sb.runCommand === "function") {
    try {
      const res = await sb.runCommand.call(sandbox, "base64", ["-w", "0", path]);
      const out = typeof res.stdout === "function" ? await res.stdout() : (res.stdout ?? "");
      const b64 = out.trim();
      if (b64.length * 0.75 > maxBytes) return { note: "file too large to send back" };
      const kind = accept(b64);
      if (kind) return { b64, kind, note: `read ${Math.round(b64.length * 0.75)} bytes via base64` };
    } catch {
      /* fall through */
    }
  }
  return { note: "could not read a valid file back from the sandbox" };
}
// lib/sandboxFiles.test.ts — run with: npx vitest run lib
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { readSandboxFile } from "./sandboxFiles";
import { evaluateAll, sniffBase64, type RunContext, type StepResult } from "./siteTest";

/* A small but real-looking PDF: header, body padding (fonts make real ones big), end marker. */
const pdfBytes = Buffer.from(`%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n${"x".repeat(6000)}\ntrailer << >>\n%%EOF\n`, "latin1");
const blankPdfBytes = Buffer.from("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n", "latin1"); // tiny: empty page
const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(500).fill(7)]);
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(500).fill(7)]);

describe("sniffBase64", () => {
  it("recognises a real PDF, JPEG and PNG", () => {
    expect(sniffBase64(pdfBytes.toString("base64"))).toBe("pdf");
    expect(sniffBase64(jpegBytes.toString("base64"))).toBe("jpeg");
    expect(sniffBase64(pngBytes.toString("base64"))).toBe("png");
  });

  it("rejects an empty (tiny) PDF, a PDF without an end marker, text and nothing", () => {
    expect(sniffBase64(blankPdfBytes.toString("base64"))).toBe("unknown");
    expect(sniffBase64(Buffer.from(`%PDF-1.7\n${"x".repeat(6000)}`).toString("base64"))).toBe("unknown");
    expect(sniffBase64(Buffer.from("hello world").toString("base64"))).toBe("unknown");
    expect(sniffBase64(undefined)).toBe("unknown");
  });
});

describe("readSandboxFile", () => {
  const path = "/tmp/st-page.pdf";

  it("reads a Buffer from readFile", async () => {
    const r = await readSandboxFile({ readFile: async () => pdfBytes }, path, 1e6, "pdf");
    expect(r.kind).toBe("pdf");
    expect(Buffer.from(r.b64!, "base64").equals(pdfBytes)).toBe(true);
  });

  it("reads a Node stream from readFile", async () => {
    const r = await readSandboxFile({ readFile: async () => Readable.from([pdfBytes.subarray(0, 100), pdfBytes.subarray(100)]) }, path, 1e6, "pdf");
    expect(r.kind).toBe("pdf");
  });

  it("reads a web ReadableStream from readFile", async () => {
    const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(pdfBytes)); c.close(); } });
    const r = await readSandboxFile({ readFile: async () => stream }, path, 1e6, "pdf");
    expect(r.kind).toBe("pdf");
  });

  it("falls back to base64 in the sandbox when readFile returns text (corrupted binary)", async () => {
    const sandbox = {
      readFile: async () => Readable.from([pdfBytes.toString("utf8")]), // decoded as text: unusable
      runCommand: async (cmd: string, args: string[]) => {
        expect(cmd).toBe("base64");
        expect(args).toEqual(["-w", "0", path]);
        return { exitCode: 0, stdout: async () => pdfBytes.toString("base64") + "\n" };
      },
    };
    const r = await readSandboxFile(sandbox, path, 1e6, "pdf");
    expect(r.kind).toBe("pdf");
    expect(r.note).toContain("via base64");
  });

  it("works when only runCommand exists, with stdout as a string", async () => {
    const r = await readSandboxFile({ runCommand: async () => ({ stdout: jpegBytes.toString("base64") }) }, "/tmp/a.jpg", 1e6, "jpeg");
    expect(r.kind).toBe("jpeg");
  });

  it("accepts a PNG when a JPEG screenshot was asked for", async () => {
    const r = await readSandboxFile({ readFile: async () => pngBytes }, "/tmp/a.jpg", 1e6, "jpeg");
    expect(r.kind).toBe("png");
  });

  it("never returns an empty PDF", async () => {
    const r = await readSandboxFile({ readFile: async () => blankPdfBytes, runCommand: async () => ({ stdout: blankPdfBytes.toString("base64") }) }, path, 1e6, "pdf");
    expect(r.b64).toBeUndefined();
    expect(r.note).toContain("could not read a valid file");
  });

  it("refuses files over the size limit", async () => {
    const r = await readSandboxFile({ readFile: async () => Readable.from([pdfBytes]) }, path, 100, "pdf");
    expect(r.b64).toBeUndefined();
  });

  it("returns nothing (not a crash) when the sandbox has neither method or they throw", async () => {
    expect((await readSandboxFile({}, path, 1e6, "pdf")).b64).toBeUndefined();
    const throwing = { readFile: async () => { throw new Error("no such file"); }, runCommand: async () => { throw new Error("no base64"); } };
    expect((await readSandboxFile(throwing, path, 1e6, "pdf")).b64).toBeUndefined();
  });
});

describe("VR-08 result", () => {
  const ctx: RunContext = { url: "https://example.com/", finalUrl: "https://example.com/", isHttps: true, httpTried: false, disabledCount: 0, hasCheckbox: false, hasCombobox: false, hasSearchbox: false };
  const ok = (data: unknown = {}): StepResult => ({ ok: true, ms: 1, data });
  const vr08 = (raw: Record<string, StepResult>) => evaluateAll(raw, ctx).find((r) => r.id === "VR-08")!;

  it("passes when the PDF was created and read back", () => {
    expect(vr08({ pdf: ok(), pdfRead: ok("read 9000 bytes") }).status).toBe("pass");
  });

  it("warns, with the reason, when the PDF could not be read back", () => {
    const r = vr08({ pdf: ok(), pdfRead: { ok: false, ms: 1, error: "could not read a valid file back from the sandbox" } });
    expect(r.status).toBe("warn");
    expect(r.detail).toContain("no download");
  });

  it("fails when the PDF command failed", () => {
    expect(vr08({ pdf: { ok: false, ms: 1, error: "print failed" } }).status).toBe("fail");
  });
});
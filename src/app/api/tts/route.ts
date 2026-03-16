import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/tts?text=...&lang=...
 *
 * Server-side proxy to Google Translate TTS.
 * Bypasses CORS — the browser never touches translate.googleapis.com directly.
 * Returns raw MP3 audio bytes with Content-Type: audio/mpeg.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang");

  if (!text || !lang) {
    return NextResponse.json(
      { error: "Missing required query params: text, lang" },
      { status: 400 }
    );
  }

  // Google Translate TTS — same endpoint the browser-side code was trying to hit
  // Splitting long text into ≤200-char chunks to stay within Google's limit
  const chunks = splitText(text.trim(), 200);

  try {
    const audioBuffers = await Promise.all(
      chunks.map((chunk) => fetchGoogleTTS(chunk, lang))
    );

    // Concatenate all MP3 chunks into one buffer
    const total = audioBuffers.reduce((s, b) => s + b.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const buf of audioBuffers) {
      merged.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    return new NextResponse(merged, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(merged.byteLength),
        // Don't cache — text/lang combos are dynamic
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[/api/tts] fetch failed:", err?.message);
    return NextResponse.json(
      { error: "TTS fetch failed", detail: err?.message ?? "unknown" },
      { status: 502 }
    );
  }
}

/* ── helpers ─────────────────────────────────────────────────── */

async function fetchGoogleTTS(text: string, lang: string): Promise<ArrayBuffer> {
  // Google Translate TTS endpoint (same one used by browser gtts libraries)
  const url =
    `https://translate.googleapis.com/translate_tts` +
    `?client=gtx` +
    `&tl=${encodeURIComponent(lang)}` +
    `&q=${encodeURIComponent(text)}` +
    `&ie=UTF-8`;

  const res = await fetch(url, {
    headers: {
      // Must send a browser-like UA, otherwise Google returns 403
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
      Referer: "https://translate.google.com/",
    },
  });

  if (!res.ok) {
    throw new Error(`Google TTS returned HTTP ${res.status} for lang="${lang}"`);
  }

  return res.arrayBuffer();
}

/**
 * Split text on word boundaries into chunks of ≤ maxLen chars.
 * Google TTS silently truncates queries longer than ~200 chars.
 */
function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    // Try to break at a sentence boundary first
    let cut = remaining.lastIndexOf(".", maxLen);
    if (cut < maxLen * 0.5) cut = remaining.lastIndexOf(" ", maxLen);
    if (cut <= 0) cut = maxLen; // hard cut if no boundary found

    chunks.push(remaining.slice(0, cut + 1).trim());
    remaining = remaining.slice(cut + 1).trim();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}
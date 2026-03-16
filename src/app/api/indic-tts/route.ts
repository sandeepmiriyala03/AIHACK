import { NextRequest, NextResponse } from "next/server"

// ---------------------------------------------------------------------------
// Indic TTS — NO API KEY REQUIRED
// Uses Google Translate TTS under the hood (same as /api/tts proxy).
// Returns a JSON shape that matches what the client's indicTTS() already
// expects:
//   { pipelineResponse: [{ audio: [{ audioContent: "<base64 mp3>" }] }] }
// ---------------------------------------------------------------------------

// Google Translate TTS supports all Indic language codes used in the app:
//   hi, bn, ta, te, mr, gu, kn, ml, pa, or, as, ne, ur, sa, si …
// Text is capped at 200 chars per request (Google's limit for this endpoint).
// For longer text the client should chunk — or we split below.

const GTTS_BASE = "https://translate.google.com/translate_tts"

async function fetchGoogleTTS(text: string, lang: string): Promise<ArrayBuffer> {
  const url =
    `${GTTS_BASE}` +
    `?ie=UTF-8` +
    `&tl=${encodeURIComponent(lang)}` +
    `&q=${encodeURIComponent(text)}` +
    `&client=tw-ob`

  const res = await fetch(url, {
    headers: {
      // Without a real User-Agent Google returns 403
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
      "Referer": "https://translate.google.com/",
    },
  })

  if (!res.ok) {
    throw new Error(`Google TTS responded with ${res.status} ${res.statusText}`)
  }

  return res.arrayBuffer()
}

// Split text into chunks ≤ 200 chars at sentence/word boundaries
function splitText(text: string, maxLen = 200): string[] {
  if (text.length <= maxLen) return [text]

  const chunks: string[] = []
  let remaining = text.trim()

  while (remaining.length > maxLen) {
    // Try to break at last sentence-ending punctuation within limit
    let cut = remaining.lastIndexOf("।", maxLen)   // Devanagari danda
    if (cut < 10) cut = remaining.lastIndexOf(".", maxLen)
    if (cut < 10) cut = remaining.lastIndexOf("!", maxLen)
    if (cut < 10) cut = remaining.lastIndexOf("?", maxLen)
    if (cut < 10) cut = remaining.lastIndexOf(" ", maxLen)
    if (cut < 10) cut = maxLen                     // hard cut

    chunks.push(remaining.slice(0, cut + 1).trim())
    remaining = remaining.slice(cut + 1).trim()
  }

  if (remaining) chunks.push(remaining)
  return chunks
}

// Concatenate multiple ArrayBuffers (for multi-chunk audio)
function concatBuffers(bufs: ArrayBuffer[]): ArrayBuffer {
  if (bufs.length === 1) return bufs[0]
  const total = bufs.reduce((n, b) => n + b.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const b of bufs) {
    out.set(new Uint8Array(b), offset)
    offset += b.byteLength
  }
  return out.buffer
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const text  = searchParams.get("text")
  const lang  = searchParams.get("lang")
  // `voice` param is accepted but ignored — Google TTS picks the voice automatically
  // (kept so the client call signature doesn't need changing)

  // ── Validate ────────────────────────────────────────────────────────────
  if (!text?.trim()) {
    return NextResponse.json({ error: "Missing param: text" }, { status: 400 })
  }
  if (!lang) {
    return NextResponse.json({ error: "Missing param: lang" }, { status: 400 })
  }

  // ── Fetch audio (chunked if needed) ─────────────────────────────────────
  const chunks = splitText(text.trim())
  const buffers: ArrayBuffer[] = []

  try {
    for (const chunk of chunks) {
      const buf = await fetchGoogleTTS(chunk, lang)
      buffers.push(buf)
    }
  } catch (err: any) {
    console.error("[indic-tts] fetchGoogleTTS error:", err)
    return NextResponse.json(
      { error: "Failed to fetch TTS audio", detail: err?.message ?? String(err) },
      { status: 502 }
    )
  }

  // ── Encode to base64 ─────────────────────────────────────────────────────
  const combined = concatBuffers(buffers)
  const base64   = Buffer.from(combined).toString("base64")

  // ── Return in the shape indicTTS() on the client already parses ──────────
  return NextResponse.json({
    pipelineResponse: [
      {
        audio: [
          {
            audioContent: base64,   // base64 MP3
          },
        ],
      },
    ],
  })
}
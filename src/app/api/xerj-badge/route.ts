// ─────────────────────────────────────────────────────────────────────────────
// /api/xerj-badge — the XERJ Corpus Hub contributor badge, served from this site
//
// Why: next.config.js sends "Cross-Origin-Embedder-Policy: require-corp" on every
// page (the in-browser OCR and voice models need it). With that header the
// browser blocks images from other sites unless they allow it, so
// <img src="https://hub.xerj.org/…/badge.svg"> never shows. Serving the same
// badge from our own origin is allowed, and the COEP header stays as it is.
//
// Safe to serve: the SVG is only fetched from one fixed XERJ URL, and the
// response carries a strict CSP so no script inside an SVG could ever run here.
// If XERJ cannot be reached, a small local badge is returned instead.
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_URL = "https://hub.xerj.org/contributors/sandeepmiriyala03/badge.svg"

const HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
}

// Shown only when hub.xerj.org cannot be reached
const FALLBACK = `<svg xmlns="http://www.w3.org/2000/svg" width="216" height="28" role="img" aria-label="XERJ Corpus Hub contributor">
<rect width="216" height="28" rx="6" fill="#0b1220"/><rect x="0" width="62" height="28" rx="6" fill="#047857"/><rect x="56" width="6" height="28" fill="#047857"/>
<text x="31" y="18.5" fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="12" font-weight="700" text-anchor="middle">XERJ</text>
<text x="139" y="18.5" fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11.5" text-anchor="middle">Corpus Hub contributor</text></svg>`

export async function GET() {
  try {
    const res = await fetch(BADGE_URL, { next: { revalidate: 86400 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const svg = await res.text()
    if (!svg.trimStart().startsWith("<svg") && !svg.includes("<svg")) throw new Error("not an SVG")
    return new Response(svg, {
      headers: { ...HEADERS, "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
    })
  } catch (error) {
    console.error("[api/xerj-badge] could not load", BADGE_URL, "-", error instanceof Error ? error.message : error)
    return new Response(FALLBACK, {
      headers: { ...HEADERS, "Cache-Control": "public, max-age=300" },
    })
  }
}

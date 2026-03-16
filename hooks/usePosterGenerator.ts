// =====================================================
// AksharaChitra — usePosterGenerator v3 (Scale-Based Export)
// =====================================================
// Key improvement: we no longer force card.width = 1200px (which broke fonts).
// Instead we compute scale = exportWidth / previewWidth and pass it to
// html2canvas. Everything — fonts, images, borders — scales proportionally.
// The result is pixel-perfect at the chosen social media format resolution.

import { useCallback, useRef, useState } from "react";
import { getFormattedTimestamp, downloadDataUrl } from "../lib/imageUtils";
import { POSTER_FORMATS, type FormatKey } from "../components/PosterPreview";

interface UsePosterGeneratorOptions {
  previewRef: React.RefObject<HTMLDivElement>;
  title: string;
  format?: FormatKey;
}

export function usePosterGenerator({
  previewRef,
  title,
  format = "instagram-square",
}: UsePosterGeneratorOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const h2cRef = useRef<any>(null);

  const ensureH2C = async () => {
    if (h2cRef.current) return h2cRef.current;
    const mod = await import("html2canvas");
    h2cRef.current = mod.default;
    return mod.default;
  };

  const generatePoster = useCallback(
    async ({ download = false }: { download?: boolean } = {}): Promise<string | null> => {
      if (!title.trim() || typeof window === "undefined") return null;

      // ── Find the poster card ──────────────────────────────────────────
      const wrapper = previewRef.current;
      if (!wrapper) { console.error("[AksharaChitra] previewRef not mounted"); return null; }

      const card = (wrapper.querySelector("[data-poster-root]") as HTMLDivElement) ?? wrapper;
      if (!card) { console.error("[AksharaChitra] data-poster-root not found"); return null; }

      setIsGenerating(true);

      try {
        const h2c = await ensureH2C();

        // ── Read export dimensions from data attributes ────────────────
        // PosterPreview stamps these on the card element
        const fmt     = POSTER_FORMATS[format] ?? POSTER_FORMATS["instagram-square"];
        const exportW = parseInt(card.getAttribute("data-export-w") || String(fmt.w), 10);
        const exportH = parseInt(card.getAttribute("data-export-h") || String(fmt.h), 10);
        const previewW = card.offsetWidth;

        if (previewW === 0) { console.error("[AksharaChitra] card has zero width"); return null; }

        // ── Compute scale: every CSS pixel in preview → exportW/previewW export pixels
        const exportScale = exportW / previewW;

        // ── Wait for fonts, images & QR to be fully painted ──────────────
        await document.fonts.ready;
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => setTimeout(r, 250));

        // ── Capture ───────────────────────────────────────────────────
        const base = await h2c(card, {
          scale:    exportScale,
          width:    previewW,
          height:   card.offsetHeight,
          useCORS:  true,
          allowTaint: true,
          backgroundColor: null,      // respect poster's own background
          imageTimeout: 15000,
          logging:  false,
          foreignObjectRendering: false,
          onclone: (_doc: Document, el: HTMLElement) => {
            // Ensure images in the clone don't get blocked by CORS
            el.querySelectorAll("img").forEach((img: HTMLImageElement) => {
              img.crossOrigin = "anonymous";
            });
          },
        });

        // ── Branded footer bar (proportional to export size) ───────────
        const FOOTER_H   = 40;             // px in the export canvas
        const finalW     = base.width;     // = exportW (since scale * previewW = exportW)
        const finalH     = base.height + FOOTER_H;

        const out  = document.createElement("canvas");
        out.width  = finalW;
        out.height = finalH;

        const ctx = out.getContext("2d")!;

        // Draw poster
        ctx.drawImage(base, 0, 0);

        // Footer background
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, base.height, finalW, FOOTER_H);

        // Footer text — size relative to export canvas
        const fs = Math.max(11, Math.round(finalW * 0.012));
        ctx.font = `600 ${fs}px Montserrat, Arial, sans-serif`;
        ctx.textBaseline = "middle";
        const midY = base.height + FOOTER_H / 2;

        const ts = getFormattedTimestamp();
        ctx.fillStyle = "#aaaaaa";
        ctx.textAlign = "left";
        ctx.fillText(ts, Math.round(finalW * 0.016), midY);

        ctx.fillStyle = "#4A90E2";
        ctx.textAlign = "right";
        ctx.fillText("✦ AksharaChitra", finalW - Math.round(finalW * 0.016), midY);

        const dataUrl = out.toDataURL("image/png");

        if (download) {
          const safe  = (title || "poster").replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_");
          const fname = `${safe}_${format}_${ts.replace(/[/:,\s]/g, "_")}.png`;
          downloadDataUrl(dataUrl, fname);
        }

        return dataUrl;
      } catch (err) {
        console.error("[AksharaChitra] Poster generation failed:", err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [previewRef, title, format]
  );

  return { generatePoster, isGenerating };
}
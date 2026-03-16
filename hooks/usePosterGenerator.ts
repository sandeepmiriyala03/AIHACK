// =====================================================
// AksharaChitra — usePosterGenerator Hook (FIXED v2)
// =====================================================

import { useCallback, useRef, useState } from "react";
import { getFormattedTimestamp, downloadDataUrl } from "../lib/imageUtils";

interface UsePosterGeneratorOptions {
  previewRef: React.RefObject<HTMLDivElement>;
  title: string;
}

export function usePosterGenerator({
  previewRef,
  title,
}: UsePosterGeneratorOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const html2canvasRef = useRef<any>(null);

  const ensureHtml2Canvas = async () => {
    if (html2canvasRef.current) return html2canvasRef.current;
    const mod = await import("html2canvas");
    html2canvasRef.current = mod.default;
    return mod.default;
  };

  const generatePoster = useCallback(
    async ({ download = false }: { download?: boolean } = {}): Promise<string | null> => {
      const wrapper = previewRef.current;
      if (!wrapper) { console.error("Preview element not found"); return null; }

      // The actual poster is the first child inside the wrapper div
      // (wrapper has overflow:hidden which would clip canvas — we need the inner div)
      const card = (wrapper.querySelector("[data-poster-root]") as HTMLDivElement) ?? wrapper;
      if (!card) { console.error("Poster root not found"); return null; }
      if (!title.trim()) return null;
      if (typeof window === "undefined") return null;

      setIsGenerating(true);

      try {
        const html2canvas = await ensureHtml2Canvas();

        // ── Snapshot current dimensions ──────────────
        const origWidth = card.style.width;
        const origHeight = card.style.height;
        const origMinHeight = card.style.minHeight;
        const origOverflow = card.style.overflow;
        const origPosition = card.style.position;

        // ── Set fixed export dimensions (A4-ish portrait or 16:9 landscape) ──
        const EXPORT_WIDTH = 1200;
        card.style.width = `${EXPORT_WIDTH}px`;
        card.style.height = "auto";
        card.style.minHeight = "0px";
        card.style.overflow = "visible";
        card.style.position = "relative";

        // Allow layout to reflow
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => setTimeout(r, 350));

        const scale = 2; // High DPI but predictable

        const baseCanvas = await html2canvas(card, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null, // respect poster bg
          imageTimeout: 15000,
          logging: false,
          foreignObjectRendering: false, // more reliable across browsers
          onclone: (clonedDoc: Document) => {
            // Ensure cloned images have crossOrigin set
            const imgs = clonedDoc.querySelectorAll("img");
            imgs.forEach((img: HTMLImageElement) => {
              img.crossOrigin = "anonymous";
            });
          },
        });

        // ── Restore styles immediately ────────────────
        card.style.width = origWidth;
        card.style.height = origHeight;
        card.style.minHeight = origMinHeight;
        card.style.overflow = origOverflow;
        card.style.position = origPosition;

        // ── Add branded footer bar ────────────────────
        const footerH = 44;
        const final = document.createElement("canvas");
        final.width = baseCanvas.width;
        final.height = baseCanvas.height + footerH * scale;

        const ctx = final.getContext("2d")!;
        ctx.drawImage(baseCanvas, 0, 0);

        // Footer background
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, baseCanvas.height, final.width, footerH * scale);

        const fontSize = Math.round(11 * scale);
        ctx.font = `600 ${fontSize}px Montserrat, Arial, sans-serif`;
        ctx.textBaseline = "middle";

        const ts = getFormattedTimestamp();
        const footerMidY = baseCanvas.height + (footerH * scale) / 2;

        ctx.fillStyle = "#cccccc";
        ctx.textAlign = "left";
        ctx.fillText(ts, 20 * scale, footerMidY);

        ctx.fillStyle = "#4A90E2";
        ctx.textAlign = "right";
        ctx.fillText("AksharaChitra", final.width - 20 * scale, footerMidY);

        const dataUrl = final.toDataURL("image/png");

        if (download) {
          const safe = (title || "AksharaChitra").replace(/[^\w\- ]/g, "").trim();
          const fname = `${safe}_${ts.replace(/[/:, ]/g, "_")}.png`;
          downloadDataUrl(dataUrl, fname);
        }

        return dataUrl;
      } catch (err) {
        console.error("Poster generation failed:", err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [previewRef, title]
  );

  return { generatePoster, isGenerating };
}
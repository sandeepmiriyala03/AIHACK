"use client";
// PosterPreview — per-section font resolution
// titleFont / subtitleFont / messageFont each override posterFont

import { forwardRef, useEffect, useRef, useCallback } from "react";
import type { PosterState } from "../types";

// ── Format registry (exported for page.tsx and usePosterGenerator) ────────────
export const POSTER_FORMATS = {
  "instagram-square":   { label: "Instagram Square",   icon: "⬛", w: 1080, h: 1080 },
  "instagram-portrait": { label: "IG Portrait",        icon: "📱", w: 1080, h: 1350 },
  "instagram-story":    { label: "Story / Reel",       icon: "🎬", w: 1080, h: 1920 },
  "twitter-x":          { label: "Twitter / X",        icon: "🐦", w: 1200, h: 675  },
  "facebook-post":      { label: "Facebook Post",      icon: "📘", w: 1200, h: 630  },
  "linkedin-post":      { label: "LinkedIn Post",      icon: "💼", w: 1200, h: 627  },
  "whatsapp-status":    { label: "WhatsApp Status",    icon: "💬", w: 1080, h: 1920 },
  "a4-portrait":        { label: "A4 Portrait",        icon: "📄", w: 794,  h: 1123 },
} as const;
export type FormatKey = keyof typeof POSTER_FORMATS;

interface Props { state: PosterState }

export const PosterPreview = forwardRef<HTMLDivElement, Props>(({ state }, ref) => {
  const qrRef      = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scale      = useRef(0.37);

  const formatKey   = ((state as any).posterFormat as FormatKey) ?? "instagram-square";
  const fmt         = POSTER_FORMATS[formatKey] ?? POSTER_FORMATS["instagram-square"];
  const isLandscape = fmt.w / fmt.h > 1.1;

  // ── Per-section font priority: sectionFont > posterFont > fontFamily > default ──
  const globalFont   = state.posterFont || state.fontFamily || "Montserrat, sans-serif";
  const titleFont    = ((state as any).titleFont    as string) || globalFont;
  const subtitleFont = ((state as any).subtitleFont as string) || globalFont;
  const messageFont  = ((state as any).messageFont  as string) || globalFont;

  // ── Responsive scale ──────────────────────────────────────────────────────
  const updateScale = useCallback(() => {
    if (wrapperRef.current) scale.current = wrapperRef.current.offsetWidth / fmt.w;
  }, [fmt.w]);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  const s = (n: number) => Math.max(1, Math.round(n * scale.current));

  const {
    title, subtitle, message,
    titleSize, subtitleSize, messageSize,
    titleAlign, subtitleAlign, contentAlign,
    titleColor, subtitleColor, messageColor,
    titleBg, subtitleBg, messageBg,
    imagePosition, posterBgColor,
    qrText, qrAlign,
    uploadedMainData, uploadedLogoData,
  } = state;

  // ── Style builder ─────────────────────────────────────────────────────────
  const tx = (
    bg: string, color: string, size: number,
    align: string, weight: number, ff: string
  ): React.CSSProperties => {
    const hasBg = bg && bg.toUpperCase() !== "#FFFFFF" && bg !== "transparent";
    return {
      fontFamily: ff,
      fontSize: s(size),
      textAlign: align as React.CSSProperties["textAlign"],
      color, fontWeight: weight,
      wordBreak: "break-word", lineHeight: 1.3, flexShrink: 0,
      background: hasBg ? bg : "transparent",
      ...(hasBg ? { padding: `${s(4)}px ${s(10)}px`, borderRadius: s(6) } : {}),
    };
  };

  // ── QR ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = qrRef.current;
    if (!el) return;
    el.innerHTML = "";
    if (!qrText?.trim() || typeof window === "undefined") return;
    // @ts-ignore
    if (typeof QRCode === "undefined") return;
    const div = document.createElement("div");
    el.appendChild(div);
    try {
      // @ts-ignore
      new QRCode(div, {
        text: qrText,
        width: s(96), height: s(96),
        colorDark: "#000000", colorLight: "#ffffff",
        // @ts-ignore
        correctLevel: QRCode.CorrectLevel.H,
      });
    } catch (_) { /* silent */ }
  }, [qrText, scale.current]); // eslint-disable-line

  const qrJustify  = qrAlign === "left" ? "flex-start" : qrAlign === "right" ? "flex-end" : "center";
  const imgJustify = imagePosition === "left" ? "flex-start" : imagePosition === "right" ? "flex-end" : "center";

  const pad         = s(32);
  const gap         = s(12);
  const br          = s(10);
  const logoH       = s(Math.min(fmt.h * 0.09, 90));
  const mainImgMaxH = s(
    isLandscape ? fmt.h * 0.8
    : fmt.w === fmt.h ? fmt.h * 0.38
    : fmt.h / fmt.w < 1.4 ? fmt.h * 0.4
    : fmt.h * 0.45
  );
  const msgLines = message?.split("\n") ?? [];

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        aspectRatio: `${fmt.w} / ${fmt.h}`,
        position: "relative",
        borderRadius: br,
        overflow: "hidden",
      }}
    >
      <div
        ref={ref}
        data-poster-root="true"
        data-export-w={fmt.w}
        data-export-h={fmt.h}
        style={{
          position: "absolute", inset: 0,
          background: posterBgColor || "#FFFFFF",
          fontFamily: globalFont,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: isLandscape ? "row" : "column",
          padding: pad, gap, overflow: "hidden",
        }}
      >
        {isLandscape ? (
          /* ── Landscape layout ── */
          <>
            <div style={{ display:"flex", flexDirection:"column", flex:"1 1 55%", gap, justifyContent:"center", overflow:"hidden" }}>
              {uploadedLogoData && (
                <div style={{ flexShrink: 0 }}>
                  <img src={uploadedLogoData} alt="logo" style={{ height: logoH, maxWidth: s(fmt.w*0.22), objectFit:"contain", borderRadius: s(4), display:"block" }} />
                </div>
              )}
              {title    && <div style={tx(titleBg,    titleColor,    titleSize,    titleAlign,    700, titleFont)}>{title}</div>}
              {subtitle && <div style={tx(subtitleBg, subtitleColor, subtitleSize, subtitleAlign, 500, subtitleFont)}>{subtitle}</div>}
              {msgLines.length > 0 && (
                <div style={{ ...tx(messageBg, messageColor, messageSize, contentAlign, 400, messageFont), lineHeight:1.6, flex:"1 1 auto", overflow:"hidden" }}>
                  {msgLines.map((l,i) => <span key={i}>{l}{i<msgLines.length-1 && <br/>}</span>)}
                </div>
              )}
              {qrText?.trim() && (
                <div style={{ display:"flex", justifyContent: qrJustify, flexShrink:0, marginTop: s(6) }}>
                  <div ref={qrRef} />
                </div>
              )}
            </div>
            {uploadedMainData && (
              <div style={{ flex:"1 1 42%", overflow:"hidden", borderRadius: br, display:"flex", alignItems:"center" }}>
                <img src={uploadedMainData} alt="main" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius: br, display:"block" }} />
              </div>
            )}
          </>
        ) : (
          /* ── Portrait / Square layout ── */
          <>
            {uploadedLogoData && (
              <div style={{ textAlign: titleAlign as any, flexShrink: 0 }}>
                <img src={uploadedLogoData} alt="logo" style={{ height: logoH, maxWidth: s(fmt.w*0.25), objectFit:"contain", borderRadius: s(6), display:"inline-block" }} />
              </div>
            )}
            {title    && <div style={tx(titleBg,    titleColor,    titleSize,    titleAlign,    700, titleFont)}>{title}</div>}
            {subtitle && <div style={tx(subtitleBg, subtitleColor, subtitleSize, subtitleAlign, 500, subtitleFont)}>{subtitle}</div>}
            {uploadedMainData && (
              <div style={{ flexShrink:0, display:"flex", justifyContent: imgJustify, overflow:"hidden" }}>
                <img src={uploadedMainData} alt="main" style={{ maxWidth:"100%", maxHeight: mainImgMaxH, objectFit:"cover", borderRadius: br, display:"block" }} />
              </div>
            )}
            {msgLines.length > 0 && (
              <div style={{ ...tx(messageBg, messageColor, messageSize, contentAlign, 400, messageFont), lineHeight:1.65, flex:"1 1 auto", overflow:"hidden" }}>
                {msgLines.map((l,i) => <span key={i}>{l}{i<msgLines.length-1 && <br/>}</span>)}
              </div>
            )}
            {qrText?.trim() && (
              <div style={{ display:"flex", justifyContent: qrJustify, flexShrink:0 }}>
                <div ref={qrRef} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

PosterPreview.displayName = "PosterPreview";
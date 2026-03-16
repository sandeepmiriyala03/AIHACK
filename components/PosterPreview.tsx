"use client";
// =====================================================
// AksharaChitra — PosterPreview v3 (Format-Aware)
// =====================================================

import { forwardRef, useEffect, useRef, useState, useCallback } from "react";
import type { PosterState } from "../types";

// ── Social media format registry ──────────────────────────────────────────────
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

interface PosterPreviewProps {
  state: PosterState;
}

export const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ state }, ref) => {
    const qrRef        = useRef<HTMLDivElement>(null);
    const wrapperRef   = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.37);

    // ── Resolve format ─────────────────────────────────────────────────────
    const formatKey  = ((state as any).posterFormat as FormatKey) ?? "instagram-square";
    const fmt        = POSTER_FORMATS[formatKey] ?? POSTER_FORMATS["instagram-square"];
    const isLandscape = fmt.w / fmt.h > 1.1;

    // ── Compute preview scale from container width ────────────────────────
    const updateScale = useCallback(() => {
      if (wrapperRef.current) setScale(wrapperRef.current.offsetWidth / fmt.w);
    }, [fmt.w]);

    useEffect(() => {
      updateScale();
      const ro = new ResizeObserver(updateScale);
      if (wrapperRef.current) ro.observe(wrapperRef.current);
      return () => ro.disconnect();
    }, [updateScale]);

    // ── Destructure state ─────────────────────────────────────────────────
    const {
      title, subtitle, message,
      titleSize, subtitleSize, messageSize,
      titleAlign, subtitleAlign, contentAlign,
      titleColor, subtitleColor, messageColor,
      titleBg, subtitleBg, messageBg,
      posterFont, fontFamily,
      imagePosition, posterBgColor,
      qrText, qrAlign,
      uploadedMainData, uploadedLogoData,
    } = state;

    const font = posterFont || fontFamily || "Montserrat, sans-serif";

    // ── Scale helpers ─────────────────────────────────────────────────────
    // s() converts export-pixel values to preview-pixel values
    const s  = (n: number) => Math.max(1, Math.round(n * scale));
    const sp = (n: number) => `${s(n)}px`;

    const tSize   = s(titleSize);
    const sSize   = s(subtitleSize);
    const mSize   = s(messageSize);
    const logoH   = s(Math.min(fmt.h * 0.09, 90));
    const pad     = s(32);
    const gap     = s(12);
    const br      = s(10);

    // Smart image height: fills available space based on format
    const mainImgMaxH = s(
      isLandscape
        ? fmt.h * 0.8
        : fmt.w === fmt.h               // square
          ? fmt.h * 0.38
          : fmt.h / fmt.w < 1.4         // portrait-ish
            ? fmt.h * 0.4
            : fmt.h * 0.45             // tall story
    );

    // ── Shared text style builder ─────────────────────────────────────────
    const textStyle = (
      bg: string, color: string, size: number,
      align: string, weight: number
    ): React.CSSProperties => {
      const hasBg = bg && bg.toUpperCase() !== "#FFFFFF" && bg !== "transparent";
      return {
        fontFamily: font,
        fontSize: size,
        textAlign: align as React.CSSProperties["textAlign"],
        color,
        background: hasBg ? bg : "transparent",
        fontWeight: weight,
        wordBreak: "break-word",
        lineHeight: 1.3,
        flexShrink: 0,
        ...(hasBg ? {
          padding: `${s(4)}px ${s(10)}px`,
          borderRadius: s(6),
        } : {}),
      };
    };

    const msgLines = message?.split("\n") ?? [];

    // ── QR rendering ──────────────────────────────────────────────────────
    useEffect(() => {
      const el = qrRef.current;
      if (!el) return;
      el.innerHTML = "";
      if (!qrText?.trim()) return;
      if (typeof window === "undefined") return;
      // @ts-ignore
      if (typeof QRCode === "undefined") return;

      const size = s(96);
      const div  = document.createElement("div");
      el.appendChild(div);
      try {
        // @ts-ignore
        new QRCode(div, {
          text: qrText, width: size, height: size,
          colorDark: "#000000", colorLight: "#ffffff",
          // @ts-ignore
          correctLevel: QRCode.CorrectLevel.H,
        });
      } catch (_) { /* silent */ }
    }, [qrText, scale]);

    const qrJustify =
      qrAlign === "left" ? "flex-start" :
      qrAlign === "right" ? "flex-end" : "center";

    // ── Image alignment helper ────────────────────────────────────────────
    const imgJustify =
      imagePosition === "left" ? "flex-start" :
      imagePosition === "right" ? "flex-end" : "center";

    // ─────────────────────────────────────────────────────────────────────
    return (
      /* Outer: enforces correct aspect ratio */
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
        {/* Inner: actual poster content captured by html2canvas */}
        <div
          ref={ref}
          data-poster-root="true"
          data-export-w={fmt.w}
          data-export-h={fmt.h}
          style={{
            position: "absolute",
            inset: 0,
            background: posterBgColor || "#FFFFFF",
            fontFamily: font,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: isLandscape ? "row" : "column",
            padding: pad,
            gap,
            overflow: "hidden",
          }}
        >
          {/* ════════════════════════════════════════════
              LANDSCAPE: left column (text) + right (image)
              ════════════════════════════════════════════ */}
          {isLandscape ? (
            <>
              {/* Left: text content */}
              <div style={{
                display: "flex", flexDirection: "column",
                flex: "1 1 55%", gap, justifyContent: "center", overflow: "hidden",
              }}>
                {uploadedLogoData && (
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src={uploadedLogoData} alt="logo"
                      style={{
                        height: logoH,
                        maxWidth: s(fmt.w * 0.22),
                        objectFit: "contain",
                        borderRadius: s(4),
                        display: "block",
                      }}
                    />
                  </div>
                )}
                {title    && <div style={textStyle(titleBg, titleColor, tSize, titleAlign, 700)}>{title}</div>}
                {subtitle && <div style={textStyle(subtitleBg, subtitleColor, sSize, subtitleAlign, 500)}>{subtitle}</div>}
                {msgLines.length > 0 && (
                  <div style={{ ...textStyle(messageBg, messageColor, mSize, contentAlign, 400), lineHeight: 1.6, flex: "1 1 auto", overflow: "hidden" }}>
                    {msgLines.map((l, i) => <span key={i}>{l}{i < msgLines.length - 1 && <br />}</span>)}
                  </div>
                )}
                {qrText?.trim() && (
                  <div style={{ display: "flex", justifyContent: qrJustify, flexShrink: 0, marginTop: s(6) }}>
                    <div ref={qrRef} />
                  </div>
                )}
              </div>

              {/* Right: main image */}
              {uploadedMainData && (
                <div style={{
                  flex: "1 1 42%", overflow: "hidden",
                  borderRadius: br, display: "flex", alignItems: "center",
                }}>
                  <img
                    src={uploadedMainData} alt="main"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: br, display: "block" }}
                  />
                </div>
              )}
            </>
          ) : (
            /* ════════════════════════════════════════════
               PORTRAIT / SQUARE: top-to-bottom stack
               ════════════════════════════════════════════ */
            <>
              {/* Logo */}
              {uploadedLogoData && (
                <div style={{ textAlign: titleAlign as any, flexShrink: 0 }}>
                  <img
                    src={uploadedLogoData} alt="logo"
                    style={{
                      height: logoH,
                      maxWidth: s(fmt.w * 0.25),
                      objectFit: "contain",
                      borderRadius: s(6),
                      display: "inline-block",
                    }}
                  />
                </div>
              )}

              {/* Title */}
              {title && (
                <div style={textStyle(titleBg, titleColor, tSize, titleAlign, 700)}>
                  {title}
                </div>
              )}

              {/* Subtitle */}
              {subtitle && (
                <div style={textStyle(subtitleBg, subtitleColor, sSize, subtitleAlign, 500)}>
                  {subtitle}
                </div>
              )}

              {/* Main image */}
              {uploadedMainData && (
                <div style={{
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: imgJustify,
                  overflow: "hidden",
                }}>
                  <img
                    src={uploadedMainData} alt="main"
                    style={{
                      maxWidth: "100%",
                      maxHeight: mainImgMaxH,
                      objectFit: "cover",
                      borderRadius: br,
                      display: "block",
                    }}
                  />
                </div>
              )}

              {/* Message */}
              {msgLines.length > 0 && (
                <div style={{
                  ...textStyle(messageBg, messageColor, mSize, contentAlign, 400),
                  lineHeight: 1.65,
                  flex: "1 1 auto",
                  overflow: "hidden",
                }}>
                  {msgLines.map((l, i) => <span key={i}>{l}{i < msgLines.length - 1 && <br />}</span>)}
                </div>
              )}

              {/* QR code */}
              {qrText?.trim() && (
                <div style={{ display: "flex", justifyContent: qrJustify, flexShrink: 0 }}>
                  <div ref={qrRef} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

PosterPreview.displayName = "PosterPreview";
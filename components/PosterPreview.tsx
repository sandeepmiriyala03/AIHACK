"use client";
// =====================================================
// AksharaChitra — PosterPreview Component (FIXED)
// =====================================================

import { forwardRef, useEffect, useRef } from "react";
import type { PosterState } from "../types";

interface PosterPreviewProps {
  state: PosterState;
}

export const PosterPreview = forwardRef<HTMLDivElement, PosterPreviewProps>(
  ({ state }, ref) => {
    const qrContainerRef = useRef<HTMLDivElement>(null);

    const {
      title,
      subtitle,
      message,
      titleSize,
      subtitleSize,
      messageSize,
      titleAlign,
      subtitleAlign,
      contentAlign,
      titleColor,
      subtitleColor,
      messageColor,
      titleBg,
      subtitleBg,
      messageBg,
      posterFont,
      fontFamily,
      imagePosition,
      posterBgColor,
      qrText,
      qrAlign,
      uploadedMainData,
      uploadedLogoData,
    } = state;

    // Use posterFont if set, fall back to fontFamily, then system default
    const resolvedFont = posterFont || fontFamily || "Montserrat, sans-serif";

    // --------------------------------------------------
    // QR Code rendering
    // --------------------------------------------------
    useEffect(() => {
      const container = qrContainerRef.current;
      if (!container) return;
      container.innerHTML = "";
      if (!qrText?.trim()) return;
      if (typeof window === "undefined") return;
      // @ts-ignore
      if (typeof QRCode === "undefined") return;

      const qrSize = 90;
      const wrapper = document.createElement("div");
      wrapper.style.textAlign = qrAlign;
      wrapper.style.marginTop = "12px";
      const qrDiv = document.createElement("div");
      wrapper.appendChild(qrDiv);
      container.appendChild(wrapper);

      // @ts-ignore
      new QRCode(qrDiv, {
        text: qrText,
        width: qrSize,
        height: qrSize,
        colorDark: "#000",
        colorLight: "#fff",
        // @ts-ignore
        correctLevel: QRCode.CorrectLevel.H,
      });
    }, [qrText, qrAlign]);

    // --------------------------------------------------
    // Image alignment
    // --------------------------------------------------
    const imgAlignStyle: React.CSSProperties = {
      maxWidth: "100%",
      display: "block",
      borderRadius: 10,
      objectFit: "cover",
      margin:
        imagePosition === "left"
          ? "8px auto 8px 0"
          : imagePosition === "right"
          ? "8px 0 8px auto"
          : "8px auto",
    };

    const messageLines = message ? message.split("\n") : [];

    return (
      <div
        ref={ref}
        data-poster-root="true"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "14px 16px 36px",
          borderRadius: 12,
          background: posterBgColor || "#FFFFFF",
          minHeight: 220,
          fontFamily: resolvedFont,
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* Logo */}
        {uploadedLogoData && (
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            {/* FIX 2: removed crossOrigin="anonymous" — data URLs don't need it
                and it can cause html2canvas to blank the image */}
            <img
              src={uploadedLogoData}
              alt="logo"
              style={{
                width: 55,
                height: 55,
                borderRadius: 8,
                display: "block",
                margin: "6px auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <div
            style={{
              fontFamily: resolvedFont,
              fontSize: titleSize,
              textAlign: titleAlign,
              color: titleColor,
              background: titleBg !== "#FFFFFF" ? titleBg : "transparent",
              fontWeight: 700,
              margin: "6px 0 4px",
              wordBreak: "break-word",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontFamily: resolvedFont,
              fontSize: subtitleSize,
              textAlign: subtitleAlign,
              color: subtitleColor,
              background: subtitleBg !== "#FFFFFF" ? subtitleBg : "transparent",
              fontWeight: 500,
              margin: "4px 0 10px",
              wordBreak: "break-word",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Main Image */}
        {uploadedMainData && (
          <div style={{ margin: "8px 0" }}>
            {/* FIX 2: removed crossOrigin="anonymous" — causes blank in html2canvas for data URLs */}
            <img
              src={uploadedMainData}
              alt="main"
              style={imgAlignStyle}
            />
          </div>
        )}

        {/* Message */}
        {messageLines.length > 0 && (
          <div
            style={{
              fontFamily: resolvedFont,
              fontSize: messageSize,
              textAlign: contentAlign,
              color: messageColor,
              background: messageBg !== "#FFFFFF" ? messageBg : "transparent",
              marginTop: 10,
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}
          >
            {messageLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < messageLines.length - 1 && <br />}
              </span>
            ))}
          </div>
        )}

        {/* QR Code */}
        <div ref={qrContainerRef} />
      </div>
    );
  }
);

PosterPreview.displayName = "PosterPreview";
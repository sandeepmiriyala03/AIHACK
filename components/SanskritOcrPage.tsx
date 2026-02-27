"use client";

import React, { useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import Image from "next/image";
import html2canvas from "html2canvas";

import { FileUploadComponent } from "./FileUploadComponent";
import FileUploadManager from "@/components/FileUploadManager";
import { ActionsComponent } from "./ActionsComponent";
import { ErrorMessageComponent } from "./ErrorMessageComponent";
import { SanskritOcrExplanation } from "./SanskritOcrExplanation";
import type { LangOption } from "../types/types";

/* ================= CONFIG ================= */

const SANSKRIT_LANG: LangOption = {
  value: "san",
  label: "Sanskrit",
  group: "indic",
};

const MAX_OCR_TIME_MS = 30000;
const MIN_IMAGE_WIDTH = 100;

const DEVANAGARI_FONTS = [
  { label: "Noto Serif Devanagari", value: "'Noto Serif Devanagari', serif" },
  { label: "Noto Sans Devanagari", value: "'Noto Sans Devanagari', sans-serif" },
  { label: "Mangal", value: "'Mangal', serif" },
  { label: "Default Serif", value: "serif" },
];

/* ================= HELPERS ================= */

function resizeImageFile(
  file: File,
  minWidth: number,
  maxWidth: number
): Promise<Blob | File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = Math.max(img.width, minWidth);
      let height = Math.round((img.height * width) / img.width);

      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round((img.height * maxWidth) / img.width);
      }

      if (width === img.width) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context error"));

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
        file.type || "image/png",
        0.8
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/* ================= POSTER ================= */

function posterHTML(
  text: string,
  fontFamily: string,
  fontSize: number,
  lineSpacing: number
) {
  const paras = text
    .split("\n")
    .filter(Boolean)
    .map((p) => `<p style="margin-bottom:12px;">${p}</p>`)
    .join("");

  return `
  <div id="poster" style="
    max-width:820px;
    padding:40px 32px;
    background:#fffdf7;
    border:6px double #6b3e26;
    border-radius:14px;
    font-family:${fontFamily};
    font-size:${fontSize}px;
    line-height:${lineSpacing};
    color:#2b1a12;
  ">
    ${paras}
    <hr style="margin:28px 0;border:1px solid #d2b48c;" />
    <p style="text-align:center;font-size:14px;color:#555;">
      Generated using AksharaTantra • Offline Sanskrit OCR
    </p>
  </div>
  `;
}

/* ================= PAGE ================= */

type ActiveTab = "image" | "document";

export default function SanskritOcrPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");

  const [fontFamily, setFontFamily] = useState(DEVANAGARI_FONTS[0].value);
  const [fontSize, setFontSize] = useState(20);
  const [lineSpacing, setLineSpacing] = useState(1.6);

  const cancelFlag = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    resetTimer();
    timerRef.current = setTimeout(() => {
      cancelFlag.current = true;
      setLoading(false);
      setImageError("OCR timed out after 30 seconds.");
      setProgress("");
    }, MAX_OCR_TIME_MS);
  }, [resetTimer]);

  /* ========== FILE CHANGE ========== */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cancelFlag.current = false;
    setImageError("");
    setProgress("");
    setOcrText("");

    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setFileUrl(URL.createObjectURL(selected));
  };

  /* ========== OCR ========== */
  const onAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setProgress("Preprocessing image...");
    cancelFlag.current = false;
    startTimer();

    try {
      const processed = await resizeImageFile(file, MIN_IMAGE_WIDTH, 1200);
      const url = URL.createObjectURL(processed as Blob);
      setFileUrl(url);

      const { data } = await Tesseract.recognize(url, SANSKRIT_LANG.value, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(`OCR ${Math.round((m.progress ?? 0) * 100)}%`);
          }
        },
      });

      if (!cancelFlag.current) {
        const cleaned = (data.text || "").trim();
        cleaned ? setOcrText(cleaned) : setImageError("No text detected.");
      }

      URL.revokeObjectURL(url);
    } catch {
      if (!cancelFlag.current) setImageError("OCR failed.");
    } finally {
      setLoading(false);
      resetTimer();
    }
  };

  /* ========== CLEAR ========== */
  const onClear = () => {
    cancelFlag.current = true;
    resetTimer();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setOcrText("");
    setImageError("");
    setProgress("");
  };

  /* ========== ACTIONS ========== */
  const copyText = async () => {
    await navigator.clipboard.writeText(ocrText);
    alert("Text copied");
  };

  const downloadAsImage = async () => {
    if (!ocrText.trim()) return;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = posterHTML(
      ocrText,
      fontFamily,
      fontSize,
      lineSpacing
    );
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    document.body.appendChild(wrapper);

    const poster = wrapper.querySelector("#poster") as HTMLElement;
    const canvas = await html2canvas(poster, { scale: 2 });

    document.body.removeChild(wrapper);

    const link = document.createElement("a");
    link.download = "aksharatantra-sanskrit-pamphlet.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: 20, maxWidth: 760, margin: "auto" }}>
      <h1 style={{ textAlign: "center" }}>यथाक्षरं पठनम्</h1>

      <SanskritOcrExplanation />

      <div style={{ display: "inline-flex", marginBottom: 20 }}>
        {(["document", "image"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "10px 20px",
              background: activeTab === t ? "#4f46e5" : "#eee",
              color: activeTab === t ? "#fff" : "#333",
              border: "none",
              fontWeight: "bold",
            }}
          >
            {t === "document" ? "प्रलेखान्वासः" : "अक्षराङ्कनम्"}
          </button>
        ))}
      </div>

      {activeTab === "document" && <FileUploadManager />}

      {activeTab === "image" && (
        <>
          <FileUploadComponent
            file={file}
            onFileChange={onFileChange}
            loading={loading}
          />

          {progress && <p>{progress}</p>}
          {imageError && <ErrorMessageComponent message={imageError} />}

          {fileUrl && (
            <Image
              src={fileUrl}
              alt="Preview"
              width={600}
              height={400}
              style={{ width: "100%", borderRadius: 12 }}
            />
          )}

          <ActionsComponent
            mode={{ value: "manual", label: "Manual" }}
            loading={loading}
            file={file}
            lang={[SANSKRIT_LANG]}
            onAnalyze={onAnalyze}
            onClear={onClear}
            onCancel={onClear}
          />

          {ocrText && (
            <>
              {/* FONT CONTROLS */}
              <div style={{ marginTop: 16 }}>
                <label>Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  {DEVANAGARI_FONTS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <label>Font Size: {fontSize}px</label>
                <input
                  type="range"
                  min={16}
                  max={36}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: "100%" }}
                />

                <label>Line Spacing: {lineSpacing.toFixed(1)}</label>
                <input
                  type="range"
                  min={1.3}
                  max={2.4}
                  step={0.1}
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                style={{
                  width: "100%",
                  height: 260,
                  marginTop: 12,
                  fontFamily,
                  fontSize,
                  lineHeight: lineSpacing,
                }}
              />

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button onClick={copyText}>📋 Copy</button>
                <button onClick={downloadAsImage}>
                  🖼️ Download Pamphlet
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

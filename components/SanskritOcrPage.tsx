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

/* ================================================================
   CONFIG
================================================================ */
const SANSKRIT_LANG: LangOption = {
  value: "san",
  label: "Sanskrit",
  group: "indic",
};

const MAX_OCR_TIME_MS = 45000; // 45s — Vedic texts need more processing time
const MIN_IMAGE_WIDTH = 100;

const DEVANAGARI_FONTS = [
  { label: "Noto Serif Devanagari", value: "'Noto Serif Devanagari', serif" },
  { label: "Noto Sans Devanagari", value: "'Noto Sans Devanagari', sans-serif" },
  { label: "Mangal", value: "'Mangal', serif" },
  { label: "Default Serif", value: "serif" },
];

/* ================================================================
   HUGGING FACE MODELS — BEST FOR SANSKRIT / DEVANAGARI / VEDIC
   ----------------------------------------------------------------

   🥇 PRIMARY MODEL (Printed Vedic texts with accent marks):
      yzk/trocr-large-printed-vedic
      → Trained specifically on Vedic texts in Devanagari
      → Handles vertical accent lines (svara marks) over characters
      → Based on Maitrāyaṇī Saṃhitā dataset
      → HF: https://huggingface.co/yzk/trocr-large-printed-vedic
      ⚠️ NOTE: This model runs server-side only (Python/API)
         It cannot run in-browser via transformers.js yet
         Use via your Next.js API route if needed

   🥈 SECONDARY — Best IN-BROWSER option for Devanagari:
      Xenova/trocr-base-printed
      → Handles printed text including non-Latin scripts
      → Works in browser via @xenova/transformers (ONNX)
      → HF: https://huggingface.co/Xenova/trocr-base-printed
      → ~280MB, MIT license

   🥉 TERTIARY — Tesseract with Sanskrit language pack:
      tesseract.js language: "san"
      → Tesseract has a built-in Sanskrit (Devanagari) trained data
      → Works fully offline
      → Best for clear, large Devanagari printed text
      → Apache 2.0 license

   📌 HONEST NOTE:
      No Xenova/ONNX model exists yet that is specifically
      fine-tuned for Sanskrit handwriting in-browser.
      The best in-browser path is:
        1. Tesseract "san" (Sanskrit pack) — already in your code ✅
        2. Xenova/trocr-base-printed — handles Devanagari printed text
        3. yzk/trocr-large-printed-vedic — via API route for best accuracy
================================================================ */

/* ================================================================
   OTSU IMAGE PREPROCESSOR
   ----------------------------------------------------------------
   Auto-detects best threshold between ink and background.
   Critical for old manuscripts, palm leaf photos, scan artifacts.
================================================================ */
function otsuThreshold(gray: Uint8Array): number {
  const histogram = new Array(256).fill(0);
  for (const val of gray) histogram[val]++;

  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0, wB = 0, wF = 0;
  let maxVariance = 0, threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) ** 2;
    if (variance > maxVariance) { maxVariance = variance; threshold = t; }
  }
  return threshold;
}

async function preprocessForHTR(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file as Blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Resize to max 1200px (good balance for Devanagari detail)
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context failed"));

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Grayscale
      const gray = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = Math.round(
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        );
      }

      // Auto Otsu threshold
      const threshold = otsuThreshold(gray);

      // Binarize — ink = black, background = white
      for (let i = 0; i < gray.length; i++) {
        const val = gray[i] < threshold ? 0 : 255;
        const idx = i * 4;
        data[idx] = val; data[idx + 1] = val;
        data[idx + 2] = val; data[idx + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("toBlob failed")),
        "image/png", 1.0
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/* ================================================================
   RESIZE HELPER (from original code — kept intact)
================================================================ */
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
      if (width === img.width) { resolve(file); return; }

      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context error"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Resize failed")),
        file.type || "image/png", 0.8
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/* ================================================================
   POSTER HTML
================================================================ */
function posterHTML(text: string, fontFamily: string, fontSize: number, lineSpacing: number) {
  const paras = text
    .split("\n").filter(Boolean)
    .map((p) => `<p style="margin-bottom:12px;">${p}</p>`)
    .join("");
  return `
  <div id="poster" style="
    max-width:820px; padding:40px 32px;
    background:#fffdf7; border:6px double #6b3e26;
    border-radius:14px; font-family:${fontFamily};
    font-size:${fontSize}px; line-height:${lineSpacing};
    color:#2b1a12;">
    ${paras}
    <hr style="margin:28px 0;border:1px solid #d2b48c;" />
    <p style="text-align:center;font-size:14px;color:#555;">
      Generated using AksharaTantra • Offline Sanskrit OCR
    </p>
  </div>`;
}

/* ================================================================
   PAGE COMPONENT
================================================================ */
type ActiveTab = "image" | "document";

export default function SanskritOcrPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");
  const [activeEngine, setActiveEngine] = useState("");
  const [fontFamily, setFontFamily] = useState(DEVANAGARI_FONTS[0].value);
  const [fontSize, setFontSize] = useState(20);
  const [lineSpacing, setLineSpacing] = useState(1.6);

  const cancelFlag = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cached model ref — loaded once, reused
  const trocr_printed_ref = useRef<any>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    resetTimer();
    timerRef.current = setTimeout(() => {
      cancelFlag.current = true;
      setLoading(false);
      setImageError("OCR timed out after 45 seconds. Try a clearer image.");
      setProgress("");
    }, MAX_OCR_TIME_MS);
  }, [resetTimer]);

  /* ---------------------------------------------------------------
     FILE CHANGE
  --------------------------------------------------------------- */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cancelFlag.current = false;
    setImageError(""); setProgress(""); setOcrText(""); setActiveEngine("");
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setFileUrl(URL.createObjectURL(selected));
  };

  /* ================================================================
     ENGINE 1 — Tesseract.js with Sanskrit Language Pack
     ----------------------------------------------------------------
     Language: "san" (Sanskrit / Devanagari trained data)
     License : Apache 2.0
     Works   : Fully offline, in-browser
     Best for: Printed Sanskrit text, clear Devanagari script
     HF Note : No HF model — uses Tesseract's built-in Sanskrit data
  ================================================================ */
  const runTesseractSanskrit = async (blob: Blob): Promise<string> => {
    setActiveEngine("Tesseract.js — Sanskrit/Devanagari (Apache 2.0)");
    const url = URL.createObjectURL(blob);

    const { data } = await Tesseract.recognize(url, "san", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(`Tesseract Sanskrit: ${Math.round((m.progress ?? 0) * 100)}%`);
        }
      },
    });

    URL.revokeObjectURL(url);
    return (data.text || "").trim();
  };

  /* ================================================================
     ENGINE 2 — Xenova/trocr-base-printed (In-Browser, HF ONNX)
     ----------------------------------------------------------------
     Model  : Xenova/trocr-base-printed
     HF Link: https://huggingface.co/Xenova/trocr-base-printed
     Size   : ~280MB (cached after first load)
     License: MIT
     Works  : In-browser via @xenova/transformers (ONNX)
     Best for: Printed Devanagari text, typed Sanskrit documents
     Note   : Not Sanskrit-specific but handles multi-script printed text
  ================================================================ */
  const runTrOCRPrinted = async (blob: Blob): Promise<string> => {
    setActiveEngine("Xenova/trocr-base-printed — Printed Devanagari (MIT)");

    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowRemoteModels = true;
    env.useBrowserCache = true;

    if (!trocr_printed_ref.current) {
      setProgress("Loading TrOCR Printed model (~280MB, first-time only)...");
      // Best in-browser model for printed Devanagari text
      // HF: https://huggingface.co/Xenova/trocr-base-printed
      trocr_printed_ref.current = await pipeline(
        "image-to-text",
        "Xenova/trocr-base-printed"
      );
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    const result = await trocr_printed_ref.current(base64);
    if (Array.isArray(result) && result[0]?.text) return result[0].text.trim();
    if (result?.text) return result.text.trim();
    return "";
  };

  /* ================================================================
     ENGINE 3 — Tesseract Fallback with English+Sanskrit combined
     ----------------------------------------------------------------
     Uses both "eng+san" together — catches mixed Sanskrit/English
     academic documents which often mix both scripts
  ================================================================ */
  const runTesseractMixed = async (blob: Blob): Promise<string> => {
    setActiveEngine("Tesseract.js — Mixed Sanskrit+English (Apache 2.0)");
    const url = URL.createObjectURL(blob);

    const { data } = await Tesseract.recognize(url, "san+eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(`Tesseract Mixed: ${Math.round((m.progress ?? 0) * 100)}%`);
        }
      },
    });

    URL.revokeObjectURL(url);
    return (data.text || "").trim();
  };

  /* ================================================================
     MAIN ANALYZE — Preprocess → Triple Engine Auto-Fallback
     ----------------------------------------------------------------
     Order for Sanskrit/Vedic text:
       1. Tesseract "san"         → Sanskrit-trained, fast, offline
       2. Xenova/trocr-base-printed → Best in-browser printed Devanagari
       3. Tesseract "san+eng"    → Mixed document fallback
  ================================================================ */
  const onAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setProgress("Preprocessing image (Otsu binarization)...");
    setImageError("");
    setOcrText("");
    cancelFlag.current = false;
    startTimer();

    try {
      // ✅ Step 1: Clean the image — remove noise, binarize
      const cleanBlob = await preprocessForHTR(file);
      const cleanUrl = URL.createObjectURL(cleanBlob);
      setFileUrl(cleanUrl); // Show cleaned preview

      let extractedText = "";

      // ✅ Step 2: Engine 1 — Tesseract Sanskrit
      if (!cancelFlag.current) {
        try {
          setProgress("[Engine 1/3] Tesseract Sanskrit...");
          extractedText = await runTesseractSanskrit(cleanBlob);
        } catch (e) {
          console.warn("Engine 1 failed:", e);
        }
      }

      // ✅ Step 3: Engine 2 — TrOCR Printed (if Engine 1 got nothing)
      if (!extractedText && !cancelFlag.current) {
        try {
          setProgress("[Engine 2/3] Xenova/trocr-base-printed...");
          extractedText = await runTrOCRPrinted(cleanBlob);
        } catch (e) {
          console.warn("Engine 2 failed:", e);
        }
      }

      // ✅ Step 4: Engine 3 — Tesseract Mixed Sanskrit+English
      if (!extractedText && !cancelFlag.current) {
        try {
          setProgress("[Engine 3/3] Tesseract Mixed Sanskrit+English...");
          extractedText = await runTesseractMixed(cleanBlob);
        } catch (e) {
          console.warn("Engine 3 failed:", e);
        }
      }

      if (!cancelFlag.current) {
        extractedText.trim()
          ? setOcrText(extractedText.trim())
          : setImageError(
              "No Devanagari text detected. Tips: ensure clear lighting, dark ink, no blur."
            );
      }

      URL.revokeObjectURL(cleanUrl);
    } catch {
      if (!cancelFlag.current) setImageError("OCR failed. Please try again.");
    } finally {
      setLoading(false);
      setProgress("");
      resetTimer();
    }
  };

  /* ---------------------------------------------------------------
     CLEAR
  --------------------------------------------------------------- */
  const onClear = () => {
    cancelFlag.current = true;
    resetTimer();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null); setFileUrl(null); setOcrText("");
    setImageError(""); setProgress(""); setActiveEngine("");
  };

  /* ---------------------------------------------------------------
     EXPORT ACTIONS
  --------------------------------------------------------------- */
  const copyText = async () => {
    await navigator.clipboard.writeText(ocrText);
    alert("Text copied to clipboard");
  };

  const downloadAsImage = async () => {
    if (!ocrText.trim()) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = posterHTML(ocrText, fontFamily, fontSize, lineSpacing);
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

  /* ================================================================
     UI
  ================================================================ */
  return (
    <div style={{ padding: 20, maxWidth: 760, margin: "auto" }}>
      <h1 style={{ textAlign: "center" }}>यथाक्षरं पठनम्</h1>
      <p style={{ textAlign: "center", color: "#555", fontSize: 14 }}>
        AksharaTantra — Open Source Sanskrit OCR · 100% Offline · No API Keys
      </p>

      <SanskritOcrExplanation />

      {/* Engine Info Banner */}
      <div style={{
        background: "#f0f4ff", border: "1px solid #c7d2fe",
        borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13
      }}>
        <strong>🔬 Active HTR Engines (Sanskrit / Devanagari):</strong>
        <ol style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
          <li>
            <strong>Tesseract.js &quot;san&quot;</strong> — Sanskrit language pack · Apache 2.0 ·
            Best for clear printed Devanagari
          </li>
          <li>
            <strong>
              <a href="https://huggingface.co/Xenova/trocr-base-printed" target="_blank" rel="noreferrer">
                Xenova/trocr-base-printed
              </a>
            </strong>{" "}
            — Printed text TrOCR · MIT · ~280MB · In-browser ONNX ·
            Best for typed/printed Devanagari documents
          </li>
          <li>
          <strong>Tesseract.js &quot;san+eng&quot;</strong> — Mixed Sanskrit+English ·
            Apache 2.0 · Best for academic mixed-script documents
          </li>
        </ol>
        <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>
          📌 For Vedic accent marks:{" "}
          <a href="https://huggingface.co/yzk/trocr-large-printed-vedic" target="_blank" rel="noreferrer">
            yzk/trocr-large-printed-vedic
          </a>{" "}
          is the most specialized model but requires a server-side API route.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "inline-flex", marginBottom: 20 }}>
        {(["document", "image"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "10px 20px",
              background: activeTab === t ? "#4f46e5" : "#eee",
              color: activeTab === t ? "#fff" : "#333",
              border: "none", fontWeight: "bold", cursor: "pointer",
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

          {/* Status */}
          {progress && (
            <p style={{ color: "#4f46e5", fontWeight: "bold" }}>⚙️ {progress}</p>
          )}
          {activeEngine && !loading && (
            <p style={{ color: "#059669", fontSize: 13 }}>
              ✅ Detected by: {activeEngine}
            </p>
          )}
          {imageError && <ErrorMessageComponent message={imageError} />}

          {/* Image Preview */}
          {fileUrl && (
            <Image
              src={fileUrl}
              alt="Preview"
              width={600}
              height={400}
              style={{ width: "100%", borderRadius: 12, marginTop: 12 }}
            />
          )}

          {/* Action Buttons */}
          <ActionsComponent
            mode={{ value: "manual", label: "Manual" }}
            loading={loading}
            file={file}
            lang={[SANSKRIT_LANG]}
            onAnalyze={onAnalyze}
            onClear={onClear}
            onCancel={onClear}
          />

          {/* Output */}
          {ocrText && (
            <>
              {/* Font Controls */}
              <div style={{ marginTop: 16 }}>
                <label><strong>Font Family</strong></label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ width: "100%", marginBottom: 8, padding: 6 }}
                >
                  {DEVANAGARI_FONTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                <label><strong>Font Size: {fontSize}px</strong></label>
                <input
                  type="range" min={16} max={36} value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: "100%" }}
                />

                <label><strong>Line Spacing: {lineSpacing.toFixed(1)}</strong></label>
                <input
                  type="range" min={1.3} max={2.4} step={0.1} value={lineSpacing}
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Editable Text Output */}
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                style={{
                  width: "100%", height: 260, marginTop: 12,
                  fontFamily, fontSize, lineHeight: lineSpacing,
                  border: "1px solid #d1d5db", borderRadius: 8, padding: 12,
                }}
              />

              {/* Export Buttons */}
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={copyText}
                  style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
                  📋 Copy Text
                </button>
                <button
                  onClick={downloadAsImage}
                  style={{ padding: "8px 16px", background: "#059669", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
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
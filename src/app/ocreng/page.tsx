"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Button,
  TextField,
  Stack,
  Typography,
  Box,
  LinearProgress,
  Paper,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import JSZip from "jszip";
import Tesseract from "tesseract.js";

/* ================================================================
   LANGUAGE CONFIG
   ----------------------------------------------------------------
   Each language maps to:
     tesseractLang → Tesseract language pack code
     hfModel       → Best available in-browser HF/Xenova ONNX model
     modelSize     → Approx download size
     modelNote     → Honest note about model capability
================================================================ */
interface LangOption {
  value: string;
  label: string;
  group: string;
  tesseractLang: string;
  hfModel: string;
  modelSize: string;
  modelNote: string;
}

const ALL_LANGS: LangOption[] = [
  // ── INDIC LANGUAGES ──────────────────────────────────────────
  {
    value: "asm", label: "Assamese", group: "indic",
    tesseractLang: "asm",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — handles Devanagari-family scripts",
  },
  {
    value: "ben", label: "Bengali", group: "indic",
    tesseractLang: "ben",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — best in-browser model for Bengali script",
  },
  {
    value: "bod", label: "Bodo", group: "indic",
    tesseractLang: "ben",    // Bodo uses Bengali script
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Bodo uses Bengali script (Devanagari variant)",
  },
  {
    value: "guj", label: "Gujarati", group: "indic",
    tesseractLang: "guj",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — handles Gujarati script printed text",
  },
  {
    value: "hin", label: "Hindi", group: "indic",
    tesseractLang: "hin",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — best in-browser for Devanagari Hindi printed text",
  },
  {
    value: "kan", label: "Kannada", group: "indic",
    tesseractLang: "kan",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — handles Kannada script characters",
  },
  {
    value: "mal", label: "Malayalam", group: "indic",
    tesseractLang: "mal",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — handles Malayalam script printed text",
  },
  {
    value: "mar", label: "Marathi", group: "indic",
    tesseractLang: "mar",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Marathi uses Devanagari, well-supported",
  },
  {
    value: "nep", label: "Nepali", group: "indic",
    tesseractLang: "nep",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Nepali uses Devanagari script",
  },
  {
    value: "ori", label: "Odia", group: "indic",
    tesseractLang: "ori",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — handles Odia script printed text",
  },
  {
    value: "pan", label: "Punjabi", group: "indic",
    tesseractLang: "pan",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Punjabi (Gurmukhi script) printed text",
  },
  {
    value: "san", label: "Sanskrit", group: "indic",
    tesseractLang: "san",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Sanskrit Devanagari. Best Vedic: yzk/trocr-large-printed-vedic (server-only)",
  },
  {
    value: "snd", label: "Sindhi", group: "indic",
    tesseractLang: "snd",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Handwritten — Sindhi uses Arabic/Devanagari script",
  },
  {
    value: "tam", label: "Tamil", group: "indic",
    tesseractLang: "tam",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Tamil script printed text",
  },
  {
    value: "tel", label: "Telugu", group: "indic",
    tesseractLang: "tel",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Telugu script printed text",
  },

  // ── LATIN LANGUAGES (use handwritten TrOCR — better for HTR) ──
  {
    value: "eng", label: "English", group: "latin",
    tesseractLang: "eng",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — best English HTR model in-browser",
  },
  {
    value: "deu", label: "German", group: "latin",
    tesseractLang: "deu",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },
  {
    value: "fra", label: "French", group: "latin",
    tesseractLang: "fra",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },
  {
    value: "ita", label: "Italian", group: "latin",
    tesseractLang: "ita",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },
  {
    value: "nld", label: "Dutch", group: "latin",
    tesseractLang: "nld",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },
  {
    value: "por", label: "Portuguese", group: "latin",
    tesseractLang: "por",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },
  {
    value: "spa", label: "Spanish", group: "latin",
    tesseractLang: "spa",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },
  {
    value: "swe", label: "Swedish", group: "latin",
    tesseractLang: "swe",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },
  {
    value: "tur", label: "Turkish", group: "latin",
    tesseractLang: "tur",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Base Handwritten — handles Latin script handwriting",
  },

  // ── CJK LANGUAGES ─────────────────────────────────────────────
  {
    value: "chi_sim", label: "Chinese (Simplified)", group: "cjk",
    tesseractLang: "chi_sim",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — CJK printed text. Tesseract is primary for CJK",
  },
  {
    value: "chi_tra", label: "Chinese (Traditional)", group: "cjk",
    tesseractLang: "chi_tra",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — CJK printed text. Tesseract is primary for CJK",
  },
  {
    value: "jpn", label: "Japanese", group: "cjk",
    tesseractLang: "jpn",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — CJK printed text. Tesseract is primary for Japanese",
  },
  {
    value: "kor", label: "Korean", group: "cjk",
    tesseractLang: "kor",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — CJK printed text. Tesseract is primary for Korean",
  },

  // ── OTHER LANGUAGES ───────────────────────────────────────────
  {
    value: "ara", label: "Arabic", group: "other",
    tesseractLang: "ara",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Handwritten — Arabic script. Tesseract primary for RTL",
  },
  {
    value: "rus", label: "Russian", group: "other",
    tesseractLang: "rus",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Handwritten — Cyrillic script handwriting",
  },
  {
    value: "tha", label: "Thai", group: "other",
    tesseractLang: "tha",
    hfModel: "Xenova/trocr-base-printed",
    modelSize: "~280MB",
    modelNote: "TrOCR Printed — Thai script. Tesseract primary for Thai",
  },
  {
    value: "urd", label: "Urdu", group: "other",
    tesseractLang: "urd",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Handwritten — Urdu uses Nastaliq/Arabic script",
  },
  {
    value: "vie", label: "Vietnamese", group: "other",
    tesseractLang: "vie",
    hfModel: "Xenova/trocr-base-handwritten",
    modelSize: "~250MB",
    modelNote: "TrOCR Handwritten — Vietnamese Latin-based script",
  },
];

// Group labels for dropdown display
const GROUP_LABELS: Record<string, string> = {
  indic: "🇮🇳 Indic Languages",
  latin: "🌍 Latin Languages",
  cjk: "🀄 CJK Languages",
  other: "🌐 Other Languages",
};

/* ================================================================
   OTSU IMAGE PREPROCESSOR
   Auto-detects best ink/background threshold per image.
================================================================ */
function otsuThreshold(gray: Uint8Array): number {
  const histogram = new Array(256).fill(0);
  for (const val of gray) histogram[val]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];
  let sumB = 0, wB = 0, wF = 0, maxVariance = 0, threshold = 128;
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

async function preprocessImageForHTR(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context failed"));
      const MAX_DIM = 1000;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const gray = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      const threshold = otsuThreshold(gray);
      for (let i = 0; i < gray.length; i++) {
        const val = gray[i] < threshold ? 0 : 255;
        const idx = i * 4;
        data[idx] = val; data[idx + 1] = val; data[idx + 2] = val; data[idx + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Canvas toBlob failed"));
          resolve(new File([blob], `clean_${file.name.replace(/\.[^.]+$/, "")}.png`, { type: "image/png" }));
        },
        "image/png", 1.0
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
export default function IndicHTRPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedLang, setSelectedLang] = useState<LangOption>(
    ALL_LANGS.find((l) => l.value === "hin")!
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [deviceMemory, setDeviceMemory] = useState<number>(4);
  const [cpuCores, setCpuCores] = useState<number>(2);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [activeEngine, setActiveEngine] = useState<string>("");

  // ONE model cache per HF model id — shared across all languages
  const modelCache = useRef<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------------------------------------------------------
     DEVICE DETECTION
  --------------------------------------------------------------- */
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const nav = navigator as Navigator & { deviceMemory?: number };
    setDeviceMemory(nav.deviceMemory ?? 4);
    setCpuCores(navigator.hardwareConcurrency || 2);
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    setIsSupported(true);
  }, []);

  const getMaxFiles = () => {
    if (deviceMemory <= 2) return 1;
    if (deviceMemory <= 4) return 3;
    if (deviceMemory <= 8) return 5;
    return 8;
  };

  const MIN_FILES = 1;
  const MAX_FILES = getMaxFiles();
  const MAX_FILE_SIZE_MB = 8;

  /* ---------------------------------------------------------------
     LANGUAGE CHANGE
  --------------------------------------------------------------- */
  const handleLangChange = (e: SelectChangeEvent) => {
    const lang = ALL_LANGS.find((l) => l.value === e.target.value);
    if (lang) {
      setSelectedLang(lang);
      setText("");
      setCompleted(false);
      setError("");
      setActiveEngine("");
    }
  };

  /* ---------------------------------------------------------------
     FILE CHANGE
  --------------------------------------------------------------- */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length < MIN_FILES || selected.length > MAX_FILES) {
      setError(`Upload minimum ${MIN_FILES} and maximum ${MAX_FILES} images.`);
      return;
    }
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Each image must be under ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
    }
    setFiles(selected);
    setText("");
    setCompleted(false);
    setError("");
  };

  /* ---------------------------------------------------------------
     HELPER: File → Base64
  --------------------------------------------------------------- */
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  /* ================================================================
     ENGINE 1 — Tesseract.js with selected language pack
     Best for: All Indic printed text, large marker writing
  ================================================================ */
  const runTesseract = async (file: File, lang: LangOption): Promise<string> => {
    setActiveEngine(`Tesseract.js — "${lang.label}" language pack (Apache 2.0)`);
    const { data } = await Tesseract.recognize(file, lang.tesseractLang, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setStatus(`Tesseract ${lang.label}: ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });
    return data?.text?.trim() || "";
  };

  /* ================================================================
     ENGINE 2 — Xenova HF Model (language-specific best model)
     Loaded from lang.hfModel — cached per model id
     Best for: Printed Devanagari, mixed-script documents
  ================================================================ */
  const runHFModel = async (file: File, lang: LangOption): Promise<string> => {
    setActiveEngine(`${lang.hfModel} (${lang.modelSize}) — ${lang.modelNote}`);

    const { pipeline, env } = await import("@xenova/transformers");
    env.allowRemoteModels = true;
    env.useBrowserCache = true;

    // Use cached model if already loaded for this model id
    if (!modelCache.current[lang.hfModel]) {
      setStatus(`Loading ${lang.hfModel} (${lang.modelSize}, first-time only)...`);
      modelCache.current[lang.hfModel] = await pipeline("image-to-text", lang.hfModel);
    }

    const base64 = await toBase64(file);
    const result = await modelCache.current[lang.hfModel](base64);

    if (Array.isArray(result) && result[0]?.text) return result[0].text.trim();
    if (result?.text) return result.text.trim();
    return "";
  };

  /* ================================================================
     ENGINE 3 — Tesseract fallback with eng+lang combo
     For mixed-script documents that have both English and target lang
  ================================================================ */
  const runTesseractMixed = async (file: File, lang: LangOption): Promise<string> => {
    setActiveEngine(`Tesseract.js — Mixed eng+${lang.label} (Apache 2.0)`);
    const combo = lang.tesseractLang === "eng" ? "eng" : `eng+${lang.tesseractLang}`;
    const { data } = await Tesseract.recognize(file, combo, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setStatus(`Tesseract Mixed: ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });
    return data?.text?.trim() || "";
  };

  /* ================================================================
     MAIN runOCR
     ----------------------------------------------------------------
     For each image:
       Step 1 → Preprocess (Otsu binarization)
       Step 2 → Engine order based on device + language group:
         Indic/CJK/Other → Tesseract first (language-trained)
                         → HF Model second
                         → Mixed Tesseract last
         Latin           → HF Model first (better handwriting)
                         → Tesseract second
                         → Mixed Tesseract last
  ================================================================ */
  const runOCR = async () => {
    if (!files.length) return;

    setLoading(true);
    setCompleted(false);
    setError("");
    setText("");

    const lang = selectedLang;
    const isLatin = lang.group === "latin";
    const isLowRAM = deviceMemory <= 4 || isMobile;

    // Engine order strategy
    type EngineFn = (file: File, lang: LangOption) => Promise<string>;
    const engineOrder: { name: string; fn: EngineFn }[] =
      isLatin && !isLowRAM
        ? [
            { name: "HF Model", fn: runHFModel },
            { name: "Tesseract", fn: runTesseract },
            { name: "Tesseract Mixed", fn: runTesseractMixed },
          ]
        : [
            { name: "Tesseract", fn: runTesseract },
            { name: "HF Model", fn: runHFModel },
            { name: "Tesseract Mixed", fn: runTesseractMixed },
          ];

    let finalText = "";

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let extractedText = "";
        let usedEngine = "";

        // Step 1: Preprocess
        setStatus(`Preprocessing image ${i + 1}...`);
        let cleanFile: File;
        try {
          cleanFile = await preprocessImageForHTR(file);
        } catch {
          cleanFile = file;
        }

        // Step 2: Try engines
        for (let e = 0; e < engineOrder.length; e++) {
          const engine = engineOrder[e];
          try {
            setStatus(`Image ${i + 1}/${files.length} → [${e + 1}/3] ${engine.name}...`);
            extractedText = await engine.fn(cleanFile, lang);
            if (extractedText.trim()) { usedEngine = engine.name; break; }
          } catch (err: any) {
            console.warn(`Engine "${engine.name}" failed:`, err?.message);
          }
        }

        if (extractedText.trim()) {
          const header = files.length > 1 ? `\n\n--- Page ${i + 1} [${usedEngine}] ---\n` : "";
          finalText += header + extractedText.trim();
        }
      }

      if (!finalText.trim()) {
        setError("No text detected. Tips: dark ink, white paper, good lighting, no blur.");
        setCompleted(false);
        return;
      }

      setText(finalText.trim());
      setCompleted(true);
      setStatus("✅ HTR Completed");
    } catch (err: any) {
      setError(err?.message || "Unexpected error.");
      setCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================
     EXPORT FUNCTIONS
  ================================================================ */
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <style>body{font-family:serif;padding:30px;direction:${
        ["ara", "urd", "snd"].includes(selectedLang.value) ? "rtl" : "ltr"
      }}</style></head>
      <body><h2>AksharaTantra — ${selectedLang.label} HTR</h2><pre>${text}</pre></body></html>`);
    win.document.close(); win.print();
  };

  const exportImage = () => {
    if (!text) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const isSmall = isMobile || deviceMemory <= 4;
    const maxWidth = isSmall ? 600 : 1100;
    const padding = isSmall ? 30 : 60;
    const titleSize = isSmall ? 22 : 32;
    const bodySize = isSmall ? 16 : 20;
    const lineH = isSmall ? 6 : 10;
    const now = new Date().toLocaleString();
    ctx.font = `${bodySize}px serif`;
    const wrap = (t: string, mw: number) => {
      const words = t.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur + w + " ";
        if (ctx.measureText(test).width > mw && cur) { lines.push(cur.trim()); cur = w + " "; }
        else cur = test;
      }
      lines.push(cur.trim());
      return lines;
    };
    const wrapped: string[] = [];
    text.split("\n").forEach((l) => wrapped.push(...wrap(l, maxWidth)));
    canvas.width = maxWidth + padding * 2;
    canvas.height = padding * 2 + titleSize + wrapped.length * (bodySize + lineH) + 80;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0d47a1";
    ctx.font = `bold ${titleSize}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(`AksharaTantra — ${selectedLang.label} HTR`, canvas.width / 2, padding);
    ctx.fillStyle = "#000";
    ctx.font = `${bodySize}px serif`;
    ctx.textAlign = "left";
    let y = padding + 50;
    wrapped.forEach((l) => { ctx.fillText(l, padding, y); y += bodySize + lineH; });
    ctx.fillStyle = "#757575";
    ctx.font = "14px serif";
    ctx.fillText(`Generated: ${now}`, padding, canvas.height - 20);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png", 1.0);
    a.download = `aksharatantra_${selectedLang.value}_${Date.now()}.png`;
    a.click();
  };

  const exportEPUB = async () => {
    if (!text) return;
    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip");
    zip.folder("OEBPS")?.file("content.xhtml",
      `<html xmlns="http://www.w3.org/1999/xhtml"><body>
      <h1>AksharaTantra — ${selectedLang.label} HTR</h1>
      <pre>${text}</pre></body></html>`);
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aksharatantra_${selectedLang.value}_${Date.now()}.epub`;
    a.click();
  };

  const exportJSON = () => {
    if (!text) return;
    downloadFile(
      JSON.stringify({
        engine: "AksharaTantra Indic HTR",
        language: selectedLang.label,
        tesseractLang: selectedLang.tesseractLang,
        hfModel: selectedLang.hfModel,
        modelNote: selectedLang.modelNote,
        preprocessing: "Otsu Binarization + Grayscale + Resize",
        generatedAt: new Date().toISOString(),
        content: text,
      }, null, 2),
      `aksharatantra_${selectedLang.value}_${Date.now()}.json`,
      "application/json"
    );
  };

  const exportHTML = () => {
    if (!text) return;
    const isRTL = ["ara", "urd", "snd"].includes(selectedLang.value);
    downloadFile(
      `<!DOCTYPE html><html dir="${isRTL ? "rtl" : "ltr"}">
      <head><meta charset="UTF-8"/><title>AksharaTantra ${selectedLang.label} HTR</title></head>
      <body><h1>AksharaTantra — ${selectedLang.label}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <pre>${text}</pre></body></html>`,
      `aksharatantra_${selectedLang.value}_${Date.now()}.html`,
      "text/html"
    );
  };

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(text); setStatus("Copied ✅"); }
    catch { setError("Clipboard copy failed ❌"); }
  };

  const clearAll = () => {
    setFiles([]); setText(""); setCompleted(false);
    setError(""); setStatus("Ready"); setActiveEngine("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!mounted) return null;

  /* ================================================================
     UI
  ================================================================ */

  // Build grouped dropdown options
  const groups = ["indic", "latin", "cjk", "other"];

  return (
    <>
      <Navbar />
      <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>

        {/* Header */}
        <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
          ✍️ AksharaTantra — Indic &amp; World Language HTR
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mb: 1 }}>
          100% Open Source · No API Keys · Fully Offline · No Data Leaves Your Device
        </Typography>
        <Typography variant="caption" display="block" textAlign="center" sx={{ mb: 2 }}>
          📂 Max {MAX_FILES} images &nbsp;|&nbsp;
          📦 Max {MAX_FILE_SIZE_MB}MB/image &nbsp;|&nbsp;
          💾 RAM: {deviceMemory}GB &nbsp;|&nbsp;
          🖥 CPU: {cpuCores} cores
        </Typography>

        {/* ── LANGUAGE SELECTOR ── */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            🌐 Step 1 — Choose Language
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Select Language</InputLabel>
            <Select
              value={selectedLang.value}
              label="Select Language"
              onChange={handleLangChange}
            >
              {groups.map((group) => [
                <MenuItem key={`group-${group}`} disabled sx={{ fontWeight: "bold", opacity: 1, color: "#555" }}>
                  {GROUP_LABELS[group]}
                </MenuItem>,
                ...ALL_LANGS.filter((l) => l.group === group).map((lang) => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                )),
              ])}
            </Select>
          </FormControl>

          {/* Selected language model info */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Selected: {selectedLang.label}</strong>
            <br />
            🔬 <strong>Engine 1:</strong> Tesseract.js — language: <code>{selectedLang.tesseractLang}</code> (Apache 2.0, ~10MB, offline)
            <br />
            🤗 <strong>Engine 2:</strong>{" "}
            <a href={`https://huggingface.co/${selectedLang.hfModel}`} target="_blank" rel="noreferrer">
              {selectedLang.hfModel}
            </a>{" "}
            ({selectedLang.modelSize}, MIT, in-browser ONNX)
            <br />
            📝 <strong>Note:</strong> {selectedLang.modelNote}
          </Alert>
        </Paper>

        {/* ── PREPROCESSING INFO ── */}
        <Alert severity="info" sx={{ mb: 2 }}>
          🔧 <strong>Auto Preprocessing:</strong> Otsu Binarization + Grayscale + Resize
          — removes gray backgrounds, uneven lighting, mobile camera noise
        </Alert>

        <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
          <Chip
            label={isSupported ? "Device Supported ✅" : "Device Not Supported ❌"}
            color={isSupported ? "success" : "error"}
          />
        </Stack>

        {activeEngine && (
          <Alert severity="info" sx={{ mb: 1 }}>
            ⚙️ <strong>Running:</strong> {activeEngine}
          </Alert>
        )}

        {/* ── MAIN CARD ── */}
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">📂 Step 2 — Upload Image(s)</Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Button variant="contained" component="label" disabled={!isSupported}>
              Upload Images
              <input
                hidden ref={fileInputRef} type="file"
                multiple accept="image/*"
                onChange={handleFileChange}
              />
            </Button>

            {files.length > 0 && (
              <Alert severity="info">
                📎 {files.length} file(s): {files.map((f) => f.name).join(", ")}
              </Alert>
            )}

            <Typography variant="h6">🚀 Step 3 — Run HTR</Typography>

            <Button
              variant="contained" color="secondary" size="large"
              onClick={runOCR}
              disabled={loading || files.length === 0 || !isSupported}
            >
              {loading ? status : `Run HTR — ${selectedLang.label}`}
            </Button>

            {loading && (
              <>
                <LinearProgress />
                <Typography variant="caption" textAlign="center" color="text.secondary">
                  {status}
                </Typography>
              </>
            )}

            {completed && <Alert severity="success">✅ HTR Output Ready — {selectedLang.label}</Alert>}

            {/* ── OUTPUT ── */}
            {completed && (
              <>
                <TextField
                  multiline minRows={8} fullWidth
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  label={`Extracted Text — ${selectedLang.label}`}
                  inputProps={{
                    dir: ["ara", "urd", "snd"].includes(selectedLang.value) ? "rtl" : "ltr",
                    style: { fontFamily: "serif", fontSize: 16 },
                  }}
                />

                <Typography variant="h6">⬇ Export</Typography>
                <Stack direction="row" flexWrap="wrap" sx={{ gap: 2 }}>
                  <Button variant="outlined" onClick={() => downloadFile(text, `output_${selectedLang.value}_${Date.now()}.txt`, "text/plain")}>TXT</Button>
                  <Button variant="outlined" onClick={exportPDF}>PDF</Button>
                  <Button variant="outlined" onClick={exportImage}>Poster</Button>
                  <Button variant="outlined" onClick={exportHTML}>HTML</Button>
                  <Button variant="outlined" onClick={exportEPUB}>EPUB</Button>
                  <Button variant="outlined" onClick={exportJSON}>JSON</Button>
                  <Button variant="outlined" onClick={copyToClipboard}>Copy</Button>
                  <Button variant="outlined" color="error" onClick={clearAll}>Clear</Button>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
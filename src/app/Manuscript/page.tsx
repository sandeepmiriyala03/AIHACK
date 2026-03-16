"use client";

/**
 * ============================================================
 *  VidyaPatha — Multilingual OCR (Tesseract.js)
 * ============================================================
 *
 *  SETUP:
 *  1. npm install tesseract.js jspdf docx file-saver
 *     npm install --save-dev @types/file-saver
 *
 *  2. Place your .traineddata files in /public/tessdata/
 *     e.g. /public/tessdata/hin.traineddata
 *         /public/tessdata/tel.traineddata  etc.
 *
 *  3. Place this file at: src/app/ocr-multilingual/page.tsx
 *
 *  4. next.config.js — add webpack fallback:
 *     config.resolve.fallback = { fs: false, path: false };
 *
 *  5. Works fully offline after first language load.
 *     Each language caches in IndexedDB separately.
 *
 *  EXPORT:
 *  - PDF via jspdf (client-side, no server)
 *  - Word (.docx) via docx + file-saver (client-side)
 *  - Plain text copy
 * ============================================================
 */

import { useState, useRef, useCallback, useEffect, ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import Image from "next/image";
// ── Types ─────────────────────────────────────────────────────
interface LangOption {
  value: string;
  label: string;
  group: string;
}

type Stage = "idle" | "loading-lang" | "recognising" | "done" | "error";

// ── Language list ─────────────────────────────────────────────
const ALL_LANGS: LangOption[] = [
  { value: "ara", label: "Arabic", group: "Other" },
  { value: "asm", label: "Assamese", group: "Indic" },
  { value: "ben", label: "Bengali", group: "Indic" },
  { value: "bod", label: "Bodo", group: "Indic" },
  { value: "chi_sim", label: "Chinese (Simplified)", group: "CJK" },
  { value: "chi_tra", label: "Chinese (Traditional)", group: "CJK" },
  { value: "deu", label: "German", group: "Latin" },
  { value: "eng", label: "English", group: "Latin" },
  { value: "fra", label: "French", group: "Latin" },
  { value: "guj", label: "Gujarati", group: "Indic" },
  { value: "hin", label: "Hindi", group: "Indic" },
  { value: "ita", label: "Italian", group: "Latin" },
  { value: "jpn", label: "Japanese", group: "CJK" },
  { value: "kan", label: "Kannada", group: "Indic" },
  { value: "kor", label: "Korean", group: "CJK" },
  { value: "mal", label: "Malayalam", group: "Indic" },
  { value: "mar", label: "Marathi", group: "Indic" },
  { value: "nep", label: "Nepali", group: "Indic" },
  { value: "nld", label: "Dutch", group: "Latin" },
  { value: "ori", label: "Odia", group: "Indic" },
  { value: "pan", label: "Punjabi", group: "Indic" },
  { value: "por", label: "Portuguese", group: "Latin" },
  { value: "rus", label: "Russian", group: "Other" },
  { value: "san", label: "Sanskrit", group: "Indic" },
  { value: "snd", label: "Sindhi", group: "Indic" },
  { value: "spa", label: "Spanish", group: "Latin" },
  { value: "swe", label: "Swedish", group: "Latin" },
  { value: "tam", label: "Tamil", group: "Indic" },
  { value: "tel", label: "Telugu", group: "Indic" },
  { value: "tha", label: "Thai", group: "Other" },
  { value: "tur", label: "Turkish", group: "Latin" },
  { value: "urd", label: "Urdu", group: "Other" },
  { value: "vie", label: "Vietnamese", group: "Other" },
];

const GROUPS = ["Indic", "Latin", "CJK", "Other"];

// ── Module-level worker cache ─────────────────────────────────
// Keeps Tesseract workers alive across navigation (one per language)
const _workerCache = new Map<string, unknown>();

// ── Component ─────────────────────────────────────────────────
export default function VidyaPathaPage() {
  const [selectedLang, setSelectedLang] = useState<LangOption>(
    ALL_LANGS.find((l) => l.value === "eng")!
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.closest(".vp-lang-dropdown")?.contains(target)) {
        setSearchOpen(false);
        setLangSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  // ── File handling ─────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult("");
    setError("");
    setStage("idle");
    setProgress(0);
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) handleFile(f);
    };
    el.addEventListener("dragover", prevent);
    el.addEventListener("drop", onDrop);
    return () => { el.removeEventListener("dragover", prevent); el.removeEventListener("drop", onDrop); };
  }, [handleFile]);

  // ── OCR ───────────────────────────────────────────────────
  const runOCR = async () => {
    if (!file) return;
    setError("");
    setResult("");
    setProgress(0);

    try {
      // Dynamic import — Tesseract.js is large, only load when needed
      const Tesseract = (await import("tesseract.js")).default;
      const lang = selectedLang.value;

      // Check if we have a cached worker for this language
      let worker = _workerCache.get(lang) as Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;

      if (!worker) {
        setStage("loading-lang");
        setProgressMsg(`Loading ${selectedLang.label} language data…`);

        worker = await Tesseract.createWorker(lang, 1, {
          // Point to your /public/tessdata/ folder
          langPath: "/tessdata",
          // Cache loaded languages in IndexedDB for offline use
          cacheMethod: "write",
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "loading tesseract core") {
              setProgressMsg("Loading OCR engine…");
              setProgress(Math.round(m.progress * 30));
            } else if (m.status === "initializing tesseract") {
              setProgressMsg("Initialising engine…");
              setProgress(30 + Math.round(m.progress * 20));
            } else if (m.status === "loading language traineddata") {
              setProgressMsg(`Downloading ${selectedLang.label} data…`);
              setProgress(50 + Math.round(m.progress * 40));
            } else if (m.status === "initializing api") {
              setProgressMsg("Ready to scan…");
              setProgress(95);
            }
          },
        });

        _workerCache.set(lang, worker);
      }

      setStage("recognising");
      setProgressMsg("Scanning image…");
      setProgress(98);

      const { data } = await worker.recognize(file);
      const text = data.text?.trim() ?? "";

      if (!text) throw new Error("No text found. Try a clearer image with better lighting.");
      setResult(text);
      setStage("done");
      setProgress(100);
      setProgressMsg("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "OCR failed. Please try again.";
      setError(msg);
      setStage("error");
    }
  };

  // ── Export: PDF ───────────────────────────────────────────
  const exportPDF = async () => {
    if (!result) return;
    try {
      setExportMsg("Generating PDF…");
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("VidyaPatha OCR Result", margin, margin);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Language: ${selectedLang.label}  |  ${new Date().toLocaleDateString()}`, margin, margin + 8);
      doc.setTextColor(0);
      doc.line(margin, margin + 12, margin + pageWidth, margin + 12);

      doc.setFontSize(11);
      const lines = doc.splitTextToSize(result, pageWidth);
      let y = margin + 20;
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 6;
      }

      doc.save(`vidyapatha-ocr-${selectedLang.value}-${Date.now()}.pdf`);
      setExportMsg("PDF downloaded!");
    } catch {
      setExportMsg("PDF export failed.");
    }
    setTimeout(() => setExportMsg(""), 3000);
  };

  // ── Export: Word (.docx) ──────────────────────────────────
  const exportWord = async () => {
    if (!result) return;
    try {
      setExportMsg("Generating Word document…");
      const { Document, Paragraph, TextRun, HeadingLevel, Packer } = await import("docx");
      const { saveAs } = await import("file-saver");

      const paragraphs = result.split("\n").filter(Boolean).map(
        (line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "VidyaPatha OCR Result",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [new TextRun({
                text: `Language: ${selectedLang.label}  |  ${new Date().toLocaleDateString()}`,
                color: "888888", size: 18,
              })],
            }),
            new Paragraph({ text: "" }),
            ...paragraphs,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `vidyapatha-ocr-${selectedLang.value}-${Date.now()}.docx`);
      setExportMsg("Word document downloaded!");
    } catch {
      setExportMsg("Word export failed.");
    }
    setTimeout(() => setExportMsg(""), 3000);
  };

  // ── Copy text ─────────────────────────────────────────────
  const copyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult("");
    setError("");
    setStage("idle");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Derived ───────────────────────────────────────────────
  const isProcessing = stage === "loading-lang" || stage === "recognising";
  const canScan = !!file && !isProcessing;
  const filteredLangs = ALL_LANGS.filter((l) =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.value.toLowerCase().includes(langSearch.toLowerCase())
  );
  const groupedFiltered = GROUPS.map((g) => ({
    group: g,
    langs: filteredLangs.filter((l) => l.group === g),
  })).filter((g) => g.langs.length > 0);

  // ─────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Sans:wght@300;400;500&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --bg: #0d0f14;
            --surface: #151820;
            --surface2: #1c2030;
            --border: #252a3a;
            --border2: #2e3450;
            --accent: #4f8ef7;
            --accent2: #7c3aed;
            --success: #10b981;
            --warn: #f59e0b;
            --danger: #ef4444;
            --text: #e8eaf2;
            --muted: #6b7280;
            --radius: 14px;
            --shadow: 0 8px 40px rgba(0,0,0,0.5);
          }

          body { background: var(--bg); color: var(--text); font-family: 'Instrument Sans', sans-serif; }

          .vp-wrap {
            min-height: 100vh;
            background: var(--bg);
            background-image:
              radial-gradient(ellipse at 15% 0%, rgba(79,142,247,0.07) 0%, transparent 50%),
              radial-gradient(ellipse at 85% 100%, rgba(124,58,237,0.06) 0%, transparent 50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 48px 16px 100px;
          }

          /* ── Header ── */
          .vp-header {
            text-align: center;
            max-width: 640px;
            margin-bottom: 44px;
            animation: fadeDown 0.5s ease;
          }
          @keyframes fadeDown {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .vp-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 14px;
          }
          .vp-eyebrow-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: var(--accent);
            animation: blink 2s infinite;
          }
          @keyframes blink {
            0%,100% { opacity: 1; } 50% { opacity: 0.3; }
          }
          .vp-title {
            font-family: 'Syne', sans-serif;
            font-size: clamp(2rem, 5.5vw, 3.6rem);
            font-weight: 800;
            line-height: 1.05;
            letter-spacing: -0.03em;
            background: linear-gradient(135deg, #e8eaf2 0%, #7c9fcf 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .vp-subtitle {
            margin-top: 12px;
            font-size: 15px;
            color: var(--muted);
            font-weight: 300;
            line-height: 1.65;
          }
          .vp-badges {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 16px;
          }
          .vp-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 12px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid var(--border2);
            color: var(--muted);
            background: var(--surface);
          }
          .vp-badge.green { color: var(--success); border-color: rgba(16,185,129,0.25); background: rgba(16,185,129,0.06); }
          .vp-badge.blue  { color: var(--accent);  border-color: rgba(79,142,247,0.25); background: rgba(79,142,247,0.06); }

          /* ── Main layout ── */
          .vp-main {
            width: 100%;
            max-width: 860px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            animation: fadeUp 0.5s ease 0.1s both;
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 680px) {
            .vp-main { grid-template-columns: 1fr; }
          }

          /* ── Panel ── */
          .vp-panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
          }
          .vp-panel-header {
            padding: 16px 20px 12px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .vp-panel-title {
            font-family: 'Syne', sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .vp-panel-body { padding: 20px; }

          /* ── Language selector ── */
          .vp-lang-dropdown { position: relative; }
          .vp-lang-trigger {
            width: 100%;
            background: var(--surface2);
            border: 1px solid var(--border2);
            border-radius: 10px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            transition: border-color 0.2s;
            color: var(--text);
            font-family: 'Instrument Sans', sans-serif;
            font-size: 14px;
          }
          .vp-lang-trigger:hover { border-color: var(--accent); }
          .vp-lang-trigger-label { display: flex; align-items: center; gap: 10px; }
          .vp-lang-group-tag {
            font-size: 10px;
            padding: 2px 7px;
            border-radius: 99px;
            background: rgba(79,142,247,0.12);
            color: var(--accent);
            font-weight: 500;
          }
          .vp-lang-arrow { color: var(--muted); font-size: 12px; transition: transform 0.2s; }
          .vp-lang-arrow.open { transform: rotate(180deg); }

          .vp-lang-menu {
            position: absolute;
            top: calc(100% + 6px);
            left: 0; right: 0;
            background: var(--surface2);
            border: 1px solid var(--border2);
            border-radius: 12px;
            z-index: 100;
            box-shadow: var(--shadow);
            max-height: 340px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .vp-lang-search {
            padding: 10px 14px;
            border-bottom: 1px solid var(--border);
          }
          .vp-lang-search input {
            width: 100%;
            background: var(--surface);
            border: 1px solid var(--border2);
            border-radius: 8px;
            padding: 8px 12px;
            color: var(--text);
            font-size: 13px;
            font-family: 'Instrument Sans', sans-serif;
            outline: none;
          }
          .vp-lang-search input:focus { border-color: var(--accent); }
          .vp-lang-list { overflow-y: auto; flex: 1; padding: 8px 0; }
          .vp-lang-group-label {
            padding: 6px 14px 4px;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .vp-lang-option {
            padding: 9px 14px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.15s;
            color: var(--text);
          }
          .vp-lang-option:hover { background: rgba(79,142,247,0.08); }
          .vp-lang-option.active { background: rgba(79,142,247,0.12); color: var(--accent); }

          /* ── Drop zone ── */
          .vp-dropzone {
            border: 2px dashed var(--border2);
            border-radius: 12px;
            padding: 32px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--surface2);
            position: relative;
            margin-top: 14px;
          }
          .vp-dropzone:hover, .vp-dropzone.has-file {
            border-color: var(--accent);
            background: rgba(79,142,247,0.04);
          }
          .vp-dropzone input {
            position: absolute; inset: 0; opacity: 0;
            cursor: pointer; width: 100%; height: 100%;
          }
          .vp-dropzone-icon { font-size: 32px; margin-bottom: 8px; }
          .vp-dropzone-label { font-size: 14px; font-weight: 500; color: var(--text); }
          .vp-dropzone-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

          /* ── Preview ── */
          .vp-preview {
            margin-top: 14px;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            max-height: 200px;
          }
          .vp-preview img {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            display: block;
          }

          /* ── Progress ── */
          .vp-progress { margin-top: 14px; }
          .vp-progress-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--muted);
            margin-bottom: 6px;
          }
          .vp-track {
            height: 3px;
            background: var(--border2);
            border-radius: 99px;
            overflow: hidden;
          }
          .vp-fill {
            height: 100%;
            border-radius: 99px;
            background: linear-gradient(90deg, var(--accent), var(--accent2));
            transition: width 0.4s ease;
          }

          /* ── Buttons ── */
          .vp-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 13px 24px;
            border-radius: 10px;
            font-family: 'Instrument Sans', sans-serif;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.18s;
            border: none;
            outline: none;
          }
          .vp-btn-primary {
            background: var(--accent);
            color: #fff;
            width: 100%;
            justify-content: center;
            margin-top: 14px;
          }
          .vp-btn-primary:hover:not(:disabled) {
            background: #6fa3fb;
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(79,142,247,0.35);
          }
          .vp-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
          .vp-btn-sm {
            padding: 8px 16px;
            font-size: 12px;
            border-radius: 8px;
          }
          .vp-btn-ghost {
            background: var(--surface2);
            color: var(--muted);
            border: 1px solid var(--border2);
          }
          .vp-btn-ghost:hover { color: var(--text); border-color: var(--accent); }
          .vp-btn-success {
            background: rgba(16,185,129,0.12);
            color: var(--success);
            border: 1px solid rgba(16,185,129,0.25);
          }
          .vp-btn-success:hover { background: rgba(16,185,129,0.2); }
          .vp-btn-purple {
            background: rgba(124,58,237,0.12);
            color: #a78bfa;
            border: 1px solid rgba(124,58,237,0.25);
          }
          .vp-btn-purple:hover { background: rgba(124,58,237,0.2); }
          .vp-btn-blue {
            background: rgba(79,142,247,0.1);
            color: var(--accent);
            border: 1px solid rgba(79,142,247,0.25);
          }
          .vp-btn-blue:hover { background: rgba(79,142,247,0.18); }

          /* ── Spinner ── */
          .vp-spinner {
            width: 14px; height: 14px;
            border: 2px solid rgba(255,255,255,0.2);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            flex-shrink: 0;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* ── Error ── */
          .vp-error {
            margin-top: 12px;
            padding: 12px 14px;
            border-radius: 10px;
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.2);
            color: #fca5a5;
            font-size: 13px;
            line-height: 1.5;
          }

          /* ── Result panel ── */
          .vp-result-area {
            width: 100%;
            min-height: 160px;
            background: var(--surface2);
            border: 1px solid var(--border2);
            border-radius: 10px;
            padding: 14px;
            color: var(--text);
            font-size: 14px;
            line-height: 1.75;
            resize: vertical;
            font-family: 'Instrument Sans', sans-serif;
            outline: none;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .vp-result-area:focus { border-color: var(--accent); }
          .vp-result-placeholder {
            width: 100%;
            min-height: 160px;
            background: var(--surface2);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 14px;
            color: var(--muted);
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            line-height: 1.6;
          }
          .vp-result-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            flex-wrap: wrap;
          }
          .vp-export-msg {
            font-size: 12px;
            color: var(--success);
            padding: 6px 0;
            animation: fadeUp 0.3s ease;
          }

          /* ── Word count ── */
          .vp-stats {
            display: flex;
            gap: 16px;
            margin-top: 10px;
          }
          .vp-stat {
            font-size: 11px;
            color: var(--muted);
          }
          .vp-stat strong { color: var(--text); font-weight: 500; }

          /* ── Instructions ── */
          .vp-instructions {
            width: 100%;
            max-width: 860px;
            margin-top: 24px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            animation: fadeUp 0.5s ease 0.2s both;
          }
          .vp-instructions-header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .vp-instructions-title {
            font-family: 'Syne', sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
          }
          .vp-instructions-body {
            padding: 20px 24px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }
          .vp-tip {
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }
          .vp-tip-num {
            flex-shrink: 0;
            width: 22px; height: 22px;
            border-radius: 50%;
            background: rgba(79,142,247,0.12);
            color: var(--accent);
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .vp-tip-text {
            font-size: 13px;
            color: var(--muted);
            line-height: 1.55;
          }
          .vp-tip-text strong { color: var(--text); display: block; margin-bottom: 2px; font-weight: 500; }

          /* ── Lang count bar ── */
          .vp-lang-count {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            font-size: 12px;
            color: var(--muted);
          }
          .vp-lang-dots {
            display: flex;
            gap: 3px;
          }
          .vp-lang-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: var(--border2);
          }
          .vp-lang-dot.indic { background: #4f8ef7; }
          .vp-lang-dot.latin { background: #10b981; }
          .vp-lang-dot.cjk   { background: #f59e0b; }
          .vp-lang-dot.other { background: #a78bfa; }

          /* ── Responsive ── */
          @media (max-width: 540px) {
            .vp-panel-body { padding: 14px; }
            .vp-instructions-body { grid-template-columns: 1fr; }
            .vp-btn { font-size: 13px; }
          }
        `}</style>

        <div className="vp-wrap">

          {/* ── Header ── */}
          <header className="vp-header">
            <div className="vp-eyebrow">
              <span className="vp-eyebrow-dot" />
              Multilingual OCR Engine
            </div>
            <h1 className="vp-title">VidyaPatha</h1>
            <p className="vp-subtitle">
              Extract text from printed documents in 33 languages.<br />
              Runs entirely in your browser — offline after first load.
            </p>
            <div className="vp-badges">
              <span className="vp-badge green">✓ 33 Languages</span>
              <span className="vp-badge blue">⬡ Offline Ready</span>
              <span className="vp-badge">↓ PDF &amp; Word Export</span>
              <span className="vp-badge">⚡ No Server</span>
            </div>
            <div className="vp-lang-count">
              <div className="vp-lang-dots">
                {Array.from({length: 14}).map((_,i) => <span key={i} className="vp-lang-dot indic"/>)}
                {Array.from({length: 8}).map((_,i) => <span key={i} className="vp-lang-dot latin"/>)}
                {Array.from({length: 4}).map((_,i) => <span key={i} className="vp-lang-dot cjk"/>)}
                {Array.from({length: 7}).map((_,i) => <span key={i} className="vp-lang-dot other"/>)}
              </div>
              <span>Indic · Latin · CJK · Other</span>
            </div>
          </header>

          {/* ── Main grid ── */}
          <div className="vp-main">

            {/* ── Left: Upload + controls ── */}
            <div className="vp-panel">
              <div className="vp-panel-header">
                <span className="vp-panel-title">Input</span>
                {file && (
                  <button className="vp-btn vp-btn-sm vp-btn-ghost" onClick={clear}>
                    ✕ Clear
                  </button>
                )}
              </div>
              <div className="vp-panel-body">

                {/* Language selector */}
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                  Select language
                </div>
                <div className="vp-lang-dropdown">
                  <button
                    className="vp-lang-trigger"
                    onClick={() => { setSearchOpen((o) => !o); setLangSearch(""); }}
                  >
                    <span className="vp-lang-trigger-label">
                      <span>{selectedLang.label}</span>
                      <span className="vp-lang-group-tag">{selectedLang.group}</span>
                    </span>
                    <span className={`vp-lang-arrow ${searchOpen ? "open" : ""}`}>▼</span>
                  </button>

                  {searchOpen && (
                    <div className="vp-lang-menu">
                      <div className="vp-lang-search">
                        <input
                          ref={searchRef}
                          autoFocus
                          placeholder="Search language…"
                          value={langSearch}
                          onChange={(e) => setLangSearch(e.target.value)}
                        />
                      </div>
                      <div className="vp-lang-list">
                        {groupedFiltered.map(({ group, langs }) => (
                          <div key={group}>
                            <div className="vp-lang-group-label">{group}</div>
                            {langs.map((l) => (
                              <div
                                key={l.value}
                                className={`vp-lang-option ${selectedLang.value === l.value ? "active" : ""}`}
                                onClick={() => { setSelectedLang(l); setSearchOpen(false); setLangSearch(""); setResult(""); setStage("idle"); }}
                              >
                                {l.label}
                                {selectedLang.value === l.value && <span style={{ marginLeft: "auto", fontSize: 11 }}>✓</span>}
                              </div>
                            ))}
                          </div>
                        ))}
                        {groupedFiltered.length === 0 && (
                          <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                            No languages found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  ref={dropRef}
                  className={`vp-dropzone ${file ? "has-file" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onInputChange}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="vp-dropzone-icon">{file ? "🖼️" : "📷"}</div>
                  <div className="vp-dropzone-label">
                    {file ? file.name : "Drop image or click to upload"}
                  </div>
                  <div className="vp-dropzone-sub">
                    {file ? "Click to change" : "PNG, JPG, WEBP, TIFF supported"}
                  </div>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="vp-preview">
                 <Image
  src={preview}
  alt="Preview"
  width={400}
  height={300}
  style={{ maxWidth: "100%", height: "auto" }}
/>
                  </div>
                )}

                {/* Progress */}
                {isProcessing && (
                  <div className="vp-progress">
                    <div className="vp-progress-row">
                      <span>{progressMsg}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="vp-track">
                      <div className="vp-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Scan button */}
                <button
                  className="vp-btn vp-btn-primary"
                  onClick={runOCR}
                  disabled={!canScan}
                >
                  {isProcessing ? (
                    <><span className="vp-spinner" /> {stage === "loading-lang" ? `Loading ${selectedLang.label}…` : "Scanning…"}</>
                  ) : (
                    `◈  Extract Text — ${selectedLang.label}`
                  )}
                </button>

                {/* Error */}
                {error && (
                  <div className="vp-error">⚠ {error}</div>
                )}
              </div>
            </div>

            {/* ── Right: Result ── */}
            <div className="vp-panel">
              <div className="vp-panel-header">
                <span className="vp-panel-title">Result</span>
                {result && (
                  <span style={{ fontSize: 11, color: "var(--success)" }}>
                    ✓ {selectedLang.label}
                  </span>
                )}
              </div>
              <div className="vp-panel-body">

                {result ? (
                  <>
                    <textarea
                      className="vp-result-area"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      spellCheck={false}
                    />

                    {/* Stats */}
                    <div className="vp-stats">
                      <span className="vp-stat"><strong>{result.split(/\s+/).filter(Boolean).length}</strong> words</span>
                      <span className="vp-stat"><strong>{result.length}</strong> chars</span>
                      <span className="vp-stat"><strong>{result.split("\n").filter(Boolean).length}</strong> lines</span>
                    </div>

                    {/* Export actions */}
                    <div className="vp-result-actions">
                      <button className="vp-btn vp-btn-sm vp-btn-blue" onClick={copyText}>
                        {copied ? "✓ Copied!" : "⎘ Copy"}
                      </button>
                      <button className="vp-btn vp-btn-sm vp-btn-success" onClick={exportPDF}>
                        ↓ PDF
                      </button>
                      <button className="vp-btn vp-btn-sm vp-btn-purple" onClick={exportWord}>
                        ↓ Word
                      </button>
                      <button className="vp-btn vp-btn-sm vp-btn-ghost" onClick={clear}>
                        ✕ Clear
                      </button>
                    </div>

                    {exportMsg && <div className="vp-export-msg">{exportMsg}</div>}
                  </>
                ) : (
                  <div className="vp-result-placeholder">
                    {isProcessing ? (
                      <span>
                        <span className="vp-spinner" style={{ display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
                        {progressMsg || "Processing…"}
                      </span>
                    ) : stage === "idle" ? (
                      <span>
                        Select a language, upload an image,<br />
                        then click <strong style={{ color: "var(--text)" }}>Extract Text</strong>
                      </span>
                    ) : (
                      <span>No text recognised. Try a clearer image.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Instructions ── */}
          <div className="vp-instructions">
            <div className="vp-instructions-header">
              <span style={{ fontSize: 18 }}>📋</span>
              <span className="vp-instructions-title">How to get best results</span>
            </div>
            <div className="vp-instructions-body">
              {[
                ["Select language first", "Always pick the correct language before scanning. Using the wrong language will produce garbled output."],
                ["Use printed text", "This engine excels at printed/typed text — books, forms, receipts, signboards. Handwriting accuracy is limited."],
                ["Good image quality", "Minimum 300 DPI for scanned documents. Avoid blurry, dark or skewed images. Higher contrast = better results."],
                ["First load downloads data", "Each language downloads ~5–15 MB on first use, then caches in your browser forever. Subsequent uses are instant and offline."],
                ["Edit before exporting", "The result is editable — fix any mistakes before downloading as PDF or Word."],
                ["PDF & Word export", "Both export entirely in your browser with no server. PDF works for all scripts. Word is best for Latin languages."],
              ].map(([title, desc], i) => (
                <div key={i} className="vp-tip">
                  <div className="vp-tip-num">{i + 1}</div>
                  <div className="vp-tip-text">
                    <strong>{title}</strong>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <GoToTopButton />
    </>
  );
}

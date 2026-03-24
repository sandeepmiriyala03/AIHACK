"use client";

/**
 * AksharaDrishti — Multi-Language OCR (Tesseract.js)
 * Light mode. English is always included.
 * User picks 1+ additional languages → combined as "eng+tel" etc.
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

// ── Language list (excludes English — always added automatically) ──
const EXTRA_LANGS: LangOption[] = [
  { value: "ara", label: "Arabic",               group: "Other" },
  { value: "asm", label: "Assamese",             group: "Indic" },
  { value: "ben", label: "Bengali",              group: "Indic" },
  { value: "chi_sim", label: "Chinese (Simplified)", group: "CJK" },
  { value: "chi_tra", label: "Chinese (Traditional)", group: "CJK" },
  { value: "deu", label: "German",               group: "Latin" },
  { value: "fra", label: "French",               group: "Latin" },
  { value: "guj", label: "Gujarati",             group: "Indic" },
  { value: "hin", label: "Hindi",                group: "Indic" },
  { value: "ita", label: "Italian",              group: "Latin" },
  { value: "jpn", label: "Japanese",             group: "CJK" },
  { value: "kan", label: "Kannada",              group: "Indic" },
  { value: "kor", label: "Korean",               group: "CJK" },
  { value: "mal", label: "Malayalam",            group: "Indic" },
  { value: "mar", label: "Marathi",              group: "Indic" },
  { value: "nep", label: "Nepali",               group: "Indic" },
  { value: "nld", label: "Dutch",                group: "Latin" },
  { value: "ori", label: "Odia",                 group: "Indic" },
  { value: "pan", label: "Punjabi",              group: "Indic" },
  { value: "por", label: "Portuguese",           group: "Latin" },
  { value: "rus", label: "Russian",              group: "Other" },
  { value: "san", label: "Sanskrit",             group: "Indic" },
  { value: "spa", label: "Spanish",              group: "Latin" },
  { value: "swe", label: "Swedish",              group: "Latin" },
  { value: "tam", label: "Tamil",                group: "Indic" },
  { value: "tel", label: "Telugu",               group: "Indic" },
  { value: "tha", label: "Thai",                 group: "Other" },
  { value: "tur", label: "Turkish",              group: "Latin" },
  { value: "urd", label: "Urdu",                 group: "Other" },
  { value: "vie", label: "Vietnamese",           group: "Other" },
];

const GROUPS = ["Indic", "Latin", "CJK", "Other"];

// Module-level worker cache (lang-combo → worker)
const _workerCache = new Map<string, unknown>();

export default function AksharaDrishtiPage() {
  // Always includes "eng"; user selects additional ones
  const [extraLangs, setExtraLangs] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Combined language string e.g. "eng+tel+hin"
  const langCombo = ["eng", ...extraLangs].join("+");
  const langLabel = ["English", ...extraLangs.map(v => EXTRA_LANGS.find(l => l.value === v)?.label ?? v)].join(" + ");

  // ── Toggle extra language ─────────────────────────────────
  const toggleLang = (value: string) => {
    setExtraLangs(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    setResult("");
    setStage("idle");
  };

  // ── File handling ─────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(""); setError(""); setStage("idle"); setProgress(0);
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
    setError(""); setResult(""); setProgress(0);

    try {
      const Tesseract = (await import("tesseract.js")).default;
      let worker = _workerCache.get(langCombo) as Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;

      if (!worker) {
        setStage("loading-lang");
        setProgressMsg(`Loading language data: ${langLabel}…`);

        worker = await Tesseract.createWorker(langCombo, 1, {
          langPath: "/tessdata",
          cacheMethod: "write",
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "loading tesseract core") {
              setProgressMsg("Loading OCR engine…");
              setProgress(Math.round(m.progress * 25));
            } else if (m.status === "initializing tesseract") {
              setProgressMsg("Initialising engine…");
              setProgress(25 + Math.round(m.progress * 20));
            } else if (m.status === "loading language traineddata") {
              setProgressMsg(`Downloading language data…`);
              setProgress(45 + Math.round(m.progress * 45));
            } else if (m.status === "initializing api") {
              setProgressMsg("Ready to scan…");
              setProgress(95);
            }
          },
        });
        _workerCache.set(langCombo, worker);
      }

      setStage("recognising");
      setProgressMsg("Scanning image…");
      setProgress(98);

      const { data } = await worker.recognize(file);
      const text = data.text?.trim() ?? "";
      if (!text) throw new Error("No text found. Try a clearer image.");
      setResult(text);
      setStage("done");
      setProgress(100);
      setProgressMsg("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed. Please try again.");
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
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("AksharaDrishti OCR Result", margin, margin);
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
      doc.text(`Languages: ${langLabel}  |  ${new Date().toLocaleDateString()}`, margin, margin + 8);
      doc.setTextColor(0);
      doc.line(margin, margin + 12, margin + pageWidth, margin + 12);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(result, pageWidth);
      let y = margin + 20;
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(line, margin, y); y += 6;
      }
      doc.save(`AksharaDrishti-ocr-${langCombo}-${Date.now()}.pdf`);
      setExportMsg("PDF downloaded!");
    } catch { setExportMsg("PDF export failed."); }
    setTimeout(() => setExportMsg(""), 3000);
  };

  // ── Export: Word ──────────────────────────────────────────
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
            new Paragraph({ text: "AksharaDrishti OCR Result", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ children: [new TextRun({ text: `Languages: ${langLabel}  |  ${new Date().toLocaleDateString()}`, color: "888888", size: 18 })] }),
            new Paragraph({ text: "" }),
            ...paragraphs,
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `AksharaDrishti-ocr-${langCombo}-${Date.now()}.docx`);
      setExportMsg("Word document downloaded!");
    } catch { setExportMsg("Word export failed."); }
    setTimeout(() => setExportMsg(""), 3000);
  };

  const copyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const clear = () => {
    setFile(null); setPreview(null); setResult(""); setError("");
    setStage("idle"); setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isProcessing = stage === "loading-lang" || stage === "recognising";
  const canScan = !!file && !isProcessing;

  const filteredLangs = EXTRA_LANGS.filter(l =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.value.toLowerCase().includes(langSearch.toLowerCase())
  );
  const groupedFiltered = GROUPS.map(g => ({
    group: g,
    langs: filteredLangs.filter(l => l.group === g),
  })).filter(g => g.langs.length > 0);

  return (
    <>
      <Navbar />
      <main>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --bg: #f5f4f0;
            --surface: #ffffff;
            --surface2: #f9f8f5;
            --border: #e2e0d8;
            --border2: #ccc9be;
            --accent: #1a56e8;
            --accent2: #6d28d9;
            --success: #059669;
            --warn: #d97706;
            --danger: #dc2626;
            --text: #1a1a1a;
            --text2: #444340;
            --muted: #7a7870;
            --radius: 14px;
            --shadow: 0 4px 24px rgba(0,0,0,0.08);
            --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);
          }

          body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

          .vp-wrap {
            min-height: 100vh;
            background: var(--bg);
            background-image: radial-gradient(ellipse at 10% 0%, rgba(26,86,232,0.05) 0%, transparent 55%),
                              radial-gradient(ellipse at 90% 100%, rgba(109,40,217,0.04) 0%, transparent 55%);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 48px 16px 100px;
          }

          /* ── Header ── */
          .vp-header {
            text-align: center;
            max-width: 680px;
            margin-bottom: 40px;
            animation: fadeDown 0.5s ease;
          }
          @keyframes fadeDown {
            from { opacity: 0; transform: translateY(-10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .vp-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 600;
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
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
          .vp-title {
            font-family: 'Syne', sans-serif;
            font-size: clamp(2rem, 5.5vw, 3.4rem);
            font-weight: 800;
            line-height: 1.05;
            letter-spacing: -0.03em;
            color: var(--text);
          }
          .vp-title span {
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .vp-subtitle { margin-top: 12px; font-size: 15px; color: var(--muted); line-height: 1.65; }

          .vp-combo-display {
            margin-top: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 16px;
            background: var(--surface);
            border: 1px solid var(--border2);
            border-radius: 99px;
            font-size: 13px;
            color: var(--text2);
            font-weight: 500;
            box-shadow: var(--shadow);
          }
          .vp-combo-display .combo-code {
            font-family: monospace;
            font-size: 11px;
            padding: 2px 8px;
            background: rgba(26,86,232,0.08);
            color: var(--accent);
            border-radius: 6px;
            font-weight: 700;
          }

          /* ── Main layout ── */
          .vp-main {
            width: 100%;
            max-width: 920px;
            display: grid;
            grid-template-columns: 340px 1fr;
            gap: 20px;
            animation: fadeUp 0.5s ease 0.1s both;
          }
          @media (max-width: 760px) { .vp-main { grid-template-columns: 1fr; } }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          /* ── Panel ── */
          .vp-panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          .vp-panel-header {
            padding: 14px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--surface2);
          }
          .vp-panel-title {
            font-family: 'Syne', sans-serif;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--muted);
          }
          .vp-panel-body { padding: 20px; }

          /* ── Language selector ── */
          .vp-lang-section { margin-bottom: 18px; }
          .vp-lang-section-label {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .vp-always-eng {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 12px;
            background: rgba(26,86,232,0.06);
            border: 1px solid rgba(26,86,232,0.2);
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 13px;
            color: var(--accent);
            font-weight: 600;
          }
          .vp-always-eng span { font-size: 11px; color: var(--muted); font-weight: 400; margin-left: auto; }

          .vp-lang-search-input {
            width: 100%;
            padding: 9px 12px;
            border: 1px solid var(--border2);
            border-radius: 8px;
            background: var(--surface2);
            color: var(--text);
            font-size: 13px;
            font-family: 'DM Sans', sans-serif;
            outline: none;
            margin-bottom: 10px;
            transition: border-color 0.2s;
          }
          .vp-lang-search-input:focus { border-color: var(--accent); }

          .vp-lang-grid {
            max-height: 220px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding-right: 2px;
          }
          .vp-lang-grid::-webkit-scrollbar { width: 4px; }
          .vp-lang-grid::-webkit-scrollbar-track { background: transparent; }
          .vp-lang-grid::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

          .vp-lang-group-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--muted);
            padding: 8px 4px 4px;
          }
          .vp-lang-chip {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 7px;
            cursor: pointer;
            transition: background 0.15s;
            font-size: 13px;
            color: var(--text2);
            user-select: none;
          }
          .vp-lang-chip:hover { background: rgba(26,86,232,0.06); }
          .vp-lang-chip.selected {
            background: rgba(26,86,232,0.08);
            color: var(--accent);
            font-weight: 600;
          }
          .vp-lang-chip input[type="checkbox"] {
            width: 14px; height: 14px;
            accent-color: var(--accent);
            cursor: pointer;
          }

          /* ── Drop zone ── */
          .vp-dropzone {
            border: 2px dashed var(--border2);
            border-radius: 12px;
            padding: 28px 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--surface2);
            position: relative;
            margin-top: 4px;
          }
          .vp-dropzone:hover, .vp-dropzone.has-file {
            border-color: var(--accent);
            background: rgba(26,86,232,0.03);
          }
          .vp-dropzone input {
            position: absolute; inset: 0; opacity: 0;
            cursor: pointer; width: 100%; height: 100%;
          }
          .vp-dropzone-icon { font-size: 30px; margin-bottom: 8px; }
          .vp-dropzone-label { font-size: 14px; font-weight: 500; color: var(--text); }
          .vp-dropzone-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }

          /* ── Preview ── */
          .vp-preview {
            margin-top: 12px;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
            background: #f0efec;
            display: flex;
            align-items: center;
            justify-content: center;
            max-height: 180px;
          }
          .vp-preview img { max-width: 100%; max-height: 180px; object-fit: contain; display: block; }

          /* ── Progress ── */
          .vp-progress { margin-top: 12px; }
          .vp-progress-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-bottom: 5px; }
          .vp-track { height: 3px; background: var(--border2); border-radius: 99px; overflow: hidden; }
          .vp-fill {
            height: 100%; border-radius: 99px;
            background: linear-gradient(90deg, var(--accent), var(--accent2));
            transition: width 0.4s ease;
          }

          /* ── Buttons ── */
          .vp-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 11px 20px; border-radius: 9px;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px; font-weight: 500;
            cursor: pointer; transition: all 0.18s;
            border: none; outline: none;
          }
          .vp-btn-primary {
            background: var(--accent); color: #fff;
            width: 100%; justify-content: center; margin-top: 12px;
          }
          .vp-btn-primary:hover:not(:disabled) {
            background: #1a4fd4;
            transform: translateY(-1px);
            box-shadow: 0 4px 18px rgba(26,86,232,0.3);
          }
          .vp-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
          .vp-btn-sm { padding: 7px 14px; font-size: 12px; border-radius: 7px; }
          .vp-btn-ghost {
            background: transparent; color: var(--muted);
            border: 1px solid var(--border2);
          }
          .vp-btn-ghost:hover { color: var(--text); border-color: var(--accent); }
          .vp-btn-success {
            background: rgba(5,150,105,0.08); color: var(--success);
            border: 1px solid rgba(5,150,105,0.2);
          }
          .vp-btn-success:hover { background: rgba(5,150,105,0.14); }
          .vp-btn-purple {
            background: rgba(109,40,217,0.08); color: var(--accent2);
            border: 1px solid rgba(109,40,217,0.2);
          }
          .vp-btn-purple:hover { background: rgba(109,40,217,0.14); }
          .vp-btn-blue {
            background: rgba(26,86,232,0.08); color: var(--accent);
            border: 1px solid rgba(26,86,232,0.2);
          }
          .vp-btn-blue:hover { background: rgba(26,86,232,0.14); }

          /* ── Spinner ── */
          .vp-spinner {
            width: 14px; height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            flex-shrink: 0;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* ── Error ── */
          .vp-error {
            margin-top: 10px;
            padding: 10px 14px;
            border-radius: 9px;
            background: rgba(220,38,38,0.06);
            border: 1px solid rgba(220,38,38,0.18);
            color: var(--danger);
            font-size: 13px;
            line-height: 1.5;
          }

          /* ── Result ── */
          .vp-result-area {
            width: 100%; min-height: 200px;
            background: var(--surface2); border: 1px solid var(--border2);
            border-radius: 10px; padding: 14px;
            color: var(--text); font-size: 14px; line-height: 1.75;
            resize: vertical; font-family: 'DM Sans', sans-serif;
            outline: none; white-space: pre-wrap; word-break: break-word;
          }
          .vp-result-area:focus { border-color: var(--accent); }
          .vp-result-placeholder {
            width: 100%; min-height: 200px;
            background: var(--surface2); border: 1px dashed var(--border2);
            border-radius: 10px; padding: 14px;
            color: var(--muted); font-size: 13px;
            display: flex; align-items: center; justify-content: center;
            text-align: center; line-height: 1.65;
          }
          .vp-result-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
          .vp-export-msg { font-size: 12px; color: var(--success); padding: 6px 0; }
          .vp-stats { display: flex; gap: 16px; margin-top: 8px; }
          .vp-stat { font-size: 11px; color: var(--muted); }
          .vp-stat strong { color: var(--text2); font-weight: 600; }

          /* ── Tips ── */
          .vp-tips {
            width: 100%; max-width: 920px; margin-top: 20px;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: var(--radius); box-shadow: var(--shadow);
            overflow: hidden;
            animation: fadeUp 0.5s ease 0.2s both;
          }
          .vp-tips-header {
            padding: 14px 22px; border-bottom: 1px solid var(--border);
            display: flex; align-items: center; gap: 10px;
            background: var(--surface2);
          }
          .vp-tips-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text); }
          .vp-tips-body {
            padding: 18px 22px;
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;
          }
          .vp-tip { display: flex; gap: 12px; align-items: flex-start; }
          .vp-tip-num {
            flex-shrink: 0; width: 22px; height: 22px;
            border-radius: 50%; background: rgba(26,86,232,0.1);
            color: var(--accent); font-size: 11px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
          }
          .vp-tip-text { font-size: 12px; color: var(--muted); line-height: 1.55; }
          .vp-tip-text strong { color: var(--text2); display: block; margin-bottom: 2px; font-weight: 600; font-size: 13px; }

          @media (max-width: 540px) {
            .vp-panel-body { padding: 14px; }
            .vp-tips-body { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="vp-wrap">
          {/* ── Header ── */}
          <header className="vp-header">
          
            <h1 className="vp-title"> Akshara<span>Drishti</span></h1>
  <p className="vp-subtitle">Multi-Language OCR</p>
            <p className="vp-subtitle">
              Extract text from images combining English with any other language.<br />
              Runs entirely in your browser — no server, fully offline after first load.
            </p>
            <div className="vp-combo-display">
              Active combo:&nbsp;
              <span className="combo-code">{langCombo}</span>
              &nbsp;→ {langLabel}
            </div>
          </header>
   {/* ── Tips ── */}
          <div className="vp-tips">
            <div className="vp-tips-header">
              <span style={{ fontSize: 18 }}>💡</span>
              <span className="vp-tips-title">Multi-language OCR tips</span>
            </div>
            
            <div className="vp-tips-body">
              {[
                ["English is always the base", "Every scan includes English. Add Telugu, Hindi, etc. for bilingual documents like Panchanga posters."],
                ["Combine 2–3 max", "More languages = slower + more memory. For best accuracy stick to the languages actually in your image."],
                ["Tesseract combo syntax", "Languages are joined as eng+tel, eng+hin+tam etc. — this is passed directly to the Tesseract engine."],
                ["First load per combo", "Each unique combo (eng+tel vs eng+hin) downloads and caches separately. After first load it runs offline."],
                ["Edit before exporting", "OCR output is editable. Fix any mistakes, then export as PDF or Word."],
                ["Good image quality", "High contrast, min 300 DPI, straight alignment gives best results with multi-script documents."],
              ].map(([title, desc], i) => (
                <div key={i} className="vp-tip">
                  <div className="vp-tip-num">{i + 1}</div>
                  <div className="vp-tip-text"><strong>{title}</strong>{desc}</div>
                </div>
              ))}
            </div>
          </div>
          {/* ── Main grid ── */}
          <div className="vp-main">

            {/* ── Left panel: Language + Upload ── */}
            <div className="vp-panel">
              <div className="vp-panel-header">
                <span className="vp-panel-title">Input</span>
                {file && (
                  <button className="vp-btn vp-btn-sm vp-btn-ghost" onClick={clear}>✕ Clear</button>
                )}
              </div>
              <div className="vp-panel-body">

                {/* Language selector */}
                <div className="vp-lang-section">
                  <div className="vp-lang-section-label">
                    <span>Languages</span>
                    {extraLangs.length > 0 && (
                      <button
                        style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}
                        onClick={() => { setExtraLangs([]); setResult(""); setStage("idle"); }}
                      >
                        clear extra
                      </button>
                    )}
                  </div>

                  {/* Always English */}
                  <div className="vp-always-eng">
                    <span>🇬🇧</span> English (always included)
                    <span>base language</span>
                  </div>

                  {/* Search */}
                  <input
                    className="vp-lang-search-input"
                    placeholder="Search extra language…"
                    value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                  />

                  {/* Grouped checkboxes */}
                  <div className="vp-lang-grid">
                    {groupedFiltered.map(({ group, langs }) => (
                      <div key={group}>
                        <div className="vp-lang-group-label">{group}</div>
                        {langs.map(l => (
                          <label
                            key={l.value}
                            className={`vp-lang-chip ${extraLangs.includes(l.value) ? "selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={extraLangs.includes(l.value)}
                              onChange={() => toggleLang(l.value)}
                            />
                            {l.label}
                            {extraLangs.includes(l.value) && (
                              <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(26,86,232,0.1)", color: "var(--accent)", padding: "1px 6px", borderRadius: 99 }}>
                                {l.value}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drop zone */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Image
                </div>
                <div
                  ref={dropRef}
                  className={`vp-dropzone ${file ? "has-file" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef} type="file" accept="image/*"
                    onChange={onInputChange} onClick={e => e.stopPropagation()}
                  />
                  <div className="vp-dropzone-icon">{file ? "🖼️" : "📷"}</div>
                  <div className="vp-dropzone-label">{file ? file.name : "Drop image or click to upload"}</div>
                  <div className="vp-dropzone-sub">{file ? "Click to change" : "PNG, JPG, WEBP, TIFF"}</div>
                </div>

                {preview && (
                  <div className="vp-preview">
                    <Image src={preview} alt="Preview" width={400} height={300}
                      style={{ maxWidth: "100%", height: "auto" }} />
                  </div>
                )}

                {isProcessing && (
                  <div className="vp-progress">
                    <div className="vp-progress-row">
                      <span>{progressMsg}</span><span>{progress}%</span>
                    </div>
                    <div className="vp-track">
                      <div className="vp-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <button className="vp-btn vp-btn-primary" onClick={runOCR} disabled={!canScan}>
                  {isProcessing ? (
                    <><span className="vp-spinner" />{stage === "loading-lang" ? "Loading languages…" : "Scanning…"}</>
                  ) : (
                    `◈  Extract Text — ${langCombo}`
                  )}
                </button>

                {error && <div className="vp-error">⚠ {error}</div>}
              </div>
            </div>

            {/* ── Right: Result ── */}
            <div className="vp-panel">
              <div className="vp-panel-header">
                <span className="vp-panel-title">Result</span>
                {result && (
                  <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>
                    ✓ {langLabel}
                  </span>
                )}
              </div>
              <div className="vp-panel-body">
                {result ? (
                  <>
                    <textarea
                      className="vp-result-area"
                      value={result}
                      onChange={e => setResult(e.target.value)}
                      spellCheck={false}
                    />
                    <div className="vp-stats">
                      <span className="vp-stat"><strong>{result.split(/\s+/).filter(Boolean).length}</strong> words</span>
                      <span className="vp-stat"><strong>{result.length}</strong> chars</span>
                      <span className="vp-stat"><strong>{result.split("\n").filter(Boolean).length}</strong> lines</span>
                    </div>
                    <div className="vp-result-actions">
                      <button className="vp-btn vp-btn-sm vp-btn-blue" onClick={copyText}>
                        {copied ? "✓ Copied!" : "⎘ Copy"}
                      </button>
                      <button className="vp-btn vp-btn-sm vp-btn-success" onClick={exportPDF}>↓ PDF</button>
                      <button className="vp-btn vp-btn-sm vp-btn-purple" onClick={exportWord}>↓ Word</button>
                      <button className="vp-btn vp-btn-sm vp-btn-ghost" onClick={clear}>✕ Clear</button>
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
                    ) : (
                      <span>
                        Select languages (English + any others),<br />
                        upload an image, then click<br />
                        <strong style={{ color: "var(--text)" }}>Extract Text</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

       
        </div>
      </main>
      <GoToTopButton />
    </>
  );
}
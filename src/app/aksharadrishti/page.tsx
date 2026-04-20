export const dynamic = 'force-dynamic';
"use client";

/**
 * AksharaDrishti — Multi-Language OCR (Tesseract.js)
 * Output: Copy text + Download as PNG image with Noto font per language
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import Image from "next/image";

interface LangOption {
  value: string;
  label: string;
  group: string;
  notoFont: string;       // Google Fonts family name
  notoUrl: string;        // Google Fonts CSS URL
}

type Stage = "idle" | "loading-lang" | "recognising" | "done" | "error";

// ── Noto font map per language ─────────────────────────────────
const EXTRA_LANGS: LangOption[] = [
  { value: "ara", label: "Arabic",                group: "Other", notoFont: "Noto Sans Arabic",     notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic&display=swap" },
  { value: "asm", label: "Assamese",              group: "Indic", notoFont: "Noto Sans Bengali",    notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali&display=swap" },
  { value: "ben", label: "Bengali",               group: "Indic", notoFont: "Noto Sans Bengali",    notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali&display=swap" },
  { value: "chi_sim", label: "Chinese (Simplified)", group: "CJK", notoFont: "Noto Sans SC",        notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap" },
  { value: "chi_tra", label: "Chinese (Traditional)", group: "CJK", notoFont: "Noto Sans TC",       notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC&display=swap" },
  { value: "deu", label: "German",                group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "fra", label: "French",                group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "guj", label: "Gujarati",              group: "Indic", notoFont: "Noto Sans Gujarati",   notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati&display=swap" },
  { value: "hin", label: "Hindi",                 group: "Indic", notoFont: "Noto Sans Devanagari", notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap" },
  { value: "ita", label: "Italian",               group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "jpn", label: "Japanese",              group: "CJK",   notoFont: "Noto Sans JP",         notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap" },
  { value: "kan", label: "Kannada",               group: "Indic", notoFont: "Noto Sans Kannada",    notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada&display=swap" },
  { value: "kor", label: "Korean",                group: "CJK",   notoFont: "Noto Sans KR",         notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap" },
  { value: "mal", label: "Malayalam",             group: "Indic", notoFont: "Noto Sans Malayalam",  notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam&display=swap" },
  { value: "mar", label: "Marathi",               group: "Indic", notoFont: "Noto Sans Devanagari", notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap" },
  { value: "nep", label: "Nepali",                group: "Indic", notoFont: "Noto Sans Devanagari", notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap" },
  { value: "nld", label: "Dutch",                 group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "ori", label: "Odia",                  group: "Indic", notoFont: "Noto Sans Oriya",      notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Oriya&display=swap" },
  { value: "pan", label: "Punjabi",               group: "Indic", notoFont: "Noto Sans Gurmukhi",   notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi&display=swap" },
  { value: "por", label: "Portuguese",            group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "rus", label: "Russian",               group: "Other", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "san", label: "Sanskrit",              group: "Indic", notoFont: "Noto Sans Devanagari", notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari&display=swap" },
  { value: "spa", label: "Spanish",               group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "swe", label: "Swedish",               group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "tam", label: "Tamil",                 group: "Indic", notoFont: "Noto Sans Tamil",      notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil&display=swap" },
  { value: "tel", label: "Telugu",                group: "Indic", notoFont: "Noto Sans Telugu",     notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu&display=swap" },
  { value: "tha", label: "Thai",                  group: "Other", notoFont: "Noto Sans Thai",       notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Thai&display=swap" },
  { value: "tur", label: "Turkish",               group: "Latin", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
  { value: "urd", label: "Urdu",                  group: "Other", notoFont: "Noto Nastaliq Urdu",   notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" },
  { value: "vie", label: "Vietnamese",            group: "Other", notoFont: "Noto Sans",            notoUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" },
];

const GROUPS = ["Indic", "Latin", "CJK", "Other"];
const FONT_SIZES = [14, 16, 18, 20, 24, 28, 32];
const _workerCache = new Map<string, unknown>();

// ── Load a Google Font into the document dynamically ──────────
const loadedFonts = new Set<string>();
function loadGoogleFont(url: string) {
  if (loadedFonts.has(url) || typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
  loadedFonts.add(url);
}

// ── Resolve the best font for the active combo ────────────────
function resolveFont(extraLangs: string[]): { family: string; url: string } {
  if (extraLangs.length === 0) return { family: "Noto Sans", url: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" };
  const primary = EXTRA_LANGS.find(l => l.value === extraLangs[0]);
  return primary
    ? { family: primary.notoFont, url: primary.notoUrl }
    : { family: "Noto Sans", url: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" };
}

// ── Draw text on canvas → download PNG ───────────────────────
async function downloadAsImage(
  text: string,
  fontFamily: string,
  fontSize: number,
  langLabel: string
) {
  const PADDING = 40;
  const LINE_HEIGHT = fontSize * 1.7;
  const MAX_WIDTH = 900;

  // Measure & wrap
  const measureCanvas = document.createElement("canvas");
  const mCtx = measureCanvas.getContext("2d")!;
  mCtx.font = `${fontSize}px "${fontFamily}", "Noto Sans", sans-serif`;

  const rawLines = text.split("\n");
  const wrappedLines: string[] = [];
  for (const raw of rawLines) {
    if (!raw.trim()) { wrappedLines.push(""); continue; }
    const words = raw.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (mCtx.measureText(test).width > MAX_WIDTH - PADDING * 2) {
        if (line) wrappedLines.push(line);
        line = word;
      } else { line = test; }
    }
    if (line) wrappedLines.push(line);
  }

  // Header lines
  const headerFont = `bold 13px "DM Sans", sans-serif`;
  const headerText = `AksharaDrishti OCR  ·  ${langLabel}  ·  ${new Date().toLocaleDateString("en-IN")}`;

  const W = MAX_WIDTH;
  const H = PADDING + 32 + 12 + wrappedLines.length * LINE_HEIGHT + PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = W * 2;   // 2x for retina
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = "#1a56e8";
  ctx.fillRect(0, 0, W, 4);

  // Header
  ctx.font = headerFont;
  ctx.fillStyle = "#7a7870";
  ctx.fillText(headerText, PADDING, 28);

  // Separator
  ctx.strokeStyle = "#e2e0d8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, 38); ctx.lineTo(W - PADDING, 38);
  ctx.stroke();

  // Body text
  ctx.font = `${fontSize}px "${fontFamily}", "Noto Sans", sans-serif`;
  ctx.fillStyle = "#1a1a1a";
  let y = 38 + 12 + fontSize;
  for (const line of wrappedLines) {
    ctx.fillText(line, PADDING, y);
    y += LINE_HEIGHT;
  }

  // Footer
  ctx.font = `11px "DM Sans", sans-serif`;
  ctx.fillStyle = "#ccc9be";
  ctx.fillText("Generated by AksharaDrishti", PADDING, H - 14);

  // Download
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `aksharadrishti-${Date.now()}.png`;
  a.click();
}

export default function AksharaDrishtiPage() {
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
  const [fontSize, setFontSize] = useState(18);
  const [dlMsg, setDlMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const langCombo = ["eng", ...extraLangs].join("+");
  const langLabel = ["English", ...extraLangs.map(v => EXTRA_LANGS.find(l => l.value === v)?.label ?? v)].join(" + ");
  const activeFont = resolveFont(extraLangs);

  // Load Noto font whenever extra langs change
  useEffect(() => {
    loadGoogleFont("https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap");
    if (extraLangs.length > 0) loadGoogleFont(activeFont.url);
  }, [extraLangs, activeFont.url]);

  const toggleLang = (value: string) => {
    setExtraLangs(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    setResult(""); setStage("idle");
  };

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f); setPreview(URL.createObjectURL(f));
    setResult(""); setError(""); setStage("idle"); setProgress(0);
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  };

  useEffect(() => {
    const el = dropRef.current; if (!el) return;
    const prevent = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handleFile(f); };
    el.addEventListener("dragover", prevent); el.addEventListener("drop", onDrop);
    return () => { el.removeEventListener("dragover", prevent); el.removeEventListener("drop", onDrop); };
  }, [handleFile]);

  const runOCR = async () => {
    if (!file) return;
    setError(""); setResult(""); setProgress(0);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      let worker = _workerCache.get(langCombo) as Awaited<ReturnType<typeof Tesseract.createWorker>> | undefined;
      if (!worker) {
        setStage("loading-lang");
        setProgressMsg(`Loading: ${langLabel}…`);
        worker = await Tesseract.createWorker(langCombo, 1, {
          langPath: "/tessdata",
          cacheMethod: "write",
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "loading tesseract core")            { setProgressMsg("Loading OCR engine…");         setProgress(Math.round(m.progress * 25)); }
            else if (m.status === "initializing tesseract")       { setProgressMsg("Initialising engine…");        setProgress(25 + Math.round(m.progress * 20)); }
            else if (m.status === "loading language traineddata")  { setProgressMsg("Downloading language data…"); setProgress(45 + Math.round(m.progress * 45)); }
            else if (m.status === "initializing api")             { setProgressMsg("Ready…");                      setProgress(95); }
          },
        });
        _workerCache.set(langCombo, worker);
      }
      setStage("recognising"); setProgressMsg("Scanning image…"); setProgress(98);
      const { data } = await worker.recognize(file);
      const text = data.text?.trim() ?? "";
      if (!text) throw new Error("No text found. Try a clearer image.");
      setResult(text); setStage("done"); setProgress(100); setProgressMsg("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed."); setStage("error");
    }
  };

  const copyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleDownload = async () => {
    if (!result) return;
    setDlMsg("Generating image…");
    // Wait a tick so font is (likely) loaded
    await new Promise(r => setTimeout(r, 300));
    await downloadAsImage(result, activeFont.family, fontSize, langLabel);
    setDlMsg("Image downloaded!");
    setTimeout(() => setDlMsg(""), 3000);
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
    group: g, langs: filteredLangs.filter(l => l.group === g),
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
            --danger: #dc2626;
            --text: #1a1a1a;
            --text2: #444340;
            --muted: #7a7870;
            --radius: 14px;
            --shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

          .ad-wrap {
            min-height: 100vh; background: var(--bg);
            background-image: radial-gradient(ellipse at 10% 0%, rgba(26,86,232,0.05) 0%, transparent 55%),
                              radial-gradient(ellipse at 90% 100%, rgba(109,40,217,0.04) 0%, transparent 55%);
            display: flex; flex-direction: column; align-items: center;
            padding: 48px 16px 100px;
          }

          /* Header */
          .ad-header { text-align: center; max-width: 680px; margin-bottom: 36px; animation: fadeDown 0.5s ease; }
          @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
          .ad-title { font-family:'Syne',sans-serif; font-size:clamp(2rem,5.5vw,3.2rem); font-weight:800; letter-spacing:-0.03em; color:var(--text); }
          .ad-title span { background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
          .ad-sub { margin-top:8px; font-size:14px; color:var(--muted); line-height:1.6; }
          .ad-combo {
            margin-top:14px; display:inline-flex; align-items:center; gap:8px;
            padding:6px 16px; background:var(--surface); border:1px solid var(--border2);
            border-radius:99px; font-size:13px; color:var(--text2); font-weight:500;
            box-shadow:var(--shadow);
          }
          .ad-combo code { font-family:monospace; font-size:11px; padding:2px 8px; background:rgba(26,86,232,0.08); color:var(--accent); border-radius:6px; font-weight:700; }

          /* Tips */
          .ad-tips {
            width:100%; max-width:920px; margin-bottom:20px;
            background:var(--surface); border:1px solid var(--border); border-radius:var(--radius);
            box-shadow:var(--shadow); overflow:hidden; animation:fadeUp 0.5s ease 0.05s both;
          }
          .ad-tips-hdr { padding:12px 20px; border-bottom:1px solid var(--border); background:var(--surface2); display:flex; align-items:center; gap:8px; }
          .ad-tips-title { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; color:var(--text); }
          .ad-tips-body { padding:14px 20px; display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; }
          .ad-tip { display:flex; gap:10px; align-items:flex-start; }
          .ad-tip-n { flex-shrink:0; width:20px; height:20px; border-radius:50%; background:rgba(26,86,232,0.1); color:var(--accent); font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }
          .ad-tip-t { font-size:12px; color:var(--muted); line-height:1.5; }
          .ad-tip-t strong { color:var(--text2); display:block; margin-bottom:2px; font-weight:600; font-size:12px; }

          /* Main grid */
          .ad-main { width:100%; max-width:920px; display:grid; grid-template-columns:320px 1fr; gap:20px; animation:fadeUp 0.5s ease 0.1s both; }
          @media(max-width:760px){ .ad-main{ grid-template-columns:1fr; } }
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

          /* Panel */
          .ad-panel { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; box-shadow:var(--shadow); }
          .ad-panel-hdr { padding:12px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; background:var(--surface2); }
          .ad-panel-title { font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
          .ad-panel-body { padding:18px; }

          /* Lang */
          .ad-always-eng { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(26,86,232,0.06); border:1px solid rgba(26,86,232,0.2); border-radius:8px; margin-bottom:10px; font-size:13px; color:var(--accent); font-weight:600; }
          .ad-always-eng em { font-size:11px; color:var(--muted); font-weight:400; font-style:normal; margin-left:auto; }
          .ad-lang-lbl { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; }
          .ad-search { width:100%; padding:8px 12px; border:1px solid var(--border2); border-radius:8px; background:var(--surface2); color:var(--text); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; margin-bottom:8px; transition:border-color .2s; }
          .ad-search:focus { border-color:var(--accent); }
          .ad-lang-grid { max-height:200px; overflow-y:auto; display:flex; flex-direction:column; gap:1px; }
          .ad-lang-grid::-webkit-scrollbar{ width:4px } .ad-lang-grid::-webkit-scrollbar-thumb{ background:var(--border2); border-radius:99px }
          .ad-grp-lbl { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); padding:7px 4px 3px; }
          .ad-chip { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:7px; cursor:pointer; font-size:13px; color:var(--text2); user-select:none; transition:background .15s; }
          .ad-chip:hover { background:rgba(26,86,232,0.06); }
          .ad-chip.sel { background:rgba(26,86,232,0.08); color:var(--accent); font-weight:600; }
          .ad-chip input[type=checkbox]{ width:14px; height:14px; accent-color:var(--accent); cursor:pointer; }
          .ad-chip-tag { margin-left:auto; font-size:10px; background:rgba(26,86,232,0.1); color:var(--accent); padding:1px 6px; border-radius:99px; }

          /* Font size */
          .ad-font-row { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
          .ad-font-lbl { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
          .ad-font-btn { padding:4px 10px; border-radius:6px; font-size:12px; font-family:'DM Sans',sans-serif; border:1px solid var(--border2); background:var(--surface2); color:var(--text2); cursor:pointer; transition:all .15s; }
          .ad-font-btn.active { background:rgba(26,86,232,0.1); color:var(--accent); border-color:rgba(26,86,232,0.3); font-weight:600; }
          .ad-font-btn:hover:not(.active){ border-color:var(--accent); }

          /* Dropzone */
          .ad-drop { border:2px dashed var(--border2); border-radius:12px; padding:24px 16px; text-align:center; cursor:pointer; transition:all .2s; background:var(--surface2); position:relative; }
          .ad-drop:hover,.ad-drop.has{ border-color:var(--accent); background:rgba(26,86,232,0.03); }
          .ad-drop input{ position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
          .ad-drop-icon{ font-size:28px; margin-bottom:6px; }
          .ad-drop-lbl{ font-size:13px; font-weight:500; color:var(--text); }
          .ad-drop-sub{ font-size:11px; color:var(--muted); margin-top:3px; }

          /* Preview */
          .ad-preview{ margin-top:10px; border-radius:10px; overflow:hidden; border:1px solid var(--border); background:#f0efec; display:flex; align-items:center; justify-content:center; max-height:160px; }
          .ad-preview img{ max-width:100%; max-height:160px; object-fit:contain; display:block; }

          /* Progress */
          .ad-prog{ margin-top:10px; }
          .ad-prog-row{ display:flex; justify-content:space-between; font-size:11px; color:var(--muted); margin-bottom:4px; }
          .ad-track{ height:3px; background:var(--border2); border-radius:99px; overflow:hidden; }
          .ad-fill{ height:100%; border-radius:99px; background:linear-gradient(90deg,var(--accent),var(--accent2)); transition:width .4s ease; }

          /* Buttons */
          .ad-btn{ display:inline-flex; align-items:center; gap:7px; padding:10px 18px; border-radius:9px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all .18s; border:none; outline:none; }
          .ad-btn-primary{ background:var(--accent); color:#fff; width:100%; justify-content:center; margin-top:10px; }
          .ad-btn-primary:hover:not(:disabled){ background:#1a4fd4; transform:translateY(-1px); box-shadow:0 4px 18px rgba(26,86,232,.3); }
          .ad-btn-primary:disabled{ opacity:.35; cursor:not-allowed; transform:none; }
          .ad-btn-sm{ padding:7px 14px; font-size:12px; border-radius:7px; }
          .ad-btn-ghost{ background:transparent; color:var(--muted); border:1px solid var(--border2); }
          .ad-btn-ghost:hover{ color:var(--text); border-color:var(--accent); }
          .ad-btn-blue{ background:rgba(26,86,232,0.08); color:var(--accent); border:1px solid rgba(26,86,232,0.2); }
          .ad-btn-blue:hover{ background:rgba(26,86,232,0.14); }
          .ad-btn-green{ background:rgba(5,150,105,0.08); color:var(--success); border:1px solid rgba(5,150,105,0.2); }
          .ad-btn-green:hover{ background:rgba(5,150,105,0.14); }

          /* Spinner */
          .ad-spin{ width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
          @keyframes spin{ to{transform:rotate(360deg)} }

          /* Error */
          .ad-err{ margin-top:10px; padding:10px 14px; border-radius:9px; background:rgba(220,38,38,0.06); border:1px solid rgba(220,38,38,0.18); color:var(--danger); font-size:13px; line-height:1.5; }

          /* Result */
          .ad-result-area {
            width:100%; min-height:220px;
            background:var(--surface2); border:1px solid var(--border2); border-radius:10px;
            padding:16px; color:var(--text); line-height:1.8;
            resize:vertical; outline:none; white-space:pre-wrap; word-break:break-word;
            font-family: var(--preview-font, 'Noto Sans', sans-serif);
          }
          .ad-result-area:focus{ border-color:var(--accent); }
          .ad-placeholder{ width:100%; min-height:220px; background:var(--surface2); border:1px dashed var(--border2); border-radius:10px; padding:14px; color:var(--muted); font-size:13px; display:flex; align-items:center; justify-content:center; text-align:center; line-height:1.65; }
          .ad-actions{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; align-items:center; }
          .ad-dl-msg{ font-size:12px; color:var(--success); padding:4px 0; }
          .ad-stats{ display:flex; gap:14px; margin-top:8px; }
          .ad-stat{ font-size:11px; color:var(--muted); } .ad-stat strong{ color:var(--text2); font-weight:600; }

          /* Font info badge */
          .ad-font-badge{ font-size:11px; color:var(--muted); padding:4px 10px; background:var(--surface2); border:1px solid var(--border); border-radius:99px; }

          @media(max-width:540px){ .ad-panel-body{ padding:14px; } .ad-tips-body{ grid-template-columns:1fr; } }
        `}</style>

        <div className="ad-wrap">

          {/* Header */}
          <header className="ad-header">
            <h1 className="ad-title">Akshara<span>Drishti</span></h1>
            <p className="ad-sub">Multi-Language OCR — English + any script, download as image</p>
            <div className="ad-combo">
              Active:&nbsp;<code>{langCombo}</code>&nbsp;·&nbsp;{langLabel}
            </div>
          </header>

          {/* Tips */}
          <div className="ad-tips">
            <div className="ad-tips-hdr">
              <span style={{fontSize:16}}>💡</span>
              <span className="ad-tips-title">How to use</span>
            </div>
            <div className="ad-tips-body">
              {[
                ["English is always base", "Every scan includes English. Tick extra scripts like Telugu, Hindi for bilingual images."],
                ["Pick 1–2 extra languages", "More languages = slower. Only tick what's actually in your image."],
                ["Set font size", "Choose a font size before downloading — the image uses the correct Noto script font."],
                ["Download as PNG", "Output is a clean image with the right script font — share directly or paste anywhere."],
              ].map(([t,d],i) => (
                <div key={i} className="ad-tip">
                  <div className="ad-tip-n">{i+1}</div>
                  <div className="ad-tip-t"><strong>{t}</strong>{d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main grid */}
          <div className="ad-main">

            {/* Left: Input */}
            <div className="ad-panel">
              <div className="ad-panel-hdr">
                <span className="ad-panel-title">Input</span>
                {file && <button className="ad-btn ad-btn-sm ad-btn-ghost" onClick={clear}>✕ Clear</button>}
              </div>
              <div className="ad-panel-body">

                {/* Language */}
                <div className="ad-lang-lbl">
                  <span>Languages</span>
                  {extraLangs.length > 0 && (
                    <button style={{fontSize:11,color:"var(--muted)",cursor:"pointer",background:"none",border:"none",textDecoration:"underline"}}
                      onClick={()=>{setExtraLangs([]);setResult("");setStage("idle");}}>
                      clear extra
                    </button>
                  )}
                </div>
                <div className="ad-always-eng">
                  🇬🇧 English (always included) <em>base</em>
                </div>
                <input className="ad-search" placeholder="Search language…" value={langSearch} onChange={e=>setLangSearch(e.target.value)} />
                <div className="ad-lang-grid">
                  {groupedFiltered.map(({group,langs})=>(
                    <div key={group}>
                      <div className="ad-grp-lbl">{group}</div>
                      {langs.map(l=>(
                        <label key={l.value} className={`ad-chip ${extraLangs.includes(l.value)?"sel":""}`}>
                          <input type="checkbox" checked={extraLangs.includes(l.value)} onChange={()=>toggleLang(l.value)} />
                          {l.label}
                          {extraLangs.includes(l.value) && <span className="ad-chip-tag">{l.value}</span>}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{borderTop:"1px solid var(--border)",margin:"14px 0"}} />

                {/* Image upload */}
                <div style={{fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Image</div>
                <div ref={dropRef} className={`ad-drop ${file?"has":""}`} onClick={()=>fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onInputChange} onClick={e=>e.stopPropagation()} />
                  <div className="ad-drop-icon">{file?"🖼️":"📷"}</div>
                  <div className="ad-drop-lbl">{file?file.name:"Drop image or click to upload"}</div>
                  <div className="ad-drop-sub">{file?"Click to change":"PNG, JPG, WEBP, TIFF"}</div>
                </div>

                {preview && (
                  <div className="ad-preview">
                    <Image src={preview} alt="Preview" width={400} height={300} style={{maxWidth:"100%",height:"auto"}} />
                  </div>
                )}

                {isProcessing && (
                  <div className="ad-prog">
                    <div className="ad-prog-row"><span>{progressMsg}</span><span>{progress}%</span></div>
                    <div className="ad-track"><div className="ad-fill" style={{width:`${progress}%`}} /></div>
                  </div>
                )}

                <button className="ad-btn ad-btn-primary" onClick={runOCR} disabled={!canScan}>
                  {isProcessing
                    ? <><span className="ad-spin"/>{stage==="loading-lang"?"Loading languages…":"Scanning…"}</>
                    : `◈  Extract Text — ${langCombo}`}
                </button>
                {error && <div className="ad-err">⚠ {error}</div>}
              </div>
            </div>

            {/* Right: Result */}
            <div className="ad-panel">
              <div className="ad-panel-hdr">
                <span className="ad-panel-title">Result</span>
                {result && <span style={{fontSize:11,color:"var(--success)",fontWeight:600}}>✓ {langLabel}</span>}
              </div>
              <div className="ad-panel-body">

                {/* Font size picker — always visible when there's a result */}
                {result && (
                  <>
                    <div style={{marginBottom:10}}>
                      <div className="ad-font-lbl" style={{marginBottom:6}}>Font size for download</div>
                      <div className="ad-font-row">
                        {FONT_SIZES.map(s=>(
                          <button key={s} className={`ad-font-btn ${fontSize===s?"active":""}`} onClick={()=>setFontSize(s)}>{s}px</button>
                        ))}
                      </div>
                      <span className="ad-font-badge">🔤 {activeFont.family}</span>
                    </div>
                  </>
                )}

                {result ? (
                  <>
                    <textarea
                      className="ad-result-area"
                      value={result}
                      onChange={e=>setResult(e.target.value)}
                      spellCheck={false}
                      style={{
                        fontSize: `${fontSize}px`,
                        fontFamily: `"${activeFont.family}", "Noto Sans", sans-serif`,
                      }}
                    />
                    <div className="ad-stats">
                      <span className="ad-stat"><strong>{result.split(/\s+/).filter(Boolean).length}</strong> words</span>
                      <span className="ad-stat"><strong>{result.length}</strong> chars</span>
                      <span className="ad-stat"><strong>{result.split("\n").filter(Boolean).length}</strong> lines</span>
                    </div>
                    <div className="ad-actions">
                      <button className="ad-btn ad-btn-sm ad-btn-blue" onClick={copyText}>
                        {copied?"✓ Copied!":"⎘ Copy text"}
                      </button>
                      <button className="ad-btn ad-btn-sm ad-btn-green" onClick={handleDownload}>
                        ↓ Download PNG
                      </button>
                      <button className="ad-btn ad-btn-sm ad-btn-ghost" onClick={clear}>✕ Clear</button>
                    </div>
                    {dlMsg && <div className="ad-dl-msg">{dlMsg}</div>}
                  </>
                ) : (
                  <div className="ad-placeholder">
                    {isProcessing ? (
                      <span>
                        <span className="ad-spin" style={{display:"inline-block",marginRight:8,verticalAlign:"middle"}} />
                        {progressMsg||"Processing…"}
                      </span>
                    ) : (
                      <span>
                        Select languages, upload an image,<br/>
                        then click <strong style={{color:"var(--text)"}}>Extract Text</strong>.<br/>
                        <span style={{fontSize:12,marginTop:6,display:"block"}}>Output can be copied or downloaded as PNG.</span>
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

"use client";
// ============================================================
// వేద సంకలనం — Veda Digitization Page
// Telugu-only OCR + pitch marking + book/section/mantra mgmt
// Drop this file at: app/vedha/page.tsx
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import Navbar from "@/components/Navbar";
// ── Types ────────────────────────────────────────────────────
interface Syllable { char: string; pitch?: "high" | "low" | "svarita" | "dirgha"; }
interface MantraLine { syllables: Syllable[]; }
interface Mantra { title: string; description: string; lines: MantraLine[]; }
interface Section { title: string; mantras: Record<string, Mantra>; }
interface Book { title: string; sections: Record<string, Section>; }
type AllBooks = Record<string, Book>;

type PitchType = "high" | "low" | "svarita" | "dirgha";
type StepId = "book" | "section" | "ocr" | "view";

// ── localStorage helpers ─────────────────────────────────────
const LS_KEY = "aksharadhara_books";
function loadBooks(): AllBooks {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
function saveBooks(books: AllBooks) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(books));
}

// ── Grapheme helper ───────────────────────────────────────────
function getGraphemeIndices(text: string, start: number, end: number): number[] {
  const seg = new (Intl as any).Segmenter("te", { granularity: "grapheme" });
  const segs: Array<{ segment: string }> = Array.from(seg.segment(text));
  const indices: number[] = [];
  let ci = 0;
  segs.forEach((s, i) => {
    const se = ci + s.segment.length;
    if (se > start && ci < end) indices.push(i);
    ci = se;
  });
  return indices;
}

// ── HTML download ─────────────────────────────────────────────
function downloadHtml(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

// ── Pitch symbol map ──────────────────────────────────────────
const PITCH_SYMBOL: Record<string, string> = {
  high: "▲", low: "▼", svarita: "⌒", dirgha: "〰",
};
const PITCH_COLOR: Record<string, string> = {
  high: "#1f3674", low: "#a08b5e", svarita: "#c0392b", dirgha: "#27ae60",
};

// ─────────────────────────────────────────────────────────────
export default function VedhaPage() {
  const [books, setBooks] = useState<AllBooks>({});
  const [currentBook, setCurrentBook] = useState("");
  const [currentSection, setCurrentSection] = useState("");
  const [currentMantra, setCurrentMantra] = useState("");

  const [newBookTitle, setNewBookTitle] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [mantraTitle, setMantraTitle] = useState("");
  const [mantraDesc, setMantraDesc] = useState("");

  const [ocrText, setOcrText] = useState("");
  const [pitchMarks, setPitchMarks] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [status, setStatus] = useState({ msg: "OCR ఇంజిన్ ప్రారంభమవుతోంది...", type: "info" });
  const [isEditing, setIsEditing] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>("book");

  const ocrRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<any>(null);

  // Load books from localStorage
  useEffect(() => { setBooks(loadBooks()); }, []);

  // Init Tesseract
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/tesseract.js@4.1.0/dist/tesseract.min.js";
    script.onload = async () => {
      try {
        const w = await (window as any).Tesseract.createWorker({
          langPath: "https://tessdata.projectnaptha.com/4.0.0",
          logger: (m: any) => {
            if (m.status === "recognizing text")
              setStatus({ msg: `వచనాన్ని గుర్తిస్తోంది: ${(m.progress * 100).toFixed(1)}%`, type: "info" });
          },
        });
        await w.loadLanguage("tel");
        await w.initialize("tel");
        workerRef.current = w;
        setWorkerReady(true);
        setStatus({ msg: "OCR సిద్ధంగా ఉంది. పుస్తకాన్ని సృష్టించండి.", type: "success" });
      } catch {
        setStatus({ msg: "OCR ప్రారంభించడంలో విఫలమైంది. నెట్‌వర్క్ తనిఖీ చేయండి.", type: "error" });
      }
    };
    document.head.appendChild(script);
  }, []);

  const persist = useCallback((b: AllBooks) => { setBooks(b); saveBooks(b); }, []);

  // ── Book actions ──────────────────────────────────────────
  function createBook() {
    const t = newBookTitle.trim();
    if (!t) return alert("దయచేసి పుస్తకానికి పేరు ఇవ్వండి.");
    const k = t.replace(/\s+/g, "");
    if (books[k]) return alert("ఈ పేరుతో పుస్తకం ఉంది.");
    const nb = { ...books, [k]: { title: t, sections: {} } };
    persist(nb);
    setCurrentBook(k); setCurrentSection(""); setNewBookTitle("");
    setStatus({ msg: `పుస్తకం '${t}' సృష్టించబడింది.`, type: "success" });
    setActiveStep("section");
  }
  function deleteBook() {
    if (!currentBook) return alert("పుస్తకాన్ని ఎంచుకోండి.");
    if (!confirm(`'${books[currentBook].title}' తొలగించాలా?`)) return;
    const nb = { ...books }; delete nb[currentBook];
    persist(nb); setCurrentBook(""); setCurrentSection("");
    setStatus({ msg: "పుస్తకం తొలగించబడింది.", type: "success" });
  }

  // ── Section actions ───────────────────────────────────────
  function createSection() {
    if (!currentBook) return alert("పుస్తకాన్ని ఎంచుకోండి.");
    const t = newSectionTitle.trim();
    if (!t) return alert("భాగానికి పేరు ఇవ్వండి.");
    const k = t.replace(/\s+/g, "");
    if (books[currentBook].sections[k]) return alert("ఈ పేరుతో భాగం ఉంది.");
    const nb = structuredClone(books);
    nb[currentBook].sections[k] = { title: t, mantras: {} };
    persist(nb); setCurrentSection(k); setNewSectionTitle("");
    setStatus({ msg: `భాగం '${t}' సృష్టించబడింది.`, type: "success" });
    setActiveStep("ocr");
  }
  function deleteSection() {
    if (!currentBook || !currentSection) return alert("భాగాన్ని ఎంచుకోండి.");
    if (!confirm(`'${books[currentBook].sections[currentSection].title}' తొలగించాలా?`)) return;
    const nb = structuredClone(books);
    delete nb[currentBook].sections[currentSection];
    persist(nb); setCurrentSection("");
    setStatus({ msg: "భాగం తొలగించబడింది.", type: "success" });
  }

  // ── OCR ──────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setPreviewUrl(URL.createObjectURL(f));
    setOcrText(""); setPitchMarks([]);
    setStatus({ msg: "చిత్రం లోడైంది. 'OCR ప్రారంభించండి' నొక్కండి.", type: "info" });
  }

  async function runOcr() {
    const f = fileRef.current?.files?.[0];
    if (!f || !workerRef.current) return;
    setOcrLoading(true);
    setStatus({ msg: "OCR చేస్తోంది...", type: "info" });
    try {
      const { data } = await workerRef.current.recognize(f, "tel");
      const clean = data.text.replace(/[\u030D\u0323]/g, "").trim();
      setOcrText(clean);
      const seg = new (Intl as any).Segmenter("te", { granularity: "grapheme" });
      const segs = Array.from(seg.segment(clean));
      setPitchMarks(Array(segs.length).fill("none"));
      setStatus({ msg: "OCR పూర్తైంది. పిచ్ మార్కులు జోడించండి.", type: "success" });
    } catch {
      setStatus({ msg: "OCR లోపం. వేరే చిత్రాన్ని ప్రయత్నించండి.", type: "error" });
    } finally { setOcrLoading(false); }
  }

  function applyPitch(pitchType: PitchType) {
    if (!ocrRef.current) return;
    const start = ocrRef.current.selectionStart ?? 0;
    const end = ocrRef.current.selectionEnd ?? 0;
    if (start === end) return alert("OCR బాక్స్‌లో వచనాన్ని ఎంచుకోండి.");
    const indices = getGraphemeIndices(ocrText, start, end);
    const nm = [...pitchMarks];
    indices.forEach(i => { nm[i] = pitchType; });
    setPitchMarks(nm);
    setStatus({ msg: "పిచ్ మార్కులు జోడించబడ్డాయి.", type: "info" });
  }

  function clearAll() {
    setOcrText(""); setPitchMarks([]); setPreviewUrl("");
    setMantraTitle(""); setMantraDesc(""); setCurrentMantra("");
    setIsEditing(false);
    if (fileRef.current) fileRef.current.value = "";
    setStatus({ msg: "అన్నీ తొలగించబడ్డాయి.", type: "info" });
  }

  // ── Save / Update Mantra ──────────────────────────────────
  function saveMantra() {
    if (!currentBook || !currentSection) return alert("పుస్తకం మరియు భాగాన్ని ఎంచుకోండి.");
    const title = mantraTitle.trim();
    if (!title) return alert("మంత్రానికి పేరు ఇవ్వండి.");
    if (!ocrText.trim()) return alert("OCR అవుట్‌పుట్ ఖాళీగా ఉంది.");

    const newKey = title.replace(/\s+/g, "");
    const mantras = books[currentBook].sections[currentSection].mantras;
    if (!isEditing && mantras[newKey]) return alert(`'${title}' పేరుతో మంత్రం ఉంది.`);

    const seg = new (Intl as any).Segmenter("te", { granularity: "grapheme" });
    const segs: Array<{ segment: string }> = Array.from(seg.segment(ocrText));
    const lines: MantraLine[] = [];
    let current: Syllable[] = [];
    segs.forEach((s, i) => {
      if (s.segment.includes("\n")) {
        if (current.length) { lines.push({ syllables: current }); current = []; }
        return;
      }
      const syllable: Syllable = { char: s.segment };
      if (pitchMarks[i] && pitchMarks[i] !== "none") syllable.pitch = pitchMarks[i] as PitchType;
      current.push(syllable);
    });
    if (current.length) lines.push({ syllables: current });

    const mantra: Mantra = { title, description: mantraDesc.trim(), lines };
    const nb = structuredClone(books);
    const keyToUse = isEditing && currentMantra ? currentMantra : newKey;
    nb[currentBook].sections[currentSection].mantras[keyToUse] = mantra;
    persist(nb);
    setCurrentMantra(keyToUse);
    setIsEditing(false);
    clearAll();
    setStatus({ msg: `'${title}' మంత్రం సేవ్ చేయబడింది.`, type: "success" });
    setActiveStep("view");
  }

  // ── Edit Mantra ───────────────────────────────────────────
  function startEdit(key: string) {
    const mantra = books[currentBook]?.sections[currentSection]?.mantras[key];
    if (!mantra) return;
    setCurrentMantra(key);
    setMantraTitle(mantra.title);
    setMantraDesc(mantra.description);
    let text = "";
    const marks: string[] = [];
    mantra.lines.forEach(line => {
      line.syllables.forEach(s => {
        text += s.char;
        marks.push(s.pitch || "none");
      });
      text += "\n"; marks.push("none");
    });
    setOcrText(text.trim());
    setPitchMarks(marks.slice(0, marks.length - 1));
    setIsEditing(true);
    setActiveStep("ocr");
    setStatus({ msg: "మంత్రాన్ని సవరించడానికి సిద్ధంగా ఉంది.", type: "info" });
  }

  // ── Download Book ─────────────────────────────────────────
  function downloadBook() {
    if (!currentBook) return alert("పుస్తకాన్ని ఎంచుకోండి.");
    const book = books[currentBook];
    const date = new Date().toLocaleString("te-IN", { timeZone: "Asia/Kolkata" });

    let html = `<!DOCTYPE html><html lang="te"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap" rel="stylesheet">
<style>
body{font-family:'Noto Sans Telugu',serif;background:#f8f6f0;color:#2d3748;padding:2rem;margin:0;}
h1{color:#1f3674;text-align:center;}
h2{color:#2d5a8e;border-bottom:2px solid #e2d9c8;padding-bottom:0.5rem;}
h3{color:#4a5568;}
.section{background:#fff;padding:1.5rem;margin-bottom:1.5rem;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);}
.pitch-display{font-size:1.3rem;line-height:2.5;white-space:pre-wrap;}
.pitch-marked-char{position:relative;display:inline-flex;flex-direction:column;align-items:center;line-height:1.5;padding:0.4em 0.2em;}
.pitch-marked-char.high::before{content:"▲";position:absolute;top:-0.7em;left:50%;transform:translateX(-50%);color:#1f3674;font-size:0.8em;}
.pitch-marked-char.low::after{content:"▼";position:absolute;bottom:-0.5em;left:50%;transform:translateX(-50%);color:#a08b5e;font-size:0.8em;}
.pitch-marked-char.svarita::before{content:"⌒";position:absolute;top:-0.7em;left:50%;transform:translateX(-50%);color:#c0392b;font-size:0.8em;}
.pitch-marked-char.dirgha::before{content:"〰";position:absolute;top:-0.7em;left:50%;transform:translateX(-50%);color:#27ae60;font-size:0.8em;}
footer{text-align:center;padding:20px;border-top:1px solid #e0e0e0;color:#777;font-size:14px;}
</style></head><body><h1>${book.title}</h1>`;

    for (const sk in book.sections) {
      const sec = book.sections[sk];
      html += `<div class="section"><h2>${sec.title}</h2>`;
      for (const mk in sec.mantras) {
        const m = sec.mantras[mk];
        html += `<h3>${m.title}</h3><p>${m.description}</p><div class="pitch-display">`;
        m.lines.forEach(line => {
          line.syllables.forEach(s => {
            const cls = s.pitch ? `pitch-marked-char ${s.pitch}` : "";
            html += `<span class="${cls}">${s.char}</span>`;
          });
          html += "<br>";
        });
        html += `</div>`;
      }
      html += `</div>`;
    }
    html += `<footer>సృష్టించినది: ${date} | అక్షరధార సాఫ్ట్‌వేర్</footer></body></html>`;
    downloadHtml(`${book.title}.html`, html);
  }

  // ── Render mantra content ─────────────────────────────────
  function renderMantra(mantra: Mantra) {
    return (
      <div style={{ fontSize: 20, lineHeight: 2.8, whiteSpace: "pre-wrap", fontFamily: "'Noto Sans Telugu', serif" }}>
        {mantra.lines.map((line, li) => (
          <span key={li}>
            {line.syllables.map((s, si) => (
              <span key={si} style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "0.3em 0.1em" }}>
                {s.pitch === "high" && <span style={{ position: "absolute", top: "-0.8em", fontSize: "0.7em", color: PITCH_COLOR.high }}>▲</span>}
                {s.pitch === "svarita" && <span style={{ position: "absolute", top: "-0.8em", fontSize: "0.7em", color: PITCH_COLOR.svarita }}>⌒</span>}
                {s.pitch === "dirgha" && <span style={{ position: "absolute", top: "-0.8em", fontSize: "0.7em", color: PITCH_COLOR.dirgha }}>〰</span>}
                {s.char}
                {s.pitch === "low" && <span style={{ position: "absolute", bottom: "-0.6em", fontSize: "0.7em", color: PITCH_COLOR.low }}>▼</span>}
              </span>
            ))}
            <br />
          </span>
        ))}
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────
  const bookKeys = Object.keys(books);
  const sectionKeys = currentBook ? Object.keys(books[currentBook]?.sections ?? {}) : [];
  const mantraKeys = currentBook && currentSection ? Object.keys(books[currentBook]?.sections[currentSection]?.mantras ?? {}) : [];
  const currentMantraData = currentBook && currentSection && currentMantra ? books[currentBook]?.sections[currentSection]?.mantras[currentMantra] : null;

  const steps: { id: StepId; label: string; emoji: string }[] = [
    { id: "book", label: "పుస్తకం", emoji: "📚" },
    { id: "section", label: "భాగం", emoji: "📖" },
    { id: "ocr", label: "OCR", emoji: "🔍" },
    { id: "view", label: "చూడండి", emoji: "🪔" },
  ];

  return (
    <>
          <Navbar />
      <Head>
        <title>వేద సంకలనం — అక్షరధార</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&family=Tiro+Devanagari+Sanskrit&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f0ece4; }
        .vedha-page { min-height: 100vh; background: #f0ece4; font-family: 'Noto Sans Telugu', serif; }
        .step-card { background: #fff; border-radius: 16px; padding: 28px 24px; box-shadow: 0 2px 16px rgba(31,54,116,0.08); margin-bottom: 20px; transition: box-shadow 0.2s; }
        .step-card:hover { box-shadow: 0 4px 24px rgba(31,54,116,0.13); }
        .step-card.active { border: 2px solid #1f3674; }
        .step-title { font-size: 15px; font-weight: 700; color: #1f3674; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .inp { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1.5px solid #d4c9b0; font-family: 'Noto Sans Telugu', serif; font-size: 15px; background: #faf8f3; color: #2d3748; outline: none; transition: border 0.2s; margin-bottom: 10px; }
        .inp:focus { border-color: #1f3674; }
        .btn { padding: 10px 20px; border-radius: 9px; border: none; font-family: 'Noto Sans Telugu', serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.18s; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary { background: #1f3674; color: #fff; }
        .btn-primary:hover { background: #162a5e; }
        .btn-secondary { background: #fff; color: #1f3674; border: 1.5px solid #1f3674; }
        .btn-secondary:hover { background: #eef2fb; }
        .btn-danger { background: #fff; color: #c0392b; border: 1.5px solid #c0392b; }
        .btn-danger:hover { background: #fdf0ee; }
        .btn-pitch { padding: 8px 14px; border-radius: 8px; font-size: 13px; border: 1.5px solid; font-weight: 600; cursor: pointer; font-family: 'Noto Sans Telugu', serif; transition: all 0.15s; }
        .btn-pitch-high { background: #eef2fb; color: #1f3674; border-color: #1f3674; }
        .btn-pitch-high:hover { background: #1f3674; color: #fff; }
        .btn-pitch-low { background: #faf5eb; color: #a08b5e; border-color: #a08b5e; }
        .btn-pitch-low:hover { background: #a08b5e; color: #fff; }
        .btn-pitch-svarita { background: #fdecea; color: #c0392b; border-color: #c0392b; }
        .btn-pitch-svarita:hover { background: #c0392b; color: #fff; }
        .btn-pitch-dirgha { background: #edfaf3; color: #27ae60; border-color: #27ae60; }
        .btn-pitch-dirgha:hover { background: #27ae60; color: #fff; }
        .status-bar { padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 16px; font-family: 'Noto Sans Telugu', serif; }
        .status-info { background: #eef2fb; color: #1f3674; border: 1px solid #b3c2e8; }
        .status-success { background: #edfaf3; color: #1a7a48; border: 1px solid #b2dfcc; }
        .status-error { background: #fdecea; color: #c0392b; border: 1px solid #f5c0bb; }
        .tab-btn { padding: 8px 16px; border-radius: 8px; border: 1.5px solid #d4c9b0; background: #faf8f3; font-family: 'Noto Sans Telugu', serif; font-size: 13px; cursor: pointer; transition: all 0.15s; margin: 0 4px 8px 0; }
        .tab-btn.active { background: #1f3674; color: #fff; border-color: #1f3674; }
        .tab-btn:hover:not(.active) { background: #eef2fb; border-color: #1f3674; }
        .mantra-card { background: #faf8f3; border-radius: 12px; padding: 20px; border: 1px solid #e8dfc9; margin-top: 12px; }
        .step-nav { display: flex; gap: 0; background: #fff; border-radius: 12px; padding: 6px; box-shadow: 0 2px 8px rgba(31,54,116,0.07); margin-bottom: 24px; overflow-x: auto; }
        .step-nav-btn { flex: 1; padding: 10px 6px; border: none; background: none; border-radius: 8px; font-family: 'Noto Sans Telugu', serif; font-size: 13px; font-weight: 600; cursor: pointer; color: #888; transition: all 0.15s; display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 70px; }
        .step-nav-btn.active { background: #1f3674; color: #fff; }
        .step-nav-btn:hover:not(.active) { background: #eef2fb; color: #1f3674; }
        .help-box { background: #faf8f3; border-left: 4px solid #1f3674; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.8; color: #4a5568; }
        .help-box ol { padding-left: 20px; margin: 0; }
        .help-box li { margin-bottom: 10px; }
        .textarea { width: 100%; padding: 12px 14px; border-radius: 8px; border: 1.5px solid #d4c9b0; font-family: 'Noto Sans Telugu', serif; font-size: 15px; background: #faf8f3; color: #2d3748; resize: vertical; outline: none; transition: border 0.2s; line-height: 2; }
        .textarea:focus { border-color: #1f3674; }
        .preview-img { max-width: 100%; border-radius: 10px; border: 2px solid #e8dfc9; margin: 12px 0; display: block; }
        select.inp { cursor: pointer; }
        .flex-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .page-header { text-align: center; padding: 32px 20px 20px; }
        .page-title { font-size: 28px; font-weight: 700; color: #1f3674; margin: 0 0 6px; font-family: 'Tiro Devanagari Sanskrit', serif; }
        .page-subtitle { font-size: 15px; color: #6b7280; margin: 0; font-family: 'Noto Sans Telugu', serif; }
        .section-divider { height: 1px; background: linear-gradient(90deg, transparent, #d4c9b0, transparent); margin: 8px 0 16px; }
        @media (max-width: 600px) {
          .step-card { padding: 18px 14px; }
          .flex-wrap { gap: 6px; }
          .btn { font-size: 13px; padding: 9px 14px; }
        }
      `}</style>

      <div className="vedha-page">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">🕉️ వేద సంకలనం</h1>
          <p className="page-subtitle">తెలుగు వేద గ్రంథాలను డిజిటలైజ్ చేయండి — స్వర మార్కులతో</p>
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px 40px" }}>

          {/* Status bar */}
          <div className={`status-bar status-${status.type}`}>{status.msg}</div>

          {/* Step nav */}
          <div className="step-nav">
            {steps.map(s => (
              <button key={s.id} className={`step-nav-btn ${activeStep === s.id ? "active" : ""}`} onClick={() => setActiveStep(s.id)}>
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* ── STEP: BOOK ─────────────────────────────────── */}
          {activeStep === "book" && (
            <div className="step-card active">
              <div className="step-title">📚 1. పుస్తకాన్ని సృష్టించండి</div>

              {/* Helper */}
              <button className="btn btn-secondary" style={{ marginBottom: 12, fontSize: 13 }} onClick={() => setHelperOpen(o => !o)}>
                {helperOpen ? "▲" : "▼"} ఎలా ఉపయోగించాలి?
              </button>
              {helperOpen && (
                <div className="help-box">
                  <ol>
                    <li><b>పుస్తకం సృష్టించండి</b> — పేరు ఇవ్వండి, సృష్టించు నొక్కండి.</li>
                    <li><b>భాగం జోడించండి</b> — అధ్యాయం పేరు ఇవ్వండి.</li>
                    <li><b>చిత్రం అప్‌లోడ్ చేయండి</b> — మంత్రం ఉన్న ఫోటో ఎంచుకోండి.</li>
                    <li><b>OCR చేయండి</b> — చిత్రం నుండి తెలుగు అక్షరాలు తీస్తుంది.</li>
                    <li><b>స్వర మార్కులు</b> — వచనం ఎంచుకుని ▲▼⌒〰 నొక్కండి.</li>
                    <li><b>మంత్రం సేవ్ చేయండి</b> — పేరు ఇచ్చి సేవ్ చేయండి.</li>
                    <li><b>డౌన్‌లోడ్</b> — HTML పుస్తకంగా డౌన్‌లోడ్ చేయండి.</li>
                  </ol>
                </div>
              )}

              <div className="section-divider" />

              <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>కొత్త పుస్తకం పేరు:</label>
              <input className="inp" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)}
                placeholder="ఉదా: శుక్ల యజుర్వేదం" onKeyDown={e => e.key === "Enter" && createBook()} />
              <div className="flex-wrap">
                <button className="btn btn-primary" onClick={createBook}>📚 పుస్తకం సృష్టించు</button>
              </div>

              {bookKeys.length > 0 && (
                <>
                  <div className="section-divider" style={{ marginTop: 20 }} />
                  <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>ఉన్న పుస్తకం ఎంచుకోండి:</label>
                  <select className="inp" value={currentBook} onChange={e => {
                    setCurrentBook(e.target.value); setCurrentSection(""); setCurrentMantra("");
                    setStatus({ msg: `పుస్తకం ఎంపిక చేయబడింది.`, type: "info" });
                    setActiveStep("section");
                  }}>
                    <option value="">— ఒక పుస్తకాన్ని ఎంచుకోండి —</option>
                    {bookKeys.map(k => <option key={k} value={k}>{books[k].title}</option>)}
                  </select>
                  <div className="flex-wrap">
                    <button className="btn btn-danger" onClick={deleteBook}>🗑 పుస్తకం తొలగించు</button>
                    {currentBook && <button className="btn btn-primary" onClick={() => setActiveStep("section")}>తదుపరి →</button>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP: SECTION ──────────────────────────────── */}
          {activeStep === "section" && (
            <div className="step-card active">
              <div className="step-title">📖 2. భాగాన్ని జోడించండి
                {currentBook && <span style={{ fontWeight: 400, fontSize: 13, color: "#888", marginLeft: 8 }}>({books[currentBook]?.title})</span>}
              </div>
              {!currentBook ? (
                <p style={{ color: "#e74c3c", fontSize: 14 }}>మొదట పుస్తకాన్ని ఎంచుకోండి.</p>
              ) : (
                <>
                  <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>కొత్త భాగం పేరు:</label>
                  <input className="inp" value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)}
                    placeholder="ఉదా: పూర్వ పీఠిక" onKeyDown={e => e.key === "Enter" && createSection()} />
                  <div className="flex-wrap">
                    <button className="btn btn-primary" onClick={createSection}>📖 భాగం జోడించు</button>
                  </div>

                  {sectionKeys.length > 0 && (
                    <>
                      <div className="section-divider" style={{ marginTop: 20 }} />
                      <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>ఉన్న భాగం ఎంచుకోండి:</label>
                      <select className="inp" value={currentSection} onChange={e => {
                        setCurrentSection(e.target.value); setCurrentMantra("");
                        setStatus({ msg: "భాగం ఎంపిక చేయబడింది.", type: "info" });
                      }}>
                        <option value="">— ఒక భాగాన్ని ఎంచుకోండి —</option>
                        {sectionKeys.map(k => <option key={k} value={k}>{books[currentBook].sections[k].title}</option>)}
                      </select>
                      <div className="flex-wrap">
                        <button className="btn btn-danger" onClick={deleteSection}>🗑 భాగం తొలగించు</button>
                        {currentSection && <button className="btn btn-primary" onClick={() => setActiveStep("ocr")}>తదుపరి →</button>}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── STEP: OCR ──────────────────────────────────── */}
          {activeStep === "ocr" && (
            <div className="step-card active">
              <div className="step-title">🔍 3. చిత్రం నుండి మంత్రం తీయండి
                {currentSection && currentBook && (
                  <span style={{ fontWeight: 400, fontSize: 13, color: "#888", marginLeft: 8 }}>
                    ({books[currentBook]?.sections[currentSection]?.title})
                  </span>
                )}
              </div>

              {!currentBook || !currentSection ? (
                <p style={{ color: "#e74c3c", fontSize: 14 }}>పుస్తకం మరియు భాగాన్ని ఎంచుకోండి.</p>
              ) : (
                <>
                  {/* File upload */}
                  <div className="flex-wrap" style={{ marginBottom: 12 }}>
                    <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
                      📷 చిత్రాన్ని అప్‌లోడ్ చేయండి
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                    </label>
                    <button className="btn btn-primary" disabled={!previewUrl || !workerReady || ocrLoading} onClick={runOcr}>
                      {ocrLoading ? "⏳ OCR చేస్తోంది..." : "🔍 OCR ప్రారంభించండి"}
                    </button>
                  </div>

                  {previewUrl && <img src={previewUrl} className="preview-img" alt="uploaded" />}

                  {/* OCR Textarea */}
                  <label style={{ fontSize: 13, color: "#555", fontWeight: 600, display: "block", marginBottom: 6 }}>
                    OCR అవుట్‌పుట్ — వచనం ఎంచుకుని స్వరం గుర్తించండి:
                  </label>
                  <textarea ref={ocrRef} className="textarea" rows={5} value={ocrText}
                    onChange={e => setOcrText(e.target.value)}
                    placeholder="OCR ఫలితం ఇక్కడ కనిపిస్తుంది — మీరు కూడా టైప్ చేయవచ్చు" />

                  {/* Pitch buttons */}
                  <div className="flex-wrap" style={{ marginTop: 10 }}>
                    <button className="btn-pitch btn-pitch-high" onClick={() => applyPitch("high")}>▲ స్వరితం (High)</button>
                    <button className="btn-pitch btn-pitch-low" onClick={() => applyPitch("low")}>▼ అనుదాత్తం (Low)</button>
                    <button className="btn-pitch btn-pitch-svarita" onClick={() => applyPitch("svarita")}>⌒ స్వరితం</button>
                    <button className="btn-pitch btn-pitch-dirgha" onClick={() => applyPitch("dirgha")}>〰 దీర్ఘ స్వరితం</button>
                    <button className="btn btn-danger" style={{ fontSize: 13, padding: "8px 14px" }} onClick={clearAll}>🗑 తొలగించు</button>
                  </div>

                  {/* Pitch legend */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: 12, color: "#888" }}>
                    {Object.entries(PITCH_SYMBOL).map(([k, v]) => (
                      <span key={k} style={{ color: PITCH_COLOR[k] }}>{v} = {k}</span>
                    ))}
                  </div>

                  <div className="section-divider" style={{ marginTop: 16 }} />

                  {/* Mantra title + desc */}
                  <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>మంత్రం పేరు:</label>
                  <input className="inp" value={mantraTitle} onChange={e => setMantraTitle(e.target.value)}
                    placeholder="ఉదా: శ్రీ గాయత్రీ మంత్రం" />
                  <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>వివరణ:</label>
                  <textarea className="textarea" rows={2} value={mantraDesc}
                    onChange={e => setMantraDesc(e.target.value)} placeholder="మంత్రం గురించి సంక్షిప్త వివరణ" />

                  <div className="flex-wrap" style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={saveMantra}>
                      {isEditing ? "✏️ మంత్రం అప్‌డేట్ చేయండి" : "✨ మంత్రం సేవ్ చేయండి"}
                    </button>
                    {isEditing && <button className="btn btn-secondary" onClick={() => { setIsEditing(false); clearAll(); }}>రద్దు చేయండి</button>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP: VIEW ─────────────────────────────────── */}
          {activeStep === "view" && (
            <div className="step-card active">
              <div className="step-title">🪔 4. మంత్రాలను చూడండి & నిర్వహించండి</div>

              {!currentBook || !currentSection ? (
                <p style={{ color: "#e74c3c", fontSize: 14 }}>పుస్తకం మరియు భాగాన్ని ఎంచుకోండి.</p>
              ) : mantraKeys.length === 0 ? (
                <p style={{ color: "#888", fontSize: 14 }}>ఈ భాగంలో మంత్రాలు లేవు. OCR ట్యాబ్‌లో జోడించండి.</p>
              ) : (
                <>
                  {/* Mantra tabs */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {mantraKeys.map(k => (
                      <button key={k} className={`tab-btn ${currentMantra === k ? "active" : ""}`}
                        onClick={() => setCurrentMantra(k)}>
                        {books[currentBook].sections[currentSection].mantras[k].title}
                      </button>
                    ))}
                  </div>

                  {/* Mantra display */}
                  {currentMantraData ? (
                    <div className="mantra-card">
                      <h3 style={{ color: "#1f3674", margin: "0 0 6px", fontFamily: "'Noto Sans Telugu', serif" }}>
                        {currentMantraData.title}
                      </h3>
                      {currentMantraData.description && (
                        <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 12px", fontFamily: "'Noto Sans Telugu', serif" }}>
                          {currentMantraData.description}
                        </p>
                      )}
                      <div className="section-divider" />
                      {renderMantra(currentMantraData)}
                      <div className="flex-wrap" style={{ marginTop: 16 }}>
                        <button className="btn btn-secondary" onClick={() => startEdit(currentMantra)}>✏️ సవరించండి</button>
                        <button className="btn btn-danger" onClick={() => {
                          if (!confirm("మంత్రం తొలగించాలా?")) return;
                          const nb = structuredClone(books);
                          delete nb[currentBook].sections[currentSection].mantras[currentMantra];
                          persist(nb); setCurrentMantra("");
                          setStatus({ msg: "మంత్రం తొలగించబడింది.", type: "success" });
                        }}>🗑 తొలగించండి</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "#888", fontSize: 14 }}>పైన ఒక మంత్రాన్ని ఎంచుకోండి.</p>
                  )}
                </>
              )}

              {/* Download */}
              {currentBook && (
                <>
                  <div className="section-divider" style={{ marginTop: 20 }} />
                  <div className="flex-wrap">
                    <button className="btn btn-primary" onClick={downloadBook}>
                      ⬇ పుస్తకాన్ని డౌన్‌లోడ్ చేయండి (HTML)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
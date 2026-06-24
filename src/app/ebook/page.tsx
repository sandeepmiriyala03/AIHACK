"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "home" | "voice" | "generating" | "done";

interface LangConfig {
  label: string;
  flag: string;
  googleTTSCode: string;
  nativeName: string;
}

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES: Record<string, LangConfig> = {
  eng: { label: "English",    flag: "🌍", googleTTSCode: "en", nativeName: "English" },
  hin: { label: "Hindi",      flag: "🇮🇳", googleTTSCode: "hi", nativeName: "हिन्दी" },
  tel: { label: "Telugu",     flag: "🌺", googleTTSCode: "te", nativeName: "తెలుగు" },
  tam: { label: "Tamil",      flag: "🌸", googleTTSCode: "ta", nativeName: "தமிழ்" },
  ben: { label: "Bengali",    flag: "🐯", googleTTSCode: "bn", nativeName: "বাংলা" },
  mar: { label: "Marathi",    flag: "🏔️", googleTTSCode: "mr", nativeName: "मराठी" },
  guj: { label: "Gujarati",   flag: "🦁", googleTTSCode: "gu", nativeName: "ગુજરાતી" },
  kan: { label: "Kannada",    flag: "🐘", googleTTSCode: "kn", nativeName: "ಕನ್ನಡ" },
  mal: { label: "Malayalam",  flag: "🌴", googleTTSCode: "ml", nativeName: "മലയാളം" },
  pan: { label: "Punjabi",    flag: "🪯", googleTTSCode: "pa", nativeName: "ਪੰਜਾਬੀ" },
  urd: { label: "Urdu",       flag: "🌙", googleTTSCode: "ur", nativeName: "اردو" },
  fra: { label: "French",     flag: "🇫🇷", googleTTSCode: "fr", nativeName: "Français" },
  deu: { label: "German",     flag: "🇩🇪", googleTTSCode: "de", nativeName: "Deutsch" },
  spa: { label: "Spanish",    flag: "🇪🇸", googleTTSCode: "es", nativeName: "Español" },
  ara: { label: "Arabic",     flag: "🇸🇦", googleTTSCode: "ar", nativeName: "العربية" },
  rus: { label: "Russian",    flag: "🇷🇺", googleTTSCode: "ru", nativeName: "Русский" },
  por: { label: "Portuguese", flag: "🇵🇹", googleTTSCode: "pt", nativeName: "Português" },
  jpn: { label: "Japanese",   flag: "🇯🇵", googleTTSCode: "ja", nativeName: "日本語" },
  kor: { label: "Korean",     flag: "🇰🇷", googleTTSCode: "ko", nativeName: "한국어" },
};

const VOICE_OPTIONS = [
  { id: "female", emoji: "👩", label: "Mummy Voice",  hint: "Warm & gentle" },
  { id: "male",   emoji: "👨", label: "Daddy Voice",  hint: "Deep & caring" },
  { id: "story",  emoji: "🧒", label: "Child Voice",  hint: "Soft & playful" },
  { id: "news",   emoji: "👴", label: "Elder Voice",  hint: "Calm & clear" },
];

// ─── File reader — supports TXT, PDF, DOCX, RTF ──────────────────────────────
async function extractTextFromFile(file: File): Promise<{ ok: boolean; text: string; error?: string }> {
  const name = file.name.toLowerCase();
  const type = file.type;

  // ── Plain text ──
  if (type === "text/plain" || name.endsWith(".txt")) {
    const text = await file.text();
    if (!text.trim()) return { ok: false, text: "", error: "The text file appears to be empty." };
    return { ok: true, text: text.trim() };
  }

  // ── RTF — strip RTF control codes ──
  if (name.endsWith(".rtf")) {
    const raw = await file.text();
    const text = raw
      .replace(/\{\\[^}]*\}/g, "")          // remove groups
      .replace(/\\[a-z]+\d*\s?/g, "")       // remove control words
      .replace(/[{}\\]/g, "")               // remove remaining braces/backslash
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 5) return { ok: false, text: "", error: "Could not read the RTF file. Please try saving it as a .txt file." };
    return { ok: true, text };
  }

  // ── DOCX — unzip and extract word/document.xml ──
  if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      // @ts-ignore
      if (!window.JSZip) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
      // @ts-ignore
      const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
      const xmlFile = zip.file("word/document.xml");
      if (!xmlFile) return { ok: false, text: "", error: "Could not read the Word file. Please try saving as .txt." };
      const xml = await xmlFile.async("string");
      // Extract text between <w:t> tags
      const matches = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
      const text = matches.map(m => m[1]).join(" ").replace(/\s+/g, " ").trim();
      if (text.length < 5) return { ok: false, text: "", error: "The Word file seems empty. Please type your message and try again." };
      return { ok: true, text };
    } catch {
      return { ok: false, text: "", error: "Could not open the Word file. Please save as .txt and try again." };
    }
  }

  // ── PDF — use pdf.js ──
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    try {
      // @ts-ignore
      if (!window.pdfjsLib) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
        // @ts-ignore
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      let text = "";
      for (let p = 1; p <= Math.min(pdf.numPages, 50); p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        // @ts-ignore
        text += content.items.map((i: any) => i.str).join(" ") + "\n";
      }
      const trimmed = text.trim();
      if (trimmed.length < 20) return { ok: false, text: "", error: "This PDF has no readable text (it may be a scanned image). Please type your message directly in the text box instead." };
      return { ok: true, text: trimmed };
    } catch (e: any) {
      return { ok: false, text: "", error: `Could not read PDF: ${e?.message ?? "unknown error"}` };
    }
  }

  return { ok: false, text: "", error: "File type not supported. Please upload a .txt, .docx, .pdf, or .rtf file — or just type your message below." };
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Could not load: ${src}`));
    document.head.appendChild(s);
  });
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
async function speakText(text: string, langCode: string): Promise<Blob> {
  const lang = LANGUAGES[langCode];
  const res = await fetch(
    `/api/tts?text=${encodeURIComponent(text.slice(0, 1000))}&lang=${lang.googleTTSCode}`
  );
  if (!res.ok) throw new Error("Audio generation failed. Please try again.");
  return new Blob([await res.arrayBuffer()], { type: "audio/mpeg" });
}

function splitIntoChunks(text: string): string[] {
  // Split at sentence boundaries, max ~800 chars each
  const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > 800 && current.length > 50) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VoiceForParents() {
  const [step, setStep] = useState<Step>("home");
  const [inputText, setInputText] = useState("");
  const [selectedLang, setSelectedLang] = useState("eng");
  const [selectedVoice, setSelectedVoice] = useState("female");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [showAllLangs, setShowAllLangs] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<string>("");

  useEffect(() => () => { if (audioRef.current) URL.revokeObjectURL(audioRef.current); }, []);

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setFileLoading(true);
    setFileName(file.name);
    const result = await extractTextFromFile(file);
    setFileLoading(false);
    if (!result.ok) {
      setError(result.error || "Could not read file.");
      setFileName("");
      return;
    }
    setInputText(result.text);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (!inputText.trim()) { setError("Please type or upload your message first."); return; }
    setError("");
    setStep("generating");
    setProgress(0);
    const chunks = splitIntoChunks(inputText.trim());
    const blobs: Blob[] = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const blob = await speakText(chunks[i], selectedLang);
        blobs.push(blob);
      } catch {}
      setProgress(Math.round(((i + 1) / chunks.length) * 100));
    }
    // Merge blobs
    const merged = new Blob(blobs, { type: "audio/mpeg" });
    if (audioRef.current) URL.revokeObjectURL(audioRef.current);
    const url = URL.createObjectURL(merged);
    audioRef.current = url;
    setAudioUrl(url);
    setStep("done");
  };

  const filteredLangs = Object.entries(LANGUAGES).filter(([, l]) =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(langSearch.toLowerCase())
  );
  const displayedLangs = showAllLangs ? filteredLangs : filteredLangs.slice(0, 8);

  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const L = LANGUAGES[selectedLang];

  const reset = () => {
    setStep("home");
    setInputText("");
    setFileName("");
    setError("");
    setAudioUrl("");
    setProgress(0);
    setLangSearch("");
    setShowAllLangs(false);
  };

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #FFF8F0;
          --surface: #FFFFFF;
          --border: #E8DDD0;
          --primary: #E8621A;
          --primary-light: #FFF0E8;
          --primary-mid: #FACCAA;
          --primary-dark: #C24E10;
          --green: #2E8B57;
          --green-light: #F0FFF6;
          --green-mid: #A8E6C3;
          --red: #CC2222;
          --red-light: #FFF0F0;
          --red-mid: #FFBBBB;
          --muted: #8A7A6A;
          --ink: #2C1810;
          --ink2: #5C3D2A;
          --radius: 20px;
          --radius-sm: 12px;
          --shadow: 0 2px 8px rgba(0,0,0,.06);
          --shadow-lg: 0 6px 24px rgba(232,98,26,.15);
        }
        body { background: var(--bg); font-family: 'Nunito', sans-serif; color: var(--ink); }

        /* ── layout ── */
        .page { min-height: 100vh; padding: 24px 16px 80px; }
        .wrap { max-width: 600px; margin: 0 auto; }

        /* ── hero ── */
        .hero { text-align: center; padding: 28px 0 20px; }
        .hero-icon { font-size: 64px; line-height: 1; margin-bottom: 12px; }
        .hero-title { font-size: 28px; font-weight: 900; color: var(--ink); line-height: 1.2; margin-bottom: 8px; }
        .hero-title em { color: var(--primary); font-style: normal; }
        .hero-sub { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 420px; margin: 0 auto; }

        /* ── how-to strip ── */
        .howto { display: flex; gap: 0; margin: 20px 0 28px; background: var(--surface);
          border-radius: var(--radius); border: 1.5px solid var(--border); overflow: hidden; }
        .howto-step { flex: 1; padding: 16px 12px; text-align: center; border-right: 1.5px solid var(--border); }
        .howto-step:last-child { border-right: none; }
        .howto-num { width: 32px; height: 32px; border-radius: 50%; background: var(--primary);
          color: #fff; font-size: 15px; font-weight: 900; display: flex; align-items: center;
          justify-content: center; margin: 0 auto 8px; }
        .howto-emoji { font-size: 26px; display: block; margin-bottom: 6px; }
        .howto-label { font-size: 12px; font-weight: 700; color: var(--ink); line-height: 1.4; }

        /* ── card ── */
        .card { background: var(--surface); border-radius: var(--radius);
          border: 1.5px solid var(--border); padding: 24px; margin-bottom: 16px;
          box-shadow: var(--shadow); }

        /* ── section label ── */
        .sec { font-size: 13px; font-weight: 800; text-transform: uppercase;
          letter-spacing: .06em; color: var(--muted); margin-bottom: 12px; }

        /* ── textarea ── */
        .text-area { width: 100%; min-height: 160px; padding: 16px;
          border-radius: var(--radius-sm); border: 2px solid var(--border);
          background: var(--bg); font-size: 16px; font-family: inherit;
          color: var(--ink); line-height: 1.7; resize: vertical; outline: none;
          transition: border-color .15s; }
        .text-area:focus { border-color: var(--primary); background: #fff; }
        .text-area::placeholder { color: var(--muted); }
        .char-count { font-size: 12px; color: var(--muted); text-align: right; margin-top: 6px; }

        /* ── upload zone ── */
        .upload-zone { border: 2.5px dashed var(--border); border-radius: var(--radius-sm);
          padding: 24px 16px; text-align: center; cursor: pointer;
          transition: all .2s; background: var(--bg); margin-top: 14px; }
        .upload-zone:hover, .upload-zone.drag { border-color: var(--primary); background: var(--primary-light); }
        .upload-zone-title { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
        .upload-zone-sub { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
        .upload-types { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 12px; }
        .type-pill { padding: 4px 10px; border-radius: 20px; background: var(--primary-light);
          border: 1px solid var(--primary-mid); color: var(--primary-dark);
          font-size: 12px; font-weight: 700; }
        .upload-btn { display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px; border-radius: var(--radius-sm);
          background: var(--primary); color: #fff; border: none;
          font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
          transition: background .15s; }
        .upload-btn:hover { background: var(--primary-dark); }

        /* ── file loaded badge ── */
        .file-badge { display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          background: var(--green-light); border: 1.5px solid var(--green-mid);
          border-radius: var(--radius-sm); margin-top: 14px; }
        .file-badge-name { font-size: 13px; font-weight: 700; color: var(--green); flex: 1; }
        .file-badge-clear { background: none; border: none; color: var(--muted);
          font-size: 18px; cursor: pointer; padding: 0 4px; }

        /* ── loading badge ── */
        .loading-badge { display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          background: var(--primary-light); border: 1.5px solid var(--primary-mid);
          border-radius: var(--radius-sm); margin-top: 14px;
          font-size: 13px; font-weight: 700; color: var(--primary-dark); }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── error ── */
        .error-box { display: flex; gap: 10px; padding: 14px 16px;
          background: var(--red-light); border: 1.5px solid var(--red-mid);
          border-radius: var(--radius-sm); margin-bottom: 14px; }
        .error-text { font-size: 14px; font-weight: 600; color: var(--red); line-height: 1.6; }

        /* ── divider ── */
        .div { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .div-line { flex: 1; height: 1px; background: var(--border); }
        .div-text { font-size: 12px; color: var(--muted); font-weight: 700; white-space: nowrap; }

        /* ── lang grid ── */
        .lang-search-wrap { position: relative; margin-bottom: 10px; }
        .lang-search-wrap input { width: 100%; padding: 10px 14px 10px 36px;
          border-radius: var(--radius-sm); border: 1.5px solid var(--border);
          font-size: 14px; font-family: inherit; color: var(--ink);
          background: var(--bg); outline: none; transition: border-color .15s; }
        .lang-search-wrap input:focus { border-color: var(--primary); background: #fff; }
        .lang-search-wrap .si { position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); font-size: 15px; }
        .lang-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .lang-btn { padding: 10px 6px; border-radius: var(--radius-sm);
          border: 2px solid var(--border); background: var(--surface);
          cursor: pointer; transition: all .15s; text-align: center; }
        .lang-btn:hover { border-color: var(--primary-mid); background: var(--primary-light); }
        .lang-btn.sel { border-color: var(--primary); background: var(--primary-light); }
        .lang-flag { font-size: 20px; display: block; margin-bottom: 3px; }
        .lang-name { font-size: 11px; font-weight: 700; color: var(--ink); display: block; }
        .lang-native { font-size: 10px; color: var(--muted); display: block; }
        .show-more { width: 100%; margin-top: 8px; padding: 9px;
          border-radius: var(--radius-sm); border: 1.5px dashed var(--border);
          background: none; font-size: 13px; font-weight: 700; color: var(--muted);
          font-family: inherit; cursor: pointer; transition: all .15s; }
        .show-more:hover { border-color: var(--primary); color: var(--primary); }

        /* ── voice grid ── */
        .voice-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .voice-btn { padding: 16px 12px; border-radius: var(--radius-sm);
          border: 2px solid var(--border); background: var(--surface);
          cursor: pointer; transition: all .15s; text-align: center; }
        .voice-btn:hover { border-color: var(--primary-mid); background: var(--primary-light); }
        .voice-btn.sel { border-color: var(--primary); background: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(232,98,26,.12); }
        .voice-emoji { font-size: 36px; display: block; margin-bottom: 6px; }
        .voice-label { font-size: 14px; font-weight: 800; color: var(--ink); display: block; }
        .voice-hint { font-size: 11px; color: var(--muted); display: block; margin-top: 2px; }

        /* ── big action button ── */
        .btn-go { width: 100%; padding: 18px; border-radius: var(--radius-sm);
          background: var(--primary); color: #fff; border: none;
          font-size: 18px; font-weight: 900; font-family: inherit;
          cursor: pointer; transition: all .15s; box-shadow: var(--shadow-lg);
          display: flex; align-items: center; justify-content: center; gap: 10px; }
        .btn-go:hover { background: var(--primary-dark); transform: translateY(-2px); }
        .btn-go:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-secondary { padding: 12px 24px; border-radius: var(--radius-sm);
          border: 2px solid var(--border); background: var(--surface);
          color: var(--ink2); font-size: 14px; font-weight: 700;
          font-family: inherit; cursor: pointer; transition: all .15s; }
        .btn-secondary:hover { border-color: var(--primary); color: var(--primary); }

        /* ── generating screen ── */
        .gen-center { text-align: center; padding: 20px 0; }
        .gen-icon { font-size: 56px; margin-bottom: 12px;
          animation: bounce 1s ease-in-out infinite; }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .gen-title { font-size: 22px; font-weight: 900; color: var(--ink); margin-bottom: 6px; }
        .gen-sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }
        .progress-bg { height: 12px; background: var(--border); border-radius: 6px; overflow: hidden; margin: 0 0 8px; }
        .progress-fill { height: 100%; border-radius: 6px; background: var(--primary);
          transition: width .4s ease; }
        .progress-pct { font-size: 14px; font-weight: 700; color: var(--primary); }

        /* ── done screen ── */
        .done-hero { text-align: center; padding: 8px 0 20px; }
        .done-icon { font-size: 64px; margin-bottom: 10px; }
        .done-title { font-size: 22px; font-weight: 900; color: var(--green); margin-bottom: 6px; }
        .done-sub { font-size: 14px; color: var(--muted); }
        .audio-player { width: 100%; border-radius: var(--radius-sm); margin-bottom: 16px; }
        .btn-download { width: 100%; padding: 16px; border-radius: var(--radius-sm);
          background: var(--green); color: #fff; border: none;
          font-size: 16px; font-weight: 800; font-family: inherit; cursor: pointer;
          transition: all .15s; box-shadow: 0 4px 16px rgba(46,139,87,.2);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 10px; }
        .btn-download:hover { background: #246b43; transform: translateY(-1px); }
        .done-actions { display: flex; gap: 10px; margin-top: 4px; }

        /* ── tip box ── */
        .tip { padding: 14px 16px; border-radius: var(--radius-sm);
          background: #FFFBEB; border: 1.5px solid #FDE68A;
          font-size: 13px; color: #92400E; font-weight: 600; line-height: 1.6; }

        @media (max-width: 480px) {
          .lang-grid { grid-template-columns: repeat(3, 1fr); }
          .howto { flex-direction: column; }
          .howto-step { border-right: none; border-bottom: 1.5px solid var(--border); }
          .howto-step:last-child { border-bottom: none; }
        }
      `}</style>

      <div className="page">
        <div className="wrap">

          {/* ── HERO ── */}
          <div className="hero">
            <div className="hero-icon">🤟 VaniSetu</div>
            <h1 className="hero-title">Give Your Child<br /><em>Your Voice</em></h1>
            <p className="hero-sub">
              Dedicated to special web accessibility and inclusive communication. 
              Type or upload what you want to say, and we turn it into a voice 
              your child can hear anytime — even offline.
            </p>
          </div>

          {/* ── HOW TO USE ── */}
          {step === "home" && (
            <div className="howto" role="list" aria-label="How to use — 3 steps">
              {[
                { emoji: "✍️", label: "Type your message OR upload a file" },
                { emoji: "🌍", label: "Choose language & voice type" },
                { emoji: "🔊", label: "Download the audio for your child" },
              ].map((s, i) => (
                <div className="howto-step" key={i} role="listitem">
                  <div className="howto-num" aria-hidden="true">{i + 1}</div>
                  <span className="howto-emoji" aria-hidden="true">{s.emoji}</span>
                  <div className="howto-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════
              STEP 1 — HOME: type + upload + settings
          ════════════════════════════════════ */}
          {step === "home" && (
            <>
              {error && (
                <div className="error-box" role="alert">
                  <span aria-hidden="true">⚠️</span>
                  <div className="error-text">{error}</div>
                </div>
              )}

              {/* Text input */}
              <div className="card">
                <div className="sec">✍️ Step 1 — Type what you want to say</div>
                <textarea
                  className="text-area"
                  placeholder={`Write your message here…\n\nExample: "Good morning my love. I made breakfast for you. I am always with you."`}
                  value={inputText}
                  onChange={e => { setInputText(e.target.value); setError(""); }}
                  aria-label="Type your message"
                  rows={6}
                />
                {inputText && (
                  <div className="char-count">{wordCount} words · {charCount} characters</div>
                )}

                <div className="div">
                  <div className="div-line" />
                  <div className="div-text">OR UPLOAD A FILE</div>
                  <div className="div-line" />
                </div>

                {/* Upload zone */}
                {!fileName && !fileLoading && (
                  <div
                    className={`upload-zone${isDragging ? " drag" : ""}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    role="button"
                    aria-label="Upload a file"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
                  >
                    <div className="upload-zone-title">📂 Upload your file</div>
                    <div className="upload-zone-sub">Drag & drop here, or tap to choose</div>
                    <div className="upload-types">
                      <span className="type-pill">📄 .txt</span>
                      <span className="type-pill">📝 .docx</span>
                      <span className="type-pill">📋 .pdf</span>
                      <span className="type-pill">📃 .rtf</span>
                    </div>
                    <button
                      className="upload-btn"
                      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                      type="button"
                    >
                      📁 Choose File
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,.pdf,.docx,.rtf,text/plain,application/pdf"
                      style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                  </div>
                )}

                {fileLoading && (
                  <div className="loading-badge">
                    <span className="spin" aria-hidden="true">⏳</span>
                    Reading your file…
                  </div>
                )}

                {fileName && !fileLoading && (
                  <div className="file-badge">
                    <span aria-hidden="true">✅</span>
                    <span className="file-badge-name">📄 {fileName}</span>
                    <button
                      className="file-badge-clear"
                      onClick={() => { setFileName(""); setInputText(""); setError(""); }}
                      aria-label="Remove file"
                      title="Remove file"
                    >×</button>
                  </div>
                )}
              </div>

              {/* Language */}
              <div className="card">
                <div className="sec">🌍 Step 2 — Choose your language</div>
                <div className="lang-search-wrap">
                  <span className="si" aria-hidden="true">🔍</span>
                  <input
                    type="text"
                    placeholder="Search language…"
                    value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                    aria-label="Search for a language"
                  />
                </div>
                <div className="lang-grid" role="radiogroup" aria-label="Language selection">
                  {displayedLangs.map(([code, l]) => (
                    <button
                      key={code}
                      className={`lang-btn${selectedLang === code ? " sel" : ""}`}
                      onClick={() => setSelectedLang(code)}
                      role="radio"
                      aria-checked={selectedLang === code}
                      aria-label={`${l.label} — ${l.nativeName}`}
                    >
                      <span className="lang-flag" aria-hidden="true">{l.flag}</span>
                      <span className="lang-name">{l.label}</span>
                      <span className="lang-native">{l.nativeName}</span>
                    </button>
                  ))}
                </div>
                {filteredLangs.length > 8 && (
                  <button className="show-more" onClick={() => setShowAllLangs(v => !v)}>
                    {showAllLangs ? "▲ Show less" : `▼ Show all ${filteredLangs.length} languages`}
                  </button>
                )}
              </div>

              {/* Voice */}
              <div className="card">
                <div className="sec">🎙️ Step 3 — Choose voice type</div>
                <div className="voice-grid" role="radiogroup" aria-label="Voice type selection">
                  {VOICE_OPTIONS.map(v => (
                    <button
                      key={v.id}
                      className={`voice-btn${selectedVoice === v.id ? " sel" : ""}`}
                      onClick={() => setSelectedVoice(v.id)}
                      role="radio"
                      aria-checked={selectedVoice === v.id}
                      aria-label={`${v.label} — ${v.hint}`}
                    >
                      <span className="voice-emoji" aria-hidden="true">{v.emoji}</span>
                      <span className="voice-label">{v.label}</span>
                      <span className="voice-hint">{v.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Go button */}
              <div className="tip" style={{ marginBottom: 16 }}>
                💡 <strong>Tip:</strong> You can type a lullaby, a bedtime story, a morning greeting,
                homework instructions — anything you want your child to hear in your language.
              </div>

              <button
                className="btn-go"
                onClick={handleGenerate}
                disabled={!inputText.trim()}
                aria-disabled={!inputText.trim()}
              >
                <span aria-hidden="true">🔊</span>
                Create Voice Audio
              </button>

              {!inputText.trim() && (
                <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
                  Type your message or upload a file to get started
                </p>
              )}
            </>
          )}

          {/* ════════════════════════════════════
              STEP — GENERATING
          ════════════════════════════════════ */}
          {step === "generating" && (
            <div className="card">
              <div className="gen-center">
                <div className="gen-icon" aria-hidden="true">🔊</div>
                <div className="gen-title">Creating your voice…</div>
                <div className="gen-sub">
                  {L.flag} {L.label} · {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label}
                </div>
                <div className="progress-bg" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-pct">{progress}% done</div>
              </div>
              <div className="tip" style={{ marginTop: 20 }}>
                🔒 Your text never leaves your device. Everything is private.
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              STEP — DONE
          ════════════════════════════════════ */}
          {step === "done" && (
            <div className="card">
              <div className="done-hero">
                <div className="done-icon" aria-hidden="true">🎉</div>
                <div className="done-title">Your voice is ready!</div>
                <div className="done-sub">
                  {L.flag} {L.label} · {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label} ·
                  {wordCount} words
                </div>
              </div>

              {/* Audio player */}
              <audio
                ref={el => { if (el && audioUrl) el.src = audioUrl; }}
                controls
                className="audio-player"
                aria-label="Your generated voice audio"
              />

              {/* Download */}
              <button
                className="btn-download"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = audioUrl;
                  a.download = `my-voice-${selectedLang}-${Date.now()}.mp3`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                }}
              >
                ⬇️ Download MP3 — Save to Phone / Tablet
              </button>

              <div className="tip" style={{ marginBottom: 16 }}>
                💡 <strong>How to use:</strong> Download and save this file on your child's phone or tablet.
                They can play it anytime — even offline. You can also share it on WhatsApp or Bluetooth.
              </div>

              <div className="done-actions">
                <button className="btn-secondary" onClick={reset} style={{ flex: 1 }}>
                  ✍️ Make Another
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setStep("home");
                    setAudioUrl("");
                    setProgress(0);
                  }}
                >
                  ✏️ Change Voice / Language
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
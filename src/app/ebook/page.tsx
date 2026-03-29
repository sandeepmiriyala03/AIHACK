"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
// ─── Types ────────────────────────────────────────────────────────────────────
type VoiceType = "female" | "male" | "story" | "news";
type Step = "upload" | "voice" | "generating" | "done";

interface LangConfig {
  label: string;
  flag: string;
  googleTTSCode: string;
  sampleText: string;
  voiceId: string | null;
}

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES: Record<string, LangConfig> = {
  eng: { label: "English",    flag: "🌍", googleTTSCode: "en", voiceId: "en_US-hfc_female-medium", sampleText: "Hello! This is a sample." },
  hin: { label: "Hindi",      flag: "🇮🇳", googleTTSCode: "hi", voiceId: null, sampleText: "नमस्ते! यह एक नमूना है।" },
  tam: { label: "Tamil",      flag: "🌸", googleTTSCode: "ta", voiceId: null, sampleText: "வணக்கம்! இது ஒரு மாதிரி." },
  tel: { label: "Telugu",     flag: "🌺", googleTTSCode: "te", voiceId: null, sampleText: "నమస్కారం! ఇది ఒక నమూనా." },
  ben: { label: "Bengali",    flag: "🐯", googleTTSCode: "bn", voiceId: null, sampleText: "নমস্কার! এটি একটি নমুনা।" },
  mar: { label: "Marathi",    flag: "🏔️", googleTTSCode: "mr", voiceId: null, sampleText: "नमस्कार! हे एक नमुना आहे." },
  guj: { label: "Gujarati",   flag: "🦁", googleTTSCode: "gu", voiceId: null, sampleText: "નમસ્તે! આ એક નમૂનો છે." },
  kan: { label: "Kannada",    flag: "🐘", googleTTSCode: "kn", voiceId: null, sampleText: "ನಮಸ್ಕಾರ! ಇದು ಒಂದು ಮಾದರಿ." },
  mal: { label: "Malayalam",  flag: "🌴", googleTTSCode: "ml", voiceId: null, sampleText: "നമസ്കാരം! ഇത് ഒരു സാമ്പിൾ." },
  pan: { label: "Punjabi",    flag: "🪯", googleTTSCode: "pa", voiceId: null, sampleText: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਇਹ ਇੱਕ ਨਮੂਨਾ ਹੈ." },
  urd: { label: "Urdu",       flag: "🌙", googleTTSCode: "ur", voiceId: null, sampleText: "السلام علیکم! یہ ایک نمونہ ہے." },
  nep: { label: "Nepali",     flag: "🏔️", googleTTSCode: "ne", voiceId: null, sampleText: "नमस्ते! यो एउटा नमूना हो।" },
  ori: { label: "Odia",       flag: "🪷", googleTTSCode: "or", voiceId: null, sampleText: "ନମସ୍କାର! ଏହା ଏକ ନମୁନା।" },
  san: { label: "Sanskrit",   flag: "🕉️", googleTTSCode: "sa", voiceId: null, sampleText: "नमस्ते! इदं एकं नमूनाम्।" },
  fra: { label: "French",     flag: "🇫🇷", googleTTSCode: "fr", voiceId: "fr_FR-upmc-medium", sampleText: "Bonjour! C'est un exemple." },
  deu: { label: "German",     flag: "🇩🇪", googleTTSCode: "de", voiceId: "de_DE-eva_k-x_low", sampleText: "Hallo! Dies ist ein Beispiel." },
  spa: { label: "Spanish",    flag: "🇪🇸", googleTTSCode: "es", voiceId: "es_ES-sharvard-medium", sampleText: "Hola! Este es un ejemplo." },
  jpn: { label: "Japanese",   flag: "🇯🇵", googleTTSCode: "ja", voiceId: "ja_JP-kenichi-medium", sampleText: "こんにちは！サンプルです。" },
  kor: { label: "Korean",     flag: "🇰🇷", googleTTSCode: "ko", voiceId: "ko_KR-dawn-x_low", sampleText: "안녕하세요! 샘플입니다." },
  ara: { label: "Arabic",     flag: "🇸🇦", googleTTSCode: "ar", voiceId: null, sampleText: "مرحباً! هذا مثال." },
  rus: { label: "Russian",    flag: "🇷🇺", googleTTSCode: "ru", voiceId: "ru_RU-irina-medium", sampleText: "Привет! Это образец." },
  por: { label: "Portuguese", flag: "🇵🇹", googleTTSCode: "pt", voiceId: "pt_PT-tugao-medium", sampleText: "Olá! Este é um exemplo." },
  ita: { label: "Italian",    flag: "🇮🇹", googleTTSCode: "it", voiceId: "it_IT-riccardo-x_low", sampleText: "Ciao! Questo è un esempio." },
};

const INDIC_CODES = ["hin","tam","tel","ben","mar","guj","kan","mal","pan","urd","nep","ori","san"];

const VOICES: { id: VoiceType; icon: string; label: string; desc: string }[] = [
  { id: "female", icon: "👩", label: "Female",     desc: "Warm & clear" },
  { id: "male",   icon: "👨", label: "Male",       desc: "Deep & steady" },
  { id: "story",  icon: "📖", label: "Storyteller",desc: "Expressive" },
  { id: "news",   icon: "📰", label: "Newsreader", desc: "Professional" },
];

// ─── PDF Validator ────────────────────────────────────────────────────────────
async function validatePDF(file: File): Promise<{ ok: boolean; text: string; error?: string; pageCount?: number }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const str = new TextDecoder("latin1").decode(bytes);

  // Check PDF header
  if (!str.startsWith("%PDF")) {
    return { ok: false, text: "", error: "File is not a valid PDF." };
  }

  // Detect image-only PDF (scanned) — check for image XObjects
  const hasImageXObject = /\/XObject[\s\S]{0,200}\/Image/i.test(str) ||
    /\/Subtype\s*\/Image/i.test(str);
  const hasText = /\/Font/i.test(str) || /BT[\s\S]{0,500}ET/i.test(str);

  // If images found but no text fonts → image-only / scanned PDF
  if (hasImageXObject && !hasText) {
    return {
      ok: false, text: "",
      error: "This PDF contains only images (scanned document). Please upload a text-based PDF so we can extract the content."
    };
  }

  // If images found alongside text — also block (as per requirement)
  if (hasImageXObject) {
    return {
      ok: false, text: "",
      error: "This PDF contains embedded images. Please upload a text-only PDF without any images or diagrams."
    };
  }

  // Extract text from PDF using simple stream parsing
  const extracted = extractTextFromPDF(str);
  if (!extracted || extracted.trim().length < 20) {
    return { ok: false, text: "", error: "Could not extract readable text from this PDF. Make sure it is a text-based PDF, not a scanned image." };
  }

  // Count pages
  const pageMatches = str.match(/\/Type\s*\/Page[^s]/g);
  const pageCount = pageMatches ? pageMatches.length : 1;

  return { ok: true, text: extracted.trim(), pageCount };
}

function extractTextFromPDF(str: string): string {
  let result = "";
  // Extract text between BT ... ET (text blocks)
  const btEt = str.matchAll(/BT([\s\S]{1,2000}?)ET/g);
  for (const match of btEt) {
    const block = match[1];
    // Extract strings in () or <>
    const strings = block.matchAll(/\(([^)]{1,300})\)/g);
    for (const s of strings) {
      result += s[1].replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\\(/g, "(").replace(/\\\)/g, ")") + " ";
    }
    // Hex strings
    const hex = block.matchAll(/<([0-9a-fA-F]{2,300})>/g);
    for (const h of hex) {
      const hexStr = h[1];
      let decoded = "";
      for (let i = 0; i < hexStr.length; i += 2) {
        const code = parseInt(hexStr.slice(i, i + 2), 16);
        if (code > 31 && code < 127) decoded += String.fromCharCode(code);
      }
      if (decoded.length > 1) result += decoded + " ";
    }
  }
  // Clean up
  return result.replace(/\s+/g, " ").replace(/[^\x20-\x7E\u0080-\uFFFF]/g, "").trim();
}

// ─── TTS Call ─────────────────────────────────────────────────────────────────
async function generateAudio(text: string, langCode: string, voice: VoiceType): Promise<Blob> {
  const lang = LANGUAGES[langCode];
  const isIndic = INDIC_CODES.includes(langCode);

  // Try vits-web for langs with voiceId
  if (lang.voiceId && !isIndic) {
    try {
      const tts = await import("@diffusionstudio/vits-web");
      const wavBlob: Blob = await tts.predict({ text: text.slice(0, 1000), voiceId: lang.voiceId as any });
      return wavBlob;
    } catch {}
  }

  // Indic → /api/indic-tts
  if (isIndic) {
    const res = await fetch(`/api/indic-tts?text=${encodeURIComponent(text.slice(0, 1000))}&lang=${lang.googleTTSCode}&voice=${voice}`);
    if (res.ok) {
      const data = await res.json();
      const base64 = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
      if (base64) {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return new Blob([bytes], { type: "audio/mpeg" });
      }
    }
  }

  // Fallback → /api/tts proxy
  const res = await fetch(`/api/tts?text=${encodeURIComponent(text.slice(0, 1000))}&lang=${lang.googleTTSCode}`);
  if (!res.ok) throw new Error("Audio generation failed. Please try again.");
  const buf = await res.arrayBuffer();
  return new Blob([buf], { type: "audio/mpeg" });
}

// ─── Chapter splitter ─────────────────────────────────────────────────────────
function splitChapters(text: string): { title: string; content: string }[] {
  // Try to detect chapters
  const chapterPattern = /(?:^|\n)((?:chapter|ch\.?|part|section|अध्याय|अध्‍याय)\s*[\d\w]+[^\n]*)/gi;
  const matches = [...text.matchAll(chapterPattern)];

  if (matches.length >= 2) {
    const chapters: { title: string; content: string }[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = (matches[i].index ?? 0) + matches[i][0].length;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      const content = text.slice(start, end).trim();
      if (content.length > 50) {
        chapters.push({ title: matches[i][1].trim(), content });
      }
    }
    if (chapters.length > 0) return chapters;
  }

  // No chapters found — split by ~2000 chars at paragraph boundaries
  const paragraphs = text.split(/\n{2,}/);
  const chunks: { title: string; content: string }[] = [];
  let current = "";
  let chNum = 1;
  for (const para of paragraphs) {
    if ((current + para).length > 2000 && current.length > 200) {
      chunks.push({ title: `Part ${chNum}`, content: current.trim() });
      chNum++;
      current = para + "\n\n";
    } else {
      current += para + "\n\n";
    }
  }
  if (current.trim()) chunks.push({ title: `Part ${chNum}`, content: current.trim() });
  return chunks.length > 0 ? chunks : [{ title: "Full Text", content: text }];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AudioBookConverter() {
  const [step, setStep] = useState<Step>("upload");
  const [langSearch, setLangSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState("eng");
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>("female");
  const [pdfText, setPdfText] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);
  const [chapters, setChapters] = useState<{ title: string; content: string }[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string }>({ current: 0, total: 0, label: "" });
  const [audioFiles, setAudioFiles] = useState<{ title: string; url: string; ext: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => { audioUrlsRef.current.forEach(u => URL.revokeObjectURL(u)); };
  }, []);

  const filteredLangs = Object.entries(LANGUAGES).filter(([, l]) =>
    l.label.toLowerCase().includes(langSearch.toLowerCase())
  ).sort(([, a], [, b]) => a.label.localeCompare(b.label));

  const handleFile = useCallback(async (file: File) => {
    setError("");
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file only (.pdf)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("PDF is too large. Please upload a file under 20MB.");
      return;
    }
    setValidating(true);
    const result = await validatePDF(file);
    setValidating(false);
    if (!result.ok) {
      setError(result.error || "Invalid PDF.");
      return;
    }
    setPdfText(result.text);
    setPdfName(file.name.replace(".pdf", ""));
    setPageCount(result.pageCount || 1);
    setStep("voice");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const startGeneration = async () => {
    const chs = splitChapters(pdfText);
    setChapters(chs);
    setStep("generating");
    setProgress({ current: 0, total: chs.length, label: "Starting…" });
    const results: { title: string; url: string; ext: string }[] = [];

    for (let i = 0; i < chs.length; i++) {
      setProgress({ current: i + 1, total: chs.length, label: `Generating "${chs[i].title}"…` });
      try {
        const blob = await generateAudio(chs[i].content, selectedLang, selectedVoice);
        const url = URL.createObjectURL(blob);
        audioUrlsRef.current.push(url);
        const ext = blob.type.includes("mpeg") ? "mp3" : "wav";
        results.push({ title: chs[i].title, url, ext });
      } catch (e: any) {
        results.push({ title: chs[i].title, url: "", ext: "mp3" });
      }
    }
    setAudioFiles(results);
    setStep("done");
  };

  const downloadAll = () => {
    audioFiles.forEach((f, i) => {
      if (!f.url) return;
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = f.url;
        a.download = `${pdfName}_${String(i + 1).padStart(2, "0")}_${f.title.replace(/\s+/g, "_")}.${f.ext}`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }, i * 400);
    });
  };

  const reset = () => {
    audioUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    audioUrlsRef.current = [];
    setStep("upload"); setError(""); setPdfText(""); setPdfName(""); setPageCount(0);
    setChapters([]); setAudioFiles([]); setLangSearch(""); setProgress({ current: 0, total: 0, label: "" });
  };

  const L = LANGUAGES[selectedLang];
  const progressPct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <>
        <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #0F172A; --ink2: #334155; --muted: #94A3B8;
          --bg: #F8FAFC; --surface: #FFFFFF; --border: #E2E8F0;
          --accent: #6366F1; --accent-light: #EEF2FF; --accent-mid: #C7D2FE;
          --green: #059669; --green-light: #ECFDF5; --green-mid: #6EE7B7;
          --red: #DC2626; --red-light: #FEF2F2; --red-mid: #FCA5A5;
          --amber: #D97706; --amber-light: #FFFBEB; --amber-mid: #FDE68A;
          --radius: 16px; --radius-sm: 10px;
          --shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
          --shadow-lg: 0 4px 24px rgba(99,102,241,.12);
        }
        body { background: var(--bg); font-family: 'Sora', sans-serif; color: var(--ink); }

        .page { min-height: 100vh; padding: 32px 16px 80px; background: var(--bg); }
        .container { max-width: 560px; margin: 0 auto; }

        /* Header */
        .header { text-align: center; margin-bottom: 36px; }
        .header-icon { width: 64px; height: 64px; border-radius: 20px;
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 14px; box-shadow: 0 8px 24px rgba(99,102,241,.3); }
        .header-title { font-size: 26px; font-weight: 800; color: var(--ink); margin-bottom: 6px; }
        .header-title span { color: var(--accent); }
        .header-sub { font-size: 13px; color: var(--muted); line-height: 1.6; }

        /* Steps indicator */
        .steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 28px; }
        .step-item { display: flex; align-items: center; gap: 0; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 12px; font-weight: 700; border: 2px solid var(--border);
          background: var(--surface); color: var(--muted); transition: all .2s; flex-shrink: 0; }
        .step-dot.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: var(--shadow-lg); }
        .step-dot.done { background: var(--green); border-color: var(--green); color: #fff; }
        .step-label { font-size: 11px; font-weight: 600; color: var(--muted); margin-left: 6px; white-space: nowrap; }
        .step-label.active { color: var(--accent); }
        .step-label.done { color: var(--green); }
        .step-line { width: 28px; height: 2px; background: var(--border); margin: 0 4px; flex-shrink: 0; }
        .step-line.done { background: var(--green); }

        /* Card */
        .card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border);
          box-shadow: var(--shadow); padding: 24px; margin-bottom: 16px; }

        /* Upload zone */
        .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius);
          padding: 48px 24px; text-align: center; cursor: pointer;
          transition: all .2s; background: var(--bg); }
        .upload-zone:hover, .upload-zone.dragging { border-color: var(--accent);
          background: var(--accent-light); }
        .upload-icon { font-size: 40px; margin-bottom: 12px; }
        .upload-title { font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
        .upload-sub { font-size: 13px; color: var(--muted); line-height: 1.6; }
        .upload-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px;
          padding: 10px 22px; border-radius: var(--radius-sm); background: var(--accent);
          color: #fff; font-size: 13px; font-weight: 600; font-family: inherit; border: none; cursor: pointer;
          transition: all .15s; }
        .upload-btn:hover { background: #4F46E5; transform: translateY(-1px); }

        /* Error */
        .error-box { background: var(--red-light); border: 1px solid var(--red-mid);
          border-radius: var(--radius-sm); padding: 14px 16px;
          display: flex; gap: 10px; align-items: flex-start; margin-bottom: 16px; }
        .error-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .error-text { font-size: 13px; color: var(--red); font-weight: 500; line-height: 1.6; }

        /* Success box */
        .success-box { background: var(--green-light); border: 1px solid var(--green-mid);
          border-radius: var(--radius-sm); padding: 14px 16px;
          display: flex; gap: 10px; align-items: center; margin-bottom: 16px; }

        /* Section label */
        .sec-label { font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .08em; color: var(--muted); margin-bottom: 12px; }

        /* Language search */
        .lang-search { position: relative; margin-bottom: 10px; }
        .lang-search input { width: 100%; padding: 10px 14px 10px 38px;
          border-radius: var(--radius-sm); border: 1.5px solid var(--border);
          background: var(--bg); font-size: 14px; font-family: inherit; color: var(--ink);
          outline: none; transition: border-color .15s; }
        .lang-search input:focus { border-color: var(--accent); background: #fff; }
        .lang-search .search-icon { position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); font-size: 15px; pointer-events: none; }

        /* Language grid */
        .lang-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
          max-height: 280px; overflow-y: auto; padding-right: 4px; }
        .lang-grid::-webkit-scrollbar { width: 4px; }
        .lang-grid::-webkit-scrollbar-track { background: var(--bg); border-radius: 4px; }
        .lang-grid::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .lang-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px;
          border-radius: var(--radius-sm); border: 1.5px solid var(--border);
          cursor: pointer; transition: all .15s; background: var(--surface); }
        .lang-item:hover { border-color: var(--accent-mid); background: var(--accent-light); }
        .lang-item.selected { border-color: var(--accent); background: var(--accent-light); }
        .lang-flag { font-size: 18px; flex-shrink: 0; }
        .lang-name { font-size: 13px; font-weight: 600; color: var(--ink); }
        .lang-badge { font-size: 9px; font-weight: 700; padding: 2px 6px;
          border-radius: 4px; background: var(--green-light); color: var(--green);
          border: 1px solid var(--green-mid); flex-shrink: 0; }

        /* Voice cards */
        .voice-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .voice-card { padding: 14px 12px; border-radius: var(--radius-sm);
          border: 1.5px solid var(--border); cursor: pointer; transition: all .15s;
          background: var(--surface); display: flex; align-items: center; gap: 10px; }
        .voice-card:hover { border-color: var(--accent-mid); background: var(--accent-light); }
        .voice-card.selected { border-color: var(--accent); background: var(--accent-light);
          box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .voice-emoji { font-size: 24px; flex-shrink: 0; }
        .voice-label { font-size: 13px; font-weight: 700; color: var(--ink); }
        .voice-desc { font-size: 11px; color: var(--muted); margin-top: 1px; }

        /* Buttons */
        .btn-primary { width: 100%; padding: 15px; border-radius: var(--radius-sm);
          background: linear-gradient(135deg, var(--accent), #7C3AED); color: #fff;
          border: none; font-size: 15px; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: all .15s; box-shadow: var(--shadow-lg); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(99,102,241,.25); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-secondary { padding: 11px 20px; border-radius: var(--radius-sm);
          background: var(--surface); color: var(--ink2); border: 1.5px solid var(--border);
          font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .15s; }
        .btn-secondary:hover { border-color: var(--accent-mid); color: var(--accent); }
        .btn-green { padding: 13px 24px; border-radius: var(--radius-sm);
          background: var(--green); color: #fff; border: none;
          font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer;
          transition: all .15s; box-shadow: 0 4px 14px rgba(5,150,105,.25); }
        .btn-green:hover { background: #047857; transform: translateY(-1px); }

        /* Progress */
        .progress-wrap { margin: 20px 0; }
        .progress-bar-bg { height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, var(--accent), #7C3AED);
          transition: width .4s ease; }
        .progress-label { font-size: 12px; color: var(--muted); margin-top: 8px;
          display: flex; justify-content: space-between; }

        /* Chapters generating */
        .chapter-list { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
        .chapter-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--border); }
        .chapter-num { width: 24px; height: 24px; border-radius: 50%; background: var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: var(--muted); flex-shrink: 0; }
        .chapter-num.done { background: var(--green); color: #fff; }
        .chapter-num.active { background: var(--accent); color: #fff;
          animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .chapter-title { font-size: 13px; font-weight: 500; color: var(--ink); flex: 1; }
        .chapter-status { font-size: 11px; color: var(--muted); }

        /* Audio files */
        .audio-item { padding: 14px 16px; border-radius: var(--radius-sm);
          background: var(--bg); border: 1px solid var(--border); margin-bottom: 10px; }
        .audio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .audio-title { font-size: 13px; font-weight: 700; color: var(--ink); }
        .audio-dl { padding: 6px 14px; border-radius: 6px; background: var(--accent-light);
          color: var(--accent); border: 1px solid var(--accent-mid);
          font-size: 11px; font-weight: 700; font-family: inherit; cursor: pointer; transition: all .15s; }
        .audio-dl:hover { background: var(--accent); color: #fff; }
        audio { width: 100%; border-radius: 6px; }
        audio::-webkit-media-controls-panel { background: var(--surface); }

        /* PDF info tag */
        .pdf-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
          border-radius: var(--radius-sm); background: var(--amber-light);
          border: 1px solid var(--amber-mid); color: var(--amber); font-size: 12px; font-weight: 600; }

        /* Divider */
        .divider { height: 1px; background: var(--border); margin: 18px 0; }

        /* Validating */
        .validating { display: flex; align-items: center; gap: 10px; padding: 14px 16px;
          background: var(--accent-light); border: 1px solid var(--accent-mid);
          border-radius: var(--radius-sm); color: var(--accent); font-size: 13px; font-weight: 600; }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Rules list */
        .rules { display: flex; flex-direction: column; gap: 6px; }
        .rule { display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--ink2); }
        .rule-icon { font-size: 14px; flex-shrink: 0; }

        @media (max-width: 480px) {
          .lang-grid { grid-template-columns: 1fr 1fr; }
          .voice-grid { grid-template-columns: 1fr 1fr; }
          .header-title { font-size: 22px; }
        }
      `}</style>

      <div className="page">
        <div className="container">

          {/* Header */}
          <div className="header">
            <div className="header-icon">🎧</div>
            <h1 className="header-title">Your Book, <span>in Audio</span></h1>
          <p className="header-sub">
  Upload your manuscript PDF → Choose voice → Download MP3 chapters
</p>
          </div>

          {/* Steps */}
          <div className="steps">
            {[
              { key: "upload", label: "Upload" },
              { key: "voice", label: "Voice" },
              { key: "generating", label: "Generate" },
              { key: "done", label: "Download" },
            ].map((s, i) => {
              const stepKeys: Step[] = ["upload", "voice", "generating", "done"];
              const currentIdx = stepKeys.indexOf(step);
              const thisIdx = i;
              const isDone = currentIdx > thisIdx;
              const isActive = currentIdx === thisIdx;
              return (
                <div key={s.key} className="step-item">
                  {i > 0 && <div className={`step-line${isDone ? " done" : ""}`} />}
                  <div className={`step-dot${isActive ? " active" : isDone ? " done" : ""}`}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span className={`step-label${isActive ? " active" : isDone ? " done" : ""}`}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* ── STEP 1: UPLOAD ── */}
          {step === "upload" && (
            <>
              {error && (
                <div className="error-box">
                  <span className="error-icon">⚠️</span>
                  <div className="error-text">{error}</div>
                </div>
              )}

              {validating && (
                <div className="validating">
                  <span className="spin">⏳</span>
                  Validating PDF — checking for images and extracting text…
                </div>
              )}

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  className={`upload-zone${isDragging ? " dragging" : ""}`}
                  style={{ margin: 0, borderRadius: "15px 15px 0 0", border: "none", borderBottom: "1px solid var(--border)" }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">📄</div>
                  <div className="upload-title">Drop your manuscript PDF here</div>
                  <div className="upload-sub">
                    Text-based PDFs only · Max 20MB<br />
                    Images inside PDF are not supported
                  </div>
                  <button className="upload-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    📁 Choose PDF File
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>

                <div style={{ padding: "16px 20px" }}>
                  <div className="rules">
                    <div className="rule"><span className="rule-icon">✅</span> Text-based PDF (typed or exported from Word)</div>
                    <div className="rule"><span className="rule-icon">✅</span> Novel, article, report, textbook — any text content</div>
                    <div className="rule"><span className="rule-icon">❌</span> Scanned PDFs (photos of pages)</div>
                    <div className="rule"><span className="rule-icon">❌</span> PDFs with embedded images or diagrams</div>
                    <div className="rule"><span className="rule-icon">🔒</span> Your file never leaves your browser — zero data saved</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: VOICE SELECTION ── */}
          {step === "voice" && (
            <>
              {/* PDF confirmed */}
              <div className="success-box">
                <span style={{ fontSize: 20 }}>✅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--green)" }}>PDF validated successfully</div>
                  <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
                    <span className="pdf-tag">📄 {pdfName}.pdf · {pageCount} page{pageCount !== 1 ? "s" : ""} · {(pdfText.length / 1000).toFixed(1)}k chars</span>
                  </div>
                </div>
                <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={reset}>Change</button>
              </div>

              <div className="card">
                {/* Language selection */}
                <div className="sec-label">🌍 Choose Language</div>
                <div className="lang-search">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search language…"
                    value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                  />
                </div>
                <div className="lang-grid">
                  {filteredLangs.map(([code, l]) => (
                    <div
                      key={code}
                      className={`lang-item${selectedLang === code ? " selected" : ""}`}
                      onClick={() => setSelectedLang(code)}
                    >
                      <span className="lang-flag">{l.flag}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="lang-name">{l.label}</div>
                      </div>
                      {INDIC_CODES.includes(code) && <span className="lang-badge">IND</span>}
                    </div>
                  ))}
                  {filteredLangs.length === 0 && (
                    <div style={{ gridColumn: "span 2", textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: 13 }}>
                      No language found for &ldquo;{langSearch}&rdquo;
                    </div>
                  )}
                </div>

                <div className="divider" />

                {/* Voice selection */}
                <div className="sec-label">🎙️ Choose Voice</div>
                <div className="voice-grid">
                  {VOICES.map(v => (
                    <div
                      key={v.id}
                      className={`voice-card${selectedVoice === v.id ? " selected" : ""}`}
                      onClick={() => setSelectedVoice(v.id)}
                    >
                      <span className="voice-emoji">{v.icon}</span>
                      <div>
                        <div className="voice-label">{v.label}</div>
                        <div className="voice-desc">{v.desc}</div>
                      </div>
                      {selectedVoice === v.id && (
                        <span style={{ marginLeft: "auto", color: "var(--accent)", fontSize: 16, flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="divider" />

                {/* Summary */}
                <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-mid)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 4 }}>Ready to generate</div>
                  <div style={{ fontSize: 13, color: "var(--ink2)" }}>
                    📄 <strong>{pdfName}</strong> · {L.flag} {L.label} · {VOICES.find(v => v.id === selectedVoice)?.label} voice
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    Chapters will be auto-detected · Each downloads as a separate MP3
                  </div>
                </div>

                <button className="btn-primary" onClick={startGeneration}>
                  🎧 Generate Audiobook
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: GENERATING ── */}
          {step === "generating" && (
            <div className="card">
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 4 }}>Generating your audiobook…</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{L.flag} {L.label} · {VOICES.find(v => v.id === selectedVoice)?.label} voice</div>
              </div>

              <div className="progress-wrap">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="progress-label">
                  <span>{progress.label}</span>
                  <span>{progressPct}%</span>
                </div>
              </div>

              <div className="chapter-list">
                {chapters.map((ch, i) => {
                  const isDone = i < progress.current;
                  const isActive = i === progress.current - 1 && progress.current <= progress.total;
                  const isWaiting = i >= progress.current;
                  return (
                    <div key={i} className="chapter-item">
                      <div className={`chapter-num${isDone ? " done" : isActive ? " active" : ""}`}>
                        {isDone ? "✓" : i + 1}
                      </div>
                      <span className="chapter-title">{ch.title}</span>
                      <span className="chapter-status">
                        {isDone ? "✅ Done" : isActive ? "⏳ Generating" : "⏸ Waiting"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--amber-light)", border: "1px solid var(--amber-mid)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--amber)", fontWeight: 500 }}>
                🔒 No data is being stored. Audio is generated live and stays in your browser.
              </div>
            </div>
          )}

          {/* ── STEP 4: DONE / DOWNLOAD ── */}
          {step === "done" && (
            <>
              <div className="success-box" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--green)" }}>
                    Audiobook ready! {audioFiles.filter(f => f.url).length} of {audioFiles.length} chapters generated
                  </div>
                  <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
                    {L.flag} {L.label} · {VOICES.find(v => v.id === selectedVoice)?.label} voice · {pdfName}
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>📥 Your Chapters</div>
                  <button className="btn-green" onClick={downloadAll}>
                    ⬇️ Download All
                  </button>
                </div>

                {audioFiles.map((f, i) => (
                  <div key={i} className="audio-item">
                    <div className="audio-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent-light)", border: "1.5px solid var(--accent-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span className="audio-title">{f.title}</span>
                      </div>
                      {f.url ? (
                        <button className="audio-dl" onClick={() => {
                          const a = document.createElement("a");
                          a.href = f.url;
                          a.download = `${pdfName}_${String(i + 1).padStart(2, "0")}_${f.title.replace(/\s+/g, "_")}.${f.ext}`;
                          document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        }}>⬇️ {f.ext.toUpperCase()}</button>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>Failed</span>
                      )}
                    </div>
                    {f.url && <audio controls src={f.url} preload="none" />}
                  </div>
                ))}

                <div className="divider" />

                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="btn-secondary" onClick={reset}>📄 Convert Another Book</button>
                </div>
              </div>

              <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                🔒 All audio was generated locally. Nothing was saved on any server.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
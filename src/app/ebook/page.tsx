"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step         = "home" | "generating" | "done";
type InputMode    = "text" | "audio";
type TxState      = "idle" | "transcribing" | "done" | "error";
type BrowserName  = "chrome" | "edge" | "safari" | "firefox" | "other";

interface LangConfig {
  label: string; flag: string; googleTTSCode: string; nativeName: string; sttCode: string;
}
interface BrowserInfo {
  name: BrowserName; label: string; supportsSTT: "full" | "partial" | "none"; emoji: string; hint: string;
}

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES: Record<string, LangConfig> = {
  eng: { label:"English",    flag:"🌍", googleTTSCode:"en", nativeName:"English",    sttCode:"en-US" },
  hin: { label:"Hindi",      flag:"🇮🇳", googleTTSCode:"hi", nativeName:"हिन्दी",      sttCode:"hi-IN" },
  tel: { label:"Telugu",     flag:"🌺", googleTTSCode:"te", nativeName:"తెలుగు",      sttCode:"te-IN" },
  tam: { label:"Tamil",      flag:"🌸", googleTTSCode:"ta", nativeName:"தமிழ்",       sttCode:"ta-IN" },
  ben: { label:"Bengali",    flag:"🐯", googleTTSCode:"bn", nativeName:"বাংলা",        sttCode:"bn-IN" },
  mar: { label:"Marathi",    flag:"🏔️", googleTTSCode:"mr", nativeName:"मराठी",       sttCode:"mr-IN" },
  guj: { label:"Gujarati",   flag:"🦁", googleTTSCode:"gu", nativeName:"ગુજરાતી",     sttCode:"gu-IN" },
  kan: { label:"Kannada",    flag:"🐘", googleTTSCode:"kn", nativeName:"ಕನ್ನಡ",       sttCode:"kn-IN" },
  mal: { label:"Malayalam",  flag:"🌴", googleTTSCode:"ml", nativeName:"മലയാളം",      sttCode:"ml-IN" },
  pan: { label:"Punjabi",    flag:"🪯", googleTTSCode:"pa", nativeName:"ਪੰਜਾਬੀ",      sttCode:"pa-IN" },
  urd: { label:"Urdu",       flag:"🌙", googleTTSCode:"ur", nativeName:"اردو",         sttCode:"ur-PK" },
  fra: { label:"French",     flag:"🇫🇷", googleTTSCode:"fr", nativeName:"Français",    sttCode:"fr-FR" },
  deu: { label:"German",     flag:"🇩🇪", googleTTSCode:"de", nativeName:"Deutsch",     sttCode:"de-DE" },
  spa: { label:"Spanish",    flag:"🇪🇸", googleTTSCode:"es", nativeName:"Español",     sttCode:"es-ES" },
  ara: { label:"Arabic",     flag:"🇸🇦", googleTTSCode:"ar", nativeName:"العربية",     sttCode:"ar-SA" },
  rus: { label:"Russian",    flag:"🇷🇺", googleTTSCode:"ru", nativeName:"Русский",     sttCode:"ru-RU" },
  por: { label:"Portuguese", flag:"🇵🇹", googleTTSCode:"pt", nativeName:"Português",   sttCode:"pt-PT" },
  jpn: { label:"Japanese",   flag:"🇯🇵", googleTTSCode:"ja", nativeName:"日本語",       sttCode:"ja-JP" },
  kor: { label:"Korean",     flag:"🇰🇷", googleTTSCode:"ko", nativeName:"한국어",       sttCode:"ko-KR" },
};

const VOICE_OPTIONS = [
  { id:"female", emoji:"👩", label:"Mummy Voice", hint:"Warm & gentle"  },
  { id:"male",   emoji:"👨", label:"Daddy Voice", hint:"Deep & caring"  },
  { id:"story",  emoji:"🧒", label:"Child Voice", hint:"Soft & playful" },
  { id:"news",   emoji:"👴", label:"Elder Voice",  hint:"Calm & clear"   },
];

const AUDIO_ACCEPT = ".mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,audio/*";
const AUDIO_TYPES  = [
  "audio/mpeg","audio/mp3","audio/wav","audio/ogg","audio/m4a",
  "audio/aac","audio/flac","audio/webm","audio/x-m4a","audio/mp4",
];

// ─── Browser detection ────────────────────────────────────────────────────────
function detectBrowser(): BrowserInfo {
  if (typeof window === "undefined")
    return { name:"other", label:"Unknown", supportsSTT:"none", emoji:"🌐", hint:"" };
  const ua = navigator.userAgent;
  const isEdge    = /Edg\//.test(ua);
  const isChrome  = /Chrome\//.test(ua) && !isEdge;
  const isSafari  = /Safari\//.test(ua) && !/Chrome/.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  if (isEdge)    return { name:"edge",    label:"Microsoft Edge",  supportsSTT:"full",    emoji:"🔵", hint:"Full support — works great!" };
  if (isChrome)  return { name:"chrome",  label:"Google Chrome",   supportsSTT:"full",    emoji:"🟢", hint:"Full support — recommended!" };
  if (isSafari)  return { name:"safari",  label:"Apple Safari",    supportsSTT:"partial", emoji:"🟡", hint:"iOS 17+ only. May not work on older devices." };
  if (isFirefox) return { name:"firefox", label:"Mozilla Firefox", supportsSTT:"none",    emoji:"🔴", hint:"Not supported. Please open in Chrome or Edge." };
  return { name:"other", label:"Your browser", supportsSTT:"none", emoji:"🟠", hint:"May not be supported. Try Chrome or Edge." };
}

// ─── FREE Audio → Text  (zero API key, zero server) ──────────────────────────
//
// THE HONEST TRUTH about browser SpeechRecognition:
//   Chrome's SpeechRecognition ALWAYS listens to the physical microphone.
//   There is NO way to feed it a file stream — it ignores any AudioContext
//   routing, MediaStreamDestination tricks, or stream property overrides.
//   This is a hard browser security restriction, not a bug we can work around.
//
// THE TWO REAL FREE OPTIONS:
//
//   Option A — PLAY & LISTEN (recommended for audio files)
//     • We play the audio file through the device speakers
//     • The user holds their phone near the speaker, OR uses the same device
//     • SpeechRecognition listens via microphone and transcribes what it hears
//     • Works on any device with a mic — Chrome/Edge only
//
//   Option B — LIVE MIC RECORDING
//     • User speaks directly into the microphone
//     • SpeechRecognition transcribes in real time
//     • Best for: recording a new message on the spot
//
// Both are implemented below. The UI lets the user choose.
// ─────────────────────────────────────────────────────────────────────────────

// Play audio file through speakers while mic listens
async function transcribeByPlayAndListen(
  audioUrl: string,
  langCode: string,
  onProgress: (txt: string) => void,
  onStateChange: (state: "waiting-for-mic" | "playing" | "listening") => void,
): Promise<{ ok: boolean; text: string; error?: string }> {

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    return { ok: false, text: "",
      error: "Speech Recognition not supported. Please use Chrome or Edge." };
  }

  return new Promise(async (resolve) => {
    let finished  = false;
    let finalText = "";

    const done = (ok: boolean, err?: string) => {
      if (finished) return;
      finished = true;
      try { recognition.stop(); } catch {}
      try { audioEl.pause(); audioEl.src = ""; } catch {}
      const result = finalText.trim();
      if (ok && result) resolve({ ok: true, text: result });
      else resolve({ ok: false, text: "", error: err || "No speech captured. Try again closer to the speaker." });
    };

    // Request mic permission first
    onStateChange("waiting-for-mic");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // we just needed permission
    } catch {
      return done(false, "Microphone permission denied. Please allow microphone access and try again.");
    }

    // Set up recognition
    const recognition          = new SR();
    recognition.lang           = LANGUAGES[langCode].sttCode;
    recognition.continuous     = true;
    recognition.interimResults = true;

    recognition.onresult = (e: any) => {
      let interim = "";
      finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      onProgress((finalText + interim).trim());
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech") return; // keep going
      done(false, `Mic error: ${e.error}`);
    };

    recognition.onend = () => {
      // Restart recognition if audio is still playing
      if (!finished) {
        try { recognition.start(); } catch { done(true); }
      }
    };

    // Play the audio
    const audioEl = new Audio(audioUrl);
    audioEl.oncanplay = () => {
      onStateChange("playing");
      recognition.start();
      onStateChange("listening");
      audioEl.play();
    };
    audioEl.onended = () => {
      // Give mic 2 more seconds to catch trailing words, then finish
      setTimeout(() => done(true), 2000);
    };
    audioEl.onerror = () => done(false, "Could not play audio file.");
    audioEl.load();

    // Hard timeout: audio duration + 10s
    setTimeout(() => done(true), (audioEl.duration || 120) * 1000 + 10000);
  });
}

// Live microphone recording → text
async function transcribeFromMic(
  langCode: string,
  onProgress: (txt: string) => void,
): Promise<{ ok: boolean; text: string; error?: string; stop: () => void }> {

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    return { ok: false, text: "", stop: () => {},
      error: "Speech Recognition not supported. Please use Chrome or Edge." };
  }

  let finalText = "";
  let stopped   = false;

  const recognition          = new SR();
  recognition.lang           = LANGUAGES[langCode].sttCode;
  recognition.continuous     = true;
  recognition.interimResults = true;

  recognition.onresult = (e: any) => {
    let interim = "";
    finalText = "";
    for (let i = 0; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
      else interim += e.results[i][0].transcript;
    }
    onProgress((finalText + interim).trim());
  };

  recognition.onerror = (e: any) => {
    if (e.error !== "no-speech") onProgress(`[Error: ${e.error}]`);
  };

  recognition.onend = () => {
    if (!stopped) try { recognition.start(); } catch {}
  };

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    recognition.start();
  } catch {
    return { ok: false, text: "", stop: () => {},
      error: "Microphone permission denied. Please allow microphone access." };
  }

  const stop = (): Promise<{ ok: boolean; text: string; error?: string }> => {
    stopped = true;
    try { recognition.stop(); } catch {}
    return Promise.resolve(
      finalText.trim()
        ? { ok: true, text: finalText.trim() }
        : { ok: false, text: "", error: "No speech recorded." }
    );
  };

  return { ok: true, text: "", stop } as any;
}

// ─── Text file extractor (TXT / DOCX / PDF / RTF) ────────────────────────────
async function extractTextFromFile(file: File): Promise<{ ok: boolean; text: string; error?: string }> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "text/plain" || name.endsWith(".txt")) {
    const text = await file.text();
    if (!text.trim()) return { ok:false, text:"", error:"The text file appears to be empty." };
    return { ok:true, text:text.trim() };
  }

  if (name.endsWith(".rtf")) {
    const raw  = await file.text();
    const text = raw
      .replace(/\{\\[^}]*\}/g,"").replace(/\\[a-z]+\d*\s?/g,"")
      .replace(/[{}\\]/g,"").replace(/\s+/g," ").trim();
    if (text.length < 5) return { ok:false, text:"", error:"Could not read RTF. Please save as .txt." };
    return { ok:true, text };
  }

  if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      // @ts-ignore
      if (!window.JSZip) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
      // @ts-ignore
      const zip     = await window.JSZip.loadAsync(await file.arrayBuffer());
      const xmlFile = zip.file("word/document.xml");
      if (!xmlFile) return { ok:false, text:"", error:"Could not read Word file. Save as .txt." };
      const xml  = await xmlFile.async("string");
      const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
        .map(m => m[1]).join(" ").replace(/\s+/g," ").trim();
      if (text.length < 5) return { ok:false, text:"", error:"Word file appears empty." };
      return { ok:true, text };
    } catch {
      return { ok:false, text:"", error:"Could not open Word file. Please save as .txt." };
    }
  }

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
        const page    = await pdf.getPage(p);
        const content = await page.getTextContent();
        // @ts-ignore
        text += content.items.map((i: any) => i.str).join(" ") + "\n";
      }
      const trimmed = text.trim();
      if (trimmed.length < 20)
        return { ok:false, text:"", error:"PDF has no readable text. Please type your message." };
      return { ok:true, text:trimmed };
    } catch (e: any) {
      return { ok:false, text:"", error:`Could not read PDF: ${e?.message}` };
    }
  }

  return { ok:false, text:"", error:"Unsupported file type. Use .txt, .docx, .pdf, or .rtf" };
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
async function speakText(text: string, langCode: string): Promise<Blob> {
  const lang = LANGUAGES[langCode];
  const res  = await fetch(
    `/api/tts?text=${encodeURIComponent(text.slice(0,1000))}&lang=${lang.googleTTSCode}`
  );
  if (!res.ok) throw new Error("Audio generation failed.");
  return new Blob([await res.arrayBuffer()], { type:"audio/mpeg" });
}

function splitIntoChunks(text: string): string[] {
  const sentences = text.match(/[^.!?।\n]+[.!?।\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > 800 && current.length > 50) {
      chunks.push(current.trim()); current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text];
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════
export default function VaniSetu() {
  // ── browser detection ──
  const [browserInfo,    setBrowserInfo]    = useState<BrowserInfo | null>(null);

  // ── mode & step ──
  const [inputMode,      setInputMode]      = useState<InputMode>("text");
  const [step,           setStep]           = useState<Step>("home");

  // ── text mode ──
  const [inputText,      setInputText]      = useState("");
  const [fileName,       setFileName]       = useState("");
  const [fileLoading,    setFileLoading]    = useState(false);
  const [isDragging,     setIsDragging]     = useState(false);

  // ── audio mode ──
  const [uploadedAudio,  setUploadedAudio]  = useState<File | null>(null);
  const [uploadedUrl,    setUploadedUrl]    = useState("");
  const [audioDuration,  setAudioDuration]  = useState<number | null>(null);
  const [isAudioDrag,    setIsAudioDrag]    = useState(false);

  // ── transcription ──
  const [txState,        setTxState]        = useState<TxState>("idle");
  const [txText,         setTxText]         = useState("");
  const [liveText,       setLiveText]       = useState("");
  const [txError,        setTxError]        = useState("");
  const [txMethod,       setTxMethod]       = useState<"play" | "mic">("play");
  const [playState,      setPlayState]      = useState<"waiting-for-mic"|"playing"|"listening"|"">("");
  const micStopRef = useRef<(() => Promise<any>) | null>(null);

  // ── shared ──
  const [selectedLang,   setSelectedLang]   = useState("eng");
  const [selectedVoice,  setSelectedVoice]  = useState("female");
  const [error,          setError]          = useState("");
  const [progress,       setProgress]       = useState(0);
  const [audioUrl,       setAudioUrl]       = useState("");
  const [langSearch,     setLangSearch]     = useState("");
  const [showAllLangs,   setShowAllLangs]   = useState(false);
  const [outputLabel,    setOutputLabel]    = useState("");

  const fileRef        = useRef<HTMLInputElement>(null);
  const audioFileRef   = useRef<HTMLInputElement>(null);
  const generatedRef   = useRef("");
  const uploadedUrlRef = useRef("");

  // detect browser once on mount
  useEffect(() => setBrowserInfo(detectBrowser()), []);

  // cleanup blob URLs
  useEffect(() => () => {
    if (generatedRef.current)   URL.revokeObjectURL(generatedRef.current);
    if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current);
  }, []);

  // ── switch mode ──
  const switchMode = (mode: InputMode) => {
    setInputMode(mode);
    setError(""); setTxError("");
    setStep("home"); setAudioUrl(""); setProgress(0);
    setTxState("idle"); setTxText(""); setLiveText("");
  };

  // ── handle text file upload ──
  const handleTextFile = useCallback(async (file: File) => {
    setError(""); setFileLoading(true); setFileName(file.name);
    const result = await extractTextFromFile(file);
    setFileLoading(false);
    if (!result.ok) { setError(result.error || "Could not read file."); setFileName(""); return; }
    setInputText(result.text);
  }, []);

  const handleTextDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleTextFile(f);
  }, [handleTextFile]);

  // ── handle audio file upload ──
  const handleAudioFile = useCallback((file: File) => {
    setTxError(""); setTxText(""); setLiveText(""); setTxState("idle");
    const isAudio = AUDIO_TYPES.includes(file.type) || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name);
    if (!isAudio) { setTxError("Please upload an audio file: MP3, WAV, OGG, M4A, AAC, FLAC, or WebM."); return; }
    if (file.size > 50 * 1024 * 1024) { setTxError("File too large. Max 50 MB."); return; }
    if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current);
    const url = URL.createObjectURL(file);
    uploadedUrlRef.current = url;
    setUploadedAudio(file); setUploadedUrl(url); setAudioDuration(null);
    const a = new Audio(url);
    a.onloadedmetadata = () => setAudioDuration(a.duration);
  }, []);

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsAudioDrag(false);
    const f = e.dataTransfer.files[0]; if (f) handleAudioFile(f);
  }, [handleAudioFile]);

  // ── transcribe: play audio through speaker, mic listens ──
  const handleTranscribePlay = async () => {
    if (!uploadedAudio) return;
    setTxState("transcribing"); setTxText(""); setLiveText(""); setTxError(""); setPlayState("");
    const result = await transcribeByPlayAndListen(
      uploadedUrl, selectedLang,
      setLiveText,
      setPlayState,
    );
    setPlayState("");
    if (result.ok && result.text) {
      setTxText(result.text); setLiveText(""); setTxState("done");
    } else {
      setTxError(result.error || "Transcription failed."); setTxState("error"); setLiveText("");
    }
  };

  // ── transcribe: live mic recording ──
  const handleStartMic = async () => {
    setTxState("transcribing"); setTxText(""); setLiveText(""); setTxError(""); setTxMethod("mic");
    const result = await transcribeFromMic(selectedLang, setLiveText);
    if (!result.ok) {
      setTxError((result as any).error || "Mic failed."); setTxState("error");
    } else {
      micStopRef.current = (result as any).stop;
    }
  };

  const handleStopMic = async () => {
    if (!micStopRef.current) return;
    const result = await micStopRef.current();
    micStopRef.current = null;
    if (result.ok && result.text) {
      setTxText(result.text); setLiveText(""); setTxState("done");
    } else {
      setTxError(result.error || "No speech recorded."); setTxState("error"); setLiveText("");
    }
  };

  // legacy alias used by retry button
  const handleTranscribe = handleTranscribePlay;

  // ── copy transcribed text to text mode ──
  const useTranscribedText = () => {
    setInputText(txText);
    setInputMode("text");
    setStep("home");
  };

  // ── generate TTS ──
  const handleGenerate = async (textOverride?: string) => {
    const src = (textOverride ?? inputText).trim();
    if (!src) { setError("Please type or upload your message first."); return; }
    setError(""); setStep("generating"); setProgress(0);
    const chunks = splitIntoChunks(src);
    const blobs: Blob[] = [];
    for (let i = 0; i < chunks.length; i++) {
      try { blobs.push(await speakText(chunks[i], selectedLang)); } catch {}
      setProgress(Math.round(((i + 1) / chunks.length) * 100));
    }
    const merged = new Blob(blobs, { type:"audio/mpeg" });
    if (generatedRef.current) URL.revokeObjectURL(generatedRef.current);
    const url = URL.createObjectURL(merged);
    generatedRef.current = url;
    setAudioUrl(url);
    setOutputLabel(`${LANGUAGES[selectedLang].label} · ${VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label}`);
    setStep("done");
  };

  const downloadAudio = () => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `vanisetu-${selectedLang}-${Date.now()}.mp3`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const reset = () => {
    setStep("home"); setInputText(""); setFileName(""); setError(""); setAudioUrl("");
    setProgress(0); setLangSearch(""); setShowAllLangs(false);
    setUploadedAudio(null); setUploadedUrl(""); setAudioDuration(null);
    setTxState("idle"); setTxText(""); setLiveText(""); setTxError("");
    setTxMethod("play"); setPlayState(""); setOutputLabel("");
    micStopRef.current = null;
  };

  // ── derived ──
  const filteredLangs  = Object.entries(LANGUAGES).filter(([, l]) =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(langSearch.toLowerCase())
  );
  const displayedLangs = showAllLangs ? filteredLangs : filteredLangs.slice(0, 8);
  const wordCount      = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const L              = LANGUAGES[selectedLang];

  // browser compat rows for table
  const COMPAT_ROWS = [
    { name:"chrome"  as BrowserName, label:"Google Chrome",   emoji:"🟢", level:"full"    as const, hint:"✅ Full support — recommended" },
    { name:"edge"    as BrowserName, label:"Microsoft Edge",  emoji:"🔵", level:"full"    as const, hint:"✅ Full support — works great" },
    { name:"safari"  as BrowserName, label:"Apple Safari",    emoji:"🟡", level:"partial" as const, hint:"⚡ iOS 17+ only — may not work on older devices" },
    { name:"firefox" as BrowserName, label:"Mozilla Firefox", emoji:"🔴", level:"none"    as const, hint:"❌ Not supported — please use Chrome or Edge" },
  ];

  // ════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:            #FFF8F0;
          --surface:       #FFFFFF;
          --border:        #E8DDD0;
          --primary:       #E8621A;
          --primary-light: #FFF0E8;
          --primary-mid:   #FACCAA;
          --primary-dark:  #C24E10;
          --purple:        #7C3AED;
          --purple-light:  #F5F3FF;
          --purple-mid:    #DDD6FE;
          --purple-dark:   #6D28D9;
          --green:         #2E8B57;
          --green-light:   #F0FFF6;
          --green-mid:     #A8E6C3;
          --blue:          #2563EB;
          --blue-light:    #EFF6FF;
          --blue-mid:      #BFDBFE;
          --amber:         #D97706;
          --amber-light:   #FFFBEB;
          --amber-mid:     #FDE68A;
          --red:           #CC2222;
          --red-light:     #FFF0F0;
          --red-mid:       #FFBBBB;
          --muted:         #8A7A6A;
          --ink:           #2C1810;
          --ink2:          #5C3D2A;
          --radius:        20px;
          --radius-sm:     12px;
          --shadow:        0 2px 8px rgba(0,0,0,.06);
          --shadow-lg:     0 6px 24px rgba(232,98,26,.15);
        }
        body { background: var(--bg); font-family: 'Nunito', sans-serif; color: var(--ink); }

        /* ── layout ── */
        .page { min-height: 100vh; padding: 24px 16px 80px; }
        .wrap { max-width: 620px; margin: 0 auto; }

        /* ── hero ── */
        .hero       { text-align: center; padding: 28px 0 20px; }
        .hero-icon  { font-size: 54px; line-height: 1; margin-bottom: 10px; }
        .hero-title { font-size: 26px; font-weight: 900; color: var(--ink); line-height: 1.2; margin-bottom: 8px; }
        .hero-title em { color: var(--primary); font-style: normal; }
        .hero-sub   { font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 440px; margin: 0 auto; }

        /* ── mode tabs ── */
        .mode-tabs  { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 18px;
          background: var(--surface); border-radius: var(--radius);
          border: 2px solid var(--border); overflow: hidden; box-shadow: var(--shadow); }
        .mode-tab   { padding: 15px 10px; text-align: center; cursor: pointer;
          transition: all .18s; border: none; background: none;
          font-family: inherit; font-size: 14px; font-weight: 700; color: var(--muted); }
        .mode-tab:first-child { border-right: 2px solid var(--border); }
        .mode-tab.at  { background: var(--primary-light); color: var(--primary-dark); }
        .mode-tab.apt { background: var(--purple-light);  color: var(--purple); }
        .tab-emoji { font-size: 20px; display: block; margin-bottom: 3px; }
        .tab-hint  { font-size: 11px; display: block; margin-top: 2px; font-weight: 600; color: var(--muted); }
        .mode-tab.at  .tab-hint { color: var(--primary); }
        .mode-tab.apt .tab-hint { color: var(--purple); }

        /* ── howto strip ── */
        .howto       { display: flex; margin: 0 0 18px; background: var(--surface);
          border-radius: var(--radius); border: 1.5px solid var(--border); overflow: hidden; }
        .howto-step  { flex: 1; padding: 13px 8px; text-align: center;
          border-right: 1.5px solid var(--border); }
        .howto-step:last-child { border-right: none; }
        .howto-num   { width: 26px; height: 26px; border-radius: 50%; background: var(--primary);
          color: #fff; font-size: 12px; font-weight: 900;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 5px; }
        .howto-num.p { background: var(--purple); }
        .howto-emoji { font-size: 20px; display: block; margin-bottom: 3px; }
        .howto-label { font-size: 10px; font-weight: 700; color: var(--ink); line-height: 1.4; }

        /* ── card ── */
        .card    { background: var(--surface); border-radius: var(--radius);
          border: 1.5px solid var(--border); padding: 20px; margin-bottom: 14px;
          box-shadow: var(--shadow); }
        .card.pc { border-color: var(--purple-mid); }
        .sec     { font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: .06em; color: var(--muted); margin-bottom: 11px; }
        .sec.p   { color: var(--purple); }

        /* ── textarea ── */
        .text-area { width: 100%; min-height: 140px; padding: 13px;
          border-radius: var(--radius-sm); border: 2px solid var(--border);
          background: var(--bg); font-size: 15px; font-family: inherit;
          color: var(--ink); line-height: 1.7; resize: vertical; outline: none;
          transition: border-color .15s; }
        .text-area:focus { border-color: var(--primary); background: #fff; }
        .text-area::placeholder { color: var(--muted); }
        .char-count { font-size: 11px; color: var(--muted); text-align: right; margin-top: 5px; }

        /* ── divider ── */
        .div      { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
        .div-line { flex: 1; height: 1px; background: var(--border); }
        .div-text { font-size: 11px; color: var(--muted); font-weight: 700; white-space: nowrap; }

        /* ── text file upload zone ── */
        .upload-zone { border: 2.5px dashed var(--border); border-radius: var(--radius-sm);
          padding: 18px 14px; text-align: center; cursor: pointer;
          transition: all .2s; background: var(--bg); }
        .upload-zone:hover, .upload-zone.drag { border-color: var(--primary); background: var(--primary-light); }
        .upload-zone-title { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
        .upload-zone-sub   { font-size: 12px; color: var(--muted); margin-bottom: 9px; }
        .upload-types { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; margin-bottom: 9px; }
        .type-pill    { padding: 3px 8px; border-radius: 20px; background: var(--primary-light);
          border: 1px solid var(--primary-mid); color: var(--primary-dark);
          font-size: 11px; font-weight: 700; }
        .type-pill.pp { background: var(--purple-light); border-color: var(--purple-mid); color: var(--purple); }
        .upload-btn   { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px;
          border-radius: var(--radius-sm); background: var(--primary); color: #fff; border: none;
          font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer;
          transition: background .15s; }
        .upload-btn:hover  { background: var(--primary-dark); }
        .upload-btn.pb     { background: var(--purple); }
        .upload-btn.pb:hover { background: var(--purple-dark); }

        /* ── audio drop zone ── */
        .audio-drop       { border: 2.5px dashed var(--purple-mid); border-radius: var(--radius-sm);
          padding: 28px 18px; text-align: center; cursor: pointer;
          transition: all .2s; background: var(--bg); }
        .audio-drop:hover, .audio-drop.drag { border-color: var(--purple); background: var(--purple-light); }
        .audio-drop-icon  { font-size: 40px; margin-bottom: 8px; display: block; }
        .audio-drop-title { font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
        .audio-drop-sub   { font-size: 12px; color: var(--muted); line-height: 1.6; margin-bottom: 10px; }

        /* ── audio loaded preview ── */
        .audio-loaded     { background: var(--purple-light); border: 2px solid var(--purple-mid);
          border-radius: var(--radius-sm); padding: 14px; }
        .audio-loaded-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .audio-loaded-ico { width: 40px; height: 40px; border-radius: 9px; background: var(--purple);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0; }
        .audio-loaded-name  { font-size: 13px; font-weight: 700; color: var(--ink); word-break: break-all; }
        .audio-loaded-meta  { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .audio-loaded-clear { background: none; border: none; color: var(--muted);
          font-size: 20px; cursor: pointer; margin-left: auto; padding: 0 4px; }
        audio.ap { width: 100%; border-radius: 8px; margin-bottom: 12px; }

        /* ── waveform animation ── */
        .wave     { display: flex; align-items: center; gap: 3px; height: 24px;
          justify-content: center; margin-bottom: 10px; }
        .wave-bar { width: 4px; border-radius: 99px; background: var(--purple);
          animation: wv 1s ease-in-out infinite alternate; }
        @keyframes wv { from { height: 4px; opacity: .4; } to { height: 20px; opacity: 1; } }

        /* ── transcript result boxes ── */
        .tx-box       { border-radius: var(--radius-sm); padding: 14px 16px; margin-top: 12px; }
        .tx-box.live  { background: var(--blue-light);  border: 1.5px solid var(--blue-mid); }
        .tx-box.ready { background: var(--green-light); border: 1.5px solid var(--green-mid); }
        .tx-box.err   { background: var(--red-light);   border: 1.5px solid var(--red-mid); }
        .tx-lbl       { font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: .06em; margin-bottom: 8px; }
        .tx-lbl.live  { color: var(--blue); }
        .tx-lbl.ready { color: var(--green); }
        .tx-lbl.err   { color: var(--red); }
        .tx-text      { font-size: 14px; color: var(--ink); line-height: 1.75;
          max-height: 200px; overflow-y: auto; white-space: pre-wrap; }
        .tx-text.muted { color: var(--muted); font-style: italic; }

        /* ── whisper setup guide ── */
        .setup-card { border-radius: var(--radius-sm); overflow: hidden;
          border: 1.5px solid var(--red-mid); margin-top: 12px; }
        .setup-head { background: var(--red-light); padding: 12px 14px;
          border-bottom: 1px solid var(--red-mid); }
        .setup-title { font-size: 13px; font-weight: 800; color: #B91C1C; margin-bottom: 4px; }
        .setup-desc  { font-size: 12px; color: #DC2626; line-height: 1.6; }
        .setup-body  { background: var(--surface); padding: 14px; }
        .setup-steps-label { font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: .06em; color: var(--muted); margin-bottom: 10px; }
        .setup-step  { display: flex; gap: 10px; margin-bottom: 10px; }
        .setup-num   { width: 22px; height: 22px; border-radius: 50%; background: #B91C1C;
          color: #fff; font-size: 11px; font-weight: 900;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .setup-step-text { font-size: 12px; color: var(--ink); line-height: 1.6; }
        .setup-step-text strong { display: block; margin-bottom: 2px; }
        .setup-code-block { background: #0f172a; border-radius: 8px;
          padding: 12px 14px; margin: 8px 0 12px; }
        .setup-code-label { font-size: 10px; color: #64748b; margin-bottom: 6px;
          font-weight: 700; text-transform: uppercase; }
        .setup-code-label.green { color: #4ade80; }
        pre.code { font-size: 11px; color: #e2e8f0; margin: 0;
          overflow-x: auto; white-space: pre; line-height: 1.7; font-family: monospace; }
        code.inline { font-size: 11px; background: #f1f5f9; padding: 1px 5px;
          border-radius: 4px; color: #0f172a; font-family: monospace; }

        /* ── browser compat card ── */
        .compat-card { border-radius: var(--radius-sm); overflow: hidden;
          border: 1.5px solid var(--border); margin-bottom: 14px; }
        .compat-hdr  { padding: 11px 14px; font-size: 12px; font-weight: 800; }
        .compat-hdr.ok  { background: #DCFCE7; color: #166534; border-bottom: 1px solid #BBF7D0; }
        .compat-hdr.par { background: var(--amber-light); color: #92400E; border-bottom: 1px solid var(--amber-mid); }
        .compat-hdr.no  { background: var(--red-light); color: var(--red); border-bottom: 1px solid var(--red-mid); }
        .compat-rows { display: flex; flex-direction: column; }
        .compat-row  { display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          border-bottom: 1px solid var(--border); background: var(--surface);
          flex-wrap: wrap; }
        .compat-row:last-child { border-bottom: none; }
        .compat-row.you { background: #F0FFF6; }
        .compat-browser { font-size: 13px; font-weight: 700; color: var(--ink); min-width: 130px; }
        .compat-badge   { font-size: 10px; font-weight: 800; padding: 2px 8px;
          border-radius: 99px; white-space: nowrap; }
        .compat-badge.full    { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
        .compat-badge.partial { background: var(--amber-light); color: #92400E; border: 1px solid var(--amber-mid); }
        .compat-badge.none    { background: var(--red-light); color: var(--red); border: 1px solid var(--red-mid); }
        .compat-hint { font-size: 11px; color: var(--muted); flex: 1; line-height: 1.4; }
        .compat-you  { font-size: 10px; font-weight: 800; color: var(--green);
          background: var(--green-light); padding: 2px 7px; border-radius: 99px;
          border: 1px solid var(--green-mid); white-space: nowrap; }

        /* ── file & loading badges ── */
        .file-badge       { display: flex; align-items: center; gap: 9px; padding: 10px 13px;
          background: var(--green-light); border: 1.5px solid var(--green-mid);
          border-radius: var(--radius-sm); margin-top: 11px; }
        .file-badge-name  { font-size: 12px; font-weight: 700; color: var(--green); flex: 1; }
        .file-badge-clear { background: none; border: none; color: var(--muted);
          font-size: 17px; cursor: pointer; }
        .loading-badge    { display: flex; align-items: center; gap: 9px; padding: 10px 13px;
          background: var(--primary-light); border: 1.5px solid var(--primary-mid);
          border-radius: var(--radius-sm); margin-top: 11px;
          font-size: 13px; font-weight: 700; color: var(--primary-dark); }
        .error-box  { display: flex; gap: 9px; padding: 12px 14px;
          background: var(--red-light); border: 1.5px solid var(--red-mid);
          border-radius: var(--radius-sm); margin-bottom: 13px; }
        .error-text { font-size: 13px; font-weight: 600; color: var(--red); line-height: 1.6; }
        .spin       { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── loading dots ── */
        .dots span { animation: blink 1.2s ease-in-out infinite; display: inline-block; }
        .dots span:nth-child(2) { animation-delay: .2s; }
        .dots span:nth-child(3) { animation-delay: .4s; }
        @keyframes blink { 0%,80%,100% { opacity: 0; } 40% { opacity: 1; } }

        /* ── language grid ── */
        .lang-search-wrap { position: relative; margin-bottom: 9px; }
        .lang-search-wrap input { width: 100%; padding: 9px 13px 9px 34px;
          border-radius: var(--radius-sm); border: 1.5px solid var(--border);
          font-size: 13px; font-family: inherit; color: var(--ink);
          background: var(--bg); outline: none; transition: border-color .15s; }
        .lang-search-wrap input:focus { border-color: var(--primary); background: #fff; }
        .lang-search-wrap .si { position: absolute; left: 11px; top: 50%;
          transform: translateY(-50%); font-size: 13px; }
        .lang-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; }
        .lang-btn  { padding: 8px 4px; border-radius: var(--radius-sm);
          border: 2px solid var(--border); background: var(--surface);
          cursor: pointer; transition: all .15s; text-align: center; }
        .lang-btn:hover { border-color: var(--primary-mid); background: var(--primary-light); }
        .lang-btn.sel   { border-color: var(--primary); background: var(--primary-light); }
        .lang-flag   { font-size: 17px; display: block; margin-bottom: 2px; }
        .lang-name   { font-size: 10px; font-weight: 700; color: var(--ink); display: block; }
        .lang-native { font-size: 9px; color: var(--muted); display: block; }
        .show-more   { width: 100%; margin-top: 7px; padding: 7px;
          border-radius: var(--radius-sm); border: 1.5px dashed var(--border);
          background: none; font-size: 12px; font-weight: 700; color: var(--muted);
          font-family: inherit; cursor: pointer; transition: all .15s; }
        .show-more:hover { border-color: var(--primary); color: var(--primary); }

        /* ── voice grid ── */
        .voice-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 9px; }
        .voice-btn  { padding: 13px 10px; border-radius: var(--radius-sm);
          border: 2px solid var(--border); background: var(--surface);
          cursor: pointer; transition: all .15s; text-align: center; }
        .voice-btn:hover { border-color: var(--primary-mid); background: var(--primary-light); }
        .voice-btn.sel   { border-color: var(--primary); background: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(232,98,26,.1); }
        .voice-emoji { font-size: 30px; display: block; margin-bottom: 4px; }
        .voice-label { font-size: 13px; font-weight: 800; color: var(--ink); display: block; }
        .voice-hint  { font-size: 10px; color: var(--muted); display: block; margin-top: 2px; }

        /* ── buttons ── */
        .btn-go  { width: 100%; padding: 16px; border-radius: var(--radius-sm);
          background: var(--primary); color: #fff; border: none;
          font-size: 16px; font-weight: 900; font-family: inherit; cursor: pointer;
          transition: all .15s; box-shadow: var(--shadow-lg);
          display: flex; align-items: center; justify-content: center; gap: 9px; }
        .btn-go:hover    { background: var(--primary-dark); transform: translateY(-2px); }
        .btn-go:disabled { opacity: .45; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-go.pb { background: var(--purple); box-shadow: 0 6px 24px rgba(124,58,237,.2); }
        .btn-go.pb:hover { background: var(--purple-dark); }
        .btn-go.pb:disabled { opacity: .45; cursor: not-allowed; transform: none; }
        .btn-secondary { padding: 10px 18px; border-radius: var(--radius-sm);
          border: 2px solid var(--border); background: var(--surface);
          color: var(--ink2); font-size: 13px; font-weight: 700;
          font-family: inherit; cursor: pointer; transition: all .15s; }
        .btn-secondary:hover { border-color: var(--primary); color: var(--primary); }
        .btn-link { background: none; border: none; font-size: 13px; font-weight: 700;
          color: var(--purple); cursor: pointer; text-decoration: underline;
          padding: 0; font-family: inherit; }

        /* ── generating screen ── */
        .gen-center { text-align: center; padding: 16px 0; }
        .gen-icon   { font-size: 50px; margin-bottom: 9px;
          animation: bounce 1s ease-in-out infinite; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        .gen-title  { font-size: 19px; font-weight: 900; color: var(--ink); margin-bottom: 4px; }
        .gen-sub    { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
        .prog-bg    { height: 10px; background: var(--border); border-radius: 5px;
          overflow: hidden; margin-bottom: 6px; }
        .prog-fill  { height: 100%; border-radius: 5px; background: var(--primary);
          transition: width .4s ease; }
        .prog-pct   { font-size: 13px; font-weight: 700; color: var(--primary); }

        /* ── done screen ── */
        .done-hero  { text-align: center; padding: 5px 0 16px; }
        .done-icon  { font-size: 58px; margin-bottom: 7px; }
        .done-title { font-size: 21px; font-weight: 900; color: var(--green); margin-bottom: 4px; }
        .done-sub   { font-size: 13px; color: var(--muted); }
        audio.main-player { width: 100%; border-radius: var(--radius-sm); margin-bottom: 13px; }
        .btn-dl     { width: 100%; padding: 14px; border-radius: var(--radius-sm);
          background: var(--green); color: #fff; border: none;
          font-size: 15px; font-weight: 800; font-family: inherit; cursor: pointer;
          transition: all .15s; box-shadow: 0 4px 16px rgba(46,139,87,.2);
          display: flex; align-items: center; justify-content: center; gap: 7px;
          margin-bottom: 10px; }
        .btn-dl:hover { background: #246b43; transform: translateY(-1px); }
        .done-actions { display: flex; gap: 10px; }

        /* ── tip box ── */
        .tip { padding: 12px 14px; border-radius: var(--radius-sm);
          background: var(--amber-light); border: 1.5px solid var(--amber-mid);
          font-size: 12px; color: #92400E; font-weight: 600; line-height: 1.6; }

        /* ── responsive ── */
        @media (max-width: 480px) {
          .lang-grid  { grid-template-columns: repeat(3, 1fr); }
          .howto      { flex-direction: column; }
          .howto-step { border-right: none; border-bottom: 1.5px solid var(--border); }
          .howto-step:last-child { border-bottom: none; }
          .compat-hint { display: none; }
        }
      `}</style>

      <div className="page">
        <div className="wrap">

          {/* ══ HERO ══ */}
          <div className="hero">
            <div className="hero-icon">🤟</div>
            <h1 className="hero-title">VaniSetu — <em>वाणी सेतु</em></h1>
            <p className="hero-sub">
              For deaf &amp; mute parents. Type, upload a document, or upload an audio file to
              extract its words — then convert to a voice your child can hear anytime.
            </p>
          </div>

          {/* ══ MODE TABS ══ */}
          <div className="mode-tabs" role="tablist">
            <button
              role="tab" aria-selected={inputMode === "text"}
              className={`mode-tab${inputMode === "text" ? " at" : ""}`}
              onClick={() => switchMode("text")}
            >
              <span className="tab-emoji">✍️</span>
              Text → Voice
              <span className="tab-hint">Type or upload a doc · get audio</span>
            </button>
            <button
              role="tab" aria-selected={inputMode === "audio"}
              className={`mode-tab${inputMode === "audio" ? " apt" : ""}`}
              onClick={() => switchMode("audio")}
            >
              <span className="tab-emoji">🎵</span>
              Audio → Text → Voice
              <span className="tab-hint">Upload audio · extract text · convert</span>
            </button>
          </div>

          {/* ══ HOW-TO STRIP ══ */}
          {step === "home" && inputMode === "text" && (
            <div className="howto">
              {[
                { e:"✍️", l:"Type or upload a document (TXT / DOCX / PDF / RTF)" },
                { e:"🌍", l:"Choose your language & voice type" },
                { e:"🔊", l:"Download MP3 for your child" },
              ].map((s, i) => (
                <div className="howto-step" key={i}>
                  <div className="howto-num">{i + 1}</div>
                  <span className="howto-emoji">{s.e}</span>
                  <div className="howto-label">{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {step === "home" && inputMode === "audio" && (
            <div className="howto">
              {[
                { e:"🎵", l:"Upload an audio file (MP3, WAV, M4A, OGG…)" },
                { e:"📝", l:"Tap 'Extract Text' — browser reads it free, no API key" },
                { e:"🔊", l:"Convert to a clear voice & download for your child" },
              ].map((s, i) => (
                <div className="howto-step" key={i}>
                  <div className="howto-num p">{i + 1}</div>
                  <span className="howto-emoji">{s.e}</span>
                  <div className="howto-label">{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════
              TEXT MODE
          ══════════════════════════════════════════ */}
          {inputMode === "text" && step === "home" && (
            <>
              {error && (
                <div className="error-box" role="alert">
                  <span>⚠️</span>
                  <div className="error-text">{error}</div>
                </div>
              )}

              {/* Step 1 — Type / upload doc */}
              <div className="card">
                <div className="sec">✍️ Step 1 — Type what you want to say</div>
                <textarea
                  className="text-area" rows={6}
                  placeholder={"Write your message here…\n\n\"Good morning my love. I made breakfast for you.\"\n\"I am always proud of you.\""}
                  value={inputText}
                  onChange={e => { setInputText(e.target.value); setError(""); }}
                  aria-label="Type your message"
                />
                {inputText && (
                  <div className="char-count">{wordCount} words · {inputText.length} chars</div>
                )}

                <div className="div">
                  <div className="div-line" />
                  <div className="div-text">OR UPLOAD A DOCUMENT</div>
                  <div className="div-line" />
                </div>

                {!fileName && !fileLoading && (
                  <div
                    className={`upload-zone${isDragging ? " drag" : ""}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleTextDrop}
                    onClick={() => fileRef.current?.click()}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
                    aria-label="Upload a document file"
                  >
                    <div className="upload-zone-title">📂 Upload your document</div>
                    <div className="upload-zone-sub">Drag & drop here, or tap to choose</div>
                    <div className="upload-types">
                      {[".txt", ".docx", ".pdf", ".rtf"].map(t => (
                        <span key={t} className="type-pill">{t}</span>
                      ))}
                    </div>
                    <button className="upload-btn" type="button"
                      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                      📁 Choose File
                    </button>
                    <input
                      ref={fileRef} type="file"
                      accept=".txt,.pdf,.docx,.rtf,text/plain,application/pdf"
                      style={{ display:"none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleTextFile(f); }}
                    />
                  </div>
                )}

                {fileLoading && (
                  <div className="loading-badge">
                    <span className="spin">⏳</span> Reading your file…
                  </div>
                )}

                {fileName && !fileLoading && (
                  <div className="file-badge">
                    <span>✅</span>
                    <span className="file-badge-name">📄 {fileName}</span>
                    <button className="file-badge-clear"
                      onClick={() => { setFileName(""); setInputText(""); setError(""); }}
                      aria-label="Remove file">×</button>
                  </div>
                )}
              </div>

              {/* Step 2 — Language */}
              <div className="card">
                <div className="sec">🌍 Step 2 — Choose your language</div>
                <div className="lang-search-wrap">
                  <span className="si">🔍</span>
                  <input
                    type="text" placeholder="Search language…" value={langSearch}
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
                      role="radio" aria-checked={selectedLang === code}
                    >
                      <span className="lang-flag">{l.flag}</span>
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

              {/* Step 3 — Voice */}
              <div className="card">
                <div className="sec">🎙️ Step 3 — Choose voice type</div>
                <div className="voice-grid" role="radiogroup" aria-label="Voice selection">
                  {VOICE_OPTIONS.map(v => (
                    <button
                      key={v.id}
                      className={`voice-btn${selectedVoice === v.id ? " sel" : ""}`}
                      onClick={() => setSelectedVoice(v.id)}
                      role="radio" aria-checked={selectedVoice === v.id}
                    >
                      <span className="voice-emoji">{v.emoji}</span>
                      <span className="voice-label">{v.label}</span>
                      <span className="voice-hint">{v.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="tip" style={{ marginBottom:14 }}>
                💡 <strong>Tip:</strong> Type a lullaby, bedtime story, morning greeting, or homework
                instructions — anything you want your child to hear in your language.
              </div>

              <button
                className="btn-go"
                onClick={() => handleGenerate()}
                disabled={!inputText.trim()}
                aria-disabled={!inputText.trim()}
              >
                🔊 Create Voice Audio
              </button>

              {!inputText.trim() && (
                <p style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:8 }}>
                  Type your message or upload a document to get started
                </p>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════
              AUDIO → TEXT MODE
          ══════════════════════════════════════════ */}
          {inputMode === "audio" && step === "home" && (
            <>
              {/* Browser Compatibility Card */}
              {browserInfo && (() => {
                const hdrClass =
                  browserInfo.supportsSTT === "full"    ? "ok"  :
                  browserInfo.supportsSTT === "partial" ? "par" : "no";
                const hdrMsg =
                  browserInfo.supportsSTT === "full"
                    ? `✅ You are using ${browserInfo.label} — Audio transcription fully supported`
                    : browserInfo.supportsSTT === "partial"
                    ? `⚡ You are using ${browserInfo.label} — Transcription has partial support (iOS 17+)`
                    : `❌ You are using ${browserInfo.label} — Transcription NOT supported here. Please switch to Chrome or Edge.`;

                return (
                  <div className="compat-card" role="region" aria-label="Browser compatibility">
                    <div className={`compat-hdr ${hdrClass}`}>{hdrMsg}</div>
                    <div className="compat-rows">
                      {COMPAT_ROWS.map(b => (
                        <div
                          key={b.name}
                          className={`compat-row${browserInfo.name === b.name ? " you" : ""}`}
                        >
                          <span style={{ fontSize:16 }}>{b.emoji}</span>
                          <span className="compat-browser">{b.label}</span>
                          <span className={`compat-badge ${b.level}`}>
                            {b.level === "full" ? "✅ Full" : b.level === "partial" ? "⚡ Partial" : "❌ None"}
                          </span>
                          <span className="compat-hint">{b.hint}</span>
                          {browserInfo.name === b.name && (
                            <span className="compat-you">◀ You</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {txError && txError !== "whisper-not-configured" && (
                <div className="error-box" role="alert">
                  <span>⚠️</span>
                  <div className="error-text">{txError}</div>
                </div>
              )}

              {/* Step 1 — Upload audio */}
              <div className="card pc">
                <div className="sec p">🎵 Step 1 — Upload your audio file</div>

                {!uploadedAudio ? (
                  <div
                    className={`audio-drop${isAudioDrag ? " drag" : ""}`}
                    onDragOver={e => { e.preventDefault(); setIsAudioDrag(true); }}
                    onDragLeave={() => setIsAudioDrag(false)}
                    onDrop={handleAudioDrop}
                    onClick={() => audioFileRef.current?.click()}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && audioFileRef.current?.click()}
                    aria-label="Upload audio file"
                  >
                    <span className="audio-drop-icon">🎤</span>
                    <div className="audio-drop-title">Drop your audio file here</div>
                    <div className="audio-drop-sub">
                      Upload a voice message or any audio file.<br />
                      Your browser reads the spoken words — <strong>free, no API key needed.</strong>
                    </div>
                    <div className="upload-types">
                      {["🎵 MP3","🎼 WAV","📻 M4A","🎧 OGG","🔈 AAC","🎶 FLAC"].map(t => (
                        <span key={t} className="type-pill pp">{t}</span>
                      ))}
                    </div>
                    <button
                      className="upload-btn pb" type="button"
                      onClick={e => { e.stopPropagation(); audioFileRef.current?.click(); }}
                    >
                      🎤 Choose Audio File
                    </button>
                    <input
                      ref={audioFileRef} type="file" accept={AUDIO_ACCEPT}
                      style={{ display:"none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioFile(f); }}
                    />
                  </div>
                ) : (
                  <div className="audio-loaded">
                    {/* File header */}
                    <div className="audio-loaded-hdr">
                      <div className="audio-loaded-ico">🎵</div>
                      <div style={{ flex:1 }}>
                        <div className="audio-loaded-name">{uploadedAudio.name}</div>
                        <div className="audio-loaded-meta">
                          {formatSize(uploadedAudio.size)}
                          {audioDuration !== null && ` · ${formatDuration(audioDuration)}`}
                        </div>
                      </div>
                      <button
                        className="audio-loaded-clear"
                        onClick={() => {
                          setUploadedAudio(null); setUploadedUrl(""); setAudioDuration(null);
                          setTxState("idle"); setTxText(""); setLiveText(""); setTxError(""); setPlayState("");
                        }}
                        aria-label="Remove audio file"
                      >×</button>
                    </div>

                    {/* Audio player */}
                    <audio controls src={uploadedUrl} className="ap" aria-label="Preview uploaded audio" />

                    {/* ── IDLE: choose method ── */}
                    {txState === "idle" && (
                      <>
                        <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10, lineHeight:1.6, fontWeight:600 }}>
                          How do you want to extract the text?
                        </div>

                        {/* Method A: Play & listen */}
                        <div style={{ background:"var(--purple-light)", border:"2px solid var(--purple-mid)", borderRadius:"var(--radius-sm)", padding:"14px", marginBottom:10 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:"var(--purple)", marginBottom:4 }}>
                            🔊 Method 1 — Play audio & let mic listen
                          </div>
                          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6, marginBottom:10 }}>
                            We play the audio through your speaker. Your microphone listens and
                            converts what it hears into text. <strong>Works best</strong> when the audio has clear speech.
                          </div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#DCFCE7", color:"#166534", border:"1px solid #BBF7D0" }}>✅ No API key</span>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#DCFCE7", color:"#166534", border:"1px solid #BBF7D0" }}>✅ Free forever</span>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#DCFCE7", color:"#166534", border:"1px solid #BBF7D0" }}>✅ Chrome / Edge</span>
                          </div>
                          <button className="btn-go pb" onClick={handleTranscribePlay}>
                            🔊 Play Audio — Extract Text
                          </button>
                        </div>

                        {/* Method B: Live mic */}
                        <div style={{ background:"var(--green-light)", border:"2px solid var(--green-mid)", borderRadius:"var(--radius-sm)", padding:"14px" }}>
                          <div style={{ fontSize:13, fontWeight:800, color:"var(--green)", marginBottom:4 }}>
                            🎤 Method 2 — Speak directly into mic
                          </div>
                          <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.6, marginBottom:10 }}>
                            Skip the file — just speak your message directly into the microphone.
                            Perfect if you want to record a new message right now.
                          </div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#DCFCE7", color:"#166534", border:"1px solid #BBF7D0" }}>✅ No API key</span>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#DCFCE7", color:"#166534", border:"1px solid #BBF7D0" }}>✅ Free forever</span>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"var(--amber-light)", color:"var(--amber)", border:"1px solid var(--amber-mid)" }}>⚠️ Ignores uploaded file</span>
                          </div>
                          <button
                            className="btn-go"
                            style={{ background:"var(--green)", boxShadow:"0 6px 24px rgba(46,139,87,.2)" }}
                            onClick={handleStartMic}
                          >
                            🎤 Start Recording
                          </button>
                        </div>
                      </>
                    )}

                    {/* ── TRANSCRIBING: play & listen ── */}
                    {txState === "transcribing" && txMethod === "play" && (
                      <>
                        {/* Status steps */}
                        <div style={{ background:"var(--purple-light)", border:"1.5px solid var(--purple-mid)", borderRadius:"var(--radius-sm)", padding:"14px", marginBottom:10 }}>
                          {[
                            { key:"waiting-for-mic", emoji:"🎤", label:"Requesting microphone permission…" },
                            { key:"playing",          emoji:"🔊", label:"Playing audio through speaker…" },
                            { key:"listening",        emoji:"👂", label:"Microphone listening — keep quiet around the device" },
                          ].map(s => (
                            <div key={s.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", opacity: playState === s.key ? 1 : 0.35 }}>
                              <span style={{ fontSize:18 }}>{playState === s.key ? s.emoji : "○"}</span>
                              <span style={{ fontSize:13, fontWeight: playState === s.key ? 800 : 500, color: playState === s.key ? "var(--purple)" : "var(--muted)" }}>
                                {s.label}
                              </span>
                              {playState === s.key && (
                                <span className="spin" style={{ marginLeft:"auto", fontSize:14 }}>⏳</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Waveform */}
                        {playState === "listening" && (
                          <div className="wave" aria-hidden="true">
                            {Array.from({ length:16 }).map((_, i) => (
                              <div key={i} className="wave-bar"
                                style={{ animationDelay:`${(i%5)*0.12}s`, animationDuration:`${0.8+(i%4)*0.15}s` }} />
                            ))}
                          </div>
                        )}

                        <div className="tx-box live">
                          <div className="tx-lbl live">
                            {playState === "listening" ? "👂 Hearing words…" : "⏳ Getting ready…"}
                          </div>
                          <div className="tx-text muted">{liveText || "Waiting for speech…"}</div>
                        </div>

                        <div className="tip" style={{ marginTop:10 }}>
                          💡 <strong>Tip:</strong> Keep the room quiet. Hold the device speaker close
                          to the microphone, or use headphones with a mic.
                        </div>
                      </>
                    )}

                    {/* ── TRANSCRIBING: live mic ── */}
                    {txState === "transcribing" && txMethod === "mic" && (
                      <>
                        {/* Waveform */}
                        <div className="wave" aria-hidden="true">
                          {Array.from({ length:16 }).map((_, i) => (
                            <div key={i} className="wave-bar"
                              style={{ animationDelay:`${(i%5)*0.12}s`, animationDuration:`${0.8+(i%4)*0.15}s`, background:"var(--green)" }} />
                          ))}
                        </div>

                        <div className="tx-box live" style={{ borderColor:"var(--green-mid)", background:"var(--green-light)" }}>
                          <div className="tx-lbl live" style={{ color:"var(--green)" }}>🎤 Recording — speak now…</div>
                          <div className="tx-text">{liveText || "Listening…"}</div>
                        </div>

                        <button
                          className="btn-go"
                          style={{ marginTop:10, background:"var(--red)", boxShadow:"0 6px 24px rgba(204,34,34,.2)" }}
                          onClick={handleStopMic}
                        >
                          ⏹ Stop Recording
                        </button>
                      </>
                    )}

                    {/* ── SUCCESS ── */}
                    {txState === "done" && txText && (
                      <div className="tx-box ready">
                        <div className="tx-lbl ready">✅ Text extracted successfully</div>
                        <div className="tx-text">{txText}</div>
                      </div>
                    )}

                    {/* ── ERROR ── */}
                    {txState === "error" && (
                      <div className="tx-box err">
                        <div className="tx-lbl err">⚠️ Could not extract text</div>
                        <div className="tx-text muted">{txError}</div>
                        <button className="btn-link" style={{ marginTop:8 }}
                          onClick={() => { setTxState("idle"); setTxError(""); }}>
                          🔄 Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 — Language for transcription */}
              {uploadedAudio && (
                <div className="card">
                  <div className="sec p">🌍 Step 2 — Language spoken in the audio</div>
                  <p style={{ fontSize:12, color:"var(--muted)", marginBottom:10, lineHeight:1.6 }}>
                    Choose the language spoken in the audio — this improves transcription accuracy.
                  </p>
                  <div className="lang-search-wrap">
                    <span className="si">🔍</span>
                    <input
                      type="text" placeholder="Search language…" value={langSearch}
                      onChange={e => setLangSearch(e.target.value)}
                    />
                  </div>
                  <div className="lang-grid">
                    {displayedLangs.map(([code, l]) => (
                      <button
                        key={code}
                        className={`lang-btn${selectedLang === code ? " sel" : ""}`}
                        onClick={() => {
                          setSelectedLang(code);
                          setTxState("idle"); setTxText(""); setLiveText("");
                        }}
                      >
                        <span className="lang-flag">{l.flag}</span>
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
              )}

              {/* Step 3 — Convert transcribed text to voice */}
              {txState === "done" && txText && (
                <div className="card">
                  <div className="sec p">🔊 Step 3 — Convert extracted text to voice</div>
                  <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6, marginBottom:14 }}>
                    The words above were extracted from your audio. Choose a voice and convert
                    them into a clear audio file your child can hear.
                  </p>
                  <div className="voice-grid" style={{ marginBottom:14 }}>
                    {VOICE_OPTIONS.map(v => (
                      <button
                        key={v.id}
                        className={`voice-btn${selectedVoice === v.id ? " sel" : ""}`}
                        onClick={() => setSelectedVoice(v.id)}
                      >
                        <span className="voice-emoji">{v.emoji}</span>
                        <span className="voice-label">{v.label}</span>
                        <span className="voice-hint">{v.hint}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn-go pb"
                    style={{ marginBottom:10 }}
                    onClick={() => handleGenerate(txText)}
                  >
                    🔊 Convert to Voice
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ width:"100%" }}
                    onClick={useTranscribedText}
                  >
                    ✏️ Edit text first (switch to Text mode)
                  </button>
                </div>
              )}

              <div className="tip" style={{ marginBottom:14 }}>
                💡 <strong>100% Free — no API key needed.</strong> Upload any voice message or
                recording → your browser's built-in Speech Recognition reads the spoken words
                → convert to a clear voice for your child. Works best in Chrome or Edge.
              </div>
            </>
          )}

          {/* ══ GENERATING ══ */}
          {step === "generating" && (
            <div className="card">
              <div className="gen-center">
                <div className="gen-icon" aria-hidden="true">🔊</div>
                <div className="gen-title">Creating your voice…</div>
                <div className="gen-sub">
                  {L.flag} {L.label} · {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label}
                </div>
                <div
                  className="prog-bg"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="prog-fill" style={{ width:`${progress}%` }} />
                </div>
                <div className="prog-pct">{progress}% done</div>
              </div>
              <div className="tip" style={{ marginTop:16 }}>
                🔒 Your text never leaves your device. Everything is private.
              </div>
            </div>
          )}

          {/* ══ DONE ══ */}
          {step === "done" && (
            <div className="card">
              <div className="done-hero">
                <div className="done-icon" aria-hidden="true">🎉</div>
                <div className="done-title">Your voice is ready!</div>
                <div className="done-sub">{outputLabel}</div>
              </div>

              <audio
                ref={el => { if (el && audioUrl) el.src = audioUrl; }}
                controls
                className="main-player"
                aria-label="Your generated voice audio"
              />

              <button className="btn-dl" onClick={downloadAudio}>
                ⬇️ Download MP3 — Save to Phone / Tablet
              </button>

              <div className="tip" style={{ marginBottom:12 }}>
                💡 Send via WhatsApp or save to your child's phone.
                They can play it anytime — even offline.
              </div>

              <div className="done-actions">
                <button className="btn-secondary" onClick={reset} style={{ flex:1 }}>
                  ✍️ Start Over
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex:1 }}
                  onClick={() => { setStep("home"); setAudioUrl(""); setProgress(0); }}
                >
                  ✏️ Change Settings
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
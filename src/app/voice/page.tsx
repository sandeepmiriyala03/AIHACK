"use client";
export const dynamic = "force-dynamic";

import * as Mp4Muxer from "mp4-muxer";
import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import VoiceSelector from "@/components/VoiceSelector"

type VoiceType =
  | "male"
  | "female"
  | "boy"
  | "girl"
  | "grandpa"
  | "grandma"
  | "teacher"
  | "teacher_female"
  | "story"
  | "news"
  | "devotional"
  | "robot"

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@400;700&family=Noto+Serif+Telugu:wght@400;700&family=Noto+Serif+Tamil:wght@400;700&family=Noto+Serif+Bengali:wght@400;700&family=Noto+Serif+Kannada:wght@400;700&family=Noto+Serif+Malayalam:wght@400;700&family=Noto+Serif+Gujarati:wght@400;700&family=Noto+Serif+Gurmukhi:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap";
const INDIC_FONTS = "'Noto Serif Devanagari','Noto Serif Telugu','Noto Serif Tamil','Noto Serif Bengali','Noto Serif Kannada','Noto Serif Malayalam','Noto Serif Gujarati','Noto Serif Gurmukhi','Noto Naskh Arabic','Noto Serif',Georgia,serif";

interface LangConfig {
  label: string; flag: string; webSpeechLang: string;
  googleTTSCode: string; sampleText: string; bgColor: string;
  voiceId: string | null;
}

const LANGUAGES: Record<string, LangConfig> = {
  asm:{ label:"Assamese", flag:"🎋", webSpeechLang:"as-IN", googleTTSCode:"as", voiceId:null, bgColor:"#0f766e", sampleText:"নমস্কাৰ! মই AksharaTantra।" },
  ben:{ label:"Bengali", flag:"🐯", webSpeechLang:"bn-IN", googleTTSCode:"bn", voiceId:null, bgColor:"#023e8a", sampleText:"নমস্কার! আমি AksharaTantra।" },
  bod:{ label:"Bodo", flag:"🌿", webSpeechLang:"hi-IN", googleTTSCode:"hi", voiceId:null, bgColor:"#15803d", sampleText:"नमस्कार! AksharaTantra।" },
  doi:{ label:"Dogri", flag:"🏔️", webSpeechLang:"hi-IN", googleTTSCode:"hi", voiceId:null, bgColor:"#7c2d12", sampleText:"नमस्कार! में AksharaTantra आं।" },
  guj:{ label:"Gujarati", flag:"🦁", webSpeechLang:"gu-IN", googleTTSCode:"gu", voiceId:null, bgColor:"#d4a017", sampleText:"નમસ્તે! હું AksharaTantra છું।" },
  hin:{ label:"Hindi", flag:"🇮🇳", webSpeechLang:"hi-IN", googleTTSCode:"hi", voiceId:null, bgColor:"#c0392b", sampleText:"नमस्ते! मैं AksharaTantra हूँ।" },
  kan:{ label:"Kannada", flag:"🐘", webSpeechLang:"kn-IN", googleTTSCode:"kn", voiceId:null, bgColor:"#e76f51", sampleText:"ನಮಸ್ಕಾರ! ನಾನು AksharaTantra." },
  kas:{ label:"Kashmiri", flag:"🏔️", webSpeechLang:"ur-IN", googleTTSCode:"ur", voiceId:null, bgColor:"#334155", sampleText:"آداب! بیٚیہِ AksharaTantra۔" },
  kok:{ label:"Konkani", flag:"🌴", webSpeechLang:"hi-IN", googleTTSCode:"hi", voiceId:null, bgColor:"#0f766e", sampleText:"नमस्कार! हांव AksharaTantra." },
  mal:{ label:"Malayalam", flag:"🌴", webSpeechLang:"ml-IN", googleTTSCode:"ml", voiceId:null, bgColor:"#2a9d8f", sampleText:"നമസ്കാരം! ഞാൻ AksharaTantra." },
  mar:{ label:"Marathi", flag:"🏔️", webSpeechLang:"mr-IN", googleTTSCode:"mr", voiceId:null, bgColor:"#7b2d8b", sampleText:"नमस्कार! मी AksharaTantra आहे." },
  mai:{ label:"Maithili", flag:"🌾", webSpeechLang:"hi-IN", googleTTSCode:"hi", voiceId:null, bgColor:"#92400e", sampleText:"नमस्कार! हम AksharaTantra छी।" },
  mni:{ label:"Manipuri", flag:"🎋", webSpeechLang:"bn-IN", googleTTSCode:"bn", voiceId:null, bgColor:"#065f46", sampleText:"ꯍꯥꯏ! ꯑꯩ AksharaTantra." },
  nep:{ label:"Nepali", flag:"🏔️", webSpeechLang:"ne-NP", googleTTSCode:"ne", voiceId:null, bgColor:"#1e40af", sampleText:"नमस्ते! म AksharaTantra हुँ।" },
  ori:{ label:"Odia", flag:"🪷", webSpeechLang:"hi-IN", googleTTSCode:"or", voiceId:null, bgColor:"#9a3412", sampleText:"ନମସ୍କାର! ମୁଁ AksharaTantra।" },
  pan:{ label:"Punjabi", flag:"🪯", webSpeechLang:"pa-IN", googleTTSCode:"pa", voiceId:null, bgColor:"#ff9933", sampleText:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ AksharaTantra ਹਾਂ।" },
  san:{ label:"Sanskrit", flag:"🕉️", webSpeechLang:"sa-IN", googleTTSCode:"sa", voiceId:null, bgColor:"#6b21a8", sampleText:"नमस्ते! अहम् AksharaTantra अस्मि।" },
  snd:{ label:"Sindhi", flag:"☪️", webSpeechLang:"sd-IN", googleTTSCode:"sd", voiceId:null, bgColor:"#1b4332", sampleText:"السلام علیکم! مان AksharaTantra آهيان." },
  tam:{ label:"Tamil", flag:"🌸", webSpeechLang:"ta-IN", googleTTSCode:"ta", voiceId:null, bgColor:"#c9184a", sampleText:"வணக்கம்! நான் AksharaTantra." },
  tel:{ label:"Telugu", flag:"🌺", webSpeechLang:"te-IN", googleTTSCode:"te", voiceId:null, bgColor:"#2d6a4f", sampleText:"నమస్కారం! నేను AksharaTantra." },
  urd:{ label:"Urdu", flag:"🌙", webSpeechLang:"ur-IN", googleTTSCode:"ur", voiceId:null, bgColor:"#1e293b", sampleText:"السلام علیکم! میں AksharaTantra ہوں۔" },
  sin:{ label:"Sinhala", flag:"🇱🇰", webSpeechLang:"si-LK", googleTTSCode:"si", voiceId:null, bgColor:"#8d153a", sampleText:"ආයුබෝවන්! මම AksharaTantra." },

  ara:{ label:"Arabic", flag:"🇸🇦", webSpeechLang:"ar-SA", googleTTSCode:"ar", voiceId:null, bgColor:"#006c35", sampleText:"مرحباً! أنا AksharaTantra." },
  chi_sim:{ label:"Chinese (Simplified)", flag:"🇨🇳", webSpeechLang:"zh-CN", googleTTSCode:"zh-CN", voiceId:"zh_CN-huayan-x_low", bgColor:"#de2910", sampleText:"你好！我会说中文。" },
  chi_tra:{ label:"Chinese (Traditional)", flag:"🇹🇼", webSpeechLang:"zh-TW", googleTTSCode:"zh-TW", voiceId:null, bgColor:"#000095", sampleText:"你好！我會說中文。" },
  deu:{ label:"German", flag:"🇩🇪", webSpeechLang:"de-DE", googleTTSCode:"de", voiceId:"de_DE-eva_k-x_low", bgColor:"#333", sampleText:"Hallo! Ich kann Deutsch sprechen." },
  eng:{ label:"English", flag:"🌍", webSpeechLang:"en-US", googleTTSCode:"en", voiceId:"en_US-hfc_female-medium", bgColor:"#1d3557", sampleText:"Hello! I am AksharaTantra." },
  ell:{ label:"Greek", flag:"🇬🇷", webSpeechLang:"el-GR", googleTTSCode:"el", voiceId:null, bgColor:"#0d5eaf", sampleText:"Γεια σας! Είμαι AksharaTantra." },
  fas:{ label:"Persian", flag:"🇮🇷", webSpeechLang:"fa-IR", googleTTSCode:"fa", voiceId:null, bgColor:"#239f40", sampleText:"سلام! من AksharaTantra هستم." },
  fra:{ label:"French", flag:"🇫🇷", webSpeechLang:"fr-FR", googleTTSCode:"fr", voiceId:"fr_FR-upmc-medium", bgColor:"#0055a4", sampleText:"Bonjour! Je peux parler français." },
  heb:{ label:"Hebrew", flag:"🇮🇱", webSpeechLang:"he-IL", googleTTSCode:"he", voiceId:null, bgColor:"#0038b8", sampleText:"שלום! אני AksharaTantra." },
  ind:{ label:"Indonesian", flag:"🇮🇩", webSpeechLang:"id-ID", googleTTSCode:"id", voiceId:null, bgColor:"#ce1126", sampleText:"Halo! Saya AksharaTantra." },
  ita:{ label:"Italian", flag:"🇮🇹", webSpeechLang:"it-IT", googleTTSCode:"it", voiceId:"it_IT-riccardo-x_low", bgColor:"#008C45", sampleText:"Ciao! Posso parlare italiano." },
  jpn:{ label:"Japanese", flag:"🇯🇵", webSpeechLang:"ja-JP", googleTTSCode:"ja", voiceId:"ja_JP-kenichi-medium", bgColor:"#bc002d", sampleText:"こんにちは！日本語を話せます。" },
  kor:{ label:"Korean", flag:"🇰🇷", webSpeechLang:"ko-KR", googleTTSCode:"ko", voiceId:"ko_KR-dawn-x_low", bgColor:"#003478", sampleText:"안녕하세요! 한국어를 말할 수 있습니다." },
  pol:{ label:"Polish", flag:"🇵🇱", webSpeechLang:"pl-PL", googleTTSCode:"pl", voiceId:null, bgColor:"#dc143c", sampleText:"Cześć! Jestem AksharaTantra." },
  por:{ label:"Portuguese", flag:"🇵🇹", webSpeechLang:"pt-PT", googleTTSCode:"pt", voiceId:"pt_PT-tugao-medium", bgColor:"#006600", sampleText:"Olá! Eu posso falar português." },
  rus:{ label:"Russian", flag:"🇷🇺", webSpeechLang:"ru-RU", googleTTSCode:"ru", voiceId:"ru_RU-irina-medium", bgColor:"#0033a0", sampleText:"Привет! Я могу говорить по-русски." },
  spa:{ label:"Spanish", flag:"🇪🇸", webSpeechLang:"es-ES", googleTTSCode:"es", voiceId:"es_ES-sharvard-medium", bgColor:"#ff4d4d", sampleText:"Hola! Puedo hablar en español." },
  swe:{ label:"Swedish", flag:"🇸🇪", webSpeechLang:"sv-SE", googleTTSCode:"sv", voiceId:null, bgColor:"#006aa7", sampleText:"Hej! Jag kan tala svenska." },
  tha:{ label:"Thai", flag:"🇹🇭", webSpeechLang:"th-TH", googleTTSCode:"th", voiceId:null, bgColor:"#a51931", sampleText:"สวัสดี! ฉันคือ AksharaTantra" },
  tur:{ label:"Turkish", flag:"🇹🇷", webSpeechLang:"tr-TR", googleTTSCode:"tr", voiceId:null, bgColor:"#e30a17", sampleText:"Merhaba! Türkçe konuşabiliyorum." },
  vie:{ label:"Vietnamese", flag:"🇻🇳", webSpeechLang:"vi-VN", googleTTSCode:"vi", voiceId:null, bgColor:"#da251d", sampleText:"Xin chào! Tôi có thể nói tiếng Việt." }
};

const INDIC_CODES = [
  "asm","ben","bod","doi","guj","hin","kan","kas","kok",
  "mal","mar","mai","mni","nep","ori","pan","san","snd",
  "tam","tel","urd","sin"
];

const MAX_CHARS = 1000;

const VIDEO_PROFILES = {
  mobile:    { W:540,  H:960,  fps:30 },
  whatsapp:  { W:720,  H:1280, fps:30 },
  instagram: { W:720,  H:1280, fps:30 },
  youtube:   { W:1080, H:1920, fps:30 },
  twitter:   { W:720,  H:1280, fps:30 },
};

const VOICE_MAP = {
  eng:{ male:"en_US-hfc_male-medium", female:"en_US-hfc_female-medium", child:"en_US-hfc_child-medium" },
  deu:{ male:"de_DE-thorsten-medium", female:"de_DE-eva_k-x_low",       child:"de_DE-thorsten-medium" },
  fra:{ male:"fr_FR-gilles-medium",   female:"fr_FR-upmc-medium",        child:"fr_FR-gilles-medium" },
  jpn:{ male:"ja_JP-kenichi-medium",  female:"ja_JP-ayumi-medium",       child:"ja_JP-kenichi-medium" },
  spa:{ male:"es_ES-sharvard-medium", female:"es_ES-sharvard-medium",    child:"es_ES-sharvard-medium" },
  ita:{ male:"it_IT-riccardo-x_low",  female:"it_IT-riccardo-x_low",     child:"it_IT-riccardo-x_low" },
  rus:{ male:"ru_RU-irina-medium",    female:"ru_RU-irina-medium",        child:"ru_RU-irina-medium" },
}

function getVoiceId(lang: string, type: VoiceType) {
  const map = VOICE_MAP[lang as keyof typeof VOICE_MAP] ?? null
  if (!map) return LANGUAGES[lang].voiceId || null
  if (type === "male")           return map.male   || map.female || null
  if (type === "female")         return map.female || map.male   || null
  if (type === "boy" || type === "girl") {
    if ("child" in map && map.child) return map.child
    return map.female || map.male || null
  }
  if (type === "grandpa")        return map.male   || map.female || null
  if (type === "grandma")        return map.female || map.male   || null
  if (type === "teacher")        return map.male   || map.female || null
  if (type === "teacher_female") return map.female || map.male   || null
  if (type === "story")          return map.female || map.male   || null
  if (type === "news")           return map.male   || map.female || null
  if (type === "devotional")     return map.female || map.male   || null
  if (type === "robot")          return map.male   || map.female || null
  return LANGUAGES[lang].voiceId || null
}

/* ══════════════════════════════════════════════════════════════════
   AUDIO — 3-tier chain
   1. vits-web WASM  (offline, global langs with voiceId)
   2. /api/indic-tts (Google Translate TTS via server proxy — all Indic)
   3. /api/tts proxy (Google Translate TTS — all global langs)
══════════════════════════════════════════════════════════════════ */

async function vitsTTS(text: string, voiceId: string, onProgress: (m: string) => void) {
  const tts = await import("@diffusionstudio/vits-web");
  const stored = await tts.stored();
  if (!stored.includes(voiceId as any)) {
    onProgress("⬇️ Downloading voice model (one-time ~30–80 MB)…");
    await tts.download(voiceId as any, (p: any) => {
      const pct = p.total ? Math.round((p.loaded / p.total) * 100) : "?";
      onProgress(`⬇️ Downloading: ${pct}%`);
    });
  }
  onProgress("🎙️ Synthesising…");
  const wavBlob: Blob = await tts.predict({ text, voiceId: voiceId as any });
  const buf = await wavBlob.arrayBuffer();
  const ACtx = window.AudioContext || (window as any).webkitAudioContext;
  const tmp = new ACtx();
  const decoded = await tmp.decodeAudioData(buf.slice(0));
  const audioFloat = decoded.getChannelData(0);
  const sampleRate = decoded.sampleRate;
  await tmp.close();
  return { wavBlob, audioFloat, sampleRate };
}

/* Calls /api/tts proxy — server fetches Google TTS, no CORS */
async function proxyTTS(text: string, langCode: string): Promise<{ audioFloat: Float32Array; sampleRate: number; blob: Blob }> {
  const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`/api/tts returned ${res.status}`);
  const mp3Buf = await res.arrayBuffer();
  const ACtx = window.AudioContext || (window as any).webkitAudioContext;
  const tmp = new ACtx();
  const decoded = await tmp.decodeAudioData(mp3Buf.slice(0));
  const audioFloat = decoded.getChannelData(0);
  const sampleRate = decoded.sampleRate;
  await tmp.close();
  const blob = new Blob([mp3Buf], { type: "audio/mpeg" });
  return { audioFloat, sampleRate, blob };
}

/* ── FIXED: Google TTS returns MP3 not WAV, blob type corrected ── */
async function indicTTS(
  text: string,
  lang: string,
  voice: string
) {
  const res = await fetch(
    `/api/indic-tts?text=${encodeURIComponent(text)}&lang=${lang}&voice=${voice}`
  )

  if (!res.ok) {
    throw new Error(`Indic TTS request failed: ${res.status}`)
  }

  const data = await res.json()

  // Surface any server-side error clearly
  if (data.error) {
    throw new Error(data.error)
  }

  const audioBase64 = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent

  if (!audioBase64) {
    throw new Error("No audio content in TTS response")
  }

  const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))

  // ✅ FIXED: Google TTS returns MP3, not WAV
  const blob = new Blob([audioBytes], { type: "audio/mpeg" })

  const ACtx = window.AudioContext || (window as any).webkitAudioContext
  const ctx  = new ACtx()

  const buf     = await blob.arrayBuffer()
  const decoded = await ctx.decodeAudioData(buf)
  await ctx.close()

  return {
    audioFloat: decoded.getChannelData(0),
    sampleRate:  decoded.sampleRate,
    blob,
  }
}

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const v = speechSynthesis.getVoices();
    if (v.length) { resolve(v); return; }
    const fn = () => { speechSynthesis.removeEventListener("voiceschanged", fn); resolve(speechSynthesis.getVoices()); };
    speechSynthesis.addEventListener("voiceschanged", fn);
    setTimeout(() => { speechSynthesis.removeEventListener("voiceschanged", fn); resolve([]); }, 2000);
  });
}

async function speakWebSpeech(text: string, lang: string) {
  return new Promise<void>(async resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voices = await waitForVoices();
    const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split("-")[0]));
    if (v) u.voice = v;
    u.onend = () => resolve(); u.onerror = () => resolve();
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  });
}

let _actx: AudioContext | null = null;
function getACtx() {
  const C = window.AudioContext || (window as any).webkitAudioContext;
  if (!_actx || _actx.state === "closed") _actx = new C();
  return _actx;
}
async function playF32(af: Float32Array, sr: number) {
  const ctx = getACtx();
  if (ctx.state === "suspended") await ctx.resume();
  const buf = ctx.createBuffer(1, af.length, sr);
  buf.copyToChannel(af, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.connect(ctx.destination); src.start(0);
  return new Promise<void>(res => { src.onended = () => res(); });
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS — draw slide frame
══════════════════════════════════════════════════════════════════ */
function drawSlide(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, lang: LangConfig) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, lang.bgColor); g.addColorStop(1, "#0a0a1a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(0, 0, W, H * 0.12);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `bold ${Math.floor(W / 28)}px 'Inter',sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(" Voice", W / 2, H * 0.065);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  const badgeW = 140, badgeH = 32, bx = (W - badgeW) / 2, by = H * 0.085;
  ctx.beginPath(); ctx.roundRect(bx, by, badgeW, badgeH, 16); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `500 ${Math.floor(W / 36)}px 'Inter',sans-serif`;
  ctx.fillText(`${lang.flag} ${lang.label}`, W / 2, by + badgeH * 0.68);

  const fs = Math.max(20, Math.floor(W / 17));
  ctx.font = `bold ${fs}px ${INDIC_FONTS}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
  const mw = W - 100;
  const words = text.split(" ");
  const lines: string[] = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > mw && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  const maxLines = 8;
  const displayLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) displayLines[maxLines - 1] += "…";
  const lh = fs * 1.65;
  let y = H / 2 - (displayLines.length * lh) / 2 + fs * 0.4;
  for (const l of displayLines) { ctx.fillText(l, W / 2, y); y += lh; }
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(0, H * 0.92, W, H * 0.08);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `400 ${Math.floor(W / 44)}px 'Inter',sans-serif`;
  ctx.fillText("aksharatantra  ·   AI", W / 2, H * 0.965);
}

/* ══════════════════════════════════════════════════════════════════
   VIDEO GENERATION
══════════════════════════════════════════════════════════════════ */
async function makeVideo(
  langCode: string, text: string, af: Float32Array, sr: number,
  profile: keyof typeof VIDEO_PROFILES, canvas: HTMLCanvasElement,
  hasAudio: boolean
): Promise<Blob> {
  const { W, H, fps } = VIDEO_PROFILES[profile];
  canvas.width = W; canvas.height = H;
  const ctx2d = canvas.getContext("2d", { alpha: false })!;
  const lang = LANGUAGES[langCode];
  const duration = hasAudio ? af.length / sr : 5;

  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: "avc", width: W, height: H },
    ...(hasAudio ? { audio: { codec: "aac", numberOfChannels: 1, sampleRate: sr } } : {}),
    fastStart: "fragmented",
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VE:", e),
  });
  videoEncoder.configure({ codec: "avc1.4D401F", width: W, height: H, bitrate: 2_000_000 });

  let audioEncoder: AudioEncoder | null = null;
  if (hasAudio) {
    try {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.warn("AE:", e),
      });
      audioEncoder.configure({ codec: "mp4a.40.2", numberOfChannels: 1, sampleRate: sr, bitrate: 128_000 });
      const ad = new AudioData({ format:"f32", sampleRate:sr, numberOfFrames:af.length, numberOfChannels:1, timestamp:0, data:af });
      audioEncoder.encode(ad);
      ad.close();
    } catch (e) {
      console.warn("AudioEncoder failed:", e);
      audioEncoder = null;
    }
  }

  const totalFrames = Math.ceil(duration * fps);
  for (let i = 0; i < totalFrames; i++) {
    const timestamp = Math.round((i * 1_000_000) / fps);
    drawSlide(ctx2d, W, H, text, lang);
    const frame = new VideoFrame(canvas, { timestamp, duration: Math.round(1_000_000 / fps) });
    videoEncoder.encode(frame);
    frame.close();
    if (i % 30 === 0) await new Promise(r => setTimeout(r, 0));
  }

  try { if (videoEncoder.state !== "closed") await videoEncoder.flush(); } catch {}
  try { if (videoEncoder.state !== "closed") videoEncoder.close(); } catch {}
  if (audioEncoder) {
    try { if (audioEncoder.state === "configured") await audioEncoder.flush(); } catch {}
    try { if (audioEncoder.state !== "closed") audioEncoder.close(); } catch {}
  }

  muxer.finalize();
  const { buffer } = muxer.target as Mp4Muxer.ArrayBufferTarget;
  return new Blob([buffer], { type: "video/mp4" });
}

function getSR(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function IndicAudioVideoPage() {
  const [lang,        setLang]       = useState("hin");
  const [text,        setText]       = useState(LANGUAGES["hin"].sampleText);
  const [loading,     setLoading]    = useState(false);
  const [status,      setStatus]     = useState("Ready");
  const [profile,     setProfile]    = useState<keyof typeof VIDEO_PROFILES>("mobile");
  const [mounted,     setMounted]    = useState(false);
  const [howOpen,     setHowOpen]    = useState(false);
  const [dlProgress,  setDlProgress] = useState("");
  const [audioUrl,    setAudioUrl_]  = useState<string | null>(null);
  const [audioExt,    setAudioExt]   = useState("mp3");
  const [vidUrl,      setVidUrl_]    = useState<string | null>(null);
  const [af,          setAf]         = useState<Float32Array | null>(null);
  const [sr,          setSr]         = useState(22050);
  const [slideReady,  setSlideReady] = useState(false);
  const [listening,   setListening]  = useState(false);
  const [micMsg,      setMicMsg]     = useState("");
  const [interim,     setInterim]    = useState("");
  const [voiceType,   setVoiceType]  = useState<VoiceType>("female");

  const recogRef    = useRef<any>(null);
  const baseTextRef = useRef("");
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const langRef     = useRef("hin");
  const prevAudio   = useRef<string | null>(null);
  const prevVid     = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => () => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    if (prevVid.current)   URL.revokeObjectURL(prevVid.current);
  }, []);

  const setAudioUrl = (u: string | null, ext = "mp3") => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    prevAudio.current = u; setAudioUrl_(u); setAudioExt(ext);
  };
  const setVidUrl = (u: string | null) => {
    if (prevVid.current) URL.revokeObjectURL(prevVid.current);
    prevVid.current = u; setVidUrl_(u);
  };

  const stopMic = useCallback(() => {
    if (recogRef.current) { try { recogRef.current.abort(); } catch {} recogRef.current = null; }
    setListening(false); setInterim(""); setMicMsg("");
  }, []);

  const changeLang = useCallback((code: string) => {
    if (code === langRef.current) return;
    stopMic(); speechSynthesis.cancel();
    langRef.current = code; setLang(code);
    setText(LANGUAGES[code].sampleText);
    setAudioUrl(null); setVidUrl(null); setAf(null);
    setSlideReady(false); setDlProgress(""); setStatus(`${LANGUAGES[code].label} selected`);
  }, [stopMic]);

  const clearText = () => {
    if (loading) return;
    stopMic();
    setText(""); setAudioUrl(null); setVidUrl(null); setAf(null);
    setSlideReady(false); setDlProgress(""); setStatus("Ready");
  };

  const downloadSlide = () => {
    if (!canvasRef.current) return;
    const { W, H } = VIDEO_PROFILES[profile];
    const c = canvasRef.current;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d", { alpha:false })!;
    drawSlide(ctx, W, H, text, LANGUAGES[lang]);
    const dataUrl = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `aksharatantra_slide_${lang}_${Date.now()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ── Mic ── */
  const toggleMic = () => {
    if (listening) { stopMic(); return; }
    const SR = getSR();
    if (!SR) { setMicMsg("❌ Speech input not supported. Try Chrome."); return; }
    const recog = new SR();
    recog.lang = LANGUAGES[lang].webSpeechLang;
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    baseTextRef.current = text;
    setInterim(""); setListening(true); setMicMsg("🎙️ Listening… speak now");

    recog.onresult = (e: any) => {
      let fin = "", int = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal) fin += t + " "; else int += t;
      }
      if (fin) {
        const clean = fin.trim().replace(/\s+/g, " ");
        if (!baseTextRef.current.endsWith(clean)) {
          const next = (baseTextRef.current + (baseTextRef.current ? " " : "") + clean).slice(0, MAX_CHARS);
          baseTextRef.current = next; setText(next);
        }
      }
      setInterim(int);
    };

    recog.onerror = (e: any) => {
      if (e.error === "not-allowed") setMicMsg("❌ Microphone permission denied");
      else if (e.error === "no-speech") setMicMsg("💬 No speech — tap again");
      else setMicMsg(`⚠️ ${e.error}`);
      stopMic();
    };

    recog.onend = () => { setListening(false); };
    recogRef.current = recog;
    try { recog.start(); } catch { setMicMsg("❌ Could not start microphone"); stopMic(); }
  };

  /* ── Generate ── */
  const generate = async () => {
    if (!text.trim() || loading) return;
    stopMic();
    const AL = lang;
    const AT = text;
    const LC = LANGUAGES[lang];
    const isIndic = INDIC_CODES.includes(AL);

    setLoading(true);
    setAudioUrl(null); setVidUrl(null);
    setSlideReady(false); setDlProgress(""); setStatus("Starting…");

    try {
      let audioF!: Float32Array;
      let audioSr = 22050;
      let audioBlob: Blob | null = null;
      let ext = "mp3";
      let hasAudio = false;

      const voiceId = getVoiceId(AL, voiceType);

      /* Tier 1 — vits-web WASM (offline, global langs) */
      if (voiceId) {
        try {
          const r = await vitsTTS(AT, voiceId, m => { setStatus(m); setDlProgress(m); });
          audioF = r.audioFloat; audioSr = r.sampleRate;
          audioBlob = r.wavBlob; ext = "wav"; hasAudio = true;
          setDlProgress(""); setStatus(`✅ ${voiceType} voice ready`);
        } catch (e) {
          console.warn("vits-web failed", e);
        }
      }

      /* Tier 2 — Indic AI voices via /api/indic-tts (Google TTS proxy) */
      if (!hasAudio && isIndic) {
        try {
          setStatus(`🇮🇳 Generating ${LC.label} AI voice…`);
          const r = await indicTTS(AT, LC.googleTTSCode, voiceType);
          audioF = r.audioFloat; audioSr = r.sampleRate;
          audioBlob = r.blob; ext = "mp3"; hasAudio = true;
          setStatus(`✅ ${LC.label} AI voice ready`);
        } catch (e) {
          console.warn("Indic TTS failed:", e);
        }
      }

      /* Tier 3 — Google proxy for global languages */
      if (!hasAudio) {
        try {
          setStatus(`🌐 Fetching ${LC.label} audio…`);
          const r = await proxyTTS(AT, LC.googleTTSCode);
          audioF = r.audioFloat; audioSr = r.sampleRate;
          audioBlob = r.blob; ext = "mp3"; hasAudio = true;
          setStatus(`✅ ${LC.label} audio ready`);
        } catch (e) {
          console.warn("Proxy TTS failed:", e);
        }
      }

      if (langRef.current !== AL) { setLoading(false); return; }

      if (audioBlob) {
        setAf(audioF); setSr(audioSr);
        setAudioUrl(URL.createObjectURL(audioBlob), ext);
      } else {
        setAf(audioF); setSr(audioSr);
      }

      /* Pre-render slide */
      if (canvasRef.current) {
        const { W, H } = VIDEO_PROFILES[profile];
        canvasRef.current.width = W; canvasRef.current.height = H;
        const ctx = canvasRef.current.getContext("2d", { alpha:false })!;
        drawSlide(ctx, W, H, AT, LC);
        setSlideReady(true);
      }

      /* Render video */
      if (canvasRef.current) {
        setStatus("🎬 Rendering video…");
        try {
          const vb = await makeVideo(AL, AT, audioF, audioSr, profile, canvasRef.current, hasAudio);
          if (langRef.current === AL) {
            setVidUrl(URL.createObjectURL(vb));
            setStatus(hasAudio
              ? `🎉 ${LC.label} audio + video ready — both downloadable!`
              : "✅ Video ready (silent — check internet for audio)");
          }
        } catch (e: any) {
          setStatus("⚠️ Audio ready — video failed: " + e?.message);
        }
      }
    } catch (e: any) {
      setStatus("❌ " + e?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const L = LANGUAGES[lang];
  const over = text.length > MAX_CHARS;
  const canGo = !loading && !!text.trim() && !over;
  const isIndic = INDIC_CODES.includes(lang);
  const sorted = Object.entries(LANGUAGES).sort(([,a],[,b]) => a.label.localeCompare(b.label));

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_LINK} rel="stylesheet" />

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5f6fa;}
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
        .lbl{display:block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;}
        .sel{width:100%;padding:11px 36px 11px 13px;border-radius:10px;background:#f9fafb;border:1.5px solid #e5e7eb;color:#111827;font-size:15px;font-family:inherit;appearance:none;cursor:pointer;outline:none;transition:border-color .2s;}
        .sel:focus{border-color:#6366f1;background:#fff;}
        .sel:disabled{opacity:.5;cursor:not-allowed;}
        .ta{width:100%;padding:14px 14px 38px;border-radius:10px;background:#f9fafb;border:1.5px solid #e5e7eb;color:#111827;font-size:19px;line-height:1.9;resize:vertical;outline:none;transition:border-color .2s;font-family:inherit;}
        .ta:focus{border-color:#6366f1;background:#fff;}
        .ta.over{border-color:#ef4444!important;}
        .ta:disabled{opacity:.6;}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 18px;border-radius:10px;border:none;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;min-height:44px;transition:all .15s;-webkit-tap-highlight-color:transparent;}
        .btn-primary{background:#4f46e5;color:#fff;}
        .btn-primary:hover{background:#4338ca;}
        .btn-primary:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;}
        .btn-outline{background:#fff;color:#374151;border:1.5px solid #e5e7eb;}
        .btn-outline:hover{border-color:#6366f1;color:#4f46e5;background:#f0f4ff;}
        .btn-green{background:#059669;color:#fff;}
        .btn-green:hover{background:#047857;}
        .btn-indigo{background:#eef2ff;color:#4f46e5;border:1.5px solid #c7d2fe;}
        .btn-indigo:hover{background:#e0e7ff;}
        .row{display:flex;gap:10px;flex-wrap:wrap;}
        .mic-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 20px;border-radius:12px;border:2px solid #e5e7eb;background:#fff;color:#374151;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;min-height:52px;transition:all .2s;-webkit-tap-highlight-color:transparent;}
        .mic-btn:hover{background:#f0f4ff;border-color:#6366f1;color:#4f46e5;}
        .mic-btn.on{background:#fff5f5;border-color:#f87171;color:#dc2626;animation:mpulse 1.4s ease-in-out infinite;}
        .mic-btn:disabled{opacity:.5;cursor:not-allowed;}
        @keyframes mpulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.25);}60%{box-shadow:0 0 0 10px rgba(239,68,68,0);}}
        .dot{width:11px;height:11px;border-radius:50%;background:#ef4444;animation:dp 1s ease-in-out infinite;flex-shrink:0;}
        @keyframes dp{0%,100%{transform:scale(1);}50%{transform:scale(1.4);}}
        .interim{color:#6366f1;font-style:italic;font-size:15px;padding:8px 13px;background:#eef2ff;border-radius:8px;margin-top:8px;line-height:1.8;}
        .badge-indic{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:#f0fdf4;border:1px solid #bbf7d0;color:#059669;font-size:11px;font-weight:600;}
        .badge-offline{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:#eef2ff;border:1px solid #c7d2fe;color:#4f46e5;font-size:11px;font-weight:600;}
        @media(max-width:480px){
          .card{padding:14px;}
          .row{flex-direction:column;}
          .row .btn{width:100%;}
        }
      `}</style>

      <Navbar />
      <canvas ref={canvasRef} style={{ position:"fixed", top:"-9999px", left:"-9999px" }} />

      <div style={{ minHeight:"100dvh", background:"#f5f6fa", fontFamily:"'Inter',sans-serif", padding:"20px 16px 72px" }}>
        <div style={{ maxWidth:660, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:58, height:58, borderRadius:"50%", background:"#eef2ff", border:"2px solid #c7d2fe", fontSize:28, marginBottom:10 }}>🎙️</div>
            <h1 style={{ fontSize:23, fontWeight:700, color:"#4f46e5", marginBottom:4 }}>AksharaTantra Voice</h1>
            <p style={{ color:"#9ca3af", fontSize:13 }}>33 Languages · Real Indic Audio in Video · Download Audio + Video + Image Slide</p>
          </div>

          {/* Indic banner */}
          {isIndic && (
            <div style={{ background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", border:"1.5px solid #6ee7b7", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:26, flexShrink:0 }}>🇮🇳</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#065f46", marginBottom:4 }}>
                    {L.label} · Real Audio in Video!
                  </div>
                  <div style={{ fontSize:12, color:"#047857", lineHeight:1.8 }}>
                    Your {L.label} text will be spoken by Google TTS and <strong>embedded directly inside the MP4 video</strong>. Download the audio separately as MP3 too. Requires internet connection.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How to use */}
          <div className="card" style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
            <button onClick={() => setHowOpen(v => !v)} style={{ width:"100%", padding:"13px 18px", background:"none", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"inherit" }}>
              <span style={{ fontWeight:600, fontSize:13, color:"#4f46e5" }}>💡 How to use</span>
              <span style={{ fontSize:11, color:"#9ca3af" }}>{howOpen ? "▲ Hide" : "▼ Show"}</span>
            </button>
            {howOpen && (
              <div style={{ borderTop:"1px solid #f3f4f6", padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  ["1","Choose language","Indic = real Google TTS audio embedded in video + downloadable MP3. Global with ✅ = offline WASM WAV."],
                  ["2","Speak or type","Tap 🎙️ and speak — words appear live in your script. Or type/paste."],
                  ["3","Pick format","Choose platform: WhatsApp, Instagram Reels, YouTube Shorts, etc."],
                  ["4","Generate","Audio fetched, rendered into MP4. For Indic, real voice is in the video."],
                  ["5","Download all 3","⬇️ MP3/WAV audio · ⬇️ MP4 video (with audio) · 🖼️ PNG image slide"],
                ].map(([n, title, desc]) => (
                  <div key={n} style={{ display:"flex", gap:12 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"#eef2ff", color:"#4f46e5", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:"#111827", marginBottom:2 }}>{title}</div>
                      <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.75 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 1 */}
          <div className="card">
            <span className="lbl">Step 1 — Language</span>
            <div style={{ position:"relative" }}>
              <select className="sel" value={lang} onChange={e => changeLang(e.target.value)} disabled={loading}>
                <optgroup label="🇮🇳 Indic Languages (Real Audio in Video)">
                  {sorted.filter(([c]) => INDIC_CODES.includes(c)).map(([c, l]) => (
                    <option key={c} value={c}>{l.flag} {l.label} 🎵</option>
                  ))}
                </optgroup>
                <optgroup label="🌍 Global Languages">
                  {sorted.filter(([c]) => !INDIC_CODES.includes(c)).map(([c, l]) => (
                    <option key={c} value={c}>{l.flag} {l.label}{l.voiceId ? " ✅" : " 🎵"}</option>
                  ))}
                </optgroup>
              </select>
              <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#9ca3af" }}>▼</span>
            </div>
            <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
              {isIndic
                ? <span className="badge-indic">🎵 Google TTS · Real voice in video</span>
                : L.voiceId
                  ? <span className="badge-offline">✅ Offline WASM · Highest quality</span>
                  : <span className="badge-indic">🎵 Google TTS</span>
              }
            </div>
          </div>

          {/* Step 2 */}
          <div className="card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span className="lbl" style={{ margin:0 }}>Step 2 — Speak or Type</span>
              <button onClick={clearText} disabled={loading || !text} style={{
                padding:"4px 12px", borderRadius:6, border:"1px solid", fontFamily:"inherit", fontWeight:500, fontSize:11,
                cursor:(!loading && text)?"pointer":"not-allowed",
                borderColor:(!loading && text)?"#fca5a5":"#e5e7eb",
                background:(!loading && text)?"#fff5f5":"transparent",
                color:(!loading && text)?"#dc2626":"#d1d5db",
              }}>✕ Clear</button>
            </div>

            <button className={`mic-btn${listening?" on":""}`} onClick={toggleMic} disabled={loading}
              aria-label={listening ? "Stop microphone" : `Speak in ${L.label}`}>
              {listening
                ? <><div className="dot"/><span>Listening in {L.flag} {L.label} — tap to stop</span></>
                : <><span style={{ fontSize:22 }}>🎙️</span><span>Tap to Speak in {L.flag} {L.label}</span></>
              }
            </button>

            {micMsg && <div style={{ fontSize:12, color:micMsg.startsWith("❌")?"#dc2626":"#6b7280", margin:"4px 0 8px" }}>{micMsg}</div>}
            {interim && <div className="interim" style={{ fontFamily:INDIC_FONTS }}>💬 {interim}</div>}

            <VoiceSelector value={voiceType} onChange={setVoiceType} disabled={loading} />

            <div style={{ position:"relative", marginTop:10 }}>
              <textarea
                className={`ta${over?" over":""}`}
                style={{ fontFamily:INDIC_FONTS }}
                value={text}
                onChange={e => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
                rows={4} disabled={loading}
                placeholder="Speak using the mic above, or type / paste text here…"
              />
              <span style={{
                position:"absolute", bottom:10, right:12, fontSize:11, pointerEvents:"none",
                color:MAX_CHARS-text.length<=50?(MAX_CHARS-text.length<=0?"#ef4444":"#f59e0b"):"#d1d5db",
              }}>{text.length}/{MAX_CHARS}</span>
            </div>
            {over && <p style={{ fontSize:12, color:"#ef4444", marginTop:4 }}>Character limit reached</p>}
          </div>

          {/* Step 3 */}
          <div className="card">
            <span className="lbl">Step 3 — Video Format</span>
            <div style={{ position:"relative" }}>
              <select className="sel" value={profile} onChange={e => setProfile(e.target.value as any)} disabled={loading}>
                <option value="mobile">📱 Mobile (540×960) — Fastest</option>
                <option value="whatsapp">🟢 WhatsApp Status (720×1280)</option>
                <option value="instagram">📸 Instagram Reels (720×1280)</option>
                <option value="youtube">▶️ YouTube Shorts (1080×1920)</option>
                <option value="twitter">🐦 X / Twitter (720×1280)</option>
              </select>
              <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#9ca3af" }}>▼</span>
            </div>
          </div>

          {/* Generate button */}
          <button
            className="btn btn-primary"
            onClick={generate} disabled={!canGo}
            style={{ width:"100%", fontSize:16, borderRadius:14, padding:"17px 0", marginBottom:14, minHeight:54,
              background:canGo?"linear-gradient(135deg,#4f46e5,#7c3aed)":"",
              boxShadow:canGo?"0 4px 24px rgba(79,70,229,.3)":"none" }}
          >
            {loading ? `⏳ ${status}` : `🎙️ Generate ${L.flag} ${L.label} Audio + Video + Slide`}
          </button>

          {/* Download progress */}
          {dlProgress && loading && (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"9px 14px", fontSize:12, marginBottom:12, fontFamily:"monospace", color:"#92400e" }}>
              {dlProgress}
            </div>
          )}

          {/* Status */}
          {status !== "Ready" && !loading && (
            <div style={{ background:"#f0fdf4", border:"1px solid #6ee7b7", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14, color:"#065f46", fontWeight:500 }}>
              {status}
            </div>
          )}

          {/* Downloads */}
          {(audioUrl || vidUrl || slideReady) && (
            <div className="card" style={{ background:"linear-gradient(135deg,#fafafe,#f0f4ff)", border:"1.5px solid #c7d2fe" }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#4f46e5", marginBottom:16 }}>
                📥 Downloads — {L.flag} {L.label}
              </div>

              {/* Audio */}
              {audioUrl && (
                <div style={{ marginBottom:18 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:"#374151", marginBottom:8 }}>🎵 Audio</div>
                  <audio controls src={audioUrl} style={{ width:"100%", marginBottom:10, borderRadius:8 }} preload="auto" />
                  <div className="row">
                    <button className="btn btn-primary" onClick={() => af && playF32(af, sr)}>▶️ Play</button>
                    <button className="btn btn-outline" onClick={() => {
                      const a = document.createElement("a");
                      a.href = audioUrl!; a.download = `aksharatantra_${lang}_${Date.now()}.${audioExt}`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    }}>⬇️ Download {audioExt.toUpperCase()}</button>
                  </div>
                </div>
              )}

              {/* Video */}
              {vidUrl && (
                <div style={{ marginBottom:18 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:"#374151", marginBottom:8 }}>🎬 Video (with audio)</div>
                  <video controls playsInline src={vidUrl} style={{ width:"100%", borderRadius:10, marginBottom:10 }} />
                  <button className="btn btn-green" style={{ width:"100%" }} onClick={() => {
                    const a = document.createElement("a");
                    a.href = vidUrl!; a.download = `aksharatantra_${lang}_${Date.now()}.mp4`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }}>⬇️ Download MP4 Video</button>
                </div>
              )}

              {/* Image Slide */}
              {slideReady && (
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:"#374151", marginBottom:8 }}>🖼️ Image Slide (PNG)</div>
                  <div style={{ background:"#f3f4f6", borderRadius:10, padding:8, marginBottom:10, textAlign:"center" }}>
                    <canvas
                      ref={node => {
                        if (!node || !text) return;
                        const PW = 240, PH = 427;
                        node.width = PW; node.height = PH;
                        const ctx = node.getContext("2d")!;
                        drawSlide(ctx, PW, PH, text, L);
                      }}
                      style={{ width:"100%", maxWidth:200, borderRadius:8, display:"inline-block", border:"1px solid #e5e7eb" }}
                    />
                  </div>
                  <button className="btn btn-indigo" style={{ width:"100%" }} onClick={downloadSlide}>
                    🖼️ Download PNG Slide ({VIDEO_PROFILES[profile].W}×{VIDEO_PROFILES[profile].H})
                  </button>
                  <p style={{ fontSize:11, color:"#9ca3af", marginTop:6, textAlign:"center" }}>
                    Full resolution · same size as selected video format
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
"use client";

export const dynamic = "force-dynamic";

import * as Mp4Muxer from "mp4-muxer";

import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";

interface LangConfig {
  label: string; flag: string; webSpeechLang: string;
  sampleText: string; bgColor: string;
  voiceId: string | null;
}

const LANGUAGES: Record<string, LangConfig> = {
  hin: { label:"Hindi",      flag:"🇮🇳", webSpeechLang:"hi-IN", voiceId:null,
         sampleText:"नमस्ते! मैं AksharaTantra हूँ।",               bgColor:"#c0392b" },
  tel: { label:"Telugu",     flag:"🌺",  webSpeechLang:"te-IN", voiceId:null,
         sampleText:"నమస్కారం! నేను తెలుగులో మాట్లాడగలను.",       bgColor:"#2d6a4f" },
  tam: { label:"Tamil",      flag:"🌸",  webSpeechLang:"ta-IN", voiceId:null,
         sampleText:"வணக்கம்! நான் தமிழில் பேச முடியும்.",         bgColor:"#c9184a" },
  ben: { label:"Bengali",    flag:"🐯",  webSpeechLang:"bn-IN", voiceId:null,
         sampleText:"নমস্কার! আমি বাংলায় কথা বলতে পারি।",         bgColor:"#023e8a" },
  kan: { label:"Kannada",    flag:"🐘",  webSpeechLang:"kn-IN", voiceId:null,
         sampleText:"ನಮಸ್ಕಾರ! ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಲ್ಲೆ.",     bgColor:"#e76f51" },
  mal: { label:"Malayalam",  flag:"🌴",  webSpeechLang:"ml-IN", voiceId:null,
         sampleText:"നമസ്കാരം! മലയാളത്തിൽ സംസാരിക്കാൻ കഴിയും.", bgColor:"#2a9d8f" },
  mar: { label:"Marathi",    flag:"🏔️", webSpeechLang:"mr-IN", voiceId:null,
         sampleText:"नमस्कार! मी मराठीत बोलू शकतो.",               bgColor:"#7b2d8b" },
  guj: { label:"Gujarati",   flag:"🦁",  webSpeechLang:"gu-IN", voiceId:null,
         sampleText:"નમસ્તે! હું ગુજરાતીમાં બોલી શકું છું.",       bgColor:"#d4a017" },
  pan: { label:"Punjabi",    flag:"🪯",  webSpeechLang:"pa-IN", voiceId:null,
         sampleText:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲ ਸਕਦਾ ਹਾਂ।", bgColor:"#ff9933" },
  urd: { label:"Urdu",       flag:"☪️", webSpeechLang:"ur-IN", voiceId:null,
         sampleText:"السلام علیکم! میں اردو میں بول سکتا ہوں۔",    bgColor:"#1b4332" },
  eng: { label:"English",    flag:"🌍",  webSpeechLang:"en-US",
         voiceId:"en_US-hfc_female-medium",
         sampleText:"Hello! I am AksharaTantra.",                  bgColor:"#1d3557" },
  spa: { label:"Spanish",    flag:"🇪🇸", webSpeechLang:"es-ES",
         voiceId:"es_ES-sharvard-medium",
         sampleText:"Hola! Puedo hablar en español.",              bgColor:"#ff4d4d" },
  fra: { label:"French",     flag:"🇫🇷", webSpeechLang:"fr-FR",
         voiceId:"fr_FR-upmc-medium",
         sampleText:"Bonjour! Je peux parler français.",           bgColor:"#0055a4" },
  deu: { label:"German",     flag:"🇩🇪", webSpeechLang:"de-DE",
         voiceId:"de_DE-eva_k-x_low",
         sampleText:"Hallo! Ich kann Deutsch sprechen.",           bgColor:"#333" },
  ita: { label:"Italian",    flag:"🇮🇹", webSpeechLang:"it-IT",
         voiceId:"it_IT-riccardo-x_low",
         sampleText:"Ciao! Posso parlare italiano.",               bgColor:"#008C45" },
  por: { label:"Portuguese", flag:"🇵🇹", webSpeechLang:"pt-PT",
         voiceId:"pt_PT-tugao-medium",
         sampleText:"Olá! Eu posso falar português.",             bgColor:"#006600" },
  rus: { label:"Russian",    flag:"🇷🇺", webSpeechLang:"ru-RU",
         voiceId:"ru_RU-irina-medium",
         sampleText:"Привет! Я могу говорить по-русски.",          bgColor:"#0033a0" },
  jpn: { label:"Japanese",   flag:"🇯🇵", webSpeechLang:"ja-JP",
         voiceId:"ja_JP-kenichi-medium",
         sampleText:"こんにちは！日本語を話せます。",               bgColor:"#bc002d" },
  kor: { label:"Korean",     flag:"🇰🇷", webSpeechLang:"ko-KR",
         voiceId:"ko_KO-dawn-x_low",
         sampleText:"안녕하세요! 한국어를 말할 수 있습니다.",       bgColor:"#003478" },
  cmn: { label:"Chinese",    flag:"🇨🇳", webSpeechLang:"zh-CN",
         voiceId:"zh_CN-huayan-x_low",
         sampleText:"你好！我会说中文。",                          bgColor:"#de2910" },
};

const MAX_CHARS = 1000;
const VIDEO_PROFILES = {
  mobile:    { W:540,  H:960,  fps:30 },
  whatsapp:  { W:720,  H:1280, fps:30 },
  instagram: { W:720,  H:1280, fps:30 },
  youtube:   { W:1080, H:1920, fps:30 },
  twitter:   { W:720,  H:1280, fps:30 },
};

/* ================================================================
   VITS-WEB TTS
================================================================ */
async function vitsTTS(
  text: string,
  voiceId: string,
  onProgress: (msg: string) => void
): Promise<{ wavBlob: Blob; audioFloat: Float32Array; sampleRate: number }> {
  const tts = await import("@diffusionstudio/vits-web");
  const stored = await tts.stored();
  if (!stored.includes(voiceId as any)) {
    onProgress(`⬇️ Downloading voice model (one-time, ~30–80MB)…`);
    await tts.download(voiceId as any, (p: any) => {
      const pct = p.total ? Math.round((p.loaded / p.total) * 100) : "?";
      onProgress(`⬇️ Downloading model: ${pct}%`);
    });
  }
  onProgress("🎙️ Synthesizing speech…");
  const wavBlob: Blob = await tts.predict({ text, voiceId: voiceId as any });
  const arrayBuf = await wavBlob.arrayBuffer();
  const ACtx = window.AudioContext || (window as any).webkitAudioContext;
  const tmpCtx = new ACtx();
  const decoded = await tmpCtx.decodeAudioData(arrayBuf.slice(0));
  const audioFloat = decoded.getChannelData(0);
  const sampleRate = decoded.sampleRate;
  await tmpCtx.close();
  return { wavBlob, audioFloat, sampleRate };
}

/* ================================================================
   WEB SPEECH — FIX: wait for voices to load asynchronously
================================================================ */
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    // Voices not yet loaded — wait for the event
    const onChanged = () => {
      speechSynthesis.removeEventListener("voiceschanged", onChanged);
      resolve(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener("voiceschanged", onChanged);
    // Fallback timeout — resolve empty after 2s so we don't hang
    setTimeout(() => { speechSynthesis.removeEventListener("voiceschanged", onChanged); resolve([]); }, 2000);
  });
}

async function speakWebSpeech(text: string, lang: string): Promise<void> {
  return new Promise(async (resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;

    // ✅ FIX: await voices instead of calling getVoices() synchronously
    const voices = await waitForVoices();
    const v = voices.find(v => v.lang === lang)
           || voices.find(v => v.lang.startsWith(lang.split("-")[0]));
    if (v) u.voice = v;

    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

/* ================================================================
   AUDIO CONTEXT
================================================================ */
let _ctx: AudioContext | null = null;
function getACtx() {
  const C = window.AudioContext || (window as any).webkitAudioContext;
  if (!_ctx || _ctx.state === "closed") _ctx = new C();
  return _ctx;
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

/* ================================================================
   CANVAS
================================================================ */
function drawFrame(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  text: string, lang: any, progress: number
) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, lang.bgColor); g.addColorStop(1, "#0a0a1a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `bold ${Math.floor(W / 27)}px serif`;
  ctx.textAlign = "center";
  ctx.fillText("✍️ AksharaTantra Voice", W / 2, H * .04);
  const fs = Math.max(18, Math.floor(W / 18));
  ctx.font = `bold ${fs}px 'Noto Serif Telugu', 'Noto Serif Devanagari', 'Noto Serif', serif`;
  ctx.fillStyle = "#fff";
  const mw = W - 80; const words = text.split(" ");
  const lines: string[] = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > mw && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  const lh = fs * 1.55; let y = H / 2 - (lines.length * lh) / 2;
  for (const l of lines) { ctx.fillText(l, W / 2, y); y += lh; }
}

/* ================================================================
   VIDEO GENERATION
================================================================ */
async function makeVideo(
  langCode: string,
  text: string,
  af: Float32Array,
  sr: number,
  profile: keyof typeof VIDEO_PROFILES,
  canvas: HTMLCanvasElement
): Promise<Blob> {
  const { W, H, fps } = VIDEO_PROFILES[profile];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const lang = LANGUAGES[langCode];
  const duration = af.length / sr;

  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: 'avc', width: W, height: H },
    audio: { codec: 'aac', numberOfChannels: 1, sampleRate: sr },
    fastStart: 'fragmented'
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VideoEncoder Error:", e),
  });
  videoEncoder.configure({
    codec: 'avc1.4D401F',
    width: W, height: H,
    bitrate: 2_000_000,
  });

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => console.error("AudioEncoder Error:", e),
  });
  audioEncoder.configure({ codec: 'mp4a.40.2', numberOfChannels: 1, sampleRate: sr, bitrate: 128_000 });

  const audioData = new AudioData({
    format: 'f32', sampleRate: sr,
    numberOfFrames: af.length, numberOfChannels: 1,
    timestamp: 0, data: af
  });
  audioEncoder.encode(audioData);
  audioData.close();

  for (let i = 0; i < duration * fps; i++) {
    const timestamp = Math.round((i * 1000000) / fps);
    drawFrame(ctx, W, H, text, lang, i / (duration * fps));
    const frame = new VideoFrame(canvas, { timestamp, duration: Math.round(1000000 / fps) });
    videoEncoder.encode(frame);
    frame.close();
    if (i % 30 === 0) await new Promise(r => setTimeout(r, 0));
  }

  await videoEncoder.flush();
  await audioEncoder.flush();
  muxer.finalize();

  const { buffer } = muxer.target as Mp4Muxer.ArrayBufferTarget;
  return new Blob([buffer], { type: 'video/mp4' });
}

/* ================================================================
   COMPONENT
================================================================ */
export default function IndicAudioVideoPage() {
  const [lang,     setLang]      = useState("eng");
  const [text,     setText]      = useState(LANGUAGES["eng"].sampleText);
  const [loading,  setLoading]   = useState(false);
  const [status,   setStatus]    = useState("Ready");
  const [profile,  setProfile]   = useState<keyof typeof VIDEO_PROFILES>("mobile");
  const [mounted,  setMounted]   = useState(false);

  const [audioUrl,    setAudioUrl_]   = useState<string|null>(null);
  const [audioExt,    setAudioExt]    = useState("wav");
  const [vidUrl,      setVidUrl_]     = useState<string|null>(null);
  const [af,          setAf]          = useState<Float32Array|null>(null);
  const [sr,          setSr]          = useState(22050);
  const [speechOnly,  setSpeechOnly]  = useState(false);
  const [dlProgress,  setDlProgress]  = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const langRef   = useRef("eng");
  const prevAudio = useRef<string|null>(null);
  const prevVid   = useRef<string|null>(null);

  useEffect(()=>{ setMounted(true); },[]);
  useEffect(()=>()=>{
    if(prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    if(prevVid.current)   URL.revokeObjectURL(prevVid.current);
  },[]);

  const setAudioUrl=(u:string|null,ext="wav")=>{
    if(prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    prevAudio.current=u; setAudioUrl_(u); setAudioExt(ext);
  };
  const setVidUrl=(u:string|null)=>{
    if(prevVid.current) URL.revokeObjectURL(prevVid.current);
    prevVid.current=u; setVidUrl_(u);
  };

  const changeLang=useCallback((code:string)=>{
    if(code===langRef.current) return;
    speechSynthesis.cancel();
    langRef.current=code; setLang(code);
    setText(LANGUAGES[code].sampleText);
    setAudioUrl(null); setVidUrl(null); setAf(null);
    setSpeechOnly(false); setDlProgress("");
    setStatus(`${LANGUAGES[code].label} selected`);
  },[]);

  // ── Clear text box
  const clearText=()=>{
    if(loading) return;
    setText("");
    setAudioUrl(null); setVidUrl(null); setAf(null);
    setSpeechOnly(false); setDlProgress("");
    setStatus("Ready");
  };

  const generate=async()=>{
    if(!text.trim()||loading) return;
    const AL=lang, AT=text, LC=LANGUAGES[lang];
    setLoading(true); setAudioUrl(null); setVidUrl(null); setAf(null);
    setSpeechOnly(false); setDlProgress(""); setStatus("Starting…");

    try {
      let audioF:Float32Array; let audioSr:number; let isSpeechOnly=false;

      if(LC.voiceId) {
        try {
          const result = await vitsTTS(AT, LC.voiceId, (msg)=>{ setStatus(msg); setDlProgress(msg); });
          audioF=result.audioFloat; audioSr=result.sampleRate;
          setAf(audioF); setSr(audioSr);
          setAudioUrl(URL.createObjectURL(result.wavBlob), "wav");
          setDlProgress(""); setStatus("✅ Audio ready");
        } catch(e:any) {
          console.warn("vits-web failed:", e);
          isSpeechOnly=true; setSpeechOnly(true);
          setStatus("⚠️ vits-web failed, using browser voice…");
          await speakWebSpeech(AT, LC.webSpeechLang);
          audioSr=22050; audioF=new Float32Array(audioSr*3);
          setAf(audioF); setSr(audioSr);
        }
      } else {
        // ── Indic: Web Speech
        isSpeechOnly=true; setSpeechOnly(true);
        setStatus("🔊 Speaking (Indic voice)…");
        await speakWebSpeech(AT, LC.webSpeechLang);
        audioSr=22050; audioF=new Float32Array(audioSr*3);
        setAf(audioF); setSr(audioSr);
        setStatus("🔊 Spoken — generating video…");
      }

      if(langRef.current!==AL){ setLoading(false); return; }

      if(canvasRef.current){
        setStatus("🎬 Rendering video…");
        try{
          const vb=await makeVideo(AL,AT,audioF,audioSr,profile,canvasRef.current);
          if(langRef.current===AL){
            setVidUrl(URL.createObjectURL(vb));
            setStatus(isSpeechOnly
              ? `✅ Video ready${LC.voiceId?"":"  (audio: browser only — Indic TTS coming soon)"}`
              : "✅ WAV + Video ready — both have real audio!");
          }
        }catch(e:any){
          setStatus("⚠️ Audio ready — video render failed: "+e?.message);
        }
      }
    }catch(e:any){
      setStatus("❌ "+e?.message);
    }finally{
      setLoading(false);
    }
  };

  if(!mounted) return null;
  const L=LANGUAGES[lang];
  const over=text.length>MAX_CHARS;
  const canGo=!loading&&!!text.trim()&&!over;
  const sorted=Object.entries(LANGUAGES).sort(([,a],[,b])=>a.label.localeCompare(b.label));

  // ── Styles
  const card:React.CSSProperties={
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:16, padding:"20px 22px", marginBottom:18
  };
  const pBtn:React.CSSProperties={
    padding:"10px 20px", borderRadius:8, cursor:"pointer",
    background:"rgba(249,199,79,0.18)", border:"1px solid #f9c74f",
    color:"#f9c74f", fontFamily:"inherit", fontSize:14, minHeight:44
  };
  const sBtn:React.CSSProperties={
    padding:"10px 20px", borderRadius:8, cursor:"pointer",
    background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)",
    color:"#fff", fontFamily:"inherit", fontSize:14, minHeight:44
  };
  const stepLabel:React.CSSProperties={
    fontWeight:"bold", marginBottom:8, fontSize:14,
    letterSpacing:"0.03em", color:"rgba(255,255,255,0.75)"
  };

  const hasVoice=!!L.voiceId;

  return (
    <>
      <Navbar/>
      <canvas ref={canvasRef} style={{position:"fixed",top:"-9999px",left:"-9999px"}}/>
      <div style={{
        minHeight:"100dvh",
        background:"linear-gradient(150deg,#0d0b22 0%,#131527 55%,#0f1e30 100%)",
        color:"#fff", fontFamily:"'Noto Serif',Georgia,serif",
        padding:"24px 16px 56px"
      }}>
        <div style={{maxWidth:680, margin:"0 auto"}}>

          {/* Header */}
          <div style={{textAlign:"center", marginBottom:32}}>
            <div style={{
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              width:64, height:64, borderRadius:"50%",
              background:"rgba(249,199,79,0.12)", border:"1.5px solid rgba(249,199,79,0.3)",
              fontSize:30, marginBottom:14
            }}>🎙️</div>
            <h1 style={{
              fontSize:26, fontWeight:"bold", margin:"0 0 6px",
              background:"linear-gradient(90deg,#f9c74f,#f8961e)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
            }}>AksharaTantra Voice</h1>
            <p style={{opacity:0.5, margin:0, fontSize:12, letterSpacing:"0.04em"}}>
              Indic &amp; Global TTS · Browser WASM · Real WAV Download
            </p>
          </div>

          {/* Info banner */}
          <div style={{
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:12, padding:"12px 16px", marginBottom:24, fontSize:12, lineHeight:1.9,
            color:"rgba(255,255,255,0.65)"
          }}>
            <span style={{color:"#f9c74f",fontWeight:"bold"}}>🤖 Engine:</span>{" "}
            <a href="https://github.com/diffusion-studio/vits-web" target="_blank" rel="noreferrer" style={{color:"#f9c74f",textDecoration:"underline"}}>vits-web</a> (WASM — 100% in-browser, no server)
            <br/>
            <span style={{color:"#7dd3fc"}}>🌍 Global languages</span> — real WAV download + video with audio
            <br/>
            <span style={{color:"#86efac"}}>🇮🇳 Indic languages</span> — browser voice plays aloud; video generated (silent track until Indic WASM models release)
            <br/>
            💾 Voice models download once (~30–80MB) and cache permanently
          </div>

          {/* Step 1 — Language */}
          <div style={{...card}}>
            <div style={stepLabel}>Step 1 — Choose Language</div>
            <div style={{position:"relative"}}>
              <select value={lang} onChange={e=>changeLang(e.target.value)} disabled={loading}
                style={{
                  width:"100%", padding:"12px 40px 12px 14px", borderRadius:10,
                  backgroundColor:"#12122a", border:"1px solid rgba(255,255,255,0.15)",
                  color:"#fff", fontSize:16, fontFamily:"inherit",
                  WebkitAppearance:"none", appearance:"none",
                  cursor: loading ? "not-allowed" : "pointer"
                } as React.CSSProperties}>
                {sorted.map(([c,l])=>(
                  <option key={c} value={c} style={{backgroundColor:"#12122a",color:"#fff"}}>
                    {l.flag} {l.label}{l.voiceId?" ✅":"  🔊"}
                  </option>
                ))}
              </select>
              <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"rgba(255,255,255,0.5)",fontSize:11}}>▼</span>
            </div>
            <p style={{fontSize:11, opacity:0.4, margin:"6px 0 0"}}>
              ✅ = WAV download &nbsp;|&nbsp; 🔊 = browser voice only
            </p>
          </div>

          {/* Step 2 — Text */}
          <div style={{...card}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <div style={stepLabel}>Step 2 — Enter Text</div>
              {/* Clear button */}
              <button
                onClick={clearText}
                disabled={loading || !text}
                title="Clear text"
                style={{
                  padding:"5px 14px", borderRadius:7, cursor: (loading||!text) ? "not-allowed" : "pointer",
                  background:"rgba(255,80,80,0.1)", border:"1px solid rgba(255,100,100,0.3)",
                  color: (loading||!text) ? "rgba(255,100,100,0.3)" : "#ff8080",
                  fontFamily:"inherit", fontSize:12, display:"flex", alignItems:"center", gap:5,
                  transition:"all 0.15s"
                }}>
                ✕ Clear
              </button>
            </div>
            <div style={{position:"relative"}}>
              <textarea
                value={text}
                onChange={e=>{ if(e.target.value.length<=MAX_CHARS) setText(e.target.value); }}
                rows={4}
                disabled={loading}
                placeholder="Type or paste OCR text here to hear it read aloud…"
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:"rgba(255,255,255,0.05)",
                  border:`1.5px solid ${over?"#e74c3c":text?"rgba(249,199,79,0.25)":"rgba(255,255,255,0.12)"}`,
                  borderRadius:10, padding:"14px 14px 36px",
                  color:"#fff", fontSize:19, lineHeight:1.85, resize:"vertical",
                  fontFamily:"'Noto Serif Devanagari','Noto Serif Telugu','Noto Serif',serif",
                  opacity: loading ? 0.5 : 1,
                  transition:"border-color 0.2s"
                } as React.CSSProperties}
              />
              {/* char count inside textarea bottom */}
              <span style={{
                position:"absolute", bottom:10, right:14,
                fontSize:11, pointerEvents:"none",
                color: MAX_CHARS-text.length<=50
                  ? (MAX_CHARS-text.length<=0 ? "#e74c3c" : "#f9c74f")
                  : "rgba(255,255,255,0.3)"
              }}>
                {text.length}/{MAX_CHARS}
              </span>
            </div>
            {over && <p style={{fontSize:12,color:"#e74c3c",margin:"4px 0 0"}}>Character limit reached</p>}
          </div>

          {/* Step 3 — Video format */}
          <div style={{...card}}>
            <div style={stepLabel}>Step 3 — Video Format</div>
            <select value={profile} onChange={e=>setProfile(e.target.value as any)} disabled={loading}
              style={{
                width:"100%", padding:"12px 14px", borderRadius:10,
                backgroundColor:"#12122a", border:"1px solid rgba(255,255,255,0.15)",
                color:"#fff", fontSize:15, fontFamily:"inherit", cursor: loading ? "not-allowed" : "pointer"
              } as React.CSSProperties}>
              <option value="mobile">📱 Mobile (540×960 — Fastest)</option>
              <option value="whatsapp">🟢 WhatsApp Status (720×1280)</option>
              <option value="instagram">📸 Instagram Reels (720×1280)</option>
              <option value="youtube">▶️ YouTube Shorts (1080×1920)</option>
              <option value="twitter">🐦 X / Twitter (720×1280)</option>
            </select>
          </div>

          {/* Generate button */}
          <button onClick={generate} disabled={!canGo}
            style={{
              width:"100%", padding:"16px 0", borderRadius:12, border:"none",
              background: canGo
                ? "linear-gradient(135deg,#f9c74f,#f8961e)"
                : "rgba(255,255,255,0.06)",
              color: canGo ? "#1a1a1a" : "rgba(255,255,255,0.25)",
              fontSize:16, fontWeight:"bold", cursor: canGo ? "pointer" : "not-allowed",
              fontFamily:"inherit", marginBottom:16, minHeight:52,
              boxShadow: canGo ? "0 4px 24px rgba(249,199,79,0.25)" : "none",
              transition:"all 0.2s"
            } as React.CSSProperties}>
            {loading ? `⏳ ${status}` : `🎙️ Generate ${L.flag} ${L.label} Audio + Video`}
          </button>

          {/* Download progress */}
          {dlProgress && loading && (
            <div style={{
              background:"rgba(249,199,79,0.06)", border:"1px solid rgba(249,199,79,0.18)",
              borderRadius:8, padding:"8px 14px", fontSize:12, marginBottom:14,
              fontFamily:"monospace", color:"#f9c74f"
            }}>
              {dlProgress}
            </div>
          )}

          {/* Status pill */}
          {status !== "Ready" && !loading && (
            <div style={{
              background: speechOnly && !hasVoice ? "rgba(99,102,241,0.08)" : "rgba(249,199,79,0.07)",
              border:`1px solid ${speechOnly && !hasVoice ? "rgba(99,102,241,0.3)" : "rgba(249,199,79,0.2)"}`,
              borderRadius:8, padding:"9px 14px", fontSize:13, marginBottom:20,
              color:"rgba(255,255,255,0.85)"
            }}>
              {status}
            </div>
          )}

          {/* Audio output */}
          {audioUrl && (
            <div style={card}>
              <div style={{fontWeight:"bold", marginBottom:12, fontSize:15}}>
                🎵 Audio — {L.flag} {L.label}
              </div>
              <audio controls src={audioUrl} style={{width:"100%",marginBottom:14}} preload="auto"/>
              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                <button onClick={()=>af && playF32(af, sr)} style={pBtn}>▶️ Play</button>
                <button onClick={()=>{
                  if(!audioUrl) return;
                  const a=document.createElement("a");
                  a.href=audioUrl; a.download=`aksharatantra_${lang}_${Date.now()}.${audioExt}`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                }} style={sBtn}>⬇️ Download {audioExt.toUpperCase()}</button>
              </div>
            </div>
          )}

          {/* Indic notice */}
          {speechOnly && !hasVoice && !loading && (
            <div style={{...card, background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.2)"}}>
              <div style={{fontWeight:"bold", marginBottom:6, fontSize:13, color:"#a5b4fc"}}>
                🇮🇳 About Indic language audio
              </div>
              <p style={{fontSize:12, opacity:0.75, margin:0, lineHeight:1.8}}>
                Your browser spoke the text aloud using the built-in <strong>{L.label}</strong> voice.
                Browser speech synthesis output cannot be captured as a file — it plays directly through your speakers.
                <br/><br/>
                <strong>Downloadable Indic audio</strong> will be available once Piper WASM models for Indic languages are released.
                The video below is generated with a silent audio track.
              </p>
            </div>
          )}

          {/* Video */}
          {vidUrl && (
            <div style={card}>
              <div style={{fontWeight:"bold", marginBottom:10, fontSize:15}}>
                🎬 Video — {L.flag} {L.label}
                {speechOnly && !hasVoice && (
                  <span style={{color:"rgba(165,180,252,0.8)", fontSize:11, marginLeft:8, fontWeight:"normal"}}>
                    (silent audio track)
                  </span>
                )}
              </div>
              <video controls playsInline src={vidUrl}
                style={{width:"100%", borderRadius:10, marginBottom:14}}/>
              <button onClick={()=>{
                if(!vidUrl) return;
                const a=document.createElement("a");
                a.href=vidUrl; a.download=`aksharatantra_${lang}_${Date.now()}.mp4`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }} style={pBtn}>⬇️ Download MP4 Video</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
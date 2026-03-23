"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ShareSection from "@/components/SocailMedia/ShareSection";
import GoToTopButton from "@/components/GoToTopButton";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LanguageIcon from "@mui/icons-material/Language";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import ArticleIcon from "@mui/icons-material/Article";
import GestureIcon from "@mui/icons-material/Gesture";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MicIcon from "@mui/icons-material/Mic";
import LockIcon from "@mui/icons-material/Lock";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import BlockIcon from "@mui/icons-material/Block";
import BarChartIcon from "@mui/icons-material/BarChart";
// ── NEW ──────────────────────────────────────────────────────────
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

interface LangOption {
  value: string; label: string; nativeLabel: string;
  group: "indic" | "latin" | "cjk" | "other" | "detection";
  dir?: "rtl" | "ltr"; googleCode: string;
}

const ALL_LANGS: LangOption[] = [
  { value:"tel", label:"Telugu",    nativeLabel:"తెలుగు",       group:"indic",  googleCode:"te" },
  { value:"san", label:"Sanskrit",  nativeLabel:"संस्कृतम्",    group:"indic",  googleCode:"sa" },
  { value:"hin", label:"Hindi",     nativeLabel:"हिन्दी",       group:"indic",  googleCode:"hi" },
  { value:"tam", label:"Tamil",     nativeLabel:"தமிழ்",        group:"indic",  googleCode:"ta" },
  { value:"kan", label:"Kannada",   nativeLabel:"ಕನ್ನಡ",        group:"indic",  googleCode:"kn" },
  { value:"mal", label:"Malayalam", nativeLabel:"മലയാളം",       group:"indic",  googleCode:"ml" },
  { value:"ben", label:"Bengali",   nativeLabel:"বাংলা",        group:"indic",  googleCode:"bn" },
  { value:"guj", label:"Gujarati",  nativeLabel:"ગુજરાતી",      group:"indic",  googleCode:"gu" },
  { value:"mar", label:"Marathi",   nativeLabel:"मराठी",        group:"indic",  googleCode:"mr" },
  { value:"pan", label:"Punjabi",   nativeLabel:"ਪੰਜਾਬੀ",       group:"indic",  googleCode:"pa" },
  { value:"asm", label:"Assamese",  nativeLabel:"অসমীয়া",      group:"indic",  googleCode:"as" },
  { value:"ori", label:"Odia",      nativeLabel:"ଓଡ଼ିଆ",        group:"indic",  googleCode:"or" },
  { value:"nep", label:"Nepali",    nativeLabel:"नेपाली",       group:"indic",  googleCode:"ne" },
  { value:"bod", label:"Bodo",      nativeLabel:"बड़ो",         group:"indic",  googleCode:"hi" },
  { value:"snd", label:"Sindhi",    nativeLabel:"سنڌي",         group:"indic",  dir:"rtl", googleCode:"sd" },
  { value:"eng", label:"English",    nativeLabel:"English",    group:"latin",  googleCode:"en" },
  { value:"fra", label:"French",     nativeLabel:"Français",   group:"latin",  googleCode:"fr" },
  { value:"deu", label:"German",     nativeLabel:"Deutsch",    group:"latin",  googleCode:"de" },
  { value:"spa", label:"Spanish",    nativeLabel:"Español",    group:"latin",  googleCode:"es" },
  { value:"ita", label:"Italian",    nativeLabel:"Italiano",   group:"latin",  googleCode:"it" },
  { value:"por", label:"Portuguese", nativeLabel:"Português",  group:"latin",  googleCode:"pt" },
  { value:"nld", label:"Dutch",      nativeLabel:"Nederlands", group:"latin",  googleCode:"nl" },
  { value:"swe", label:"Swedish",    nativeLabel:"Svenska",    group:"latin",  googleCode:"sv" },
  { value:"tur", label:"Turkish",    nativeLabel:"Türkçe",     group:"latin",  googleCode:"tr" },
  { value:"vie", label:"Vietnamese", nativeLabel:"Tiếng Việt", group:"other",  googleCode:"vi" },
  { value:"chi_sim", label:"Chinese (Simplified)",  nativeLabel:"简体中文", group:"cjk", googleCode:"zh-CN" },
  { value:"chi_tra", label:"Chinese (Traditional)", nativeLabel:"繁體中文", group:"cjk", googleCode:"zh-TW" },
  { value:"jpn", label:"Japanese",   nativeLabel:"日本語",      group:"cjk",    googleCode:"ja" },
  { value:"kor", label:"Korean",     nativeLabel:"한국어",       group:"cjk",    googleCode:"ko" },
  { value:"ara", label:"Arabic",     nativeLabel:"العربية",    group:"other",  dir:"rtl", googleCode:"ar" },
  { value:"rus", label:"Russian",    nativeLabel:"Русский",    group:"other",  googleCode:"ru" },
  { value:"tha", label:"Thai",       nativeLabel:"ภาษาไทย",    group:"other",  googleCode:"th" },
  { value:"urd", label:"Urdu",       nativeLabel:"اردو",       group:"other",  dir:"rtl", googleCode:"ur" },
];

const INDIC_LANGS = ALL_LANGS.filter(l => l.group === "indic");
const DEFAULT_LANG = ALL_LANGS.find(l => l.value === "eng")!;

const translationCache = new Map<string, string>();
async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === "en") return text;
  const key = `${targetLang}::${text}`;
  if (translationCache.has(key)) return translationCache.get(key)!;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const json = await res.json();
    const t = json[0]?.map((x: string[]) => x[0]).join("") ?? text;
    translationCache.set(key, t); return t;
  } catch { return text; }
}

const BASE_STRINGS = {
 badge: "Submitted to Bhashini — AksharDrishti Hackathon 2026",
unBadge: " Submitted to UN Open Source Week 2026 · Decision April 17", // ← ADD
  // ── UPDATED: mentions Posters + Vedha ──
  heroSub: "Offline AI Platform for OCR, Handwriting Recognition, Sanskrit Digitization, Multilingual Poster Maker, Vedha Digitization and Speech Technology.",
  heroTagline: "AI for Indic Language Preservation",
  cta: "Launch Platform",
  readPage: "Read Page",
  capTitle: "AI Capabilities",
  cap1Title: "OCR Intelligence",
  cap1Body: "Extract printed text from images and documents across 34+ global and Indic languages — fully in-browser.",
  cap2Title: "Handwriting AI",
  cap2Body: "Transformer-powered recognition for Sanskrit, Devanagari and all major Indic scripts.",
  cap3Title: "Speech Technology",
  cap3Body: "Built-in text-to-speech and multilingual AI audio output. No cloud. No latency.",
  whyTitle: "Why AksharaTantra?",
  whyBody: "Centuries of Indic knowledge live in manuscripts, books and handwritten archives. AksharaTantra brings modern AI to digitize and preserve this knowledge — 100% offline, inside your browser.",
  modulesTitle: "Core Modules",
  m1Title: "OCR Engine",              m1Body: "Multi-language OCR for 34+ languages powered by Tesseract.js.",
  m2Title: "Handwriting Recognition", m2Body: "Transformer-based TrOCR models for handwritten Indic scripts.",
  m3Title: "Bulk Digitization",       m3Body: "RajaTantra engine processes multi-page scanned books and archives.",
  m4Title: "Speech & Media",          m4Body: "Offline text-to-speech and media generation using AI models.",
  // ── NEW strings ──
  m5Title: "Multilingual Poster Maker",
  m5Body:  "Design and download beautiful posters in 40+ Indian and global languages with custom fonts, QR codes, and voice input.",
  m6Title: "Vedha Digitization",
  m6Body:  "OCR-powered Sanskrit and Vedic text extractor with pitch accent marking (Udātta, Anudātta, Svarita) and HTML book export.",
  langTitle: "Supported Languages",
  langBody: "Telugu • Sanskrit • Hindi • Tamil • Kannada • Malayalam • Bengali • Gujarati • Marathi • Punjabi • Assamese • Odia • English and 20+ more.",
  privacyTitle: "Privacy First AI",
  privacyBody: "AksharaTantra runs entirely inside your browser. No cloud uploads. No tracking. No analytics. Your data never leaves your device.",
  a11yTitle: "Accessibility First",
  a11yBody: "Screen readers, keyboard navigation, and AI-powered text-to-speech for blind and visually impaired users.",
  ctaFinal: "Start Using AksharaTantra",
  selectLang: "Choose your language",
};
type StringKey = keyof typeof BASE_STRINGS;
type TranslatedStrings = Record<StringKey, string>;

const SCRIPT_SAMPLES = [
  "అక్షర","अक्षर","அக்ஷர","ಅಕ್ಷರ","അക്ഷര",
  "অক্ষর","અક્ષর","ਅੱਖਰ","ଅକ୍ଷର","अक्षरतन्त्र",
];

function useDeviceInfo() {
  const [info, setInfo] = useState({ isMobile:false, isTablet:false, isDesktop:true, os:"Unknown" });
  useEffect(() => {
    const ua = navigator.userAgent;
    let os = "Desktop";
    if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
    else if (/Android/.test(ua)) os = "Android";
    else if (/Windows/.test(ua)) os = "Windows";
    else if (/Mac/.test(ua)) os = "macOS";
    const isMobile = /iPhone|Android|iPad/.test(ua) && /Mobile/.test(ua);
    const isTablet = /iPad|Android/.test(ua) && !/Mobile/.test(ua);
    setInfo({ isMobile, isTablet, isDesktop:!isMobile&&!isTablet, os });
  }, []);
  return info;
}

function ParticleBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let w = c.width = window.innerWidth, h = c.height = window.innerHeight;
    const pts = Array.from({length:50}, () => ({
      x:Math.random()*w, y:Math.random()*h,
      r:Math.random()*1.5+0.4,
      dx:(Math.random()-.5)*.18, dy:(Math.random()-.5)*.18,
      o:Math.random()*.3+.08,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,w,h);
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(8,145,178,${p.o})`; ctx.fill();
        p.x+=p.dx; p.y+=p.dy;
        if(p.x<0)p.x=w; if(p.x>w)p.x=0;
        if(p.y<0)p.y=h; if(p.y>h)p.y=0;
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w=c.width=window.innerWidth; h=c.height=window.innerHeight; };
    window.addEventListener("resize",onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",onResize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:.3}} />;
}

interface LangModalProps { open:boolean; current:LangOption; onSelect:(l:LangOption)=>void; onClose:()=>void; }
function LangModal({open,current,onSelect,onClose}:LangModalProps) {
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState<"indic"|"all">("indic");
  const filtered=ALL_LANGS.filter(l=>{
    const q=search.toLowerCase();
    const m=l.label.toLowerCase().includes(q)||l.nativeLabel.toLowerCase().includes(q);
    return tab==="indic"?l.group==="indic"&&m:m;
  });
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"20px",width:"100%",maxWidth:"560px",maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{padding:"20px 20px 0",borderBottom:"1px solid #e5e7eb"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
            <div>
              <div style={{fontSize:"17px",fontWeight:700,color:"#000",fontFamily:"'Outfit',sans-serif"}}>🌐 Select Language</div>
              <div style={{fontSize:"12px",color:"#6b7280",marginTop:"2px",fontFamily:"'Outfit',sans-serif"}}>Page will translate instantly</div>
            </div>
            <button onClick={onClose} style={{background:"#f3f4f6",border:"none",borderRadius:"8px",width:"36px",height:"36px",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>
          <input placeholder="Search language..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"10px 14px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"10px",color:"#000",fontFamily:"'Outfit',sans-serif",fontSize:"14px",outline:"none",marginBottom:"14px",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:"4px"}}>
            {(["indic","all"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:tab===t?"#f0fdf4":"transparent",border:tab===t?"1px solid #059669":"1px solid transparent",borderBottom:"none",borderRadius:"8px 8px 0 0",color:tab===t?"#059669":"#6b7280",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:"13px",fontWeight:500}}>
                {t==="indic"?"🇮🇳 Indic":"🌍 All Languages"}
              </button>
            ))}
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"14px 16px 20px",WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"8px"}}>
            {filtered.map(lang=>{
              const act=current.value===lang.value;
              return (
                <button key={lang.value} onClick={()=>{onSelect(lang);onClose();}}
                  style={{padding:"12px 10px",borderRadius:"10px",border:act?"1px solid #059669":"1px solid #e5e7eb",background:act?"#f0fdf4":"#fff",cursor:"pointer",textAlign:"left",minHeight:60}}>
                  <div style={{fontSize:"15px",fontWeight:700,color:act?"#059669":"#000",fontFamily:"'Noto Serif',serif",lineHeight:1.2,marginBottom:"2px",direction:lang.dir??"ltr"}}>{lang.nativeLabel}</div>
                  <div style={{fontSize:"11px",color:"#9ca3af",fontFamily:"'Outfit',sans-serif"}}>{lang.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCounter({target,suffix=""}:{target:number;suffix?:string}) {
  const [count,setCount]=useState(0);
  const ref=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{
      if(!e.isIntersecting) return; obs.disconnect();
      let s=0;
      const step=()=>{ s+=Math.ceil(target/40); if(s>=target){setCount(target);return;} setCount(s); requestAnimationFrame(step); };
      requestAnimationFrame(step);
    },{threshold:.5});
    if(ref.current) obs.observe(ref.current);
    return()=>obs.disconnect();
  },[target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Home() {
  const [activeLang,setActiveLang]=useState<LangOption>(DEFAULT_LANG);
  const [strings,setStrings]=useState<TranslatedStrings>(BASE_STRINGS as TranslatedStrings);
  const [translating,setTranslating]=useState(false);
  const [langModalOpen,setLangModalOpen]=useState(false);
  const [scriptIdx,setScriptIdx]=useState(0);
  const [heroVisible,setHeroVisible]=useState(false);
  const [mounted,setMounted]=useState(false);
  const deviceInfo=useDeviceInfo();

  useEffect(()=>{setMounted(true);},[]);
  useEffect(()=>{const id=setInterval(()=>setScriptIdx(i=>(i+1)%SCRIPT_SAMPLES.length),2200);return()=>clearInterval(id);},[]);
  useEffect(()=>{const t=setTimeout(()=>setHeroVisible(true),100);return()=>clearTimeout(t);},[]);

  const applyTranslation=useCallback(async(lang:LangOption)=>{
    if(lang.googleCode==="en"){setStrings(BASE_STRINGS as TranslatedStrings);return;}
    setTranslating(true);
    const entries=Object.entries(BASE_STRINGS) as [StringKey,string][];
    const results=await Promise.all(entries.map(async([k,v])=>[k,await translateText(v,lang.googleCode)] as [StringKey,string]));
    setStrings(Object.fromEntries(results) as TranslatedStrings);
    setTranslating(false);
  },[]);

  useEffect(()=>{applyTranslation(activeLang);document.documentElement.dir=activeLang.dir??"ltr";},[activeLang,applyTranslation]);

  const readPage=()=>{
    const u=new SpeechSynthesisUtterance(document.body.innerText);
    u.lang=activeLang.googleCode; speechSynthesis.cancel(); speechSynthesis.speak(u);
  };
  const stopReading=()=>speechSynthesis.cancel();

  if(!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Noto+Serif+Devanagari:wght@400;700&family=Noto+Serif+Telugu:wght@400;700&family=Noto+Serif+Tamil:wght@400;700&family=Noto+Serif+Bengali:wght@400;700&family=Noto+Serif+Kannada:wght@400;700&family=Noto+Serif+Malayalam:wght@400;700&family=Crimson+Pro:ital,wght@0,300;0,600;1,300&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --green:#10b981; --green-dim:rgba(16,185,129,.08); --green-border:rgba(16,185,129,.25);
          --bg:#fff; --surface:#f8fafc; --surface-hover:#f1f5f9; --border:#e5e7eb;
          --text:#000; --text-muted:#6b7280;
          --fd:'Outfit',sans-serif; --fb:'Crimson Pro',serif;
        }
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:var(--fd);overflow-x:hidden;}

        .skip-link{position:absolute;top:-100px;left:16px;padding:8px 16px;background:var(--green);color:#000;border-radius:4px;font-weight:600;z-index:9999;transition:top .2s;text-decoration:none;}
        .skip-link:focus{top:16px;}

        .toverlay{position:fixed;inset:0;z-index:8000;background:rgba(255,255,255,.92);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;pointer-events:none;}
        .tring{width:44px;height:44px;border-radius:50%;border:3px solid #e5e7eb;border-top-color:var(--green);animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}

        .hero-in{opacity:0;transform:translateY(28px);}
        .hero-done{opacity:1;transform:translateY(0);transition:all .9s cubic-bezier(.22,1,.36,1);}

        .orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}

        .script-ticker{
          font-family:'Noto Serif Devanagari','Noto Serif Telugu','Noto Serif Tamil','Noto Serif',serif;
          font-size:clamp(40px,13vw,140px);font-weight:700;color:transparent;
          -webkit-text-stroke:1px rgba(16,185,129,.15);
          background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.02));
          -webkit-background-clip:text;background-clip:text;
          letter-spacing:-.02em;line-height:1;
          user-select:none;pointer-events:none;
        }

        .btn-primary{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:clamp(14px,2vw,18px) clamp(28px,4vw,48px);background:linear-gradient(135deg,#059669 0%,#10b981 50%,#34d399 100%);color:#fff;border:none;border-radius:14px;font-family:var(--fd);font-size:clamp(14px,1.8vw,16px);font-weight:700;letter-spacing:.01em;text-decoration:none;cursor:pointer;overflow:hidden;min-height:52px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 0 0 1px rgba(16,185,129,.3),0 4px 16px rgba(16,185,129,.3),0 16px 48px rgba(16,185,129,.15),inset 0 1px 0 rgba(255,255,255,.2);transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease;}
        .btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.25) 50%,transparent 60%);transform:translateX(-100%);transition:transform .5s ease;}
        .btn-primary:hover::before{transform:translateX(100%);}
        .btn-primary:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 0 0 1px rgba(16,185,129,.4),0 8px 24px rgba(16,185,129,.4),0 24px 64px rgba(16,185,129,.2),inset 0 1px 0 rgba(255,255,255,.25);}
        .btn-primary:active{transform:scale(.97);}
        .btn-primary .btn-arrow{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:rgba(255,255,255,.2);border-radius:6px;font-size:13px;transition:transform .2s ease;}
        .btn-primary:hover .btn-arrow{transform:translateX(3px);}

        .btn-secondary{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:clamp(13px,1.8vw,17px) clamp(24px,3.5vw,40px);background:rgba(16,185,129,.06);color:#059669;border:1.5px solid rgba(16,185,129,.35);border-radius:14px;font-family:var(--fd);font-size:clamp(13px,1.6vw,15px);font-weight:600;text-decoration:none;cursor:pointer;overflow:hidden;min-height:52px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(8px);transition:all .2s cubic-bezier(.34,1.56,.64,1);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 2px 8px rgba(16,185,129,.08);}
        .btn-secondary:hover{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.6);color:#047857;transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 6px 20px rgba(16,185,129,.15);}
        .btn-secondary:active{transform:scale(.97);}

        .btn-icon{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:#f3f4f6;border:1.5px solid #e5e7eb;border-radius:14px;font-size:18px;cursor:pointer;transition:all .2s cubic-bezier(.34,1.56,.64,1);touch-action:manipulation;-webkit-tap-highlight-color:transparent;flex-shrink:0;}
        .btn-icon:hover{background:#fee2e2;border-color:#fca5a5;transform:scale(1.08);}
        .btn-icon:active{transform:scale(.94);}

        .lang-pill{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:50px;background:rgba(255,255,255,.8);border:1.5px solid #e5e7eb;cursor:pointer;font-family:var(--fd);font-size:14px;font-weight:600;color:var(--text);backdrop-filter:blur(10px);transition:all .25s cubic-bezier(.34,1.56,.64,1);white-space:nowrap;min-height:44px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 8px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.8);}
        .lang-pill:hover{background:rgba(240,253,244,.9);border-color:rgba(16,185,129,.4);color:#059669;transform:translateY(-1px);box-shadow:0 4px 14px rgba(16,185,129,.12),inset 0 1px 0 rgba(255,255,255,.9);}
        .lang-pill:active{transform:scale(.97);}

        .btn-module{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--green);font-family:var(--fd);letter-spacing:.02em;text-transform:uppercase;margin-top:16px;padding:6px 0;border-bottom:1.5px solid transparent;transition:all .2s ease;}
        .btn-module:hover{border-color:var(--green);gap:10px;}
        .btn-module-arrow{transition:transform .2s ease;}
        .feat-card:hover .btn-module-arrow{transform:translateX(4px);}

        .btn-hero-final{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:clamp(18px,2.5vw,22px) clamp(36px,6vw,64px);background:#000;color:#fff;border:none;border-radius:18px;font-family:var(--fd);font-size:clamp(15px,2vw,18px);font-weight:800;letter-spacing:-.01em;text-decoration:none;cursor:pointer;overflow:hidden;min-height:60px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease;box-shadow:0 8px 32px rgba(0,0,0,.2),0 2px 8px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.08);}
        .btn-hero-final::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#059669 0%,#10b981 100%);opacity:0;transition:opacity .3s ease;}
        .btn-hero-final:hover::before{opacity:1;}
        .btn-hero-final:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 48px rgba(16,185,129,.35),0 4px 16px rgba(0,0,0,.1);}
        .btn-hero-final:active{transform:scale(.97);}
        .btn-hero-final span{position:relative;z-index:1;}
        .btn-hero-final .final-icon{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;background:rgba(255,255,255,.15);border-radius:8px;font-size:16px;transition:transform .3s cubic-bezier(.34,1.56,.64,1);}
        .btn-hero-final:hover .final-icon{transform:rotate(15deg) scale(1.2);}

        .badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:50px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);font-size:11px;font-weight:600;color:var(--green);letter-spacing:.04em;text-transform:uppercase;font-family:var(--fd);}

        .feat-card{padding:clamp(16px,3.5vw,28px);border-radius:clamp(10px,2vw,16px);background:var(--surface);border:1px solid var(--border);transition:all .3s;position:relative;overflow:hidden;}
        .feat-card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(16,185,129,.04),transparent);opacity:0;transition:opacity .3s;}
        .feat-card:hover{border-color:var(--green-border);transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.08);}
        .feat-card:hover::before{opacity:1;}
        .feat-icon{width:48px;height:48px;border-radius:12px;background:var(--green-dim);border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px;flex-shrink:0;}

        /* ── NEW: highlight new module cards ── */
        .feat-card.new-module{border:1.5px solid rgba(16,185,129,.3);background:linear-gradient(160deg,#f0fdf4 0%,#fafafa 100%);}
        .new-badge{position:absolute;top:12px;right:12px;font-size:9px;font-weight:800;padding:3px 8px;border-radius:50px;background:var(--green);color:#fff;font-family:var(--fd);letter-spacing:.07em;text-transform:uppercase;}

        .stat-item{text-align:center;padding:clamp(14px,2.5vw,24px) clamp(10px,2vw,20px);border-radius:14px;background:var(--surface);border:1px solid var(--border);transition:border-color .3s;}
        .stat-item:hover{border-color:var(--green-border);}
        .stat-num{font-size:clamp(22px,4vw,44px);font-weight:800;color:var(--green);font-family:var(--fd);line-height:1;}
        .stat-label{font-size:11px;margin-top:6px;color:var(--text-muted);font-family:var(--fd);text-transform:uppercase;letter-spacing:.06em;}

        .strip{display:flex;align-items:center;justify-content:center;gap:clamp(10px,2.5vw,28px);flex-wrap:wrap;padding:clamp(12px,2vw,18px) clamp(16px,4vw,40px);background:#f0fdf4;border-top:1px solid rgba(16,185,129,.1);border-bottom:1px solid rgba(16,185,129,.1);}
        .strip-item{display:flex;align-items:center;gap:7px;font-size:clamp(11px,1.5vw,13px);color:var(--text-muted);font-family:var(--fd);}
        .strip-dot{width:5px;height:5px;border-radius:50%;background:var(--green);flex-shrink:0;}

        .indic-scroll{display:flex;gap:8px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .indic-scroll::-webkit-scrollbar{display:none;}
        .indic-chip{flex-shrink:0;padding:7px 14px;border-radius:50px;border:1px solid var(--border);background:var(--surface);font-family:'Noto Serif',serif;font-size:13px;color:var(--text-muted);cursor:pointer;transition:all .2s;white-space:nowrap;min-height:36px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
        .indic-chip:hover,.indic-chip.active{background:var(--green-dim);border-color:var(--green-border);color:var(--green);}

        .divider{width:60px;height:3px;background:linear-gradient(90deg,var(--green),transparent);border-radius:2px;margin:0 auto 28px;}

        /* ── GRIDS ── */
        .g-stats   {display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(8px,1.5vw,16px);}
        .g-caps    {display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(10px,2vw,20px);}
        /* 6-module grid: 3 cols desktop */
        .g-modules {display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(10px,2vw,16px);}
        .g-privacy {display:grid;grid-template-columns:repeat(2,1fr);gap:0;}

        .hero-btns{display:flex;gap:clamp(8px,1.5vw,12px);justify-content:center;flex-wrap:wrap;align-items:center;margin-bottom:36px;}
        .tags-row{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;}
        .tag{padding:4px 12px;border-radius:50px;background:#f3f4f6;border:1px solid #e5e7eb;font-size:12px;color:#6b7280;font-family:var(--fd);}

        @media(min-width:641px) and (max-width:1023px){
          .g-caps    {grid-template-columns:repeat(2,1fr);}
          .g-modules {grid-template-columns:repeat(2,1fr);}
        }
        @media(max-width:640px){
          .g-stats   {grid-template-columns:repeat(2,1fr);}
          .g-caps    {grid-template-columns:1fr;}
          .g-modules {grid-template-columns:1fr;}
          .g-privacy {grid-template-columns:1fr;}
          .privacy-divider{border-left:none !important;border-top:1px solid #e5e7eb;}
          .hero-btns{flex-direction:column;align-items:stretch;width:100%;max-width:320px;margin:0 auto 32px;}
          .btn-primary{width:100%;}
          .btn-secondary{width:100%;}
          .btn-icon{align-self:center;}
          .strip{row-gap:8px;}
          .strip-item:nth-child(n+5){display:none;}
          section[data-sec]{padding-left:clamp(14px,4vw,20px) !important;padding-right:clamp(14px,4vw,20px) !important;}
        }
        @media(max-width:380px){
          .g-stats{grid-template-columns:repeat(2,1fr);}
          .badge{font-size:10px;padding:4px 10px;}
        }
        button,a{-webkit-tap-highlight-color:transparent;}
      `}</style>

      {translating&&(
        <div className="toverlay">
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
            <div className="tring"/>
            <div style={{color:"var(--green)",fontFamily:"var(--fd)",fontSize:"13px"}}>Translating…</div>
          </div>
        </div>
      )}

      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ParticleBg/>
      <Navbar/>
      <LangModal open={langModalOpen} current={activeLang} onSelect={setActiveLang} onClose={()=>setLangModalOpen(false)}/>

      <main id="main-content" role="main" style={{position:"relative",zIndex:1}}>

        {/* ── HERO ── */}
        <section data-sec style={{
          minHeight:"100svh",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",textAlign:"center",
          padding:"clamp(80px,12vw,120px) clamp(16px,5vw,40px) clamp(48px,8vw,80px)",
          position:"relative",overflow:"hidden",
        }}>
          <div className="orb" style={{width:"min(500px,90vw)",height:"min(500px,90vw)",background:"rgba(16,185,129,.04)",top:"-80px",left:"50%",transform:"translateX(-50%)"}}/>
          <div className="orb" style={{width:"min(300px,60vw)",height:"min(300px,60vw)",background:"rgba(16,185,129,.02)",bottom:0,right:"5%"}}/>

          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:0,width:"100%",textAlign:"center",overflow:"hidden"}}>
            <div className="script-ticker">{SCRIPT_SAMPLES[scriptIdx]}</div>
          </div>
<div className={heroVisible?"hero-done":"hero-in"} style={{position:"relative",zIndex:1,width:"100%",maxWidth:760}}>

  <div style={{display:"flex",justifyContent:"center",gap:"8px",marginBottom:"20px",flexWrap:"wrap",alignItems:"center"}}>
    <button className="lang-pill" onClick={()=>setLangModalOpen(true)}>
      <LanguageIcon style={{fontSize:16,color:"var(--green)"}}/>
      <span style={{fontFamily:"'Noto Serif',serif",fontSize:"15px"}}>{activeLang.nativeLabel}</span>
      <span style={{color:"var(--text-muted)",fontSize:"11px"}}>▾</span>
    </button>
    <span className="badge"><LanguageIcon style={{fontSize:12}}/> {strings.selectLang}</span>
    {deviceInfo.isMobile&&<span className="badge"><PhoneAndroidIcon style={{fontSize:12}}/> Mobile Optimized</span>}
  </div>

  {/* ── Badges row ── */}
  <div style={{display:"flex",justifyContent:"center",gap:"8px",marginBottom:"14px",flexWrap:"wrap"}}>
    <span className="badge">
      <EmojiEventsIcon style={{fontSize:12}}/> {strings.badge}
    </span>
    {/* UN OSW badge — blue to differentiate */}
    <span className="badge" style={{
      background:"rgba(37,99,235,.08)",
      border:"1px solid rgba(37,99,235,.22)",
      color:"#1d4ed8",
    }}>
      🌍 Submitted · UN Open Source Week 2026 · Apr 17
    </span>
  </div>

  <h1 style={{fontSize:"clamp(40px,10vw,110px)",fontWeight:900,letterSpacing:"-.03em",lineHeight:.93,color:"#000",fontFamily:"'Outfit',sans-serif",marginBottom:"4px"}}>
    Akshara
  </h1>
  <h1 style={{fontSize:"clamp(40px,10vw,110px)",fontWeight:900,letterSpacing:"-.03em",lineHeight:.93,background:"linear-gradient(135deg,#10b981,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontFamily:"'Outfit',sans-serif",marginBottom:"24px"}}>
    Tantra
  </h1>

  <p style={{fontSize:"clamp(14px,2.2vw,21px)",color:"#374151",maxWidth:"640px",margin:"0 auto 12px",lineHeight:1.65,fontFamily:"'Crimson Pro',serif",fontWeight:300}}>
    {strings.heroSub}
  </p>
  <p style={{fontSize:"clamp(10px,1.4vw,13px)",color:"var(--green)",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif",fontWeight:600,marginBottom:"28px"}}>
    {strings.heroTagline}
  </p>

  <div className="hero-btns">
    <Link href="/upload" className="btn-primary">
      <span className="btn-arrow"><RocketLaunchIcon style={{fontSize:16}}/></span>
      <span>{strings.cta}</span>
      <span className="btn-arrow"><ArrowForwardIcon style={{fontSize:15}}/></span>
    </Link>
    <button onClick={readPage} className="btn-secondary">
      <VolumeUpIcon style={{fontSize:18}}/>
      <span>{strings.readPage}</span>
    </button>
    <button onClick={stopReading} className="btn-icon" title="Stop reading" aria-label="Stop reading">
      <StopCircleIcon style={{fontSize:22,color:"#6b7280"}}/>
    </button>
  </div>

  <div className="tags-row">
    {["34+ Languages","100% Offline","Open Source","No API Keys","Poster Maker","Vedha OCR","UN OSW 2026"].map(t=>(
      <span key={t} className="tag" style={t==="UN OSW 2026"?{background:"#eff6ff",border:"1px solid #bfdbfe",color:"#1d4ed8"}:{}}>{t}</span>
    ))}
  </div>
</div>
        </section>

        {/* ── Offline strip — 2 new items added ── */}
        <div className="strip">
          {[
            {icon:<WifiOffIcon style={{fontSize:15}}/>,label:"100% Offline"},
            {icon:<LockIcon style={{fontSize:15}}/>,label:"No Cloud Upload"},
            {icon:<BlockIcon style={{fontSize:15}}/>,label:"Zero Tracking"},
            {icon:<BarChartIcon style={{fontSize:15}}/>,label:"Free & Open Source"},
            {icon:<GraphicEqIcon style={{fontSize:15}}/>,label:"Instant Processing"},
            {icon:<DashboardCustomizeIcon style={{fontSize:15}}/>,label:"40+ Lang Posters"},
            {icon:<AutoStoriesIcon style={{fontSize:15}}/>,label:"Vedha Digitization"},
          ].map(item=>(
            <div key={item.label} className="strip-item">
              <span style={{display:"flex",alignItems:"center",color:"var(--green)"}}>{item.icon}</span>
              <div className="strip-dot"/>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* ── Stats — 4 → 6 modules ── */}
        <section data-sec style={{padding:"clamp(36px,6vw,80px) clamp(16px,5vw,40px)",maxWidth:1100,margin:"0 auto"}}>
          <div className="g-stats">
            <div className="stat-item"><div className="stat-num"><StatCounter target={34} suffix="+"/></div><div className="stat-label">Languages</div></div>
            <div className="stat-item"><div className="stat-num"><StatCounter target={100} suffix="%"/></div><div className="stat-label">Offline</div></div>
            <div className="stat-item"><div className="stat-num"><StatCounter target={0}/></div><div className="stat-label">API Keys Needed</div></div>
            <div className="stat-item"><div className="stat-num"><StatCounter target={6}/></div><div className="stat-label">AI Modules</div></div>
          </div>
        </section>

        {/* ── AI Capabilities ── */}
        <section data-sec style={{padding:"0 clamp(16px,5vw,40px) clamp(48px,8vw,100px)",maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{textAlign:"center",marginBottom:"14px",fontSize:"clamp(22px,4vw,42px)",fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>{strings.capTitle}</h2>
          <div className="divider"/>
          <div className="g-caps">
            {[
              {icon:<ArticleIcon style={{fontSize:22}}/>,title:strings.cap1Title,body:strings.cap1Body,color:"#10b981"},
              {icon:<GestureIcon style={{fontSize:22}}/>,title:strings.cap2Title,body:strings.cap2Body,color:"#6366f1"},
              {icon:<GraphicEqIcon style={{fontSize:22}}/>,title:strings.cap3Title,body:strings.cap3Body,color:"#f59e0b"},
            ].map(card=>(
              <div key={card.title} className="feat-card">
                <div className="feat-icon" style={{background:`${card.color}18`,borderColor:`${card.color}30`,color:card.color}}>{card.icon}</div>
                <h3 style={{fontSize:"clamp(14px,1.8vw,17px)",fontWeight:700,marginBottom:"9px",fontFamily:"'Outfit',sans-serif"}}>{card.title}</h3>
                <p style={{fontSize:"clamp(13px,1.5vw,15px)",lineHeight:1.65,color:"#6b7280",fontFamily:"'Crimson Pro',serif"}}>{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why ── */}
        <section style={{padding:"clamp(48px,7vw,80px) clamp(16px,5vw,40px)",background:"#f0fdf4",borderTop:"1px solid rgba(16,185,129,.1)",borderBottom:"1px solid rgba(16,185,129,.1)"}}>
          <div style={{maxWidth:780,margin:"0 auto",textAlign:"center"}}>
            <h2 style={{fontSize:"clamp(20px,4vw,40px)",fontWeight:800,marginBottom:"20px",fontFamily:"'Outfit',sans-serif"}}>{strings.whyTitle}</h2>
            <p style={{fontSize:"clamp(15px,2vw,21px)",lineHeight:1.8,color:"#374151",fontFamily:"'Crimson Pro',serif",fontWeight:300,fontStyle:"italic"}}>{strings.whyBody}</p>
          </div>
        </section>

        {/* ── Core Modules — 6 cards, 3-col grid ── */}
        <section data-sec style={{padding:"clamp(48px,7vw,100px) clamp(16px,5vw,40px)",maxWidth:1200,margin:"0 auto"}}>
          <h2 style={{textAlign:"center",marginBottom:"14px",fontSize:"clamp(20px,3.5vw,38px)",fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>{strings.modulesTitle}</h2>
          <div className="divider"/>
          <div className="g-modules">
            {[
              {icon:<ArticleIcon style={{fontSize:26,color:"#10b981"}}/>,       title:strings.m1Title, body:strings.m1Body, href:"/OCR",     isNew:false},
              {icon:<GestureIcon style={{fontSize:26,color:"#6366f1"}}/>,        title:strings.m2Title, body:strings.m2Body, href:"/ocreng",  isNew:false},
              {icon:<LibraryBooksIcon style={{fontSize:26,color:"#f59e0b"}}/>,   title:strings.m3Title, body:strings.m3Body, href:"/Ocrwork", isNew:false},
              {icon:<MicIcon style={{fontSize:26,color:"#ec4899"}}/>,            title:strings.m4Title, body:strings.m4Body, href:"/voice",   isNew:false},
              // ── NEW ──
              {icon:<DashboardCustomizeIcon style={{fontSize:26,color:"#0ea5e9"}}/>, title:strings.m5Title, body:strings.m5Body, href:"/posters", isNew:true},
              {icon:<AutoStoriesIcon style={{fontSize:26,color:"#8b5cf6"}}/>,        title:strings.m6Title, body:strings.m6Body, href:"/vedha",   isNew:true},
            ].map(m=>(
              <Link key={m.href} href={m.href} style={{textDecoration:"none"}}>
                <article className={`feat-card${m.isNew?" new-module":""}`} style={{height:"100%"}}>
                  {m.isNew && <span className="new-badge">NEW</span>}
                  <div style={{marginBottom:"12px"}}>{m.icon}</div>
                  <h3 style={{fontSize:"clamp(14px,1.8vw,18px)",fontWeight:700,marginBottom:"8px",color:"#000",fontFamily:"'Outfit',sans-serif"}}>{m.title}</h3>
                  <p style={{fontSize:"clamp(13px,1.5vw,15px)",color:"#6b7280",lineHeight:1.65,fontFamily:"'Crimson Pro',serif"}}>{m.body}</p>
                  <div className="btn-module">
                    Open module <span className="btn-module-arrow">→</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Languages ── */}
        <section data-sec style={{padding:"clamp(40px,6vw,80px) clamp(16px,5vw,40px)",textAlign:"center",maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{fontSize:"clamp(20px,3vw,36px)",fontWeight:800,marginBottom:"14px",fontFamily:"'Outfit',sans-serif"}}>{strings.langTitle}</h2>
          <div className="divider"/>
          <div className="indic-scroll" style={{marginBottom:"20px"}}>
            {INDIC_LANGS.map(lang=>(
              <button key={lang.value} className={`indic-chip${activeLang.value===lang.value?" active":""}`}
                onClick={()=>setActiveLang(lang)} title={lang.label}>
                <span style={{fontFamily:"'Noto Serif',serif"}}>{lang.nativeLabel}</span>
              </button>
            ))}
          </div>
          <p style={{color:"#6b7280",fontFamily:"'Crimson Pro',serif",fontSize:"clamp(14px,1.8vw,17px)",lineHeight:1.7}}>{strings.langBody}</p>
          <button onClick={()=>setLangModalOpen(true)} className="btn-secondary" style={{marginTop:"22px",display:"inline-flex"}}>
            <LanguageIcon style={{fontSize:17}}/> View all {ALL_LANGS.length} languages
          </button>
        </section>

        {/* ── Privacy + A11y ── */}
        <section style={{padding:"clamp(40px,6vw,80px) clamp(16px,5vw,40px)",background:"#f0fdf4",borderTop:"1px solid rgba(16,185,129,.1)"}}>
          <div className="g-privacy" style={{maxWidth:960,margin:"0 auto"}}>
            <div style={{textAlign:"center",padding:"clamp(20px,4vw,40px) clamp(16px,3vw,32px)"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:"16px"}}><LockIcon style={{fontSize:"clamp(32px,6vw,48px)",color:"var(--green)"}}/></div>
              <h2 style={{fontSize:"clamp(17px,2.5vw,26px)",fontWeight:800,marginBottom:"12px",fontFamily:"'Outfit',sans-serif"}}>{strings.privacyTitle}</h2>
              <p style={{color:"#6b7280",lineHeight:1.75,fontFamily:"'Crimson Pro',serif",fontSize:"clamp(13px,1.8vw,16px)"}}>{strings.privacyBody}</p>
            </div>
            <div className="privacy-divider" style={{textAlign:"center",padding:"clamp(20px,4vw,40px) clamp(16px,3vw,32px)",borderLeft:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:"16px"}}><AccessibilityNewIcon style={{fontSize:"clamp(32px,6vw,48px)",color:"#6366f1"}}/></div>
              <h2 style={{fontSize:"clamp(17px,2.5vw,26px)",fontWeight:800,marginBottom:"12px",fontFamily:"'Outfit',sans-serif"}}>{strings.a11yTitle}</h2>
              <p style={{color:"#6b7280",lineHeight:1.75,fontFamily:"'Crimson Pro',serif",fontSize:"clamp(13px,1.8vw,16px)"}}>{strings.a11yBody}</p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{padding:"clamp(48px,8vw,100px) clamp(16px,5vw,40px)",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div className="orb" style={{width:"min(600px,90vw)",height:"min(600px,90vw)",background:"rgba(16,185,129,.04)",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{marginBottom:"18px"}}><span className="badge"><RocketLaunchIcon style={{fontSize:12}}/> Ready to digitize?</span></div>
            <h2 style={{fontSize:"clamp(24px,5.5vw,64px)",fontWeight:900,letterSpacing:"-.02em",marginBottom:"36px",color:"#000",fontFamily:"'Outfit',sans-serif",lineHeight:1.1}}>
              {strings.ctaFinal}
            </h2>
            <Link href="/upload" className="btn-hero-final">
              <span className="final-icon"><RocketLaunchIcon style={{fontSize:18}}/></span>
              <span>{strings.cta}</span>
            </Link>
            <div style={{marginTop:"48px"}}>
              <ShareSection selectedLanguage={activeLang}/>
            </div>
          </div>
        </section>

      </main>

      <GoToTopButton/>
    </>
  );
}
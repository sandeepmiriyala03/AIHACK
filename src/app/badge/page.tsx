"use client";
export const dynamic = 'force-dynamic';

import React, { useRef, useEffect, useState, useCallback, ChangeEvent } from "react";
import Navbar from "@/components/Navbar";

// ── Google Fonts URL — all 40+ language families ──────────────────────────
const GFONTS =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700;900" +
  "&family=Ramabhadra&family=Gidugu&family=Mandali&family=NTR&family=RaviPrakash" +
  "&family=Tenali+Ramakrishna&family=Timmana&family=Ramaraja&family=Ponnala" +
  "&family=Noto+Sans+Devanagari:wght@400;700;900&family=Hind:wght@400;700" +
  "&family=Tiro+Devanagari+Hindi&family=Baloo+2:wght@700" +
  "&family=Noto+Sans+Tamil:wght@400;700&family=Catamaran:wght@700" +
  "&family=Noto+Sans+Kannada:wght@400;700&family=Noto+Sans+Malayalam:wght@400;700" +
  "&family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans+Gujarati:wght@400;700" +
  "&family=Noto+Sans+Gurmukhi:wght@400;700&family=Noto+Sans+Oriya:wght@400;700" +
  "&family=Noto+Sans+Sinhala:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;700" +
  "&family=Noto+Naskh+Arabic:wght@400;700&family=Noto+Sans+SC:wght@400;700" +
  "&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700" +
  "&family=Noto+Serif+Hebrew:wght@400;700" +
  "&family=Playfair+Display:wght@400;700;900&family=Oswald:wght@400;700" +
  "&family=Merriweather:wght@700&family=Cinzel:wght@700&family=Dancing+Script:wght@700" +
  "&family=Noto+Serif:wght@400;700&display=swap";

// ── Language → fonts mapping ───────────────────────────────────────────────
const LANG_FONTS: Record<string, string[]> = {
  tel: ["Noto Sans Telugu","Ramabhadra","Gidugu","Mandali","NTR","RaviPrakash","Tenali Ramakrishna","Timmana","Ramaraja","Ponnala"],
  hin: ["Noto Sans Devanagari","Hind","Baloo 2","Tiro Devanagari Hindi"],
  san: ["Noto Sans Devanagari","Noto Serif","Hind"],
  mar: ["Noto Sans Devanagari","Hind","Baloo 2"],
  ben: ["Noto Sans Bengali"],
  asm: ["Noto Sans Bengali"],
  mni: ["Noto Sans Bengali"],
  guj: ["Noto Sans Gujarati"],
  pan: ["Noto Sans Gurmukhi"],
  kan: ["Noto Sans Kannada"],
  mal: ["Noto Sans Malayalam"],
  tam: ["Noto Sans Tamil","Catamaran"],
  ori: ["Noto Sans Oriya"],
  nep: ["Noto Sans Devanagari","Hind"],
  bod: ["Noto Sans Devanagari"],
  doi: ["Noto Sans Devanagari"],
  kok: ["Noto Sans Devanagari"],
  mai: ["Noto Sans Devanagari"],
  sin: ["Noto Sans Sinhala"],
  urd: ["Noto Nastaliq Urdu"],
  kas: ["Noto Nastaliq Urdu"],
  snd: ["Noto Nastaliq Urdu"],
  ara: ["Noto Naskh Arabic"],
  fas: ["Noto Naskh Arabic"],
  heb: ["Noto Serif Hebrew"],
  chi_sim: ["Noto Sans SC"],
  chi_tra: ["Noto Sans SC"],
  jpn: ["Noto Sans JP"],
  kor: ["Noto Sans KR"],
  eng: ["Playfair Display","Oswald","Cinzel","Dancing Script","Merriweather"],
  fra: ["Playfair Display","Cinzel"],
  deu: ["Playfair Display","Merriweather"],
  spa: ["Playfair Display","Dancing Script"],
  por: ["Playfair Display"],
  ita: ["Playfair Display","Cinzel"],
  rus: ["Noto Serif"],
  tha: ["Noto Sans"],
  vie: ["Playfair Display"],
  tur: ["Playfair Display"],
  pol: ["Playfair Display"],
  swe: ["Playfair Display"],
  ind: ["Playfair Display"],
  ell: ["Playfair Display"],
};

// ── All languages ─────────────────────────────────────────────────────────
const LANGUAGES = [
  // Indian
  { code:"tel", label:"Telugu",    native:"తెలుగు",       flag:"🌺", group:"indian", dir:"ltr", placeholder:"మీ పేరు" },
  { code:"hin", label:"Hindi",     native:"हिन्दी",       flag:"🇮🇳", group:"indian", dir:"ltr", placeholder:"आपका नाम" },
  { code:"san", label:"Sanskrit",  native:"संस्कृतम्",    flag:"🕉️", group:"indian", dir:"ltr", placeholder:"नाम" },
  { code:"tam", label:"Tamil",     native:"தமிழ்",        flag:"🌸", group:"indian", dir:"ltr", placeholder:"உங்கள் பெயர்" },
  { code:"kan", label:"Kannada",   native:"ಕನ್ನಡ",        flag:"🐘", group:"indian", dir:"ltr", placeholder:"ನಿಮ್ಮ ಹೆಸರು" },
  { code:"mal", label:"Malayalam", native:"മലയാളം",       flag:"🌴", group:"indian", dir:"ltr", placeholder:"നിങ്ങളുടെ പേര്" },
  { code:"ben", label:"Bengali",   native:"বাংলা",        flag:"🐯", group:"indian", dir:"ltr", placeholder:"আপনার নাম" },
  { code:"guj", label:"Gujarati",  native:"ગુજરાતી",      flag:"🦁", group:"indian", dir:"ltr", placeholder:"તમારું નામ" },
  { code:"mar", label:"Marathi",   native:"मराठी",        flag:"🏔️", group:"indian", dir:"ltr", placeholder:"तुमचे नाव" },
  { code:"pan", label:"Punjabi",   native:"ਪੰਜਾਬੀ",       flag:"🪯", group:"indian", dir:"ltr", placeholder:"ਤੁਹਾਡਾ ਨਾਮ" },
  { code:"ori", label:"Odia",      native:"ଓଡ଼ିଆ",        flag:"🪷", group:"indian", dir:"ltr", placeholder:"ଆପଣଙ୍କ ନାମ" },
  { code:"asm", label:"Assamese",  native:"অসমীয়া",      flag:"🎋", group:"indian", dir:"ltr", placeholder:"আপোনাৰ নাম" },
  { code:"nep", label:"Nepali",    native:"नेपाली",       flag:"🏔️", group:"indian", dir:"ltr", placeholder:"तपाईको नाम" },
  { code:"mai", label:"Maithili",  native:"मैथिली",       flag:"🌾", group:"indian", dir:"ltr", placeholder:"अहाँक नाम" },
  { code:"sin", label:"Sinhala",   native:"සිංහල",        flag:"🇱🇰", group:"indian", dir:"ltr", placeholder:"ඔබේ නම" },
  { code:"urd", label:"Urdu",      native:"اردو",         flag:"🌙", group:"indian", dir:"rtl", placeholder:"آپ کا نام" },
  { code:"bod", label:"Bodo",      native:"बड़ो",         flag:"🌿", group:"indian", dir:"ltr", placeholder:"आपका नाम" },
  { code:"doi", label:"Dogri",     native:"डोगरी",        flag:"🏔️", group:"indian", dir:"ltr", placeholder:"तुम्हारा नाम" },
  { code:"kok", label:"Konkani",   native:"कोंकणी",       flag:"🌴", group:"indian", dir:"ltr", placeholder:"तुमचें नांव" },
  { code:"mni", label:"Manipuri",  native:"মণিপুরী",      flag:"🎋", group:"indian", dir:"ltr", placeholder:"নাম" },
  { code:"kas", label:"Kashmiri",  native:"کٲشُر",        flag:"🏔️", group:"indian", dir:"rtl", placeholder:"ناو" },
  { code:"snd", label:"Sindhi",    native:"سنڌي",         flag:"☪️", group:"indian", dir:"rtl", placeholder:"توهان جو نالو" },
  // Global
  { code:"eng", label:"English",   native:"English",      flag:"🌍", group:"global", dir:"ltr", placeholder:"Your Name" },
  { code:"ara", label:"Arabic",    native:"العربية",      flag:"🇸🇦", group:"global", dir:"rtl", placeholder:"اسمك" },
  { code:"chi_sim",label:"中文(简)",native:"简体中文",      flag:"🇨🇳", group:"global", dir:"ltr", placeholder:"您的姓名" },
  { code:"chi_tra",label:"中文(繁)",native:"繁體中文",      flag:"🇹🇼", group:"global", dir:"ltr", placeholder:"您的姓名" },
  { code:"jpn", label:"Japanese",  native:"日本語",        flag:"🇯🇵", group:"global", dir:"ltr", placeholder:"お名前" },
  { code:"kor", label:"Korean",    native:"한국어",         flag:"🇰🇷", group:"global", dir:"ltr", placeholder:"이름" },
  { code:"fra", label:"French",    native:"Français",     flag:"🇫🇷", group:"global", dir:"ltr", placeholder:"Votre nom" },
  { code:"deu", label:"German",    native:"Deutsch",      flag:"🇩🇪", group:"global", dir:"ltr", placeholder:"Ihr Name" },
  { code:"spa", label:"Spanish",   native:"Español",      flag:"🇪🇸", group:"global", dir:"ltr", placeholder:"Tu nombre" },
  { code:"por", label:"Portuguese",native:"Português",    flag:"🇵🇹", group:"global", dir:"ltr", placeholder:"Seu nome" },
  { code:"rus", label:"Russian",   native:"Русский",      flag:"🇷🇺", group:"global", dir:"ltr", placeholder:"Ваше имя" },
  { code:"ita", label:"Italian",   native:"Italiano",     flag:"🇮🇹", group:"global", dir:"ltr", placeholder:"Il tuo nome" },
  { code:"tha", label:"Thai",      native:"ภาษาไทย",      flag:"🇹🇭", group:"global", dir:"ltr", placeholder:"ชื่อของคุณ" },
  { code:"vie", label:"Vietnamese",native:"Tiếng Việt",   flag:"🇻🇳", group:"global", dir:"ltr", placeholder:"Tên của bạn" },
  { code:"heb", label:"Hebrew",    native:"עברית",        flag:"🇮🇱", group:"global", dir:"rtl", placeholder:"שמך" },
  { code:"fas", label:"Persian",   native:"فارسی",        flag:"🇮🇷", group:"global", dir:"rtl", placeholder:"نام شما" },
  { code:"tur", label:"Turkish",   native:"Türkçe",       flag:"🇹🇷", group:"global", dir:"ltr", placeholder:"Adınız" },
  { code:"pol", label:"Polish",    native:"Polski",       flag:"🇵🇱", group:"global", dir:"ltr", placeholder:"Twoje imię" },
  { code:"swe", label:"Swedish",   native:"Svenska",      flag:"🇸🇪", group:"global", dir:"ltr", placeholder:"Ditt namn" },
  { code:"ind", label:"Indonesian",native:"Indonesia",    flag:"🇮🇩", group:"global", dir:"ltr", placeholder:"Nama Anda" },
  { code:"ell", label:"Greek",     native:"Ελληνικά",     flag:"🇬🇷", group:"global", dir:"ltr", placeholder:"Το όνομά σας" },
];

// ── Frame presets ─────────────────────────────────────────────────────────
const FRAMES = [
  { id:"plain",    label:"Plain",    ringWidth:0.022, ringColor:"#000000", innerGap:0,     outerRing:false },
  { id:"double",   label:"Double",   ringWidth:0.018, ringColor:"#000000", innerGap:0.008, outerRing:true  },
  { id:"gold",     label:"Gold",     ringWidth:0.025, ringColor:"#C9A84C", innerGap:0.010, outerRing:true  },
  { id:"gradient", label:"Gradient", ringWidth:0.025, ringColor:"gradient",innerGap:0.008, outerRing:false },
  { id:"dotted",   label:"Dotted",   ringWidth:0.020, ringColor:"#000000", innerGap:0,     outerRing:false },
  { id:"verified", label:"Verified", ringWidth:0.025, ringColor:"#1D9BF0", innerGap:0.008, outerRing:false },
];

// ── Size presets ──────────────────────────────────────────────────────────
const SIZES = [
  { id:"post",    label:"Square",   w:1080, h:1080, icon:"⬛" },
  { id:"story",   label:"Story",    w:1080, h:1920, icon:"📱" },
  { id:"profile", label:"Profile",  w:800,  h:800,  icon:"👤" },
  { id:"wa",      label:"WhatsApp", w:500,  h:500,  icon:"💬" },
];

// ── Text position options ─────────────────────────────────────────────────
const POSITIONS = [
  { id:"arc-bottom", label:"Arc Bottom" },
  { id:"arc-top",    label:"Arc Top"    },
  { id:"center",     label:"Center"     },
  { id:"none",       label:"No Text"    },
];

// ── Overlay stickers ──────────────────────────────────────────────────────
const STICKERS = ["","🌟","🏆","✨","🎯","🔥","💎","🌺","🕉️","🇮🇳","🌍","❤️","👑"];

// ── Draw helpers ──────────────────────────────────────────────────────────
function drawCurvedText(
  ctx: CanvasRenderingContext2D, text: string,
  cx: number, cy: number, radius: number,
  startAngle: number, fontSize: number, font: string, color: string
) {
  if (!text) return;
  ctx.save();
  ctx.font      = `bold ${fontSize}px "${font}", "Noto Sans", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const chars = [...text]; // handles multi-byte unicode
  const totalW = ctx.measureText(text).width;
  const angW   = totalW / radius;
  let angle    = startAngle - angW / 2;
  for (const ch of chars) {
    const w = ctx.measureText(ch).width;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + w / (2 * radius));
    ctx.fillText(ch, 0, -radius);
    ctx.restore();
    angle += w / radius;
  }
  ctx.restore();
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  size: number,
  opts: {
    userImg: HTMLImageElement | null;
    zoom: number; panX: number; panY: number;
    text: string; subText: string;
    font: string; pos: string;
    textColor: string; frameId: string; ringColor: string;
    bgColor: string; sticker: string;
    brightness: number; contrast: number;
  }
) {
  const {
    userImg, zoom, panX, panY,
    text, subText, font, pos,
    textColor, frameId, ringColor,
    bgColor, sticker,
    brightness, contrast,
  } = opts;

  const mid    = size / 2;
  const frame  = FRAMES.find(f => f.id === frameId) ?? FRAMES[0];
  const bSize  = size * frame.ringWidth;
  const gap    = size * frame.innerGap;

  ctx.clearRect(0, 0, size, size);

  // ── Outer ring ──
  if (frame.ringColor === "gradient") {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#f59e0b");
    grad.addColorStop(0.5, "#ef4444");
    grad.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = grad;
  } else if (frameId === "verified") {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#1D9BF0");
    grad.addColorStop(1, "#0ea5e9");
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = ringColor;
  }
  ctx.beginPath(); ctx.arc(mid, mid, mid, 0, Math.PI * 2); ctx.fill();

  // ── Dotted outer ring decoration ──
  if (frameId === "dotted") {
    ctx.save();
    const dotR = size * 0.008, dotRad = mid - size * 0.008;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(mid + Math.cos(a) * dotRad, mid + Math.sin(a) * dotRad, dotR, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Double ring gap ──
  if (frame.outerRing && gap > 0) {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(mid, mid, mid - bSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = frameId === "gold" ? "#C9A84C" : ringColor;
    ctx.beginPath(); ctx.arc(mid, mid, mid - bSize - gap, 0, Math.PI * 2); ctx.fill();
  }

  // ── Image clip ──
  const innerR = mid - bSize - (frame.outerRing ? gap + bSize * 0.6 : 0);
  ctx.save();
  ctx.beginPath(); ctx.arc(mid, mid, innerR, 0, Math.PI * 2); ctx.clip();

  if (userImg) {
    // Apply brightness/contrast filter
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    const min = Math.min(userImg.naturalWidth, userImg.naturalHeight);
    const dSize = size * zoom;
    const offX  = (dSize - size) / 2 - panX * size * 0.3;
    const offY  = (dSize - size) / 2 - panY * size * 0.3;
    ctx.drawImage(
      userImg,
      (userImg.naturalWidth  - min) / 2,
      (userImg.naturalHeight - min) / 2,
      min, min,
      -offX, -offY, dSize, dSize
    );
    ctx.filter = "none";
  } else {
    // Placeholder
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath(); ctx.arc(mid, mid * 0.85, mid * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mid, mid * 1.65, mid * 0.48, 0, Math.PI * 2); ctx.fill();
    // Placeholder text
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.font = `bold ${size * 0.06}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Upload Photo", mid, mid);
  }
  ctx.restore();

  // ── Text shadow ──
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur  = size * 0.008;

  // ── Main text ──
  const fontSize = size * 0.062;
  if (pos === "arc-bottom" && text) {
    drawCurvedText(ctx, text, mid, mid, innerR - size * 0.04, Math.PI / 2, fontSize, font, textColor);
  } else if (pos === "arc-top" && text) {
    drawCurvedText(ctx, text, mid, mid, innerR - size * 0.04, -Math.PI / 2, fontSize, font, textColor);
  } else if (pos === "center" && text) {
    ctx.font      = `bold ${fontSize}px "${font}", "Noto Sans", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.save();
    ctx.beginPath(); ctx.arc(mid, mid, innerR, 0, Math.PI * 2); ctx.clip();
    ctx.fillText(text, mid, mid + (subText ? -fontSize * 0.7 : 0));
    if (subText) {
      ctx.font = `bold ${fontSize * 0.7}px "${font}", "Noto Sans", sans-serif`;
      ctx.fillText(subText, mid, mid + fontSize * 0.7);
    }
    ctx.restore();
  }

  ctx.shadowBlur = 0;

  // ── Sticker overlay ──
  if (sticker) {
    const sSize = size * 0.18;
    ctx.font = `${sSize}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(sticker, size * 0.82, size * 0.18);
  }
}

// ── Main component ────────────────────────────────────────────────────────
export default function AksharaNamaPage() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportRef  = useRef<HTMLCanvasElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const [langCode,    setLangCode]    = useState("tel");
  const [name,        setName]        = useState("మీ పేరు");
  const [subText,     setSubText]     = useState("");
  const [font,        setFont]        = useState(LANG_FONTS.tel[0]);
  const [pos,         setPos]         = useState("arc-bottom");
  const [textColor,   setTextColor]   = useState("#ffffff");
  const [ringColor,   setRingColor]   = useState("#000000");
  const [bgColor,     setBgColor]     = useState("#e2e8f0");
  const [frameId,     setFrameId]     = useState("plain");
  const [sizeId,      setSizeId]      = useState("post");
  const [sticker,     setSticker]     = useState("");
  const [zoom,        setZoom]        = useState(1.0);
  const [panX,        setPanX]        = useState(0);
  const [panY,        setPanY]        = useState(0);
  const [brightness,  setBrightness]  = useState(100);
  const [contrast,    setContrast]    = useState(100);
  const [userImg,     setUserImg]     = useState<HTMLImageElement | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);
  const [langSearch,  setLangSearch]  = useState("");
  const [showLangs,   setShowLangs]   = useState(false);
  const [tab,         setTab]         = useState<"indian"|"global">("indian");
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.querySelector("link[data-aksharanama-fonts]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = GFONTS;
      link.setAttribute("data-aksharanama-fonts", "1");
      document.head.appendChild(link);
    }
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === langCode) ?? LANGUAGES[0];
  const fonts       = LANG_FONTS[langCode] ?? LANG_FONTS.eng;
  const exportSize  = SIZES.find(s => s.id === sizeId) ?? SIZES[0];

  const redraw = useCallback(() => {
    const canvas = previewRef.current; if (!canvas) return;
    const ctx    = canvas.getContext("2d"); if (!ctx) return;
    drawBadge(ctx, 320, { userImg, zoom, panX, panY, text: name, subText, font, pos, textColor, frameId, ringColor, bgColor, sticker, brightness, contrast });
  }, [userImg, zoom, panX, panY, name, subText, font, pos, textColor, frameId, ringColor, bgColor, sticker, brightness, contrast]);

  useEffect(() => { document.fonts.ready.then(redraw); }, [redraw]);

  const handleLang = (code: string) => {
    const l = LANGUAGES.find(x => x.code === code);
    if (!l) return;
    setLangCode(code);
    setFont((LANG_FONTS[code] ?? LANG_FONTS.eng)[0]);
    setName(l.placeholder);
    setShowLangs(false);
  };

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => { setUserImg(img); setUploading(false); setZoom(1); setPanX(0); setPanY(0); };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = exportRef.current; if (!canvas) return;
    if (!userImg) { alert("Please upload a photo first!"); return; }
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    // Draw at actual export size with badge centered
    const S = Math.min(exportSize.w, exportSize.h);
    canvas.width  = exportSize.w;
    canvas.height = exportSize.h;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportSize.w, exportSize.h);
    const offX = (exportSize.w - S) / 2;
    const offY = (exportSize.h - S) / 2;
    ctx.save(); ctx.translate(offX, offY);
    drawBadge(ctx, S, { userImg, zoom, panX, panY, text: name, subText, font, pos, textColor, frameId, ringColor, bgColor, sticker, brightness, contrast });
    ctx.restore();
    const a = document.createElement("a");
    a.download = `aksharanama_${langCode}_${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png", 1.0);
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleReset = () => {
    setUserImg(null); setName(currentLang.placeholder); setSubText("");
    setZoom(1); setPanX(0); setPanY(0); setBrightness(100); setContrast(100);
    setTextColor("#ffffff"); setRingColor("#000000"); setBgColor("#e2e8f0");
    setFrameId("plain"); setSticker(""); setPos("arc-bottom");
  };

  // Auto-suggest text color based on ring color brightness
  const autoTextColor = () => {
    const r = parseInt(ringColor.slice(1,3),16);
    const g = parseInt(ringColor.slice(3,5),16);
    const b = parseInt(ringColor.slice(5,7),16);
    const lum = (0.299*r+0.587*g+0.114*b)/255;
    setTextColor(lum > 0.5 ? "#000000" : "#ffffff");
  };

  const filteredLangs = LANGUAGES.filter(l =>
    l.group === tab &&
    (langSearch === "" || l.label.toLowerCase().includes(langSearch.toLowerCase()) || l.native.toLowerCase().includes(langSearch.toLowerCase()))
  );

  if (!mounted) return null;

  return (
    <div className="is-f431735">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"/>
      <Navbar/>

      <div className="is-b8bc244">

        {/* ── Header ── */}
        <div className="is-7002f9c">
          <div className="is-651ca08">
            <div>
              <p className="is-cc18001">AKSHARANAMA</p>
              <h1 className="is-19891f7">Round Badge Studio</h1>
            </div>
            <div className="is-3e22b63">
              <span className="is-c813cd4">🔒 Offline</span>
              <span className="is-ae4aac3">{LANGUAGES.length}+ langs</span>
            </div>
          </div>
        </div>

        {/* ── Language selector ── */}
        <div className="is-833a7d6">
          <div className="is-dccc7be">
            <p className="is-0e99142">Language</p>
            <button onClick={() => setShowLangs(v=>!v)}
              className="is-33fbb76">
              {showLangs ? "Close ▲" : `Change (${currentLang.flag} ${currentLang.native}) ▼`}
            </button>
          </div>

          {!showLangs && (
            <div className="is-6881752">
              <span className="is-249bf02">{currentLang.flag}</span>
              <div>
                <div className="is-a7c264a">{currentLang.native}</div>
                <div className="is-93a6e04">{currentLang.label}</div>
              </div>
            </div>
          )}

          {showLangs && (
            <div>
              <input value={langSearch} onChange={e=>setLangSearch(e.target.value)}
                placeholder="Search language..."
                className="is-c29154a"
              />
              <div className="is-60f439a">
                {(["indian","global"] as const).map(t => (
                  <button key={t} onClick={()=>setTab(t)}
                    className="is-5a1ebea" style={{ background: tab===t?"#111":"#fff", color: tab===t?"#fff":"#374151", borderColor: tab===t?"#111":"#E5E7EB" }}>
                    {t==="indian"?"🇮🇳 Indian":"🌍 Global"}
                  </button>
                ))}
              </div>
              <div className="is-6810f38">
                {filteredLangs.map(l => (
                  <button key={l.code} onClick={()=>handleLang(l.code)}
                    className="is-5566ed3" style={{ background: langCode===l.code?"#EFF6FF":"#fff", borderColor: langCode===l.code?"#3B82F6":"#E5E7EB" }}>
                    <div className="is-b757129">{l.flag}</div>
                    <div className="is-fe738ee" style={{ color: langCode===l.code?"#1D4ED8":"#111", lineHeight:1.2 }}>{l.native}</div>
                    <div className="is-b96e8ef">{l.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Preview canvas ── */}
        <div className="is-65ab07d">
          <div className="is-a3f98c3">
            <canvas ref={previewRef} width={320} height={320} className="is-bc1c853"/>
            {uploading && (
              <div className="is-a040ff0">⏳</div>
            )}
          </div>

          {/* Zoom + Pan */}
          <div className="is-199b6f0">
            <div className="is-952640c">
              <span className="is-d0ccc10">Zoom</span>
              <span className="is-6c209a7">{zoom.toFixed(2)}×</span>
            </div>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e=>setZoom(Number(e.target.value))}
              className="is-19268ef"/>
          </div>

          <div className="is-299ed7f">
            <div>
              <div className="is-952640c">
                <span className="is-d0ccc10">Pan X</span>
                <span className="is-6c209a7">{panX.toFixed(1)}</span>
              </div>
              <input type="range" min={-1} max={1} step={0.05} value={panX} onChange={e=>setPanX(Number(e.target.value))}
                className="is-19268ef"/>
            </div>
            <div>
              <div className="is-952640c">
                <span className="is-d0ccc10">Pan Y</span>
                <span className="is-6c209a7">{panY.toFixed(1)}</span>
              </div>
              <input type="range" min={-1} max={1} step={0.05} value={panY} onChange={e=>setPanY(Number(e.target.value))}
                className="is-19268ef"/>
            </div>
          </div>
        </div>

        {/* ── Photo upload ── */}
        <div className="is-833a7d6">
          <p className="is-ba325c9">1 · Photo</p>
          <button onClick={()=>fileRef.current?.click()}
            className="is-0ad3a60" style={{ border:`1.5px dashed ${userImg?"#22C55E":"#D1D5DB"}`, background: userImg?"#F0FDF4":"#FAFAFA", color: userImg?"#15803D":"#9CA3AF", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", minHeight:52 }}>
            {userImg ? "✅ Photo loaded — tap to change" : "📁 Choose photo from device"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage}/>

          {/* AI Brightness / Contrast */}
          {userImg && (
            <div className="is-cc6ea4f">
              <div>
                <div className="is-952640c">
                  <span className="is-d0ccc10">☀️ Bright</span>
                  <span className="is-c441868">{brightness}%</span>
                </div>
                <input type="range" min={50} max={150} step={5} value={brightness} onChange={e=>setBrightness(Number(e.target.value))}
                  className="is-667cd01"/>
              </div>
              <div>
                <div className="is-952640c">
                  <span className="is-d0ccc10">🎨 Contrast</span>
                  <span className="is-c441868">{contrast}%</span>
                </div>
                <input type="range" min={50} max={150} step={5} value={contrast} onChange={e=>setContrast(Number(e.target.value))}
                  className="is-556ac21"/>
              </div>
            </div>
          )}
        </div>

        {/* ── Text ── */}
        <div className="is-833a7d6">
          <p className="is-08211db">2 · Name / Text</p>
          <input value={name} onChange={e=>setName(e.target.value)}
            dir={currentLang.dir}
            placeholder={currentLang.placeholder}
            className="is-df10fbc" style={{ fontFamily:`'${font}','Noto Sans',sans-serif`, color:"#111", marginBottom:8, boxSizing:"border-box" }}
          />
          <input value={subText} onChange={e=>setSubText(e.target.value)}
            dir={currentLang.dir}
            placeholder="Sub text (optional — role, title...)"
            className="is-88dd4b9" style={{ fontFamily:`'${font}','Noto Sans',sans-serif`, color:"#111", boxSizing:"border-box" }}
          />
        </div>

        {/* ── Font + Position ── */}
        <div className="is-833a7d6">
          <p className="is-08211db">3 · Font & Position</p>
          <div className="is-bb5ff47">
            <div>
              <p className="is-81465d3">Font</p>
              <select value={font} onChange={e=>setFont(e.target.value)}
                className="is-06b5af5" style={{ fontFamily:`'${font}','Noto Sans',sans-serif`, background:"#fff", color:"#111", outline:"none" }}>
                {fonts.map(f=><option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}
              </select>
            </div>
            <div>
              <p className="is-81465d3">Position</p>
              <select value={pos} onChange={e=>setPos(e.target.value)}
                className="is-1d16566">
                {POSITIONS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Frame style ── */}
        <div className="is-833a7d6">
          <p className="is-08211db">4 · Frame Style</p>
          <div className="is-eea200f">
            {FRAMES.map(f=>(
              <button key={f.id} onClick={()=>{setFrameId(f.id); if(f.ringColor!=="gradient") setRingColor(f.ringColor);}}
                className="is-3f3f980" style={{ background: frameId===f.id?"#111":"#F9FAFB", color: frameId===f.id?"#fff":"#374151", border:`1.5px solid ${frameId===f.id?"#111":"#E5E7EB"}` }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Colors ── */}
        <div className="is-833a7d6">
          <p className="is-08211db">5 · Colors</p>
          <div className="is-98a2729">
            {[
              { label:"Text",  val:textColor, set:setTextColor  },
              { label:"Ring",  val:ringColor, set:setRingColor  },
              { label:"BG",    val:bgColor,   set:setBgColor    },
            ].map(c=>(
              <div key={c.label}>
                <p className="is-81465d3">{c.label}</p>
                <label className="is-7f417a0">
                  <div className="is-7eb8927" style={{ background:c.val, border:"1.5px solid #E5E7EB", flexShrink:0 }}/>
                  <span className="is-5e7716a">{c.val.toUpperCase()}</span>
                  <input type="color" value={c.val} onChange={e=>c.set(e.target.value)} className="is-2de6e5e"/>
                </label>
              </div>
            ))}
          </div>
          <button onClick={autoTextColor}
            className="is-611350f">
            ✨ Auto Text Color
          </button>
        </div>

        {/* ── Stickers ── */}
        <div className="is-833a7d6">
          <p className="is-08211db">6 · Sticker Overlay</p>
          <div className="is-e8afafb">
            {STICKERS.map(s=>(
              <button key={s||"none"} onClick={()=>setSticker(s)}
                className="is-c3cb108" style={{ fontSize:s?20:12, border:`1.5px solid ${sticker===s?"#111":"#E5E7EB"}`, background: sticker===s?"#111":"#F9FAFB", cursor:"pointer", color: sticker===s&&!s?"#fff":"#374151", fontWeight:!s?600:400 }}>
                {s||"✕"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Export size ── */}
        <div className="is-3eae388">
          <p className="is-08211db">7 · Export Size</p>
          <div className="is-56d3042">
            {SIZES.map(s=>(
              <button key={s.id} onClick={()=>setSizeId(s.id)}
                className="is-dc0564c" style={{ background: sizeId===s.id?"#111":"#F9FAFB", color: sizeId===s.id?"#fff":"#374151", border:`1.5px solid ${sizeId===s.id?"#111":"#E5E7EB"}` }}>
                <div className="is-eb8da30">{s.icon}</div>
                <div>{s.label}</div>
                <div className="is-7a489ba">{s.w}×{s.h}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="is-e4b1745">
          <button onClick={handleDownload}
            className="is-0699e6f" style={{ background: downloaded?"#16A34A":"#111", color:"#fff", border:"none", minHeight:56, transition:"all 0.2s", boxShadow: downloaded?"0 4px 20px rgba(22,163,74,0.3)":"0 4px 20px rgba(0,0,0,0.2)" }}>
            {downloaded ? "✅ Saved to device!" : "⬇️ Download PNG — " + exportSize.w + "×" + exportSize.h}
          </button>
          <div className="is-bb5ff47">
            <button onClick={handleReset}
              className="is-fce90a2">
              🔄 Reset All
            </button>
            <button onClick={()=>alert("Download PNG first, then share to WhatsApp status!")}
              className="is-11f5459">
              📲 WhatsApp
            </button>
          </div>
        </div>

        <p className="is-0a88582">
          {currentLang.native} · {font} · {exportSize.w}×{exportSize.h} HD · 100% offline
        </p>
      </div>

      <canvas ref={exportRef} width={exportSize.w} height={exportSize.h} className="is-224b51a"/>
    </div>
  );
}

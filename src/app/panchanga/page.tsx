"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const PanchangaCard = dynamic(
  () => import("@/components/PanchangaCard").then((mod) => mod.PanchangaCard),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);

const LANGUAGES = [
  { code: "te", label: "తెలుగు",  english: "Telugu",    flag: "🔱" },
  { code: "hi", label: "हिन्दी",   english: "Hindi",     flag: "🪷" },
  { code: "ta", label: "தமிழ்",   english: "Tamil",     flag: "🌺" },
  { code: "kn", label: "ಕನ್ನಡ",   english: "Kannada",   flag: "🌸" },
  { code: "ml", label: "മലയാളം",  english: "Malayalam", flag: "🌴" },
  { code: "mr", label: "मराठी",   english: "Marathi",   flag: "🏵️" },
  { code: "en", label: "English", english: "English",   flag: "📖" },
];

const DEFAULT_LOC = { lat: 17.385, lng: 78.486, city: "Hyderabad" };

function CalendarSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-2 py-4 space-y-4 animate-pulse">
      <div className="h-36 rounded-3xl bg-amber-100" />
      <div className="flex gap-2">{[...Array(5)].map((_,i)=><div key={i} className="h-7 w-16 rounded-full bg-gray-100"/>)}</div>
      <div className="h-96 rounded-3xl bg-gray-50" />
      <div className="h-32 rounded-3xl bg-gray-50" />
    </div>
  );
}

function LanguagePicker({ onSelect }: { onSelect: (code: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,#431407 0%,#7c2d12 40%,#c2410c 80%,#d97706 100%)" }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle,#fef9c3,transparent)", filter: "blur(80px)", transform: "translate(30%,-30%)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle,#fde68a,transparent)", filter: "blur(60px)", transform: "translate(-30%,30%)" }} />
      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="text-7xl">🪔</div>
          <div>
            <h1 className="text-white font-black text-4xl tracking-tight"
              style={{ fontFamily: "'Noto Sans Telugu', sans-serif", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
              పంచాంగం
            </h1>
            <p className="text-amber-300 text-sm font-semibold mt-1 tracking-widest uppercase">
              AksharaTantra · Hindu Calendar
            </p>
          </div>
          <p className="text-amber-200/70 text-xs">మీ భాషను ఎంచుకోండి · Choose your language</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <button key={lang.code} onClick={() => onSelect(lang.code)}
              className="group relative rounded-2xl px-4 py-4 text-left transition-all duration-200 hover:scale-[1.03] active:scale-95"
              style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div className="text-2xl mb-1">{lang.flag}</div>
              <div className="text-white font-black text-lg leading-tight"
                style={{ fontFamily: "'Noto Sans Telugu', sans-serif" }}>{lang.label}</div>
              <div className="text-amber-300/70 text-xs">{lang.english}</div>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(255,255,255,0.05)" }} />
            </button>
          ))}
        </div>
        <p className="text-center text-amber-200/40 text-xs">🔒 No data stored · Fully offline · Privacy first</p>
      </div>
    </div>
  );
}

const CHANGE_LABEL: Record<string, string> = {
  te: "భాష మార్చు ↩", hi: "भाषा बदलें ↩", ta: "மொழி மாற்று ↩",
  kn: "ಭಾಷೆ ಬದಲಿಸಿ ↩", ml: "ഭാഷ മാറ്റുക ↩", mr: "भाषा बदला ↩", en: "Change Language ↩",
};

export default function PanchangaPage() {
  const [lang,     setLang]     = useState<string | null>(null);
  const [location, setLocation] = useState(DEFAULT_LOC);
  const [locCity,  setLocCity]  = useState("Hyderabad");

  useEffect(() => {
    try { const s = sessionStorage.getItem("panchanga_lang"); if (s) setLang(s); } catch {}
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          let city = `${lat.toFixed(1)}°N`;
          try {
            const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await res.json();
            city = data.address?.city || data.address?.town || data.address?.village || city;
          } catch {}
          setLocation({ lat, lng, city }); setLocCity(city);
        },
        () => {},
        { timeout: 8000, maximumAge: 600000 }
      );
    }
  }, []);

  function handleLangSelect(code: string) {
    try { sessionStorage.setItem("panchanga_lang", code); } catch {}
    setLang(code);
  }
  function handleChangeLang() {
    try { sessionStorage.removeItem("panchanga_lang"); } catch {}
    setLang(null);
  }

  if (!lang) return <LanguagePicker onSelect={handleLangSelect} />;

  const selectedLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="min-h-screen" style={{ background: "#fef9f0" }}>
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-2"
        style={{ background: "rgba(254,249,240,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedLang.flag}</span>
          <span className="font-black text-amber-900 text-sm"
            style={{ fontFamily: "'Noto Sans Telugu', sans-serif" }}>{selectedLang.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            📍 {locCity}
          </span>
          <button onClick={handleChangeLang}
            className="text-xs text-slate-400 hover:text-amber-700 transition font-medium">
            {CHANGE_LABEL[lang] ?? "Change ↩"}
          </button>
        </div>
      </div>
      {/* ✅ lang prop passed to PanchangaCard */}
      <PanchangaCard location={location} lang={lang} />
    </div>
  );
}
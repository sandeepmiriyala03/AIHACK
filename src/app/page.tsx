"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

// ─── Icons (MUI) ────────────────────────────────────────────────────────────
import RocketLaunchIcon       from "@mui/icons-material/RocketLaunch";
import VolumeUpIcon           from "@mui/icons-material/VolumeUp";
import StopCircleIcon         from "@mui/icons-material/StopCircle";
import ArticleIcon            from "@mui/icons-material/Article";
import GestureIcon            from "@mui/icons-material/Gesture";
import GraphicEqIcon          from "@mui/icons-material/GraphicEq";
import LibraryBooksIcon       from "@mui/icons-material/LibraryBooks";
import MicIcon                from "@mui/icons-material/Mic";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import AutoStoriesIcon        from "@mui/icons-material/AutoStories";
import CalendarMonthIcon      from "@mui/icons-material/CalendarMonth";
import ImageSearchIcon        from "@mui/icons-material/ImageSearch";
import DrawIcon               from "@mui/icons-material/Draw";
import WbSunnyIcon            from "@mui/icons-material/WbSunny";
import CloudIcon              from "@mui/icons-material/Cloud";
import ThunderstormIcon       from "@mui/icons-material/Thunderstorm";
import AcUnitIcon             from "@mui/icons-material/AcUnit";
import OpacityIcon            from "@mui/icons-material/Opacity";
import AccessTimeIcon         from "@mui/icons-material/AccessTime";
import LocationOnIcon         from "@mui/icons-material/LocationOn";
import RecordVoiceOverIcon    from "@mui/icons-material/RecordVoiceOver";
import EmojiEventsIcon        from "@mui/icons-material/EmojiEvents";
import ChevronRightIcon       from "@mui/icons-material/ChevronRight";
import CheckCircleIcon        from "@mui/icons-material/CheckCircle";

// ─── Types ───────────────────────────────────────────────────────────────────
interface WeatherData {
  temp: number; feels: number; desc: string; icon: string;
  city: string; humidity: number; wind: number;
}

// ─── Weather icon resolver ────────────────────────────────────────────────────
function WeatherIcon({ code, size = 22 }: { code: string; size?: number }) {
  const s = { fontSize: size, verticalAlign: "middle" };
  if (code.startsWith("01")) return <WbSunnyIcon style={{ ...s, color: "#f59e0b" }} />;
  if (code.startsWith("02") || code.startsWith("03") || code.startsWith("04"))
    return <CloudIcon style={{ ...s, color: "#94a3b8" }} />;
  if (code.startsWith("09") || code.startsWith("10")) return <OpacityIcon style={{ ...s, color: "#3b82f6" }} />;
  if (code.startsWith("11")) return <ThunderstormIcon style={{ ...s, color: "#7c3aed" }} />;
  if (code.startsWith("13")) return <AcUnitIcon style={{ ...s, color: "#93c5fd" }} />;
  return <WbSunnyIcon style={{ ...s, color: "#f59e0b" }} />;
}

// ─── Clock ───────────────────────────────────────────────────────────────────
function LiveClock({ timezone }: { timezone?: string }) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const opts: Intl.DateTimeFormatOptions = {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        ...(timezone ? { timeZone: timezone } : {}),
      };
      const dateOpts: Intl.DateTimeFormatOptions = {
        weekday: "short", day: "numeric", month: "short",
        ...(timezone ? { timeZone: timezone } : {}),
      };
      setTime(new Intl.DateTimeFormat("en-IN", opts).format(now));
      setDate(new Intl.DateTimeFormat("en-IN", dateOpts).format(now));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);
  return <>{time}<span style={{ fontSize: 11, opacity: 0.65, marginLeft: 6 }}>{date}</span></>;
}

// ─── Weather widget (top-right) ───────────────────────────────────────────────
function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=bd5e378503939ddaee76f12ad7a97608&units=metric`
          );
          const d = await res.json();
          setWeather({
            temp: Math.round(d.main.temp),
            feels: Math.round(d.main.feels_like),
            desc: d.weather[0].description,
            icon: d.weather[0].icon,
            city: d.name,
            humidity: d.main.humidity,
            wind: Math.round(d.wind.speed),
          });
          // Rough timezone from offset
          const offset = d.timezone;
          const hrs = Math.floor(Math.abs(offset) / 3600);
          const mins = Math.floor((Math.abs(offset) % 3600) / 60);
          const sign = offset >= 0 ? "+" : "-";
          setTimezone(`Etc/GMT${sign === "+" ? "-" : "+"}${hrs}${mins > 0 ? `:${mins}` : ""}`);
        } catch { /* silent */ }
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 16px", background: "rgba(255,255,255,0.85)",
      border: "1px solid #e5e7eb", borderRadius: 99,
      backdropFilter: "blur(12px)",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      fontSize: 13, color: "#374151", fontFamily: "'DM Sans',sans-serif",
      flexWrap: "wrap", rowGap: 4,
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#059669", fontWeight: 600, fontSize: 13 }}>
        <AccessTimeIcon style={{ fontSize: 15 }} />
        <LiveClock timezone={timezone} />
      </span>
      <span style={{ width: 1, height: 16, background: "#e5e7eb" }} />
      {loading ? (
        <span style={{ color: "#9ca3af", fontSize: 12 }}>Locating…</span>
      ) : weather ? (
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <LocationOnIcon style={{ fontSize: 13, color: "#9ca3af" }} />
          <span style={{ fontWeight: 600 }}>{weather.city}</span>
          <WeatherIcon code={weather.icon} size={18} />
          <span style={{ fontWeight: 700, color: "#111" }}>{weather.temp}°C</span>
          <span style={{ color: "#9ca3af", fontSize: 11 }}>{weather.desc}</span>
        </span>
      ) : (
        <span style={{ color: "#9ca3af", fontSize: 12 }}>No location</span>
      )}
    </div>
  );
}

// ─── Speech welcome ───────────────────────────────────────────────────────────
function SpeechWelcome() {
  const [spoken, setSpoken] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const greet = () => {
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const msg = new SpeechSynthesisUtterance(
      `${greeting}! Welcome to AksharaTantra — your offline AI platform for Indic language digitization. Explore OCR, handwriting recognition, the Vedha digitizer, multilingual poster maker, and more — all running right here in your browser, with no internet needed.`
    );
    msg.lang = "en-IN";
    msg.rate = 0.92;
    msg.pitch = 1.05;
    msg.onend = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    setSpeaking(true);
    setSpoken(true);
  };

  const stop = () => { speechSynthesis.cancel(); setSpeaking(false); };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "10px 20px", background: speaking ? "rgba(16,185,129,0.08)" : "#f9fafb",
      border: `1.5px solid ${speaking ? "rgba(16,185,129,0.35)" : "#e5e7eb"}`,
      borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
      fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#374151",
    }}
      onClick={speaking ? stop : greet}
    >
      {speaking ? (
        <>
          <span style={{
            display: "flex", gap: 2, alignItems: "center",
          }}>
            {[0,1,2,3].map(i => (
              <span key={i} style={{
                width: 3, borderRadius: 99, background: "#10b981",
                animation: `soundbar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                display: "inline-block",
              }} />
            ))}
          </span>
          <StopCircleIcon style={{ fontSize: 16, color: "#10b981" }} />
          <span style={{ fontWeight: 600, color: "#059669" }}>Speaking… tap to stop</span>
        </>
      ) : (
        <>
          <RecordVoiceOverIcon style={{ fontSize: 16, color: spoken ? "#10b981" : "#9ca3af" }} />
          <span style={{ fontWeight: 500 }}>
            {spoken ? "Play welcome again" : "🔊 Hear a welcome message"}
          </span>
        </>
      )}
      <style>{`
        @keyframes soundbar {
          from { height: 4px; }
          to   { height: 18px; }
        }
      `}</style>
    </div>
  );
}

// ─── Module definitions ───────────────────────────────────────────────────────
const MODULES = [
  {
    href: "/OCR",
    icon: <ArticleIcon style={{ fontSize: 28 }} />,
    color: "#10b981",
    bg: "#f0fdf4",
    label: "OCR Engine",
    tagline: "Read text from any image",
    desc: "Upload a photo of a book, document, or signboard. Get the text out — in 34+ languages including Telugu, Hindi, Sanskrit and more.",
    bullets: ["34+ languages", "Works offline", "Export as PDF / image"],
    badge: null,
  },
  {
    href: "/aksharadrishti",
    icon: <ImageSearchIcon style={{ fontSize: 28 }} />,
    color: "#6366f1",
    bg: "#eef2ff",
    label: "AksharaDrishti",
    tagline: "Multilingual image OCR",
    desc: "Combine English with any Indic or global script in one scan. Perfect for bilingual documents like Panchanga posters.",
    bullets: ["English + any language", "Noto font output", "Download as PNG"],
    badge: null,
  },
  {
    href: "/ocreng",
    icon: <GestureIcon style={{ fontSize: 28 }} />,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    label: "HTR Indic",
    tagline: "Handwriting recognition",
    desc: "Recognise handwritten text in Devanagari, Telugu, Tamil and other Indic scripts using transformer-powered AI models.",
    bullets: ["Handwritten scripts", "TrOCR models", "Indic-first"],
    badge: null,
  },
  {
    href: "/Ocrwork",
    icon: <LibraryBooksIcon style={{ fontSize: 28 }} />,
    color: "#f59e0b",
    bg: "#fffbeb",
    label: "RajaTantra",
    tagline: "Bulk book digitization",
    desc: "Process entire scanned books page by page. Upload multi-page archives and get structured text output ready for publishing.",
    bullets: ["Multi-page processing", "Archive-grade output", "Chapter detection"],
    badge: null,
  },
  {
    href: "/voice",
    icon: <MicIcon style={{ fontSize: 28 }} />,
    color: "#ec4899",
    bg: "#fdf2f8",
    label: "Voice & Media",
    tagline: "Text-to-speech AI",
    desc: "Convert any text to natural-sounding audio in 30+ languages. No cloud, no API key — runs entirely in your browser.",
    bullets: ["30+ language voices", "Offline TTS", "Audio download"],
    badge: null,
  },
  {
    href: "/vedha",
    icon: <AutoStoriesIcon style={{ fontSize: 28 }} />,
    color: "#7c3aed",
    bg: "#f5f3ff",
    label: "Vedha",
    tagline: "Vedic text digitizer",
    desc: "OCR for Sanskrit and Vedic manuscripts. Automatically marks Udātta, Anudātta and Svarita pitch accents. Exports as styled HTML books.",
    bullets: ["Pitch accent marking", "Sanskrit-first", "HTML book export"],
    badge: "NEW",
  },
  {
    href: "/posters",
    icon: <DashboardCustomizeIcon style={{ fontSize: 28 }} />,
    color: "#0ea5e9",
    bg: "#f0f9ff",
    label: "Poster Maker",
    tagline: "Multilingual design tool",
    desc: "Design beautiful posters in 40+ languages. Add custom fonts, QR codes, voice input and download in print quality.",
    bullets: ["40+ languages", "QR code + voice", "Print-ready download"],
    badge: "NEW",
  },
  {
    href: "/Sanskrit",
    icon: <DrawIcon style={{ fontSize: 28 }} />,
    color: "#059669",
    bg: "#f0fdf4",
    label: "यथाक्षरं",
    tagline: "Sanskrit learning tool",
    desc: "Character-by-character Sanskrit reader with transliteration, meanings and audio pronunciation for every akshara.",
    bullets: ["Transliteration", "Audio pronunciation", "Akshara-by-akshara"],
    badge: null,
  },
  {
    href: "/calendar",
    icon: <CalendarMonthIcon style={{ fontSize: 28 }} />,
    color: "#64748b",
    bg: "#f8fafc",
    label: "Personal Calendar",
    tagline: "Schedule & Panchanga",
    desc: "Your personal planner with Panchanga integration — see Tithi, Nakshatra and auspicious timings alongside your own events.",
    bullets: ["Panchanga overlay", "Personal events", "Offline-first"],
    badge: "NEW",
  },
];

// ─── Module card ──────────────────────────────────────────────────────────────
function ModuleCard({ m }: { m: typeof MODULES[0] }) {
  return (
    <Link href={m.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <article style={{
        height: "100%", display: "flex", flexDirection: "column",
        background: "#fff", border: "1.5px solid #f1f5f9",
        borderRadius: 20, padding: "24px 22px",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        position: "relative", overflow: "hidden", cursor: "pointer",
      }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.borderColor = m.color + "60";
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = `0 16px 40px ${m.color}18, 0 4px 12px rgba(0,0,0,0.06)`;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.borderColor = "#f1f5f9";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {m.badge && (
          <span style={{
            position: "absolute", top: 14, right: 14,
            background: m.color, color: "#fff",
            fontSize: 9, fontWeight: 800, padding: "3px 8px",
            borderRadius: 99, letterSpacing: "0.08em",
            fontFamily: "'DM Sans',sans-serif",
          }}>{m.badge}</span>
        )}

        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: m.bg, display: "flex", alignItems: "center",
          justifyContent: "center", color: m.color, marginBottom: 16, flexShrink: 0,
        }}>
          {m.icon}
        </div>

        {/* Title block */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", fontFamily: "'Syne',sans-serif", lineHeight: 1.2 }}>
            {m.label}
          </div>
          <div style={{ fontSize: 12, color: m.color, fontWeight: 600, marginTop: 3, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {m.tagline}
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif", marginBottom: 16, flex: 1 }}>
          {m.desc}
        </p>

        {/* Bullets */}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 5 }}>
          {m.bullets.map(b => (
            <li key={b} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans',sans-serif" }}>
              <CheckCircleIcon style={{ fontSize: 13, color: m.color, opacity: 0.8 }} /> {b}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 700, color: m.color, fontFamily: "'DM Sans',sans-serif",
          borderTop: "1px solid #f1f5f9", paddingTop: 14,
        }}>
          Open {m.label} <ChevronRightIcon style={{ fontSize: 16 }} />
        </div>
      </article>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&family=Noto+Serif+Telugu:wght@400;700&family=Noto+Serif+Devanagari:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #10b981;
          --ink: #0f172a;
          --muted: #64748b;
          --border: #f1f5f9;
          --bg: #fafaf9;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

        .page-wrap { position: relative; min-height: 100vh; }

        /* weather bar */
        .weather-bar {
          position: fixed; top: 72px; right: 20px; z-index: 900;
          animation: slideIn 0.6s ease 0.4s both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* hero */
        .hero {
          max-width: 1180px; margin: 0 auto;
          padding: clamp(80px,12vw,120px) clamp(20px,5vw,60px) clamp(48px,8vw,80px);
          display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
        }
        @media(max-width: 860px) { .hero { grid-template-columns: 1fr; gap: 40px; text-align: center; } }

        .hero-script-bg {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          font-family: 'Noto Serif Telugu', serif; font-size: clamp(120px,22vw,260px);
          font-weight: 700; color: transparent;
          -webkit-text-stroke: 1px rgba(16,185,129,0.07);
          pointer-events: none; user-select: none; white-space: nowrap;
          z-index: 0;
        }

        .hero-left { position: relative; z-index: 1; }
        .hero-right { position: relative; z-index: 1; }

        /* badge strip */
        .badge-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        @media(max-width:860px) { .badge-strip { justify-content: center; } }
        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 99px;
          font-size: 11px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .badge-green { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.25); }
        .badge-blue  { background: rgba(37,99,235,0.08); color: #1d4ed8; border: 1px solid rgba(37,99,235,0.2); }

        /* stat cards */
        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        .stat-card {
          background: #fff; border: 1.5px solid #f1f5f9; border-radius: 16px;
          padding: 16px 18px; text-align: center;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: rgba(16,185,129,0.3); }
        .stat-num { font-size: 32px; font-weight: 800; color: #10b981; font-family: 'Syne',sans-serif; line-height: 1; }
        .stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

        /* section */
        .section { max-width: 1180px; margin: 0 auto; padding: 0 clamp(20px,5vw,60px) clamp(60px,8vw,100px); }
        .section-label {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase;
          letter-spacing: 0.12em; margin-bottom: 10px; font-family: 'DM Sans',sans-serif;
        }
        .section-label::before { content: ''; width: 24px; height: 2px; background: #10b981; border-radius: 99px; }
        .section-title {
          font-family: 'Syne',sans-serif;
          font-size: clamp(24px,4vw,42px); font-weight: 800;
          color: #0f172a; line-height: 1.1; margin-bottom: 10px;
        }
        .section-sub { font-size: 16px; color: #64748b; line-height: 1.7; max-width: 560px; margin-bottom: 44px; }

        /* module grid */
        .module-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media(max-width:1024px) { .module-grid { grid-template-columns: repeat(2,1fr); } }
        @media(max-width:600px)  { .module-grid { grid-template-columns: 1fr; } }

        /* category divider */
        .cat-divider {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 20px; margin-top: 40px;
        }
        .cat-divider-line { flex: 1; height: 1px; background: #f1f5f9; }
        .cat-divider-label {
          font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;
          letter-spacing: 0.12em; font-family: 'DM Sans',sans-serif; white-space: nowrap;
        }

        /* privacy strip */
        .privacy-strip {
          background: linear-gradient(135deg, #f0fdf4 0%, #fafaf9 100%);
          border-top: 1px solid rgba(16,185,129,0.12);
          border-bottom: 1px solid rgba(16,185,129,0.12);
          padding: clamp(28px,4vw,48px) clamp(20px,5vw,60px);
          display: flex; align-items: center; justify-content: center;
          gap: clamp(16px,3vw,40px); flex-wrap: wrap;
        }
        .privacy-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; font-family: 'DM Sans',sans-serif; }
        .privacy-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0; }

        /* final CTA */
        .cta-section {
          text-align: center; padding: clamp(48px,8vw,100px) clamp(20px,5vw,60px);
          background: #0f172a; position: relative; overflow: hidden;
        }
        .cta-glow {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%,-50%);
          pointer-events: none;
        }

        /* buttons */
        .btn-cta {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 16px 36px; background: #10b981; color: #fff;
          border: none; border-radius: 14px; font-family: 'DM Sans',sans-serif;
          font-size: 16px; font-weight: 700; text-decoration: none; cursor: pointer;
          transition: all 0.2s; letter-spacing: -0.01em;
        }
        .btn-cta:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(16,185,129,0.35); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; background: transparent; color: #10b981;
          border: 1.5px solid rgba(16,185,129,0.4); border-radius: 14px;
          font-family: 'DM Sans',sans-serif; font-size: 15px; font-weight: 600;
          text-decoration: none; cursor: pointer; transition: all 0.2s;
        }
        .btn-outline:hover { background: rgba(16,185,129,0.08); border-color: #10b981; }

        @media(max-width:640px) {
          .weather-bar { top: auto; bottom: 80px; right: 12px; }
          .hero { padding-top: 90px; }
        }
      `}</style>

      <Navbar />

      {/* Weather + Clock (fixed top right) */}
      <div className="weather-bar">
        <WeatherWidget />
      </div>

      <main className="page-wrap">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden", background: "#fafaf9" }}>
          <div className="hero-script-bg">अक्षर</div>

          <div className="hero">
            {/* Left */}
            <div className="hero-left">
              <div className="badge-strip">
                <span className="badge badge-green">
                  <EmojiEventsIcon style={{ fontSize: 12 }} /> Bhashini Hackathon 2026
                </span>
                <span className="badge badge-blue">
                  🌍 UN Open Source Week 2026
                </span>
              </div>

              <h1 style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: "clamp(48px,8vw,88px)",
                fontWeight: 900, lineHeight: 0.95,
                letterSpacing: "-0.04em", color: "#0f172a",
                marginBottom: 20,
              }}>
                Akshara<br />
                <span style={{ color: "#10b981" }}>Tantra</span>
              </h1>

              <p style={{
                fontSize: "clamp(15px,2vw,18px)", color: "#64748b",
                lineHeight: 1.7, maxWidth: 480, marginBottom: 28,
                fontFamily: "'DM Sans',sans-serif",
              }}>
                An offline AI platform that reads, digitizes, and speaks Indic languages — from ancient Sanskrit manuscripts to modern bilingual documents. Everything runs in your browser. No cloud, no account, no cost.
              </p>

              {/* Speech welcome */}
              <div style={{ marginBottom: 28 }}>
                <SpeechWelcome />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/upload" className="btn-cta">
                  <RocketLaunchIcon style={{ fontSize: 18 }} /> Launch Platform
                </Link>
                <button className="btn-outline"
                  onClick={() => { const el = document.getElementById("modules"); el?.scrollIntoView({ behavior: "smooth" }); }}>
                  Explore modules ↓
                </button>
              </div>
            </div>

            {/* Right – stat cards */}
            <div className="hero-right">
              <div className="stat-grid">
                {[
                  { n: "9", s: "+", lbl: "AI Modules" },
                  { n: "34", s: "+", lbl: "Languages" },
                  { n: "100", s: "%", lbl: "Offline" },
                  { n: "0", s: "", lbl: "API Keys Needed" },
                ].map(s => (
                  <div key={s.lbl} className="stat-card">
                    <div className="stat-num">{s.n}<span style={{ fontSize: 22 }}>{s.s}</span></div>
                    <div className="stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Quick-access chips */}
              <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["OCR", "Handwriting", "Poster Maker", "Vedha", "Calendar", "Speech"].map(t => (
                  <span key={t} style={{
                    padding: "5px 14px", borderRadius: 99, background: "#fff",
                    border: "1.5px solid #f1f5f9", fontSize: 12, color: "#64748b",
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Privacy strip ──────────────────────────────────────────────── */}
        <div className="privacy-strip">
          {[
            "100% Offline — no internet after load",
            "No account or login needed",
            "Zero data upload",
            "Free & open source",
            "Works on mobile",
          ].map(item => (
            <div key={item} className="privacy-item">
              <div className="privacy-dot" /> {item}
            </div>
          ))}
        </div>

        {/* ── MODULES ────────────────────────────────────────────────────── */}
        <section id="modules" className="section" style={{ paddingTop: "clamp(60px,8vw,100px)" }}>
          <div className="section-label">What you can do</div>
          <h2 className="section-title">Pick a module, start instantly</h2>
          <p className="section-sub">
            Each module is a standalone tool. Click any card to open it directly — no setup, no loading screens.
          </p>

          {/* Text / OCR group */}
          <div className="cat-divider" style={{ marginTop: 0 }}>
            <div className="cat-divider-label">Reading & digitizing text</div>
            <div className="cat-divider-line" />
          </div>
          <div className="module-grid">
            {MODULES.slice(0, 4).map(m => <ModuleCard key={m.href} m={m} />)}
          </div>

          {/* Creation / production group */}
          <div className="cat-divider">
            <div className="cat-divider-label">Creating & publishing</div>
            <div className="cat-divider-line" />
          </div>
          <div className="module-grid">
            {MODULES.slice(4, 7).map(m => <ModuleCard key={m.href} m={m} />)}
          </div>

          {/* Tools group */}
          <div className="cat-divider">
            <div className="cat-divider-label">Learning & planning</div>
            <div className="cat-divider-line" />
          </div>
          <div className="module-grid">
            {MODULES.slice(7).map(m => <ModuleCard key={m.href} m={m} />)}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="cta-section">
          <div className="cta-glow" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span className="badge badge-green" style={{ marginBottom: 20, display: "inline-flex" }}>
              <RocketLaunchIcon style={{ fontSize: 12 }} /> Ready to begin?
            </span>
            <h2 style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: "clamp(28px,5vw,60px)", fontWeight: 900,
              color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1,
              marginBottom: 16,
            }}>
              Start using AksharaTantra
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 36, fontFamily: "'DM Sans',sans-serif" }}>
              No account. No internet after first load. Just open and use.
            </p>
            <Link href="/upload" className="btn-cta" style={{ fontSize: 17, padding: "18px 44px" }}>
              <RocketLaunchIcon style={{ fontSize: 20 }} /> Launch Platform
            </Link>
          </div>
        </section>

      </main>

      <GoToTopButton />
    </>
  );
}

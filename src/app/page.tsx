"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── MUI Icons ────────────────────────────────────────────────────────────────
import UploadFileRoundedIcon        from "@mui/icons-material/UploadFileRounded";
import DocumentScannerRoundedIcon   from "@mui/icons-material/DocumentScannerRounded";
import DrawRoundedIcon              from "@mui/icons-material/DrawRounded";
import HistoryEduRoundedIcon        from "@mui/icons-material/HistoryEduRounded";
import MenuBookRoundedIcon          from "@mui/icons-material/MenuBookRounded";
import CollectionsRoundedIcon       from "@mui/icons-material/CollectionsRounded";
import MicRoundedIcon               from "@mui/icons-material/MicRounded";
import AutoStoriesRoundedIcon       from "@mui/icons-material/AutoStoriesRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import MilitaryTechRoundedIcon      from "@mui/icons-material/MilitaryTechRounded";
import MenuRoundedIcon              from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon             from "@mui/icons-material/CloseRounded";
import ImageSearchRoundedIcon       from "@mui/icons-material/ImageSearchRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import ScienceRoundedIcon           from "@mui/icons-material/ScienceRounded";
import InstallMobileRoundedIcon     from "@mui/icons-material/InstallMobileRounded";
import IosShareRoundedIcon          from "@mui/icons-material/IosShareRounded";
import CodeRoundedIcon              from "@mui/icons-material/CodeRounded";
import GroupsIcon                   from "@mui/icons-material/Groups";
import InfoRoundedIcon              from "@mui/icons-material/InfoRounded";
import SportsEsportsRoundedIcon     from "@mui/icons-material/SportsEsportsRounded";
import SportsCricketRoundedIcon     from "@mui/icons-material/SportsCricketRounded";
import SpellcheckRoundedIcon        from "@mui/icons-material/SpellcheckRounded";
import VerifiedUserRoundedIcon      from "@mui/icons-material/VerifiedUserRounded";
import TextSnippetRoundedIcon       from "@mui/icons-material/TextSnippetRounded";
import CalendarMonthRoundedIcon     from "@mui/icons-material/CalendarMonthRounded";
import LocalLibraryRoundedIcon      from "@mui/icons-material/LocalLibraryRounded";
import AccountCircleRoundedIcon     from "@mui/icons-material/AccountCircleRounded";
import RocketLaunchIcon             from "@mui/icons-material/RocketLaunch";
import ChevronRightIcon             from "@mui/icons-material/ChevronRight";
import CheckCircleIcon              from "@mui/icons-material/CheckCircle";
import RecordVoiceOverIcon          from "@mui/icons-material/RecordVoiceOver";
import StopCircleIcon               from "@mui/icons-material/StopCircle";
import EmojiEventsIcon              from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon               from "@mui/icons-material/AccessTime";
import LocationOnIcon               from "@mui/icons-material/LocationOn";
import WbSunnyIcon                  from "@mui/icons-material/WbSunny";
import CloudIcon                    from "@mui/icons-material/Cloud";
import ThunderstormIcon             from "@mui/icons-material/Thunderstorm";
import AcUnitIcon                   from "@mui/icons-material/AcUnit";
import OpacityIcon                  from "@mui/icons-material/Opacity";

// ════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════
const G = "#10b981";
const TEXT_MAIN = "#0f172a";
const TEXT_SUB = "#64748b";

const navGroups = [
  {
    group: "AI Tools & Digitize",
    items: [
      { href: "/aksharadrishti", label: "Photo Scanner",     icon: ImageSearchRoundedIcon },
      { href: "/OCR",            label: "Text Reader",       icon: DocumentScannerRoundedIcon },
      { href: "/ocreng",         label: "Handwriting Reader",icon: DrawRoundedIcon },
      { href: "/upload",         label: "Add Files",         icon: UploadFileRoundedIcon },
      { href: "/voice",          label: "Talking AI",        icon: MicRoundedIcon },
    ],
  },
  {
    group: "Heritage & Culture",
    items: [
      { href: "/Sanskrit", label: "Sanskrit Books", icon: MenuBookRoundedIcon },
      { href: "/vedha",    label: "Old Stories",    icon: AutoStoriesRoundedIcon },
      { href: "/Media",    label: "Photo Gallery",  icon: CollectionsRoundedIcon },
    ],
  },
  {
    group: "Studio & Labs",
    items: [
      { href: "/posters",       label: "Make Posters",   icon: DashboardCustomizeRoundedIcon },
      { href: "/badge",         label: "Certificates",   icon: MilitaryTechRoundedIcon },
      { href: "/Ocrwork",       label: "New Ideas",      icon: HistoryEduRoundedIcon },
      { href: "/onecrdb",       label: "Data List",      icon: ScienceRoundedIcon },
      { href: "/calendarpage",  label: "Calendar",       icon: CalendarMonthRoundedIcon },
      { href: "/ebook",         label: "E-Book Maker",   icon: LocalLibraryRoundedIcon },
      { href: "/rupantarcode",  label: "RupantarCode",   icon: CodeRoundedIcon }
        ],
  },
  {
    group: "Yuktai Framework",
    items: [
      { href: "/yuktai",         label: "About Yuktai", icon: InfoRoundedIcon },
      { href: "/staffdirectory", label: "Yuktai Demo",  icon: InfoRoundedIcon },
       { href: "/user",          label: "User List",      icon: AccountCircleRoundedIcon },

    ],
  },
];

// ════════════════════════════════════════════════════════════════════════
// PWA INSTALL HOOK
// ════════════════════════════════════════════════════════════════════════
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function useInstallState() {
  const [state, setState] = useState<"checking"|"installed"|"promptable"|"ios"|"unsupported">("checking");
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    if (isStandalone) { setState("installed"); return; }
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)) { setState("ios"); return; }
    const handler = (e: Event) => { e.preventDefault(); promptRef.current = e as BeforeInstallPromptEvent; setState("promptable"); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const triggerPrompt = async () => {
    if (!promptRef.current) return;
    await promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === "accepted") setState("installed");
    promptRef.current = null;
  };
  return { state, triggerPrompt };
}

// ════════════════════════════════════════════════════════════════════════
// WEATHER WIDGET
// ════════════════════════════════════════════════════════════════════════
interface WeatherData { temp: number; desc: string; icon: string; city: string; }

function WeatherIcon({ code, size = 18 }: { code: string; size?: number }) {
  const s = { fontSize: size };
  if (code.startsWith("01")) return <WbSunnyIcon style={{ ...s, color: "#f59e0b" }} />;
  if (["02","03","04"].some(p => code.startsWith(p))) return <CloudIcon style={{ ...s, color: "#94a3b8" }} />;
  if (["09","10"].some(p => code.startsWith(p))) return <OpacityIcon style={{ ...s, color: "#3b82f6" }} />;
  if (code.startsWith("11")) return <ThunderstormIcon style={{ ...s, color: "#7c3aed" }} />;
  if (code.startsWith("13")) return <AcUnitIcon style={{ ...s, color: "#93c5fd" }} />;
  return <WbSunnyIcon style={{ ...s, color: "#f59e0b" }} />;
}

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

function WeatherBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords: { latitude: lat, longitude: lon } }) => {
      try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=bd5e378503939ddaee76f12ad7a97608&units=metric`);
        const d = await r.json();
        setWeather({ temp: Math.round(d.main.temp), desc: d.weather[0].description, icon: d.weather[0].icon, city: d.name });
      } catch {}
    }, () => {});
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", background: "rgba(255,255,255,0.9)", border: "1px solid #e5e7eb", borderRadius: 99, backdropFilter: "blur(12px)", fontSize: 12, color: TEXT_SUB, fontFamily: "'DM Sans',sans-serif" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#059669", fontWeight: 600 }}>
        <AccessTimeIcon style={{ fontSize: 13 }} />
        <LiveClock />
      </span>
      <span style={{ width: 1, height: 14, background: "#e5e7eb" }} />
      {weather ? (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <LocationOnIcon style={{ fontSize: 12, color: "#9ca3af" }} />
          <span style={{ fontWeight: 600, color: TEXT_MAIN }}>{weather.city}</span>
          <WeatherIcon code={weather.icon} />
          <span style={{ fontWeight: 700, color: TEXT_MAIN }}>{weather.temp}°C</span>
        </span>
      ) : (
        <span style={{ color: "#9ca3af" }}>Locating…</span>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SPEECH WELCOME
// ════════════════════════════════════════════════════════════════════════
function SpeechWelcome() {
  const [speaking, setSpeaking] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const speak = () => {
    const hour = new Date().getHours();
    const gr = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const msg = new SpeechSynthesisUtterance(`${gr}! Welcome to AksharaTantra — your offline AI platform for Indic language digitization.`);
    msg.lang = "en-IN"; msg.rate = 0.92; msg.pitch = 1.05;
    msg.onend = () => setSpeaking(false);
    speechSynthesis.cancel(); speechSynthesis.speak(msg);
    setSpeaking(true); setSpoken(true);
  };
  const stop = () => { speechSynthesis.cancel(); setSpeaking(false); };
  return (
    <button onClick={speaking ? stop : speak} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", background: speaking ? "rgba(16,185,129,0.08)" : "#f8fafc", border: `1.5px solid ${speaking ? "rgba(16,185,129,0.35)" : "#e5e7eb"}`, borderRadius: 10, cursor: "pointer", fontSize: 13, color: TEXT_SUB, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}>
      {speaking ? (
        <><span style={{ display: "flex", gap: 2, alignItems: "center" }}>{[0,1,2,3].map(i => <span key={i} style={{ width: 3, borderRadius: 99, background: G, animation: `sb 0.8s ease-in-out ${i*0.15}s infinite alternate`, display: "inline-block" }} />)}</span><StopCircleIcon style={{ fontSize: 15, color: G }} /><span style={{ fontWeight: 600, color: "#059669" }}>Tap to stop</span></>
      ) : (
        <><RecordVoiceOverIcon style={{ fontSize: 15, color: spoken ? G : "#9ca3af" }} /><span style={{ fontWeight: 500 }}>{spoken ? "Play welcome again" : "🔊 Hear welcome"}</span></>
      )}
      <style>{`@keyframes sb{from{height:4px}to{height:16px}}`}</style>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MODULE DEFINITIONS (matching nav groups)
// ════════════════════════════════════════════════════════════════════════
const ALL_MODULES = [
  // AI Tools
  { href: "/aksharadrishti", icon: ImageSearchRoundedIcon,       color: "#6366f1", bg: "#eef2ff", label: "Photo Scanner",       tagline: "Multilingual image OCR",       desc: "Combine English with any Indic or global script in one scan.", bullets: ["34+ languages","Noto font output","Download as PNG"], group: "AI Tools & Digitize", badge: null },
  { href: "/OCR",            icon: DocumentScannerRoundedIcon,   color: "#10b981", bg: "#f0fdf4", label: "Text Reader",         tagline: "Read text from any image",     desc: "Upload a photo of a book or document and extract text in 34+ languages.", bullets: ["34+ languages","Works offline","Export as PDF"], group: "AI Tools & Digitize", badge: null },
  { href: "/ocreng",         icon: DrawRoundedIcon,              color: "#8b5cf6", bg: "#f5f3ff", label: "Handwriting Reader",  tagline: "HTR for Indic scripts",        desc: "Recognise handwritten Devanagari, Telugu, Tamil using transformer AI.", bullets: ["Handwritten scripts","TrOCR models","Indic-first"], group: "AI Tools & Digitize", badge: null },
  { href: "/upload",         icon: UploadFileRoundedIcon,        color: "#f59e0b", bg: "#fffbeb", label: "Add Files",           tagline: "Bulk digitization",            desc: "Process entire scanned books page by page. Get structured text output.", bullets: ["Multi-page","Archive output","Chapter detection"], group: "AI Tools & Digitize", badge: null },
  { href: "/voice",          icon: MicRoundedIcon,               color: "#ec4899", bg: "#fdf2f8", label: "Talking AI",          tagline: "Text-to-speech in 30+ langs",  desc: "Convert any text to natural-sounding audio. Runs entirely in your browser.", bullets: ["30+ voices","Offline TTS","Audio download"], group: "AI Tools & Digitize", badge: null },
  // Heritage
  { href: "/Sanskrit",       icon: MenuBookRoundedIcon,          color: "#059669", bg: "#f0fdf4", label: "Sanskrit Books",      tagline: "Character-by-character reader",desc: "Sanskrit reader with transliteration, meanings and audio pronunciation.", bullets: ["Transliteration","Audio pronunciation","Akshara-by-akshara"], group: "Heritage & Culture", badge: null },
  { href: "/vedha",          icon: AutoStoriesRoundedIcon,       color: "#7c3aed", bg: "#f5f3ff", label: "Old Stories",         tagline: "Vedic text digitizer",         desc: "OCR for Sanskrit and Vedic manuscripts with pitch accent marking.", bullets: ["Pitch accents","Sanskrit-first","HTML export"], group: "Heritage & Culture", badge: "NEW" },
  { href: "/kosha",          icon: SpellcheckRoundedIcon,        color: "#0ea5e9", bg: "#f0f9ff", label: "Kosha Dictionary",    tagline: "Multilingual word explorer",   desc: "Explore meanings across Sanskrit, Telugu, Hindi and more.", bullets: ["Cross-language","Semantic search","Offline"], group: "Heritage & Culture", badge: null },
  { href: "/Media",          icon: CollectionsRoundedIcon,       color: "#d97706", bg: "#fffbeb", label: "Photo Gallery",       tagline: "Cultural media library",       desc: "Browse and search a curated collection of Indic cultural photography.", bullets: ["Tagged archive","Search","Download"], group: "Heritage & Culture", badge: null },
  // Business
  { href: "/kyc",            icon: VerifiedUserRoundedIcon,      color: "#10b981", bg: "#f0fdf4", label: "Secure KYC",          tagline: "ID verification tool",         desc: "Offline-safe KYC document reader with privacy-first processing.", bullets: ["Privacy-first","Offline","Instant verify"], group: "Business & Recreation", badge: null },
  { href: "/smsparser",      icon: TextSnippetRoundedIcon,       color: "#6366f1", bg: "#eef2ff", label: "SMS Parser",          tagline: "Parse financial SMSes",        desc: "Extract transaction details from bank SMS messages automatically.", bullets: ["Bank SMS","Auto extract","CSV export"], group: "Business & Recreation", badge: null },
  { href: "/chess",          icon: SportsEsportsRoundedIcon,     color: "#7c3aed", bg: "#f5f3ff", label: "Vedic Chess",         tagline: "Chess with Sanskrit notation", desc: "Play chess with Chaturanga-style Sanskrit piece names and notation.", bullets: ["Sanskrit notation","Offline","Two-player"], group: "Business & Recreation", badge: "NEW" },
  { href: "/ipl",            icon: SportsCricketRoundedIcon,     color: "#f59e0b", bg: "#fffbeb", label: "IPL Dashboard",       tagline: "Live cricket tracker",         desc: "Track IPL scores, team standings and player stats in real time.", bullets: ["Live scores","Team stats","Player cards"], group: "Business & Recreation", badge: null },
  // Studio
  { href: "/posters",        icon: DashboardCustomizeRoundedIcon,color: "#0ea5e9", bg: "#f0f9ff", label: "Make Posters",        tagline: "Multilingual design tool",     desc: "Design beautiful posters in 40+ languages with custom fonts and QR codes.", bullets: ["40+ languages","QR code + voice","Print-ready"], group: "Studio & Labs", badge: "NEW" },
  { href: "/badge",          icon: MilitaryTechRoundedIcon,      color: "#ec4899", bg: "#fdf2f8", label: "Certificates",        tagline: "Auto certificate maker",       desc: "Generate and print certificates with custom names and templates.", bullets: ["Custom templates","Bulk generation","PDF download"], group: "Studio & Labs", badge: null },
  { href: "/calendarpage",   icon: CalendarMonthRoundedIcon,     color: "#64748b", bg: "#f8fafc", label: "Calendar",            tagline: "Panchanga planner",            desc: "Personal planner with Panchanga — see Tithi, Nakshatra alongside events.", bullets: ["Panchanga overlay","Personal events","Offline"], group: "Studio & Labs", badge: "NEW" },
  { href: "/ebook",          icon: LocalLibraryRoundedIcon,      color: "#059669", bg: "#f0fdf4", label: "E-Book Maker",        tagline: "Publish digital books",        desc: "Convert documents into beautiful e-books ready for sharing or download.", bullets: ["Multi-format","Cover design","Offline"], group: "Studio & Labs", badge: null },
  { href: "/rupantarcode",   icon: CodeRoundedIcon,              color: "#8b5cf6", bg: "#f5f3ff", label: "RupantarCode",        tagline: "Script transliterator",        desc: "Instantly convert text between any two Indic scripts or romanisation.", bullets: ["Any Indic script","Romanisation","Copy & paste"], group: "Studio & Labs", badge: null },
  // Yuktai
  { href: "/yuktai",         icon: InfoRoundedIcon,              color: "#10b981", bg: "#f0fdf4", label: "About Yuktai",        tagline: "Accessibility framework",      desc: "Install as a node module — supports React, Angular, Next.js. One import, full accessibility.", bullets: ["React/Next.js/Angular","One function call","WCAG 2.1 AA"], group: "Yuktai Framework", badge: "NEW" },
  { href: "/whatsapp-bot",   icon: InfoRoundedIcon,              color: "#25d366", bg: "#f0fdf4", label: "WhatsApp Bot",        tagline: "Vernacular messaging AI",      desc: "Interact with AksharaTantra tools via WhatsApp in your own language.", bullets: ["19+ languages","No app install","Voice replies"], group: "Yuktai Framework", badge: "NEW" },
];

const GROUP_ORDER = ["AI Tools & Digitize","Heritage & Culture","Business & Recreation","Studio & Labs","Yuktai Framework"];
const GROUP_META: Record<string, { label: string; color: string }> = {
  "AI Tools & Digitize":   { label: "Reading & Digitizing",  color: "#10b981" },
  "Heritage & Culture":    { label: "Heritage & Culture",    color: "#7c3aed" },
  "Business & Recreation": { label: "Business & Recreation", color: "#f59e0b" },
  "Studio & Labs":         { label: "Studio & Labs",         color: "#0ea5e9" },
  "Yuktai Framework":      { label: "Yuktai Framework",      color: "#10b981" },
};

// ════════════════════════════════════════════════════════════════════════
// MODULE CARD
// ════════════════════════════════════════════════════════════════════════
function ModuleCard({ m }: { m: typeof ALL_MODULES[0] }) {
  const Icon = m.icon;
  return (
    <Link href={m.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <article style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 18, padding: "22px 20px", transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)", position: "relative", overflow: "hidden", cursor: "pointer" }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = m.color+"55"; el.style.transform = "translateY(-4px)"; el.style.boxShadow = `0 16px 36px ${m.color}18`; }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "#f1f5f9"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
      >
        {m.badge && <span style={{ position: "absolute", top: 12, right: 12, background: m.color, color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.08em", fontFamily: "'DM Sans',sans-serif" }}>{m.badge}</span>}
        <div style={{ width: 48, height: 48, borderRadius: 13, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", color: m.color, marginBottom: 14, flexShrink: 0 }}>
          <Icon style={{ fontSize: 24 }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_MAIN, fontFamily: "'Syne',sans-serif", lineHeight: 1.2, marginBottom: 3 }}>{m.label}</div>
        <div style={{ fontSize: 11, color: m.color, fontWeight: 600, marginBottom: 10, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.tagline}</div>
        <p style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.65, fontFamily: "'DM Sans',sans-serif", marginBottom: 14, flex: 1 }}>{m.desc}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          {m.bullets.map(b => (
            <li key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#94a3b8", fontFamily: "'DM Sans',sans-serif" }}>
              <CheckCircleIcon style={{ fontSize: 12, color: m.color, opacity: 0.8 }} /> {b}
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: m.color, fontFamily: "'DM Sans',sans-serif", borderTop: "1px solid #f1f5f9", paddingTop: 13 }}>
          Open {m.label} <ChevronRightIcon style={{ fontSize: 15 }} />
        </div>
      </article>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// NAVBAR (from Navbar.tsx, integrated inline)
// ════════════════════════════════════════════════════════════════════════
function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const { state: installState, triggerPrompt } = useInstallState();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    const onScroll = () => setScrolled(window.scrollY > 10);
    const onClickOutside = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveDropdown(null); };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll);
    document.addEventListener("mousedown", onClickOutside);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onScroll); document.removeEventListener("mousedown", onClickOutside); };
  }, []);

  const toggleDD = (g: string) => setActiveDropdown(p => p === g ? null : g);

  return (
    <>
      <style>{`
        .at-nav { position: fixed; top: 0; left: 0; width: 100%; z-index: 2000; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; padding: ${scrolled ? "10px 28px" : "14px 28px"}; transition: padding 0.25s; box-sizing: border-box; }
        .at-menu { display: flex; gap: 2px; flex-wrap: nowrap; justify-content: flex-end; flex: 1; margin-left: 16px; align-items: center; }
        .at-link { display: flex; align-items: center; gap: 2px; padding: 7px 9px; color: ${TEXT_SUB}; font-family: 'Outfit',sans-serif; font-size: 13px; font-weight: 500; text-decoration: none; border-radius: 7px; transition: all 0.15s; white-space: nowrap; cursor: pointer; background: none; border: none; }
        .at-link:hover, .at-link.active { background: #f1f5f9; color: ${TEXT_MAIN}; }
        .at-dd-wrap { position: relative; display: inline-block; }
        .at-dd { position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%); min-width: 200px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.08); z-index: 5000; }
        .at-dd.show { display: block; }
        .at-dd-wrap:nth-last-child(-n+2) .at-dd { left: auto; right: 0; transform: none; }
        .at-dd-item { display: flex; align-items: center; gap: 10px; padding: 9px 13px; color: ${TEXT_SUB}; text-decoration: none; font-size: 13px; font-family: 'Outfit',sans-serif; font-weight: 500; border-radius: 8px; transition: all 0.15s; white-space: nowrap; }
        .at-dd-item:hover { background: #f8fafc; color: ${TEXT_MAIN}; }
        .at-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 285px; background: #fff; z-index: 2200; transform: translateX(-100%); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); display: flex; flex-direction: column; border-right: 1px solid #e2e8f0; overflow-y: auto; }
        .at-drawer.open { transform: translateX(0); }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ── Desktop nav ── */}
      {!isMobile && (
        <nav className="at-nav" ref={navRef}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0 }} onClick={() => setActiveDropdown(null)}>
            <Image src="/icon-512.png" alt="Logo" width={22} height={22} />
            <span style={{ color: TEXT_MAIN, fontWeight: 700, fontFamily: "Outfit", fontSize: 18, letterSpacing: "-0.02em" }}>
              Akshara<span style={{ color: G }}>Tantra</span>
            </span>
          </Link>

          <div className="at-menu">
            <Link href="/" className="at-link" onClick={() => setActiveDropdown(null)}>Home</Link>
            {navGroups.map(group => (
              <div key={group.group} className="at-dd-wrap">
                <div className={`at-link${activeDropdown === group.group ? " active" : ""}`} onClick={() => toggleDD(group.group)}>
                  {group.group}
                  <KeyboardArrowDownRoundedIcon style={{ fontSize: 13, opacity: 0.5, marginLeft: 1, transform: activeDropdown === group.group ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </div>
                <div className={`at-dd${activeDropdown === group.group ? " show" : ""}`}>
                  {group.items.map(item => (
                    <Link key={item.href} href={item.href} className="at-dd-item" onClick={() => setActiveDropdown(null)}>
                      <item.icon style={{ fontSize: 17, color: "#94a3b8" }} /> {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Weather inline in nav */}
            <div style={{ marginLeft: 8 }}><WeatherBar /></div>
          </div>
        </nav>
      )}

      {/* ── Mobile nav ── */}
      {isMobile && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 58, zIndex: 2000, background: "#fff", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #e2e8f0", justifyContent: "space-between", boxSizing: "border-box" }}>
            <button onClick={() => setDrawerOpen(true)} style={{ background: "#f1f5f9", border: "none", padding: 8, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }}><MenuRoundedIcon sx={{ color: TEXT_MAIN, fontSize: 22 }} /></button>
            <span style={{ fontWeight: 700, fontFamily: "Outfit,sans-serif", fontSize: 16, color: TEXT_MAIN }}>Akshara<span style={{ color: G }}>Tantra</span></span>
            <WeatherBar />
          </div>
          {drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.18)", backdropFilter: "blur(4px)", zIndex: 2100 }} />}
          <div className={`at-drawer${drawerOpen ? " open" : ""}`}>
            <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <span style={{ fontWeight: 700, fontFamily: "Outfit,sans-serif", color: TEXT_MAIN, fontSize: 15 }}>Navigation</span>
              <CloseRoundedIcon onClick={() => setDrawerOpen(false)} style={{ cursor: "pointer", color: TEXT_SUB }} />
            </div>
            <Link href="/" onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", textDecoration: "none", color: TEXT_MAIN, fontFamily: "Outfit,sans-serif", fontSize: 14.5, fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>
              🏠 Home
            </Link>
            {navGroups.map(g => (
              <div key={g.group} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ padding: "10px 20px 4px", fontSize: 10, color: TEXT_SUB, fontFamily: "Outfit,sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", background: "#f8fafc" }}>{g.group}</div>
                {g.items.map(i => (
                  <Link key={i.href} href={i.href} onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", textDecoration: "none", color: TEXT_MAIN, fontFamily: "Outfit,sans-serif", fontSize: 14, fontWeight: 500 }}>
                    <i.icon style={{ fontSize: 19, color: TEXT_SUB }} /> {i.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Install FAB */}
      {(installState === "promptable" || installState === "ios") && (
        <button onClick={triggerPrompt} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, height: 48, padding: "0 20px", borderRadius: 24, border: "none", background: G, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 20px rgba(16,185,129,0.3)", fontFamily: "Outfit,sans-serif", fontWeight: 600, fontSize: 14 }}>
          {installState === "ios" ? <IosShareRoundedIcon style={{ fontSize: 20 }} /> : <InstallMobileRoundedIcon style={{ fontSize: 20 }} />}
          {installState === "ios" ? "Add to Home" : "Install App"}
        </button>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fafaf9; color: ${TEXT_MAIN}; font-family: 'DM Sans',sans-serif; overflow-x: hidden; }

        /* ── hero ── */
        .hero { max-width: 1200px; margin: 0 auto; padding: clamp(100px,12vw,130px) clamp(20px,5vw,60px) clamp(60px,8vw,90px); display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; position: relative; }
        @media(max-width:860px){ .hero { grid-template-columns: 1fr; gap: 36px; text-align: center; } }

        .hero-script { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: clamp(100px,20vw,240px); font-weight: 700; color: transparent; -webkit-text-stroke: 1px rgba(16,185,129,0.07); pointer-events: none; user-select: none; z-index: 0; white-space: nowrap; font-family: serif; }

        /* badges */
        .badge-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        @media(max-width:860px){ .badge-strip { justify-content: center; } }
        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; font-family: 'DM Sans',sans-serif; letter-spacing: 0.04em; }
        .bg-green { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.25); }
        .bg-blue  { background: rgba(37,99,235,0.08); color: #1d4ed8; border: 1px solid rgba(37,99,235,0.2); }

        /* stat cards */
        .stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        .stat-card { background: #fff; border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 18px; text-align: center; transition: border-color 0.2s; }
        .stat-card:hover { border-color: rgba(16,185,129,0.3); }
        .stat-num { font-size: 34px; font-weight: 900; color: #10b981; font-family: 'Syne',sans-serif; line-height: 1; }
        .stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.08em; }

        /* section */
        .section { max-width: 1200px; margin: 0 auto; padding: 0 clamp(20px,5vw,60px) clamp(60px,8vw,90px); }
        .section-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; font-family: 'DM Sans',sans-serif; }
        .section-eyebrow::before { content: ''; width: 22px; height: 2px; background: #10b981; border-radius: 99px; }
        .section-title { font-family: 'Syne',sans-serif; font-size: clamp(22px,4vw,40px); font-weight: 800; color: ${TEXT_MAIN}; line-height: 1.1; margin-bottom: 8px; }
        .section-sub { font-size: 15px; color: ${TEXT_SUB}; line-height: 1.7; max-width: 540px; margin-bottom: 36px; }

        /* module grid */
        .mod-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        @media(max-width:1024px){ .mod-grid { grid-template-columns: repeat(2,1fr); } }
        @media(max-width:600px){ .mod-grid { grid-template-columns: 1fr; } }

        /* group divider */
        .grp-div { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; margin-top: 44px; }
        .grp-div:first-of-type { margin-top: 0; }
        .grp-line { flex: 1; height: 1px; background: #f1f5f9; }
        .grp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; font-family: 'DM Sans',sans-serif; white-space: nowrap; }

        /* privacy strip */
        .priv { background: linear-gradient(135deg,#f0fdf4,#fafaf9); border-top: 1px solid rgba(16,185,129,0.12); border-bottom: 1px solid rgba(16,185,129,0.12); padding: clamp(24px,4vw,44px) clamp(20px,5vw,60px); display: flex; align-items: center; justify-content: center; gap: clamp(16px,3vw,40px); flex-wrap: wrap; }
        .priv-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #374151; font-family: 'DM Sans',sans-serif; }
        .priv-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0; }

        /* CTA section */
        .cta-sec { text-align: center; padding: clamp(60px,8vw,100px) clamp(20px,5vw,60px); background: ${TEXT_MAIN}; position: relative; overflow: hidden; }
        .cta-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle,rgba(16,185,129,0.15) 0%,transparent 70%); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }

        /* VaniSetu feature card */
        .vani-card { background: linear-gradient(135deg,#fff7f0,#fff); border: 2px solid #fdd5b5; border-radius: 24px; padding: clamp(28px,5vw,48px); display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin-bottom: 16px; }
        @media(max-width:700px){ .vani-card { grid-template-columns: 1fr; gap: 24px; } }
        .vani-howto { display: flex; flex-direction: column; gap: 16px; }
        .vani-step { display: flex; align-items: flex-start; gap: 14px; }
        .vani-num { width: 32px; height: 32px; border-radius: 50%; background: #e8621a; color: #fff; font-size: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .vani-step-text { font-size: 14px; color: ${TEXT_SUB}; line-height: 1.6; }
        .vani-step-text strong { color: ${TEXT_MAIN}; }

        /* buttons */
        .btn-primary { display: inline-flex; align-items: center; gap: 9px; padding: 15px 32px; background: #10b981; color: #fff; border: none; border-radius: 13px; font-family: 'DM Sans',sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,0.3); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 13px 26px; background: transparent; color: #10b981; border: 1.5px solid rgba(16,185,129,0.4); border-radius: 13px; font-family: 'DM Sans',sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { background: rgba(16,185,129,0.08); border-color: #10b981; }
        .btn-orange { display: inline-flex; align-items: center; gap: 9px; padding: 15px 32px; background: #e8621a; color: #fff; border: none; border-radius: 13px; font-family: 'DM Sans',sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.2s; }
        .btn-orange:hover { background: #c24e10; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,98,26,0.3); }

        @media(max-width:640px) { .hero { padding-top: 80px; } }
      `}</style>

      <Navbar />

      <main>
        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section style={{ position: "relative", background: "#fafaf9", overflow: "hidden" }}>
          <div className="hero-script" aria-hidden="true">अक्षर</div>
          <div className="hero">
            {/* Left */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="badge-strip">
                <span className="badge bg-green"><EmojiEventsIcon style={{ fontSize: 12 }} /> Bhashini Hackathon 2026</span>
                <span className="badge bg-blue">🌍 UN Open Source Week 2026</span>
              </div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(46px,8vw,82px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", color: TEXT_MAIN, marginBottom: 18 }}>
                Akshara<br /><span style={{ color: G }}>Tantra</span>
              </h1>
              <p style={{ fontSize: "clamp(14px,2vw,17px)", color: TEXT_SUB, lineHeight: 1.75, maxWidth: 460, marginBottom: 26, fontFamily: "'DM Sans',sans-serif" }}>
                An offline AI platform that reads, digitizes, and speaks Indic languages — from ancient Sanskrit manuscripts to modern bilingual documents. Runs 100% in your browser.
              </p>
              <div style={{ marginBottom: 28 }}><SpeechWelcome /></div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/upload" className="btn-primary"><RocketLaunchIcon style={{ fontSize: 17 }} /> Launch Platform</Link>
                <button className="btn-ghost" onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}>Explore modules ↓</button>
              </div>
            </div>

            {/* Right — stat cards */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="stat-grid">
                {[{ n: "9+",   lbl: "AI Modules" },
                  { n: "34+",  lbl: "Languages" },
                  { n: "100%", lbl: "Offline" },
                  { n: "0",    lbl: "API Keys" }].map(s => (
                  <div key={s.lbl} className="stat-card">
                    <div className="stat-num">{s.n}</div>
                    <div className="stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 7, flexWrap: "wrap" }}>
                {["OCR","Handwriting","Poster Maker","Vedha","Calendar","VaniSetu"].map(t => (
                  <span key={t} style={{ padding: "5px 13px", borderRadius: 99, background: "#fff", border: "1.5px solid #f1f5f9", fontSize: 11.5, color: TEXT_SUB, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            PRIVACY STRIP
        ══════════════════════════════════════════ */}
        <div className="priv">
          {["100% Offline after first load","No account or login","Zero data upload","Free & open source","Works on mobile"].map(item => (
            <div key={item} className="priv-item"><div className="priv-dot" />{item}</div>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            VANISETU SPOTLIGHT
        ══════════════════════════════════════════ */}
        <section className="section" style={{ paddingTop: "clamp(60px,8vw,90px)" }}>
          <div className="section-eyebrow">⭐ Featured Module</div>
          <h2 className="section-title">VaniSetu — वाणी सेतु</h2>
          <p className="section-sub">A bridge of voice between parent and child. For deaf and mute parents who want to give their children the gift of hearing their love.</p>

          <div className="vani-card">
            {/* Left — description */}
            <div>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🤟</div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: TEXT_MAIN, marginBottom: 10 }}>Give Your Child Your Voice</h3>
              <p style={{ fontSize: 14.5, color: TEXT_SUB, lineHeight: 1.75, marginBottom: 20 }}>
                Deaf and mute parents can type or upload any message — a morning greeting, a lullaby, a bedtime story — in 19+ languages. VaniSetu converts it to a natural voice audio file the child can play anytime, even offline.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
                {["19+ languages","TXT · DOCX · PDF · RTF","Mummy / Daddy voice","Free & private"].map(tag => (
                  <span key={tag} style={{ padding: "4px 12px", borderRadius: 99, background: "#fff3eb", border: "1px solid #fdd5b5", fontSize: 11.5, color: "#c24e10", fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>{tag}</span>
                ))}
              </div>
              <Link href="/vanisetu" className="btn-orange">🔊 Open VaniSetu</Link>
            </div>

            {/* Right — how to use */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#e8621a", marginBottom: 16, fontFamily: "'DM Sans',sans-serif" }}>How to use — 3 simple steps</div>
              <div className="vani-howto">
                {[
                  { n: "1", icon: "✍️", title: "Type or upload",  body: "Write your message directly, or upload a .txt, Word, PDF, or RTF file." },
                  { n: "2", icon: "🌍", title: "Choose language & voice", body: "Pick from 19 languages. Choose Mummy, Daddy, Child or Elder voice." },
                  { n: "3", icon: "⬇️", title: "Download & share", body: "Save the MP3 to your child's phone. Share on WhatsApp. Play offline anytime." },
                ].map(s => (
                  <div key={s.n} className="vani-step">
                    <div className="vani-num">{s.n}</div>
                    <div className="vani-step-text">
                      <strong>{s.icon} {s.title}</strong><br />{s.body}
                    </div>
                  </div>
                ))}
              </div>
            
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            ALL MODULES
        ══════════════════════════════════════════ */}
        <section id="modules" className="section">
          <div className="section-eyebrow">Everything inside</div>
          <h2 className="section-title">Pick a module, start instantly</h2>
          <p className="section-sub">Each module is standalone. Click any card — no setup, no loading screen.</p>

          {GROUP_ORDER.map(groupKey => {
            const mods = ALL_MODULES.filter(m => m.group === groupKey);
            const meta = GROUP_META[groupKey];
            return (
              <div key={groupKey}>
                <div className="grp-div">
                  <div className="grp-line" />
                  <div className="grp-label" style={{ color: meta.color }}>▸ {meta.label}</div>
                  <div className="grp-line" />
                </div>
                <div className="mod-grid">
                  {mods.map(m => <ModuleCard key={m.href} m={m as any} />)}
                </div>
              </div>
            );
          })}
        </section>

        {/* ══════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════ */}
        <section className="cta-sec">
          <div className="cta-glow" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span className="badge bg-green" style={{ marginBottom: 20, display: "inline-flex" }}>
              <RocketLaunchIcon style={{ fontSize: 12 }} /> Ready to begin?
            </span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,5vw,56px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
              Start using AksharaTantra
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 32, fontFamily: "'DM Sans',sans-serif" }}>
              No account. No internet after first load. Just open and use.
            </p>
            <Link href="/upload" className="btn-primary" style={{ fontSize: 16, padding: "16px 40px" }}>
              <RocketLaunchIcon style={{ fontSize: 19 }} /> Launch Platform
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
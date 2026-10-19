"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Home — AksharaTantra
// The menu and the module cards come from ONE list: navGroups in Navbar.tsx.
// Add or rename a page there and it shows up here too.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import Navbar, { navGroups, type NavItem } from "@/components/Navbar";

import GridViewRoundedIcon  from "@mui/icons-material/GridViewRounded";
import RocketLaunchIcon     from "@mui/icons-material/RocketLaunch";
import ChevronRightIcon     from "@mui/icons-material/ChevronRight";
import CheckCircleIcon      from "@mui/icons-material/CheckCircle";
import RecordVoiceOverIcon  from "@mui/icons-material/RecordVoiceOver";
import StopCircleIcon       from "@mui/icons-material/StopCircle";
import EmojiEventsIcon      from "@mui/icons-material/EmojiEvents";

// ── Colours: same as the Navbar ──────────────────────────────
const G         = "#10b981";
const G_DARK    = "#047857"; // green text on white (4.5:1)
const TEXT_MAIN = "#0f172a";
const TEXT_SUB  = "#475569";

// ── Card details for each Navbar link (keyed by href) ────────
// tint = icon background, ink = icon and small text (all pass 4.5:1 on white)
type Info = { tagline: string; desc: string; bullets: string[]; tint: string; ink: string; badge?: string };

const INFO: Record<string, Info> = {
  // Yuktai
  "/staffdirectory": { tagline: "Agentic data grid",           desc: "Ask your data in plain English: filters, totals, unusual rows and multi-step tasks, over lakhs of rows.", bullets: ["Plain-English questions", "Voice + WebMCP", "WCAG accessible"], tint: "#ecfdf5", ink: "#047857", badge: "v5.2" },
  "/yuktai":         { tagline: "Open-source Next.js toolkit", desc: "Accessibility auto-fix, in-browser RAG, small AI agents and the agentic grid in one free npm package.",       bullets: ["Zero API keys", "Works offline", "Built in free time"],        tint: "#ecfdf5", ink: "#047857" },
  // AI Tools
  "/aksharadrishti": { tagline: "Multilingual image OCR",      desc: "Combine English with any Indic or global script in one scan.",                                              bullets: ["34+ languages", "Noto font output", "Download as PNG"],          tint: "#eef2ff", ink: "#4338ca" },
  "/OCR":            { tagline: "Read text from any image",    desc: "Upload a photo of a book or document and extract text in 34+ languages.",                                   bullets: ["34+ languages", "Works offline", "Export as PDF"],              tint: "#ecfdf5", ink: "#047857" },
  "/ocreng":         { tagline: "Handwriting for Indic scripts", desc: "Recognise handwritten Devanagari, Telugu and Tamil using transformer models.",                            bullets: ["Handwritten scripts", "TrOCR models", "Indic-first"],          tint: "#f5f3ff", ink: "#6d28d9" },
  "/upload":         { tagline: "Bulk digitization",           desc: "Process whole scanned books page by page and get structured text.",                                        bullets: ["Multi-page", "Archive output", "Chapter detection"],           tint: "#fffbeb", ink: "#b45309" },
  "/voice":          { tagline: "Text to speech, 30+ languages", desc: "Turn any text into natural-sounding audio, right in your browser.",                                       bullets: ["30+ voices", "Offline TTS", "Audio download"],                  tint: "#fdf2f8", ink: "#be185d" },
  // Heritage
  "/Sanskrit":       { tagline: "Akshara-by-akshara reader",   desc: "A Sanskrit reader with transliteration, meanings and audio pronunciation.",                                 bullets: ["Transliteration", "Audio pronunciation", "Akshara-by-akshara"], tint: "#ecfdf5", ink: "#047857" },
  "/vedha":          { tagline: "Vedic text digitizer",        desc: "OCR for Sanskrit and Vedic manuscripts with pitch-accent marking.",                                         bullets: ["Pitch accents", "Sanskrit-first", "HTML export"],              tint: "#f5f3ff", ink: "#6d28d9", badge: "NEW" },
  "/kosha":          { tagline: "Multilingual word explorer",  desc: "Explore meanings across Sanskrit, Telugu, Hindi and more.",                                                 bullets: ["Cross-language", "Word search", "Offline"],                     tint: "#f0f9ff", ink: "#0369a1" },
  "/Media":          { tagline: "Cultural photo library",      desc: "Browse and search a curated collection of Indic cultural photography.",                                    bullets: ["Tagged archive", "Search", "Download"],                         tint: "#fffbeb", ink: "#b45309" },
  // Studio
  "/posters":        { tagline: "Multilingual design tool",    desc: "Design posters in 40+ languages with custom fonts and QR codes.",                                           bullets: ["40+ languages", "QR code + voice", "Print-ready"],              tint: "#f0f9ff", ink: "#0369a1", badge: "NEW" },
  "/badge":          { tagline: "Certificate maker",           desc: "Generate and print certificates with names and templates.",                                                 bullets: ["Custom templates", "Bulk generation", "PDF download"],          tint: "#fdf2f8", ink: "#be185d" },
  "/ebook":          { tagline: "Make digital books",          desc: "Turn documents into e-books ready to share or download.",                                                   bullets: ["Multi-format", "Cover design", "Offline"],                      tint: "#ecfdf5", ink: "#047857" },
  "/calendarpage":   { tagline: "Panchanga planner",           desc: "A personal planner that shows Tithi and Nakshatra next to your events.",                                    bullets: ["Panchanga overlay", "Personal events", "Offline"],              tint: "#f8fafc", ink: "#475569", badge: "NEW" },
  // Utilities
  "/onecrdb":        { tagline: "Large data list",             desc: "Browse and search a big list of records in the browser.",                                                   bullets: ["Search", "Sort", "Fast paging"],                                tint: "#f8fafc", ink: "#475569" },
  "/smsparser":      { tagline: "SMS to structured data",      desc: "Paste message text and pull out the useful fields.",                                                        bullets: ["Paste and parse", "Runs in the browser", "Copy results"],       tint: "#f0f9ff", ink: "#0369a1" },
  "/kyc":            { tagline: "KYC helper",                  desc: "A simple helper for KYC documents and details.",                                                            bullets: ["Step by step", "In the browser", "Private"],                    tint: "#fdf2f8", ink: "#be185d" },
};

// Short intro per Navbar group
const GROUP_INTRO: Record<string, string> = {
  "Yuktai":    "The open-source toolkit behind this site.",
  "AI Tools":  "Read, scan and speak Indic text.",
  "Heritage":  "Books, stories, words and photos.",
  "Studio":    "Make posters, certificates, e-books and plans.",
  "Utilities": "Small everyday helpers.",
};

const TOTAL_PAGES = navGroups.reduce((n, g) => n + g.items.length, 0);

// ════════════════════════════════════════════════════════════════════════
// Hear a welcome (speech runs in the browser)
// ════════════════════════════════════════════════════════════════════════
function SpeechWelcome() {
  const [speaking, setSpeaking] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const msg = new SpeechSynthesisUtterance(`${greeting}! Welcome to AksharaTantra, a free AI platform for reading, digitizing and speaking Indian languages.`);
    msg.lang = "en-IN"; msg.rate = 0.92; msg.pitch = 1.05;
    msg.onend = () => setSpeaking(false);
    speechSynthesis.cancel(); speechSynthesis.speak(msg);
    setSpeaking(true); setSpoken(true);
  };
  const stop = () => { speechSynthesis.cancel(); setSpeaking(false); };
  return (
    <button type="button" onClick={speaking ? stop : speak} className={`hm-voice${speaking ? " on" : ""}`} aria-pressed={speaking}>
      {speaking
        ? <><StopCircleIcon style={{ fontSize: 16, color: G_DARK }} /> Tap to stop</>
        : <><RecordVoiceOverIcon style={{ fontSize: 16, color: spoken ? G_DARK : TEXT_SUB }} /> {spoken ? "Play welcome again" : "Hear welcome"}</>}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Module card (one per Navbar link)
// ════════════════════════════════════════════════════════════════════════
function ModuleCard({ item }: { item: NavItem }) {
  const info: Info = INFO[item.href] ?? { tagline: "", desc: "", bullets: [], tint: "#f8fafc", ink: "#475569" };
  const Icon = item.icon;
  return (
    <Link href={item.href} className="hm-card" style={{ ["--ink" as string]: info.ink }}>
      {info.badge && <span className="hm-badge" style={{ background: info.ink }}>{info.badge}</span>}
      <span className="hm-card__icon" style={{ background: info.tint, color: info.ink }} aria-hidden><Icon style={{ fontSize: 24 }} /></span>
      <span className="hm-card__title">{item.label}</span>
      {info.tagline && <span className="hm-card__tag" style={{ color: info.ink }}>{info.tagline}</span>}
      {info.desc && <span className="hm-card__desc">{info.desc}</span>}
      {info.bullets.length > 0 && (
        <span className="hm-card__list">
          {info.bullets.map((b) => (
            <span key={b} className="hm-card__li"><CheckCircleIcon style={{ fontSize: 13, color: info.ink }} /> {b}</span>
          ))}
        </span>
      )}
      <span className="hm-card__open" style={{ color: info.ink }}>Open {item.label} <ChevronRightIcon style={{ fontSize: 16 }} /></span>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Page
// ════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  return (
    <>
      <title>AksharaTantra · read, digitize and speak Indian languages</title>
      <Navbar />
      <style>{CSS}</style>

      <main className="hm">
        {/* ═══════════ HERO ═══════════ */}
        <section className="hm-hero-wrap">
          <div className="hm-hero-script" aria-hidden="true">अक्षर</div>
          <div className="hm-hero">
            <div>
              <div className="hm-chips">
                <span className="hm-chip hm-chip--green"><EmojiEventsIcon style={{ fontSize: 13 }} /> Bhashini Hackathon 2026</span>
                <span className="hm-chip hm-chip--blue">🌍 UN Open Source Week 2026</span>
              </div>
              <h1 className="hm-h1">Akshara<span style={{ color: G_DARK }}>Tantra</span></h1>
              <p className="hm-lead">
                A free AI platform that reads, digitizes and speaks Indian languages, from old Sanskrit manuscripts to
                modern bilingual documents. It runs in your browser and is built in free time, in the open.
              </p>
              <div style={{ marginBottom: 24 }}><SpeechWelcome /></div>
              <div className="hm-actions">
                <Link href="/staffdirectory" className="hm-btn hm-btn--primary"><GridViewRoundedIcon style={{ fontSize: 18 }} /> Try Yuktai Grid</Link>
                <Link href="/upload" className="hm-btn hm-btn--ghost"><RocketLaunchIcon style={{ fontSize: 18 }} /> Start digitizing</Link>
                <a href="#modules" className="hm-btn hm-btn--ghost">Explore all tools ↓</a>
              </div>
            </div>

            <div>
              <div className="hm-stats">
                {[{ n: String(TOTAL_PAGES), l: "Tools in one place" },
                  { n: "34+",  l: "Languages" },
                  { n: "0",    l: "API keys" },
                  { n: "Free", l: "Open source" }].map((s) => (
                  <div key={s.l} className="hm-stat">
                    <div className="hm-stat__n">{s.n}</div>
                    <div className="hm-stat__l">{s.l}</div>
                  </div>
                ))}
              </div>
              <nav className="hm-groups" aria-label="Sections">
                {navGroups.map((g) => (
                  <a key={g.group} href={`#group-${g.group.toLowerCase().replace(/\s+/g, "-")}`} className="hm-group-pill">
                    {g.group} · {g.items.length}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>

        {/* ═══════════ PRIVACY ═══════════ */}
        <ul className="hm-priv" aria-label="Privacy">
          {["Runs in your browser", "No account or login", "No data upload", "Free and open source", "Works on mobile"].map((t) => (
            <li key={t}><span className="hm-dot" aria-hidden />{t}</li>
          ))}
        </ul>

        {/* ═══════════ YUKTAI GRID SPOTLIGHT ═══════════ */}
        <section className="hm-section" aria-labelledby="spot">
          <div className="hm-eyebrow">Featured · Yuktai v5.2</div>
          <h2 id="spot" className="hm-h2">Yuktai Grid: talk to your data</h2>
          <p className="hm-sub">An accessible data grid with an assistant built in. Ask a question and the grid filters, sorts and summarises for you, right in the browser.</p>
          <div className="hm-spot">
            <div>
              <h3 className="hm-h3">Questions, not filters</h3>
              <p className="hm-text">
                Type what you want to see. Yuktai turns it into real grid actions and says what it did, so you can check
                it. No API keys, no server, nothing leaves the device. The demo pages through 10 lakh rows.
              </p>
              <div className="hm-tags">
                {["English UI + Telugu UI", "Voice input", "WebMCP", "WCAG 2.2", "Free npm package"].map((t) => <span key={t}>{t}</span>)}
              </div>
              <div className="hm-actions">
                <Link href="/staffdirectory" className="hm-btn hm-btn--primary"><GridViewRoundedIcon style={{ fontSize: 18 }} /> Open the demo</Link>
                <Link href="/yuktai" className="hm-btn hm-btn--ghost">About Yuktai</Link>
              </div>
            </div>
            <div>
              <div className="hm-eyebrow" style={{ marginBottom: 14 }}>Try asking</div>
              <ol className="hm-steps">
                {[
                  { q: "salary over 1 lakh",           a: "Filters the rows and shows what it used" },
                  { q: "average salary by department", a: "Groups the data and answers in one line" },
                  { q: "anything unusual?",            a: "Finds outliers and duplicate rows" },
                ].map((s) => <li key={s.q}><strong>“{s.q}”</strong><br />{s.a}</li>)}
              </ol>
            </div>
          </div>
        </section>

        {/* ═══════════ ALL TOOLS (same groups as the Navbar) ═══════════ */}
        <section id="modules" className="hm-section" aria-labelledby="all">
          <div className="hm-eyebrow">Everything inside</div>
          <h2 id="all" className="hm-h2">Pick a tool, start instantly</h2>
          <p className="hm-sub">The same sections as the menu above. Every tool stands on its own: no setup, no sign-in.</p>

          {navGroups.map((g) => (
            <div key={g.group} id={`group-${g.group.toLowerCase().replace(/\s+/g, "-")}`} className="hm-group">
              <div className="hm-group__head">
                <h3 className="hm-group__title">{g.group}</h3>
                {GROUP_INTRO[g.group] && <p className="hm-group__intro">{GROUP_INTRO[g.group]}</p>}
              </div>
              <div className="hm-cards">
                {g.items.map((item) => <ModuleCard key={item.href} item={item} />)}
              </div>
            </div>
          ))}
        </section>

        {/* ═══════════ CTA ═══════════ */}
        <section className="hm-cta">
          <div className="hm-cta__glow" aria-hidden />
          <div style={{ position: "relative" }}>
            <h2 className="hm-cta__title">Start using AksharaTantra</h2>
            <p className="hm-cta__text">No account. Just open a tool and use it.</p>
            <Link href="/upload" className="hm-btn hm-btn--primary hm-btn--lg"><RocketLaunchIcon style={{ fontSize: 20 }} /> Start digitizing</Link>
          </div>
        </section>
      </main>
    </>
  );
}

// Styles are scoped to .hm so they never leak into other pages.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
.hm { background: #fafaf9; color: ${TEXT_MAIN}; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
.hm *, .hm *::before, .hm *::after { box-sizing: border-box; }
.hm [id] { scroll-margin-top: 84px; } /* headings stay below the fixed Navbar */
.hm a:focus-visible, .hm button:focus-visible { outline: 3px solid ${G}; outline-offset: 2px; }

.hm-hero-wrap { position: relative; overflow: hidden; }
.hm-hero-script { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: clamp(100px,20vw,240px);
  font-weight: 700; color: transparent; -webkit-text-stroke: 1px rgba(16,185,129,.08); pointer-events: none; user-select: none; white-space: nowrap; font-family: serif; }
.hm-hero { position: relative; max-width: 1200px; margin: 0 auto; padding: clamp(96px,12vw,130px) clamp(20px,5vw,60px) clamp(56px,8vw,90px);
  display: grid; grid-template-columns: 1.1fr 1fr; gap: 56px; align-items: center; }
@media (max-width: 860px) { .hm-hero { grid-template-columns: 1fr; gap: 32px; } }
.hm-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.hm-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
.hm-chip--green { background: #ecfdf5; color: ${G_DARK}; border: 1px solid #a7f3d0; }
.hm-chip--blue { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.hm-h1 { font-family: 'Syne', sans-serif; font-size: clamp(46px,8vw,82px); font-weight: 800; line-height: .95; letter-spacing: -0.04em; margin: 0 0 18px; }
.hm-lead { font-size: clamp(15px,2vw,17px); color: ${TEXT_SUB}; line-height: 1.75; max-width: 480px; margin: 0 0 24px; }
.hm-voice { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 18px; background: #f8fafc;
  border: 1.5px solid #e5e7eb; border-radius: 10px; cursor: pointer; font: 600 14px 'DM Sans', sans-serif; color: ${TEXT_SUB}; }
.hm-voice.on { background: #ecfdf5; border-color: #a7f3d0; color: ${G_DARK}; }
.hm-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.hm-btn { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 12px 24px; border-radius: 12px;
  font: 700 15px 'DM Sans', sans-serif; text-decoration: none; cursor: pointer; transition: transform .2s, box-shadow .2s, background .2s; }
.hm-btn--primary { background: ${G_DARK}; color: #fff; border: none; }
.hm-btn--primary:hover { background: #065f46; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(4,120,87,.3); }
.hm-btn--ghost { background: #fff; color: ${G_DARK}; border: 1.5px solid rgba(4,120,87,.45); }
.hm-btn--ghost:hover { background: #ecfdf5; }
.hm-btn--lg { font-size: 16px; padding: 16px 36px; }

.hm-stats { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
.hm-stat { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px; text-align: center; }
.hm-stat__n { font-family: 'Syne', sans-serif; font-size: 34px; font-weight: 800; color: ${G_DARK}; line-height: 1; }
.hm-stat__l { font-size: 12px; color: ${TEXT_SUB}; margin-top: 6px; text-transform: uppercase; letter-spacing: .08em; }
.hm-groups { margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
.hm-group-pill { display: inline-flex; align-items: center; min-height: 36px; padding: 6px 14px; border-radius: 99px; background: #fff;
  border: 1.5px solid #e2e8f0; font-size: 13px; color: ${TEXT_SUB}; font-weight: 600; text-decoration: none; }
.hm-group-pill:hover { border-color: ${G}; color: ${G_DARK}; }

.hm-priv { list-style: none; margin: 0; background: linear-gradient(135deg,#f0fdf4,#fafaf9); border-top: 1px solid rgba(16,185,129,.15);
  border-bottom: 1px solid rgba(16,185,129,.15); padding: clamp(22px,4vw,40px) clamp(20px,5vw,60px); display: flex; justify-content: center;
  gap: clamp(14px,3vw,40px); flex-wrap: wrap; }
.hm-priv li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; }
.hm-dot { width: 7px; height: 7px; border-radius: 50%; background: ${G}; }

.hm-section { max-width: 1200px; margin: 0 auto; padding: clamp(56px,8vw,90px) clamp(20px,5vw,60px) 0; }
.hm-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: ${G_DARK};
  text-transform: uppercase; letter-spacing: .12em; margin-bottom: 8px; }
.hm-eyebrow::before { content: ''; width: 22px; height: 2px; background: ${G}; border-radius: 99px; }
.hm-h2 { font-family: 'Syne', sans-serif; font-size: clamp(24px,4vw,40px); font-weight: 800; line-height: 1.1; margin: 0 0 8px; }
.hm-h3 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin: 0 0 10px; }
.hm-sub { font-size: 16px; color: ${TEXT_SUB}; line-height: 1.7; max-width: 580px; margin: 0 0 32px; }
.hm-text { font-size: 15px; color: ${TEXT_SUB}; line-height: 1.75; margin: 0 0 18px; }

.hm-spot { background: linear-gradient(135deg,#f0fdf4,#fff); border: 2px solid rgba(16,185,129,.3); border-radius: 24px;
  padding: clamp(24px,5vw,48px); display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
@media (max-width: 760px) { .hm-spot { grid-template-columns: 1fr; gap: 24px; } }
.hm-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
.hm-tags span { padding: 4px 12px; border-radius: 99px; background: #ecfdf5; border: 1px solid #a7f3d0; font-size: 12px; color: ${G_DARK}; font-weight: 700; }
.hm-steps { margin: 0; padding-left: 22px; display: grid; gap: 14px; font-size: 15px; color: ${TEXT_SUB}; line-height: 1.6; }
.hm-steps strong { color: ${TEXT_MAIN}; }

.hm-group { margin-top: 44px; }
.hm-group:first-of-type { margin-top: 0; }
.hm-group__head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 18px; }
.hm-group__title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin: 0; }
.hm-group__intro { font-size: 14px; color: ${TEXT_SUB}; margin: 0; }
.hm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 16px; }

.hm-card { position: relative; display: flex; flex-direction: column; height: 100%; background: #fff; border: 1.5px solid #eef2f7;
  border-radius: 18px; padding: 22px 20px; text-decoration: none; color: inherit; transition: transform .2s, box-shadow .2s, border-color .2s; }
.hm-card:hover { transform: translateY(-4px); border-color: var(--ink); box-shadow: 0 16px 36px -18px var(--ink); }
.hm-badge { position: absolute; top: 12px; right: 12px; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 99px; letter-spacing: .08em; }
.hm-card__icon { width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.hm-card__title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; line-height: 1.2; margin-bottom: 4px; }
.hm-card__tag { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
.hm-card__desc { font-size: 14px; color: ${TEXT_SUB}; line-height: 1.65; margin-bottom: 14px; flex: 1; }
.hm-card__list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
.hm-card__li { display: flex; align-items: center; gap: 6px; font-size: 13px; color: ${TEXT_SUB}; }
.hm-card__open { display: flex; align-items: center; gap: 4px; font-size: 13.5px; font-weight: 700; border-top: 1px solid #f1f5f9; padding-top: 13px; }

.hm-cta { margin-top: clamp(56px,8vw,90px); text-align: center; padding: clamp(56px,8vw,100px) clamp(20px,5vw,60px); background: ${TEXT_MAIN}; position: relative; overflow: hidden; }
.hm-cta__glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%);
  top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
.hm-cta__title { font-family: 'Syne', sans-serif; font-size: clamp(26px,5vw,52px); font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 14px; }
.hm-cta__text { color: #cbd5e1; font-size: 16px; margin: 0 0 30px; }
@media (prefers-reduced-motion: reduce) { .hm-card, .hm-btn { transition: none; } .hm-card:hover, .hm-btn--primary:hover { transform: none; } }
`;
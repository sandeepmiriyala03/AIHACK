"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Home — AksharaTantra
// The menu and the tool cards come from ONE list: navGroups in Navbar.tsx.
// Add or rename a page there and it shows up here too.
// All styles live in app/globals.css (section "HOME", classes hm-*).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import Navbar, { navGroups, type NavItem } from "@/components/Navbar";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VolumeUpRoundedIcon     from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon         from "@mui/icons-material/StopRounded";

// ── Card details for each Navbar link (keyed by href) ────────
// tone = colour of the icon and tagline, see .hm-tone--* in globals.css (all pass 4.5:1)
type Tone = "green" | "indigo" | "violet" | "amber" | "pink" | "sky" | "slate";
type Info = { tagline: string; desc: string; tags: string[]; tone: Tone; badge?: string };

const INFO: Record<string, Info> = {
  // Yuktai
  "/staffdirectory": { tagline: "agentic data grid",          desc: "Ask your data in plain English: filters, totals, unusual rows and multi-step tasks, over lakhs of rows.", tags: ["plain English", "voice", "WebMCP"], tone: "green", badge: "v5.2" },
  "/yuktai":         { tagline: "open-source toolkit",        desc: "Accessibility fixes, in-browser RAG, small AI agents and the agentic grid in one free npm package.",      tags: ["0 API keys", "offline", "npm"],     tone: "green" },
  // Vision AI
  "/aksharadrishti": { tagline: "multilingual image OCR",     desc: "Mix English with any Indic or world script in one scan.",                                               tags: ["34+ languages", "Noto fonts", "PNG"], tone: "indigo" },
  "/OCR":            { tagline: "text from any image",        desc: "Photograph a book or document and get the text back in 34+ languages.",                                 tags: ["34+ languages", "offline", "PDF"],   tone: "green" },
  "/ocreng":         { tagline: "handwriting reader",         desc: "Read handwritten Devanagari, Telugu and Tamil with transformer models.",                               tags: ["handwriting", "TrOCR", "Indic"],     tone: "violet" },
  "/upload":         { tagline: "bulk digitization",          desc: "Run whole scanned books page by page and get structured text out.",                                     tags: ["multi-page", "archive", "chapters"], tone: "amber" },
  // Language AI
  "/voice":          { tagline: "text to speech",             desc: "Turn any text into natural audio in 30+ languages, right in the browser.",                             tags: ["30+ voices", "offline", "download"], tone: "pink" },
  "/Sanskrit":       { tagline: "akshara-by-akshara reader",  desc: "Read Sanskrit with transliteration, meanings and pronunciation.",                                       tags: ["transliteration", "audio"],          tone: "green" },
  "/vedha":          { tagline: "vedic text digitizer",       desc: "OCR for Sanskrit and Vedic manuscripts, with pitch accents marked.",                                    tags: ["accents", "HTML export"],            tone: "violet", badge: "new" },
  "/kosha":          { tagline: "word explorer",              desc: "Look up meanings across Sanskrit, Telugu, Hindi and more.",                                             tags: ["cross-language", "offline"],         tone: "sky" },
  // Create
  "/posters":        { tagline: "poster maker",               desc: "Design posters in 40+ languages with custom fonts and QR codes.",                                       tags: ["40+ languages", "QR", "print"],      tone: "sky", badge: "new" },
  "/badge":          { tagline: "certificate maker",          desc: "Make and print certificates from your own templates.",                                                  tags: ["templates", "bulk", "PDF"],          tone: "pink" },
  "/ebook":          { tagline: "e-book maker",               desc: "Turn documents into e-books ready to share or download.",                                               tags: ["formats", "cover"],                  tone: "green" },
  "/calendarpage":   { tagline: "panchanga planner",          desc: "A personal planner with Tithi and Nakshatra next to your events.",                                      tags: ["panchanga", "offline"],              tone: "slate", badge: "new" },
  "/Media":          { tagline: "photo library",              desc: "Browse a curated collection of Indic cultural photographs.",                                            tags: ["tagged", "search"],                  tone: "amber" },
};

const GROUP_INTRO: Record<string, string> = {
  "Yuktai":      "Small AI agents that work on your data and pages.",
  "Vision AI":   "AI that reads printed pages, photos and handwriting.",
  "Language AI": "AI that speaks, reads and explains Indic text.",
  "Create":      "Turn your text into posters, certificates and books.",
};

const TOTAL_TOOLS = navGroups.reduce((n, g) => n + g.items.length, 0);
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

// ════════════════════════════════════════════════════════════════════════
// Hear a welcome (browser speech, nothing sent anywhere)
// ════════════════════════════════════════════════════════════════════════
function SpeechWelcome() {
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const msg = new SpeechSynthesisUtterance(`${greeting}! Welcome to AksharaTantra, a free AI platform for reading, digitizing and speaking Indian languages.`);
    msg.lang = "en-IN"; msg.rate = 0.92;
    msg.onend = () => setSpeaking(false);
    speechSynthesis.cancel(); speechSynthesis.speak(msg);
    setSpeaking(true);
  };
  const stop = () => { speechSynthesis.cancel(); setSpeaking(false); };
  return (
    <button type="button" className="hm-link-btn" onClick={speaking ? stop : speak} aria-pressed={speaking}>
      {speaking ? <StopRoundedIcon className="ico-18" /> : <VolumeUpRoundedIcon className="ico-18" />}
      {speaking ? "Stop" : "Hear a welcome"}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Tool card (one per Navbar link)
// ════════════════════════════════════════════════════════════════════════
function ToolCard({ item }: { item: NavItem }) {
  const info: Info = INFO[item.href] ?? { tagline: "", desc: "", tags: [], tone: "slate" };
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`hm-tool hm-tone--${info.tone}`}>
      <span className="hm-tool__top">
        <span className="hm-tool__icon" aria-hidden><Icon className="ico-20" /></span>
        {info.badge && <span className="hm-tool__badge">{info.badge}</span>}
      </span>
      <span className="hm-tool__title">{item.label}</span>
      {info.tagline && <span className="hm-tool__tag">{info.tagline}</span>}
      {info.desc && <span className="hm-tool__desc">{info.desc}</span>}
      <span className="hm-tool__foot">
        <span className="hm-tool__chips">{info.tags.map((t) => <span key={t}>{t}</span>)}</span>
        <ArrowForwardRoundedIcon className="hm-tool__arrow ico-18" aria-hidden />
      </span>
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

      <main className="hm">
        {/* ═══════════ HERO ═══════════ */}
        <section className="hm-hero">
          <div className="hm-wrap hm-hero__grid">
            <div>
              <p className="hm-status"><span className="hm-pulse" aria-hidden /> runs in your browser · free · open source</p>
              <h1 className="hm-h1">
                Read, digitize and speak <span className="hm-h1__accent">Indian languages.</span>
              </h1>
              <p className="hm-lead">
                AksharaTantra is a set of small AI tools for old books, handwriting, posters and data, from Sanskrit
                manuscripts to handwritten notes. No sign-up, no API keys. Built in free time, in the open.
              </p>
              <div className="hm-actions">
                <Link href="/staffdirectory" className="hm-btn hm-btn--ink">Try Yuktai Grid <ArrowForwardRoundedIcon className="ico-18" /></Link>
                <Link href="/upload" className="hm-btn hm-btn--line">Start digitizing</Link>
                <SpeechWelcome />
              </div>
              <p className="hm-shown">Shown at Bhashini Hackathon 2026 · UN Open Source Week 2026</p>
            </div>

            {/* What you can do — written like a session log */}
            <figure className="hm-console" aria-label="What you can do here">
              <figcaption className="hm-console__bar">
                <span className="hm-console__dots" aria-hidden><i /><i /><i /></span>
                <span>aksharatantra</span>
              </figcaption>
              <ol className="hm-console__log">
                <li><span className="hm-k">scan</span> a photo of a page <span className="hm-r">→ text in 34+ languages</span></li>
                <li><span className="hm-k">read</span> handwritten Telugu <span className="hm-r">→ editable text</span></li>
                <li><span className="hm-k">ask</span> “anything unusual?” <span className="hm-r">→ outliers in your data</span></li>
                <li><span className="hm-k">speak</span> <span lang="te">నమస్కారం</span> <span className="hm-r">→ audio you can download</span></li>
                <li><span className="hm-k">make</span> a poster in <span lang="hi">हिन्दी</span> <span className="hm-r">→ print-ready PNG</span></li>
              </ol>
              <p className="hm-console__foot">everything stays on your device</p>
            </figure>
          </div>
        </section>

        {/* ═══════════ NUMBERS ═══════════ */}
        <ul className="hm-numbers hm-wrap" aria-label="At a glance">
          <li><b>{TOTAL_TOOLS}</b><span>tools</span></li>
          <li><b>34+</b><span>languages</span></li>
          <li><b>0</b><span>API keys</span></li>
          <li><b>0</b><span>sign-ups</span></li>
        </ul>

        {/* ═══════════ YUKTAI GRID ═══════════ */}
        <section className="hm-wrap hm-section" aria-labelledby="grid">
          <p className="hm-label">featured · yuktai v5.2</p>
          <div className="hm-feature">
            <div>
              <h2 id="grid" className="hm-h2">Talk to your data instead of building filters.</h2>
              <p className="hm-text">
                Yuktai Grid is an accessible data grid with an assistant inside. Type a question; it turns the words into
                real filters, sorting and summaries, and tells you what it did so you can check it. The demo pages through
                10 lakh rows, with nothing sent to an AI service.
              </p>
              <div className="hm-actions">
                <Link href="/staffdirectory" className="hm-btn hm-btn--ink">Open the demo <ArrowForwardRoundedIcon className="ico-18" /></Link>
                <Link href="/yuktai" className="hm-btn hm-btn--line">How it works</Link>
              </div>
            </div>

            <div className="hm-ask" aria-label="Example questions">
              {[
                { q: "salary over 1 lakh",           a: "filters the rows and shows the rule it used" },
                { q: "average salary by department", a: "groups the rows and answers in one line" },
                { q: "anything unusual?",            a: "flags outliers and duplicate rows" },
              ].map((s) => (
                <div key={s.q} className="hm-ask__row">
                  <span className="hm-ask__q"><span className="hm-ask__caret" aria-hidden>›</span> {s.q}</span>
                  <span className="hm-ask__a">{s.a}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ ALL TOOLS (same groups as the Navbar) ═══════════ */}
        <section id="tools" className="hm-wrap hm-section" aria-labelledby="all">
          <p className="hm-label">all tools · {TOTAL_TOOLS}</p>
          <h2 id="all" className="hm-h2">Pick a tool and start.</h2>
          <p className="hm-text hm-text--narrow">The same sections as the menu above. Every tool works on its own: no setup, no sign-in.</p>

          <nav className="hm-jump" aria-label="Jump to a section">
            {navGroups.map((g, i) => (
              <a key={g.group} href={`#${slug(g.group)}`}><span>{String(i + 1).padStart(2, "0")}</span> {g.group}</a>
            ))}
          </nav>

          {navGroups.map((g, i) => (
            <div key={g.group} id={slug(g.group)} className="hm-group">
              <div className="hm-group__head">
                <span className="hm-group__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="hm-group__title">{g.group}</h3>
                {GROUP_INTRO[g.group] && <p className="hm-group__intro">{GROUP_INTRO[g.group]}</p>}
              </div>
              <div className="hm-tools">
                {g.items.map((item) => <ToolCard key={item.href} item={item} />)}
              </div>
            </div>
          ))}
        </section>

        {/* ═══════════ CLOSING ═══════════ */}
        <section className="hm-close">
          <div className="hm-wrap">
            <p className="hm-label hm-label--light">no account needed</p>
            <h2 className="hm-close__title">Open a tool and start.</h2>
            <p className="hm-close__text">Everything runs in your browser. Questions, bugs and ideas are welcome on GitHub.</p>
            <div className="hm-actions hm-actions--center">
              <Link href="/upload" className="hm-btn hm-btn--brand">Start digitizing <ArrowForwardRoundedIcon className="ico-18" /></Link>
              <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noreferrer" className="hm-btn hm-btn--ghost-light">Yuktai on GitHub</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /yuktai — About Yuktai
// An open-source toolkit built in free time. Every demo on this page runs the
// real @yuktishaalaa/yuktai (v5.2+) code in your browser: no server, no API keys.
// All styles live in app/globals.css (section "ABOUT YUKTAI", classes yk-*).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

import {
  YuktaiGrid,
  AgenticGridBar,
  AgenticPanel,
  useAgenticGrid,
  CheckIcon,
  ChevronRightIcon,
} from "@yuktishaalaa/yuktai";

// MUI icons (yuktai has no equivalents yet)
import { GridViewRounded as GridViewRoundedIcon } from "../../lib/yuktai-icons";
import { AccessibilityNewRounded as AccessibilityNewRoundedIcon } from "../../lib/yuktai-icons";
import PsychologyRoundedIcon        from "@mui/icons-material/PsychologyRounded";
import ExploreRoundedIcon           from "@mui/icons-material/ExploreRounded";
import { BoltRounded as BoltRoundedIcon } from "../../lib/yuktai-icons";
import { AutoAwesomeRounded as AutoAwesomeRoundedIcon } from "../../lib/yuktai-icons";
import { ContentCopyRounded as ContentCopyRoundedIcon } from "../../lib/yuktai-icons";
import FavoriteRoundedIcon          from "@mui/icons-material/FavoriteRounded";
import TerminalRoundedIcon          from "@mui/icons-material/TerminalRounded";

// ── Sample data: volunteers of a made-up open-source project ─
type Volunteer = Record<string, unknown> & {
  id: number; name: string; city: string; language: string;
  role: string; contributions: number; joined: string;
};

const SAMPLE: Volunteer[] = [
  ["Anitha",  "Hyderabad",  "Telugu",    "Translator", 142,  "2024-03-12"],
  ["Rahul",   "Pune",       "Marathi",   "Developer",  318,  "2023-07-02"],
  ["Meera",   "Chennai",    "Tamil",     "Tester",     64,   "2025-01-20"],
  ["Farhan",  "Lucknow",    "Hindi",     "Translator", 97,   "2024-11-05"],
  ["Sowmya",  "Vijayawada", "Telugu",    "Designer",   41,   "2025-06-18"],
  ["Arjun",   "Bengaluru",  "Kannada",   "Developer",  1260, "2022-02-14"],
  ["Priya",   "Kochi",      "Malayalam", "Tester",     73,   "2024-08-30"],
  ["Ishaan",  "Kolkata",    "Bengali",   "Translator", 120,  "2023-12-01"],
  ["Lakshmi", "Hyderabad",  "Telugu",    "Developer",  205,  "2024-05-09"],
  ["Kiran",   "Ahmedabad",  "Gujarati",  "Designer",   38,   "2025-09-22"],
].map(([name, city, language, role, contributions, joined], i) => ({
  id: i + 1, name, city, language, role, contributions, joined,
})) as Volunteer[];

const LANGS = ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Odia", "Punjabi"];
const ROLES = ["Translator", "Developer", "Tester", "Designer", "Reviewer"];
const CITIES = ["Hyderabad", "Pune", "Chennai", "Lucknow", "Bengaluru", "Kochi", "Kolkata", "Ahmedabad", "Bhubaneswar", "Amritsar"];

/** 1,00,000 made-up rows, generated in the browser (no download). */
function makeRows(count: number): Volunteer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Volunteer ${i + 1}`,
    city: CITIES[i % 10],
    language: LANGS[(i * 7) % 10],
    role: ROLES[(i * 3) % 5],
    contributions: ((i * 37) % 900) + 1,
    joined: `202${2 + (i % 4)}-0${1 + (i % 9)}-1${i % 10}`,
  }));
}

const COLUMNS = [
  { key: "name",          label: "Name",          type: "text"   },
  { key: "city",          label: "City",          type: "text"   },
  { key: "language",      label: "Language",      type: "text"   },
  { key: "role",          label: "Role",          type: "text"   },
  { key: "contributions", label: "Contributions", type: "number" },
  { key: "joined",        label: "Joined",        type: "date"   },
];

// ── The six modules (from the developer guide) ───────────────
const MODULES: { icon: React.ElementType; title: string; text: string; code: string }[] = [
  { icon: GridViewRoundedIcon,         title: "YuktaiGrid",          text: "An accessible data grid you can talk to. Mobile cards, 5 WCAG themes, English and Telugu UI, and server mode for lakhs of rows.", code: "<YuktaiGrid ai webmcp />" },
  { icon: AutoAwesomeRoundedIcon,      title: "Agentic AI toolkit",  text: "10 agents: grid questions, trends, multi-step tasks, unusual rows, QA tests, form and design review, page Q&A, voice.", code: "useAgenticGrid · AgenticPanel" },
  { icon: AccessibilityNewRoundedIcon, title: "Accessibility engine", text: "WCAG 2.2 auto-fix, speak on focus, colour-blind modes, dyslexia font, large targets. Every fix can be undone.", code: "wcagPlugin · createA11yCopilot" },
  { icon: PsychologyRoundedIcon,       title: "Ask this page",       text: "In-browser RAG: Gemini Nano on desktop Chrome, Transformers.js on phones, keyword search that keeps Telugu words whole.", code: "askAboutPage · createContextIndex" },
  { icon: ExploreRoundedIcon,          title: "Autonomous agent",    text: "Type a goal in plain English. It reads the page, plans the steps and highlights what to do, even on old portals.", code: "showAgent" },
  { icon: BoltRoundedIcon,             title: "Vibe Coder",          text: "Describe a site and download a Next.js starter as a ZIP. Pure templates: no AI writes the code.", code: "showAgent → ⚡" },
];

const AGENTS = [
  "Smart grid questions", "Trends and group-by", "Multi-step tasks", "Unusual rows",
  "QA tester (15 WCAG checks)", "Accessibility copilot", "Page understanding",
  "Form review", "Design review", "Voice commands (English + Telugu)",
];

// ── Code samples ─────────────────────────────────────────────
const INSTALL_CODE = "npm install @yuktishaalaa/yuktai";

const AGENT_GRID_CODE = `"use client";
import { YuktaiGrid, AgenticGridBar, useAgenticGrid } from "@yuktishaalaa/yuktai";

export default function VolunteersPage({ rows, columns }) {
  // Plain-English questions → filters, sort, highlights, summaries
  const grid = useAgenticGrid({ data: rows, columns, rowKey: "id" });

  return (
    <>
      <AgenticGridBar grid={grid}
        examples={["contributions over 100", "anything unusual?", "average contributions by role"]} />
      <YuktaiGrid data={grid.gridData} highlightIds={grid.highlightIds} columns={columns} rowKey="id" />
    </>
  );
}`;

const BUILTIN_AGENT_CODE = `<YuktaiGrid
  data={rows}
  columns={columns}
  ai                       // built-in assistant: chat + voice
  inputLanguage="te-IN"    // voice input in Telugu (or any of 22 Indian languages)
  webmcp                   // the same grid tools for browser AI agents
  toolName="volunteers"
  customRules={[{
    name: "translators",
    phrases: ["translators", "అనువాదకులు"],   // teach it your own words
    execute: async ({ executeTool }) =>
      (await executeTool("filter", { key: "role", operator: "equals", value: "Translator" })).message,
  }]}
/>`;

// ═══════════════════════════════════════════════════════════
export default function AboutYuktai() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (code: string, id: string) => {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard blocked */ }
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Live demo: 10 sample rows, or 1,00,000 generated rows
  const [rows, setRows] = useState<Volunteer[]>(SAMPLE);
  const [genMs, setGenMs] = useState<number | null>(null);
  const big = rows.length > SAMPLE.length;
  const showSample = () => { grid.reset(); setRows(SAMPLE); setGenMs(null); };
  const showBig = () => {
    grid.reset();
    const t = performance.now();
    const r = makeRows(100_000);
    setGenMs(Math.round(performance.now() - t));
    setRows(r);
  };
  const grid = useAgenticGrid<Volunteer>({ data: rows, columns: COLUMNS, rowKey: "id" });

  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      {/* React 19 moves <title> into <head>; a client page can't export metadata */}
      <title>About Yuktai · open-source accessible, agentic AI</title>
      <Navbar />

      <main className="yk-main">
        {/* ═══════════ HERO ═══════════ */}
        <header className="yk-hero">
          <span className="yk-kicker">Open source · built in free time</span>
          <h1 className="yk-h1">
            <span className="yk-accent">yuktai</span>: accessible, agentic AI that runs in your browser
          </h1>
          <p className="yk-lead">
            A free React / Next.js toolkit: a data grid you can talk to, small AI agents that test and explain a page,
            and WCAG accessibility fixes. No API keys, no server, no cost. Your data never leaves the device.
          </p>
          <div className="yk-actions">
            <Link href="/staffdirectory" className="yk-btn yk-btn--primary">
              Try the Grid demo <ChevronRightIcon size={16} />
            </Link>
            <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noreferrer" className="yk-btn yk-btn--ghost">
              Source on GitHub
            </a>
            <button type="button" className="yk-btn yk-btn--code" onClick={() => copy(INSTALL_CODE, "install")} aria-label="Copy install command">
              <TerminalRoundedIcon className="ico-18" />
              <code>{INSTALL_CODE}</code>
              {copied === "install" ? <CheckIcon size={16} className="yk-ok" /> : <ContentCopyRoundedIcon className="ico-16" />}
            </button>
          </div>
          <ul className="yk-chips" aria-label="At a glance">
            {["Free and open source (ISC)", "Zero API keys", "Works offline", "English + Telugu", "Accessible by design"].map((c) => (
              <li key={c}><CheckIcon size={14} /> {c}</li>
            ))}
          </ul>
        </header>

        {/* ═══════════ IMPACT ═══════════ */}
        <section aria-labelledby="impact" className="yk-section">
          <h2 id="impact" className="yk-h2">Big data, small browser</h2>
          <div className="yk-stats">
            <Stat value="10,00,000" label="rows in the Grid demo, page by page from a real database" />
            <Stat value="1,00,000" label="rows generated and searched right here, in your browser" />
            <Stat value="10" label="agents that run with rules, not paid AI calls" />
            <Stat value="15" label="WCAG checks in the built-in QA tester" />
          </div>
        </section>

        {/* ═══════════ LIVE DEMO ═══════════ */}
        <section aria-labelledby="demo" className="yk-card">
          <h2 id="demo" className="yk-h2">Talk to a grid</h2>
          <p className="yk-text">
            Ask in plain English. The agent turns your words into filters, sorting and summaries, and every answer says
            what it did, so you can check it. Sample data: volunteers of an imaginary community project.
          </p>

          <div className="yk-toggle" role="group" aria-label="Data size">
            <button type="button" aria-pressed={!big} onClick={showSample}>10 sample rows</button>
            <button type="button" aria-pressed={big} onClick={showBig}>1,00,000 rows</button>
          </div>
          <p className="yk-note" aria-live="polite">
            {big
              ? `1,00,000 rows ${genMs !== null ? `created in ${genMs} ms` : "created"} in your browser. Try "contributions over 800" or "average contributions by language".`
              : "Try one of the examples, or type your own question. Each question builds on the last one; press Reset to start again."}
          </p>

          <AgenticGridBar
            grid={grid}
            placeholder="Ask the grid… e.g. Translator in Hyderabad"
            examples={
              big
                ? ["contributions over 800", "average contributions by language", "Developer in Pune"]
                : ["contributions over 100", "Translator in Hyderabad", "anything unusual?", "average contributions by role",
                   "show contributions over 50, then sort by contributions, then summarize"]
            }
          />
          <div className="yk-grid-wrap">
            <YuktaiGrid
              data={grid.gridData}
              // A filter already shows only the matches; highlight only answers that point at
              // specific rows (unusual rows, task steps), so 1 lakh results aren't all yellow
              highlightIds={grid.kind === "query" ? [] : grid.highlightIds}
              rowKey="id"
              search={false}
              pagination={big ? { pageSize: 20, showSizeChanger: true, sizeOptions: [20, 50, 100] } : false}
              columns={[
                { key: "name",          label: "Name",          sortable: true },
                { key: "city",          label: "City",          sortable: true },
                { key: "language",      label: "Language",      sortable: true },
                { key: "role",          label: "Role",          type: "badge" },
                { key: "contributions", label: "Contributions", sortable: true, type: "number", align: "right",
                  render: (v) => Number(v).toLocaleString("en-IN") },
                { key: "joined",        label: "Joined",        sortable: true, type: "date" },
              ]}
            />
          </div>
          <p className="yk-note">
            Want more? The <Link href="/staffdirectory" className="yk-link">Grid demo</Link> pages through 10 lakh rows from a
            database, and the browser only ever holds one page.
          </p>
        </section>

        {/* ═══════════ MODULES ═══════════ */}
        <section aria-labelledby="modules" className="yk-section">
          <h2 id="modules" className="yk-h2">What&apos;s inside: six modules, one install</h2>
          <div className="yk-modules">
            {MODULES.map((m) => (
              <article key={m.title} className="yk-module">
                <span className="yk-module__icon" aria-hidden><m.icon className="ico-22" /></span>
                <h3 className="yk-h3">{m.title}</h3>
                <p className="yk-text">{m.text}</p>
                <code className="yk-module__code">{m.code}</code>
              </article>
            ))}
          </div>
          <h3 className="yk-h3 yk-h3--spaced">The 10 agents in v5</h3>
          <ul className="yk-agents">
            {AGENTS.map((a) => <li key={a}><CheckIcon size={14} /> {a}</li>)}
          </ul>
        </section>

        {/* ═══════════ PAGE TOOLS ═══════════ */}
        <section aria-labelledby="tools" className="yk-card">
          <h2 id="tools" className="yk-h2">Test this page yourself</h2>
          <p className="yk-text">
            <code>AgenticPanel</code> puts six agents in one place: Copilot, QA report, Forms, Design, Ask page and Voice.
            Run the QA report on this very page and see what it finds.
          </p>
          <button type="button" className="yk-btn yk-btn--primary" aria-expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? "Hide the panel" : "Open the panel"}
          </button>
          {panelOpen && <div className="yk-panel"><AgenticPanel defaultTab="qa" voiceLang="en-IN" /></div>}
        </section>

        {/* ═══════════ STORY ═══════════ */}
        <section aria-labelledby="story" className="yk-section yk-story">
          <h2 id="story" className="yk-h2">How it&apos;s being built</h2>
          <ol className="yk-steps">
            <li><strong>Free time, real problems.</strong> Weekends and late nights. Every feature started with something that kept breaking on real websites: missing labels, forms older people couldn&apos;t finish, grids that broke on phones.</li>
            <li><strong>Learning by doing.</strong> Reading the WCAG spec, browser APIs and other open-source code, then trying things until they worked on a real page.</li>
            <li><strong>LLMs as study partners.</strong> Claude, GPT and Gemini helped explain ideas, find bugs and review code. The decisions, the testing and the mistakes stay human.</li>
            <li><strong>Built in public.</strong> The code is on GitHub. Issues, ideas and pull requests from the community are welcome.</li>
          </ol>
          <p className="yk-note">
            Honest limits: the agents understand questions with rules, so unusual phrasing may need rewording; smart grid
            questions are English-only for now; automatic checks don&apos;t replace testing with real users.
          </p>
        </section>

        {/* ═══════════ USE IT ═══════════ */}
        <section aria-labelledby="use" className="yk-card">
          <h2 id="use" className="yk-h2">Use it in your Next.js app</h2>
          <h3 className="yk-h3">1. A grid with your own question bar</h3>
          <CodeBlock code={AGENT_GRID_CODE} copied={copied === "agent"} onCopy={() => copy(AGENT_GRID_CODE, "agent")} />
          <h3 className="yk-h3 yk-h3--spaced">2. The built-in assistant, with your own words in any language</h3>
          <CodeBlock code={BUILTIN_AGENT_CODE} copied={copied === "builtin"} onCopy={() => copy(BUILTIN_AGENT_CODE, "builtin")} />
          <p className="yk-note">Works with React 17–19 and Next.js 13–16. With React 19, install with <code>--legacy-peer-deps</code>.</p>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="yk-footer">
          <span><FavoriteRoundedIcon className="yk-heart ico-16" /> Made in free time, shared for everyone.</span>
          <nav aria-label="yuktai links" className="yk-footer__links">
            <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noreferrer" className="yk-link">GitHub</a>
            <a href="https://www.npmjs.com/package/@yuktishaalaa/yuktai" target="_blank" rel="noreferrer" className="yk-link">npm</a>
            <Link href="/staffdirectory" className="yk-link">Grid demo</Link>
          </nav>
        </footer>
      </main>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="yk-stat">
      <span className="yk-stat__value">{value}</span>
      <span className="yk-stat__label">{label}</span>
    </div>
  );
}

function CodeBlock({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="yk-code">
      <pre className="yk-pre"><code>{code}</code></pre>
      <button type="button" onClick={onCopy} aria-label="Copy code" className="yk-copy">
        {copied ? <CheckIcon size={18} className="yk-ok" /> : <ContentCopyRoundedIcon className="ico-18" />}
      </button>
    </div>
  );
}
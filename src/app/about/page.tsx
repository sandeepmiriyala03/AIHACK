"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /about — About yuktai (v5.3.4)
// An open-source toolkit built in free time. Every demo on this page runs the
// real @yuktishaalaa/yuktai code in your browser: no yuktai server, no API keys.
// Base styles: Styles/globals.css (section "ABOUT YUKTAI", classes yk-*).
// Styles for the newer sections are at the bottom of this file (classes yx-*).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

import { YuktaiGrid, AgenticGridBar, AgenticPanel, useAgenticGrid } from "@yuktishaalaa/yuktai";
import {
  YuktaiIcon,
  ICON_NAMES,
  type IconName,
  AccessibilityIcon,
  ArrowRightIcon,
  BrainIcon,
  ChatIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  ExploreIcon,
  ExternalIcon,
  FactCheckIcon,
  GlobeIcon,
  GridIcon,
  HeartFilledIcon,
  LayoutIcon,
  MicIcon,
  PaletteIcon,
  PlugIcon,
  SearchIcon,
  SparkIcon,
  StorageIcon,
  ToolsIcon,
  WandIcon,
  iconContrast,
} from "@yuktishaalaa/yuktai/icons";

const VERSION = "5.3.4";
const URLS = {
  github: "https://github.com/sandeepmiriyala03/yuktai",
  npm: "https://www.npmjs.com/package/@yuktishaalaa/yuktai",
  demo: "https://sandeepmiriyala03.github.io/yuktai/vanilla/",
  readme: "https://github.com/sandeepmiriyala03/yuktai#readme",
  icons: "https://github.com/sandeepmiriyala03/yuktai#icons",
  issues: "https://github.com/sandeepmiriyala03/yuktai/issues",
  releases: "https://github.com/sandeepmiriyala03/yuktai/releases",
  security: "https://github.com/sandeepmiriyala03/yuktai/security/policy",
  guide: "https://github.com/sandeepmiriyala03/yuktai/blob/main/YuktAI_Developer_Guide_v5.3.4.pdf",
  jsdelivr: "https://cdn.jsdelivr.net/npm/@yuktishaalaa/yuktai@5/vanilla/index.min.js",
  unpkg: "https://unpkg.com/@yuktishaalaa/yuktai@5/vanilla/index.min.js",
  xerjHub: "https://hub.xerj.org",
  xerjProfile: "https://hub.xerj.org/contributors/sandeepmiriyala03",
  xerjBadge: "https://hub.xerj.org/contributors/sandeepmiriyala03/badge.svg",
  // same badge, served by /api/xerj-badge: the site's COEP header blocks images from other origins
  xerjBadgeLocal: "/api/xerj-badge",
  xerjCorpus: "https://hub.xerj.org/corpus/sandeepmiriyala03--yuktai",
  author: "https://github.com/sandeepmiriyala03",
};

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

// ── Every feature, one by one ────────────────────────────────
type Feature = {
  icon: React.ElementType; title: string; text: string; points: string[]; code: string;
  link?: { href: string; label: string; external?: boolean }; isNew?: boolean;
};

const FEATURES: Feature[] = [
  {
    icon: GridIcon, title: "YuktaiGrid",
    text: "An accessible data grid: search, sort, pages, row selection and CSV export, with full keyboard support.",
    points: ["Mobile card view, 5 WCAG themes", "English and Telugu interface", "Server mode for lakhs of rows"],
    code: `<YuktaiGrid data={rows} columns={columns} rowKey="id" />`,
    link: { href: "/staffdirectory", label: "Open the Grid demo" },
  },
  {
    icon: SparkIcon, title: "Talk to your data",
    text: "useAgenticGrid and AgenticGridBar turn plain sentences into real filters, sorting and summaries.",
    points: ["Understands 10k, lakh and crore", "Group-by, trends, unusual rows", "Multi-step tasks: filter, then sort, then summarize"],
    code: `const grid = useAgenticGrid({ data: rows, columns, rowKey: "id" })\n<AgenticGridBar grid={grid} />`,
  },
  {
    icon: ChatIcon, title: "Grid assistant and WebMCP",
    text: "A built-in chat and voice assistant for the grid. Teach it your own words, in any language.",
    points: ["Voice input in 22 Indian languages", "Custom rules run before the built-in parser", "WebMCP: the same tools for browser AI agents"],
    code: `<YuktaiGrid ai webmcp inputLanguage="te-IN" customRules={rules} />`,
  },
  {
    icon: FactCheckIcon, title: "Page agents",
    text: "Small agents that test and explain any page, with results you can read and share.",
    points: ["QA tester: 15 WCAG checks, 0–100 score", "Form review and design review", "Reports as Markdown or JSON"],
    code: `const report = runQaAudit()\nauditToMarkdown(report)`,
    link: { href: "/test-your-website", label: "Test your website" },
  },
  {
    icon: LayoutIcon, title: "AgenticPanel",
    text: "Six page tools in one panel: Copilot, QA report, Forms, Design, Ask page and Voice.",
    points: ["Drop it into any page", "Works on top of your existing layout", "Never audits its own panel"],
    code: `<AgenticPanel defaultTab="qa" voiceLang="en-IN" />`,
  },
  {
    icon: AccessibilityIcon, title: "Accessibility engine",
    text: "WCAG 2.2 fixes that run in the browser, and a copilot that explains each issue first.",
    points: ["Speak on focus, colour-blind modes, dyslexia font", "Large targets and skip links", "Every automatic fix can be undone"],
    code: `wcagPlugin.execute(config)\ncreateA11yCopilot().applyAllFixes()`,
  },
  {
    icon: MicIcon, title: "Voice commands",
    text: "Control reading and accessibility settings by voice, in English and Telugu.",
    points: ["“bigger text”, “next row”, “dark mode”", "Telugu phrases too", "Uses the browser's speech recognition"],
    code: `createVoiceA11yController({ lang: "te-IN" })`,
  },
  {
    icon: BrainIcon, title: "Ask this page",
    text: "Questions about the current page, answered in the browser.",
    points: ["Gemini Nano on desktop Chrome", "Transformers.js on phones", "Keyword search keeps Telugu words whole"],
    code: `await askAboutPage("Which fields have no label?")`,
  },
  {
    icon: ExploreIcon, title: "Autonomous agent",
    text: "Type a goal in plain English. It reads the page, plans the steps and highlights what to do.",
    points: ["Works on old portals too", "Shows each step on the page", "You stay in control"],
    code: `showAgent()`,
  },
  {
    icon: WandIcon, title: "Vibe Coder",
    text: "Describe a site and download a Next.js starter as a ZIP.",
    points: ["Pure templates", "No AI writes the code", "Ready to run with npm run dev"],
    code: `showAgent() → Vibe Coder`,
  },
  {
    icon: CodeIcon, title: "Plain HTML (vanilla JS)", isNew: true,
    text: "Every module for pages without React: one script tag, built from the same source as the npm package.",
    points: ["Grid, agents, panel and engine", "Installable, offline demo app", "CDN builds on jsDelivr and unpkg"],
    code: `<script src="${URLS.jsdelivr}"></script>`,
    link: { href: URLS.demo, label: "Open the live demo", external: true },
  },
  {
    icon: PaletteIcon, title: "163 yuktai icons", isNew: true,
    text: "One icon set for Next.js, React and plain HTML, safe in Server Components. Browse them all below.",
    points: ["Outline and filled styles", "Glyph colour picked for 3:1 contrast", "Works in Windows High Contrast"],
    code: `import { HomeIcon } from "@yuktishaalaa/yuktai/icons"`,
    link: { href: "#icons", label: "Browse the icons" },
  },
  {
    icon: ToolsIcon, title: "Switch a whole project", isNew: true,
    text: "Scripts that move Material, Lucide, Feather and react-icons to yuktai icons, then show every pair side by side.",
    points: ["Scan first, nothing changes", "Keeps sx, fontSize and color working", "Review page to check each icon"],
    code: `node use-yuktai-icons.mjs --dry`,
    link: { href: URLS.icons, label: "How it works", external: true },
  },
  {
    icon: PlugIcon, title: "Bring your own model",
    text: "Everything works without AI keys. If you want, plug your own model into the same tools.",
    points: ["generate and summarize hooks", "Your app decides what is sent", "Optional, never required"],
    code: `<AgenticPanel generate={(q, ctx) => myModel(q, ctx)} />`,
  },
  {
    icon: StorageIcon, title: "Large datasets",
    text: "The browser only ever holds one page of data, so the same grid scales to lakhs of rows.",
    points: ["Server paging, search and sort", "1,00,000 rows in the browser below", "10,00,000 rows in the Grid demo"],
    code: `<YuktaiGrid serverMode onQueryChange={load} />`,
    link: { href: "/staffdirectory", label: "See 10 lakh rows" },
  },
];

const SITES = [
  { name: "AksharaTantra", url: "https://aksharatantra.miriyala.in", text: "Indic OCR, voice and Vedic tools, with the agentic grid" },
  { name: "Ratnalabala", url: "https://ratnalabala.vercel.app", text: "Telugu literary archive and document tools" },
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

const ICONS_CODE = `// Works in Server Components: no "use client" needed
import { HomeIcon, MicIcon, LampIcon, YuktaiIcon } from "@yuktishaalaa/yuktai/icons";

<button type="button" aria-label="Start voice"><MicIcon /></button>
<HomeIcon size={24} label="Home" />
<LampIcon variant="filled" color="#047857" size={32} />
<YuktaiIcon name="temple" />`;

const VANILLA_CODE = `<div id="staff"></div>
<span data-icon="home"></span>
<script src="${URLS.jsdelivr}"></script>
<script>
  yuktai.renderGrid("#staff", { data: rows, columns, rowKey: "id", agentic: true, ai: true })
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = yuktai.icon(el.dataset.icon, 22)
  })
</script>`;

const SWITCH_CODE = `npm install @yuktishaalaa/yuktai@latest
node use-yuktai-icons.mjs --dry        # preview, writes nothing
node use-yuktai-icons.mjs              # Material, Lucide, Feather, react-icons → yuktai
node review-yuktai-icons.mjs           # original and yuktai icon, side by side
npx tsc --noEmit`;

// Component name for an icon name (home → HomeIcon, left → ChevronLeftIcon)
const componentName = (n: string) =>
  ({ left: "ChevronLeftIcon", right: "ChevronRightIcon" } as Record<string, string>)[n] ?? n[0].toUpperCase() + n.slice(1) + "Icon";

const COLOURS = [
  { value: "#047857", label: "Green" },
  { value: "#005A9C", label: "Blue" },
  { value: "#001124", label: "Navy" },
  { value: "#b45309", label: "Amber" },
];

// ═══════════════════════════════════════════════════════════
export default function AboutYuktai() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (code: string, id: string) => {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard blocked */ }
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
  };

  // Live demo: 10 sample rows, or 1,00,000 generated rows
  const [rows, setRows] = useState<Volunteer[]>(SAMPLE);
  const [genMs, setGenMs] = useState<number | null>(null);
  const big = rows.length > SAMPLE.length;
  const grid = useAgenticGrid<Volunteer>({ data: rows, columns: COLUMNS, rowKey: "id" });
  const showSample = () => { grid.reset(); setRows(SAMPLE); setGenMs(null); };
  const showBig = () => {
    grid.reset();
    const t = performance.now();
    const r = makeRows(100_000);
    setGenMs(Math.round(performance.now() - t));
    setRows(r);
  };

  const [panelOpen, setPanelOpen] = useState(false);

  // Icon gallery
  const [query, setQuery] = useState("");
  const [variant, setVariant] = useState<"outline" | "filled">("outline");
  const [colour, setColour] = useState(COLOURS[0].value);
  const [size, setSize] = useState(24);
  const [picked, setPicked] = useState<string>("EyeOffIcon");
  // The copied code carries the chosen style, colour and size
  const codeFor = (c: string) =>
    `<${c}${size !== 20 ? ` size={${size}}` : ""}${variant === "filled" ? ` variant="filled"` : ""} color="${colour}" />`;
  // Outline icons sit on the page background: check 3:1 against white (WCAG 1.4.11)
  const contrast = iconContrast(colour, "#ffffff");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (ICON_NAMES as IconName[]).filter((n) => !q || n.toLowerCase().includes(q) || componentName(n).toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      {/* React 19 moves <title> into <head>; a client page can't export metadata */}
      <title>About yuktai · accessible, agentic AI for the web</title>
      <style>{YX_CSS}</style>
      <Navbar />

      <main className="yk-main">
        {/* ═══════════ HERO ═══════════ */}
        <header className="yk-hero">
          <span className="yk-kicker">Open source · v{VERSION}</span>
          <h1 className="yk-h1">
            <span className="yk-accent">yuktai</span>: accessible, agentic AI that runs in your browser
          </h1>
          <p className="yk-lead">
            One free toolkit for Next.js, React and plain HTML: a data grid you can talk to, small agents that test and
            explain a page, WCAG accessibility fixes and 163 icons. No API keys and no yuktai servers.
          </p>
          <div className="yk-actions">
            <Link href="/staffdirectory" className="yk-btn yk-btn--primary">
              Try the Grid demo <ArrowRightIcon size={16} />
            </Link>
            <a href={URLS.demo} target="_blank" rel="noreferrer" className="yk-btn yk-btn--ghost">
              Plain HTML demo <ExternalIcon size={15} />
            </a>
            <a href={URLS.github} target="_blank" rel="noreferrer" className="yk-btn yk-btn--ghost">
              Source on GitHub <ExternalIcon size={15} />
            </a>
            <button type="button" className="yk-btn yk-btn--code" onClick={() => copy(INSTALL_CODE, "install")} aria-label="Copy install command">
              <CodeIcon size={18} />
              <code>{INSTALL_CODE}</code>
              {copied === "install" ? <CheckIcon size={16} className="yk-ok" /> : <CopyIcon size={16} />}
            </button>
          </div>
          <ul className="yk-chips" aria-label="At a glance">
            {["Free and open source (GPL-3.0)", "Zero API keys", "Next.js, React and plain HTML", "163 icons", "English + Telugu", "Accessible by design"].map((c) => (
              <li key={c}><CheckIcon size={14} /> {c}</li>
            ))}
          </ul>
          <a href={URLS.xerjProfile} target="_blank" rel="noreferrer" className="yx-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URLS.xerjBadgeLocal} alt="XERJ Corpus Hub contributor badge" height={28} />
          </a>
        </header>

        {/* ═══════════ IMPACT ═══════════ */}
        <section aria-labelledby="impact" className="yk-section">
          <h2 id="impact" className="yk-h2">Big data, small browser</h2>
          <div className="yk-stats">
            <Stat value="10,00,000" label="rows in the Grid demo, page by page from a real database" />
            <Stat value="1,00,000" label="rows generated and searched right here, in your browser" />
            <Stat value="10" label="agents that run with rules, not paid AI calls" />
            <Stat value="15" label="WCAG checks in the built-in QA tester" />
            <Stat value="163" label="icons for Next.js, React and plain HTML" />
            <Stat value="1" label="script tag for any HTML page" />
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

        {/* ═══════════ EVERY FEATURE ═══════════ */}
        <section aria-labelledby="features" className="yk-section">
          <h2 id="features" className="yk-h2">Every feature, one by one</h2>
          <p className="yk-text">{FEATURES.length} features in one install. Each card says what it does and how to use it.</p>
          <ol className="yx-features">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="yx-feature">
                <div className="yx-feature__head">
                  <span className="yx-feature__icon" aria-hidden><f.icon size={24} /></span>
                  <span className="yx-feature__num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  {f.isNew && <span className="yx-new">New in 5.3</span>}
                </div>
                <h3 className="yk-h3">{f.title}</h3>
                <p className="yk-text">{f.text}</p>
                <ul className="yx-points">
                  {f.points.map((p) => <li key={p}><CheckIcon size={14} /> {p}</li>)}
                </ul>
                <code className="yx-feature__code">{f.code}</code>
                {f.link && (f.link.external
                  ? <a href={f.link.href} target="_blank" rel="noreferrer" className="yk-link yx-more">{f.link.label} <ExternalIcon size={14} /></a>
                  : <Link href={f.link.href} className="yk-link yx-more">{f.link.label} <ArrowRightIcon size={14} /></Link>)}
              </li>
            ))}
          </ol>
        </section>

        {/* ═══════════ ICON GALLERY ═══════════ */}
        <section aria-labelledby="icons" id="icons" className="yk-card">
          <h2 className="yk-h2" id="icons-title">All {ICON_NAMES.length} yuktai icons</h2>
          <p className="yk-text">
            Pick a style, a colour and a size, then click any icon. The code it copies already has your choices in it.
            Filled icons choose a white or dark glyph automatically, so they keep at least 3:1 contrast.
          </p>
          <div className="yx-tools">
            <label className="yx-search">
              <SearchIcon size={18} />
              <span className="yx-sr">Search icons</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: home, lock, chart…" />
            </label>
            <div className="yk-toggle" role="group" aria-label="Icon style">
              <button type="button" aria-pressed={variant === "outline"} onClick={() => setVariant("outline")}>Outline</button>
              <button type="button" aria-pressed={variant === "filled"} onClick={() => setVariant("filled")}>Filled</button>
            </div>
            <div className="yx-colours" role="radiogroup" aria-label="Icon colour">
              {COLOURS.map((c) => (
                <button key={c.value} type="button" role="radio" aria-checked={colour.toLowerCase() === c.value.toLowerCase()} aria-label={c.label}
                  className="yx-swatch" style={{ background: c.value }} onClick={() => setColour(c.value)} />
              ))}
              <label className="yx-custom" title="Any colour">
                <span className="yx-sr">Any colour</span>
                <input type="color" value={colour} onChange={(e) => setColour(e.target.value)} />
              </label>
            </div>
            <div className="yk-toggle" role="group" aria-label="Icon size">
              {[20, 24, 32].map((n) => (
                <button key={n} type="button" aria-pressed={size === n} onClick={() => setSize(n)}>{n}px</button>
              ))}
            </div>
          </div>

          <div className="yx-codeline">
            <YuktaiIcon name={(ICON_NAMES as IconName[]).find((n) => componentName(n) === picked) ?? "eyeOff"} size={size} variant={variant} color={colour} />
            <code>{codeFor(picked)}</code>
            <button type="button" className="yk-btn yk-btn--ghost yx-copybtn" onClick={() => copy(codeFor(picked), "icon:" + picked)}>
              {copied === "icon:" + picked ? <CheckIcon size={16} /> : <CopyIcon size={16} />} Copy
            </button>
          </div>
          <p className={`yk-note${variant === "outline" && contrast !== null && contrast < 3 ? " yx-warn" : ""}`} aria-live="polite">
            {copied?.startsWith("icon:")
              ? `Copied ${codeFor(copied.slice(5))}`
              : variant === "outline" && contrast !== null
                ? `${shown.length} of ${ICON_NAMES.length} icons · this colour on white: ${contrast.toFixed(1)}:1 ${contrast >= 3 ? "(passes WCAG 3:1 for icons)" : "(too light: below WCAG 3:1, pick a darker colour)"}`
                : `${shown.length} of ${ICON_NAMES.length} icons`}
          </p>
          <ul className="yx-icons">
            {shown.map((n) => {
              const c = componentName(n);
              return (
                <li key={n}>
                  <button type="button" className="yx-icon" aria-pressed={picked === c}
                    onClick={() => { setPicked(c); copy(codeFor(c), "icon:" + c); }} aria-label={`Copy ${codeFor(c)}`}>
                    <YuktaiIcon name={n} size={28} variant={variant} color={colour} />
                    <span>{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {shown.length === 0 && <p className="yk-note">No icon matches “{query}”.</p>}
        </section>

        {/* ═══════════ USED IN ═══════════ */}
        <section aria-labelledby="sites" className="yk-section">
          <h2 id="sites" className="yk-h2">Live on real sites</h2>
          <p className="yk-text">These sites use yuktai icons for every icon, after switching with the yuktai scripts.</p>
          <ul className="yx-sites">
            {SITES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="yx-site">
                  <span className="yx-site__top"><GlobeIcon size={20} /> <strong>{s.name}</strong> <ExternalIcon size={14} /></span>
                  <span className="yx-site__text">{s.text}</span>
                  <span className="yx-site__tag"><CheckIcon size={13} /> 100% yuktai icons</span>
                </a>
              </li>
            ))}
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

        {/* ═══════════ USE IT ═══════════ */}
        <section aria-labelledby="use" className="yk-card">
          <h2 id="use" className="yk-h2">Use it in your project</h2>
          <h3 className="yk-h3">1. A grid with your own question bar (Next.js)</h3>
          <CodeBlock code={AGENT_GRID_CODE} copied={copied === "agent"} onCopy={() => copy(AGENT_GRID_CODE, "agent")} />
          <h3 className="yk-h3 yk-h3--spaced">2. The built-in assistant, with your own words in any language</h3>
          <CodeBlock code={BUILTIN_AGENT_CODE} copied={copied === "builtin"} onCopy={() => copy(BUILTIN_AGENT_CODE, "builtin")} />
          <h3 className="yk-h3 yk-h3--spaced">3. Icons in Next.js</h3>
          <CodeBlock code={ICONS_CODE} copied={copied === "icons"} onCopy={() => copy(ICONS_CODE, "icons")} />
          <h3 className="yk-h3 yk-h3--spaced">4. Plain HTML: one script tag</h3>
          <CodeBlock code={VANILLA_CODE} copied={copied === "vanilla"} onCopy={() => copy(VANILLA_CODE, "vanilla")} />
          <h3 className="yk-h3 yk-h3--spaced">5. Switch an existing project to yuktai icons</h3>
          <CodeBlock code={SWITCH_CODE} copied={copied === "switch"} onCopy={() => copy(SWITCH_CODE, "switch")} />
          <p className="yk-note">Works with React 17–19, Next.js 13–16 and any HTML page. With React 19, install with <code>--legacy-peer-deps</code> if npm asks.</p>
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

        {/* ═══════════ XERJ ═══════════ */}
        <section aria-labelledby="xerj" className="yk-card yx-xerj">
          <h2 id="xerj" className="yk-h2">yuktai on XERJ</h2>
          <p className="yk-text">
            yuktai&apos;s author is a contributor on the XERJ Corpus Hub, and the yuktai repository has its own corpus page there.
          </p>
          <a href={URLS.xerjProfile} target="_blank" rel="noreferrer" className="yx-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URLS.xerjBadgeLocal} alt="XERJ Corpus Hub contributor badge" height={32} />
          </a>
          <ul className="yx-links yx-links--row">
            <li><a href={URLS.xerjProfile} target="_blank" rel="noreferrer" className="yk-link">Contributor profile <ExternalIcon size={14} /></a></li>
            <li><a href={URLS.xerjCorpus} target="_blank" rel="noreferrer" className="yk-link">yuktai corpus page <ExternalIcon size={14} /></a></li>
            <li><a href={URLS.xerjHub} target="_blank" rel="noreferrer" className="yk-link">XERJ Corpus Hub <ExternalIcon size={14} /></a></li>
          </ul>
        </section>

        {/* ═══════════ ALL LINKS ═══════════ */}
        <section aria-labelledby="links" className="yk-section">
          <h2 id="links" className="yk-h2">All links</h2>
          <div className="yx-linkgrid">
            <LinkGroup title="Code and package" links={[
              ["GitHub repository", URLS.github], ["npm package", URLS.npm], ["README", URLS.readme],
              ["Releases", URLS.releases], ["Issues and ideas", URLS.issues], ["Security policy", URLS.security],
            ]} />
            <LinkGroup title="Try it" links={[
              ["Live demo (plain HTML, installable)", URLS.demo], ["Grid demo, 10 lakh rows", "/staffdirectory"],
              ["Test your website", "/test-your-website"], ["Icons in the README", URLS.icons],
              ["Developer guide (PDF)", URLS.guide],
            ]} />
            <LinkGroup title="CDN and XERJ" links={[
              ["jsDelivr build", URLS.jsdelivr], ["unpkg build", URLS.unpkg],
              ["XERJ contributor profile", URLS.xerjProfile], ["XERJ yuktai corpus", URLS.xerjCorpus],
              ["Author on GitHub", URLS.author],
            ]} />
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="yk-footer">
          <span><HeartFilledIcon size={16} className="yk-heart" /> Made in free time, shared for everyone. GPL-3.0.</span>
          <nav aria-label="yuktai links" className="yk-footer__links">
            <a href={URLS.github} target="_blank" rel="noreferrer" className="yk-link">GitHub</a>
            <a href={URLS.npm} target="_blank" rel="noreferrer" className="yk-link">npm</a>
            <a href={URLS.demo} target="_blank" rel="noreferrer" className="yk-link">Live demo</a>
            <a href={URLS.xerjProfile} target="_blank" rel="noreferrer" className="yk-link">XERJ</a>
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
        {copied ? <CheckIcon size={18} className="yk-ok" /> : <CopyIcon size={18} />}
      </button>
    </div>
  );
}

function LinkGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="yx-linkgroup">
      <h3 className="yk-h3">{title}</h3>
      <ul className="yx-links">
        {links.map(([label, href]) => (
          <li key={href}>
            {href.startsWith("/")
              ? <Link href={href} className="yk-link">{label} <ArrowRightIcon size={14} /></Link>
              : <a href={href} target="_blank" rel="noreferrer" className="yk-link">{label} <ExternalIcon size={14} /></a>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Styles for the newer sections (yx-*), same palette as yk-* ──
const YX_CSS = `
.yx-badge{display:inline-flex;align-items:center;min-height:44px;margin-top:14px}
.yx-badge img{display:block;height:28px;width:auto}
.yx-xerj .yx-badge img{height:32px}
.yx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.yk-link svg,.yk-btn svg{flex-shrink:0;vertical-align:-2px}

.yx-features{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px;counter-reset:none}
.yx-feature{position:relative;border:1px solid #e2e8f0;border-radius:16px;padding:20px;background:#fff;display:flex;flex-direction:column;
  transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
.yx-feature:hover{transform:translateY(-2px);border-color:#a7f3d0;box-shadow:0 12px 28px -14px rgba(4,120,87,.4)}
.yx-feature__head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.yx-feature__icon{width:44px;height:44px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;
  background:linear-gradient(150deg,#ecfdf5,#d1fae5);color:var(--brand)}
.yx-feature__num{margin-left:auto;font:700 13px var(--font-mono);color:#64748b;letter-spacing:.06em}
.yx-new{font-size:12px;font-weight:700;color:#7c2d12;background:#ffedd5;border:1px solid #fdba74;border-radius:999px;padding:2px 10px}
.yx-points{list-style:none;padding:0;margin:0 0 14px;display:grid;gap:4px;font-size:14.5px;color:#334155}
.yx-points li{display:flex;align-items:flex-start;gap:6px}
.yx-points svg{color:var(--brand);margin-top:5px;flex-shrink:0}
.yx-feature__code{margin-top:auto;display:block;white-space:pre-wrap;overflow-wrap:anywhere;font:12.5px/1.5 var(--font-mono);
  color:#065f46;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px}
.yx-more{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin-top:6px;align-self:flex-start}

.yx-tools{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:4px 0 6px}
.yx-search{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 12px;border:1.5px solid #94a3b8;border-radius:10px;
  background:#fff;color:#475569;flex:1 1 240px;max-width:360px}
.yx-search:focus-within{border-color:var(--brand);outline:3px solid var(--brand-bright);outline-offset:2px}
.yx-search input{border:none;outline:none;background:transparent;font:15px var(--font-sans);color:#0f172a;width:100%;min-height:40px}
.yx-colours{display:flex;gap:8px}
.yx-swatch{width:32px;height:32px;border-radius:999px;border:3px solid #fff;box-shadow:0 0 0 1.5px #94a3b8;cursor:pointer}
.yx-swatch[aria-checked="true"]{box-shadow:0 0 0 3px #0f172a}
.yx-swatch:focus-visible{outline:3px solid var(--brand-bright);outline-offset:3px}
.yx-icons{list-style:none;padding:0;margin:14px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.yx-icon[aria-pressed="true"]{border-color:var(--brand);box-shadow:0 0 0 2px var(--brand) inset;background:#f0fdf4}
.yx-custom{position:relative;width:32px;height:32px;border-radius:999px;overflow:hidden;box-shadow:0 0 0 1.5px #94a3b8;cursor:pointer;
  background:conic-gradient(#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6,#ef4444)}
.yx-custom input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0}
.yx-custom:focus-within{outline:3px solid var(--brand-bright);outline-offset:3px}
.yx-codeline{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:12px 0 0;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}
.yx-codeline code{flex:1 1 260px;font:13px/1.5 var(--font-mono);color:#065f46;overflow-wrap:anywhere}
.yx-copybtn{min-height:40px;padding:6px 14px}
.yx-warn{color:#9a3412;font-weight:600}
.yx-icon{width:100%;min-height:88px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  border:1px solid #e2e8f0;border-radius:12px;background:#fff;color:#0f172a;cursor:pointer;padding:10px 4px;
  font:12px var(--font-mono);transition:border-color .12s ease,background .12s ease}
.yx-icon span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569}
.yx-icon:hover{border-color:var(--brand);background:#f0fdf4}
.yx-icon:focus-visible{outline:3px solid var(--brand-bright);outline-offset:2px}

.yx-sites{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}
.yx-site{display:flex;flex-direction:column;gap:6px;height:100%;border:1px solid #e2e8f0;border-radius:14px;padding:16px;background:#fff;
  color:#0f172a;text-decoration:none;transition:border-color .15s ease,box-shadow .15s ease}
.yx-site:hover{border-color:#a7f3d0;box-shadow:0 10px 24px -14px rgba(4,120,87,.4)}
.yx-site:focus-visible{outline:3px solid var(--brand-bright);outline-offset:2px}
.yx-site__top{display:flex;align-items:center;gap:8px;color:var(--brand)}
.yx-site__top strong{color:#0f172a}
.yx-site__text{font-size:14px;color:#475569}
.yx-site__tag{margin-top:auto;display:inline-flex;align-items:center;gap:5px;align-self:flex-start;font-size:12.5px;font-weight:700;
  color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:2px 10px}

.yx-xerj{background:linear-gradient(160deg,#f8fafc,#ffffff 60%)}
.yx-linkgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px}
.yx-linkgroup{border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;background:#fff}
.yx-links{list-style:none;padding:0;margin:0}
.yx-links .yk-link{display:inline-flex;align-items:center;gap:6px;min-height:40px}
.yx-links--row{display:flex;flex-wrap:wrap;gap:4px 20px;margin-top:6px}

@media (prefers-reduced-motion:reduce){.yx-feature,.yx-site,.yx-icon{transition:none}.yx-feature:hover{transform:none}}
@media (forced-colors:active){.yx-swatch{forced-color-adjust:none}}
`;

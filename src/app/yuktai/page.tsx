"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /yuktai — About Yuktai (v5 agentic AI)
// Every demo on this page calls the real @yuktishaalaa/yuktai functions in the
// browser. Nothing is simulated, nothing is sent to a server, no API keys.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

import {
  // UI
  YuktaiGrid,
  AgenticGridBar,
  AgenticPanel,
  useAgenticGrid,
  // Agentic functions
  runQaAudit,
  auditToMarkdown,
  askAboutPage,
  planTasks,
  reviewDesign,
  parseVoiceA11yCommand,
  // Types
  type AuditReport,
  type PageAnswer,
  type PlannedStep,
  type DesignReview,
  // Icons
  CheckIcon,
  SearchIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@yuktishaalaa/yuktai";

// ── MUI icons (yuktai has no equivalents yet) ──
import PlayArrowRoundedIcon               from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon                   from "@mui/icons-material/PauseRounded";
import StopRoundedIcon                    from "@mui/icons-material/StopRounded";
import TerminalRoundedIcon                from "@mui/icons-material/TerminalRounded";
import PsychologyRoundedIcon              from "@mui/icons-material/PsychologyRounded";
import AccessibilityNewRoundedIcon        from "@mui/icons-material/AccessibilityNewRounded";
import AutoAwesomeRoundedIcon             from "@mui/icons-material/AutoAwesomeRounded";
import IntegrationInstructionsRoundedIcon from "@mui/icons-material/IntegrationInstructionsRounded";
import ComputerRoundedIcon                from "@mui/icons-material/ComputerRounded";
import CodeRoundedIcon                    from "@mui/icons-material/CodeRounded";
import ContentCopyRoundedIcon             from "@mui/icons-material/ContentCopyRounded";
import GridViewRoundedIcon                from "@mui/icons-material/GridViewRounded";
import FactCheckRoundedIcon               from "@mui/icons-material/FactCheckRounded";
const G_DARK    = "#047857";   // text/buttons on white (passes 4.5:1)
const TEXT_MAIN = "#0f172a";
const FG_CODE   = "#34d399";

// ── Sample data for the live grid agent demo (made up) ───────
type Staff = Record<string, unknown> & {
  id: number; name: string; city: string; department: string;
  salary: number; joined: string; status: string;
};

const SAMPLE: Staff[] = [
  { id: 1,  name: "Ravi Kumar",    city: "Hyderabad", department: "Engineering", salary: 145000, joined: "2024-03-12", status: "Active"   },
  { id: 2,  name: "Sneha Varma",   city: "Bengaluru", department: "Design",      salary: 92000,  joined: "2025-08-03", status: "Active"   },
  { id: 3,  name: "Imran Shaikh",  city: "Mumbai",    department: "Finance",     salary: 118000, joined: "2022-06-22", status: "On leave" },
  { id: 4,  name: "Kavya Iyer",    city: "Chennai",   department: "Engineering", salary: 162000, joined: "2026-10-07", status: "Active"   },
  { id: 5,  name: "Arjun Mehta",   city: "Delhi",     department: "Sales",       salary: 76000,  joined: "2024-09-30", status: "Active"   },
  { id: 6,  name: "Lakshmi Rao",   city: "Hyderabad", department: "HR",          salary: 68000,  joined: "2023-05-05", status: "Active"   },
  { id: 7,  name: "Vikram Joshi",  city: "Pune",      department: "Engineering", salary: 520000, joined: "2021-11-11", status: "Active"   },
  { id: 8,  name: "Priya Nair",    city: "Kochi",     department: "Design",      salary: 88000,  joined: "2026-10-01", status: "Probation"},
  { id: 9,  name: "Rohit Naidu",   city: "Vijayawada",department: "Sales",       salary: 71000,  joined: "2025-02-14", status: "Active"   },
  { id: 10, name: "Divya Reddy",   city: "Hyderabad", department: "Finance",     salary: 125000, joined: "2023-01-19", status: "Active"   },
];

const AGENT_COLUMNS = [
  { key: "name",       label: "Name",       type: "text"   },
  { key: "city",       label: "City",       type: "text"   },
  { key: "department", label: "Department", type: "text"   },
  { key: "salary",     label: "Salary",     type: "number" },
  { key: "joined",     label: "Joined",     type: "date"   },
  { key: "status",     label: "Status",     type: "text"   },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

// ── Code samples ─────────────────────────────────────────────
const INSTALL_CODE = `npm install @yuktishaalaa/yuktai`;

const AGENT_GRID_CODE = `"use client";
import { YuktaiGrid, AgenticGridBar, useAgenticGrid } from "@yuktishaalaa/yuktai";

const columns = [
  { key: "name",   label: "Name",   type: "text"   },
  { key: "salary", label: "Salary", type: "number" },
  { key: "joined", label: "Joined", type: "date"   },
];

export default function StaffPage({ rows }) {
  // The agent: plain-English questions → filters, sort, highlights, summaries
  const grid = useAgenticGrid({ data: rows, columns, rowKey: "id" });

  return (
    <>
      <AgenticGridBar
        grid={grid}
        examples={["salary over 1 lakh", "joined this month", "anything unusual?"]}
      />
      <YuktaiGrid
        data={grid.gridData}
        highlightIds={grid.highlightIds}
        columns={columns.map((c) => ({ ...c, sortable: true }))}
      />
    </>
  );
}`;

const BUILTIN_AGENT_CODE = `<YuktaiGrid
  data={rows}
  columns={columns}
  ai                         // built-in assistant: chat + voice
  webmcp                     // exposes the grid as a tool to browser AI agents
  toolName="my_staff_grid"
  inputLanguage="te-IN"      // understands Telugu questions too
  customRules={[
    {
      name: "high-earners",
      phrases: ["high earners", "top people"],
      description: "Salary over 1 lakh",
      execute: ({ executeTool }) =>
        executeTool("filter", { key: "salary", operator: "greaterThan", value: 100000 }),
    },
  ]}
/>`;

const QA_CODE = `import { runQaAudit, auditToMarkdown } from "@yuktishaalaa/yuktai";

const report = runQaAudit();          // 15 WCAG checks on the current page
console.log(report.score);            // 0–100
console.log(report.issues[0].fix);    // what to change, in plain English
const md = auditToMarkdown(report);   // paste into a ticket or PR`;

// ═══════════════════════════════════════════════════════════
export default function YuktaiFullDocs() {
  // ── TTS ──
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);

  // ── Copy ──
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copyCode = async (code: string, id: string) => {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard blocked */ }
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Live demo state ──
  const grid = useAgenticGrid<Staff>({ data: SAMPLE, columns: AGENT_COLUMNS, rowKey: "id" });

  const [audit,      setAudit]      = useState<AuditReport | null>(null);
  const [pageQ,      setPageQ]      = useState("");
  const [pageAns,    setPageAns]    = useState<PageAnswer | null>(null);
  const [pageBusy,   setPageBusy]   = useState(false);
  const [taskText,   setTaskText]   = useState("show salary over 1 lakh, then sort by joined, then summarize");
  const [taskSteps,  setTaskSteps]  = useState<PlannedStep[]>([]);
  const [design,     setDesign]     = useState<DesignReview | null>(null);
  const [voiceText,  setVoiceText]  = useState("make text bigger");
  const [voiceOut,   setVoiceOut]   = useState<string>("");
  const [panelOpen,  setPanelOpen]  = useState(false);

  // ── Handlers ──
  const handleTTS = (action: "play" | "pause" | "stop") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (action === "play") {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsSpeaking(true); setIsPaused(false);
      } else {
        window.speechSynthesis.cancel();
        const text = document.getElementById("yuktai-content")?.innerText || "";
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-IN";
        u.onend = () => { setIsSpeaking(false); setIsPaused(false); };
        window.speechSynthesis.speak(u);
        setIsSpeaking(true);
      }
    } else if (action === "pause") {
      window.speechSynthesis.pause();
      setIsSpeaking(false); setIsPaused(true);
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false); setIsPaused(false);
    }
  };

  const runAudit = () => setAudit(runQaAudit());

  const downloadAudit = () => {
    if (!audit) return;
    const blob = new Blob([auditToMarkdown(audit)], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "yuktai-qa-report.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const askPage = async (q?: string) => {
    const question = (q ?? pageQ).trim();
    if (!question) return;
    setPageQ(question);
    setPageBusy(true);
    try { setPageAns(await askAboutPage(question)); }
    finally { setPageBusy(false); }
  };

  const runPlanner = () => setTaskSteps(taskText.trim() ? planTasks(taskText) : []);
  const runDesign  = () => setDesign(reviewDesign());
  const runVoice   = () => {
    const cmd = parseVoiceA11yCommand(voiceText);
    setVoiceOut(cmd ? JSON.stringify(cmd, null, 2) : "No command recognised. Try: \"high contrast on\", \"bigger text\", \"dark mode\".");
  };

  return (
    <>
      <Navbar />

      <main
        className="is-8fd4925"
      >
        {/* ═══════════ TOP CONTROLS ═══════════ */}
        <div className="is-cf31905">
          <Link href="/" className="is-adc383e">
            <ChevronLeftIcon size={16} color={G_DARK} /> Back to Home
          </Link>

          <div className="is-97f8da1">
            <span className="is-15ebc48">Listen to page:</span>
            <TtsButton label="Play"  active={isSpeaking && !isPaused} activeBg={G_DARK}   onClick={() => handleTTS("play")}><PlayArrowRoundedIcon className="is-768e1f2" /></TtsButton>
            <TtsButton label="Pause" active={isPaused}                activeBg="#be123c"  onClick={() => handleTTS("pause")}><PauseRoundedIcon className="is-768e1f2" /></TtsButton>
            <TtsButton label="Stop"  active={false}                   activeBg={TEXT_MAIN} onClick={() => handleTTS("stop")}><StopRoundedIcon className="is-768e1f2" /></TtsButton>
          </div>
        </div>

        <div id="yuktai-content">
          {/* ═══════════ HEADER ═══════════ */}
          <header className="is-bd1289b">
            <span className="is-bae0104">
              Documentation · v5 Agentic AI
            </span>
            <h1 className="is-55990e1">
              <code className="is-89f4d16">yuktai</code>: accessible, agentic AI that runs in the browser
            </h1>
            <p className="is-41ee27f">
              An open-source React / Next.js toolkit: a data grid you can talk to, browser AI agents,
              WCAG accessibility and page Q&amp;A. Everything on this page is a live demo of the real package.
            </p>
            <div className="is-377902f">
              <MetricPill label="npm downloads"     value="7,213+" />
              <MetricPill label="Agentic features"  value="10"     />
              <MetricPill label="Cost"              value="Free"   />
              <MetricPill label="API keys needed"   value="Zero"   />
              <MetricPill label="Languages"         value="English + Telugu" />
            </div>
          </header>

          {/* ═══════════ INTRO ═══════════ */}
          <section className="is-138f8f4">
            <p className="is-0a55837">
              Built during weekends and late nights, <strong>yuktai</strong> started as an accessibility plugin and
              grew into an agentic toolkit. Version 5 adds agents that understand plain-English (and Telugu) questions,
              test pages for accessibility, review forms and designs, and run multi-step tasks on a grid,
              all with rule-based logic in the browser, so they work offline and never send your data anywhere.
            </p>
          </section>

          {/* ═══════════ WHAT'S NEW — 10 AGENTIC FEATURES ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><AutoAwesomeRoundedIcon className="is-838567c" /> What&apos;s new in v5: 10 agentic features</h2>
            <div className="is-b685df2">
              {[
                ["Smart grid queries", "\"salary over 1 lakh and age under 30\" → filters, sort, limit. Understands 10k, lakh, crore."],
                ["BI copilot",         "Group by, compare this month vs last month, trends."],
                ["Task runner",        "\"filter, then sort, then summarize\" runs as ordered steps with a before/after summary."],
                ["Anomaly finder",     "Flags unusual numbers and duplicate rows."],
                ["QA tester",          "15 WCAG checks, a 0–100 score and a Markdown report."],
                ["Accessibility copilot", "Explains issues in plain English and applies safe fixes with undo."],
                ["Page understanding", "Ask \"what is this page for?\" or \"which fields have no label?\""],
                ["Form review",        "Labels, autocomplete, error messages, senior-friendly tips."],
                ["Design review",      "Hierarchy, readability, focus states, clutter."],
                ["Voice commands",     "\"bigger text\", \"high contrast\", \"next row\" in English and Telugu."],
              ].map(([t, d]) => (
                <div key={t} className="is-55826a9">
                  <div className="is-326e224"><CheckIcon size={14} color={G_DARK} /> {t}</div>
                  <div className="is-b71eb75">{d}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ═══════════ LIVE DEMO 1 — GRID AGENT ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><GridViewRoundedIcon className="is-838567c" /> Live demo: talk to a grid</h2>
            <p className="is-1b64d8d">
              <code>useAgenticGrid</code> + <code>AgenticGridBar</code> on 10 sample rows. Try the examples, or type your own.
              For 10 lakh rows on a real database, open the <Link href="/staffdirectory" className="is-f056999">Yuktai Grid demo</Link>.
            </p>
            <AgenticGridBar
              grid={grid}
              placeholder="Ask the grid… e.g. salary over 1 lakh in Hyderabad"
              examples={[
                "salary over 1 lakh",
                "Engineering in Hyderabad",
                "joined this month",
                "anything unusual?",
                "average salary by department",
                "show salary over 80k, then sort by salary, then summarize",
              ]}
            />
            <div className="is-a76fe82">
              <YuktaiGrid
                data={grid.gridData}
                highlightIds={grid.highlightIds}
                rowKey="id"
                search={false}
                pagination={false}
                columns={[
                  { key: "name",       label: "Name",       sortable: true },
                  { key: "city",       label: "City",       sortable: true },
                  { key: "department", label: "Department", sortable: true },
                  { key: "salary",     label: "Salary",     sortable: true, type: "number", align: "right",
                    render: (v) => inr(Number(v)) },
                  { key: "joined",     label: "Joined",     sortable: true, type: "date",
                    render: (v) => new Date(String(v)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                  { key: "status",     label: "Status",     type: "badge" },
                ]}
              />
            </div>
            <InsightBox>
              The agent is rule-based, not a chatbot guessing: every answer says which filters it used, so the user can
              check it. If Chrome&apos;s built-in Gemini Nano is available it can be plugged in, but it is never required.
            </InsightBox>
          </Card>

          {/* ═══════════ LIVE DEMO 2 — QA + DESIGN ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><FactCheckRoundedIcon className="is-838567c" /> Live demo: test this page</h2>
            <p className="is-1b64d8d">
              <code>runQaAudit()</code> runs 15 WCAG checks and <code>reviewDesign()</code> checks hierarchy and readability,
              on this very page, right now.
            </p>
            <div className="is-39b2332">
              <button type="button" onClick={runAudit}  className="is-9f3c044">Run accessibility test</button>
              <button type="button" onClick={runDesign} className="is-42a3499">Run design review</button>
              {audit && <button type="button" onClick={downloadAudit} className="is-42a3499">Download report (.md)</button>}
            </div>

            {audit && (
              <div className="is-c742def" aria-live="polite">
                <div className="is-a7fbb9b">
                  <span className="is-8a6544f" style={{ color: audit.score >= 90 ? G_DARK : audit.score >= 70 ? "#b45309" : "#be123c" }}>{audit.score}/100</span>
                  <span className="is-6c32634">{audit.checks.filter((c) => c.passed).length} of {audit.checks.length} checks passed</span>
                </div>
                <p className="is-132e371">{audit.summary}</p>
                {audit.issues.slice(0, 5).map((i) => (
                  <div key={i.id} className="is-3179797">
                    <strong>{i.message}</strong> <span className="is-6c32634">· WCAG {i.wcag} · {i.severity}</span>
                    <div className="is-6c32634">Fix: {i.fix}</div>
                  </div>
                ))}
                {audit.issues.length > 5 && <div className="is-1225d0e">+ {audit.issues.length - 5} more in the downloaded report</div>}
              </div>
            )}

            {design && (
              <div className="is-c742def" aria-live="polite">
                <div className="is-db11729">Design score: {design.score}/100</div>
                <p className="is-31b0785">{design.summary}</p>
                {design.findings.slice(0, 4).map((f, idx) => (
                  <div key={idx} className="is-6897140">
                    <strong className="is-a1f46f7">{f.category}:</strong> {f.message} <span className="is-6c32634">→ {f.suggestion}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="is-a812934">
              <CodeBlock code={QA_CODE} copied={copiedCode === "qa"} onCopy={() => copyCode(QA_CODE, "qa")} />
            </div>
          </Card>

          {/* ═══════════ LIVE DEMO 3 — ASK THE PAGE ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><PsychologyRoundedIcon className="is-838567c" /> Live demo: ask this page</h2>
            <p className="is-1b64d8d">
              <code>askAboutPage()</code> reads the page structure (headings, forms, links, images) and answers questions about it.
              Search across page and grid text uses a BM25 index that also handles Telugu.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); askPage(); }} className="is-39b2332">
              <label htmlFor="page-q" className="sr-only">Question about this page</label>
              <input id="page-q" type="text" value={pageQ} onChange={(e) => setPageQ(e.target.value)}
                placeholder="e.g. What is this page about?" className="is-d27a32e" />
              <button type="submit" className="is-9f3c044" disabled={pageBusy}>{pageBusy ? "Reading…" : "Ask"}</button>
            </form>
            <div className="is-3102af9">
              {["What is this page about?", "Which fields have no label?", "How many links are there?", "Show the page structure"].map((q) => (
                <button key={q} type="button" onClick={() => askPage(q)} className="is-0e64e7b">{q}</button>
              ))}
            </div>
            {pageAns && (
              <div className="is-c742def" aria-live="polite">
                <div className="is-713b621">{pageAns.answer}</div>
                {pageAns.suggestions.length > 0 && (
                  <div className="is-8c05bbb">Try next: {pageAns.suggestions.join(" · ")}</div>
                )}
              </div>
            )}
          </Card>

          {/* ═══════════ LIVE DEMO 4 — TASKS + VOICE ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><AutoAwesomeRoundedIcon className="is-838567c" /> Live demo: multi-step tasks and voice commands</h2>
            <div className="is-9746ef6">
              <div>
                <span className="is-d5a9a3d">Task planner · planTasks()</span>
                <label htmlFor="task-text" className="sr-only">Instruction</label>
                <textarea id="task-text" value={taskText} onChange={(e) => setTaskText(e.target.value)}
                  rows={3} className="is-6ce2571" />
                <button type="button" onClick={runPlanner} className="is-3bf2de6">Plan steps</button>
                {taskSteps.length > 0 && (
                  <ol className="is-81e52f5" aria-live="polite">
                    {taskSteps.map((s, i) => (
                      <li key={i} className="is-267f6d5"><strong>{s.action}</strong> <span className="is-6c32634">— “{s.text}”</span></li>
                    ))}
                  </ol>
                )}
              </div>
              <div>
                <span className="is-d5a9a3d">Voice command parser · parseVoiceA11yCommand()</span>
                <label htmlFor="voice-text" className="sr-only">Spoken command</label>
                <input id="voice-text" type="text" value={voiceText} onChange={(e) => setVoiceText(e.target.value)}
                  className="is-2ca4aae" />
                <div className="is-3102af9">
                  {["make text bigger", "high contrast on", "dark mode", "next row"].map((v) => (
                    <button key={v} type="button" onClick={() => setVoiceText(v)} className="is-0e64e7b">{v}</button>
                  ))}
                </div>
                <button type="button" onClick={runVoice} className="is-3bf2de6">Understand</button>
                {voiceOut && <pre className="is-42c8f4e" aria-live="polite">{voiceOut}</pre>}
              </div>
            </div>
          </Card>

          {/* ═══════════ ALL-IN-ONE PANEL ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><AccessibilityNewRoundedIcon className="is-838567c" /> All-in-one: AgenticPanel</h2>
            <p className="is-1b64d8d">
              One component with six tabs: Copilot, QA, Forms, Design, Ask and Voice. Drop <code>&lt;AgenticPanel /&gt;</code> into any page.
            </p>
            <button type="button" onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} className="is-9f3c044">
              {panelOpen ? "Hide the panel" : "Open the panel"}
            </button>
            {panelOpen && (
              <div className="is-65c1c01">
                <AgenticPanel defaultTab="qa" voiceLang="en-IN" />
              </div>
            )}
          </Card>

          {/* ═══════════ CORE MODULES (existing) ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><AccessibilityNewRoundedIcon className="is-838567c" /> Core: accessibility engine</h2>
            <ul className="is-668efb3">
              <li className="is-1015caf"><strong>WCAG 2.2 auto-fix:</strong> adds missing ARIA roles, labels and states to plain markup.</li>
              <li className="is-1015caf"><strong>Speak on focus:</strong> reads the focused element aloud with the browser&apos;s speech engine.</li>
              <li className="is-1015caf"><strong>Dyslexia-friendly mode</strong>, larger targets, reduced motion and keyboard mode.</li>
              <li className="is-1015caf"><strong>Colour-blind filters:</strong> deuteranopia, protanopia, tritanopia, grayscale.</li>
            </ul>
            <p className="is-afd37a2">Open it from the ♿ button in the yuktai tools (bottom-left).</p>
          </Card>

          <Card>
            <h2 className="is-07301a4"><SearchIcon size={20} color={G_DARK} /> Core: in-browser RAG</h2>
            <ul className="is-668efb3">
              <li className="is-1015caf"><strong>Gemini Nano</strong> when Chrome&apos;s built-in AI is available.</li>
              <li className="is-1015caf"><strong>Transformers.js</strong> fallback with 4-bit quantised models, so it also works on phones.</li>
              <li className="is-1015caf"><strong>BM25 context index</strong> for fast keyword search over page and grid text, no model needed.</li>
            </ul>
            <p className="is-afd37a2">Try it from the 💬 button in the yuktai tools.</p>
          </Card>

          <Card>
            <h2 className="is-07301a4"><IntegrationInstructionsRoundedIcon className="is-838567c" /> Core: Vibe Coder</h2>
            <p className="is-47db2d6">
              Describe a page and get a starting layout from built-in templates. Free, offline, no API.
              Open it from the ⚡ button in the yuktai tools.
            </p>
          </Card>

          {/* ═══════════ CODE ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><CodeRoundedIcon className="is-838567c" /> Use it in your Next.js app</h2>
            <h3 className="is-1681b86">1. Agentic grid with your own question bar</h3>
            <CodeBlock code={AGENT_GRID_CODE} copied={copiedCode === "agent"} onCopy={() => copyCode(AGENT_GRID_CODE, "agent")} />
            <h3 className="is-074edec">2. Or the grid&apos;s built-in assistant with your own rules</h3>
            <CodeBlock code={BUILTIN_AGENT_CODE} copied={copiedCode === "builtin"} onCopy={() => copyCode(BUILTIN_AGENT_CODE, "builtin")} />
            <p className="is-dee1c8d">
              Custom rules run before the built-in intents and match by phrase, so you can teach the assistant your own words.
            </p>
          </Card>

          {/* ═══════════ MATRIX ═══════════ */}
          <Card>
            <h2 className="is-07301a4"><ComputerRoundedIcon className="is-838567c" /> Technical compatibility</h2>
            <div className="is-b56181d">
              <table className="is-21977ee">
                <thead>
                  <tr className="is-4c23c5c">
                    <th scope="col" className="is-881f2ed">Area</th>
                    <th scope="col" className="is-881f2ed">Support</th>
                  </tr>
                </thead>
                <tbody>
                  <MatrixRow k="Frameworks"       v="React 19 · Next.js 16 (App Router)" />
                  <MatrixRow k="Types"            v="Full TypeScript definitions" />
                  <MatrixRow k="SSR safety"       v="Browser-only code checks for window, no hydration crashes" />
                  <MatrixRow k="Data"             v="Agents run in the browser; your data stays on the device" />
                  <MatrixRow k="Large data"       v="Server mode: the grid asks your API page by page (tested on 10 lakh rows)" />
                  <MatrixRow k="Browser AI"       v="WebMCP tool for browser agents · optional Gemini Nano" />
                  <MatrixRow k="Languages"        v="English and Telugu input; en-IN number format (10,00,000)" />
                  <MatrixRow k="Tests"            v="Vitest + happy-dom test suite for the agentic module" />
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ═══════════ INSTALL ═══════════ */}
        <div className="is-656c3b2">
          <div className="is-a550fe9">
            <TerminalRoundedIcon /> Install
          </div>
          <p className="is-e8cfc79">Add yuktai to any React or Next.js project:</p>
          <div className="is-d85c4e6">
            <code className="is-4123901">
              {INSTALL_CODE}
            </code>
            <button type="button" onClick={() => copyCode(INSTALL_CODE, "install")} aria-label="Copy install command"
              className="is-fdeb08c" style={{ color: copiedCode === "install" ? FG_CODE : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {copiedCode === "install" ? <CheckIcon size={18} color={FG_CODE} /> : <ContentCopyRoundedIcon className="is-768e1f2" />}
            </button>
          </div>
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="is-192f8ac">
          <span className="is-6c32634">Built in public, with help from Claude, GPT and Gemini.</span>
          <div className="is-1b05a81">
            <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noreferrer"
              className="is-08dd25e">
              GitHub <ChevronRightIcon size={14} color={G_DARK} />
            </a>
            <a href="https://www.npmjs.com/package/@yuktishaalaa/yuktai" target="_blank" rel="noreferrer"
              className="is-08dd25e">
              npm <ChevronRightIcon size={14} color={G_DARK} />
            </a>
            <Link href="/staffdirectory" className="is-7a1ab93">
              Yuktai Grid demo <ChevronRightIcon size={14} color={TEXT_MAIN} />
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Small components
// ═══════════════════════════════════════════════════════════
function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="is-163466f">
      {children}
    </section>
  );
}

function TtsButton({ label, active, activeBg, onClick, children }: {
  label: string; active: boolean; activeBg: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={active}
      style={{ background: active ? activeBg : "#ffffff", color: active ? "#ffffff" : TEXT_MAIN, border: "none", borderRadius: "50%",
        width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
      {children}
    </button>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="is-70a0282">
      <span className="is-bda03bd">{value}</span>
      <span className="is-6c32634">{label}</span>
    </div>
  );
}

function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="is-426816f">
      <strong>Why it matters: </strong>{children}
    </div>
  );
}

function CodeBlock({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="is-d85c4e6">
      <pre className="is-f26fd4d">
        <code>{code}</code>
      </pre>
      <button type="button" onClick={onCopy} aria-label="Copy code"
        className="is-fdeb08c" style={{ color: copied ? FG_CODE : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {copied ? <CheckIcon size={18} color={FG_CODE} /> : <ContentCopyRoundedIcon className="is-768e1f2" />}
      </button>
    </div>
  );
}

function MatrixRow({ k, v }: { k: string; v: string }) {
  return (
    <tr className="is-61221e1">
      <th scope="row" className="is-0459513">{k}</th>
      <td className="is-881f2ed">{v}</td>
    </tr>
  );
}
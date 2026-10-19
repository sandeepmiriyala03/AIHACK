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

// ── Theme colors ─────────────────────────────────────────────
const G         = "#10b981";
const G_DARK    = "#047857";   // text/buttons on white (passes 4.5:1)
const TEXT_MAIN = "#0f172a";
const TEXT_SUB  = "#475569";
const BG_CODE   = "#0f172a";
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
        style={{
          maxWidth: "960px",
          margin: "100px auto 60px auto",
          padding: "0 20px",
          fontFamily: "'Outfit', sans-serif",
          color: TEXT_MAIN,
          lineHeight: 1.7,
          boxSizing: "border-box",
        }}
      >
        {/* ═══════════ TOP CONTROLS ═══════════ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 30 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: G_DARK, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            <ChevronLeftIcon size={16} color={G_DARK} /> Back to Home
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "6px 12px", borderRadius: 30, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_SUB, marginRight: 4 }}>Listen to page:</span>
            <TtsButton label="Play"  active={isSpeaking && !isPaused} activeBg={G_DARK}   onClick={() => handleTTS("play")}><PlayArrowRoundedIcon style={{ fontSize: 18 }} /></TtsButton>
            <TtsButton label="Pause" active={isPaused}                activeBg="#be123c"  onClick={() => handleTTS("pause")}><PauseRoundedIcon style={{ fontSize: 18 }} /></TtsButton>
            <TtsButton label="Stop"  active={false}                   activeBg={TEXT_MAIN} onClick={() => handleTTS("stop")}><StopRoundedIcon style={{ fontSize: 18 }} /></TtsButton>
          </div>
        </div>

        <div id="yuktai-content">
          {/* ═══════════ HEADER ═══════════ */}
          <header style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 24, marginBottom: 32 }}>
            <span style={{ color: G_DARK, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Documentation · v5 Agentic AI
            </span>
            <h1 style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 700, letterSpacing: "-0.03em", marginTop: 6, marginBottom: 12, borderBottom: "none", paddingBottom: 0 }}>
              <code style={{ fontSize: "0.85em" }}>yuktai</code>: accessible, agentic AI that runs in the browser
            </h1>
            <p style={{ fontSize: 16, color: TEXT_SUB }}>
              An open-source React / Next.js toolkit: a data grid you can talk to, browser AI agents,
              WCAG accessibility and page Q&amp;A. Everything on this page is a live demo of the real package.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <MetricPill label="npm downloads"     value="7,213+" />
              <MetricPill label="Agentic features"  value="10"     />
              <MetricPill label="Cost"              value="Free"   />
              <MetricPill label="API keys needed"   value="Zero"   />
              <MetricPill label="Languages"         value="English + Telugu" />
            </div>
          </header>

          {/* ═══════════ INTRO ═══════════ */}
          <section style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 16.5, marginBottom: 16 }}>
              Built during weekends and late nights, <strong>yuktai</strong> started as an accessibility plugin and
              grew into an agentic toolkit. Version 5 adds agents that understand plain-English (and Telugu) questions,
              test pages for accessibility, review forms and designs, and run multi-step tasks on a grid,
              all with rule-based logic in the browser, so they work offline and never send your data anywhere.
            </p>
          </section>

          {/* ═══════════ WHAT'S NEW — 10 AGENTIC FEATURES ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><AutoAwesomeRoundedIcon style={{ color: G_DARK }} /> What&apos;s new in v5: 10 agentic features</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
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
                <div key={t} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", background: "#fff" }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><CheckIcon size={14} color={G_DARK} /> {t}</div>
                  <div style={{ fontSize: 14, color: TEXT_SUB }}>{d}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ═══════════ LIVE DEMO 1 — GRID AGENT ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><GridViewRoundedIcon style={{ color: G_DARK }} /> Live demo: talk to a grid</h2>
            <p style={leadStyle}>
              <code>useAgenticGrid</code> + <code>AgenticGridBar</code> on 10 sample rows. Try the examples, or type your own.
              For 10 lakh rows on a real database, open the <Link href="/staffdirectory" style={{ color: G_DARK, fontWeight: 600 }}>Yuktai Grid demo</Link>.
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
            <div style={{ marginTop: 12, overflowX: "auto" }}>
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
            <h2 style={sectionH2Style}><FactCheckRoundedIcon style={{ color: G_DARK }} /> Live demo: test this page</h2>
            <p style={leadStyle}>
              <code>runQaAudit()</code> runs 15 WCAG checks and <code>reviewDesign()</code> checks hierarchy and readability,
              on this very page, right now.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={runAudit}  style={btnPrimary}>Run accessibility test</button>
              <button type="button" onClick={runDesign} style={btnSecondary}>Run design review</button>
              {audit && <button type="button" onClick={downloadAudit} style={btnSecondary}>Download report (.md)</button>}
            </div>

            {audit && (
              <div style={resultBox} aria-live="polite">
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: audit.score >= 90 ? G_DARK : audit.score >= 70 ? "#b45309" : "#be123c" }}>{audit.score}/100</span>
                  <span style={{ color: TEXT_SUB }}>{audit.checks.filter((c) => c.passed).length} of {audit.checks.length} checks passed</span>
                </div>
                <p style={{ margin: "6px 0 10px", fontSize: 14 }}>{audit.summary}</p>
                {audit.issues.slice(0, 5).map((i) => (
                  <div key={i.id} style={{ borderTop: "1px solid #e2e8f0", padding: "8px 0", fontSize: 14 }}>
                    <strong>{i.message}</strong> <span style={{ color: TEXT_SUB }}>· WCAG {i.wcag} · {i.severity}</span>
                    <div style={{ color: TEXT_SUB }}>Fix: {i.fix}</div>
                  </div>
                ))}
                {audit.issues.length > 5 && <div style={{ fontSize: 13, color: TEXT_SUB }}>+ {audit.issues.length - 5} more in the downloaded report</div>}
              </div>
            )}

            {design && (
              <div style={resultBox} aria-live="polite">
                <div style={{ fontWeight: 600 }}>Design score: {design.score}/100</div>
                <p style={{ margin: "4px 0 8px", fontSize: 14 }}>{design.summary}</p>
                {design.findings.slice(0, 4).map((f, idx) => (
                  <div key={idx} style={{ fontSize: 14, borderTop: "1px solid #e2e8f0", padding: "6px 0" }}>
                    <strong style={{ textTransform: "capitalize" }}>{f.category}:</strong> {f.message} <span style={{ color: TEXT_SUB }}>→ {f.suggestion}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <CodeBlock code={QA_CODE} copied={copiedCode === "qa"} onCopy={() => copyCode(QA_CODE, "qa")} />
            </div>
          </Card>

          {/* ═══════════ LIVE DEMO 3 — ASK THE PAGE ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><PsychologyRoundedIcon style={{ color: G_DARK }} /> Live demo: ask this page</h2>
            <p style={leadStyle}>
              <code>askAboutPage()</code> reads the page structure (headings, forms, links, images) and answers questions about it.
              Search across page and grid text uses a BM25 index that also handles Telugu.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); askPage(); }} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label htmlFor="page-q" className="sr-only">Question about this page</label>
              <input id="page-q" type="text" value={pageQ} onChange={(e) => setPageQ(e.target.value)}
                placeholder="e.g. What is this page about?" style={inputStyle} />
              <button type="submit" style={btnPrimary} disabled={pageBusy}>{pageBusy ? "Reading…" : "Ask"}</button>
            </form>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {["What is this page about?", "Which fields have no label?", "How many links are there?", "Show the page structure"].map((q) => (
                <button key={q} type="button" onClick={() => askPage(q)} style={chipStyle}>{q}</button>
              ))}
            </div>
            {pageAns && (
              <div style={resultBox} aria-live="polite">
                <div style={{ fontSize: 15, whiteSpace: "pre-line" }}>{pageAns.answer}</div>
                {pageAns.suggestions.length > 0 && (
                  <div style={{ fontSize: 13, color: TEXT_SUB, marginTop: 6 }}>Try next: {pageAns.suggestions.join(" · ")}</div>
                )}
              </div>
            )}
          </Card>

          {/* ═══════════ LIVE DEMO 4 — TASKS + VOICE ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><AutoAwesomeRoundedIcon style={{ color: G_DARK }} /> Live demo: multi-step tasks and voice commands</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <div>
                <span style={simulatorLabelStyle}>Task planner · planTasks()</span>
                <label htmlFor="task-text" className="sr-only">Instruction</label>
                <textarea id="task-text" value={taskText} onChange={(e) => setTaskText(e.target.value)}
                  rows={3} style={{ ...inputStyle, width: "100%", marginTop: 8, resize: "vertical" }} />
                <button type="button" onClick={runPlanner} style={{ ...btnPrimary, marginTop: 8 }}>Plan steps</button>
                {taskSteps.length > 0 && (
                  <ol style={{ ...resultBox, paddingLeft: 32 }} aria-live="polite">
                    {taskSteps.map((s, i) => (
                      <li key={i} style={{ fontSize: 14 }}><strong>{s.action}</strong> <span style={{ color: TEXT_SUB }}>— “{s.text}”</span></li>
                    ))}
                  </ol>
                )}
              </div>
              <div>
                <span style={simulatorLabelStyle}>Voice command parser · parseVoiceA11yCommand()</span>
                <label htmlFor="voice-text" className="sr-only">Spoken command</label>
                <input id="voice-text" type="text" value={voiceText} onChange={(e) => setVoiceText(e.target.value)}
                  style={{ ...inputStyle, width: "100%", marginTop: 8 }} />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {["make text bigger", "high contrast on", "dark mode", "next row"].map((v) => (
                    <button key={v} type="button" onClick={() => setVoiceText(v)} style={chipStyle}>{v}</button>
                  ))}
                </div>
                <button type="button" onClick={runVoice} style={{ ...btnPrimary, marginTop: 8 }}>Understand</button>
                {voiceOut && <pre style={{ ...outputBoxStyle, whiteSpace: "pre-wrap" }} aria-live="polite">{voiceOut}</pre>}
              </div>
            </div>
          </Card>

          {/* ═══════════ ALL-IN-ONE PANEL ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><AccessibilityNewRoundedIcon style={{ color: G_DARK }} /> All-in-one: AgenticPanel</h2>
            <p style={leadStyle}>
              One component with six tabs: Copilot, QA, Forms, Design, Ask and Voice. Drop <code>&lt;AgenticPanel /&gt;</code> into any page.
            </p>
            <button type="button" onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} style={btnPrimary}>
              {panelOpen ? "Hide the panel" : "Open the panel"}
            </button>
            {panelOpen && (
              <div style={{ marginTop: 12 }}>
                <AgenticPanel defaultTab="qa" voiceLang="en-IN" />
              </div>
            )}
          </Card>

          {/* ═══════════ CORE MODULES (existing) ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><AccessibilityNewRoundedIcon style={{ color: G_DARK }} /> Core: accessibility engine</h2>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>WCAG 2.2 auto-fix:</strong> adds missing ARIA roles, labels and states to plain markup.</li>
              <li style={liStyle}><strong>Speak on focus:</strong> reads the focused element aloud with the browser&apos;s speech engine.</li>
              <li style={liStyle}><strong>Dyslexia-friendly mode</strong>, larger targets, reduced motion and keyboard mode.</li>
              <li style={liStyle}><strong>Colour-blind filters:</strong> deuteranopia, protanopia, tritanopia, grayscale.</li>
            </ul>
            <p style={{ fontSize: 14, color: TEXT_SUB, margin: 0 }}>Open it from the ♿ button in the yuktai tools (bottom-left).</p>
          </Card>

          <Card>
            <h2 style={sectionH2Style}><SearchIcon size={20} color={G_DARK} /> Core: in-browser RAG</h2>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Gemini Nano</strong> when Chrome&apos;s built-in AI is available.</li>
              <li style={liStyle}><strong>Transformers.js</strong> fallback with 4-bit quantised models, so it also works on phones.</li>
              <li style={liStyle}><strong>BM25 context index</strong> for fast keyword search over page and grid text, no model needed.</li>
            </ul>
            <p style={{ fontSize: 14, color: TEXT_SUB, margin: 0 }}>Try it from the 💬 button in the yuktai tools.</p>
          </Card>

          <Card>
            <h2 style={sectionH2Style}><IntegrationInstructionsRoundedIcon style={{ color: G_DARK }} /> Core: Vibe Coder</h2>
            <p style={{ fontSize: 15, color: TEXT_SUB, margin: 0 }}>
              Describe a page and get a starting layout from built-in templates. Free, offline, no API.
              Open it from the ⚡ button in the yuktai tools.
            </p>
          </Card>

          {/* ═══════════ CODE ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><CodeRoundedIcon style={{ color: G_DARK }} /> Use it in your Next.js app</h2>
            <h3 style={h3Style}>1. Agentic grid with your own question bar</h3>
            <CodeBlock code={AGENT_GRID_CODE} copied={copiedCode === "agent"} onCopy={() => copyCode(AGENT_GRID_CODE, "agent")} />
            <h3 style={{ ...h3Style, marginTop: 20 }}>2. Or the grid&apos;s built-in assistant with your own rules</h3>
            <CodeBlock code={BUILTIN_AGENT_CODE} copied={copiedCode === "builtin"} onCopy={() => copyCode(BUILTIN_AGENT_CODE, "builtin")} />
            <p style={{ fontSize: 14, color: TEXT_SUB, marginTop: 12, marginBottom: 0 }}>
              Custom rules run before the built-in intents and match by phrase, so you can teach the assistant your own words.
            </p>
          </Card>

          {/* ═══════════ MATRIX ═══════════ */}
          <Card>
            <h2 style={sectionH2Style}><ComputerRoundedIcon style={{ color: G_DARK }} /> Technical compatibility</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5, textAlign: "left", minWidth: 480 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #cbd5e1" }}>
                    <th scope="col" style={{ padding: 8 }}>Area</th>
                    <th scope="col" style={{ padding: 8 }}>Support</th>
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
        <div style={{ background: "#0f172a", color: "white", borderRadius: 16, padding: 24, marginBottom: 40, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: FG_CODE }}>
            <TerminalRoundedIcon /> Install
          </div>
          <p style={{ fontSize: 14, color: "#cbd5e1", margin: 0 }}>Add yuktai to any React or Next.js project:</p>
          <div style={{ position: "relative" }}>
            <code style={{ background: "#1e293b", color: FG_CODE, padding: "12px 48px 12px 16px", borderRadius: 8, fontFamily: "monospace", fontSize: 14, display: "block" }}>
              {INSTALL_CODE}
            </code>
            <button type="button" onClick={() => copyCode(INSTALL_CODE, "install")} aria-label="Copy install command"
              style={{ position: "absolute", top: 4, right: 4, width: 44, height: 44, background: "transparent", border: "none", cursor: "pointer", color: copiedCode === "install" ? FG_CODE : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {copiedCode === "install" ? <CheckIcon size={18} color={FG_CODE} /> : <ContentCopyRoundedIcon style={{ fontSize: 18 }} />}
            </button>
          </div>
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 14 }}>
          <span style={{ color: TEXT_SUB }}>Built in public, with help from Claude, GPT and Gemini.</span>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noreferrer"
              style={{ color: G_DARK, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              GitHub <ChevronRightIcon size={14} color={G_DARK} />
            </a>
            <a href="https://www.npmjs.com/package/@yuktishaalaa/yuktai" target="_blank" rel="noreferrer"
              style={{ color: G_DARK, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              npm <ChevronRightIcon size={14} color={G_DARK} />
            </a>
            <Link href="/staffdirectory" style={{ color: TEXT_MAIN, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
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
    <section style={{ marginBottom: 32, border: "1px solid #e2e8f0", borderRadius: 16, padding: "clamp(16px, 4vw, 24px)", background: "#ffffff" }}>
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
    <div style={{ background: "#f0fdf4", border: "1px solid #86efac", padding: "6px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
      <span style={{ color: "#166534", fontWeight: 700 }}>{value}</span>
      <span style={{ color: TEXT_SUB }}>{label}</span>
    </div>
  );
}

function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13.5, marginTop: 16 }}>
      <strong>Why it matters: </strong>{children}
    </div>
  );
}

function CodeBlock({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div style={{ position: "relative" }}>
      <pre style={{ background: BG_CODE, color: FG_CODE, padding: "16px 52px 16px 16px", borderRadius: 10, overflowX: "auto", fontSize: 12.5, fontFamily: "monospace", lineHeight: 1.6, margin: 0 }}>
        <code>{code}</code>
      </pre>
      <button type="button" onClick={onCopy} aria-label="Copy code"
        style={{ position: "absolute", top: 4, right: 4, width: 44, height: 44, background: "transparent", border: "none", cursor: "pointer", color: copied ? FG_CODE : "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {copied ? <CheckIcon size={18} color={FG_CODE} /> : <ContentCopyRoundedIcon style={{ fontSize: 18 }} />}
      </button>
    </div>
  );
}

function MatrixRow({ k, v }: { k: string; v: string }) {
  return (
    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
      <th scope="row" style={{ padding: 8, fontWeight: 600 }}>{k}</th>
      <td style={{ padding: 8 }}>{v}</td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════
const sectionH2Style: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
  // globals.css gives h2 a bottom border; not wanted inside cards
  borderBottom: "none", paddingBottom: 0,
};
const h3Style: React.CSSProperties  = { fontSize: 16, fontWeight: 600, color: TEXT_MAIN, marginBottom: 8 };
const leadStyle: React.CSSProperties = { fontSize: 15, color: TEXT_SUB, marginBottom: 16 };
const ulStyle: React.CSSProperties   = { paddingLeft: 20, fontSize: 15, marginBottom: 12 };
const liStyle: React.CSSProperties   = { marginBottom: 6 };

const simulatorLabelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: G_DARK, textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6,
};
const inputStyle: React.CSSProperties = {
  flex: "1 1 240px", minWidth: 0, minHeight: 44, padding: "8px 12px", border: "1px solid #94a3b8", borderRadius: 8,
  fontFamily: "inherit", fontSize: 15, boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  background: G_DARK, color: "white", border: "none", minHeight: 44, padding: "8px 18px", borderRadius: 8,
  fontWeight: 600, fontFamily: "inherit", fontSize: 15, cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  ...btnPrimary, background: "#ffffff", color: G_DARK, border: `1.5px solid ${G_DARK}`,
};
const chipStyle: React.CSSProperties = {
  minHeight: 36, padding: "6px 12px", borderRadius: 999, border: "1px solid #cbd5e1", background: "#f8fafc",
  color: TEXT_MAIN, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer",
};
const resultBox: React.CSSProperties = {
  background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, marginTop: 12,
};
const outputBoxStyle: React.CSSProperties = {
  background: "#0f172a", color: FG_CODE, padding: 12, borderRadius: 8, marginTop: 10, fontFamily: "monospace", fontSize: 13,
};
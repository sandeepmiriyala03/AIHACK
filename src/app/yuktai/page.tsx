"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ── yuktai icons (yours) ─────────────────────────────────────
import {
  CheckIcon,          // ✅ prerequisites, success items
  CloseIcon,          // ✕ close things
  SearchIcon,         // 🔍 RAG section
  ChevronRightIcon,   // → CTA button
  ChevronLeftIcon,    // ← Back to Dashboard
} from "@yuktishaalaa/yuktai";

// ── MUI icons (kept where yuktai doesn't have equivalents) ──
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

// ── Theme colors ─────────────────────────────────────────────
const G         = "#10b981";  // green accent
const TEXT_MAIN = "#0f172a";
const TEXT_SUB  = "#64748b";
const BG_CODE   = "#0f172a";
const FG_CODE   = "#34d399";

export default function YuktaiFullDocs() {
  // ── TTS State ──────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);

  // ── AI Simulator States ────────────────────────────────────
  const [ragQuery,   setRagQuery]   = useState("");
  const [ragAnswer,  setRagAnswer]  = useState("");
  const [agentGoal,  setAgentGoal]  = useState("");
  const [agentSteps, setAgentSteps] = useState<string[]>([]);
  const [vibePrompt, setVibePrompt] = useState("");
  const [vibeCode,   setVibeCode]   = useState("");

  // ── Copy code state ────────────────────────────────────────
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── TTS handler ────────────────────────────────────────────
  const handleTTS = (action: "play" | "pause" | "stop") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (action === "play") {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsSpeaking(true);
        setIsPaused(false);
      } else {
        window.speechSynthesis.cancel();
        const textToRead =
          document.getElementById("yuktai-content")?.innerText || "";
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    } else if (action === "pause") {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      setIsPaused(true);
    } else if (action === "stop") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // ── AI Simulators ──────────────────────────────────────────
  const runRagSim = () => {
    if (!ragQuery) return;
    setRagAnswer(
      "Processing locally via Transformers.js (q4 quantization)... Found match using Cosine Similarity: 'yuktai is a zero-API, zero-cost Next.js plugin built for offline in-browser AI.'"
    );
  };

  const runAgentSim = () => {
    if (!agentGoal) return;
    setAgentSteps([
      "1. Scanning full page DOM using 9 core extraction strategies...",
      "2. Found input field matching label: '" + agentGoal + "' using 11 label strategies.",
      "3. Executing Chrome Gemini Nano planning fallback sequence...",
      "4. Action complete: Target field highlighted with a teal outline.",
    ]);
  };

  const runVibeSim = () => {
    if (!vibePrompt) return;
    setVibeCode(
      `// Generated via Vibe Coder pure templates (No Cost, Offline)
export default function GeneratedPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Navbar brand="${vibePrompt}" />
      <main className="max-w-4xl mx-auto mt-10">...</main>
    </div>
  );
}`
    );
  };

  // ── Code samples ───────────────────────────────────────────
  const INSTALL_CODE = `npm install @yuktishaalaa/yuktai`;

  const GRID_USAGE_CODE = `"use client";
import { YuktaiGrid } from "@yuktishaalaa/yuktai";

const data = [
  { id: 1, name: "Sandeep", role: "Developer" },
  { id: 2, name: "Priya",   role: "Designer"  },
];

export default function DemoPage() {
  return (
    <YuktaiGrid
      data={data}
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "role", label: "Role" },
      ]}
      theme="default"          // default | high-contrast | dark | color-blind | dyslexia
      search={true}
      view="auto"              // auto (card on mobile) | table | card
      pagination={{ pageSize: 10 }}
    />
  );
}`;

  const ICONS_USAGE_CODE = `import {
  SearchIcon,
  SortUpIcon,
  SortDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  CloseIcon,
} from "@yuktishaalaa/yuktai";

export default function IconsDemo() {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <SearchIcon        size={20} />
      <SortUpIcon        size={20} color="#0D9488" />
      <SortDownIcon      size={20} color="#0D9488" />
      <ChevronLeftIcon   size={24} label="Previous" />
      <ChevronRightIcon  size={24} label="Next" />
      <CheckIcon         size={20} color="#10b981" />
      <CloseIcon         size={20} color="#dc2626" />
    </div>
  );
}`;

  return (
    <>
      <Navbar />

      <main
        style={{
          maxWidth:  "900px",
          margin:    "100px auto 60px auto",
          padding:   "0 24px",
          fontFamily:"'Outfit', sans-serif",
          color:     TEXT_MAIN,
          lineHeight:"1.7",
          boxSizing: "border-box",
        }}
      >

        {/* ═══════════ TOP CONTROLS BAR ═══════════ */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            flexWrap:       "wrap",
            gap:            "12px",
            marginBottom:   "30px",
          }}
        >
          {/* Back link — uses yuktai ChevronLeftIcon */}
          <Link
            href="/"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "6px",
              color:          G,
              textDecoration: "none",
              fontSize:       "14px",
              fontWeight:     600,
            }}
          >
            <ChevronLeftIcon size={16} color={G} /> Back to Dashboard
          </Link>

          {/* TTS control bar */}
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "8px",
              background:   "#f1f5f9",
              padding:      "6px 12px",
              borderRadius: "30px",
              border:       "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 600, color: TEXT_SUB, marginRight: "4px" }}>
              🔊 Listen to Page:
            </span>
            <button
              onClick={() => handleTTS("play")}
              aria-label="Play"
              style={{
                background:   isSpeaking && !isPaused ? G : "#ffffff",
                border:       "none",
                borderRadius: "50%",
                width:        "28px",
                height:       "28px",
                display:      "flex",
                alignItems:   "center",
                justifyContent:"center",
                cursor:       "pointer",
                boxShadow:    "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <PlayArrowRoundedIcon style={{ fontSize: 16, color: isSpeaking && !isPaused ? "white" : TEXT_MAIN }} />
            </button>
            <button
              onClick={() => handleTTS("pause")}
              aria-label="Pause"
              style={{
                background:   isPaused ? "#e11d48" : "#ffffff",
                border:       "none",
                borderRadius: "50%",
                width:        "28px",
                height:       "28px",
                display:      "flex",
                alignItems:   "center",
                justifyContent:"center",
                cursor:       "pointer",
                boxShadow:    "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <PauseRoundedIcon style={{ fontSize: 16, color: isPaused ? "white" : TEXT_MAIN }} />
            </button>
            <button
              onClick={() => handleTTS("stop")}
              aria-label="Stop"
              style={{
                background:   "#ffffff",
                border:       "none",
                borderRadius: "50%",
                width:        "28px",
                height:       "28px",
                display:      "flex",
                alignItems:   "center",
                justifyContent:"center",
                cursor:       "pointer",
                boxShadow:    "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <StopRoundedIcon style={{ fontSize: 16, color: TEXT_MAIN }} />
            </button>
          </div>
        </div>

        {/* ═══════════ MAIN TTS-READABLE CONTENT ═══════════ */}
        <div id="yuktai-content">

          {/* ── Yuktai info header ── */}
          <header
            style={{
              borderBottom:  "1px solid #e2e8f0",
              paddingBottom: "24px",
              marginBottom:  "32px",
            }}
          >
            <span
              style={{
                color:          G,
                fontSize:       "13px",
                fontWeight:     700,
                textTransform:  "uppercase",
                letterSpacing:  "0.05em",
              }}
            >
              Comprehensive Documentation
            </span>
            <h1
              style={{
                fontSize:      "34px",
                fontWeight:    700,
                letterSpacing: "-0.03em",
                marginTop:     "6px",
                marginBottom:  "12px",
              }}
            >
              The Complete <code style={{ fontSize: "28px" }}>yuktai</code> Framework Specification
            </h1>
            <p style={{ fontSize: "16px", color: TEXT_SUB }}>
              An architectural breakdown of the 70+ in-browser features powering the open-source Next.js ecosystem.
            </p>

            {/* Quick metrics */}
            <div
              style={{
                display:      "flex",
                gap:          "12px",
                marginTop:    "16px",
                flexWrap:     "wrap",
              }}
            >
              <MetricPill label="Downloads"       value="7,213+" />
              <MetricPill label="Features"        value="70+"    />
              <MetricPill label="Cost"            value="Free"   />
              <MetricPill label="API Keys needed" value="Zero"   />
            </div>
          </header>

          {/* ── Introduction ── */}
          <section style={{ marginBottom: "40px" }}>
            <p style={{ fontSize: "16.5px", marginBottom: "16px" }}>
              Built entirely during free weekends and late nights, <strong>yuktai</strong> is a client-side open-source npm plugin for Next.js designed to bridge the massive gap in web accessibility and localized browser intelligence. It enables offline RAG architecture, AI planning agents, automated semantic styling, and semantic layouts directly inside the browser tab without sending data to servers, needing subscription models, or requiring API configurations.
            </p>
          </section>

          {/* ═══════════ MODULE 1 — ACCESSIBILITY ═══════════ */}
          <section
            style={{
              marginBottom:  "40px",
              border:        "1px solid #e2e8f0",
              borderRadius:  "16px",
              padding:       "24px",
            }}
          >
            <h2 style={sectionH2Style}>
              <AccessibilityNewRoundedIcon style={{ color: G }} /> 1. Web Accessibility Engine (16 Features)
            </h2>
            <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
              Addresses standard DOM-level navigation breaks, keyboard support structures, and elements required under WCAG 2.2 criteria applied globally to live runtime sessions.
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>WCAG 2.2 Auto-Fix:</strong> Injects necessary ARIA roles, states, and properties systematically into plain markup.</li>
              <li style={liStyle}><strong>Speak on Focus & Voice UI:</strong> Native speech synthesis routing that reads active elements dynamically upon focus.</li>
              <li style={liStyle}><strong>Dyslexia Friendly Engine:</strong> One-click conversion to target device fonts and specialized hyperlegible formats.</li>
              <li style={liStyle}><strong>Visual Shifters:</strong> Complete color-blind profile filters (Deuteranopia, Protanopia, Tritanopia, Grayscale).</li>
            </ul>
            <InsightBox>
              Accessibility is often treated as an afterthought in complex tech cycles. Injecting directly into the local DOM creates a stable UX layer without waiting on server refreshes.
            </InsightBox>
          </section>

          {/* ═══════════ MODULE 2 — RAG + SIMULATOR ═══════════ */}
          <section
            style={{
              marginBottom:  "40px",
              border:        "1px solid #e2e8f0",
              borderRadius:  "16px",
              padding:       "24px",
            }}
          >
            <h2 style={sectionH2Style}>
              <PsychologyRoundedIcon style={{ color: G }} /> 2. In-Tab Retrieval-Augmented Generation (11 Features)
            </h2>
            <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
              Extracts clear content maps directly from DOM structures, deduplicates redundant metadata, and calculates semantic matching inline. Automatically toggles based on current hardware specifications.
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>Gemini Nano Integration:</strong> Utilizes Chrome standalone built-in globals to manage high-efficiency semantic pipelines locally.</li>
              <li style={liStyle}><strong>Transformers.js Execution:</strong> Fallback logic that manages execution via local client packages on cross-platform mobile environments.</li>
              <li style={liStyle}><strong>Quantized Efficiency:</strong> Converts 32-bit floating operations to tight 4-bit configurations, preventing iOS memory failures.</li>
            </ul>

            {/* RAG Simulator */}
            <div
              style={{
                background:   "#f8fafc",
                padding:      "16px",
                borderRadius: "12px",
                marginTop:    "16px",
                border:       "1px solid #cbd5e1",
              }}
            >
              <span style={simulatorLabelStyle}>
                <SearchIcon size={14} color={G} /> Try In-Tab RAG Simulator
              </span>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <input
                  type="text"
                  placeholder="Ask something about this page..."
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={runRagSim} style={btnPrimary}>Analyze</button>
              </div>
              {ragAnswer && (
                <div style={outputBoxStyle}>
                  {ragAnswer}
                </div>
              )}
            </div>
          </section>

          {/* ═══════════ MODULE 3 — AGENT + SIMULATOR ═══════════ */}
          <section
            style={{
              marginBottom:  "40px",
              border:        "1px solid #e2e8f0",
              borderRadius:  "16px",
              padding:       "24px",
            }}
          >
            <h2 style={sectionH2Style}>
              <AutoAwesomeRoundedIcon style={{ color: G }} /> 3. Autonomous Local AI Agent (13 Features)
            </h2>
            <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
              Parses intents from natural language and automatically determines multi-step browser tasks like populating targets, mapping inputs, and traversing legacy elements.
            </p>
            <ul style={ulStyle}>
              <li style={liStyle}><strong>9 DOM Traversal Strategies:</strong> Targets deep structures, static text nodes, nested views, and dynamic rendering layouts.</li>
              <li style={liStyle}><strong>11 Label Context Classifiers:</strong> Interprets placeholders, preceding grid structures, and contemporary aria identifiers on old ports.</li>
            </ul>

            {/* Agent Simulator */}
            <div
              style={{
                background:   "#f8fafc",
                padding:      "16px",
                borderRadius: "12px",
                marginTop:    "16px",
                border:       "1px solid #cbd5e1",
              }}
            >
              <span style={simulatorLabelStyle}>
                🤖 Test AI Agent Navigation Plan
              </span>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <input
                  type="text"
                  placeholder="Enter target action (e.g., Fill email field)..."
                  value={agentGoal}
                  onChange={(e) => setAgentGoal(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={runAgentSim} style={btnPrimary}>Plan Action</button>
              </div>
              {agentSteps.length > 0 && (
                <div
                  style={{
                    background:   "#1e293b",
                    color:        "#f8fafc",
                    padding:      "12px",
                    borderRadius: "6px",
                    marginTop:    "10px",
                    fontSize:     "13px",
                  }}
                >
                  {agentSteps.map((step, idx) => (
                    <div key={idx} style={{ marginBottom: "4px" }}>{step}</div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ═══════════ MODULE 4 — VIBE + SIMULATOR ═══════════ */}
          <section
            style={{
              marginBottom:  "40px",
              border:        "1px solid #e2e8f0",
              borderRadius:  "16px",
              padding:       "24px",
            }}
          >
            <h2 style={sectionH2Style}>
              <IntegrationInstructionsRoundedIcon style={{ color: G }} /> 4. Vibe Coder Architecture (19 Features)
            </h2>
            <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
              Combines client-side prompt routing logic with predefined structural scaffolding to output fully production-ready system layers instantly.
            </p>

            <div
              style={{
                background:   "#f8fafc",
                padding:      "16px",
                borderRadius: "12px",
                border:       "1px solid #cbd5e1",
              }}
            >
              <span style={simulatorLabelStyle}>
                💻 Sandbox Project Generator
              </span>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <input
                  type="text"
                  placeholder="Type app type (e.g., E-Commerce Hub)..."
                  value={vibePrompt}
                  onChange={(e) => setVibePrompt(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={runVibeSim} style={btnPrimary}>Compile</button>
              </div>
              {vibeCode && (
                <pre
                  style={{
                    background:   "#0f172a",
                    color:        "#e2e8f0",
                    padding:      "12px",
                    borderRadius: "6px",
                    marginTop:    "10px",
                    overflowX:    "auto",
                    fontSize:     "12px",
                    fontFamily:   "monospace",
                  }}
                >
                  <code>{vibeCode}</code>
                </pre>
              )}
            </div>
          </section>

          {/* ═══════════ MODULE 5 — GRID USAGE ═══════════ */}
          <section
            style={{
              marginBottom:  "40px",
              border:        "1px solid #e2e8f0",
              borderRadius:  "16px",
              padding:       "24px",
            }}
          >
            <h2 style={sectionH2Style}>
              <CodeRoundedIcon style={{ color: G }} /> 5. YuktaiGrid — Usage Example for Next.js
            </h2>
            <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
              A copy-paste ready code sample. Drop this into any Next.js App Router page to get an accessible AI-powered data grid.
            </p>
            <CodeBlock code={GRID_USAGE_CODE} id="grid-code" copied={copiedCode === "grid-code"} onCopy={() => copyCode(GRID_USAGE_CODE, "grid-code")} />
            <ul style={{ ...ulStyle, marginTop: "16px" }}>
              <li style={liStyle}>
                <CheckIcon size={14} color={G} /> <strong> Auto card view</strong> on mobile (below 768px) — no config needed
              </li>
              <li style={liStyle}>
                <CheckIcon size={14} color={G} /> <strong> Search bar</strong> at top — filters across all columns instantly
              </li>
              <li style={liStyle}>
                <CheckIcon size={14} color={G} /> <strong> Sort</strong> — click any column header · ascending → descending → clear
              </li>
              <li style={liStyle}>
                <CheckIcon size={14} color={G} /> <strong> Pagination</strong> — set pageSize in the pagination prop
              </li>
              <li style={liStyle}>
                <CheckIcon size={14} color={G} /> <strong> WCAG 2.2</strong> — keyboard-navigable and screen-reader friendly by default
              </li>
            </ul>
          </section>

          {/* ═══════════ MODULE 6 — ICONS USAGE ═══════════ */}
          <section
            style={{
              marginBottom:  "40px",
              border:        "1px solid #e2e8f0",
              borderRadius:  "16px",
              padding:       "24px",
            }}
          >
            <h2 style={sectionH2Style}>
              <CodeRoundedIcon style={{ color: G }} /> 6. Yuktai Icons — Usage Example
            </h2>
            <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
              Yuktai ships 7 minimal-line SVG icons. Each one accepts <code>size</code>, <code>color</code>, and <code>label</code> props.
            </p>

            {/* Visual icon grid */}
            <div
              style={{
                display:              "grid",
                gridTemplateColumns:  "repeat(auto-fit, minmax(120px, 1fr))",
                gap:                  "12px",
                padding:              "16px",
                background:           "#f8fafc",
                border:               "1px solid #cbd5e1",
                borderRadius:         "12px",
                marginBottom:         "16px",
              }}
            >
              <IconCard name="SearchIcon"       icon={<SearchIcon        size={22} color={G} />} />
              <IconCard name="CheckIcon"        icon={<CheckIcon         size={22} color={G} />} />
              <IconCard name="CloseIcon"        icon={<CloseIcon         size={22} color="#dc2626" />} />
              <IconCard name="ChevronLeftIcon"  icon={<ChevronLeftIcon   size={22} color={G} />} />
              <IconCard name="ChevronRightIcon" icon={<ChevronRightIcon  size={22} color={G} />} />
            </div>

            <CodeBlock code={ICONS_USAGE_CODE} id="icons-code" copied={copiedCode === "icons-code"} onCopy={() => copyCode(ICONS_USAGE_CODE, "icons-code")} />

            <div style={{ marginTop: "16px", padding: "12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", fontSize: "13.5px" }}>
                   
           <strong style={{ color: "#166534" }}>Props:</strong> All icons accept the same props — <code>size</code> (number, default 20), <code>color</code> (string, default <code>&quot;currentColor&quot;</code>), <code>strokeWidth</code> (number, default 2.5), and <code>label</code> (string — makes the icon accessible instead of decorative). </div>
          </section>

          {/* ═══════════ MODULE 7 — TECHNICAL MATRIX ═══════════ */}
          <section
            style={{
              marginBottom:  "40px",
              border:        "1px solid #e2e8f0",
              borderRadius:  "16px",
              padding:       "24px",
            }}
          >
            <h2 style={sectionH2Style}>
              <ComputerRoundedIcon style={{ color: G }} /> 7. Technical Compatibility Matrix
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width:          "100%",
                  borderCollapse: "collapse",
                  fontSize:       "14.5px",
                  textAlign:      "left",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ padding: "8px" }}>Dependency Parameter</th>
                    <th style={{ padding: "8px" }}>Supported Build Specification</th>
                  </tr>
                </thead>
                <tbody>
                  <MatrixRow k="Framework Environments"  v="Next.js 16+ & React 19 Core Compatible" />
                  <MatrixRow k="Type Definitions"        v="Strict TypeScript configuration across layout nodes" />
                  <MatrixRow k="SSR Safety"              v="Dynamic window verification to prevent hydration crashes" />
                  <MatrixRow k="Network Boundary"        v="100% Client-Side Execution / Zero Data Outflow" />
                  <MatrixRow k="Icon Bundle"             v="7 minimal-line SVG icons · under 5KB total" />
                </tbody>
              </table>
            </div>
          </section>

        </div> {/* end of yuktai-content */}

        {/* ═══════════ INSTALLATION ═══════════ */}
        <div
          style={{
            background:   "#0f172a",
            color:        "white",
            borderRadius: "16px",
            padding:      "24px",
            marginBottom: "40px",
            display:      "flex",
            flexDirection: "column",
            gap:          "12px",
          }}
        >
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "8px",
              fontWeight: 600,
              color:      G,
            }}
          >
            <TerminalRoundedIcon /> Production Deployment
          </div>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
            Inject the framework globally using your preferred package management terminal:
          </p>
          <div style={{ position: "relative" }}>
            <code
              style={{
                background:   "#1e293b",
                color:        "#34d399",
                padding:      "12px 16px",
                borderRadius: "8px",
                fontFamily:   "monospace",
                fontSize:     "14px",
                display:      "block",
                paddingRight: "48px",
              }}
            >
              {INSTALL_CODE}
            </code>
            <button
              onClick={() => copyCode(INSTALL_CODE, "install")}
              style={{
                position:     "absolute",
                top:          "8px",
                right:        "8px",
                background:   "transparent",
                border:       "none",
                cursor:       "pointer",
                color:        copiedCode === "install" ? G : "#94a3b8",
                display:      "flex",
                alignItems:   "center",
              }}
              aria-label="Copy install command"
            >
              {copiedCode === "install"
                ? <CheckIcon size={18} color={G} />
                : <ContentCopyRoundedIcon style={{ fontSize: 18 }} />}
            </button>
          </div>
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer
          style={{
            borderTop:      "1px solid #e2e8f0",
            paddingTop:     "20px",
            display:        "flex",
            justifyContent: "space-between",
            flexWrap:       "wrap",
            gap:            "12px",
            fontSize:       "14px",
          }}
        >
          <span style={{ color: TEXT_SUB }}>
            Developed openly with support from Claude, GPT & Gemini.
          </span>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <a
              href="https://github.com/sandeepmiriyala03/yuktai"
              target="_blank"
              rel="noreferrer"
              style={{ color: G, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              GitHub Repository <ChevronRightIcon size={14} color={G} />
            </a>
            <a
              href="https://aksharatantra.miriyala.in"
              style={{ color: TEXT_MAIN, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              Live Application <ChevronRightIcon size={14} color={TEXT_MAIN} />
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Reusable sub-components
// ═══════════════════════════════════════════════════════════

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background:   "#f0fdf4",
        border:       "1px solid #86efac",
        padding:      "6px 12px",
        borderRadius: "20px",
        display:      "flex",
        alignItems:   "center",
        gap:          "6px",
        fontSize:     "13px",
      }}
    >
      <span style={{ color: "#166534", fontWeight: 700 }}>{value}</span>
      <span style={{ color: TEXT_SUB }}>{label}</span>
    </div>
  );
}

function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background:   "#f8fafc",
        padding:      "14px",
        borderRadius: "8px",
        borderLeft:   `3px solid ${G}`,
        fontSize:     "13.5px",
      }}
    >
      <strong>Learned Insight: </strong>
      {children}
    </div>
  );
}

function IconCard({ name, icon }: { name: string; icon: React.ReactNode }) {
  return (
    <div
      style={{
        background:   "#fff",
        border:       "1px solid #e2e8f0",
        borderRadius: "8px",
        padding:      "12px",
        textAlign:    "center",
        display:      "flex",
        flexDirection:"column",
        alignItems:   "center",
        gap:          "6px",
      }}
    >
      {icon}
      <span style={{ fontSize: "11px", color: TEXT_SUB, fontFamily: "monospace" }}>{name}</span>
    </div>
  );
}

function CodeBlock({
  code,
  id,
  copied,
  onCopy,
}: {
  code:   string;
  id:     string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <pre
        style={{
          background:   BG_CODE,
          color:        FG_CODE,
          padding:      "16px",
          borderRadius: "10px",
          overflowX:    "auto",
          fontSize:     "12.5px",
          fontFamily:   "monospace",
          lineHeight:   "1.6",
          margin:       0,
          paddingRight: "48px",
        }}
      >
        <code>{code}</code>
      </pre>
      <button
        onClick={onCopy}
        aria-label="Copy code"
        style={{
          position:   "absolute",
          top:        "12px",
          right:      "12px",
          background: "transparent",
          border:     "none",
          cursor:     "pointer",
          color:      copied ? G : "#94a3b8",
          display:    "flex",
          alignItems: "center",
        }}
      >
        {copied
          ? <CheckIcon size={18} color={G} />
          : <ContentCopyRoundedIcon style={{ fontSize: 18 }} />}
      </button>
    </div>
  );
}

function MatrixRow({ k, v }: { k: string; v: string }) {
  return (
    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
      <td style={{ padding: "8px", fontWeight: 600 }}>{k}</td>
      <td style={{ padding: "8px" }}>{v}</td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════
// Inline style constants
// ═══════════════════════════════════════════════════════════
const sectionH2Style: React.CSSProperties = {
  fontSize:      "20px",
  fontWeight:    700,
  marginBottom:  "14px",
  display:       "flex",
  alignItems:    "center",
  gap:           "8px",
};

const ulStyle: React.CSSProperties = {
  paddingLeft: "20px",
  fontSize:    "15px",
  marginBottom:"16px",
};

const liStyle: React.CSSProperties = {
  marginBottom: "6px",
};

const simulatorLabelStyle: React.CSSProperties = {
  fontSize:      "12px",
  fontWeight:    700,
  color:         G,
  textTransform: "uppercase",
  display:       "inline-flex",
  alignItems:    "center",
  gap:           "6px",
};

const inputStyle: React.CSSProperties = {
  flex:         1,
  padding:      "8px 12px",
  border:       "1px solid #cbd5e1",
  borderRadius: "6px",
  fontFamily:   "inherit",
};

const btnPrimary: React.CSSProperties = {
  background:   G,
  color:        "white",
  border:       "none",
  padding:      "8px 16px",
  borderRadius: "6px",
  fontWeight:   600,
  cursor:       "pointer",
};

const outputBoxStyle: React.CSSProperties = {
  background:   "#0f172a",
  color:        "#34d399",
  padding:      "12px",
  borderRadius: "6px",
  marginTop:    "10px",
  fontFamily:   "monospace",
  fontSize:     "13px",
};
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
/* Icons */
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import AccessibilityNewRoundedIcon from "@mui/icons-material/AccessibilityNewRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import IntegrationInstructionsRoundedIcon from "@mui/icons-material/IntegrationInstructionsRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";

const G = "#10b981"; 
const TEXT_MAIN = "#0f172a"; 
const TEXT_SUB = "#64748b"; 

export default function YuktaiFullDocs() {
  // Text-To-Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // AI Feature Simulator States
  const [ragQuery, setRagQuery] = useState("");
  const [ragAnswer, setRagAnswer] = useState("");
  const [agentGoal, setAgentGoal] = useState("");
  const [agentSteps, setAgentSteps] = useState<string[]>([]);
  const [vibePrompt, setVibePrompt] = useState("");
  const [vibeCode, setVibeCode] = useState("");

  // Simple TTS Function
  const handleTTS = (action: "play" | "pause" | "stop") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (action === "play") {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsSpeaking(true);
        setIsPaused(false);
      } else {
        window.speechSynthesis.cancel();
        const textToRead = document.getElementById("yuktai-content")?.innerText || "";
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
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

  // Simulated AI Engine Responses
  const runRagSim = () => {
    if (!ragQuery) return;
    setRagAnswer("Processing locally via Transformers.js (q4 quantization)... Found match using Cosine Similarity: 'yuktai is a zero-API, zero-cost Next.js plugin built for offline in-browser AI.'");
  };

  const runAgentSim = () => {
    if (!agentGoal) return;
    setAgentSteps([
      "1. Scanning full page DOM using 9 core extraction strategies...",
      "2. Found input field matching label: '" + agentGoal + "' using 11 label strategies.",
      "3. Executing Chrome Gemini Nano planning fallback sequence...",
      "4. Action complete: Target field highlighted with a teal outline."
    ]);
  };

  const runVibeSim = () => {
    if (!vibePrompt) return;
    setVibeCode(`// Generated via Vibe Coder pure templates (No Cost, Offline)\nexport default function GeneratedPage() {\n  return (\n    <div className="min-h-screen bg-slate-50 p-6">\n      <Navbar brand="${vibePrompt}" />\n      <main className="max-w-4xl mx-auto mt-10">...</main>\n    </div>\n  );\n}`);
  };

  return (
    <>
      <Navbar brand={vibePrompt} />
    <main style={{ maxWidth: "900px", margin: "100px auto 60px auto", padding: "0 24px", fontFamily: "'Outfit', sans-serif", color: TEXT_MAIN, lineHeight: "1.7", boxSizing: "border-box" }}>
      
      {/* Top Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "30px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: G, textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
          <ArrowBackRoundedIcon style={{ fontSize: 16 }} /> Back to Dashboard
        </Link>

        {/* TTS Floating Audio Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9", padding: "6px 12px", borderRadius: "30px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: TEXT_SUB, marginRight: "4px" }}>🔊 Listen to Page:</span>
          <button onClick={() => handleTTS("play")} style={{ background: isSpeaking && !isPaused ? G : "#ffffff", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <PlayArrowRoundedIcon style={{ fontSize: 16, color: isSpeaking && !isPaused ? "white" : TEXT_MAIN }} />
          </button>
          <button onClick={() => handleTTS("pause")} style={{ background: isPaused ? "#e11d48" : "#ffffff", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <PauseRoundedIcon style={{ fontSize: 16, color: isPaused ? "white" : TEXT_MAIN }} />
          </button>
          <button onClick={() => handleTTS("stop")} style={{ background: "#ffffff", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <StopRoundedIcon style={{ fontSize: 16, color: TEXT_MAIN }} />
          </button>
        </div>
      </div>

      {/* Main Readable Content Wrapper for TTS */}
      <div id="yuktai-content">
        <header style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "24px", marginBottom: "32px" }}>
          <span style={{ color: G, fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Comprehensive Documentation</span>
          <h1 style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.03em", marginTop: "6px", marginBottom: "12px" }}>
            The Complete `yuktai` Framework Specification
          </h1>
          <p style={{ fontSize: "16px", color: TEXT_SUB }}>
            An architectural breakdown of the 70+ in-browser features powering the open-source Next.js ecosystem.
          </p>
        </header>

        {/* Introduction */}
        <section style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "16.5px", marginBottom: "16px" }}>
            Built entirely during free weekends and late nights, <strong>yuktai</strong> is a client-side open-source npm plugin for Next.js designed to bridge the massive gap in web accessibility and localized browser intelligence. It enables offline RAG architecture, AI planning agents, automated semantic styling, and semantic layouts directly inside the browser tab without sending data to servers, needing subscription models, or requiring API configurations.
          </p>
        </section>

        {/* Feature Breakdown Panels */}
        
        {/* Module 1 */}
        <section style={{ marginBottom: "40px", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AccessibilityNewRoundedIcon style={{ color: G }} /> 1. Web Accessibility Engine (16 Features)
          </h2>
          <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
            Addresses standard DOM-level navigation breaks, keyboard support structures, and elements required under WCAG 2.2 criteria applied globally to live runtime sessions.
          </p>
          <ul style={{ paddingLeft: "20px", fontSize: "15px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "6px" }}><strong>WCAG 2.2 Auto-Fix:</strong> Injects necessary ARIA roles, states, and properties systematically into plain markup.</li>
            <li style={{ marginBottom: "6px" }}><strong>Speak on Focus & Voice UI:</strong> Native speech synthesis routing that reads active active elements dynamically upon focus.</li>
            <li style={{ marginBottom: "6px" }}><strong>Dyslexia Friendly Engine:</strong> One-click conversion to target device fonts and specialized hyperlegible formats.</li>
            <li style={{ marginBottom: "6px" }}><strong>Visual Shifters:</strong> Complete color-blind profile filters (Deuteranopia, Protanopia, Tritanopia, and Grayscale transformations).</li>
          </ul>
          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", borderLeft: `3px solid ${G}`, fontSize: "13.5px" }}>
            <strong>Learned Insight:</strong> Accessibility is often treated as an afterthought in complex tech cycles. Injecting directly into the local DOM creates a stable UX layer without waiting on server refreshes.
          </div>
        </section>

        {/* Module 2 & Interactive Simulator */}
        <section style={{ marginBottom: "40px", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <PsychologyRoundedIcon style={{ color: G }} /> 2. In-Tab Retrieval-Augmented Generation (11 Features)
          </h2>
          <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
            Extracts clear content maps directly from DOM structures, deduplicates redundant metadata, and calculates semantic matching inline. Automatically toggles based on current hardware specifications.
          </p>
          <ul style={{ paddingLeft: "20px", fontSize: "15px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "6px" }}><strong>Gemini Nano Integration:</strong> Utilizes Chrome standalone built-in globals to manage high-efficiency semantic pipelines locally.</li>
            <li style={{ marginBottom: "6px" }}><strong>Transformers.js Execution:</strong> Fallback logic that manages execution via local client packages on cross-platform mobile environments.</li>
            <li style={{ marginBottom: "6px" }}><strong>Quantized Efficiency:</strong> Converts 32-bit floating operations to tight 4-bit configurations, preventing iOS memory failures.</li>
          </ul>

          {/* SIMULATOR */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginTop: "16px", border: "1px solid #cbd5e1" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: G, textTransform: "uppercase" }}>⚡ Try In-Tab RAG Simulator</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <input type="text" placeholder="Ask something about this page..." value={ragQuery} onChange={(e) => setRagQuery(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "inherit" }} />
              <button onClick={runRagSim} style={{ background: G, color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Analyze</button>
            </div>
            {ragAnswer && <div style={{ background: "#0f172a", color: "#34d399", padding: "12px", borderRadius: "6px", marginTop: "10px", fontFamily: "monospace", fontSize: "13px" }}>{ragAnswer}</div>}
          </div>
        </section>

        {/* Module 3 & Interactive Simulator */}
        <section style={{ marginBottom: "40px", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AutoAwesomeRoundedIcon style={{ color: G }} /> 3. Autonomous Local AI Agent (13 Features)
          </h2>
          <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
            Parses intents from natural language and automatically determines multi-step browser tasks like populating targets, mapping inputs, and traversing legacy elements.
          </p>
          <ul style={{ paddingLeft: "20px", fontSize: "15px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "6px" }}><strong>9 DOM Traversal Strategies:</strong> Targets deep structures, static text nodes, nested views, and dynamic rendering layouts.</li>
            <li style={{ marginBottom: "6px" }}><strong>11 Label Context Classifiers:</strong> Interprets placeholders, preceding grid structures, and contemporary aria identifiers on old ports.</li>
          </ul>

          {/* SIMULATOR */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginTop: "16px", border: "1px solid #cbd5e1" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: G, textTransform: "uppercase" }}>🤖 Test AI Agent Navigation Plan</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <input type="text" placeholder="Enter target action (e.g., Fill email field)..." value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "inherit" }} />
              <button onClick={runAgentSim} style={{ background: G, color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Plan Action</button>
            </div>
            {agentSteps.length > 0 && (
              <div style={{ background: "#1e293b", color: "#f8fafc", padding: "12px", borderRadius: "6px", marginTop: "10px", fontSize: "13px" }}>
                {agentSteps.map((step, idx) => <div key={idx} style={{ marginBottom: "4px" }}>{step}</div>)}
              </div>
            )}
          </div>
        </section>

        {/* Module 4 & Simulator */}
        <section style={{ marginBottom: "40px", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <IntegrationInstructionsRoundedIcon style={{ color: G }} /> 4. Vibe Coder Architecture (19 Features)
          </h2>
          <p style={{ fontSize: "15px", color: TEXT_SUB, marginBottom: "16px" }}>
            Combines client-side prompt routing logic with predefined structural scaffolding to output fully production-ready system layers instantly.
          </p>

          {/* SIMULATOR */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: G, textTransform: "uppercase" }}>💻 Sandbox Project Generator</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <input type="text" placeholder="Type app type (e.g., E-Commerce Hub)..." value={vibePrompt} onChange={(e) => setVibePrompt(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "inherit" }} />
              <button onClick={runVibeSim} style={{ background: G, color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Compile</button>
            </div>
            {vibeCode && <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: "12px", borderRadius: "6px", marginTop: "10px", overflowX: "auto", fontSize: "12px", fontFamily: "monospace" }}><code>{vibeCode}</code></pre>}
          </div>
        </section>

        {/* Global Specifications */}
        <section style={{ marginBottom: "40px", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ComputerRoundedIcon style={{ color: G }} /> 5. Technical Compatibility Matrix
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14.5px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "8px" }}>Dependency Parameter</th>
                  <th style={{ padding: "8px" }}>Supported Build Specification</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}><td style={{ padding: "8px", fontWeight: 600 }}>Framework Environments</td><td style={{ padding: "8px" }}>Next.js 16+ & React 19 Core Compatible</td></tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}><td style={{ padding: "8px", fontWeight: 600 }}>Type Definitions</td><td style={{ padding: "8px" }}>Strict TypeScript configuration across layout nodes</td></tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}><td style={{ padding: "8px", fontWeight: 600 }}>SSR Safety</td><td style={{ padding: "8px" }}>Dynamic window verification to prevent hydration crashes</td></tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}><td style={{ padding: "8px", fontWeight: 600 }}>Network Boundary</td><td style={{ padding: "8px" }}>100% Client-Side Execution / Zero Data Outflow</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Installation Segment */}
      <div style={{ background: "#0f172a", color: "white", borderRadius: "16px", padding: "24px", marginBottom: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: G }}>
          <TerminalRoundedIcon /> Production Deployment
        </div>
        <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
          Inject the framework globally using your preferred package management terminal:
        </p>
        <code style={{ background: "#1e293b", color: "#34d399", padding: "12px 16px", borderRadius: "8px", fontFamily: "monospace", fontSize: "14px" }}>
          npm install @yuktishaalaa/yuktai
        </code>
      </div>

      {/* Footer Meta Details */}
      <footer style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "14px" }}>
        <span style={{ color: TEXT_SUB }}>Developed openly with support from Claude, GPT & Gemini.</span>
        <div style={{ display: "flex", gap: "16px" }}>
          <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noreferrer" style={{ color: G, fontWeight: 600, textDecoration: "none" }}>GitHub Repository</a>
          <a href="https://aksharatantra.vercel.app" style={{ color: TEXT_MAIN, fontWeight: 600, textDecoration: "none" }}>Live Application</a>
        </div>
      </footer>
    </main>
    </>
  );
}
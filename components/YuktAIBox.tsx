"use client";

import { useState } from "react";
import { DM_Mono, Syne } from "next/font/google";
import YuktAI from "yuktai-js";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
});

export default function Page() {
  const [tab, setTab] = useState<"ai" | "wcag">("ai");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);
  const [isA11yActive, setIsA11yActive] = useState(false);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setTime(null);
  };

  const handleCancel = () => {
    setLoading(false);
    setOutput("⛔ Operation Cancelled");
  };

  const runAI = async () => {
    try {
      setLoading(true);
      setOutput("");
      setTime(null);
      const start = performance.now();
      const res = await YuktAI.run("ai.text", input || "Hello");
      const end = performance.now();
      setTime(end - start);
      setOutput(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setOutput("❌ AI Error");
    } finally {
      setLoading(false);
    }
  };

  const runWCAG = async () => {
    try {
      setLoading(true);
      setOutput("");
      setTime(null);
      const start = performance.now();
      
      // Initializing your wcag.ts plugin logic
      const res = await YuktAI.run("ui.a11y.pro", {
        enabled: true,
        autoFix: true,
        highContrast: false,
        reduceMotion: true
      });

      const end = performance.now();
      setTime(end - start);
      setIsA11yActive(true);
      setOutput(typeof res === "string" ? res : "♿ Accessibility Guard is now active and monitoring the DOM.");
    } catch (e) {
      console.error(e);
      setOutput("❌ WCAG Engine Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${dmMono.variable} ${syne.variable}`}
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111110",
        fontFamily: "var(--font-dm-mono), monospace",
        padding: "0 1rem 4rem",
      }}
    >
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .hero { max-width: 680px; margin: 0 auto; padding: 4rem 0 3rem; display: flex; flex-direction: column; align-items: flex-start; }
        .hero-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #aaa9a6; margin-bottom: 1rem; }
        .hero-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 0.5rem; }
        .hero-logo img { width: 36px; height: 36px; border-radius: 8px; }
        .hero-wordmark { font-family: var(--font-syne), sans-serif; font-size: 2.6rem; font-weight: 800; letter-spacing: -0.03em; color: #111110; line-height: 1; }
        .hero-sub { font-size: 13px; color: #999895; margin-top: 0.6rem; letter-spacing: 0.02em; }
        .hero-chips { display: flex; gap: 8px; margin-top: 1.6rem; flex-wrap: wrap; }
        .chip { font-size: 11px; padding: 4px 10px; border: 0.5px solid #e0dedd; border-radius: 100px; color: #999895; letter-spacing: 0.06em; background: #f8f7f6; }
        .chip.active { border-color: #b07d2e; color: #b07d2e; background: rgba(176, 125, 46, 0.06); }
        .chip.secure { border-color: #4a9e6a; color: #4a9e6a; background: rgba(74, 158, 106, 0.06); }

        .card { max-width: 680px; margin: 0 auto; background: #ffffff; border: 0.5px solid #e8e7e5; border-radius: 14px; overflow: hidden; }
        .tabs { display: flex; border-bottom: 0.5px solid #e8e7e5; background: #f8f7f6; }
        .tab-btn { flex: 1; height: 46px; background: none; border: none; cursor: pointer; font-family: var(--font-dm-mono), monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #b0afac; transition: color 0.15s, background 0.15s; position: relative; }
        .tab-btn:not(:last-child) { border-right: 0.5px solid #e8e7e5; }
        .tab-btn:hover { color: #555450; }
        .tab-btn.tab-active { color: #b07d2e; background: #ffffff; }
        .tab-btn.tab-active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1.5px; background: #b07d2e; }

        .card-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 12px; }
        .prompt-input { width: 100%; background: #f8f7f6; border: 0.5px solid #e0dedd; border-radius: 8px; padding: 12px 14px; font-family: var(--font-dm-mono), monospace; font-size: 13px; color: #111110; resize: none; outline: none; transition: border-color 0.15s; line-height: 1.6; min-height: 88px; }
        .actions { display: flex; gap: 8px; }
        .btn { height: 40px; padding: 0 18px; border-radius: 8px; font-family: var(--font-dm-mono), monospace; font-size: 12px; letter-spacing: 0.06em; cursor: pointer; border: 0.5px solid transparent; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .btn-primary { background: #111110; color: #ffffff; border-color: #111110; flex: 1; font-weight: 500; }
        .btn-ghost { background: none; border-color: #e0dedd; color: #999895; }
        
        .output-section { border-top: 0.5px solid #f0efed; padding: 1.25rem 1.5rem; }
        .output-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .output-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #c0bebb; }
        .output-box { background: #f8f7f6; border: 0.5px solid #e8e7e5; border-radius: 8px; padding: 14px; min-height: 60px; font-size: 12.5px; line-height: 1.7; color: #b0afac; white-space: pre-wrap; }
        .output-box.has-output { color: #111110; }
        
        .status-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 1.5rem; border-top: 0.5px solid #f0efed; background: #f8f7f6; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #dddcd9; display: inline-block; margin-right: 8px; }
        .status-dot.active { background: #4a9e6a; box-shadow: 0 0 6px rgba(74, 158, 106, 0.4); }
      `}</style>

      <div className="hero">
        <div className="hero-eyebrow">Yuktishala Labs — v1.0</div>
        <div className="hero-logo">
          <span className="hero-wordmark">YuktAI</span>
        </div>
        <div className="hero-sub">Intelligent Accessibility & Text</div>
        <div className="hero-chips">
          <span className="chip active">OSS</span>
          {isA11yActive && <span className="chip secure">♿ A11y Active</span>}
          <span className="chip">Offline-First</span>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab-btn ${tab === "ai" ? "tab-active" : ""}`} onClick={() => { setTab("ai"); handleClear(); }}>AI Prompt</button>
          <button className={`tab-btn ${tab === "wcag" ? "tab-active" : ""}`} onClick={() => { setTab("wcag"); handleClear(); }}>WCAG Engine</button>
        </div>

        <div className="card-body">
          {tab === "ai" ? (
            <>
              <textarea
                className="prompt-input"
                placeholder="Ask YuktAI something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="actions">
                <button className="btn btn-ghost" onClick={handleClear}>Clear</button>
                <button className="btn btn-primary" onClick={runAI} disabled={loading || !input}>
                  {loading ? "Thinking..." : "Generate"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: "1rem 0", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "#999895", marginBottom: "1.5rem" }}>
                Activate the WCAG Engine to automatically fix ARIA, contrast, and layout issues.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={runWCAG} 
                disabled={loading || isA11yActive}
                style={{ width: "100%" }}
              >
                {isA11yActive ? "Engine is Monitoring" : "Initialize WCAG Guard"}
              </button>
            </div>
          )}
        </div>

        <div className="output-section">
          <div className="output-header">
            <span className="output-label">Status Report</span>
            {time && <span style={{ fontSize: "10px", color: "#aaa" }}>{(time / 1000).toFixed(2)}s</span>}
          </div>
          <div className={`output-box ${output ? "has-output" : ""}`}>
            {output || "Waiting for command..."}
          </div>
        </div>

        <div className="status-bar">
          <span>
            <span className={`status-dot ${isA11yActive ? "active" : ""}`} />
            <span style={{ fontSize: "11px", color: "#b0afac" }}>
              {isA11yActive ? "a11y-live" : "standby"}
            </span>
          </span>
          {loading && <button className="btn btn-ghost" style={{ height: 24, fontSize: 10 }} onClick={handleCancel}>stop</button>}
        </div>
      </div>
    </div>
  );
}
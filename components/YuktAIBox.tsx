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
  const [tab, setTab] = useState<"ai" | "ocr">("ai");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setFile(null);
    setTime(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const handleCancel = () => {
    setLoading(false);
    setOutput("⛔ Cancelled");
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

  const runOCR = async () => {
    if (!file) return setOutput("⚠️ Upload image first");
    try {
      setLoading(true);
      setOutput("");
      setTime(null);
      const start = performance.now();
      const buffer = await file.arrayBuffer();
      const res = await YuktAI.run("image.ocr.smart", {
        file: buffer,
        name: file.name,
        type: file.type,
      });
      const end = performance.now();
      setTime(end - start);
      if (typeof res === "string") {
        setOutput(res);
      } else if (res?.text) {
        setOutput(`Text:\n${res.text}\n\nConfidence: ${res.confidence || 0}%`);
      } else {
        setOutput(JSON.stringify(res, null, 2));
      }
    } catch (e) {
      console.error(e);
      setOutput("❌ OCR Error");
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

        .hero {
          max-width: 680px;
          margin: 0 auto;
          padding: 4rem 0 3rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .hero-eyebrow {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #aaa9a6;
          margin-bottom: 1rem;
        }
        .hero-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 0.5rem;
        }
        .hero-logo img { width: 36px; height: 36px; border-radius: 8px; }
        .hero-wordmark {
          font-family: var(--font-syne), sans-serif;
          font-size: 2.6rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #111110;
          line-height: 1;
        }
        .hero-sub {
          font-size: 13px;
          color: #999895;
          margin-top: 0.6rem;
          letter-spacing: 0.02em;
        }
        .hero-chips {
          display: flex;
          gap: 8px;
          margin-top: 1.6rem;
          flex-wrap: wrap;
        }
        .chip {
          font-size: 11px;
          padding: 4px 10px;
          border: 0.5px solid #e0dedd;
          border-radius: 100px;
          color: #999895;
          letter-spacing: 0.06em;
          background: #f8f7f6;
        }
        .chip.active {
          border-color: #b07d2e;
          color: #b07d2e;
          background: rgba(176, 125, 46, 0.06);
        }

        .fw-strip {
          max-width: 680px;
          margin: 0 auto 2.5rem;
          display: flex;
          align-items: center;
          border: 0.5px solid #e8e7e5;
          border-radius: 10px;
          overflow: hidden;
        }
        .fw-label {
          font-size: 11px;
          color: #c0bebb;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0 18px;
          white-space: nowrap;
          border-right: 0.5px solid #e8e7e5;
          height: 44px;
          display: flex;
          align-items: center;
        }
        .fw-items { display: flex; flex: 1; }
        .fw-item {
          flex: 1;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          color: #b0afac;
          border-right: 0.5px solid #e8e7e5;
          letter-spacing: 0.04em;
          transition: color 0.15s, background 0.15s;
        }
        .fw-item:last-child { border-right: none; }
        .fw-item:hover { color: #555450; background: #f8f7f6; }
        .fw-icon { font-size: 14px; line-height: 1; }

        .card {
          max-width: 680px;
          margin: 0 auto;
          background: #ffffff;
          border: 0.5px solid #e8e7e5;
          border-radius: 14px;
          overflow: hidden;
        }
        .tabs {
          display: flex;
          border-bottom: 0.5px solid #e8e7e5;
          background: #f8f7f6;
        }
        .tab-btn {
          flex: 1;
          height: 46px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b0afac;
          transition: color 0.15s, background 0.15s;
          position: relative;
        }
        .tab-btn:not(:last-child) { border-right: 0.5px solid #e8e7e5; }
        .tab-btn:hover { color: #555450; }
        .tab-btn.tab-active { color: #b07d2e; background: #ffffff; }
        .tab-btn.tab-active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1.5px;
          background: #b07d2e;
        }

        .card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .prompt-input {
          width: 100%;
          background: #f8f7f6;
          border: 0.5px solid #e0dedd;
          border-radius: 8px;
          padding: 12px 14px;
          font-family: var(--font-dm-mono), monospace;
          font-size: 13px;
          color: #111110;
          resize: none;
          outline: none;
          transition: border-color 0.15s;
          line-height: 1.6;
          min-height: 88px;
        }
        .prompt-input::placeholder { color: #cccbc8; }
        .prompt-input:focus { border-color: #b0afac; }

        .actions { display: flex; gap: 8px; }
        .btn {
          height: 40px;
          padding: 0 18px;
          border-radius: 8px;
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          cursor: pointer;
          border: 0.5px solid transparent;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .btn-primary {
          background: #111110;
          color: #ffffff;
          border-color: #111110;
          flex: 1;
          justify-content: center;
          font-weight: 500;
        }
        .btn-primary:hover:not(:disabled) { background: #2a2928; }
        .btn-primary:disabled { opacity: 0.25; cursor: not-allowed; }
        .btn-ghost {
          background: none;
          border-color: #e0dedd;
          color: #999895;
        }
        .btn-ghost:hover { border-color: #b0afac; color: #555450; }

        .upload-zone {
          border: 0.5px dashed #d8d7d4;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          position: relative;
        }
        .upload-zone:hover { border-color: #b0afac; background: #f8f7f6; }
        .upload-zone input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }
        .upload-icon { width: 32px; height: 32px; margin: 0 auto 10px; color: #c8c7c4; }
        .upload-text { font-size: 12px; color: #b0afac; letter-spacing: 0.04em; }
        .upload-hint { font-size: 11px; color: #d0cfcc; margin-top: 4px; }
        .preview-img {
          width: 100%;
          border-radius: 8px;
          border: 0.5px solid #e8e7e5;
          display: block;
        }

        .output-section {
          border-top: 0.5px solid #f0efed;
          padding: 1.25rem 1.5rem;
        }
        .output-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .output-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #c0bebb;
        }
        .output-meta { font-size: 10px; color: #b0afac; letter-spacing: 0.05em; }
        .output-box {
          background: #f8f7f6;
          border: 0.5px solid #e8e7e5;
          border-radius: 8px;
          padding: 14px;
          min-height: 90px;
          font-size: 12.5px;
          line-height: 1.7;
          color: #b0afac;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .output-box.has-output { color: #111110; }

        .cursor-blink {
          display: inline-block;
          width: 7px;
          height: 13px;
          background: #b07d2e;
          animation: blink 1s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
          border-radius: 1px;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 1.5rem;
          border-top: 0.5px solid #f0efed;
          background: #f8f7f6;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #dddcd9;
          display: inline-block;
          margin-right: 8px;
        }
        .status-dot.active {
          background: #4a9e6a;
          box-shadow: 0 0 6px rgba(74, 158, 106, 0.4);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .status-text { font-size: 11px; color: #b0afac; letter-spacing: 0.06em; }
      `}</style>

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">AI Engine — v0.1</div>
        <div className="hero-logo">
          <img
            src="/logo.png"
            alt="YuktAI"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="hero-wordmark">YuktAI</span>
        </div>
        <div className="hero-sub">Do more with less</div>
        <div className="hero-chips">
          <span className="chip active">Open Source</span>
          <span className="chip">50% Human</span>
          <span className="chip">50% AI</span>
        </div>
      </div>

      {/* FRAMEWORK STRIP */}
      <div className="fw-strip">
        <div className="fw-label">Works with</div>
        <div className="fw-items">
          {[
            { name: "Angular", icon: "🅰️" },
            { name: "Next.js", icon: "▲" },
            { name: "React", icon: "⚛️" },
          ].map((f) => (
            <div className="fw-item" key={f.name}>
              <span className="fw-icon">{f.icon}</span>
              {f.name}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="card">
        {/* TABS */}
        <div className="tabs">
          <button
            className={`tab-btn ${tab === "ai" ? "tab-active" : ""}`}
            onClick={() => { setTab("ai"); handleClear(); }}
          >
            AI Text
          </button>
          <button
            className={`tab-btn ${tab === "ocr" ? "tab-active" : ""}`}
            onClick={() => { setTab("ocr"); handleClear(); }}
          >
            OCR
          </button>
        </div>

        {/* BODY */}
        <div className="card-body">
          {tab === "ai" && (
            <>
              <textarea
                className="prompt-input"
                placeholder="Enter your prompt..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && input && !loading) runAI();
                }}
              />
              <div className="actions">
                <button className="btn btn-ghost" onClick={handleClear}>Clear</button>
                <button
                  className="btn btn-primary"
                  onClick={runAI}
                  disabled={loading || !input}
                >
                  {loading ? "Running..." : "Run  ↵"}
                </button>
              </div>
            </>
          )}

          {tab === "ocr" && (
            <>
              {!preview ? (
                <div className="upload-zone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      if (preview) URL.revokeObjectURL(preview);
                      if (f) setPreview(URL.createObjectURL(f));
                    }}
                  />
                  <svg className="upload-icon" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1"/>
                    <circle cx="11" cy="12" r="2.5" stroke="currentColor" strokeWidth="1"/>
                    <path d="M4 22l7-7 5 5 4-4 8 8" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                  </svg>
                  <div className="upload-text">Drop image or click to upload</div>
                  <div className="upload-hint">PNG, JPG, WEBP</div>
                </div>
              ) : (
                <img className="preview-img" src={preview} alt="Preview" />
              )}

              <div className="actions">
                {preview && (
                  <button className="btn btn-ghost" onClick={handleClear}>Remove</button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={runOCR}
                  disabled={loading || !file}
                >
                  {loading ? "Extracting..." : "Extract Text"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* OUTPUT */}
        <div className="output-section">
          <div className="output-header">
            <span className="output-label">Output</span>
            {time && (
              <span className="output-meta">{(time / 1000).toFixed(2)}s</span>
            )}
          </div>
          <div className={`output-box ${output ? "has-output" : ""}`}>
            {loading
              ? <>Processing<span className="cursor-blink" /></>
              : output || "—"}
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="status-bar">
          <span>
            <span className={`status-dot ${loading ? "active" : ""}`} />
            <span className="status-text">{loading ? "running" : "ready"}</span>
          </span>
          {loading && (
            <button
              className="btn btn-ghost"
              style={{ height: 28, padding: "0 12px", fontSize: 11 }}
              onClick={handleCancel}
            >
              cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
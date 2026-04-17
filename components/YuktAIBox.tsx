"use client";

import React, { useState } from "react";
import { DM_Mono, Syne } from "next/font/google";
import * as YuktAIModule from "yuktai-js";

// ── 1. FONT DEFINITIONS ──────────────────────────────────────
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

// ── 2. INLINE ACCESSIBILITY ENGINE ───────────────────────────
function applyAccessibility(element: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(element)) return element;

  if (element.type === React.Fragment) {
    return React.cloneElement(
      element,
      {},
      React.Children.map(element.props.children, (child) => applyAccessibility(child))
    );
  }

  const props: any = { ...element.props };
  const type = element.type;

  if (type === "input" || type === "textarea") {
    if (!props["aria-label"] && !props["id"]) {
      props["aria-label"] = props.placeholder || `${type} field`;
    }
  }

  if (props.onClick && type !== "button" && type !== "a") {
    props.role = props.role || "button";
    props.tabIndex = props.tabIndex ?? 0;
    const originalKeyDown = props.onKeyDown;
    props.onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        props.onClick(e);
      }
      if (originalKeyDown) originalKeyDown(e);
    };
  }

  const children = React.Children.map(props.children, (child) => applyAccessibility(child));
  return React.cloneElement(element, props, children);
}

// ── 3. MAIN COMPONENT ────────────────────────────────────────
export default function Page() {
  const [tab, setTab] = useState<"ai" | "wcag">("ai");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);
  const [isA11yActive, setIsA11yActive] = useState(false);

  // 🔹 FIX: Handles module when exported as a list/array
  const getActiveEngine = () => {
    let engine = YuktAIModule as any;

    // If the module itself is an array/list, take the first item
    if (Array.isArray(engine)) {
      engine = engine[0];
    }

    // Standard recursive drill for .default wrappers
    while (engine && !engine.run && engine.default) {
      engine = engine.default;
    }

    return engine;
  };

  const runWCAG = async () => {
    const engine = getActiveEngine();
    if (!engine || typeof engine.run !== "function") {
      const keys = engine ? Object.keys(engine).join(", ") : "null";
      setOutput(`❌ Engine Error: run() not found. Found: ${keys}`);
      return;
    }

    try {
      setLoading(true);
      const start = performance.now();
      const res = await engine.run("ui.a11y.pro", {
        enabled: true,
        autoFix: true,
        highContrast: false,
        reduceMotion: true
      });
      setTime(performance.now() - start);
      setIsA11yActive(true);
      setOutput("♿ Accessibility Guard is now active.");
    } catch (e: any) {
      setOutput(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runAI = async () => {
    const engine = getActiveEngine();
    if (!engine || typeof engine.run !== "function") {
      setOutput("❌ Engine Error: run() not found.");
      return;
    }

    try {
      setLoading(true);
      const start = performance.now();
      const res = await engine.run("ai.text", input || "Hello");
      setTime(performance.now() - start);
      setOutput(typeof res === "string" ? res : JSON.stringify(res));
    } catch (e: any) {
      setOutput(`❌ AI Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return applyAccessibility(
    <div className={`${dmMono.variable} ${syne.variable}`} style={{ minHeight: "100vh", background: "#ffffff", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", fontFamily: "var(--font-dm-mono)" }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: "2.5rem" }}>YuktAI Lab</h1>
        
        <div style={{ display: "flex", gap: "20px", margin: "20px 0" }}>
          <div onClick={() => setTab("ai")} style={{ cursor: "pointer", borderBottom: tab === "ai" ? "2px solid black" : "none" }}>AI Prompt</div>
          <div onClick={() => setTab("wcag")} style={{ cursor: "pointer", borderBottom: tab === "wcag" ? "2px solid black" : "none" }}>WCAG Guard</div>
        </div>

        {tab === "ai" ? (
          <div>
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Enter your prompt..."
              style={{ width: "100%", height: "100px", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
            />
            <button onClick={runAI} style={{ padding: "10px 20px", cursor: "pointer" }} disabled={loading}>
              {loading ? "Processing..." : "Run AI"}
            </button>
          </div>
        ) : (
          <button onClick={runWCAG} style={{ padding: "10px 20px", cursor: "pointer" }} disabled={loading || isA11yActive}>
            {isA11yActive ? "Monitoring Active" : "Initialize Guard"}
          </button>
        )}

        <div style={{ marginTop: "30px", padding: "15px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}>
          <strong>Status:</strong> {output || "Ready"}
          {time && <span style={{ float: "right", opacity: 0.6 }}>{(time/1000).toFixed(2)}s</span>}
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { DM_Mono, Syne } from "next/font/google";
import YuktAI from "yuktai-js";

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
export function applyAccessibility(element: React.ReactNode): React.ReactNode {
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

  if (type === "input") {
    if (!props["aria-label"] && !props["id"]) {
      props["aria-label"] = props.placeholder || "Input field";
    }

    if (!props["aria-describedby"] && props.type === "email") {
      props["aria-describedby"] = "email-description";
    }
  }

  if (type === "textarea") {
    if (!props["aria-label"] && !props["id"]) {
      props["aria-label"] = props.placeholder || "Textarea field";
    }
  }

  if (type === "button") {
    if (!props["aria-label"]) {
      const text = typeof props.children === "string" ? props.children : "Button";
      props["aria-label"] = text;
    }
  }

  if (type === "img") {
    if (!props.alt) {
      props.alt = "Decorative image";
      props["aria-hidden"] = true;
    }
  }

  if (type === "a") {
    if (!props.href) {
      props.role = props.role || "button";
      props.tabIndex = props.tabIndex ?? 0;
    }

    if (!props["aria-label"] && typeof props.children === "string") {
      props["aria-label"] = props.children.trim() || "Link";
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

  if (type === "table" && !props.summary) {
    props.summary = "Data table with example rows";
  }

  const children = React.Children.map(props.children, (child) => applyAccessibility(child));
  return React.cloneElement(element, props, children);
}

// ── 3. GET RUNTIME ───────────────────────────────────────────
function getRuntime() {
  void YuktAI;
  const rt = (globalThis as any).__yuktai_runtime__;
  if (!rt || typeof rt.run !== "function") {
    throw new Error(`Runtime not ready. Available plugins: ${YuktAI.list().join(", ")}`);
  }
  return rt;
}

// ── 4. MAIN COMPONENT ────────────────────────────────────────
export default function Page() {
  const [tab, setTab] = useState<"ai" | "wcag">("ai");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);
  const [isA11yActive, setIsA11yActive] = useState(false);

  const wcagLink = "https://www.w3.org/WAI/standards-guidelines/wcag/";

  const runWCAG = async () => {
    try {
      setLoading(true);
      const rt = getRuntime();
      const start = performance.now();
      const res = await rt.run("ui.a11y.pro", {
        enabled: true,
        autoFix: true,
        highContrast: false,
        reduceMotion: true,
      });
      setTime(performance.now() - start);
      setIsA11yActive(true);
      setOutput(typeof res === "string" ? res : JSON.stringify(res, null, 2));
    } catch (e: any) {
      setOutput(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runAI = async () => {
    try {
      setLoading(true);
      const rt = getRuntime();
      const start = performance.now();
      const res = await rt.run("ai.text", input || "Hello");
      setTime(performance.now() - start);
      setOutput(typeof res === "string" ? res : JSON.stringify(res, null, 2));
    } catch (e: any) {
      setOutput(`❌ AI Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const demoBefore = (
    <div style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "10px", marginBottom: "1rem" }}>
      <h3 style={{ margin: 0, marginBottom: "0.75rem" }}>Before WCAG improvements</h3>
      <div
        onClick={() => setOutput("Card clicked")}
        style={{ padding: "1rem", background: "#eef", cursor: "pointer", marginBottom: "1rem" }}
      >
        Clickable card without role or keyboard support
      </div>
      <img src="/favicon.ico" style={{ width: "96px", height: "96px", display: "block", marginBottom: "1rem" }} />
      <input placeholder="Name" style={{ width: "100%", padding: "10px", marginBottom: "0.75rem", border: "1px solid #ccc", borderRadius: "6px" }} />
      <textarea placeholder="Message" style={{ width: "100%", padding: "10px", height: "80px", border: "1px solid #ccc", borderRadius: "6px" }} />
      <button style={{ marginTop: "1rem", padding: "0.75rem 1.25rem" }}>Send</button>
      <a style={{ display: "inline-block", marginTop: "1rem", color: "#0070f3" }}>
        Learn more
      </a>
    </div>
  );

  const demoAfter = applyAccessibility(demoBefore);

  return (
    <div className={`${dmMono.variable} ${syne.variable}`} style={{ minHeight: "100vh", background: "#ffffff", padding: "2rem" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", fontFamily: "var(--font-dm-mono)" }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: "2.5rem", marginBottom: "0.5rem" }}>WCAG Accessibility Demo</h1>
        <p style={{ marginTop: 0, color: "#444", lineHeight: 1.7 }}>
          This demo shows a deeper WCAG example with common accessibility issues and an accessible version generated by the helper. The code covers:
        </p>
        <ul style={{ marginTop: "0.5rem", color: "#444" }}>
          <li>Missing labels on form controls</li>
          <li>Images without alternative text</li>
          <li>Clickable non-interactive elements</li>
          <li>Links without an href</li>
          <li>Keyboard operability and ARIA hints</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          Reference: <a href={wcagLink} target="_blank" rel="noopener noreferrer">WCAG standards</a>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: "12px", padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Before</h2>
            {demoBefore}
          </div>
          <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: "12px", padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>After</h2>
            {demoAfter}
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "#f7f9fc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <button onClick={runWCAG} style={{ padding: "12px 22px", cursor: "pointer" }} disabled={loading || isA11yActive}>
              {isA11yActive ? "WCAG Guard Active" : "Run WCAG Guard"}
            </button>
            <p style={{ margin: "0.75rem 0 0", color: "#555" }}>
              The WCAG guard from <code>yuktai-js</code> runs at runtime and can auto-fix accessibility issues for interactive UI elements.
            </p>
          </div>

          <div style={{ padding: "1rem", background: "#f9f9f9", borderRadius: "12px", border: "1px solid #eee", whiteSpace: "pre-wrap", fontFamily: "var(--font-dm-mono)", color: "#1a1a1a" }}>
            <strong>Status:</strong>
            <div style={{ marginTop: "0.75rem" }}>{output || "Ready"}</div>
            {time && <div style={{ marginTop: "0.75rem", opacity: 0.7 }}>{(time / 1000).toFixed(2)}s elapsed</div>}
          </div>

          {tab === "ai" ? (
            <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #eee" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your prompt..."
                style={{ width: "100%", height: "100px", padding: "12px", border: "1px solid #ddd", borderRadius: "8px" }}
              />
              <button onClick={runAI} style={{ marginTop: "1rem", padding: "12px 22px", cursor: "pointer" }} disabled={loading}>
                {loading ? "Processing..." : "Run AI"}
              </button>
            </div>
          ) : null}

          <div style={{ padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #eee" }}>
            <strong>WCAG helper details</strong>
            <p style={{ margin: "0.75rem 0 0", color: "#555" }}>
              The helper adds ARIA labels, keyboard support for clickable regions, alt text for images, and role fixes for anchors and buttons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

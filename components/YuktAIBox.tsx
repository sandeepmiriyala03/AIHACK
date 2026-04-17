"use client";

import React, { useState } from "react";
import { DM_Mono, Syne } from "next/font/google";
import YuktAI from "yuktai-js";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

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
  const type = typeof element.type === "string" ? element.type : null;

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

  if (type === "select") {
    if (!props["aria-label"] && !props["id"]) {
      props["aria-label"] = props.placeholder || "Choose an option";
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

  if (
    (type === "div" || type === "span" || type === "li") &&
    props.onClick &&
    type !== "button" &&
    type !== "a"
  ) {
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

  const children = React.Children.map(props.children, (child) =>
    applyAccessibility(child)
  );

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
    <div className="yuktai-card">
      <h3 className="yuktai-card-title"><AccessibilityNewIcon style={{ fontSize: 20, marginRight: 8, color: "#0f766e" }} />Before WCAG improvements</h3>
      <div
        onClick={() => setOutput("Card clicked")}
        className="yuktai-clickable-card"
      >
        <AccessibilityNewIcon style={{ fontSize: 18, marginRight: 8, verticalAlign: "middle" }} />
        Clickable card without role or keyboard support
      </div>
      <div className="yuktai-inline-row">
        <ImageRoundedIcon style={{ marginRight: 8, color: "#0f766e" }} />
        <img src="/favicon.ico" alt="Favicon example" className="yuktai-image" />
      </div>
      <input placeholder="Name" className="yuktai-field" />
      <textarea placeholder="Message" className="yuktai-field" />
      <button className="yuktai-button" type="button">
        <SendRoundedIcon style={{ fontSize: 18, marginRight: 8 }} />Send
      </button>
      <a className="yuktai-link">
        <LinkRoundedIcon style={{ fontSize: 18, marginRight: 6 }} />Learn more
      </a>
    </div>
  );

  const demoAfter = applyAccessibility(demoBefore);

  const sampleMarkup = `<!-- Accessible output example -->
<div role="button" tabindex="0" aria-label="Clickable card">Clickable card</div>
<img src="/favicon.ico" alt="Decorative image" aria-hidden="true" />
<input type="text" aria-label="Name" placeholder="Name" />
<textarea aria-label="Message" placeholder="Message"></textarea>
<button aria-label="Send">Send</button>
<a role="button" tabindex="0" aria-label="Learn more">Learn more</a>`;

  return (
    <div className={`${dmMono.variable} ${syne.variable}`} style={{ minHeight: "100vh", background: "#ffffff", padding: "2rem" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", fontFamily: "var(--font-dm-mono)" }}>
        <style>{`
          .yuktai-card { border: 1px solid #ddd; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; background: #fff; }
          .yuktai-card-title { margin: 0 0 0.75rem; display: flex; align-items: center; color: #0f766e; font-size: 1rem; }
          .yuktai-clickable-card { padding: 1rem; background: #eef; cursor: pointer; border-radius: 10px; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
          .yuktai-image { width: 96px; height: 96px; display: block; margin-bottom: 1rem; border-radius: 12px; }
          .yuktai-field { width: 100%; padding: 10px; margin-bottom: 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; }
          .yuktai-button { margin-top: 1rem; padding: 0.75rem 1.25rem; border: none; border-radius: 8px; background: #0f766e; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
          .yuktai-button:hover { background: #115e59; }
          .yuktai-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 1rem; color: #0070f3; text-decoration: none; }
          .yuktai-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-top: 1rem; }
          .yuktai-top { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-start; }
          .yuktai-top p { flex: 1 1 320px; }
          .yuktai-output { padding: 1rem; background: #f9f9f9; border-radius: 12px; border: 1px solid #eee; white-space: pre-wrap; font-family: var(--font-dm-mono); color: #1a1a1a; }
          .yuktai-snippet { margin-top: 1rem; padding: 1rem; background: #111; color: #f8f8f8; border-radius: 10px; overflow-x: auto; font-size: 0.9rem; }
          @media (max-width: 720px) { .yuktai-top { flex-direction: column; } .yuktai-button { width: 100%; justify-content: center; } }
          @media (max-width: 520px) { .yuktai-card, .yuktai-output, .yuktai-snippet { padding: 0.85rem; } }
        `}</style>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: "2.5rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <RocketLaunchRoundedIcon style={{ fontSize: 32, color: "#0f766e" }} /> YuktAI AI Engine
        </h1>
        <p style={{ margin: "0.25rem 0 1rem", color: "#222", fontSize: "1.1rem", fontWeight: 600 }}>
          Do more with less
        </p>
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
            <pre style={{ marginTop: "1rem", padding: "1rem", background: "#111", color: "#f8f8f8", borderRadius: "10px", overflowX: "auto", fontSize: "0.9rem" }}>
              <code>{sampleMarkup}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
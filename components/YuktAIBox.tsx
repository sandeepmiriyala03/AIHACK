"use client";

import React from "react";
import { DM_Mono, Syne } from "next/font/google";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
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
    props.onClick
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

// ── 4. VOICE PLUGIN EXAMPLE ─────────────────────────────
export const voicePlugin = {
  name: "voice.text",

  async execute(input: string) {
    // Here input = converted speech text

    if (!input || input.trim() === "") {
      return "🎤 No speech detected";
    }

    return `🎤 You said: ${input}`;
  }
};

// ── 5. MAIN COMPONENT ────────────────────────────────────
export default function YuktAIBox() {
  const wcagLink = "https://www.w3.org/WAI/standards-guidelines/wcag/";

  const demoBefore = (
    <div className="yuktai-card">
      <h3 className="yuktai-card-title">
        <AccessibilityNewIcon style={{ fontSize: 20, marginRight: 8, color: "#0f766e" }} />
        Before WCAG improvements
      </h3>
      <div
        onClick={() => alert("Card clicked")}
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
        <SendRoundedIcon style={{ fontSize: 18, marginRight: 8 }} />
        Send
      </button>
      <a className="yuktai-link">
        <LinkRoundedIcon style={{ fontSize: 18, marginRight: 6 }} />
        Learn more
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
          .yuktai-inline-row { display: flex; align-items: center; margin-bottom: 1rem; }
          .yuktai-image { width: 96px; height: 96px; display: block; border-radius: 12px; }
          .yuktai-field { width: 100%; padding: 10px; margin-bottom: 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; }
          .yuktai-button { margin-top: 1rem; padding: 0.75rem 1.25rem; border: none; border-radius: 8px; background: #0f766e; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
          .yuktai-button:hover { background: #115e59; }
          .yuktai-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 1rem; color: #0070f3; text-decoration: none; }
          .yuktai-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-top: 1rem; }
          @media (max-width: 720px) { .yuktai-grid { grid-template-columns: 1fr; } .yuktai-button { width: 100%; justify-content: center; } }
          @media (max-width: 520px) { .yuktai-card { padding: 0.85rem; } }
        `}</style>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: "2.5rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <RocketLaunchRoundedIcon style={{ fontSize: 32, color: "#0f766e" }} />
          YuktAI Accessibility Demo
        </h1>
        <p style={{ margin: "0.25rem 0 1rem", color: "#222", fontSize: "1.1rem", fontWeight: 600 }}>
          Do more with less
        </p>
        <p style={{ marginTop: 0, color: "#444", lineHeight: 1.7 }}>
          This demo shows WCAG accessibility improvements using the YuktAI helper. It supports React, Next.js, and Angular frameworks.
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

        <div className="yuktai-grid">
          <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: "12px", padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Before</h2>
            {demoBefore}
          </div>
          <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: "12px", padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>After</h2>
            {demoAfter}
          </div>
        </div>

        <div style={{ marginTop: "2rem", padding: "1rem", background: "#fff", borderRadius: "12px", border: "1px solid #eee" }}>
          <strong>Voice Plugin Example</strong>
          <p style={{ margin: "0.75rem 0 0", color: "#555" }}>
            The voice plugin processes speech-to-text input. It checks for valid speech and returns a formatted response.
          </p>
          <pre style={{ marginTop: "1rem", padding: "1rem", background: "#111", color: "#f8f8f8", borderRadius: "10px", overflowX: "auto", fontSize: "0.9rem" }}>
            <code>{`export const voicePlugin = {
  name: "voice.text",

  async execute(input: string) {
    // Here input = converted speech text

    if (!input || input.trim() === "") {
      return "🎤 No speech detected";
    }

    return \`🎤 You said: \${input}\`;
  }
};`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
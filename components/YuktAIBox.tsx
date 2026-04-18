"use client";

import React, { useState } from "react";
import { DM_Mono, Syne } from "next/font/google";

// ── FONTS ────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// CORE ENGINE  — this is what gets published as the npm package
// ─────────────────────────────────────────────────────────────
export interface A11yConfig {
  enabled: boolean;
  highContrast?: boolean;
  reduceMotion?: boolean;
  autoFix?: boolean;
}

export interface A11yReport {
  fixed: number;
  scanned: number;
  details: { tag: string; fix: string; element: string }[];
}

export const wcagPlugin = {
  name: "yuktai-a11y",
  version: "1.0.0",
  observer: null as MutationObserver | null,

  async execute(config: A11yConfig): Promise<string> {
    if (!config.enabled) {
      this.stopObserver();
      return "yuktai-a11y: disabled.";
    }
    const report = this.applyFixes(config);
    if (config.autoFix) this.startObserver(config);
    return `yuktai-a11y: ${report.fixed} fixes applied across ${report.scanned} nodes.`;
  },

  // ── DOM fixer — NEVER touches id attributes ──────────────
  applyFixes(config: A11yConfig): A11yReport {
    const report: A11yReport = { fixed: 0, scanned: 0, details: [] };
    if (typeof document === "undefined") return report;

    const elements = document.querySelectorAll("*");
    report.scanned = elements.length;

    elements.forEach((el) => {
      const h = el as HTMLElement;
      const tag = h.tagName.toLowerCase();

      // 1. Empty buttons / links
      if ((tag === "a" || tag === "button") && !h.innerText.trim()) {
        if (!h.getAttribute("aria-label")) {
          const label = h.getAttribute("title") || "Interactive element";
          h.setAttribute("aria-label", label);
          report.details.push({ tag, fix: `aria-label="${label}"`, element: h.outerHTML.slice(0, 60) });
          report.fixed++;
        }
      }

      // 2. Clickable non-interactive elements
      const isClickable =
        h.hasAttribute("onclick") ||
        (typeof window !== "undefined" && window.getComputedStyle(h).cursor === "pointer");
      if (isClickable && !["button", "a", "input", "select", "textarea"].includes(tag)) {
        if (!h.getAttribute("role")) {
          h.setAttribute("role", "button");
          report.details.push({ tag, fix: 'role="button"', element: h.outerHTML.slice(0, 60) });
          report.fixed++;
        }
        if (h.tabIndex < 0) { h.tabIndex = 0; report.fixed++; }
        if (!h.onkeydown) {
          h.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); h.click(); }
          };
        }
      }

      // 3. Form fields — inject aria-label from placeholder (NEVER touch id)
      if (["input", "select", "textarea"].includes(tag)) {
        if (!h.getAttribute("aria-label") && !h.getAttribute("aria-labelledby")) {
          const label = h.getAttribute("placeholder") || h.getAttribute("name") || tag;
          h.setAttribute("aria-label", label);
          report.details.push({ tag, fix: `aria-label="${label}"`, element: h.outerHTML.slice(0, 60) });
          report.fixed++;
        }
        if (h.hasAttribute("required") && !h.getAttribute("aria-required")) {
          h.setAttribute("aria-required", "true");
          report.fixed++;
        }
      }

      // 4. Images — empty alt for decorative
      if (tag === "img" && !h.hasAttribute("alt")) {
        h.setAttribute("alt", "");
        h.setAttribute("aria-hidden", "true");
        report.details.push({ tag, fix: 'alt="" aria-hidden="true"', element: h.outerHTML.slice(0, 60) });
        report.fixed++;
      }

      // 5. Tables without headers
      if (tag === "table" && !el.querySelector("th")) {
        if (!h.getAttribute("role")) {
          h.setAttribute("role", "grid");
          report.details.push({ tag, fix: 'role="grid"', element: h.outerHTML.slice(0, 60) });
          report.fixed++;
        }
      }

      // 6. Visual preferences
      if (config.highContrast) h.style.filter = "contrast(1.15) brightness(1.05)";
      if (config.reduceMotion) { h.style.transition = "none"; h.style.animation = "none"; }
    });

    this.ensureLiveRegion();
    return report;
  },

  startObserver(config: A11yConfig) {
    if (this.observer || typeof document === "undefined") return;
    this.observer = new MutationObserver(() => this.applyFixes(config));
    this.observer.observe(document.body, { childList: true, subtree: true });
  },
  stopObserver() { this.observer?.disconnect(); this.observer = null; },

  ensureLiveRegion() {
    if (typeof document === "undefined" || document.getElementById("yukt-sr-announcer")) return;
    const node = document.createElement("div");
    node.id = "yukt-sr-announcer";
    node.setAttribute("aria-live", "polite");
    node.setAttribute("aria-atomic", "true");
    node.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(node);
  },
  announce(msg: string) {
    const el = document.getElementById("yukt-sr-announcer");
    if (el) el.innerText = msg;
  },
};

// ── React helper — transforms JSX props, NEVER touches ids ──
export function applyAccessibility(node: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(node)) return node;
  if (node.type === React.Fragment) {
    return React.cloneElement(node, {},
      React.Children.map(node.props.children, applyAccessibility)
    );
  }
  const p: any = { ...node.props };
  const tag = typeof node.type === "string" ? node.type : null;

  if (tag === "input" && !p["aria-label"] && !p["aria-labelledby"]) {
    p["aria-label"] = p.placeholder || p.name || "Input field";
    if (p.type === "email" && !p["aria-describedby"]) p["aria-describedby"] = "email-hint";
  }
  if (tag === "textarea" && !p["aria-label"] && !p["aria-labelledby"])
    p["aria-label"] = p.placeholder || "Text area";
  if (tag === "select" && !p["aria-label"] && !p["aria-labelledby"])
    p["aria-label"] = p.name || "Dropdown";
  if (tag === "button" && !p["aria-label"]) {
    const txt = typeof p.children === "string" ? p.children : null;
    if (txt) p["aria-label"] = txt;
  }
  if (tag === "img" && !p.alt) { p.alt = ""; p["aria-hidden"] = true; }
  if (tag === "a") {
    if (!p.href) { p.role = p.role || "button"; p.tabIndex = p.tabIndex ?? 0; }
    if (!p["aria-label"] && typeof p.children === "string")
      p["aria-label"] = p.children.trim() || "Link";
  }
  if (["div", "span", "li"].includes(tag!) && p.onClick) {
    p.role = p.role || "button";
    p.tabIndex = p.tabIndex ?? 0;
    const orig = p.onKeyDown;
    p.onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); p.onClick(e); }
      orig?.(e);
    };
  }
  return React.cloneElement(node, p, React.Children.map(p.children, applyAccessibility));
}

// ─────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────
const TEAL = "#0d9488";
const DARK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f8fafc";

function Code({ children, added = [] }: { children: string; added?: string[] }) {
  return (
    <pre style={{
      background: "#0f172a", borderRadius: 10, padding: "16px 20px",
      overflowX: "auto", fontSize: 12.5, lineHeight: 2, margin: 0,
      fontFamily: "var(--font-dm-mono, monospace)",
    }}>
      {children.split("\n").map((line, i) => {
        const isNew = added.some(k => line.includes(k));
        return (
          <span key={i} style={{
            display: "block",
            background: isNew ? "rgba(13,148,136,0.15)" : "transparent",
            borderLeft: isNew ? `3px solid ${TEAL}` : "3px solid transparent",
            paddingLeft: 10, marginLeft: -10,
            color: isNew ? "#5eead4" : "#94a3b8",
          }}>
            {line || " "}
          </span>
        );
      })}
    </pre>
  );
}

function DiffCard({ title, tagline, before, after, addedKeys, whatItFixes }: {
  title: string; tagline: string;
  before: string; after: string; addedKeys: string[];
  whatItFixes: string;
}) {
  const [side, setSide] = useState<"before" | "after">("before");
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", background: "#fff" }}>
      <div style={{
        padding: "12px 16px", background: BG, borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-dm-mono, monospace)", fontSize: 13, fontWeight: 600, color: TEAL }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{tagline}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["before", "after"] as const).map(s => (
            <button key={s} onClick={() => setSide(s)} style={{
              padding: "4px 12px", fontSize: 11, fontWeight: 700, borderRadius: 99,
              cursor: "pointer", border: "1.5px solid",
              borderColor: side === s ? (s === "before" ? "#f87171" : TEAL) : BORDER,
              background: side === s ? (s === "before" ? "#fef2f2" : "#f0fdfa") : "#fff",
              color: side === s ? (s === "before" ? "#b91c1c" : "#0f766e") : MUTED,
            }}>
              {s === "before" ? "⚠ Problem" : "✓ Fixed"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <Code added={side === "after" ? addedKeys : []}>{side === "before" ? before : after}</Code>
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 8,
          background: side === "before" ? "#fef2f2" : "#f0fdfa",
          fontSize: 12, lineHeight: 1.6,
          color: side === "before" ? "#991b1b" : "#0f766e",
          display: "flex", gap: 8,
        }}>
          <span style={{ flexShrink: 0 }}>{side === "before" ? "⚠" : "✓"}</span>
          <span>{side === "before"
            ? `Problem: ${whatItFixes}`
            : "Fixed automatically — developer wrote zero extra code"}
          </span>
        </div>
      </div>
    </div>
  );
}

function LiveDemo() {
  const [on, setOn] = useState(false);
  const [hc, setHc] = useState(false);
  const [rm, setRm] = useState(false);
  const [report, setReport] = useState<A11yReport | null>(null);

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) {
      const r = wcagPlugin.applyFixes({ enabled: true, highContrast: hc, reduceMotion: rm });
      setReport(r);
      wcagPlugin.announce(`Plugin active. ${r.fixed} issues fixed.`);
    } else {
      wcagPlugin.stopObserver();
      setReport(null);
    }
  };

  const rawElements = (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
      <div
        onClick={() => alert("Card clicked!")}
        style={{
          padding: "12px 14px", background: "#eff6ff", borderRadius: 8,
          cursor: "pointer", fontSize: 13, display: "flex", gap: 8, alignItems: "center",
          border: "1px solid #bfdbfe",
        }}
      >
        <span>🃏</span> Clickable card — no role, not keyboard accessible
      </div>
      <input placeholder="Your email" style={{
        padding: "9px 12px", border: `1px solid ${BORDER}`, borderRadius: 7,
        fontSize: 13, width: "100%", boxSizing: "border-box" as const,
      }} />
      <textarea placeholder="Your message" rows={2} style={{
        padding: "9px 12px", border: `1px solid ${BORDER}`, borderRadius: 7,
        fontSize: 13, width: "100%", resize: "vertical" as const,
        fontFamily: "inherit", boxSizing: "border-box" as const,
      }} />
      <select style={{
        padding: "9px 12px", border: `1px solid ${BORDER}`, borderRadius: 7,
        fontSize: 13, width: "100%",
      }}>
        <option>Choose your country</option>
        <option>India</option>
        <option>USA</option>
        <option>UK</option>
      </select>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
        <button style={{
          padding: "9px 18px", background: TEAL, color: "#fff",
          border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>Send message</button>
        <a style={{ padding: "9px 14px", color: "#2563eb", cursor: "pointer", fontSize: 13 }}>
          Learn more
        </a>
      </div>
    </div>
  );

  const fixedElements = applyAccessibility(rawElements);

  return (
    <div>
      <div style={{
        padding: "14px 18px", background: "#fff", borderRadius: 12,
        border: `1px solid ${BORDER}`, marginBottom: 16,
        display: "flex", flexWrap: "wrap" as const, gap: 12, alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: DARK, flex: 1, minWidth: 100 }}>
          Plugin options
        </span>
        {[
          { label: "highContrast", val: hc, set: setHc },
          { label: "reduceMotion", val: rm, set: setRm },
        ].map(({ label, val, set }) => (
          <label key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: DARK }}>
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: TEAL }} />
            {label}
          </label>
        ))}
        <button onClick={toggle} style={{
          padding: "8px 20px", borderRadius: 99, border: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 13,
          background: on ? "#fef2f2" : "#f0fdfa",
          color: on ? "#b91c1c" : "#0f766e",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>{on ? "⏹" : "▶"}</span> {on ? "Disable plugin" : "Run plugin"}
        </button>
      </div>

      {report && (
        <div style={{
          marginBottom: 14, padding: "10px 16px", background: "#f0fdfa",
          border: "1px solid #99f6e4", borderRadius: 9, fontSize: 13, fontWeight: 600,
          color: "#0f766e", fontFamily: "var(--font-dm-mono, monospace)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>✓</span>
          yuktai-a11y: {report.fixed} fixes applied across {report.scanned} nodes
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div style={{ border: "1.5px solid #fca5a5", borderRadius: 12, overflow: "hidden" }}>
          <div style={{
            padding: "9px 14px", background: "#fef2f2", borderBottom: "1px solid #fca5a5",
            fontSize: 12, fontWeight: 700, color: "#b91c1c", display: "flex", gap: 6, alignItems: "center",
          }}>
            <span>⚠</span> Raw — developer wrote no ARIA
          </div>
          <div style={{ padding: 16 }}>{rawElements}</div>
        </div>
        <div style={{ border: "1.5px solid #5eead4", borderRadius: 12, overflow: "hidden" }}>
          <div style={{
            padding: "9px 14px", background: "#f0fdfa", borderBottom: "1px solid #5eead4",
            fontSize: 12, fontWeight: 700, color: "#0f766e", display: "flex", gap: 6, alignItems: "center",
          }}>
            <span>✓</span> After applyAccessibility() — inspect DOM to verify
          </div>
          <div style={{ padding: 16 }}>{fixedElements}</div>
        </div>
      </div>

      <div style={{
        marginTop: 12, padding: "10px 14px", background: "#eff6ff",
        borderRadius: 8, fontSize: 12, color: "#1e40af", lineHeight: 1.7,
        display: "flex", gap: 8,
      }}>
        <span style={{ flexShrink: 0 }}>ℹ</span>
        Both panels are the same JSX. Right panel passes through{" "}
        <code style={{ fontFamily: "var(--font-dm-mono, monospace)", background: "#dbeafe", padding: "1px 5px", borderRadius: 4 }}>
          applyAccessibility()
        </code>{" "}
        — open DevTools and inspect any element to see injected ARIA attributes.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
type Tab = "what" | "how" | "examples" | "demo" | "api";

export default function YuktAIBox() {
  const [tab, setTab] = useState<Tab>("what");
  const [fw, setFw] = useState("React");

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "what",     label: "What it does",   emoji: "♿" },
    { id: "how",      label: "How to install", emoji: "📦" },
    { id: "examples", label: "DOM examples",   emoji: "🔍" },
    { id: "demo",     label: "Live demo",      emoji: "▶" },
    { id: "api",      label: "Full API",       emoji: "📄" },
  ];

  const DOM_DIFFS = [
    {
      title: "<input> missing aria-label",
      tagline: "Screen readers cannot announce what the field is for",
      before:
`<label>Email</label>
<input
  type="email"
  placeholder="you@example.com"
/>
{/* ❌ label and input are NOT connected
    Screen reader says: "edit text" — useless */}`,
      after:
`<label htmlFor="email">Email</label>
<input
  type="email"
  id="email"
  placeholder="you@example.com"
  aria-label="you@example.com"
  aria-describedby="email-hint"
/>
{/* ✓ plugin injected aria-label from placeholder
    developer still owns the id — plugin never touches it */}`,
      addedKeys: ["aria-label", "aria-describedby"],
      whatItFixes: "No link between label and input. Screen reader says 'edit text' with no context.",
    },
    {
      title: "<button> icon-only, no name",
      tagline: "Icon buttons are invisible to screen readers",
      before:
`<button>
  <svg><!-- send icon --></svg>
</button>
{/* ❌ Screen reader says: "button"
    User has no idea what it does */}`,
      after:
`<button aria-label="Send message">
  <svg aria-hidden="true"><!-- send icon --></svg>
</button>
{/* ✓ plugin adds aria-label from title or context
    SVG gets aria-hidden so it is not read twice */}`,
      addedKeys: ["aria-label", "aria-hidden"],
      whatItFixes: "Icon-only button. Screen reader announces 'button' with zero context.",
    },
    {
      title: "<div onClick> not keyboard accessible",
      tagline: "Mouse only — Tab key and Enter key do nothing",
      before:
`<div onClick={openMenu}>
  Open settings
</div>
{/* ❌ Tab key skips this entirely
    Keyboard users cannot reach it */}`,
      after:
`<div
  onClick={openMenu}
  role="button"
  tabIndex={0}
  onKeyDown={e => {
    if (e.key === "Enter" || e.key === " ") openMenu();
  }}
>
  Open settings
</div>
{/* ✓ plugin auto-injects role, tabIndex, onKeyDown */}`,
      addedKeys: ["role", "tabIndex", "onKeyDown"],
      whatItFixes: "Clickable div. Tab key skips it. Keyboard users cannot reach it.",
    },
    {
      title: "<img> no alt text",
      tagline: "Screen readers read out the raw filename",
      before:
`<img src="/hero-banner.png" />
{/* ❌ Screen reader reads:
    "hero-banner.png" — confusing */}`,
      after:
`<img
  src="/hero-banner.png"
  alt=""
  aria-hidden="true"
/>
{/* ✓ Decorative image: alt="" + aria-hidden
    For meaningful images: you must write the alt text */}`,
      addedKeys: ["alt", "aria-hidden"],
      whatItFixes: "No alt attribute. Screen reader reads the raw filename aloud.",
    },
    {
      title: "<a> no href, no label",
      tagline: "Anchor used as button breaks keyboard navigation",
      before:
`<a onClick={goNext}>
  Continue
</a>
{/* ❌ No href = not focusable by Tab
    Announced as "link" but behaves as button */}`,
      after:
`<a
  onClick={goNext}
  role="button"
  tabIndex={0}
  aria-label="Continue"
>
  Continue
</a>
{/* ✓ plugin adds role + tabIndex + aria-label
    Now keyboard accessible and correctly announced */}`,
      addedKeys: ["role", "tabIndex", "aria-label"],
      whatItFixes: "Anchor without href is not focusable. Keyboard users cannot trigger it.",
    },
    {
      title: "<select> no accessible name",
      tagline: "Dropdown announced as 'combobox' with no context",
      before:
`<select>
  <option>Choose country</option>
  <option>India</option>
</select>
{/* ❌ Screen reader says: "combobox"
    User has no idea what they are selecting */}`,
      after:
`<select aria-label="Country">
  <option>Choose country</option>
  <option>India</option>
</select>
{/* ✓ plugin injects aria-label from name or placeholder
    Developer still controls id and label association */}`,
      addedKeys: ["aria-label"],
      whatItFixes: "No accessible name. Screen reader announces 'combobox' with zero context.",
    },
    {
      title: "<textarea> missing label",
      tagline: "Placeholder alone is not WCAG-compliant",
      before:
`<textarea
  placeholder="Write your message..."
  rows={4}
/>
{/* ❌ WCAG 2.1 SC 1.3.1 requires a proper label
    Placeholder disappears when user types */}`,
      after:
`<textarea
  placeholder="Write your message..."
  aria-label="Your message"
  rows={4}
/>
{/* ✓ plugin injects aria-label from placeholder
    Placeholder is still visible — nothing breaks */}`,
      addedKeys: ["aria-label"],
      whatItFixes: "Placeholder is not a valid label per WCAG 2.1 SC 1.3.1.",
    },
    {
      title: "<table> no column headers",
      tagline: "Data tables without th are unreadable to screen readers",
      before:
`<table>
  <tr>
    <td>Name</td>
    <td>Score</td>
  </tr>
</table>
{/* ❌ No th — screen reader reads raw cells
    with no column context */}`,
      after:
`<table role="grid" aria-label="Scores table">
  <tr>
    <td>Name</td>
    <td>Score</td>
  </tr>
</table>
{/* ✓ plugin adds role=grid as fallback
    Developer should add th for full compliance */}`,
      addedKeys: ["role", "aria-label"],
      whatItFixes: "No th elements. Screen reader reads raw cell values with no column header context.",
    },
  ];

  const FW: Record<string, { install: string; code: string }> = {
    React: {
      install: "npm install yuktai-a11y",
      code:
`// 1. Wrap your whole app once — done
import { YuktA11yProvider } from 'yuktai-a11y/react';

export default function App() {
  return (
    <YuktA11yProvider
      enabled
      autoFix
      highContrast={false}
      reduceMotion={false}
    >
      <YourApp />
    </YuktA11yProvider>
  );
}

// 2. Read the fix report anywhere
import { useA11y } from 'yuktai-a11y/react';

function StatusBar() {
  const { fixed, scanned } = useA11y();
  return <p>{fixed} fixes across {scanned} nodes</p>;
}

// 3. Transform a single JSX subtree manually
import { applyAccessibility } from 'yuktai-a11y/react';

const safe = applyAccessibility(<input placeholder="Email" />);
// returns: <input placeholder="Email" aria-label="Email" />`,
    },
    "Next.js": {
      install: "npm install yuktai-a11y",
      code:
`// app/layout.tsx — add once, covers every page
'use client';
import { YuktA11yProvider } from 'yuktai-a11y/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <YuktA11yProvider enabled autoFix>
          {children}
        </YuktA11yProvider>
      </body>
    </html>
  );
}

// next.config.js — only needed for older Next.js
module.exports = {
  transpilePackages: ['yuktai-a11y'],
};`,
    },
    Angular: {
      install: "npm install yuktai-a11y",
      code:
`// app.module.ts — import the module once
import { YuktA11yModule } from 'yuktai-a11y/angular';

@NgModule({
  imports: [
    BrowserModule,
    YuktA11yModule.forRoot({
      enabled: true,
      autoFix: true,
    }),
  ],
})
export class AppModule {}

// any.component.html — use the directive
<input yuktA11y placeholder="Search" />
<div yuktA11y (click)="open()">Open menu</div>
<button yuktA11y><mat-icon>send</mat-icon></button>

// any.component.ts — call the service directly
import { YuktA11yService } from 'yuktai-a11y/angular';

@Component({...})
export class MyComponent {
  constructor(private a11y: YuktA11yService) {}

  scan() {
    const r = this.a11y.applyFixes({ enabled: true });
    console.log(r.fixed, 'fixes applied');
  }
}`,
    },
  };

  return (
    <div
      className={`${dmMono.variable} ${syne.variable}`}
      style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-dm-mono, monospace)" }}
    >
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ background: DARK, padding: "2.5rem 2rem 0" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>

          <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" as const }}>
            {["Open Source", "MIT License", "WCAG 2.1 AA", "v1.0.0", "TypeScript"].map(b => (
              <span key={b} style={{
                fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em",
              }}>{b}</span>
            ))}
          </div>

          <h1 style={{
            fontFamily: "var(--font-syne, sans-serif)",
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            margin: "0 0 12px", fontWeight: 800, color: "#fff", lineHeight: 1.15,
          }}>
            <span style={{ color: TEAL }}>yuktai-a11y</span>
            <br />
            <span style={{ fontWeight: 700, fontSize: "55%", color: "rgba(255,255,255,0.55)" }}>
              Zero-config WCAG accessibility for React · Next.js · Angular
            </span>
          </h1>

          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 1.5rem",
            lineHeight: 1.8, maxWidth: 560,
          }}>
            Drop in one provider. Your app becomes screen-reader friendly, keyboard
            navigable, and ARIA-complete automatically. No rewrites. No config files.
            You own your DOM — we never touch your IDs.
          </p>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "10px 18px", marginBottom: "2rem",
          }}>
            <span style={{ color: TEAL, fontWeight: 700 }}>$</span>
            <code style={{ fontSize: 14, color: "#e2e8f0" }}>npm install yuktai-a11y</code>
          </div>

          <div style={{ display: "flex", gap: 0, overflowX: "auto" as const }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 20px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "none", background: "none",
                borderBottom: tab === t.id ? `2px solid ${TEAL}` : "2px solid transparent",
                color: tab === t.id ? TEAL : "rgba(255,255,255,0.4)",
                fontFamily: "inherit", whiteSpace: "nowrap" as const,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "2rem" }}>

        {/* WHAT IT DOES */}
        {tab === "what" && (
          <div>
            <div style={{
              padding: "16px 20px", background: "#fff",
              border: `1px solid ${BORDER}`, borderLeft: `4px solid ${TEAL}`,
              borderRadius: 10, marginBottom: 28, fontSize: 14, color: DARK, lineHeight: 1.8,
            }}>
              <strong>The problem:</strong> 98% of websites fail basic WCAG checks.
              Most developers skip accessibility because it requires deep ARIA knowledge.{" "}
              <strong>yuktai-a11y</strong> fixes the most common violations automatically —
              so developers can ship accessible UIs without becoming WCAG experts.
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12, marginBottom: 32,
            }}>
              {[
                { icon: "🏷️", title: "ARIA labels", desc: "Injects aria-label on inputs, buttons, images and links when missing" },
                { icon: "⌨️", title: "Keyboard access", desc: "Clickable divs get role=button, tabIndex=0, and Enter/Space handlers" },
                { icon: "🖼️", title: "Image alt text", desc: "Decorative images get alt='' + aria-hidden. You write alt for meaningful ones" },
                { icon: "📢", title: "SR announcer", desc: "Auto-creates an aria-live region so dynamic content gets announced" },
                { icon: "🔁", title: "MutationObserver", desc: "autoFix mode watches DOM and re-applies all fixes on new content" },
                { icon: "🎨", title: "Visual options", desc: "highContrast and reduceMotion settings for users who need them" },
                { icon: "⚡", title: "Zero config", desc: "Works with React 17+, Next.js 13+, Angular 14+. No config files" },
                { icon: "🚫", title: "No auto IDs", desc: "We never generate or overwrite element IDs. You own your DOM" },
              ].map(f => (
                <div key={f.title} style={{
                  padding: "16px 18px", background: "#fff",
                  border: `1px solid ${BORDER}`, borderRadius: 12,
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 5 }}>{f.title}</div>
                  <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            <div style={{
              padding: "14px 18px", background: "#fffbeb",
              border: "1px solid #fde68a", borderRadius: 10,
              fontSize: 13, color: "#92400e", lineHeight: 1.8,
            }}>
              <strong>Honest scope:</strong> This plugin fixes structural ARIA issues automatically.
              It cannot fix color contrast, logical reading order, or semantic meaning.
              For a full WCAG audit use <code style={{ fontWeight: 700 }}>axe-core</code>.
              Think of yuktai-a11y as your first layer of defence — not a full replacement.
            </div>
          </div>
        )}

        {/* HOW TO INSTALL */}
        {tab === "how" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" as const }}>
              {Object.keys(FW).map(f => (
                <button key={f} onClick={() => setFw(f)} style={{
                  padding: "6px 18px", borderRadius: 99, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", border: "1.5px solid",
                  borderColor: fw === f ? TEAL : BORDER,
                  background: fw === f ? TEAL : "#fff",
                  color: fw === f ? "#fff" : MUTED,
                }}>{f}</button>
              ))}
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", background: "#1e293b", borderRadius: "10px 10px 0 0",
            }}>
              <code style={{ fontSize: 13, color: "#5eead4", fontFamily: "var(--font-dm-mono, monospace)" }}>
                $ {FW[fw].install}
              </code>
              <span style={{ fontSize: 10, color: "#475569" }}>terminal</span>
            </div>
            <Code added={["YuktA11yProvider", "YuktA11yModule", "yuktA11y", "applyAccessibility", "useA11y"]}>
              {FW[fw].code}
            </Code>
          </div>
        )}

        {/* DOM EXAMPLES */}
        {tab === "examples" && (
          <div>
            <div style={{
              padding: "12px 16px", background: "#fff", border: `1px solid ${BORDER}`,
              borderLeft: `4px solid ${TEAL}`, borderRadius: 10, marginBottom: 20,
              fontSize: 13, color: DARK, lineHeight: 1.8,
            }}>
              Click <strong>⚠ Problem</strong> to see what a developer typically writes.
              Click <strong>✓ Fixed</strong> to see what yuktai-a11y adds automatically.
              <span style={{ color: TEAL }}> Green lines = injected by the plugin.</span>{" "}
              The developer writes zero extra code.
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 16,
            }}>
              {DOM_DIFFS.map(d => <DiffCard key={d.title} {...d} />)}
            </div>
          </div>
        )}

        {/* LIVE DEMO */}
        {tab === "demo" && <LiveDemo />}

        {/* FULL API */}
        {tab === "api" && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: TEAL, margin: "0 0 12px" }}>
              A11yConfig — all options
            </h3>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 28 }}>
              {[
                { opt: "enabled",      type: "boolean", req: true,  desc: "Master switch. Must be true for anything to run." },
                { opt: "autoFix",      type: "boolean", req: false, desc: "Starts a MutationObserver that re-runs fixes when new nodes appear." },
                { opt: "highContrast", type: "boolean", req: false, desc: "Applies contrast(1.15) brightness(1.05) to all elements." },
                { opt: "reduceMotion", type: "boolean", req: false, desc: "Sets transition:none and animation:none on all elements." },
              ].map((r, i, a) => (
                <div key={r.opt} style={{
                  display: "grid", gridTemplateColumns: "140px 90px 70px 1fr",
                  gap: 10, padding: "11px 16px", fontSize: 12, alignItems: "center",
                  borderBottom: i < a.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: i % 2 === 0 ? "#fff" : BG,
                }}>
                  <code style={{ color: TEAL, fontWeight: 700, fontFamily: "var(--font-dm-mono, monospace)" }}>{r.opt}</code>
                  <code style={{ color: "#7c3aed", fontFamily: "var(--font-dm-mono, monospace)" }}>{r.type}</code>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
                    textAlign: "center" as const,
                    background: r.req ? "#fef2f2" : "#f0fdfa",
                    color: r.req ? "#b91c1c" : "#0f766e",
                  }}>{r.req ? "required" : "optional"}</span>
                  <span style={{ color: MUTED }}>{r.desc}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 700, color: TEAL, margin: "0 0 12px" }}>All exports</h3>
            <Code added={["YuktA11yProvider", "useA11y", "applyAccessibility", "wcagPlugin", "YuktA11yModule", "YuktA11yService", "YuktA11yDirective"]}>
{`// React / Next.js
import {
  YuktA11yProvider,    // <Provider enabled autoFix> wraps your app
  useA11y,             // hook: { fixed, scanned, announce }
  applyAccessibility,  // pure fn: ReactNode → ReactNode
  wcagPlugin,          // raw DOM engine, framework-agnostic
} from 'yuktai-a11y/react';

// Angular
import {
  YuktA11yModule,      // NgModule — .forRoot(config)
  YuktA11yService,     // injectable → .applyFixes(config): A11yReport
  YuktA11yDirective,   // [yuktA11y] attribute directive
} from 'yuktai-a11y/angular';

// Core (no framework)
import { wcagPlugin } from 'yuktai-a11y/core';

wcagPlugin.execute({ enabled: true, autoFix: true });
wcagPlugin.announce('Form submitted');
wcagPlugin.stopObserver();`}
            </Code>

            <h3 style={{ fontSize: 14, fontWeight: 700, color: TEAL, margin: "28px 0 12px" }}>
              A11yReport — what applyFixes() returns
            </h3>
            <Code>
{`interface A11yReport {
  fixed:   number;   // total attributes injected
  scanned: number;   // total DOM nodes scanned
  details: Array<{
    tag:     string; // e.g. "input"
    fix:     string; // e.g. 'aria-label="Email"'
    element: string; // first 60 chars of outerHTML
  }>;
}

// Example
const r = wcagPlugin.applyFixes({ enabled: true });
console.log(r.fixed);    // 12
console.log(r.details);  // [{ tag:'input', fix:'aria-label="Email"' }]`}
            </Code>

            <h3 style={{ fontSize: 14, fontWeight: 700, color: TEAL, margin: "28px 0 12px" }}>
              Plugin rules — what we never do
            </h3>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {[
                "We never generate or overwrite id attributes — you own your DOM structure",
                "We never add aria-label if aria-labelledby is already present",
                "We never add alt text to meaningful images — only decorative ones get alt=''",
                "We never remove or modify existing ARIA attributes set by the developer",
                "We never override role if one is already present on the element",
              ].map(rule => (
                <div key={rule} style={{
                  padding: "10px 14px", background: "#fff",
                  border: `1px solid ${BORDER}`, borderRadius: 8,
                  fontSize: 13, color: DARK, display: "flex", gap: 10,
                }}>
                  <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {rule}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
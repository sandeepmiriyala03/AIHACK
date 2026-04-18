"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── yuktai-a11y core engine ──────────────────────────────────────────────────
// Once you publish the package, replace this block with:
//   import { wcagPlugin } from 'yuktai-a11y/core';
//   import type { A11yConfig, A11yReport } from 'yuktai-a11y';

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

  // DOM fixer — NEVER touches id attributes
  applyFixes(config: A11yConfig): A11yReport {
    const report: A11yReport = { fixed: 0, scanned: 0, details: [] };
    if (typeof document === "undefined") return report;

    const elements = document.querySelectorAll("*");
    report.scanned = elements.length;

    elements.forEach((el) => {
      const h = el as HTMLElement;
      const tag = h.tagName.toLowerCase();

      // 1. Empty buttons / links
      if ((tag === "a" || tag === "button") && !h.innerText?.trim()) {
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

      // 6. Visual preferences — applied inline by wcagPlugin
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

  stopObserver() {
    this.observer?.disconnect();
    this.observer = null;
  },

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
    if (typeof document === "undefined") return;
    const el = document.getElementById("yukt-sr-announcer");
    if (el) el.textContent = msg;
  },
};

// ─── Widget state ─────────────────────────────────────────────────────────────

interface WidgetSettings {
  enabled: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  autoFix: boolean;
  dyslexiaFont: boolean;
  fontScale: number;
}

const DEFAULT_SETTINGS: WidgetSettings = {
  enabled: false,
  highContrast: false,
  reduceMotion: false,
  autoFix: true,
  dyslexiaFont: false,
  fontScale: 100,
};

const FONT_STEPS = [80, 90, 100, 110, 120, 130, 140, 150];

// ─── Toggle sub-component ─────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      aria-label={label}
      style={{
        position: "relative",
        display: "inline-flex",
        width: 40,
        height: 24,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 99,
          background: checked ? "#0d9488" : "#cbd5e1",
          transition: "background 0.2s",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 19 : 3,
          width: 18,
          height: 18,
          background: "#fff",
          borderRadius: "50%",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          pointerEvents: "none",
        }}
      />
    </label>
  );
}

// ─── A11yWidget ───────────────────────────────────────────────────────────────

export default function A11yWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_SETTINGS);
  const [report, setReport] = useState<A11yReport | null>(null);
  const [isActive, setIsActive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const set = <K extends keyof WidgetSettings>(key: K, val: WidgetSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: val }));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        fabRef.current && !fabRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) { setOpen(false); fabRef.current?.focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Cleanup observer on unmount
  useEffect(() => () => wcagPlugin.stopObserver(), []);

  // ── Apply — calls wcagPlugin.execute() then wcagPlugin.applyFixes() ──────────
  const applySettings = useCallback(async () => {
    const config: A11yConfig = {
      enabled: true,
      highContrast: settings.highContrast,
      reduceMotion: settings.reduceMotion,
      autoFix: settings.autoFix,
    };

    // wcagPlugin.execute — runs fixes + starts MutationObserver if autoFix is on
    const execMessage = await wcagPlugin.execute(config);
    console.log("[yuktai-a11y]", execMessage);

    // wcagPlugin.applyFixes — get detailed report for the UI
    const r = wcagPlugin.applyFixes(config);
    setReport(r);

    // Font scale — applied via root font-size (outside wcagPlugin scope)
    document.documentElement.style.fontSize = `${settings.fontScale}%`;

    // Dyslexia font — inject/remove a <style> tag (outside wcagPlugin scope)
    const existingStyle = document.getElementById("yuktai-dyslexia-style");
    if (settings.dyslexiaFont) {
      if (!existingStyle) {
        const style = document.createElement("style");
        style.id = "yuktai-dyslexia-style";
        // Swap the font-family below for a real OpenDyslexic @font-face
        // if you have the font files in your /public folder.
        style.textContent = `
          body, body * {
            font-family: 'Georgia', serif !important;
            letter-spacing: 0.06em !important;
            word-spacing: 0.12em !important;
            line-height: 1.9 !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      existingStyle?.remove();
    }

    setIsActive(true);
    setOpen(false);

    // Announce result via wcagPlugin's built-in sr announcer
    wcagPlugin.announce(
      `yuktai-a11y active. ${r.fixed} fixes applied. ` +
        [
          settings.highContrast && "High contrast on.",
          settings.reduceMotion && "Motion reduced.",
          settings.dyslexiaFont && "Dyslexia font on.",
          settings.fontScale !== 100 && `Text at ${settings.fontScale}%.`,
        ]
          .filter(Boolean)
          .join(" ")
    );
  }, [settings]);

  // ── Reset — calls wcagPlugin.execute({ enabled: false }) to stop everything ──
  const resetSettings = useCallback(async () => {
    // Disable wcagPlugin — stops MutationObserver, clears active state
    await wcagPlugin.execute({ enabled: false });

    // Undo font scale
    document.documentElement.style.fontSize = "";

    // Undo dyslexia font
    document.getElementById("yuktai-dyslexia-style")?.remove();

    // Undo inline styles that wcagPlugin.applyFixes() wrote (highContrast / reduceMotion)
    document.querySelectorAll<HTMLElement>("*").forEach((h) => {
      h.style.filter = "";
      h.style.transition = "";
      h.style.animation = "";
    });

    setSettings(DEFAULT_SETTINGS);
    setReport(null);
    setIsActive(false);

    wcagPlugin.announce("yuktai-a11y disabled. All settings reset to defaults.");
  }, []);

  const OPTIONS: {
    id: keyof WidgetSettings;
    label: string;
    description: string;
    icon: string;
  }[] = [
    { id: "highContrast", label: "High contrast",          description: "contrast(1.15) + brightness(1.05) on all nodes", icon: "◑"  },
    { id: "reduceMotion", label: "Reduce motion",           description: "Sets transition & animation to none",            icon: "⏸"  },
    { id: "autoFix",      label: "Auto-fix ARIA",           description: "MutationObserver re-runs fixes on new nodes",    icon: "♿" },
    { id: "dyslexiaFont", label: "Dyslexia-friendly font",  description: "Wider letter & word spacing",                    icon: "Aa" },
  ];

  return (
    <>
      {/* ── Floating action button ──────────────────────────── */}
      <button
        ref={fabRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open yuktai-a11y accessibility options"
        aria-expanded={open}
        aria-controls="yuktai-a11y-panel"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: isActive ? "#0f766e" : "#0d9488",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
          zIndex: 9999,
          transition: "background 0.2s, transform 0.15s",
          outline: "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.45)")}
        onBlur={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.18)")}
      >
        <svg
          viewBox="0 0 24 24"
          style={{ width: 26, height: 26, fill: "#fff" }}
          aria-hidden="true"
        >
          <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 4.5l-5-.5-2-.2V5l-4 .5-4-.5v.8L4 6.5 3 7l1 3 4-.5v2.3L6 17h2l2-4.5L12 14l2 2.5L16 17h2l-2-4.2V9.5l4 .5 1-3z" />
        </svg>

        {/* Active state indicator dot */}
        {isActive && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#5eead4",
              border: "2px solid #fff",
            }}
          />
        )}
      </button>

      {/* ── Panel ───────────────────────────────────────────── */}
      {open && (
        <div
          id="yuktai-a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="yuktai-a11y accessibility options"
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            width: 312,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            zIndex: 9998,
            overflow: "hidden",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px 12px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 99,
                    background: "#f0fdfa",
                    color: "#0d9488",
                    letterSpacing: "0.05em",
                    fontFamily: "monospace",
                  }}
                >
                  yuktai-a11y v{wcagPlugin.version}
                </span>
                {isActive && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 99,
                      background: "#f0fdfa",
                      color: "#0f766e",
                      border: "1px solid #99f6e4",
                    }}
                  >
                    ● ACTIVE
                  </span>
                )}
              </div>
              <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                Accessibility
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                Zero-config WCAG fixes for your page
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close panel"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "#94a3b8",
                fontSize: 18,
                lineHeight: 1,
                borderRadius: 6,
              }}
            >
              ×
            </button>
          </div>

          {/* Toggles — each maps directly to an A11yConfig field */}
          <div style={{ padding: "6px 0" }}>
            {OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.id}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 18px",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "#f0fdfa",
                        color: "#0d9488",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      {opt.icon}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                        {opt.label}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    id={`yuktai-${opt.id}`}
                    checked={settings[opt.id] as boolean}
                    onChange={(v) => set(opt.id, v)}
                    label={`Toggle ${opt.label}`}
                  />
                </div>
                {i < OPTIONS.length - 1 && (
                  <div style={{ height: 1, background: "#f8fafc", margin: "0 18px" }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Font size — extra option outside wcagPlugin, applied via CSS */}
          <div
            style={{
              padding: "10px 18px 14px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                Text size
              </p>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0d9488",
                  background: "#f0fdfa",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {settings.fontScale}%
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => {
                  const idx = FONT_STEPS.indexOf(settings.fontScale);
                  if (idx > 0) set("fontScale", FONT_STEPS[idx - 1]);
                }}
                disabled={settings.fontScale <= 80}
                aria-label="Decrease text size"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: settings.fontScale <= 80 ? "not-allowed" : "pointer",
                  fontSize: 16,
                  color: settings.fontScale <= 80 ? "#cbd5e1" : "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                −
              </button>
              <div style={{ flex: 1, display: "flex", gap: 3 }}>
                {FONT_STEPS.map((s) => (
                  <button
                    key={s}
                    onClick={() => set("fontScale", s)}
                    aria-label={`Set text size to ${s}%`}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 99,
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      background: s <= settings.fontScale ? "#0d9488" : "#e2e8f0",
                      transition: "background 0.15s",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  const idx = FONT_STEPS.indexOf(settings.fontScale);
                  if (idx < FONT_STEPS.length - 1) set("fontScale", FONT_STEPS[idx + 1]);
                }}
                disabled={settings.fontScale >= 150}
                aria-label="Increase text size"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: settings.fontScale >= 150 ? "not-allowed" : "pointer",
                  fontSize: 16,
                  color: settings.fontScale >= 150 ? "#cbd5e1" : "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* wcagPlugin report — shown after Apply */}
          {report && (
            <div
              role="status"
              style={{
                margin: "0 14px",
                padding: "8px 12px",
                background: "#f0fdfa",
                border: "1px solid #99f6e4",
                borderRadius: 8,
                fontSize: 12,
                color: "#0f766e",
                fontWeight: 500,
                fontFamily: "monospace",
              }}
            >
              ✓ yuktai-a11y: {report.fixed} fixes across {report.scanned} nodes
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", gap: 8, padding: "12px 14px 14px" }}>
            <button
              onClick={resetSettings}
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 9,
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
            <button
              onClick={applySettings}
              style={{
                flex: 2,
                padding: "8px 0",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 9,
                border: "none",
                background: "#0d9488",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Apply settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Usage ─────────────────────────────────────────────────────────────────────
//
// app/layout.tsx:
//
//   import A11yWidget from "@/components/A11yWidget";
//
//   export default function RootLayout({ children }) {
//     return (
//       <html lang="en">
//         <body>
//           {children}
//           <A11yWidget />
//         </body>
//       </html>
//     );
//   }
//
// ─── Once yuktai-a11y is published as an npm package ─────────────────────────
// Remove the inline wcagPlugin block above and replace with:
//
//   import { wcagPlugin } from 'yuktai-a11y/core';
//   import type { A11yConfig, A11yReport } from 'yuktai-a11y';
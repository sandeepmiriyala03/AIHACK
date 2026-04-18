"use client";

import { useEffect, useRef } from "react";

// ─── Inline wcagPlugin (same engine as A11yWidget.tsx) ────────────────────────
// We inline this here so it works regardless of what yuktai-js exports.
// Once you publish yuktai-a11y to npm, replace this block with:
//   import { wcagPlugin } from 'yuktai-a11y/core';

interface A11yConfig {
  enabled: boolean;
  highContrast?: boolean;
  reduceMotion?: boolean;
  autoFix?: boolean;
}

interface A11yReport {
  fixed: number;
  scanned: number;
  details: { tag: string; fix: string; element: string }[];
}

const wcagPlugin = {
  name: "yuktai-a11y",
  version: "1.0.0",
  observer: null as MutationObserver | null,

  async execute(config: A11yConfig): Promise<A11yReport> {
    if (!config.enabled) {
      this.stopObserver();
      return { fixed: 0, scanned: 0, details: [] };
    }
    const report = this.applyFixes(config);
    if (config.autoFix) this.startObserver(config);
    return report;
  },

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

// ─── YuktAIWrapper ────────────────────────────────────────────────────────────
// Drop this in layout.tsx once. It auto-runs wcagPlugin on mount,
// watches for new DOM nodes via MutationObserver (autoFix: true),
// and exposes window.runWCAG() for manual re-runs from the console.

export default function YuktAIWrapper() {
  const ranRef = useRef(false);

  const runWCAG = async (config: Partial<A11yConfig> = {}) => {
    const report = await wcagPlugin.execute({
      enabled: true,
      autoFix: true,
      ...config,
    });

    console.log(
      `♿ yuktai-a11y: ${report.fixed} fixes across ${report.scanned} nodes`
    );

    if (report.details.length > 0) {
      console.groupCollapsed(`♿ yuktai-a11y fix details (${report.details.length})`);
      report.details.forEach((d) =>
        console.log(`  <${d.tag}> → ${d.fix}`)
      );
      console.groupEnd();
    }

    return report;
  };

  useEffect(() => {
    // Guard against double-invocation in React 18 strict mode
    if (ranRef.current) return;
    ranRef.current = true;

    // Try to load yuktai-js for feature flags (optional — gracefully degrades)
    (async () => {
      try {
        const mod = await import("yuktai-js");
        const api = mod?.default as { list?: () => string[] } | undefined;

        const features = api?.list?.() ?? [];
        console.log("✅ yuktai-js loaded. Features:", features);

        if (features.includes("ui.a11y.pro")) {
          document.documentElement.classList.add("a11y-enabled");
        }
      } catch {
        // yuktai-js not installed or doesn't export what we need — that's fine.
        // wcagPlugin runs independently below.
        console.info("ℹ️ yuktai-js not found — running wcagPlugin standalone.");
      }

      // Always run wcagPlugin regardless of yuktai-js outcome.
      // Wait one tick so the full DOM is painted first.
      setTimeout(() => runWCAG(), 500);

      // Expose for manual console use: window.runWCAG({ highContrast: true })
      (window as any).runWCAG = runWCAG;
    })();

    return () => {
      wcagPlugin.stopObserver();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
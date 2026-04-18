"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

      if ((tag === "a" || tag === "button") && !h.innerText?.trim()) {
        if (!h.getAttribute("aria-label")) {
          const label = h.getAttribute("title") || "Interactive element";
          h.setAttribute("aria-label", label);
          report.fixed++;
        }
      }

      const isClickable =
        h.hasAttribute("onclick") ||
        window.getComputedStyle(h).cursor === "pointer";

      if (isClickable && !["button", "a", "input", "select", "textarea"].includes(tag)) {
        if (!h.getAttribute("role")) {
          h.setAttribute("role", "button");
          report.fixed++;
        }
        if (h.tabIndex < 0) h.tabIndex = 0;

        if (!(h as any)._yuktKeyBound) {
          h.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              h.click();
            }
          });
          (h as any)._yuktKeyBound = true;
        }
      }

      if (["input", "select", "textarea"].includes(tag)) {
        if (!h.getAttribute("aria-label") && !h.getAttribute("aria-labelledby")) {
          const label =
            h.getAttribute("placeholder") ||
            h.getAttribute("name") ||
            tag;
          h.setAttribute("aria-label", label);
          report.fixed++;
        }

        if (h.hasAttribute("required") && !h.getAttribute("aria-required")) {
          h.setAttribute("aria-required", "true");
        }
      }

      if (tag === "img" && !h.hasAttribute("alt")) {
        h.setAttribute("alt", "");
        h.setAttribute("aria-hidden", "true");
        report.fixed++;
      }

      if (tag === "table" && !el.querySelector("th")) {
        if (!h.getAttribute("role")) {
          h.setAttribute("role", "grid");
          report.fixed++;
        }
      }
    });

    this.ensureLiveRegion();
    return report;
  },

  startObserver(config: A11yConfig) {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.applyFixes(config);
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },

  stopObserver() {
    this.observer?.disconnect();
    this.observer = null;
  },

  ensureLiveRegion() {
    if (document.getElementById("yukt-sr-announcer")) return;

    const node = document.createElement("div");
    node.id = "yukt-sr-announcer";
    node.setAttribute("aria-live", "polite");
    node.style.cssText =
      "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(node);
  },
};

export default function YuktAIWrapper() {
  const pathname = usePathname();

  const runWCAG = async () => {
    const report = await wcagPlugin.execute({
      enabled: true,
      autoFix: true,
    });

    console.log(
      `♿ WCAG applied: ${report.fixed} fixes across ${report.scanned} nodes`
    );
  };

  useEffect(() => {
    runWCAG(); // ✅ immediate, no delay

    (window as any).runWCAG = runWCAG;

    return () => {
      wcagPlugin.stopObserver();
    };
  }, [pathname]); // ✅ runs on every navigation

  return null;
}
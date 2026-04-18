"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { wcagPlugin } from "./A11yWidget";
import AccessibilityRoundedIcon from "@mui/icons-material/AccessibilityRounded";
import ContrastRoundedIcon from "@mui/icons-material/ContrastRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";

const G = "#10b981";

export default function YuktAIWrapper() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [message, setMessage] = useState("ADA controls are ready.");
  const [isMobile, setIsMobile] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const plugin = wcagPlugin;

    const run = async () => {
      try {
        if (!enabled) {
          await plugin.execute({ enabled: false });
          setMessage("ADA disabled.");
          return;
        }

        const result = await plugin.execute({
          enabled: true,
          autoFix: true,
          highContrast,
          reduceMotion,
        });

        setMessage(typeof result === "string" ? result : "ADA enabled.");
        console.log("♿ WCAG executed", result);

        (window as any).runWCAG = () =>
          plugin.execute({ enabled: true, autoFix: true, highContrast, reduceMotion });
      } catch (e) {
        console.error("WCAG load failed:", e);
        setMessage("WCAG load failed. See console.");
      }
    };

    run();

    return () => {
      wcagPlugin.stopObserver();
    };
  }, [pathname, enabled, highContrast, reduceMotion]);

  return (
    <>
      {!panelVisible && (
        <button
          onClick={() => setPanelVisible(true)}
          style={{
            position: "fixed",
            bottom: 24,
            left: 24,
            zIndex: 10000,
            width: 48,
            height: 48,
            borderRadius: 24,
            border: "none",
            background: G,
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
            transition: "0.2s",
          }}
          aria-label="Open ADA accessibility controls"
        >
          <AccessibilityRoundedIcon style={{ fontSize: 24 }} />
        </button>
      )}

      {panelVisible && (
        <div style={{
          position: "fixed",
          bottom: 16,
          left: isMobile ? 16 : 16, // Adjust for mobile
          zIndex: 9999,
          width: isMobile ? "calc(100vw - 32px)" : 280, // Full width on mobile minus padding
          maxWidth: 320,
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(15, 23, 42, 0.12)",
          borderRadius: 16,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
          padding: 16,
          fontFamily: "Inter, sans-serif",
          color: "#111827",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AccessibilityRoundedIcon style={{ fontSize: 18 }} />
              ADA accessibility
            </div>
            <button
              onClick={() => setPanelVisible(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                fontSize: 18,
              }}
              aria-label="Close ADA controls"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setEnabled(!enabled); setPanelVisible(false); }}
            style={{
              width: "100%",
              marginBottom: 12,
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: enabled ? "#d1fae5" : "#eff6ff",
              color: enabled ? "#064e3b" : "#1d4ed8",
              fontWeight: 700,
              transition: "all 0.2s ease",
              fontSize: isMobile ? 14 : 13,
              minHeight: 44, // Touch-friendly
            }}
          >
            {enabled ? "Disable ADA" : "Enable ADA"}
          </button>

          {enabled && (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13, cursor: "pointer", minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={e => setHighContrast(e.target.checked)}
                  style={{ accentColor: "#0f766e", width: 18, height: 18 }}
                />
                <ContrastRoundedIcon style={{ fontSize: 18, color: "#64748b" }} />
                High contrast
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, cursor: "pointer", minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={e => setReduceMotion(e.target.checked)}
                  style={{ accentColor: "#0f766e", width: 18, height: 18 }}
                />
                <PauseRoundedIcon style={{ fontSize: 18, color: "#64748b" }} />
                Reduce motion
              </label>
            </>
          )}

          <div style={{ fontSize: 11, lineHeight: 1.4, color: "#475569" }}>
            {message}
          </div>
        </div>
      )}
    </>
  );
}
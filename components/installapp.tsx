"use client";

import React, { useEffect, useState, useRef } from "react";

const isIOS = () =>
  typeof window !== "undefined" &&
  /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isSafari = () =>
  typeof window !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const supportsPWA = () =>
  typeof window !== "undefined" && "BeforeInstallPromptEvent" in window;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/* ─── iOS Bottom Sheet ─────────────────────────────────── */
function IOSSheet({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "linear-gradient(160deg, #0f1923 0%, #0a1018 100%)",
          borderRadius: "20px 20px 0 0",
          padding: "28px 24px 40px",
          boxShadow: "0 -4px 40px rgba(38,255,231,0.15)",
          border: "1px solid rgba(38,255,231,0.12)",
          borderBottom: "none",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Pill handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 99,
            background: "rgba(255,255,255,0.15)",
            margin: "0 auto 24px",
          }}
        />

        {/* Icon + heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #26ffe7 0%, #00c6a8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(38,255,231,0.4)",
            }}
          >
            🔤
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>
              Add to Home Screen
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 2 }}>
              AksharaTantra · OCR for 34 languages
            </div>
          </div>
        </div>

        {/* Steps */}
        {[
          { icon: "⬆️", text: "Tap the Share button in Safari's toolbar" },
          { icon: "➕", text: 'Scroll down and tap "Add to Home Screen"' },
          { icon: "✅", text: 'Tap "Add" to confirm' },
        ].map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 0",
              borderTop: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(38,255,231,0.08)",
                border: "1px solid rgba(38,255,231,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {step.icon}
            </div>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.4 }}>
              {step.text}
            </span>
          </div>
        ))}

        <button
          onClick={handleClose}
          style={{
            marginTop: 22,
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Dismiss
        </button>
      </div>
    </>
  );
}

/* ─── Install Banner ───────────────────────────────────── */
function InstallBanner({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 350);
  };

  const handleInstall = () => {
    setVisible(false);
    setTimeout(onInstall, 200);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(120px)",
        transition: "transform 0.45s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease",
        opacity: visible ? 1 : 0,
        zIndex: 9999,
        width: "min(420px, calc(100vw - 32px))",
        background: "linear-gradient(135deg, #0f1923 0%, #0c1520 100%)",
        borderRadius: 20,
        boxShadow:
          "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(38,255,231,0.15), 0 0 30px rgba(38,255,231,0.08)",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Glow accent */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: 24,
          right: 24,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(38,255,231,0.6), transparent)",
          borderRadius: 99,
        }}
      />

      {/* App icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 13,
          background: "linear-gradient(135deg, #26ffe7, #00b89c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
          boxShadow: "0 0 16px rgba(38,255,231,0.35)",
        }}
      >
        🔤
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "-0.2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Install AksharaTantra
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
          Works offline · Fast · No browser UI
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={handleInstall}
        style={{
          padding: "9px 18px",
          borderRadius: 11,
          border: "none",
          background: "linear-gradient(135deg, #26ffe7 0%, #00c6a8 100%)",
          color: "#0a1018",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
          flexShrink: 0,
          fontFamily: "inherit",
          letterSpacing: "-0.2px",
          boxShadow: "0 4px 14px rgba(38,255,231,0.3)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 20px rgba(38,255,231,0.45)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 14px rgba(38,255,231,0.3)";
        }}
      >
        Install
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.3)",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          flexShrink: 0,
          transition: "color 0.15s",
          fontSize: 18,
          lineHeight: 1,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)")
        }
      >
        ✕
      </button>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────── */
export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIOS() && isSafari()) {
      // Delay slightly so the page settles first
      const t = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(t);
    }

    if (!supportsPWA()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = () => {
    if (isIOS() && isSafari()) {
      setShowBanner(false);
      setShowIOSSheet(true);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setShowBanner(false);
      setInstallPrompt(null);
    });
  };

  return (
    <>
      {showBanner && (
        <InstallBanner
          onInstall={handleInstall}
          onDismiss={() => setShowBanner(false)}
        />
      )}
      {showIOSSheet && <IOSSheet onClose={() => setShowIOSSheet(false)} />}
    </>
  );
}
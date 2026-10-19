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
        className="is-76649ad" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
      />

      {/* Sheet */}
      <div
        className="is-0ee6d26" style={{ transform: visible ? "translateY(0)" : "translateY(100%)", transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)", fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Pill handle */}
        <div
          className="is-6a14406"
        />

        {/* Icon + heading */}
        <div className="is-96011de">
          <div
            className="is-8828aae"
          >
            🔤
          </div>
          <div>
            <div className="is-e6dcb52">
              Add to Home Screen
            </div>
            <div className="is-e2e164d">
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
            className="is-927b853" style={{ borderTop: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="is-8b0b616"
            >
              {step.icon}
            </div>
            <span className="is-e3343e3">
              {step.text}
            </span>
          </div>
        ))}

        <button
          onClick={handleClose}
          className="is-13e7454"
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
      className="is-4915b0f" style={{ transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(120px)", transition: "transform 0.45s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease", opacity: visible ? 1 : 0, zIndex: 9999, width: "min(420px, calc(100vw - 32px))", background: "linear-gradient(135deg, #0f1923 0%, #0c1520 100%)", borderRadius: 20, boxShadow:
          "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(38,255,231,0.15), 0 0 30px rgba(38,255,231,0.08)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Glow accent */}
      <div
        className="is-565fafa"
      />

      {/* App icon */}
      <div
        className="is-48b2b99"
      >
        🔤
      </div>

      {/* Text */}
      <div className="is-ec2eba2">
        <div
          className="is-5ce6101"
        >
          Install AksharaTantra
        </div>
        <div className="is-f86f685">
          Works offline · Fast · No browser UI
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={handleInstall}
        className="is-22947bb"
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
        className="is-c483cf1"
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
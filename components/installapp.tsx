import React, { useEffect, useState } from "react";

// Detect iOS Safari
const isIOS = () =>
  typeof window !== "undefined" &&
  /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isSafari = () =>
  typeof window !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

// Detect Standalone (already installed)
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true);

// Detect browser PWA support
const supportsPWA = () => typeof window !== "undefined" && "BeforeInstallPromptEvent" in window;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shouldShowFab, setShouldShowFab] = useState(false);

  useEffect(() => {
    // 1️⃣ Do not show if already installed
    if (isStandalone()) return;

    // 2️⃣ iOS Safari → show custom manual FAB
    if (isIOS() && isSafari()) {
      setShouldShowFab(true);
      return;
    }

    // 3️⃣ unsupported browser → do not show
    if (!supportsPWA()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShouldShowFab(true);
    };

    const handleAppInstalled = () => {
      setShouldShowFab(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Install PWA
  const handleInstallClick = () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setShouldShowFab(false);
      setInstallPrompt(null);
    });
  };

  if (!shouldShowFab) return null;

  // iOS Safari → Manual badge
  if (isIOS() && isSafari()) {
    return (
      <button
        className="fabInstallBtn"
        onClick={() =>
          alert(
            "To install this app on iPhone/iPad:\n\n1. Tap the Share icon in Safari\n2. Tap 'Add to Home Screen'"
          )
        }
      >
        📲
      </button>
    );
  }

  // Android / Chrome → Native prompt
  return (
    <button className="fabInstallBtn" onClick={handleInstallClick}>
      📲
    </button>
  );
}

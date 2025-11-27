import React, { useEffect, useState } from "react";

// Detect iOS Safari
const isIOS = () =>
  typeof window !== "undefined" &&
  /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isSafari = () =>
  typeof window !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

// Detect Standalone (PWA installed)
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

// Detect browser install support
const supportsPWA = () =>
  typeof window !== "undefined" &&
  "BeforeInstallPromptEvent" in window;

// Safe typing for event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [shouldShowFab, setShouldShowFab] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed → no FAB

    if (isIOS() && isSafari()) {
      setShouldShowFab(true); // iOS always manual
      return;
    }

    if (!supportsPWA()) return; // unsupported browser

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

  const handleInstallClick = () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setShouldShowFab(false);
      setInstallPrompt(null);
    });
  };

  if (!shouldShowFab) return null;

  // iOS → show manual instructions
  if (isIOS() && isSafari()) {
    return (
      <button
        className="fabInstallBtn"
        type="button"
        onClick={() =>
          alert(
            "To install this app:\n\n1. Tap the Share icon in Safari\n2. Tap 'Add to Home Screen'"
          )
        }
      >
        📲
      </button>
    );
  }

  // Android / Chrome → native install prompt
  return (
    <button className="fabInstallBtn" type="button" onClick={handleInstallClick}>
      📲
    </button>
  );
}

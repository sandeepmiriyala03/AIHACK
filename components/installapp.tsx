import React, { useEffect, useState } from "react";

// Utility functions to detect iOS Safari
const isIOS = () =>
  typeof window !== "undefined" &&
  /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isSafari = () =>
  typeof window !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

// --- Fix typing for installPrompt state ---
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    if (isIOS() && isSafari()) {
      setShowIosTip(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
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
      setShowInstallButton(false);
      setInstallPrompt(null);
    });
  };

  const buttonClasses =
    "inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-400 dark:focus:ring-blue-600 text-white rounded-lg shadow-lg transition duration-300 select-none whitespace-normal";

  if (showIosTip) {
    return (
      <button
        className={buttonClasses}
        type="button"
        aria-label="How to install app on iOS"
        title="Install this app"
        onClick={() =>
          alert(
            "To install this app on your iPhone or iPad:\n\n1. Tap the 'Share' icon in Safari's toolbar\n2. Tap 'Add to Home Screen'"
          )
        }
      >
        📲 Install App
      </button>
    );
  }

  if (showInstallButton) {
    return (
      <button
        onClick={handleInstallClick}
        className={buttonClasses}
        aria-label="Install App"
        title="Install this app"
        type="button"
      >
        📲 Install App
      </button>
    );
  }

  return null;
}

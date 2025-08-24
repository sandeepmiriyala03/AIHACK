import React, { useEffect, useState } from "react";

// Utility functions to detect iOS Safari
const isIOS = () =>
  typeof window !== "undefined" && /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isSafari = () =>
  typeof window !== "undefined" && /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

// Typing for installPrompt event
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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


  // Show iOS tip button (non-PWA install prompt)
  if (showIosTip) {
    return (
    <button
  className="installPrompt"
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

  // Show install prompt button when available
  if (showInstallButton) {
    return (
   <button
  onClick={handleInstallClick}
  className="installPrompt"
  aria-label="Install App"
  title="Install this app"
  type="button"
>
  Install App
</button>

    );
  }

  return null;
}

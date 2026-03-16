"use client";

import { useEffect, useRef, useState } from "react";

const MOBILE_TOPBAR_HEIGHT = 56;
const AUTO_HIDE_MS = 3000;

export default function NetworkStatusIndicator() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [visible, setVisible] = useState(false);

  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  /* Mount first (prevents hydration mismatch) */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Detect mobile */
  useEffect(() => {
    if (!mounted) return;

    const update = () => setIsMobile(window.innerWidth <= 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mounted]);

  /* Show + auto-hide helper */
  const showTemporarily = () => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, AUTO_HIDE_MS);
  };

  /* Online / Offline listeners */
  useEffect(() => {
    if (!mounted) return;

    // Set initial online state AFTER mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      showTemporarily();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showTemporarily();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    showTemporarily();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [mounted]);

  // 🚨 Prevent SSR mismatch
  if (!mounted || !visible) return null;

  return (
    <div
      style={{
        position: "fixed",

        top: isMobile ? `${MOBILE_TOPBAR_HEIGHT + 8}px` : "auto",
        right: "16px",
        bottom: isMobile ? "auto" : "16px",

        zIndex: 1500,
        padding: "6px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        color: "#fff",
        backgroundColor: isOnline ? "#16a34a" : "#dc2626",
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",

        pointerEvents: "none",
        userSelect: "none",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
      aria-live="polite"
    >
      {isOnline ? "🟢 Online" : "🔴 Offline"}
    </div>
  );
}

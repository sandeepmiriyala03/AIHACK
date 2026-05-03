"use client";

import { useState, useEffect, type ReactNode } from "react";
import { YuktAIWrapper } from "@yuktishaalaa/yuktai";

export default function YuktaiClient({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // ✅ 🔥 ADD THIS (SERVICE WORKER REGISTRATION)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("✅ Service Worker registered:", reg);
        })
        .catch((err) => {
          console.error("❌ Service Worker failed:", err);
        });
    }
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <YuktAIWrapper position="left">
      {children}
    </YuktAIWrapper>
  );
}
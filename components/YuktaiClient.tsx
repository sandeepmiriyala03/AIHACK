"use client";

import { useState, useEffect } from "react";
import { YuktAIWrapper } from "@yuktishaalaa/yuktai";

export default function YuktaiClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and first render — return children plain, no wrapper
  // This prevents React hydration mismatch error #418
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <YuktAIWrapper position="left">
      {children}
    </YuktAIWrapper>
  );
}
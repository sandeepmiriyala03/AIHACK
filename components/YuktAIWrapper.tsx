"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { wcagPlugin } from "./A11yWidget";

export default function YuktAIWrapper() {
  const pathname = usePathname();

  useEffect(() => {
    const plugin = wcagPlugin;

    const run = async () => {
      try {
        await plugin.execute({
          enabled: true,
          autoFix: true,
        });

        console.log("♿ WCAG executed");

        // expose for debugging
        (window as any).runWCAG = () =>
          plugin.execute({ enabled: true, autoFix: true });
      } catch (e) {
        console.error("WCAG load failed:", e);
      }
    };

    run();

    return () => {
      plugin.stopObserver();
    };
  }, [pathname]);

  return null;
}
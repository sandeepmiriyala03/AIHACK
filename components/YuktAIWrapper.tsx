"use client";

import { useEffect } from "react";

type YuktAIAPI = {
  list?: () => string[];
  wcagPlugin?: {
    execute?: (config: any) => Promise<any>;
    stopObserver?: () => void;
  };
};

export default function YuktAIWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let mounted = true;
    let apiRef: YuktAIAPI | null = null;

    (async () => {
      try {
        const mod = await import("yuktai-js");
        if (!mounted) return;

        const api: YuktAIAPI = mod?.default;
        apiRef = api;

        console.log("YuktAI API:", api);

        const features = api?.list?.() || [];
        console.log("YuktAI features:", features);

        // 🔥 Accessibility
        if (features.includes("ui.a11y.pro")) {
          document.documentElement.classList.add("a11y-enabled");

          if (api?.wcagPlugin?.execute) {
            const report = await api.wcagPlugin.execute({
              enabled: true,
              autoFix: true,
              highContrast: false,
              reduceMotion: false,
            });

            console.log(
              `♿ yuktai-a11y: ${report?.fixed ?? 0} fixes across ${
                report?.scanned ?? 0
              } nodes`
            );
          } else {
            console.error(
              "❌ wcagPlugin not available in yuktai-js (check build/install)"
            );
          }
        }

        // 🔥 OCR
        if (features.includes("image.ocr.smart")) {
          document.documentElement.classList.add("ocr-enhanced");
        }
      } catch (err) {
        console.error("YuktAI load error:", err);
      }
    })();

    return () => {
      mounted = false;

      // cleanup observer
      apiRef?.wcagPlugin?.stopObserver?.();
    };
  }, []);

  return <>{children}</>;
}
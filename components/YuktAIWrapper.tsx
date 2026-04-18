"use client";

import { useEffect } from "react";

export default function YuktAIWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let mounted = true;

    import("yuktai-js")
      .then((mod: any) => {
        if (!mounted) return;

        const api = mod?.default;
        const features: string[] = api?.list?.() || [];

        console.log("YuktAI features:", features);

        // 🔥 Accessibility Mode
        if (features.includes("ui.a11y.pro")) {
          console.log("✅ Accessibility enabled");

          api.wcagPlugin
            .execute({
              enabled: true,
              autoFix: true,
              highContrast: false,
              reduceMotion: false,
            })
            .then((report: { fixed: number; scanned: number }) => {
              console.log(
                `♿ yuktai-a11y: ${report.fixed} fixes across ${report.scanned} nodes`
              );
            });

          document.documentElement.classList.add("a11y-enabled");
        }

        // 🔥 OCR Enhancement Mode
        if (features.includes("image.ocr.smart")) {
          console.log("✅ OCR enhancement enabled");

          document.documentElement.classList.add("ocr-enhanced");
        }
      })
      .catch((err) => {
        console.error("YuktAI load error:", err);
      });

    return () => {
      mounted = false;

      // clean up all observers when component unmounts
      import("yuktai-js")
        .then((mod: any) => {
          mod?.default?.wcagPlugin?.stopObserver?.();
          mod?.default?.wcagPlugin?.stopDrawerObserver?.();
        })
        .catch(() => {});
    };
  }, []);

  return <>{children}</>;
}
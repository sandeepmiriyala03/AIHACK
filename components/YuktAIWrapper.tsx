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

          document.documentElement.classList.add("a11y-enabled");

          // ✅ DOM-only detection (no id)
          const existing = document.querySelector(
            '[data-yukt="announcer"]'
          );

          if (!existing) {
            const announcer = document.createElement("div");

            announcer.setAttribute("data-yukt", "announcer");
            announcer.setAttribute("aria-live", "polite");

            announcer.style.cssText =
              "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";

            announcer.textContent = "Accessibility mode enabled";

            document.body.appendChild(announcer);
          }
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
    };
  }, []);

  return <>{children}</>;
}
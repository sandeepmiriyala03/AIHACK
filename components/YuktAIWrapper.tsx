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

        const api = mod.default;
        const features: string[] = api?.list?.() || [];
        console.log("YuktAI features:", features);
        if (features.includes("ui.a11y.pro")) {
          console.log("✅ Accessibility enabled");
          document.body.classList.add("a11y-enabled");
          const announcer = document.createElement("div");
          announcer.setAttribute("aria-live", "polite");
          announcer.style.position = "absolute";
          announcer.style.left = "-9999px";
          announcer.innerText = "Accessibility mode enabled";
          document.body.appendChild(announcer);
        }

        if (features.includes("image.ocr.smart")) {
          console.log("✅ OCR enhancement enabled");

          document.body.classList.add("ocr-enhanced");
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
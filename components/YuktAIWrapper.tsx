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

        console.log("YuktAI API:", api);

        const features: string[] = api?.list?.() || [];
        console.log("YuktAI features:", features);

        if (features.includes("ui.a11y.pro")) {
          console.log("✅ Accessibility enabled");

          document.documentElement.classList.add("a11y-enabled");

          // ✅ SAFE CALL
          if (api?.wcagPlugin?.execute) {
            api.wcagPlugin
              .execute({
                enabled: true,
                autoFix: true,
              })
              .then((report: any) => {
                console.log("♿ A11Y:", report);
              });
          } else {
            console.error(
              "❌ wcagPlugin not available in yuktai-js. Plugin not executed."
            );
          }
        }

        if (features.includes("image.ocr.smart")) {
          document.documentElement.classList.add("ocr-enhanced");
        }
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  return <>{children}</>;
}


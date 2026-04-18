"use client";

import { useEffect } from "react";

export default function YuktAIWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    import("yuktai-js").then((mod: any) => {
      const api = mod.default;

      const features = api?.list?.() || [];

      console.log("YuktAI features:", features);

      // Example usage
      if (features.includes("image.ocr.smart")) {
        console.log("✅ OCR enhancement available");
      }

      if (features.includes("ui.a11y.pro")) {
        console.log("✅ Accessibility features available");
      }
    });
  }, []);

  return <>{children}</>;
}
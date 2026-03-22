// components/GAListenerInner.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GAListenerInner({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;

    const query = searchParams?.toString();
    const url = pathname + (query ? `?${query}` : "");

    window.gtag("config", gaId, { page_path: url });
  }, [pathname, searchParams, gaId]);

  return null;
}
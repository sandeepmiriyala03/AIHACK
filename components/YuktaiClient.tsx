"use client";
import type { ReactNode } from "react";
import { YuktAIWrapper } from "@yuktishaalaa/yuktai";

export default function YuktaiClient({ children }: { children: ReactNode }) {
  return (
    <YuktAIWrapper position="left" launcher showAccessibility showRag showVibeCoder showAgent engine="rust">
      {children}
    </YuktAIWrapper>
  );
}
"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { YuktAIWrapper } from "@yuktishaalaa/yuktai";

/**
 * Wraps the site in yuktai and adds ONE launcher button (bottom-left).
 * The four yuktai buttons (Vibe Coder, Agent, Ask page, Accessibility)
 * stay hidden until the user taps the launcher; tapping again hides them.
 *
 * Show/hide is done with <html data-yuktai-tools="open|closed"> and the
 * "yuktai launcher" rules in globals.css.
 */
const STORAGE_KEY = "yuktai-tools-open";

export default function YuktaiClient({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setOpen(true);
    } catch {
      /* storage blocked: start closed */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-yuktai-tools", open ? "open" : "closed");
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open, mounted]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  if (!mounted) return <>{children}</>;

  return (
    <YuktAIWrapper position="left" showRag={true} showAgent={true}>
      {children}

      <button
        type="button"
        className="yuktaiLauncher"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) setOpen(false);
        }}
        aria-expanded={open}
        aria-label={open ? "Hide yuktai tools" : "Show yuktai tools (AI agent, ask page, accessibility)"}
        title={open ? "Hide yuktai tools" : "yuktai tools"}
      >
        {open ? (
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
            <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
          </svg>
        )}
      </button>
    </YuktAIWrapper>
  );
}
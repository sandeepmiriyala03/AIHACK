// =====================================================
// AksharaChitra — useAutosave Hook
// =====================================================
// Saves & restores poster text fields to/from localStorage.
// Safe for Next.js: localStorage access is inside useEffect only.

import { useEffect, useRef } from "react";
import type { PosterState } from "../types";

const AUTOSAVE_KEY = "ak_autosave_v13";

type AutosaveFields = Pick<PosterState, "title" | "subtitle" | "message">;

/**
 * Autosaves title/subtitle/message every 4 seconds.
 * Returns the restored fields from a previous session, or null.
 */
export function useAutosave(
  state: AutosaveFields,
  onRestore: (fields: AutosaveFields) => void
) {
  // Restore once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as AutosaveFields & { ts?: number };
      if (saved?.title || saved?.subtitle || saved?.message) {
        onRestore({
          title: saved.title || "",
          subtitle: saved.subtitle || "",
          message: saved.message || "",
        });
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save periodically
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const id = setInterval(() => {
      try {
        localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({
            title: stateRef.current.title,
            subtitle: stateRef.current.subtitle,
            message: stateRef.current.message,
            ts: Date.now(),
          })
        );
      } catch {
        // ignore quota errors
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const clearAutosave = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {
      // ignore
    }
  };

  return { clearAutosave };
}

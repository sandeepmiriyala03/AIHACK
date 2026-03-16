"use client";

// =====================================================
// AksharaTantra — FontPicker (FIXED)
// Fixes: tab UI missing, loadLocalFonts never called,
//        search input missing, error never displayed
// =====================================================

import { useEffect, useRef, useState, useMemo } from "react";

export interface CuratedFont {
  name: string;
  label: string;
  sample: string;
  googleFont?: string;
}

export const LANGUAGE_FONTS: Record<string, CuratedFont[]> = {
  tel: [
    { name: "'Noto Serif Telugu', serif",    label: "Noto Serif Telugu",    sample: "తెలుగు అక్షరం",  googleFont: "Noto+Serif+Telugu"    },
    { name: "'Hind Guntur', sans-serif",      label: "Hind Guntur",          sample: "తెలుగు అక్షరం",  googleFont: "Hind+Guntur"          },
    { name: "'Baloo Tammudu 2', cursive",     label: "Baloo Tammudu 2",      sample: "తెలుగు అక్షరం",  googleFont: "Baloo+Tammudu+2"      },
    { name: "'Tiro Telugu', serif",           label: "Tiro Telugu",          sample: "తెలుగు అక్షరం",  googleFont: "Tiro+Telugu"          },
    { name: "'Anek Telugu', sans-serif",      label: "Anek Telugu",          sample: "తెలుగు అక్షరం",  googleFont: "Anek+Telugu"          },
  ],
  eng: [
    { name: "'Playfair Display', serif",      label: "Playfair Display",     sample: "The quick brown fox",  googleFont: "Playfair+Display"     },
    { name: "'Lora', serif",                  label: "Lora",                 sample: "The quick brown fox",  googleFont: "Lora"                 },
    { name: "'Josefin Sans', sans-serif",     label: "Josefin Sans",         sample: "The quick brown fox",  googleFont: "Josefin+Sans"         },
    { name: "'Raleway', sans-serif",          label: "Raleway",              sample: "The quick brown fox",  googleFont: "Raleway"              },
    { name: "'Cormorant Garamond', serif",    label: "Cormorant Garamond",   sample: "The quick brown fox",  googleFont: "Cormorant+Garamond"   },
  ],
  hin: [
    { name: "'Noto Serif Devanagari', serif", label: "Noto Serif Devanagari", sample: "हिन्दी अक्षर", googleFont: "Noto+Serif+Devanagari" },
    { name: "'Hind', sans-serif",             label: "Hind",                  sample: "हिन्दी अक्षर", googleFont: "Hind"                  },
    { name: "'Tiro Devanagari Hindi', serif", label: "Tiro Devanagari",       sample: "हिन्दी अक्षर", googleFont: "Tiro+Devanagari+Hindi" },
  ],
  san: [
    { name: "'Noto Serif Devanagari', serif", label: "Noto Serif Devanagari", sample: "संस्कृतम्", googleFont: "Noto+Serif+Devanagari" },
    { name: "'Tiro Devanagari Sanskrit', serif", label: "Tiro Sanskrit",      sample: "संस्कृतम्", googleFont: "Tiro+Devanagari+Sanskrit" },
  ],
  tam: [
    { name: "'Noto Serif Tamil', serif",      label: "Noto Serif Tamil",     sample: "தமிழ் எழுத்து", googleFont: "Noto+Serif+Tamil"     },
    { name: "'Latha', sans-serif",            label: "Latha",                sample: "தமிழ் எழுத்து"                                       },
  ],
  kan: [
    { name: "'Noto Serif Kannada', serif",    label: "Noto Serif Kannada",   sample: "ಕನ್ನಡ ಅಕ್ಷರ", googleFont: "Noto+Serif+Kannada"   },
  ],
  mal: [
    { name: "'Noto Serif Malayalam', serif",  label: "Noto Serif Malayalam", sample: "മലയാളം അക്ഷരം", googleFont: "Noto+Serif+Malayalam" },
  ],
  ori: [
    { name: "'Noto Serif Oriya', serif",      label: "Noto Serif Oriya",     sample: "ଓଡ଼ିଆ ଅକ୍ଷର", googleFont: "Noto+Serif+Oriya"     },
  ],
};

export function getFontsForLanguage(langCode: string): CuratedFont[] {
  return LANGUAGE_FONTS[langCode] ?? LANGUAGE_FONTS["eng"];
}

const loadedFonts = new Set<string>();

export function loadGoogleFont(googleFont: string) {
  if (loadedFonts.has(googleFont)) return;
  if (document.querySelector(`link[href*="${googleFont}"]`)) return;
  loadedFonts.add(googleFont);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleFont}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}

interface LocalFontEntry {
  family: string;
}

interface FontPickerProps {
  language: string;
  selectedFont: string;
  onSelect: (fontFamily: string) => void;
}

type FontTab = "curated" | "local";

// ─── Inline styles ────────────────────────────────────────────────────────────
const S = {
  triggerBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1.5px solid #e0e0e0",
    background: "#fafafa",
    cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
    width: "100%",
    textAlign: "left" as const,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 9998,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 14,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "14px 16px 10px",
    borderBottom: "1.5px solid #f0f0f0",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  tabRow: {
    display: "flex",
    gap: 6,
  },
  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "7px 0",
    borderRadius: 8,
    border: "1.5px solid",
    borderColor: active ? "#4A90E2" : "#e0e0e0",
    background: active ? "#4A90E2" : "#fff",
    color: active ? "#fff" : "#555",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
    transition: "all 0.15s",
  }),
  searchInput: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1.5px solid #e0e0e0",
    fontSize: 13,
    fontFamily: "Montserrat, sans-serif",
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#fafafa",
    outline: "none",
  },
  listContainer: {
    overflowY: "auto" as const,
    flex: 1,
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  fontRow: (selected: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 9,
    border: "1.5px solid",
    borderColor: selected ? "#4A90E2" : "#f0f0f0",
    background: selected ? "#EBF3FD" : "#fff",
    cursor: "pointer",
    transition: "background 0.12s",
  }),
  sampleText: (fontFamily: string): React.CSSProperties => ({
    fontFamily,
    fontSize: 17,
    flex: 1,
    color: "#222",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  }),
  labelText: {
    fontSize: 11,
    color: "#888",
    fontFamily: "Montserrat, sans-serif",
    flexShrink: 0,
  } as React.CSSProperties,
  emptyState: {
    padding: "24px 0",
    textAlign: "center" as const,
    color: "#aaa",
    fontSize: 13,
    fontFamily: "Montserrat, sans-serif",
  },
  errorBox: {
    margin: "12px 16px",
    padding: "10px 14px",
    background: "#FFF3E0",
    border: "1.5px solid #FFB300",
    borderRadius: 9,
    color: "#E65100",
    fontSize: 13,
    fontFamily: "Montserrat, sans-serif",
  },
  localAccessBtn: {
    margin: "16px auto",
    display: "block",
    padding: "10px 20px",
    borderRadius: 9,
    border: "none",
    background: "#4A90E2",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "Montserrat, sans-serif",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#888",
    lineHeight: 1,
    padding: "0 4px",
    alignSelf: "flex-end" as const,
  },
  loadingText: {
    padding: "20px 0",
    textAlign: "center" as const,
    color: "#999",
    fontSize: 13,
    fontFamily: "Montserrat, sans-serif",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function FontPicker({ language, selectedFont, onSelect }: FontPickerProps) {
  const [open, setOpen]               = useState(false);
  const [tab, setTab]                 = useState<FontTab>("curated");
  const [localFonts, setLocalFonts]   = useState<LocalFontEntry[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError]   = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [localPermission, setLocalPermission] = useState(false); // ✅ FIX: track if user has granted permission

  const modalRef = useRef<HTMLDivElement>(null);

  const curatedFonts = useMemo(() => getFontsForLanguage(language), [language]);

  // Load Google Fonts when popup opens
  useEffect(() => {
    if (!open) return;
    curatedFonts.forEach((f) => { if (f.googleFont) loadGoogleFont(f.googleFont); });
  }, [open, curatedFonts]);

  // ✅ FIX 2: Call loadLocalFonts when switching to local tab
  useEffect(() => {
    if (!open) return;
    if (tab === "local" && localFonts.length === 0 && !localLoading && localPermission) {
      loadLocalFonts();
    }
  }, [tab, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const loadLocalFonts = async () => {
    setLocalLoading(true);
    setLocalError(null);

    try {
      // ✅ FIX: Check API availability with clear message
      if (!("queryLocalFonts" in window)) {
        setLocalError(
          "Local Font Access is not supported in this browser. Please use Chrome 103+ on desktop."
        );
        return;
      }

      const data: LocalFontEntry[] = await (window as any).queryLocalFonts();

      const seen = new Set<string>();
      const unique = data.filter((f) => {
        if (seen.has(f.family)) return false;
        seen.add(f.family);
        return true;
      });

      unique.sort((a, b) => a.family.localeCompare(b.family));
      setLocalFonts(unique);
      setLocalPermission(true);
    } catch (err: any) {
      // ✅ FIX: Distinguish permission denied from other errors
      if (err?.name === "NotAllowedError") {
        setLocalError("Permission denied. Please allow font access when the browser prompts.");
      } else {
        setLocalError("Unable to load local fonts. " + (err?.message ?? ""));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGrantAccess = () => {
    setLocalPermission(true);
    loadLocalFonts();
  };

  const handleSelect = (fontFamily: string) => {
    onSelect(fontFamily);
    setOpen(false);
  };

  // ✅ FIX 3: localSearch actually filters the list
  const filteredLocal = localSearch.trim()
    ? localFonts.filter((f) =>
        f.family.toLowerCase().includes(localSearch.toLowerCase())
      )
    : localFonts;

  const displayLabel = selectedFont
    ? selectedFont.replace(/['"]/g, "").split(",")[0].trim()
    : "Choose Font";

  return (
    <>
      {/* Trigger button */}
      <button style={S.triggerBtn} onClick={() => setOpen(true)}>
        🔤 <span>{displayLabel}</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div style={S.overlay}>
          <div ref={modalRef} style={S.modal}>

            {/* ── Header ── */}
            <div style={S.modalHeader}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 14, color: "#333" }}>
                  🔤 Choose Font
                </span>
                <button style={S.closeBtn} onClick={() => setOpen(false)}>✕</button>
              </div>

              {/* ✅ FIX 1: Tab switcher rendered */}
              <div style={S.tabRow}>
                <button
                  style={S.tab(tab === "curated")}
                  onClick={() => setTab("curated")}
                >
                  🌐 Curated
                </button>
                <button
                  style={S.tab(tab === "local")}
                  onClick={() => setTab("local")}
                >
                  💻 Local
                </button>
              </div>

              {/* ✅ FIX 3: Search input rendered for local tab */}
              {tab === "local" && localFonts.length > 0 && (
                <input
                  style={S.searchInput}
                  placeholder="Search local fonts…"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            {/* ── Curated Tab ── */}
            {tab === "curated" && (
              <div style={S.listContainer}>
                {curatedFonts.map((f) => (
                  <div
                    key={f.name}
                    style={S.fontRow(selectedFont === f.name)}
                    onClick={() => handleSelect(f.name)}
                  >
                    <span style={S.sampleText(f.name)}>{f.sample}</span>
                    <span style={S.labelText}>{f.label}</span>
                    {selectedFont === f.name && (
                      <span style={{ color: "#4A90E2", fontSize: 16 }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Local Tab ── */}
            {tab === "local" && (
              <>
                {/* ✅ FIX 4: Error displayed */}
                {localError && (
                  <div style={S.errorBox}>⚠️ {localError}</div>
                )}

                {/* Permission gate — show Grant button before loading */}
                {!localPermission && !localError && !localLoading && (
                  <div style={{ ...S.emptyState, padding: "24px 16px" }}>
                    <p style={{ marginBottom: 12 }}>
                      Access fonts installed on your device.<br />
                      <span style={{ fontSize: 11, color: "#bbb" }}>
                        Chrome 103+ required · browser will ask permission
                      </span>
                    </p>
                    <button style={S.localAccessBtn} onClick={handleGrantAccess}>
                      🔓 Grant Font Access
                    </button>
                  </div>
                )}

                {localLoading && (
                  <p style={S.loadingText}>⏳ Loading local fonts…</p>
                )}

                {!localLoading && localFonts.length > 0 && (
                  <div style={S.listContainer}>
                    {filteredLocal.length === 0 ? (
                      <p style={S.emptyState}>
                        No fonts match <b> {localSearch} </b>
                      </p>
                    ) : (
                      filteredLocal.map((f) => {
                        const fontFamily = `'${f.family}', sans-serif`;
                        return (
                          <div
                            key={f.family}
                            style={S.fontRow(selectedFont === fontFamily)}
                            onClick={() => handleSelect(fontFamily)}
                          >
                            <span style={S.sampleText(fontFamily)}>{f.family}</span>
                            {selectedFont === fontFamily && (
                              <span style={{ color: "#4A90E2", fontSize: 16 }}>✓</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
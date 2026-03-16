"use client";

// =====================================================
// AksharaTantra — FontPicker (Telugu Fonts Expanded)
// =====================================================

import { useEffect, useRef, useState, useMemo } from "react";

export interface CuratedFont {
  name: string;
  label: string;
  sample: string;
  googleFont?: string;
}

// ─── Telugu font list ─────────────────────────────────────────────────────────
// These fonts are served from /public/fonts/telugu/ as @font-face declarations
// (or from your existing font loading pipeline).
// Group labels are visual only — they don't affect rendering.

const TELUGU_FONTS: CuratedFont[] = [
  // ── Classic / Calligraphic ────────────────────────────────────────────────
  { name: "'Gurajada', serif",             label: "Gurajada",               sample: "తెలుగు అక్షరం" },
  { name: "'NTR', sans-serif",             label: "NTR",                    sample: "తెలుగు అక్షరం" },
  { name: "'Ramaneeya', serif",            label: "Ramaneeya",              sample: "తెలుగు అక్షరం" },
  { name: "'Veturi', serif",               label: "Veturi",                 sample: "తెలుగు అక్షరం" },
  { name: "'Sirivennela', serif",          label: "Sirivennela",            sample: "తెలుగు అక్షరం" },

  // ── Chathura family ───────────────────────────────────────────────────────
  { name: "'Chathura', sans-serif",                   label: "Chathura Regular",   sample: "తెలుగు అక్షరం" },
  { name: "'Chathura', sans-serif",                   label: "Chathura Thin",      sample: "తెలుగు అక్షరం" },
  { name: "'Chathura', sans-serif",                   label: "Chathura Light",     sample: "తెలుగు అక్షరం" },
  { name: "'Chathura', sans-serif",                   label: "Chathura Bold",      sample: "తెలుగు అక్షరం" },
  { name: "'Chathura', sans-serif",                   label: "Chathura ExtraBold", sample: "తెలుగు అక్షరం" },

  // ── Traditional / Historical ─────────────────────────────────────────────
  { name: "'Ramaraja', serif",             label: "Ramaraja",               sample: "తెలుగు అక్షరం" },
  { name: "'RaviPrakash', sans-serif",     label: "Ravi Prakash",           sample: "తెలుగు అక్షరం" },
  { name: "'TenaliRamakrishna', serif",    label: "Tenali Ramakrishna",     sample: "తెలుగు అక్షరం" },
  { name: "'Timmana', serif",              label: "Timmana",                sample: "తెలుగు అక్షరం" },
  { name: "'TANA', sans-serif",            label: "TANA",                   sample: "తెలుగు అక్షరం" },
  { name: "'Ponnala', sans-serif",         label: "Ponnala",                sample: "తెలుగు అక్షరం" },

  // ── Gidugu family ────────────────────────────────────────────────────────
  { name: "'Gidugu', sans-serif",          label: "Gidugu",                 sample: "తెలుగు అక్షరం" },
  { name: "'Gidugu', sans-serif",          label: "Gidugu Italic",          sample: "తెలుగు అక్షరం" },

  // ── Single-weight ─────────────────────────────────────────────────────────
  { name: "'LakkiReddy', serif",           label: "Lakki Reddy",            sample: "తెలుగు అక్షరం" },
  { name: "'Peddana', serif",              label: "Peddana",                sample: "తెలుగు అక్షరం" },

  // ── Nandakam family ──────────────────────────────────────────────────────
  { name: "'Nandakam', serif",             label: "Nandakam",               sample: "తెలుగు అక్షరం" },
  { name: "'Nandakam', serif",             label: "Nandakam Italic",        sample: "తెలుగు అక్షరం" },

  // ── Purushothamaa family ─────────────────────────────────────────────────
  { name: "'Purushothamaa', serif",        label: "Purushothamaa",          sample: "తెలుగు అక్షరం" },
  { name: "'Purushothamaa', serif",        label: "Purushothamaa Italic",   sample: "తెలుగు అక్షరం" },

  // ── Ramabhadra family ────────────────────────────────────────────────────
  { name: "'Ramabhadra', serif",           label: "Ramabhadra",             sample: "తెలుగు అక్షరం" },
  { name: "'Ramabhadra', serif",           label: "Ramabhadra Italic",      sample: "తెలుగు అక్షరం" },

  // ── Sree Krushnadevaraya family ──────────────────────────────────────────
  { name: "'SreeKrushnadevaraya', serif",  label: "Sree Krushnadevaraya",         sample: "తెలుగు అక్షరం" },
  { name: "'SreeKrushnadevaraya', serif",  label: "Sree Krushnadevaraya Italic",  sample: "తెలుగు అక్షరం" },

  // ── Suranna family ───────────────────────────────────────────────────────
  { name: "'Suranna', serif",              label: "Suranna",                sample: "తెలుగు అక్షరం" },
  { name: "'Suranna', serif",              label: "Suranna Bold",           sample: "తెలుగు అక్షరం" },
  { name: "'Suranna', serif",              label: "Suranna Italic",         sample: "తెలుగు అక్షరం" },
  { name: "'Suranna', serif",              label: "Suranna Bold Italic",    sample: "తెలుగు అక్షరం" },

  // ── Suravaram family ─────────────────────────────────────────────────────
  { name: "'Suravaram', serif",            label: "Suravaram",              sample: "తెలుగు అక్షరం" },
  { name: "'Suravaram', serif",            label: "Suravaram Italic",       sample: "తెలుగు అక్షరం" },

  // ── 🆕 Newly Added ────────────────────────────────────────────────────────

  // Annamayya family
  { name: "'Annamayya', serif",            label: "Annamayya",              sample: "తెలుగు అక్షరం" },
  { name: "'Annamayya', serif",            label: "Annamayya Bold",         sample: "తెలుగు అక్షరం" },
  { name: "'Annamayya', serif",            label: "Annamayya Italic",       sample: "తెలుగు అక్షరం" },
  { name: "'Annamayya', serif",            label: "Annamayya Bold Italic",  sample: "తెలుగు అక్షరం" },

  // Dhurjati family
  { name: "'Dhurjati', sans-serif",        label: "Dhurjati",               sample: "తెలుగు అక్షరం" },
  { name: "'Dhurjati', sans-serif",        label: "Dhurjati Italic",        sample: "తెలుగు అక్షరం" },

  // JIMS family
  { name: "'JIMS', sans-serif",            label: "JIMS",                   sample: "తెలుగు అక్షరం" },
  { name: "'JIMS', sans-serif",            label: "JIMS Italic",            sample: "తెలుగు అక్షరం" },

  // KanakaDurga family
  { name: "'KanakaDurga', serif",          label: "Kanaka Durga",           sample: "తెలుగు అక్షరం" },
  { name: "'KanakaDurga', serif",          label: "Kanaka Durga Italic",    sample: "తెలుగు అక్షరం" },

  // Mandali family
  { name: "'Mandali', sans-serif",         label: "Mandali",                sample: "తెలుగు అక్షరం" },
  { name: "'Mandali', sans-serif",         label: "Mandali Bold",           sample: "తెలుగు అక్షరం" },
  { name: "'Mandali', sans-serif",         label: "Mandali Italic",         sample: "తెలుగు అక్షరం" },
  { name: "'Mandali', sans-serif",         label: "Mandali Bold Italic",    sample: "తెలుగు అక్షరం" },

  // Potti Sreeramulu
  { name: "'PottiSreeramulu', sans-serif", label: "Potti Sreeramulu",       sample: "తెలుగు అక్షరం" },
];

// ─── Font weights for variant-aware rendering ─────────────────────────────────
// Maps label suffix → CSS font-weight + font-style
export function getFontVariantStyle(label: string): React.CSSProperties {
  const l = label.toLowerCase();
  const bold   = l.includes("bold") || l.includes("extrabold");
  const italic = l.includes("italic");
  const thin   = l.includes("thin");
  const light  = l.includes("light");

  return {
    fontWeight: l.includes("extrabold") ? 800 : bold ? 700 : thin ? 100 : light ? 300 : 400,
    fontStyle:  italic ? "italic" : "normal",
  };
}

export const LANGUAGE_FONTS: Record<string, CuratedFont[]> = {
  tel: TELUGU_FONTS,
  eng: [
    { name: "'Playfair Display', serif",      label: "Playfair Display",     sample: "The quick brown fox",  googleFont: "Playfair+Display"     },
    { name: "'Lora', serif",                  label: "Lora",                 sample: "The quick brown fox",  googleFont: "Lora"                 },
    { name: "'Josefin Sans', sans-serif",     label: "Josefin Sans",         sample: "The quick brown fox",  googleFont: "Josefin+Sans"         },
    { name: "'Raleway', sans-serif",          label: "Raleway",              sample: "The quick brown fox",  googleFont: "Raleway"              },
    { name: "'Cormorant Garamond', serif",    label: "Cormorant Garamond",   sample: "The quick brown fox",  googleFont: "Cormorant+Garamond"   },
  ],
  hin: [
    
    
    { name: "'Tiro Devanagari Hindi', serif", label: "Tiro Devanagari",     
        sample: "हिन्दी अक्षर", googleFont: "Tiro+Devanagari+Hindi" },
  ],
  san: [
    { name: "'Noto Serif Devanagari', serif",    label: "Noto Serif Devanagari", sample: "संस्कृतम्", googleFont: "Noto+Serif+Devanagari"      },
    { name: "'Tiro Devanagari Sanskrit', serif", label: "Tiro Sanskrit",         sample: "संस्कृतम्", googleFont: "Tiro+Devanagari+Sanskrit"   },
  ],
  tam: [
    { name: "'Noto Serif Tamil', serif",      label: "Noto Serif Tamil",     sample: "தமிழ் எழுத்து", googleFont: "Noto+Serif+Tamil"     },
    { name: "'Latha', sans-serif",            label: "Latha",                sample: "தமிழ் எழுத்து"                                      },
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
    maxWidth: 440,
    maxHeight: "82vh",
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
  // ── Group header inside font list ──
  groupHeader: {
    padding: "6px 10px 2px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#aaa",
    fontFamily: "Montserrat, sans-serif",
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
  sampleText: (fontFamily: string, variantStyle: React.CSSProperties): React.CSSProperties => ({
    fontFamily,
    ...variantStyle,
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
  countBadge: {
    fontSize: 11,
    background: "#EBF4FF",
    color: "#4A90E2",
    borderRadius: 10,
    padding: "2px 8px",
    fontFamily: "Montserrat, sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
};

// ─── Telugu font groups for display ──────────────────────────────────────────
// Purely cosmetic — helps users scan 50+ fonts without scrolling blindly
const TELUGU_GROUPS: { heading: string; labels: string[] }[] = [
  {
    heading: "Classic",
    labels: ["Gurajada", "NTR", "Ramaneeya", "Veturi", "Sirivennela"],
  },
  {
    heading: "Chathura",
    labels: ["Chathura Regular", "Chathura Thin", "Chathura Light", "Chathura Bold", "Chathura ExtraBold"],
  },
  {
    heading: "Traditional",
    labels: ["Ramaraja", "Ravi Prakash", "Tenali Ramakrishna", "Timmana", "TANA", "Ponnala"],
  },
  {
    heading: "Gidugu",
    labels: ["Gidugu", "Gidugu Italic"],
  },
  {
    heading: "Single-weight",
    labels: ["Lakki Reddy", "Peddana"],
  },
  {
    heading: "Nandakam",
    labels: ["Nandakam", "Nandakam Italic"],
  },
  {
    heading: "Purushothamaa",
    labels: ["Purushothamaa", "Purushothamaa Italic"],
  },
  {
    heading: "Ramabhadra",
    labels: ["Ramabhadra", "Ramabhadra Italic"],
  },
  {
    heading: "Sree Krushnadevaraya",
    labels: ["Sree Krushnadevaraya", "Sree Krushnadevaraya Italic"],
  },
  {
    heading: "Suranna",
    labels: ["Suranna", "Suranna Bold", "Suranna Italic", "Suranna Bold Italic"],
  },
  {
    heading: "Suravaram",
    labels: ["Suravaram", "Suravaram Italic"],
  },
  {
    heading: "🆕 Annamayya",
    labels: ["Annamayya", "Annamayya Bold", "Annamayya Italic", "Annamayya Bold Italic"],
  },
  {
    heading: "🆕 Dhurjati",
    labels: ["Dhurjati", "Dhurjati Italic"],
  },
  {
    heading: "🆕 JIMS",
    labels: ["JIMS", "JIMS Italic"],
  },
  {
    heading: "🆕 Kanaka Durga",
    labels: ["Kanaka Durga", "Kanaka Durga Italic"],
  },
  {
    heading: "🆕 Mandali",
    labels: ["Mandali", "Mandali Bold", "Mandali Italic", "Mandali Bold Italic"],
  },
  {
    heading: "🆕 Potti Sreeramulu",
    labels: ["Potti Sreeramulu"],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function FontPicker({ language, selectedFont, onSelect }: FontPickerProps) {
  const [open, setOpen]                     = useState(false);
  const [tab, setTab]                       = useState<FontTab>("curated");
  const [search, setSearch]                 = useState("");
  const [localFonts, setLocalFonts]         = useState<LocalFontEntry[]>([]);
  const [localLoading, setLocalLoading]     = useState(false);
  const [localError, setLocalError]         = useState<string | null>(null);
  const [localSearch, setLocalSearch]       = useState("");
  const [localPermission, setLocalPermission] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const curatedFonts = useMemo(() => getFontsForLanguage(language), [language]);

  // Load Google Fonts when popup opens (non-Telugu only)
  useEffect(() => {
    if (!open) return;
    curatedFonts.forEach((f) => { if (f.googleFont) loadGoogleFont(f.googleFont); });
  }, [open, curatedFonts]);

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
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false);
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
      if (!("queryLocalFonts" in window)) {
        setLocalError("Local Font Access requires Chrome 103+ on desktop.");
        return;
      }
      const data: LocalFontEntry[] = await (window as any).queryLocalFonts();
      const seen = new Set<string>();
      const unique = data.filter((f) => { if (seen.has(f.family)) return false; seen.add(f.family); return true; });
      unique.sort((a, b) => a.family.localeCompare(b.family));
      setLocalFonts(unique);
      setLocalPermission(true);
    } catch (err: any) {
      setLocalError(
        err?.name === "NotAllowedError"
          ? "Permission denied. Please allow font access when the browser prompts."
          : "Unable to load local fonts. " + (err?.message ?? "")
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGrantAccess = () => { setLocalPermission(true); loadLocalFonts(); };
  const handleSelect = (fontFamily: string) => { onSelect(fontFamily); setOpen(false); };

  const filteredLocal = localSearch.trim()
    ? localFonts.filter((f) => f.family.toLowerCase().includes(localSearch.toLowerCase()))
    : localFonts;

  // ── Curated list with optional search filter ──────────────────────────────
  const filteredCurated = search.trim()
    ? curatedFonts.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()))
    : curatedFonts;

  const isTeluguGrouped = language === "tel" && !search.trim();

  const displayLabel = selectedFont
    ? selectedFont.replace(/['"]/g, "").split(",")[0].trim()
    : "Choose Font";

  return (
    <>
      {/* Trigger button */}
      <button style={S.triggerBtn} onClick={() => setOpen(true)}>
        🔤 <span>{displayLabel}</span>
        {language === "tel" && (
          <span style={{ ...S.countBadge, marginLeft: "auto" }}>
            {TELUGU_FONTS.length} fonts
          </span>
        )}
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
                  {language === "tel" && (
                    <span style={{ ...S.countBadge, marginLeft: 8, fontSize: 10 }}>
                      {TELUGU_FONTS.length} Telugu fonts
                    </span>
                  )}
                </span>
                <button style={S.closeBtn} onClick={() => setOpen(false)}>✕</button>
              </div>

              {/* Tab switcher */}
              <div style={S.tabRow}>
                <button style={S.tab(tab === "curated")} onClick={() => setTab("curated")}>
                  🌐 Curated
                </button>
                <button style={S.tab(tab === "local")} onClick={() => setTab("local")}>
                  💻 Local
                </button>
              </div>

              {/* Search — always shown on curated tab */}
              {tab === "curated" && (
                <input
                  style={S.searchInput}
                  placeholder={language === "tel" ? "Search Telugu fonts…" : "Search fonts…"}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}

              {/* Search for local tab */}
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
                {filteredCurated.length === 0 ? (
                  <p style={S.emptyState}>No fonts match {search}</p>
                ) : isTeluguGrouped ? (
                  // ── Grouped view for Telugu (search not active) ────────────
                  TELUGU_GROUPS.map((group) => {
                    const groupFonts = TELUGU_FONTS.filter((f) =>
                      group.labels.includes(f.label)
                    );
                    if (groupFonts.length === 0) return null;
                    return (
                      <div key={group.heading}>
                        <div style={S.groupHeader}>{group.heading}</div>
                        {groupFonts.map((f) => {
                          const variant = getFontVariantStyle(f.label);
                          return (
                            <div
                              key={f.label}
                              style={S.fontRow(selectedFont === f.name && displayLabel === f.label)}
                              onClick={() => handleSelect(f.name)}
                            >
                              <span style={S.sampleText(f.name, variant)}>{f.sample}</span>
                              <span style={S.labelText}>{f.label}</span>
                              {selectedFont === f.name && displayLabel === f.label && (
                                <span style={{ color: "#4A90E2", fontSize: 16 }}>✓</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  // ── Flat list for other languages or active search ─────────
                  filteredCurated.map((f) => {
                    const variant = getFontVariantStyle(f.label);
                    return (
                      <div
                        key={f.name + f.label}
                        style={S.fontRow(selectedFont === f.name)}
                        onClick={() => handleSelect(f.name)}
                      >
                        <span style={S.sampleText(f.name, variant)}>{f.sample}</span>
                        <span style={S.labelText}>{f.label}</span>
                        {selectedFont === f.name && (
                          <span style={{ color: "#4A90E2", fontSize: 16 }}>✓</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Local Tab ── */}
            {tab === "local" && (
              <>
                {localError && <div style={S.errorBox}>⚠️ {localError}</div>}

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

                {localLoading && <p style={S.loadingText}>⏳ Loading local fonts…</p>}

                {!localLoading && localFonts.length > 0 && (
                  <div style={S.listContainer}>
                    {filteredLocal.length === 0 ? (
                      <p style={S.emptyState}>No fonts match {localSearch}</p>
                    ) : (
                      filteredLocal.map((f) => {
                        const fontFamily = `'${f.family}', sans-serif`;
                        return (
                          <div
                            key={f.family}
                            style={S.fontRow(selectedFont === fontFamily)}
                            onClick={() => handleSelect(fontFamily)}
                          >
                            <span style={{ ...S.sampleText(fontFamily, {}), fontFamily }}>{f.family}</span>
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
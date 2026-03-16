"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import Head from "next/head";
import { useCallback, useReducer, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

const CropModal = dynamicImport(
  () => import("@/components/CropModal").then((m) => m.CropModal),
  { ssr: false }
);
const PosterPreview = dynamicImport(
  () => import("@/components/PosterPreview").then((m) => m.PosterPreview),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: 220, background: "#f0f0f0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 13 }}>
        Loading preview…
      </div>
    ),
  }
);
const Gallery = dynamicImport(
  () => import("@/components/sliders/Gallery").then((m) => m.Gallery),
  { ssr: false }
);

import { ToastContainer, useToastManager } from "@/components/sliders/Toast";
import { FontPicker } from "@/components/FontPicker";
import { useAutosave } from "@/hooks/useAutosave";
import { usePosterGenerator } from "@/hooks/usePosterGenerator";
import { useVoice, speak } from "@/hooks/useVoice";
import { savePosterToDB } from "@/lib/db";
import {
  getOptimalImageSize,
  resizeImageBeforeCrop,
  validateImageFile,
  sharePosterDataUrl,
} from "@/lib/imageUtils";
import {
  DEFAULT_POSTER_STATE,
  TEMPLATE_PACK,
  type PosterState,
  type Language,
} from "@/types/index";

type PosterAction =
  | { type: "SET"; key: keyof PosterState; value: PosterState[keyof PosterState] }
  | { type: "BULK"; patch: Partial<PosterState> }
  | { type: "RESET" };

function posterReducer(state: PosterState, action: PosterAction): PosterState {
  switch (action.type) {
    case "SET":   return { ...state, [action.key]: action.value };
    case "BULK":  return { ...state, ...action.patch };
    case "RESET": return { ...DEFAULT_POSTER_STATE };
    default:      return state;
  }
}

type Tab = "create" | "gallery";

function fireGalleryRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gallery-refresh"));
  }
}

export default function AksharaChitraPage() {
  const [state, dispatch] = useReducer(posterReducer, DEFAULT_POSTER_STATE);
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [cropModal, setCropModal] = useState<{
    open: boolean; imageUrl: string; target: "main" | "logo";
  }>({ open: false, imageUrl: "", target: "main" });

  const previewRef = useRef<HTMLDivElement>(null);
  const { toasts, addToast } = useToastManager();

  const { clearAutosave } = useAutosave(
    { title: state.title, subtitle: state.subtitle, message: state.message },
    (fields) => dispatch({ type: "BULK", patch: fields })
  );

  const { generatePoster, isGenerating } = usePosterGenerator({
    previewRef,
    title: state.title,
  });

  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoice({
    language: state.language,
    onTranscript: (text) => {
      dispatch({
        type: "SET", key: "message",
        value: state.message ? state.message + " " + text : text,
      });
    },
  });

  const set = useCallback(
    <K extends keyof PosterState>(key: K, value: PosterState[K]) =>
      dispatch({ type: "SET", key, value }),
    []
  );

  const applyTemplate = useCallback(
    (templateKey: string) => {
      const tpl = TEMPLATE_PACK[state.language]?.[templateKey];
      if (!tpl) return;
      dispatch({ type: "BULK", patch: { title: tpl.title, subtitle: tpl.subtitle, message: tpl.message } });
    },
    [state.language]
  );

  const handleImageUpload = useCallback(
    async (file: File, target: "main" | "logo") => {
      const maxMB = target === "logo" ? 10 : 20;
      const err = validateImageFile(file, maxMB);
      if (err) { addToast(`⚠️ ${err}`, "#E53935"); return; }
      addToast("📸 Processing image…", "#1E88E5");
      try {
        const maxDim = target === "logo" ? 1000 : getOptimalImageSize();
        const dataUrl = await resizeImageBeforeCrop(file, maxDim);
        setCropModal({ open: true, imageUrl: dataUrl, target });
      } catch {
        addToast("❌ Failed to process image", "#E53935");
      }
    },
    [addToast]
  );

  const handleCropApply = useCallback(
    (dataUrl: string, target: "main" | "logo") => {
      if (target === "logo") set("uploadedLogoData", dataUrl);
      else set("uploadedMainData", dataUrl);
      setCropModal({ open: false, imageUrl: "", target: "main" });
      addToast("✅ Image cropped!", "#43A047");
    },
    [set, addToast]
  );

  const handleGenerate = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster();
    if (!url) addToast("⚠️ Generation failed — check console", "#E53935");
    else addToast("✅ Poster ready!", "#43A047");
  };

  const handleDownload = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster({ download: true });
    if (url) addToast("✅ Downloaded!", "#43A047");
    else addToast("❌ Download failed", "#E53935");
  };

  const handleShare = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster();
    if (!url) { addToast("❌ Could not generate poster", "#E53935"); return; }
    const result = await sharePosterDataUrl(url, state.title);
    if (result === "shared") addToast("✅ Shared!", "#43A047");
    else if (result === "downloaded") addToast("📩 Downloaded — share manually!", "#1E88E5");
    else addToast("❌ Share failed", "#E53935");
  };

  const handleSave = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster();
    if (!url) { addToast("❌ Could not generate", "#E53935"); return; }
    await savePosterToDB({ title: state.title, dataUrl: url, ts: Date.now() });
    addToast("✅ Saved to My Creations!", "#43A047");
    fireGalleryRefresh();
  };

  const handleClear = () => {
    if (!confirm("Clear all fields and reset settings?")) return;
    dispatch({ type: "RESET" });
    clearAutosave();
    addToast("✅ Reset!", "#4CAF50");
  };

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "gallery") fireGalleryRefresh();
  };

  const handleLanguageChange = (lang: Language) => {
    set("language", lang);
    set("posterFont", "");
  };

  function getPlaceholders(lang: Language) {
    const map: Record<Language, { title: string; subtitle: string; message: string }> = {
      eng: { title: "Title",       subtitle: "Subtitle",       message: "Type your message..."         },
      tel: { title: "శీర్షిక",    subtitle: "ఉపశీర్షిక",    message: "సందేశం రాయండి..."             },
      hin: { title: "शीर्षक",      subtitle: "उपशीर्षक",      message: "अपना संदेश लिखें..."          },
      tam: { title: "தலைப்பு",    subtitle: "துணைத் தலைப்பு", message: "உங்கள் செய்தியை எழுதுங்கள்..." },
      kan: { title: "ಶೀರ್ಷಿಕೆ",   subtitle: "ಉಪಶೀರ್ಷಿಕೆ",   message: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಬರೆಯಿರಿ..."  },
      mal: { title: "ശീർഷകം",    subtitle: "ഉപശീർഷകം",    message: "താങ്കളുടെ സന്ദേശം അടിക്കൊള്ളുക..." },
      ori: { title: "ଶୀର୍ଷକ",     subtitle: "ଉପଶୀର୍ଷକ",     message: "ଆପଣଙ୍କ ସନ୍ଦେଶ ଲେଖନ୍ତୁ..."     },
      san: { title: "शीर्षकम्",    subtitle: "उपशीर्षकम्",    message: "सन्देशं लिखतु..."             },
    };
    return map[lang] ?? map.eng;
  }

  const ph = getPlaceholders(state.language);

  const PreviewPanel = (
    <div>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#555", fontFamily: "Montserrat,sans-serif" }}>🎨 BG</span>
        <select value={state.posterBgColor} onChange={(e) => set("posterBgColor", e.target.value)} style={inputStyle}>
          <option value="#FFFFFF">White</option>
          <option value="#F5F5F5">Light Gray</option>
          <option value="#DCEFFB">Pale Blue</option>
          <option value="#F6E7D7">Warm Beige</option>
          <option value="#E0F7F1">Light Mint</option>
          <option value="#FFF9C4">Soft Yellow</option>
          <option value="#FCE4EC">Blush Pink</option>
        </select>
      </div>
      <div ref={previewRef} style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 14, overflow: "hidden" }}>
        <PosterPreview state={state} />
      </div>
      <p style={{ marginTop: 8, fontSize: 11, color: "#aaa", textAlign: "center", fontFamily: "Montserrat,sans-serif" }}>
        Live preview — updates as you type
      </p>
    </div>
  );

  return (
    <>
      {/* ✅ FIX: Navbar is the ONLY sticky header — no competing inner header */}
      <Navbar />

      <Head><title>AksharaChitra — Multilingual Poster Maker</title></Head>

      <style>{`
        @media (max-width: 767px) {
          .poster-grid { display: flex !important; flex-direction: column !important; }
          .poster-left-panel { order: 1; }
          .poster-preview-panel { order: 2; position: static !important; margin-top: 20px; }
        }
        @media (min-width: 768px) {
          .poster-grid {
            display: grid !important;
            grid-template-columns: minmax(300px, 400px) 1fr !important;
            gap: 24px !important;
            align-items: start !important;
          }
          .poster-preview-panel { position: sticky !important; top: 24px; }
        }
      `}</style>

    <div
  style={{
    fontFamily: "Montserrat, sans-serif",
    minHeight: "100vh",
    background: "#f5f7fa",
    marginTop: 70
  }}
  suppressHydrationWarning
>
        {/* ───────────────────────────────────────────────────────
            TAB BAR — standalone row, fully visible on all screens
            NOT sticky so it never fights with Navbar
        ─────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1.5px solid #eee",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {/* Left: branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#4A90E2", fontFamily: "Montserrat, sans-serif" }}>
              🌸 AksharaChitra
            </span>
            <span style={{ color: "#bbb", fontSize: 12, fontFamily: "Montserrat, sans-serif" }}>
              Multilingual Poster Maker
            </span>
          </div>

          {/* Right: Create / My Creations tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              background: "#f0f4f8",
              borderRadius: 10,
              padding: 3,
              border: "1.5px solid #e0e0e0",
            }}
          >
            {(["create", "gallery"] as Tab[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabSwitch(tab)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: isActive ? "#4A90E2" : "transparent",
                    color: isActive ? "#fff" : "#666",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 13,
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap" as const,
                    boxShadow: isActive ? "0 2px 8px rgba(74,144,226,0.3)" : "none",
                  }}
                >
                  {tab === "create" ? "🎨 Create" : "💾 My Creations"}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main content ── */}
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 12px" }}>
          {activeTab === "gallery" ? (
            <Gallery />
          ) : (
            <div className="poster-grid">
              <div className="poster-left-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                <StepCard title="1 — Basic Settings">
                  <FieldRow label="🌐 Language">
                    <select
                      value={state.language}
                      onChange={(e) => handleLanguageChange(e.target.value as Language)}
                      style={inputStyle}
                    >
                      <option value="eng">English</option>
                      <option value="tel">తెలుగు</option>
                      <option value="san">संस्कृतम्</option>
                      <option value="hin">हिंदी</option>
                      <option value="tam">தமிழ்</option>
                      <option value="kan">ಕನ್ನಡ</option>
                      <option value="mal">മലയാളം</option>
                      <option value="ori">ଓଡ଼ିଆ</option>
                    </select>
                  </FieldRow>
                  <FieldRow label="🧩 Template">
                    <select onChange={(e) => applyTemplate(e.target.value)} style={inputStyle} defaultValue="">
                      <option value="">— Choose Template —</option>
                      <option value="newYearWishes">🎆 New Year Wishes</option>
                    </select>
                  </FieldRow>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#555", fontFamily: "Montserrat,sans-serif" }}>
                      🔤 Font
                    </span>
                    <FontPicker
                      language={state.language}
                      selectedFont={state.posterFont ?? ""}
                      onSelect={(font) => {
                        set("posterFont", font);
                        addToast(`🔤 Font: ${font.replace(/['"]/g, "").split(",")[0].trim()}`, "#4A90E2");
                      }}
                    />
                    {state.posterFont && (
                      <div style={{ marginTop: 4, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fafafa", fontFamily: state.posterFont, fontSize: 15, color: "#333" }}>
                        {state.title || "Preview text — AksharaTantra"}
                      </div>
                    )}
                  </div>
                </StepCard>

                <StepCard title="2 — Title">
                  <FieldRow label="🔖 Small Logo">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "logo"); }}
                      style={{ fontSize: 12 }}
                    />
                  </FieldRow>
                  <input
                    placeholder={ph.title}
                    value={state.title}
                    onChange={(e) => set("title", e.target.value)}
                    style={{ ...inputStyle, fontWeight: 700, marginTop: 4, fontFamily: state.posterFont || "Montserrat, sans-serif" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <label style={labelStyle}>Size<input type="number" value={state.titleSize} onChange={(e) => set("titleSize", Number(e.target.value))} style={{ ...inputStyle, width: 60 }} /></label>
                    <label style={labelStyle}>Align<select value={state.titleAlign} onChange={(e) => set("titleAlign", e.target.value as PosterState["titleAlign"])} style={inputStyle}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>
                    <label style={labelStyle}>Color<input type="color" value={state.titleColor} onChange={(e) => set("titleColor", e.target.value)} style={{ width: 36, height: 28, cursor: "pointer", border: "none" }} /></label>
                    <label style={labelStyle}>BG<input type="color" value={state.titleBg} onChange={(e) => set("titleBg", e.target.value)} style={{ width: 36, height: 28, cursor: "pointer", border: "none" }} /></label>
                  </div>
                </StepCard>

                <StepCard title="3 — Subtitle">
                  <input
                    placeholder={ph.subtitle}
                    value={state.subtitle}
                    onChange={(e) => set("subtitle", e.target.value)}
                    style={{ ...inputStyle, fontFamily: state.posterFont || "Montserrat, sans-serif" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <label style={labelStyle}>Size<input type="number" value={state.subtitleSize} onChange={(e) => set("subtitleSize", Number(e.target.value))} style={{ ...inputStyle, width: 60 }} /></label>
                    <label style={labelStyle}>Align<select value={state.subtitleAlign} onChange={(e) => set("subtitleAlign", e.target.value as PosterState["subtitleAlign"])} style={inputStyle}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>
                    <label style={labelStyle}>Color<input type="color" value={state.subtitleColor} onChange={(e) => set("subtitleColor", e.target.value)} style={{ width: 36, height: 28, cursor: "pointer", border: "none" }} /></label>
                    <label style={labelStyle}>BG<input type="color" value={state.subtitleBg} onChange={(e) => set("subtitleBg", e.target.value)} style={{ width: 36, height: 28, cursor: "pointer", border: "none" }} /></label>
                  </div>
                </StepCard>

                <StepCard title="4 — Message">
                  <textarea
                    placeholder={ph.message}
                    value={state.message}
                    rows={3}
                    onChange={(e) => set("message", e.target.value)}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: state.posterFont || "Montserrat, sans-serif" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <label style={labelStyle}>Size<input type="number" value={state.messageSize} onChange={(e) => set("messageSize", Number(e.target.value))} style={{ ...inputStyle, width: 60 }} /></label>
                    <label style={labelStyle}>Align<select value={state.contentAlign} onChange={(e) => set("contentAlign", e.target.value as PosterState["contentAlign"])} style={inputStyle}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option><option value="justify">Justify</option></select></label>
                    <label style={labelStyle}>Color<input type="color" value={state.messageColor} onChange={(e) => set("messageColor", e.target.value)} style={{ width: 36, height: 28, cursor: "pointer", border: "none" }} /></label>
                    <label style={labelStyle}>BG<input type="color" value={state.messageBg} onChange={(e) => set("messageBg", e.target.value)} style={{ width: 36, height: 28, cursor: "pointer", border: "none" }} /></label>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={startListening}
                      disabled={!voiceSupported || isListening}
                      style={{ ...ghostBtnStyle, background: isListening ? "#E53935" : "#fff", color: isListening ? "#fff" : "#333" }}
                    >
                      {isListening ? "🔴 Listening…" : "🎤 Speak"}
                    </button>
                    <button onClick={stopListening} disabled={!isListening} style={ghostBtnStyle}>⏹ Stop</button>
                    <button onClick={() => speak(state.message, state.language)} disabled={!state.message} style={primaryBtnStyle}>🔊 Read</button>
                  </div>
                </StepCard>

                <StepCard title="5 — Main Image">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "main"); }}
                    style={{ fontSize: 12 }}
                  />
                  <label style={{ ...labelStyle, marginTop: 8 }}>
                    Position
                    <select value={state.imagePosition} onChange={(e) => set("imagePosition", e.target.value as PosterState["imagePosition"])} style={inputStyle}>
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </StepCard>

                <StepCard title="6 — QR Code">
                  <input
                    placeholder="Enter URL or text"
                    value={state.qrText}
                    onChange={(e) => set("qrText", e.target.value)}
                    style={inputStyle}
                  />
                  <label style={{ ...labelStyle, marginTop: 8 }}>
                    Align
                    <select value={state.qrAlign} onChange={(e) => set("qrAlign", e.target.value as PosterState["qrAlign"])} style={inputStyle}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </StepCard>

                <StepCard title="7 — Generate & Export">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button onClick={handleClear} style={ghostBtnStyle}>🧹 Clear</button>
                    <button onClick={handleSave} disabled={isGenerating} style={ghostBtnStyle}>💾 Save</button>
                    <button onClick={handleGenerate} disabled={isGenerating} style={{ ...primaryBtnStyle, flex: 1 }}>
                      {isGenerating ? "⏳ Generating…" : "⚡ Generate"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={handleDownload} disabled={isGenerating} style={{ ...ghostBtnStyle, flex: 1 }}>⬇ Download</button>
                    <button onClick={handleShare} disabled={isGenerating} style={{ ...ghostBtnStyle, flex: 1 }}>📤 Share</button>
                  </div>
                </StepCard>

              </div>

              <div className="poster-preview-panel">{PreviewPanel}</div>
            </div>
          )}
        </main>
      </div>

      <CropModal
        isOpen={cropModal.open}
        imageUrl={cropModal.imageUrl}
        target={cropModal.target}
        onApply={handleCropApply}
        onCancel={() => setCropModal({ open: false, imageUrl: "", target: "main" })}
      />
      <ToastContainer toasts={toasts} />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#4A90E2", fontFamily: "Montserrat,sans-serif" }}>{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={labelStyle}>{label}{children}</label>;
}

// ── Shared style constants ────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e0e0e0",
  fontFamily: "Montserrat, sans-serif", fontSize: 13, width: "100%",
  boxSizing: "border-box", background: "#fafafa",
};
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
  fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "#555", fontWeight: 600,
};
const ghostBtnStyle: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8, border: "1.5px solid #ccc",
  background: "#fff", cursor: "pointer", fontFamily: "Montserrat, sans-serif",
  fontSize: 13, fontWeight: 600,
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 8, border: "none",
  background: "#4A90E2", color: "#fff", fontWeight: 700,
  cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 13,
};
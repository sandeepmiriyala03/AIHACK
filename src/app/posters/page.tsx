"use client";
export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import Head from "next/head";
import Script from "next/script";
import { useCallback, useReducer, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

const CropModal    = dynamicImport(() => import("@/components/CropModal").then(m => m.CropModal), { ssr: false });
const PosterPreview = dynamicImport(() => import("@/components/PosterPreview").then(m => m.PosterPreview), {
  ssr: false,
  loading: () => (
    <div style={{ width:"100%", aspectRatio:"1/1", background:"linear-gradient(135deg,#f0f4f8,#e8edf2)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", color:"#aaa", fontSize:13, fontFamily:"Montserrat,sans-serif" }}>
      Loading preview…
    </div>
  ),
});
const Gallery = dynamicImport(() => import("@/components/sliders/Gallery").then(m => m.Gallery), { ssr: false });

import { ToastContainer, useToastManager } from "@/components/sliders/Toast";
import { FontPicker } from "@/components/FontPicker";
import { useAutosave } from "@/hooks/useAutosave";
import { usePosterGenerator } from "@/hooks/usePosterGenerator";
import { useVoice, speak } from "@/hooks/useVoice";
import { savePosterToDB } from "@/lib/db";
import { getOptimalImageSize, resizeImageBeforeCrop, validateImageFile, sharePosterDataUrl } from "@/lib/imageUtils";
import { DEFAULT_POSTER_STATE, TEMPLATE_PACK, type PosterState, type Language } from "@/types/index";
import { POSTER_FORMATS, type FormatKey } from "@/components/PosterPreview";

// ── Reducer ───────────────────────────────────────────────────────────────────
type Action = { type:"SET"; key:string; value:unknown } | { type:"BULK"; patch:Partial<PosterState> } | { type:"RESET" };
function reducer(s: PosterState, a: Action): PosterState {
  switch (a.type) {
    case "SET":   return { ...s, [a.key]: a.value };
    case "BULK":  return { ...s, ...a.patch };
    case "RESET": return { ...DEFAULT_POSTER_STATE };
    default:      return s;
  }
}
type Tab = "create" | "gallery";
const fireRefresh = () => { if (typeof window !== "undefined") window.dispatchEvent(new Event("gallery-refresh")); };

// ── Font size limits ──────────────────────────────────────────────────────────
const TITLE_MIN=10, TITLE_MAX=72, SUB_MIN=8, SUB_MAX=56, MSG_MIN=6, MSG_MAX=44;

export default function AksharaChitraPage() {
  const [state, dispatch] = useReducer(reducer, DEFAULT_POSTER_STATE);
  const [activeTab, setActiveTab]   = useState<Tab>("create");
  const [cropModal, setCropModal]   = useState<{ open:boolean; imageUrl:string; target:"main"|"logo" }>({ open:false, imageUrl:"", target:"main" });
  const [qrReady, setQrReady]       = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toasts, addToast } = useToastManager();

  const posterFormat = ((state as any).posterFormat as FormatKey) ?? "instagram-square";
  const fmt = POSTER_FORMATS[posterFormat] ?? POSTER_FORMATS["instagram-square"];

  const { clearAutosave } = useAutosave(
    { title: state.title, subtitle: state.subtitle, message: state.message },
    (fields) => dispatch({ type:"BULK", patch: fields })
  );

  const { generatePoster, isGenerating } = usePosterGenerator({ previewRef, title: state.title, format: posterFormat });

  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoice({
    language: state.language,
    onTranscript: (text) => dispatch({ type:"SET", key:"message", value: state.message ? state.message + " " + text : text }),
  });

  const set = useCallback((key: string, value: unknown) => dispatch({ type:"SET", key, value }), []);

  const applyTemplate = useCallback((k: string) => {
    const tpl = TEMPLATE_PACK[state.language]?.[k];
    if (tpl) dispatch({ type:"BULK", patch: { title:tpl.title, subtitle:tpl.subtitle, message:tpl.message } });
  }, [state.language]);

  const handleImageUpload = useCallback(async (file: File, target: "main"|"logo") => {
    const err = validateImageFile(file, target === "logo" ? 10 : 20);
    if (err) { addToast(`⚠️ ${err}`, "#E53935"); return; }
    addToast("📸 Resizing…", "#1E88E5");
    try {
      const maxDim = target === "logo" ? 500 : Math.min(getOptimalImageSize(), fmt.w);
      const dataUrl = await resizeImageBeforeCrop(file, maxDim);
      setCropModal({ open:true, imageUrl:dataUrl, target });
    } catch { addToast("❌ Failed to process image", "#E53935"); }
  }, [addToast, fmt.w]);

  const handleCropApply = useCallback((dataUrl: string, target: "main"|"logo") => {
    set(target === "logo" ? "uploadedLogoData" : "uploadedMainData", dataUrl);
    setCropModal({ open:false, imageUrl:"", target:"main" });
    addToast("✅ Image cropped!", "#43A047");
  }, [set, addToast]);

  const handleGenerate = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster();
    addToast(url ? "✅ Poster ready!" : "⚠️ Generation failed", url ? "#43A047" : "#E53935");
  };
  const handleDownload = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster({ download:true });
    addToast(url ? `✅ Downloaded! (${fmt.w}×${fmt.h})` : "❌ Download failed", url ? "#43A047" : "#E53935");
  };
  const handleShare = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster();
    if (!url) { addToast("❌ Could not generate", "#E53935"); return; }
    const r = await sharePosterDataUrl(url, state.title);
    addToast(r==="shared" ? "✅ Shared!" : r==="downloaded" ? "📩 Downloaded — share manually!" : "❌ Share failed",
             r==="shared" ? "#43A047" : r==="downloaded" ? "#1E88E5" : "#E53935");
  };
  const handleSave = async () => {
    if (!state.title.trim()) { addToast("⚠️ Enter a title first!", "#E53935"); return; }
    const url = await generatePoster();
    if (!url) { addToast("❌ Could not generate", "#E53935"); return; }
    await savePosterToDB({ title: state.title, dataUrl: url, ts: Date.now() });
    addToast("✅ Saved!", "#43A047");
    fireRefresh();
  };
  const handleClear = () => {
    if (!confirm("Clear all fields?")) return;
    dispatch({ type:"RESET" });
    clearAutosave();
    addToast("✅ Reset!", "#4CAF50");
  };
  const handleTabSwitch = (tab: Tab) => { setActiveTab(tab); if (tab==="gallery") fireRefresh(); };
  const handleLanguageChange = (lang: Language) => { set("language", lang); set("posterFont",""); set("titleFont",""); set("subtitleFont",""); set("messageFont",""); };

  function ph(lang: Language) {
    const m: Record<Language,{title:string;subtitle:string;message:string}> = {
      eng:{title:"Title",subtitle:"Subtitle",message:"Type your message..."},
      tel:{title:"శీర్షిక",subtitle:"ఉపశీర్షిక",message:"సందేశం రాయండి..."},
      hin:{title:"शीर्षक",subtitle:"उपशीर्षक",message:"अपना संदेश लिखें..."},
      tam:{title:"தலைப்பு",subtitle:"துணைத் தலைப்பு",message:"உங்கள் செய்தியை எழுதுங்கள்..."},
      kan:{title:"ಶೀರ್ಷಿಕೆ",subtitle:"ಉಪಶೀರ್ಷಿಕೆ",message:"ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಬರೆಯಿರಿ..."},
      mal:{title:"ശീർഷകം",subtitle:"ഉപശീർഷകം",message:"സന്ദേശം ടൈപ്പ് ചെയ്യൂ..."},
      ori:{title:"ଶୀର୍ଷକ",subtitle:"ଉପଶୀର୍ଷକ",message:"ଆପଣଙ୍କ ସନ୍ଦେଶ ଲେଖନ୍ତୁ..."},
      san:{title:"शीर्षकम्",subtitle:"उपशीर्षकम्",message:"सन्देशं लिखतु..."},
    };
    return m[lang] ?? m.eng;
  }
  const P = ph(state.language);

  // ── Section font helpers (typed for clarity) ──────────────────────────────
  const titleFont    = ((state as any).titleFont    as string) ?? "";
  const subtitleFont = ((state as any).subtitleFont as string) ?? "";
  const messageFont  = ((state as any).messageFont  as string) ?? "";

  // ── Preview panel ─────────────────────────────────────────────────────────
  const PreviewPanel = (
    <div>
      <div style={{ marginBottom:10, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, background:"#EBF4FF", border:"1.5px solid #4A90E2", borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:700, color:"#4A90E2", fontFamily:"Montserrat,sans-serif" }}>
          <span>{POSTER_FORMATS[posterFormat]?.icon}</span>
          <span>{POSTER_FORMATS[posterFormat]?.label}</span>
          <span style={{ color:"#888", fontWeight:400 }}>{fmt.w}×{fmt.h}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginLeft:"auto" }}>
          <span style={{ fontSize:11, fontWeight:600, color:"#555", fontFamily:"Montserrat,sans-serif" }}>🎨 BG</span>
          <select value={(state as any).posterBgColor||"#FFFFFF"} onChange={e=>set("posterBgColor",e.target.value)} style={{ ...IS, width:"auto", fontSize:11 }}>
            <option value="#FFFFFF">White</option>
            <option value="#F5F5F5">Light Gray</option>
            <option value="#DCEFFB">Pale Blue</option>
            <option value="#F6E7D7">Warm Beige</option>
            <option value="#E0F7F1">Light Mint</option>
            <option value="#FFF9C4">Soft Yellow</option>
            <option value="#FCE4EC">Blush Pink</option>
            <option value="#1A1A2E">Dark Navy</option>
            <option value="#2C3E50">Charcoal</option>
          </select>
          <input type="color" value={(state as any).posterBgColor||"#FFFFFF"} onChange={e=>set("posterBgColor",e.target.value)} style={{ width:30, height:26, border:"1.5px solid #ddd", borderRadius:5, cursor:"pointer", padding:2 }} />
        </div>
      </div>
      <div ref={previewRef} style={{ boxShadow:"0 6px 28px rgba(0,0,0,.13)", borderRadius:14, overflow:"hidden" }}>
        <PosterPreview state={state} />
      </div>
      <p style={{ marginTop:7, fontSize:11, color:"#bbb", textAlign:"center", fontFamily:"Montserrat,sans-serif" }}>
        Live preview · export at {fmt.w}×{fmt.h}px
      </p>
    </div>
  );

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" strategy="lazyOnload" onLoad={() => setQrReady(true)} />
      <Navbar />
      <Head><title>AksharaChitra — Multilingual Poster Maker</title></Head>

      <style>{`
        @media (max-width: 767px) {
          .pg { display: flex !important; flex-direction: column !important; }
          .pl { order: 1; }
          .pr { order: 2; position: static !important; margin-top: 20px; }
        }
        @media (min-width: 768px) {
          .pg { display: grid !important; grid-template-columns: minmax(300px,390px) 1fr !important; gap: 24px !important; align-items: start !important; }
          .pr { position: sticky !important; top: 24px; }
        }
        input[type=range]{ -webkit-appearance:none; height:4px; background:#e0e0e0; border-radius:2px; outline:none; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:#4A90E2; cursor:pointer; box-shadow:0 1px 4px rgba(74,144,226,.4); }
      `}</style>

      <div style={{ fontFamily:"Montserrat,sans-serif", minHeight:"100vh", background:"#f5f7fa", marginTop:70 }} suppressHydrationWarning>
        {/* tab bar */}
        <div style={{ background:"#fff", borderBottom:"1.5px solid #eee", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:18, fontWeight:800, color:"#4A90E2", fontFamily:"Montserrat,sans-serif" }}>🌸 AksharaChitra</span>
            <span style={{ color:"#bbb", fontSize:12 }}>Multilingual Poster Maker</span>
          </div>
          <div style={{ display:"flex", gap:0, background:"#f0f4f8", borderRadius:10, padding:3, border:"1.5px solid #e0e0e0" }}>
            {(["create","gallery"] as Tab[]).map(tab => {
              const on = activeTab===tab;
              return <button key={tab} onClick={()=>handleTabSwitch(tab)} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:on?"#4A90E2":"transparent", color:on?"#fff":"#666", fontWeight:700, cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontSize:13, transition:"all .15s", whiteSpace:"nowrap", boxShadow:on?"0 2px 8px rgba(74,144,226,.3)":"none" }}>
                {tab==="create"?"🎨 Create":"💾 My Creations"}
              </button>;
            })}
          </div>
        </div>

        <main style={{ maxWidth:1200, margin:"0 auto", padding:"20px 12px" }}>
          {activeTab==="gallery" ? <Gallery /> : (
            <div className="pg">
              <div className="pl" style={{ display:"flex", flexDirection:"column", gap:14 }}>

                {/* ── STEP 1: Format & Settings ── */}
                <Card title="1 — Format & Settings">
                  <span style={SL}>📐 Poster Format</span>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                    {(Object.entries(POSTER_FORMATS) as [FormatKey, typeof POSTER_FORMATS[FormatKey]][]).map(([key, f]) => {
                      const on = posterFormat===key;
                      const ratio = f.w/f.h;
                      const bw = ratio>=1 ? 22 : Math.round(22*ratio);
                      const bh = ratio>=1 ? Math.round(22/ratio) : 22;
                      return (
                        <button key={key} onClick={()=>set("posterFormat",key)} title={`${f.label} — ${f.w}×${f.h}`}
                          style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:"8px 4px", borderRadius:9, border:`2px solid ${on?"#4A90E2":"#e0e0e0"}`, background:on?"#EBF4FF":"#fafafa", cursor:"pointer", transition:"all .12s", minHeight:64 }}>
                          <div style={{ width:bw, height:bh, border:`2px solid ${on?"#4A90E2":"#bbb"}`, borderRadius:2, background:on?"rgba(74,144,226,.12)":"transparent" }} />
                          <span style={{ fontSize:9, fontWeight:600, color:on?"#4A90E2":"#777", textAlign:"center", lineHeight:1.2 }}>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Row label="🌐 Language">
                    <select value={state.language} onChange={e=>handleLanguageChange(e.target.value as Language)} style={IS}>
                      <option value="eng">English</option>
                      <option value="tel">తెలుగు</option>
                      <option value="san">संस्कृतम्</option>
                      <option value="hin">हिंदी</option>
                      <option value="tam">தமிழ்</option>
                      <option value="kan">ಕನ್ನಡ</option>
                      <option value="mal">മലയാളം</option>
                      <option value="ori">ଓଡ଼ିଆ</option>
                    </select>
                  </Row>
                  <Row label="🧩 Template">
                    <select onChange={e=>applyTemplate(e.target.value)} style={IS} defaultValue="">
                      <option value="">— Choose Template —</option>
                      <option value="newYearWishes">🎆 New Year Wishes</option>
                    </select>
                  </Row>
                  {/* Global / default font */}
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <span style={SL}>🔤 Default Font (all sections)</span>
                    <FontPicker language={state.language} selectedFont={state.posterFont??""} placeholder="Default font for all sections…"
                      onSelect={f=>{ set("posterFont",f); addToast(`🔤 Default: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                    {state.posterFont && (
                      <div style={{ padding:"8px 12px", borderRadius:8, border:"1.5px solid #e0e0e0", background:"#fafafa", fontFamily:state.posterFont, fontSize:15, color:"#333" }}>
                        {state.title || "Preview — AksharaTantra"}
                      </div>
                    )}
                  </div>
                </Card>

                {/* ── STEP 2: Title ── */}
                <Card title="2 — Title">
                  <Row label="🔖 Small Logo">
                    <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleImageUpload(f,"logo"); }} style={{ fontSize:12 }} />
                  </Row>
                  <input placeholder={P.title} value={state.title} onChange={e=>set("title",e.target.value)}
                    style={{ ...IS, fontWeight:700, fontFamily:titleFont||state.posterFont||"Montserrat,sans-serif" }} />
                  {/* ── Title font picker ── */}
                  <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                    <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>🔤 Title Font</span>
                    <FontPicker language={state.language} selectedFont={titleFont} placeholder="Same as default font…"
                      onSelect={f=>{ set("titleFont",f); addToast(`🔤 Title: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Slider label="Size" value={state.titleSize} min={TITLE_MIN} max={TITLE_MAX} onChange={v=>set("titleSize",v)} />
                    <label style={LS}>Align<select value={state.titleAlign} onChange={e=>set("titleAlign",e.target.value as PosterState["titleAlign"])} style={IS}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>
                    <label style={LS}>Color<input type="color" value={state.titleColor} onChange={e=>set("titleColor",e.target.value)} style={CI} /></label>
                    <label style={LS}>BG<input type="color" value={state.titleBg} onChange={e=>set("titleBg",e.target.value)} style={CI} /></label>
                  </div>
                </Card>

                {/* ── STEP 3: Subtitle ── */}
                <Card title="3 — Subtitle">
                  <input placeholder={P.subtitle} value={state.subtitle} onChange={e=>set("subtitle",e.target.value)}
                    style={{ ...IS, fontFamily:subtitleFont||state.posterFont||"Montserrat,sans-serif" }} />
                  {/* ── Subtitle font picker ── */}
                  <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                    <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>🔤 Subtitle Font</span>
                    <FontPicker language={state.language} selectedFont={subtitleFont} placeholder="Same as default font…"
                      onSelect={f=>{ set("subtitleFont",f); addToast(`🔤 Subtitle: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Slider label="Size" value={state.subtitleSize} min={SUB_MIN} max={SUB_MAX} onChange={v=>set("subtitleSize",v)} />
                    <label style={LS}>Align<select value={state.subtitleAlign} onChange={e=>set("subtitleAlign",e.target.value as PosterState["subtitleAlign"])} style={IS}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>
                    <label style={LS}>Color<input type="color" value={state.subtitleColor} onChange={e=>set("subtitleColor",e.target.value)} style={CI} /></label>
                    <label style={LS}>BG<input type="color" value={state.subtitleBg} onChange={e=>set("subtitleBg",e.target.value)} style={CI} /></label>
                  </div>
                </Card>

                {/* ── STEP 4: Message ── */}
                <Card title="4 — Message">
                  <textarea placeholder={P.message} value={state.message} rows={3} onChange={e=>set("message",e.target.value)}
                    style={{ ...IS, resize:"vertical", fontFamily:messageFont||state.posterFont||"Montserrat,sans-serif" }} />
                  {/* ── Message font picker ── */}
                  <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                    <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>🔤 Message Font</span>
                    <FontPicker language={state.language} selectedFont={messageFont} placeholder="Same as default font…"
                      onSelect={f=>{ set("messageFont",f); addToast(`🔤 Message: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Slider label="Size" value={state.messageSize} min={MSG_MIN} max={MSG_MAX} onChange={v=>set("messageSize",v)} />
                    <label style={LS}>Align<select value={state.contentAlign} onChange={e=>set("contentAlign",e.target.value as PosterState["contentAlign"])} style={IS}><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option><option value="justify">Justify</option></select></label>
                    <label style={LS}>Color<input type="color" value={state.messageColor} onChange={e=>set("messageColor",e.target.value)} style={CI} /></label>
                    <label style={LS}>BG<input type="color" value={state.messageBg} onChange={e=>set("messageBg",e.target.value)} style={CI} /></label>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button onClick={startListening} disabled={!voiceSupported||isListening} style={{ ...GB, background:isListening?"#E53935":"#fff", color:isListening?"#fff":"#333" }}>{isListening?"🔴 Listening…":"🎤 Speak"}</button>
                    <button onClick={stopListening} disabled={!isListening} style={GB}>⏹ Stop</button>
                    <button onClick={()=>speak(state.message,state.language)} disabled={!state.message} style={PB}>🔊 Read</button>
                  </div>
                </Card>

                {/* ── STEP 5: Main Image ── */}
                <Card title="5 — Main Image">
                  <p style={{ margin:0, fontSize:11, color:"#888" }}>Auto-resized to fit {fmt.w}×{fmt.h} before crop</p>
                  <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleImageUpload(f,"main"); }} style={{ fontSize:12 }} />
                  {(state as any).uploadedMainData && (
                    <button onClick={()=>set("uploadedMainData","")} style={{ ...GB, fontSize:11, padding:"4px 10px", alignSelf:"flex-start" }}>✕ Remove</button>
                  )}
                  <label style={{ ...LS, marginTop:4 }}>
                    Position
                    <select value={state.imagePosition} onChange={e=>set("imagePosition",e.target.value as PosterState["imagePosition"])} style={IS}>
                      <option value="center">Center</option><option value="left">Left</option><option value="right">Right</option>
                    </select>
                  </label>
                </Card>

                {/* ── STEP 6: QR ── */}
                <Card title="6 — QR Code">
                  {!qrReady && <p style={{ margin:0, fontSize:11, color:"#F59E0B" }}>⏳ Loading QR library…</p>}
                  <input placeholder="Enter URL or text for QR" value={state.qrText} onChange={e=>set("qrText",e.target.value)} style={IS} />
                  <label style={{ ...LS, marginTop:6 }}>
                    QR Alignment
                    <div style={{ display:"flex", gap:6 }}>
                      {(["left","center","right"] as const).map(a => (
                        <button key={a} onClick={()=>set("qrAlign",a)} style={{ flex:1, padding:"6px 0", borderRadius:7, border:`2px solid ${state.qrAlign===a?"#4A90E2":"#e0e0e0"}`, background:state.qrAlign===a?"#EBF4FF":"#fafafa", color:state.qrAlign===a?"#4A90E2":"#666", fontWeight:700, cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontSize:12 }}>
                          {a==="left"?"◀ Left":a==="center"?"▮ Center":"Right ▶"}
                        </button>
                      ))}
                    </div>
                  </label>
                </Card>

                {/* ── STEP 7: Generate ── */}
                <Card title="7 — Generate & Export">
                  <div style={{ display:"flex", alignItems:"center", gap:6, background:"#F0F7FF", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#4A90E2", fontWeight:600 }}>
                    <span>{POSTER_FORMATS[posterFormat]?.icon}</span>
                    <span>{POSTER_FORMATS[posterFormat]?.label}</span>
                    <span style={{ color:"#888", fontWeight:400 }}>· {fmt.w}×{fmt.h}px</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    <button onClick={handleClear} style={GB}>🧹 Clear</button>
                    <button onClick={handleSave} disabled={isGenerating} style={GB}>💾 Save</button>
                    <button onClick={handleGenerate} disabled={isGenerating} style={{ ...PB, flex:1 }}>
                      {isGenerating?"⏳ Generating…":"⚡ Generate"}
                    </button>
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:4 }}>
                    <button onClick={handleDownload} disabled={isGenerating} style={{ ...GB, flex:1 }}>⬇ Download</button>
                    <button onClick={handleShare} disabled={isGenerating} style={{ ...GB, flex:1 }}>📤 Share</button>
                  </div>
                </Card>

              </div>
              <div className="pr">{PreviewPanel}</div>
            </div>
          )}
        </main>
      </div>

      <CropModal isOpen={cropModal.open} imageUrl={cropModal.imageUrl} target={cropModal.target}
        onApply={handleCropApply} onCancel={()=>setCropModal({ open:false, imageUrl:"", target:"main" })} />
      <ToastContainer toasts={toasts} />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Card({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"14px 16px", boxShadow:"0 2px 10px rgba(0,0,0,.06)", display:"flex", flexDirection:"column", gap:8 }}>
      <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:"#4A90E2", fontFamily:"Montserrat,sans-serif" }}>{title}</h3>
      {children}
    </div>
  );
}
function Row({ label, children }: { label:string; children:React.ReactNode }) {
  return <label style={LS}>{label}{children}</label>;
}
function Slider({ label, value, min, max, onChange }: { label:string; value:number; min:number; max:number; onChange:(v:number)=>void }) {
  return (
    <label style={{ ...LS, flex:"1 1 100px" }}>
      <span style={{ display:"flex", justifyContent:"space-between" }}>
        {label}
        <span style={{ background:"#EBF4FF", color:"#4A90E2", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700 }}>{value}px</span>
      </span>
      <input type="range" min={min} max={max} step={1} value={value} onChange={e=>onChange(Number(e.target.value))} style={{ width:"100%", marginTop:2 }} />
    </label>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const IS: React.CSSProperties = { padding:"7px 10px", borderRadius:7, border:"1.5px solid #e0e0e0", fontFamily:"Montserrat,sans-serif", fontSize:13, width:"100%", boxSizing:"border-box", background:"#fafafa" };
const LS: React.CSSProperties = { display:"flex", flexDirection:"column", gap:4, fontFamily:"Montserrat,sans-serif", fontSize:12, color:"#555", fontWeight:600 };
const SL: React.CSSProperties = { fontSize:12, fontWeight:600, color:"#555", fontFamily:"Montserrat,sans-serif" };
const CI: React.CSSProperties = { width:36, height:28, cursor:"pointer", border:"1.5px solid #ddd", borderRadius:5, padding:2 };
const GB: React.CSSProperties = { padding:"8px 14px", borderRadius:8, border:"1.5px solid #ddd", background:"#fff", cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontSize:13, fontWeight:600, transition:"all .12s" };
const PB: React.CSSProperties = { padding:"8px 16px", borderRadius:8, border:"none", background:"#4A90E2", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontSize:13, transition:"all .12s" };
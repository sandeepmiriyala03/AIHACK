"use client";
export const dynamic = 'force-dynamic';

import dynamicImport from "next/dynamic";
import Script from "next/script";
import { useCallback, useReducer, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

const CropModal    = dynamicImport(() => import("@/components/CropModal").then(m => m.CropModal), { ssr: false });
const PosterPreview = dynamicImport(() => import("@/components/PosterPreview").then(m => m.PosterPreview), {
  ssr: false,
  loading: () => (
    <div className="is-4031bc8">
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

  const { generatePoster, isGenerating } = usePosterGenerator({
    previewRef: previewRef as React.RefObject<HTMLDivElement>,
    title: state.title,
    format: posterFormat
  });

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

  const titleFont    = ((state as any).titleFont    as string) ?? "";
  const subtitleFont = ((state as any).subtitleFont as string) ?? "";
  const messageFont  = ((state as any).messageFont  as string) ?? "";

  const PreviewPanel = (
    <div>
      <div className="is-bf08d32">
        <div className="is-4fdbd44">
          <span>{POSTER_FORMATS[posterFormat]?.icon}</span>
          <span>{POSTER_FORMATS[posterFormat]?.label}</span>
          <span className="is-b57d185">{fmt.w}×{fmt.h}</span>
        </div>
        <div className="is-3849d91">
          <span className="is-b674ceb">🎨 BG</span>
          <select value={(state as any).posterBgColor||"#FFFFFF"} onChange={e=>set("posterBgColor",e.target.value)} className="is-154ca71">
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
          <input type="color" value={(state as any).posterBgColor||"#FFFFFF"} onChange={e=>set("posterBgColor",e.target.value)} className="is-0533b05" />
        </div>
      </div>
      <div ref={previewRef} className="is-dd7bb48">
        <PosterPreview state={state} />
      </div>
      <p className="is-f256a26">
        Live preview · export at {fmt.w}×{fmt.h}px
      </p>
    </div>
  );

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" strategy="lazyOnload" onLoad={() => setQrReady(true)} />
      <Navbar />

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

      <div className="is-65b8d88" suppressHydrationWarning>
        <div className="is-f68280e">
          <div className="is-bd9db1c">
            <span className="is-b03628f">🌸 AksharaChitra</span>
            <span className="is-ebb5edb">Multilingual Poster Maker</span>
          </div>
          <div className="is-3928638">
            {(["create","gallery"] as Tab[]).map(tab => {
              const on = activeTab===tab;
              return <button key={tab} onClick={()=>handleTabSwitch(tab)} className="is-cc4c11c" style={{ background:on?"#4A90E2":"transparent", color:on?"#fff":"#666", fontWeight:700, cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontSize:13, transition:"all .15s", whiteSpace:"nowrap", boxShadow:on?"0 2px 8px rgba(74,144,226,.3)":"none" }}>
                {tab==="create"?"🎨 Create":"💾 My Creations"}
              </button>;
            })}
          </div>
        </div>

        <main className="is-49ac4ee">
          {activeTab==="gallery" ? <Gallery /> : (
            <div className="pg">
              <div className="pl is-f4b1613">

                <Card title="1 — Format & Settings">
                  <span className="is-ab3039a">📐 Poster Format</span>
                  <div className="is-8c66952">
                    {(Object.entries(POSTER_FORMATS) as [FormatKey, typeof POSTER_FORMATS[FormatKey]][]).map(([key, f]) => {
                      const on = posterFormat===key;
                      const ratio = f.w/f.h;
                      const bw = ratio>=1 ? 22 : Math.round(22*ratio);
                      const bh = ratio>=1 ? Math.round(22/ratio) : 22;
                      return (
                        <button key={key} onClick={()=>set("posterFormat",key)} title={`${f.label} — ${f.w}×${f.h}`}
                          className="is-a180a10" style={{ border:`2px solid ${on?"#4A90E2":"#e0e0e0"}`, background:on?"#EBF4FF":"#fafafa", cursor:"pointer", transition:"all .12s", minHeight:64 }}>
                          <div style={{ width:bw, height:bh, border:`2px solid ${on?"#4A90E2":"#bbb"}`, borderRadius:2, background:on?"rgba(74,144,226,.12)":"transparent" }} />
                          <span className="is-bab99a8" style={{ color:on?"#4A90E2":"#777", textAlign:"center", lineHeight:1.2 }}>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Row label="🌐 Language">
                    <select value={state.language} onChange={e=>handleLanguageChange(e.target.value as Language)} className="is-f70a226">
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
                    <select onChange={e=>applyTemplate(e.target.value)} className="is-f70a226" defaultValue="">
                      <option value="">— Choose Template —</option>
                      <option value="newYearWishes">🎆 New Year Wishes</option>
                    </select>
                  </Row>
                  <div className="is-5bcf4cf">
                    <span className="is-ab3039a">🔤 Default Font (all sections)</span>
                    <FontPicker language={state.language} selectedFont={state.posterFont??""} placeholder="Default font for all sections…"
                      onSelect={f=>{ set("posterFont",f); addToast(`🔤 Default: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                    {state.posterFont && (
                      <div className="is-f05ebca" style={{ fontFamily:state.posterFont, fontSize:15, color:"#333" }}>
                        {state.title || "Preview — AksharaTantra"}
                      </div>
                    )}
                  </div>
                </Card>

                <Card title="2 — Title">
                  <Row label="🔖 Small Logo">
                    <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleImageUpload(f,"logo"); }} className="is-345895d" />
                  </Row>
                  <input placeholder={P.title} value={state.title} onChange={e=>set("title",e.target.value)}
                    className="is-b8c042c" style={{ fontFamily:titleFont||state.posterFont||"Montserrat,sans-serif" }} />
                  <div className="is-44b3e19">
                    <span className="is-c0aafe9">🔤 Title Font</span>
                    <FontPicker language={state.language} selectedFont={titleFont} placeholder="Same as default font…"
                      onSelect={f=>{ set("titleFont",f); addToast(`🔤 Title: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                  </div>
                  <div className="is-39b2332">
                    <Slider label="Size" value={state.titleSize} min={TITLE_MIN} max={TITLE_MAX} onChange={v=>set("titleSize",v)} />
                    <label className="is-e1772dd">Align<select value={state.titleAlign} onChange={e=>set("titleAlign",e.target.value as PosterState["titleAlign"])} className="is-f70a226"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>
                    <label className="is-e1772dd">Color<input type="color" value={state.titleColor} onChange={e=>set("titleColor",e.target.value)} className="is-339b3e7" /></label>
                    <label className="is-e1772dd">BG<input type="color" value={state.titleBg} onChange={e=>set("titleBg",e.target.value)} className="is-339b3e7" /></label>
                  </div>
                </Card>

                <Card title="3 — Subtitle">
                  <input placeholder={P.subtitle} value={state.subtitle} onChange={e=>set("subtitle",e.target.value)}
                    className="is-f70a226" style={{ fontFamily:subtitleFont||state.posterFont||"Montserrat,sans-serif" }} />
                  <div className="is-44b3e19">
                    <span className="is-c0aafe9">🔤 Subtitle Font</span>
                    <FontPicker language={state.language} selectedFont={subtitleFont} placeholder="Same as default font…"
                      onSelect={f=>{ set("subtitleFont",f); addToast(`🔤 Subtitle: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                  </div>
                  <div className="is-39b2332">
                    <Slider label="Size" value={state.subtitleSize} min={SUB_MIN} max={SUB_MAX} onChange={v=>set("subtitleSize",v)} />
                    <label className="is-e1772dd">Align<select value={state.subtitleAlign} onChange={e=>set("subtitleAlign",e.target.value as PosterState["subtitleAlign"])} className="is-f70a226"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option></select></label>
                    <label className="is-e1772dd">Color<input type="color" value={state.subtitleColor} onChange={e=>set("subtitleColor",e.target.value)} className="is-339b3e7" /></label>
                    <label className="is-e1772dd">BG<input type="color" value={state.subtitleBg} onChange={e=>set("subtitleBg",e.target.value)} className="is-339b3e7" /></label>
                  </div>
                </Card>

                <Card title="4 — Message">
                  <textarea placeholder={P.message} value={state.message} rows={3} onChange={e=>set("message",e.target.value)}
                    className="is-cf2c7eb" style={{ fontFamily:messageFont||state.posterFont||"Montserrat,sans-serif" }} />
                  <div className="is-44b3e19">
                    <span className="is-c0aafe9">🔤 Message Font</span>
                    <FontPicker language={state.language} selectedFont={messageFont} placeholder="Same as default font…"
                      onSelect={f=>{ set("messageFont",f); addToast(`🔤 Message: ${f.replace(/['"]/g,"").split(",")[0].trim()}`, "#4A90E2"); }} />
                  </div>
                  <div className="is-39b2332">
                    <Slider label="Size" value={state.messageSize} min={MSG_MIN} max={MSG_MAX} onChange={v=>set("messageSize",v)} />
                    <label className="is-e1772dd">Align<select value={state.contentAlign} onChange={e=>set("contentAlign",e.target.value as PosterState["contentAlign"])} className="is-f70a226"><option value="center">Center</option><option value="left">Left</option><option value="right">Right</option><option value="justify">Justify</option></select></label>
                    <label className="is-e1772dd">Color<input type="color" value={state.messageColor} onChange={e=>set("messageColor",e.target.value)} className="is-339b3e7" /></label>
                    <label className="is-e1772dd">BG<input type="color" value={state.messageBg} onChange={e=>set("messageBg",e.target.value)} className="is-339b3e7" /></label>
                  </div>
                  <div className="is-39b2332">
                    <button onClick={startListening} disabled={!voiceSupported||isListening} className="is-67c880d" style={{ background:isListening?"#E53935":"#fff", color:isListening?"#fff":"#333" }}>{isListening?"🔴 Listening…":"🎤 Speak"}</button>
                    <button onClick={stopListening} disabled={!isListening} className="is-67c880d">⏹ Stop</button>
                    <button onClick={()=>speak(state.message,state.language)} disabled={!state.message} className="is-add10c1">🔊 Read</button>
                  </div>
                </Card>

                <Card title="5 — Main Image">
                  <p className="is-e6895b3">Auto-resized to fit {fmt.w}×{fmt.h} before crop</p>
                  <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleImageUpload(f,"main"); }} className="is-345895d" />
                  {(state as any).uploadedMainData && (
                    <button onClick={()=>set("uploadedMainData","")} className="is-5ed45a0">✕ Remove</button>
                  )}
                  <label className="is-ccc5f15">
                    Position
                    <select value={state.imagePosition} onChange={e=>set("imagePosition",e.target.value as PosterState["imagePosition"])} className="is-f70a226">
                      <option value="center">Center</option><option value="left">Left</option><option value="right">Right</option>
                    </select>
                  </label>
                </Card>

                <Card title="6 — QR Code">
                  {!qrReady && <p className="is-aae7624">⏳ Loading QR library…</p>}
                  <input placeholder="Enter URL or text for QR" value={state.qrText} onChange={e=>set("qrText",e.target.value)} className="is-f70a226" />
                  <label className="is-df58c53">
                    QR Alignment
                    <div className="is-4a5d9a1">
                      {(["left","center","right"] as const).map(a => (
                        <button key={a} onClick={()=>set("qrAlign",a)} className="is-e8e58df" style={{ border:`2px solid ${state.qrAlign===a?"#4A90E2":"#e0e0e0"}`, background:state.qrAlign===a?"#EBF4FF":"#fafafa", color:state.qrAlign===a?"#4A90E2":"#666", fontWeight:700, cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontSize:12 }}>
                          {a==="left"?"◀ Left":a==="center"?"▮ Center":"Right ▶"}
                        </button>
                      ))}
                    </div>
                  </label>
                </Card>

                <Card title="7 — Generate & Export">
                  <div className="is-f23d5f0">
                    <span>{POSTER_FORMATS[posterFormat]?.icon}</span>
                    <span>{POSTER_FORMATS[posterFormat]?.label}</span>
                    <span className="is-b57d185">· {fmt.w}×{fmt.h}px</span>
                  </div>
                  <div className="is-1818718">
                    <button onClick={handleClear} className="is-67c880d">🧹 Clear</button>
                    <button onClick={handleSave} disabled={isGenerating} className="is-67c880d">💾 Save</button>
                    <button onClick={handleGenerate} disabled={isGenerating} className="is-47bc3e1">
                      {isGenerating?"⏳ Generating…":"⚡ Generate"}
                    </button>
                  </div>
                  <div className="is-1f7cc44">
                    <button onClick={handleDownload} disabled={isGenerating} className="is-4312954">⬇ Download</button>
                    <button onClick={handleShare} disabled={isGenerating} className="is-4312954">📤 Share</button>
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

function Card({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div className="is-cff44ba">
      <h3 className="is-ff8f451">{title}</h3>
      {children}
    </div>
  );
}
function Row({ label, children }: { label:string; children:React.ReactNode }) {
  return <label className="is-e1772dd">{label}{children}</label>;
}
function Slider({ label, value, min, max, onChange }: { label:string; value:number; min:number; max:number; onChange:(v:number)=>void }) {
  return (
    <label className="is-8cd1db0">
      <span className="is-58e548b">
        {label}
        <span className="is-43df7ef">{value}px</span>
      </span>
      <input type="range" min={min} max={max} step={1} value={value} onChange={e=>onChange(Number(e.target.value))} className="is-d5d9338" />
    </label>
  );
}
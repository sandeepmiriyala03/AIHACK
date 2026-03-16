"use client";
// =====================================================
// FontPicker — Final. Unique font-family per variant.
// FIX: No font-weight/style in @font-face anymore.
//      Each variant = its own CSS family name.
//      Works in browser + html2canvas reliably.
// =====================================================
import { useEffect, useRef, useState, useMemo } from "react";

export interface CuratedFont { name: string; label: string; sample: string; googleFont?: string; }

const TELUGU_FONTS: CuratedFont[] = [
  { name: "'Gurajada', serif",                  label: "Gurajada",                 sample: "తెలుగు అక్షరం" },
  { name: "'NTR', sans-serif",                  label: "NTR",                      sample: "తెలుగు అక్షరం" },
  { name: "'Ramaneeya', serif",                 label: "Ramaneeya",                sample: "తెలుగు అక్షరం" },
  { name: "'Veturi', serif",                    label: "Veturi",                   sample: "తెలుగు అక్షరం" },
  { name: "'Sirivennela', serif",               label: "Sirivennela",              sample: "తెలుగు అక్షరం" },
  { name: "'Chathura-Thin', sans-serif",        label: "Chathura Thin",            sample: "తెలుగు అక్షరం" },
  { name: "'Chathura-Light', sans-serif",       label: "Chathura Light",           sample: "తెలుగు అక్షరం" },
  { name: "'Chathura-Regular', sans-serif",     label: "Chathura Regular",         sample: "తెలుగు అక్షరం" },
  { name: "'Chathura-Bold', sans-serif",        label: "Chathura Bold",            sample: "తెలుగు అక్షరం" },
  { name: "'Chathura-ExtraBold', sans-serif",   label: "Chathura ExtraBold",       sample: "తెలుగు అక్షరం" },
  { name: "'Ramaraja', serif",                  label: "Ramaraja",                 sample: "తెలుగు అక్షరం" },
  { name: "'RaviPrakash', sans-serif",          label: "Ravi Prakash",             sample: "తెలుగు అక్షరం" },
  { name: "'TenaliRamakrishna', serif",         label: "Tenali Ramakrishna",       sample: "తెలుగు అక్షరం" },
  { name: "'Timmana', serif",                   label: "Timmana",                  sample: "తెలుగు అక్షరం" },
  { name: "'TANA', sans-serif",                 label: "TANA",                     sample: "తెలుగు అక్షరం" },
  { name: "'Ponnala', sans-serif",              label: "Ponnala",                  sample: "తెలుగు అక్షరం" },
  { name: "'Gidugu', sans-serif",               label: "Gidugu",                   sample: "తెలుగు అక్షరం" },
  { name: "'Gidugu-Italic', sans-serif",        label: "Gidugu Italic",            sample: "తెలుగు అక్షరం" },
  { name: "'LakkiReddy', serif",                label: "Lakki Reddy",              sample: "తెలుగు అక్షరం" },
  { name: "'Peddana', serif",                   label: "Peddana",                  sample: "తెలుగు అక్షరం" },
  { name: "'Nandakam', serif",                  label: "Nandakam",                 sample: "తెలుగు అక్షరం" },
  { name: "'Nandakam-Italic', serif",           label: "Nandakam Italic",          sample: "తెలుగు అక్షరం" },
  { name: "'Purushothamaa', serif",             label: "Purushothamaa",            sample: "తెలుగు అక్షరం" },
  { name: "'Purushothamaa-Italic', serif",      label: "Purushothamaa Italic",     sample: "తెలుగు అక్షరం" },
  { name: "'Ramabhadra', serif",                label: "Ramabhadra",               sample: "తెలుగు అక్షరం" },
  { name: "'Ramabhadra-Italic', serif",         label: "Ramabhadra Italic",        sample: "తెలుగు అక్షరం" },
  { name: "'SreeKrushnadevaraya', serif",       label: "Sree Krushnadevaraya",        sample: "తెలుగు అక్షరం" },
  { name: "'SreeKrushnadevaraya-Italic', serif",label: "Sree Krushnadevaraya Italic", sample: "తెలుగు అక్షరం" },
  { name: "'Suranna', serif",                   label: "Suranna",                  sample: "తెలుగు అక్షరం" },
  { name: "'Suranna-Bold', serif",              label: "Suranna Bold",             sample: "తెలుగు అక్షరం" },
  { name: "'Suranna-Italic', serif",            label: "Suranna Italic",           sample: "తెలుగు అక్షరం" },
  { name: "'Suranna-BoldItalic', serif",        label: "Suranna Bold Italic",      sample: "తెలుగు అక్షరం" },
  { name: "'Suravaram', serif",                 label: "Suravaram",                sample: "తెలుగు అక్షరం" },
  { name: "'Suravaram-Italic', serif",          label: "Suravaram Italic",         sample: "తెలుగు అక్షరం" },
  { name: "'Annamayya', serif",                 label: "Annamayya",                sample: "తెలుగు అక్షరం" },
  { name: "'Annamayya-Bold', serif",            label: "Annamayya Bold",           sample: "తెలుగు అక్షరం" },
  { name: "'Annamayya-Italic', serif",          label: "Annamayya Italic",         sample: "తెలుగు అక్షరం" },
  { name: "'Annamayya-BoldItalic', serif",      label: "Annamayya Bold Italic",    sample: "తెలుగు అక్షరం" },
  { name: "'Dhurjati', sans-serif",             label: "Dhurjati",                 sample: "తెలుగు అక్షరం" },
  { name: "'Dhurjati-Italic', sans-serif",      label: "Dhurjati Italic",          sample: "తెలుగు అక్షరం" },
  { name: "'JIMS', sans-serif",                 label: "JIMS",                     sample: "తెలుగు అక్షరం" },
  { name: "'JIMS-Italic', sans-serif",          label: "JIMS Italic",              sample: "తెలుగు అక్షరం" },
  { name: "'KanakaDurga', serif",               label: "Kanaka Durga",             sample: "తెలుగు అక్షరం" },
  { name: "'KanakaDurga-Italic', serif",        label: "Kanaka Durga Italic",      sample: "తెలుగు అక్షరం" },
  { name: "'Mandali', sans-serif",              label: "Mandali",                  sample: "తెలుగు అక్షరం" },
  { name: "'Mandali-Bold', sans-serif",         label: "Mandali Bold",             sample: "తెలుగు అక్షరం" },
  { name: "'Mandali-Italic', sans-serif",       label: "Mandali Italic",           sample: "తెలుగు అక్షరం" },
  { name: "'Mandali-BoldItalic', sans-serif",   label: "Mandali Bold Italic",      sample: "తెలుగు అక్షరం" },
  { name: "'PottiSreeramulu', sans-serif",      label: "Potti Sreeramulu",         sample: "తెలుగు అక్షరం" },
];

export const LANGUAGE_FONTS: Record<string, CuratedFont[]> = {
  tel: TELUGU_FONTS,
  eng: [
    { name: "'Playfair Display', serif",      label: "Playfair Display",     sample: "The quick brown fox", googleFont: "Playfair+Display"     },
    { name: "'Lora', serif",                  label: "Lora",                 sample: "The quick brown fox", googleFont: "Lora"                 },
    { name: "'Josefin Sans', sans-serif",     label: "Josefin Sans",         sample: "The quick brown fox", googleFont: "Josefin+Sans"         },
    { name: "'Raleway', sans-serif",          label: "Raleway",              sample: "The quick brown fox", googleFont: "Raleway"              },
    { name: "'Cormorant Garamond', serif",    label: "Cormorant Garamond",   sample: "The quick brown fox", googleFont: "Cormorant+Garamond"   },
  ],
  hin: [
    { name: "'Noto Serif Devanagari', serif", label: "Noto Serif Devanagari", sample: "हिन्दी अक्षर", googleFont: "Noto+Serif+Devanagari" },
    { name: "'Hind', sans-serif",             label: "Hind",                  sample: "हिन्दी अक्षर", googleFont: "Hind"                  },
    { name: "'Tiro Devanagari Hindi', serif", label: "Tiro Devanagari",       sample: "हिन्दी अक्षर", googleFont: "Tiro+Devanagari+Hindi" },
  ],
  san: [
    { name: "'Noto Serif Devanagari', serif",    label: "Noto Serif Devanagari", sample: "संस्कृतम्", googleFont: "Noto+Serif+Devanagari"      },
    { name: "'Tiro Devanagari Sanskrit', serif", label: "Tiro Sanskrit",         sample: "संस्कृतम्", googleFont: "Tiro+Devanagari+Sanskrit"   },
  ],
  tam: [
    { name: "'Noto Serif Tamil', serif",     label: "Noto Serif Tamil",     sample: "தமிழ் எழுத்து", googleFont: "Noto+Serif+Tamil"   },
    { name: "'Latha', sans-serif",           label: "Latha",                sample: "தமிழ் எழுத்து"                                    },
  ],
  kan: [{ name: "'Noto Serif Kannada', serif",   label: "Noto Serif Kannada",   sample: "ಕನ್ನಡ ಅಕ್ಷರ", googleFont: "Noto+Serif+Kannada"   }],
  mal: [{ name: "'Noto Serif Malayalam', serif", label: "Noto Serif Malayalam", sample: "മലയാളം അക്ഷരം", googleFont: "Noto+Serif+Malayalam" }],
  ori: [{ name: "'Noto Serif Oriya', serif",     label: "Noto Serif Oriya",     sample: "ଓଡ଼ିଆ ଅକ୍ଷର",  googleFont: "Noto+Serif+Oriya"     }],
};

export function getFontsForLanguage(l: string) { return LANGUAGE_FONTS[l] ?? LANGUAGE_FONTS["eng"]; }

const loadedFonts = new Set<string>();
export function loadGoogleFont(gf: string) {
  if (loadedFonts.has(gf) || document.querySelector(`link[href*="${gf}"]`)) return;
  loadedFonts.add(gf);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${gf}:wght@400;600;700&display=swap`;
  document.head.appendChild(l);
}

const GROUPS: { heading: string; labels: string[] }[] = [
  { heading: "Classic",              labels: ["Gurajada","NTR","Ramaneeya","Veturi","Sirivennela"] },
  { heading: "Chathura",             labels: ["Chathura Thin","Chathura Light","Chathura Regular","Chathura Bold","Chathura ExtraBold"] },
  { heading: "Traditional",          labels: ["Ramaraja","Ravi Prakash","Tenali Ramakrishna","Timmana","TANA","Ponnala"] },
  { heading: "Gidugu",               labels: ["Gidugu","Gidugu Italic"] },
  { heading: "Single-weight",        labels: ["Lakki Reddy","Peddana"] },
  { heading: "Nandakam",             labels: ["Nandakam","Nandakam Italic"] },
  { heading: "Purushothamaa",        labels: ["Purushothamaa","Purushothamaa Italic"] },
  { heading: "Ramabhadra",           labels: ["Ramabhadra","Ramabhadra Italic"] },
  { heading: "Sree Krushnadevaraya", labels: ["Sree Krushnadevaraya","Sree Krushnadevaraya Italic"] },
  { heading: "Suranna",              labels: ["Suranna","Suranna Bold","Suranna Italic","Suranna Bold Italic"] },
  { heading: "Suravaram",            labels: ["Suravaram","Suravaram Italic"] },
  { heading: "🆕 Annamayya",         labels: ["Annamayya","Annamayya Bold","Annamayya Italic","Annamayya Bold Italic"] },
  { heading: "🆕 Dhurjati",          labels: ["Dhurjati","Dhurjati Italic"] },
  { heading: "🆕 JIMS",              labels: ["JIMS","JIMS Italic"] },
  { heading: "🆕 Kanaka Durga",      labels: ["Kanaka Durga","Kanaka Durga Italic"] },
  { heading: "🆕 Mandali",           labels: ["Mandali","Mandali Bold","Mandali Italic","Mandali Bold Italic"] },
  { heading: "🆕 Potti Sreeramulu",  labels: ["Potti Sreeramulu"] },
];

interface LocalFont { family: string }
export interface FontPickerProps {
  language: string;
  selectedFont: string;
  onSelect: (ff: string) => void;
  placeholder?: string;
}

// ── tiny style helpers ──
const row = (sel: boolean): React.CSSProperties => ({
  display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:9,
  border:"1.5px solid",borderColor:sel?"#4A90E2":"#f0f0f0",
  background:sel?"#EBF3FD":"#fff",cursor:"pointer",transition:"background .12s",
});
const sample = (ff: string): React.CSSProperties => ({
  fontFamily:ff,fontSize:17,flex:1,color:"#222",
  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
});
const meta: React.CSSProperties = { fontSize:11,color:"#aaa",fontFamily:"Montserrat,sans-serif",flexShrink:0 };
const empty: React.CSSProperties = { padding:"20px 0",textAlign:"center",color:"#bbb",fontSize:13,fontFamily:"Montserrat,sans-serif" };
const badge: React.CSSProperties = { fontSize:10,background:"#EBF4FF",color:"#4A90E2",borderRadius:10,padding:"1px 7px",fontWeight:700 };
const groupHead: React.CSSProperties = { padding:"5px 8px 1px",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#bbb",fontFamily:"Montserrat,sans-serif" };

export function FontPicker({ language, selectedFont, onSelect, placeholder = "Choose font…" }: FontPickerProps) {
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState<"curated"|"local">("curated");
  const [q, setQ]         = useState("");
  const [lq, setLq]       = useState("");
  const [lFonts, setLF]   = useState<LocalFont[]>([]);
  const [lLoad, setLL]    = useState(false);
  const [lErr, setLE]     = useState<string|null>(null);
  const [perm, setPerm]   = useState(false);
  const mRef = useRef<HTMLDivElement>(null);
  const fonts = useMemo(() => getFontsForLanguage(language), [language]);

  useEffect(() => { if (open) fonts.forEach(f => { if (f.googleFont) loadGoogleFont(f.googleFont); }); }, [open, fonts]);
  useEffect(() => { if (open && tab==="local" && !lFonts.length && !lLoad && perm) doLoadLocal(); }, [tab, open]); // eslint-disable-line
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (mRef.current && !mRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key==="Escape") setOpen(false); };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, [open]);

  const doLoadLocal = async () => {
    setLL(true); setLE(null);
    try {
      if (!("queryLocalFonts" in window)) { setLE("Requires Chrome 103+ on desktop."); return; }
      const data: LocalFont[] = await (window as any).queryLocalFonts();
      const seen = new Set<string>();
      const u = data.filter(f => { if (seen.has(f.family)) return false; seen.add(f.family); return true; });
      u.sort((a,b) => a.family.localeCompare(b.family));
      setLF(u); setPerm(true);
    } catch (e: any) {
      setLE(e?.name==="NotAllowedError" ? "Permission denied." : "Could not load local fonts.");
    } finally { setLL(false); }
  };

  const pick = (ff: string) => { onSelect(ff); setOpen(false); };
  const filt = q.trim() ? fonts.filter(f => f.label.toLowerCase().includes(q.toLowerCase())) : fonts;
  const filtL = lq.trim() ? lFonts.filter(f => f.family.toLowerCase().includes(lq.toLowerCase())) : lFonts;
  const grouped = language === "tel" && !q.trim();
  const label = selectedFont ? selectedFont.replace(/['"]/g,"").split(",")[0].trim() : "";

  return (
    <>
      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          padding:"7px 10px",borderRadius:8,
          border:`1.5px solid ${selectedFont?"#4A90E2":"#e0e0e0"}`,
          background:selectedFont?"#EBF4FF":"#fafafa",cursor:"pointer",
          fontFamily:"Montserrat,sans-serif",fontSize:12,fontWeight:600,
          color:selectedFont?"#4A90E2":"#888",width:"100%",
          textAlign:"left",display:"flex",alignItems:"center",gap:6,
        }}
      >
        <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {selectedFont
            ? <span style={{fontFamily:selectedFont}}>{label}</span>
            : <span style={{color:"#bbb"}}>{placeholder}</span>
          }
        </span>
        {language==="tel" && !selectedFont && <span style={badge}>{TELUGU_FONTS.length}</span>}
        {selectedFont && (
          <span onClick={e=>{e.stopPropagation();onSelect("");}}
            style={{color:"#bbb",fontSize:13,cursor:"pointer",lineHeight:1}} title="Clear">✕</span>
        )}
        <span style={{color:"#bbb",fontSize:11}}>▾</span>
      </button>

      {/* ── Modal ── */}
      {open && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div ref={mRef} style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:440,maxHeight:"82vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 40px rgba(0,0,0,.22)",overflow:"hidden"}}>

            {/* header */}
            <div style={{padding:"14px 16px 10px",borderBottom:"1.5px solid #f0f0f0",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:14,color:"#333"}}>
                  🔤 {placeholder}
                  {language==="tel" && <span style={{...badge,marginLeft:8}}>{TELUGU_FONTS.length} fonts</span>}
                </span>
                <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#888"}}>✕</button>
              </div>
              <div style={{display:"flex",gap:6}}>
                {(["curated","local"] as const).map(t => (
                  <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px 0",borderRadius:8,border:"1.5px solid",borderColor:tab===t?"#4A90E2":"#e0e0e0",background:tab===t?"#4A90E2":"#fff",color:tab===t?"#fff":"#555",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Montserrat,sans-serif",transition:"all .15s"}}>
                    {t==="curated"?"🌐 Curated":"💻 Local"}
                  </button>
                ))}
              </div>
              {tab==="curated" && <input style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #e0e0e0",fontSize:13,fontFamily:"Montserrat,sans-serif",width:"100%",boxSizing:"border-box",background:"#fafafa",outline:"none"}} placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />}
              {tab==="local" && lFonts.length>0 && <input style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #e0e0e0",fontSize:13,fontFamily:"Montserrat,sans-serif",width:"100%",boxSizing:"border-box",background:"#fafafa",outline:"none"}} placeholder="Search local…" value={lq} onChange={e=>setLq(e.target.value)} autoFocus />}
            </div>

            {/* curated list */}
            {tab==="curated" && (
              <div style={{overflowY:"auto",flex:1,padding:"8px 10px",display:"flex",flexDirection:"column",gap:3}}>
                {filt.length===0 ? <p style={empty}>No match for "{q}"</p>
                  : grouped
                    ? GROUPS.map(g => {
                        const gf = TELUGU_FONTS.filter(f => g.labels.includes(f.label));
                        if (!gf.length) return null;
                        return <div key={g.heading}>
                          <div style={groupHead}>{g.heading}</div>
                          {gf.map(f => (
                            <div key={f.name+f.label} style={row(selectedFont===f.name)} onClick={()=>pick(f.name)}>
                              <span style={sample(f.name)}>{f.sample}</span>
                              <span style={meta}>{f.label}</span>
                              {selectedFont===f.name && <span style={{color:"#4A90E2",fontSize:15}}>✓</span>}
                            </div>
                          ))}
                        </div>;
                      })
                    : filt.map(f => (
                        <div key={f.name+f.label} style={row(selectedFont===f.name)} onClick={()=>pick(f.name)}>
                          <span style={sample(f.name)}>{f.sample}</span>
                          <span style={meta}>{f.label}</span>
                          {selectedFont===f.name && <span style={{color:"#4A90E2",fontSize:15}}>✓</span>}
                        </div>
                      ))
                }
              </div>
            )}

            {/* local tab */}
            {tab==="local" && (
              <>
                {lErr && <div style={{margin:"12px 16px",padding:"10px 14px",background:"#FFF3E0",border:"1.5px solid #FFB300",borderRadius:9,color:"#E65100",fontSize:13,fontFamily:"Montserrat,sans-serif"}}>⚠️ {lErr}</div>}
                {!perm && !lErr && !lLoad && (
                  <div style={{...empty,padding:"24px 16px"}}>
                    <p style={{marginBottom:12}}>Access device fonts.<br/><span style={{fontSize:11,color:"#bbb"}}>Chrome 103+ required</span></p>
                    <button onClick={()=>{setPerm(true);doLoadLocal();}} style={{margin:"0 auto",display:"block",padding:"10px 20px",borderRadius:9,border:"none",background:"#4A90E2",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Montserrat,sans-serif"}}>🔓 Grant Access</button>
                  </div>
                )}
                {lLoad && <p style={{...empty,color:"#999",padding:"20px 0"}}>⏳ Loading…</p>}
                {!lLoad && lFonts.length>0 && (
                  <div style={{overflowY:"auto",flex:1,padding:"8px 10px",display:"flex",flexDirection:"column",gap:3}}>
                    {filtL.length===0 ? <p style={empty}>No match</p>
                      : filtL.map(f => {
                          const ff = `'${f.family}', sans-serif`;
                          return <div key={f.family} style={row(selectedFont===ff)} onClick={()=>pick(ff)}>
                            <span style={{...sample(ff)}}>{f.family}</span>
                            {selectedFont===ff && <span style={{color:"#4A90E2",fontSize:15}}>✓</span>}
                          </div>;
                        })
                    }
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
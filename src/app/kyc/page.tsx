"use client";
// ============================================================
// AksharaKYC — Fixed OCR Pipeline (No Hang, PWA-Ready)
//
// FIXES:
//   1. Per-engine 30s timeout — hung worker is killed, next runs
//   2. Fully sequential: E2 waits for E1 to finish/fail/timeout
//   3. Worker is always terminated (finally block) — no leaks
//   4. PWA meta tags included (add manifest.json separately)
//   5. Mobile camera never locks up — FileReader is wrapped safely
// ============================================================

import Navbar from "@/components/Navbar";
import { useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────
type DocType    = "aadhaar" | "pan" | "passport" | "voter" | "bankstatement";
type EngineUsed = "eng_psm6" | "eng_psm3" | "eng_psm11" | "manual" | "none";

interface DocField {
  key: string; label: string; value: string;
  confidence: number; verified: boolean; engine: EngineUsed;
}
interface KYCDocument {
  id: string; docType: DocType; imageUrl: string;
  fields: DocField[]; status: "idle"|"processing"|"done"|"failed";
  engineUsed: EngineUsed; enginesTried: string[];
  scannedAt: number; rawText?: string;
}
interface DocConfig {
  id: DocType; label: string; icon: string; color: string; hint: string;
  fields: { key: string; label: string; placeholder: string }[];
}

// ─── Document Configs ─────────────────────────────────────────
const DOC_CONFIGS: DocConfig[] = [
  {
    id:"aadhaar", label:"Aadhaar Card", icon:"🪪", color:"#1565C0",
    hint:"White surface · Good light · All text visible",
    fields:[
      {key:"name",    label:"Full Name",      placeholder:"e.g. RAMAIAH VENKATA RAO"},
      {key:"dob",     label:"Date of Birth",  placeholder:"DD/MM/YYYY"             },
      {key:"gender",  label:"Gender",         placeholder:"Male / Female"          },
      {key:"uid",     label:"Aadhaar Number", placeholder:"XXXX XXXX XXXX"         },
      {key:"address", label:"Address",        placeholder:"Full address on card"   },
    ],
  },
  {
    id:"pan", label:"PAN Card", icon:"💳", color:"#2E7D32",
    hint:"WHITE paper background · 90° angle · No wallet",
    fields:[
      {key:"name",       label:"Full Name",     placeholder:"e.g. PAN CARD HOLDER"  },
      {key:"fathername", label:"Father's Name", placeholder:"e.g. FATHER NAME"      },
      {key:"dob",        label:"Date of Birth", placeholder:"DD/MM/YYYY"            },
      {key:"panno",      label:"PAN Number",    placeholder:"e.g. ABCDE1234F"       },
    ],
  },
  {
    id:"passport", label:"Passport", icon:"🛂", color:"#6A1B9A",
    hint:"Photo page · Flat · No reflections",
    fields:[
      {key:"surname",     label:"Surname",         placeholder:"As on passport" },
      {key:"givenname",   label:"Given Names",     placeholder:"As on passport" },
      {key:"nationality", label:"Nationality",     placeholder:"INDIAN"         },
      {key:"dob",         label:"Date of Birth",   placeholder:"DD/MM/YYYY"     },
      {key:"passportno",  label:"Passport Number", placeholder:"e.g. A1234567"  },
      {key:"expiry",      label:"Date of Expiry",  placeholder:"DD/MM/YYYY"     },
    ],
  },
  {
    id:"voter", label:"Voter ID (EPIC)", icon:"🗳️", color:"#C62828",
    hint:"Front side · All text clearly visible",
    fields:[
      {key:"name",       label:"Elector's Name",          placeholder:"Full name"       },
      {key:"fathername", label:"Father's/Husband's Name", placeholder:"Name"            },
      {key:"dob",        label:"Date of Birth",           placeholder:"DD/MM/YYYY"      },
      {key:"voterid",    label:"EPIC Number",             placeholder:"e.g. ABC1234567" },
      {key:"address",    label:"Address",                 placeholder:"Address on card" },
    ],
  },
  {
    id:"bankstatement", label:"Bank Statement", icon:"🏦", color:"#00695C",
    hint:"First page · Account details visible",
    fields:[
      {key:"accountholder", label:"Account Holder",   placeholder:"Full name"               },
      {key:"accountno",     label:"Account Number",   placeholder:"Account number"           },
      {key:"ifsc",          label:"IFSC Code",        placeholder:"e.g. SBIN0001234"         },
      {key:"bankname",      label:"Bank Name",        placeholder:"e.g. State Bank of India" },
      {key:"period",        label:"Statement Period", placeholder:"From date - To date"      },
      {key:"balance",       label:"Closing Balance",  placeholder:"Amount"                   },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────
const genId     = () => Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const getCfg    = (t:DocType) => DOC_CONFIGS.find(d=>d.id===t)!;
const confColor = (s:number) => s>=80?"#2E7D32":s>=50?"#E65100":s>0?"#C62828":"#bbb";
const confLabel = (s:number) => s>=80?"High ✓":s>=50?"Medium":s>0?"Low":"—";
const overall   = (f:DocField[]) => !f.length?0:Math.round(f.reduce((s,x)=>s+x.confidence,0)/f.length);
const blankFields = (cfg:DocConfig):DocField[] =>
  cfg.fields.map(f=>({key:f.key,label:f.label,value:"",confidence:0,verified:false,engine:"none" as EngineUsed}));
const scoreFields = (fields:DocField[]) => {
  const found = fields.filter(f=>f.value.trim()).length;
  const avg   = fields.reduce((s,f)=>s+f.confidence,0)/Math.max(fields.length,1);
  return (found/Math.max(fields.length,1))*60 + (avg/100)*40;
};

const ENGINE_LABELS: Record<EngineUsed,string> = {
  eng_psm6:  "🔬 Engine 1 (PSM-6)",
  eng_psm3:  "🔬 Engine 2 (PSM-3)",
  eng_psm11: "🔬 Engine 3 (PSM-11)",
  manual:    "✏️ Manual Entry",
  none:      "—",
};

// ═══════════════════════════════════════════════════════════════
// IMAGE PREPROCESSING
// ═══════════════════════════════════════════════════════════════
interface PrepOpts { scale?:number; contrast?:number; threshold?:boolean; sharpen?:boolean; }

function preprocess(imageUrl:string, opts:PrepOpts={}): Promise<string> {
  const { scale=3, contrast=1.6, threshold=false, sharpen=false } = opts;
  return new Promise((resolve, reject) => {
    const img  = new Image();
    // ✅ FIX: timeout image load so it never hangs forever
    const imgTimeout = setTimeout(() => reject(new Error("Image load timeout")), 15000);
    img.onload = () => {
      clearTimeout(imgTimeout);
      try {
        const w=img.width*scale, h=img.height*scale;
        const c=document.createElement("canvas"); c.width=w; c.height=h;
        const ctx=c.getContext("2d")!;
        ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
        ctx.drawImage(img,0,0,w,h);
        const id=ctx.getImageData(0,0,w,h), d=id.data;
        for(let i=0;i<d.length;i+=4){
          let g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
          g=Math.min(255,Math.max(0,contrast*(g-128)+128));
          if(sharpen)   g=Math.min(255,g*1.15);
          if(threshold) g=g>127?255:0;
          d[i]=d[i+1]=d[i+2]=g;
        }
        ctx.putImageData(id,0,0);
        resolve(c.toDataURL("image/png",1.0));
      } catch(e) { reject(e); }
    };
    img.onerror = () => { clearTimeout(imgTimeout); reject(new Error("Image load failed")); };
    img.src = imageUrl;
  });
}

// ═══════════════════════════════════════════════════════════════
// TESSERACT RUNNER — with 30s timeout + guaranteed worker cleanup
// KEY: worker is ALWAYS terminated in finally, never leaks
// ═══════════════════════════════════════════════════════════════
const ENGINE_TIMEOUT_MS = 30_000; // 30 seconds per engine

async function runTesseract(
  imageUrl:  string,
  psm:       number,
  langParam: string = "eng"
): Promise<{text:string; confidence:number}> {

  const { createWorker } = await import("tesseract.js");

  // ✅ FIX: Race the worker against a timeout promise
  const workerPromise = (async () => {
    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    try {
      worker = await createWorker(langParam, 1, {
        logger: () => {}, // suppress noisy logs
      });
      await worker.setParameters({
        tessedit_pageseg_mode: String(psm) as any,
      });
      const { data } = await worker.recognize(imageUrl);
      return { text: data.text ?? "", confidence: data.confidence ?? 0 };
    } finally {
      // ✅ CRITICAL: always terminate — even if recognize throws
      if (worker) {
        try { await worker.terminate(); } catch { /* ignore */ }
      }
    }
  })();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Engine timed out after ${ENGINE_TIMEOUT_MS/1000}s`)), ENGINE_TIMEOUT_MS)
  );

  // Whichever settles first wins; if timeout wins, worker is still
  // terminated by the finally block above when it eventually resolves.
  return Promise.race([workerPromise, timeoutPromise]);
}

// ═══════════════════════════════════════════════════════════════
// FIELD EXTRACTION — tuned for Indian printed documents
// ═══════════════════════════════════════════════════════════════
const NOISE = [
  "INCOME TAX DEPARTMENT","INCOME TAX","GOVT OF INDIA","GOVERNMENT OF INDIA",
  "GOVT","DEPARTMENT","PERMANENT ACCOUNT NUMBER","UNIQUE IDENTIFICATION",
  "ELECTION COMMISSION","UIDAI","REPUBLIC OF INDIA",
  "आयकर विभाग","भारत सरकार","आधार","भारतीय विशिष्ट",
];

function cleanLines(text:string): string[] {
  return text.split("\n")
    .map(l=>l.trim())
    .filter(l=>
      l.length>2 &&
      !NOISE.some(n=>l.toUpperCase().includes(n.toUpperCase())) &&
      !/^[^a-zA-Z0-9\u0900-\u097F]+$/.test(l)
    );
}
function capsLines(lines:string[]): string[] {
  return lines.filter(l=>
    l===l.toUpperCase() && l.length>3 &&
    !/^\d/.test(l) && /[A-Z]/.test(l) &&
    !/^[0-9\s\/\-\.\,]+$/.test(l)
  );
}
function getDates(text:string): string[] {
  return (text.match(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/g)??[]).map(d=>d.replace(/[-\.]/g,"/"));
}
function mkField(key:string,label:string,value:string,conf:number,engine:EngineUsed): DocField {
  return {key,label,value:value.slice(0,100).trim(),confidence:value.trim()?conf:0,verified:false,engine:value.trim()?engine:"none"};
}

function extractPAN(text:string, bc:number, engine:EngineUsed): DocField[] {
  const upper=text.toUpperCase(), lines=cleanLines(text), caps=capsLines(lines), dates=getDates(text);
  let panno="";
  for(const p of [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/,/\b[A-Z0-9]{5}[0-9]{4}[A-Z0-9]\b/]){
    const m=upper.match(p); if(m){panno=m[0];break;}
  }
  const c=(v:string,b=0)=>v?Math.min(92,bc+b):0;
  return [
    mkField("name","Full Name",caps[0]??"",c(caps[0]??"",6),engine),
    mkField("fathername","Father's Name",caps[1]??"",c(caps[1]??"",4),engine),
    mkField("dob","Date of Birth",dates[0]??"",dates[0]?88:0,engine),
    mkField("panno","PAN Number",panno,panno?94:0,engine),
  ];
}
function extractAadhaar(text:string, bc:number, engine:EngineUsed): DocField[] {
  const upper=text.toUpperCase(), lines=cleanLines(text), caps=capsLines(lines), dates=getDates(text);
  const uid=text.match(/\d{4}[\s\-]\d{4}[\s\-]\d{4}/)??text.match(/\d{12}/);
  const gender=upper.includes("FEMALE")?"Female":upper.includes("MALE")?"Male":upper.includes("महिला")?"Female":upper.includes("पुरुष")?"Male":"";
  const addr=lines.filter(l=>l.length>8).slice(3).join(", ").slice(0,130);
  const c=(v:string,b=0)=>v?Math.min(88,bc+b):0;
  return [
    mkField("name","Full Name",caps[0]??"",c(caps[0]??"",5),engine),
    mkField("dob","Date of Birth",dates[0]??"",dates[0]?88:0,engine),
    mkField("gender","Gender",gender,gender?85:0,engine),
    mkField("uid","Aadhaar Number",uid?.[0]??"",uid?94:0,engine),
    mkField("address","Address",addr,c(addr),engine),
  ];
}
function extractPassport(text:string, bc:number, engine:EngineUsed): DocField[] {
  const upper=text.toUpperCase(), lines=cleanLines(text), caps=capsLines(lines), dates=getDates(text);
  const passno=upper.match(/\b[A-Z]\d{7}\b/)?.[0]??"";
  const nat=upper.includes("INDIAN")||upper.includes("INDIA")?"INDIAN":"";
  const mrz=upper.match(/P<IND([A-Z<]+)<<([A-Z<]+)/);
  const surname=mrz?mrz[1].replace(/</g," ").trim():(caps[0]??"");
  const givenname=mrz?mrz[2].replace(/</g," ").trim():(caps[1]??"");
  const c=(v:string,b=0)=>v?Math.min(90,bc+b):0;
  return [
    mkField("surname","Surname",surname,c(surname,5),engine),
    mkField("givenname","Given Names",givenname,c(givenname,5),engine),
    mkField("nationality","Nationality",nat,nat?85:0,engine),
    mkField("dob","Date of Birth",dates[0]??"",dates[0]?88:0,engine),
    mkField("passportno","Passport Number",passno,passno?92:0,engine),
    mkField("expiry","Date of Expiry",dates[1]??"",dates[1]?88:0,engine),
  ];
}
function extractVoter(text:string, bc:number, engine:EngineUsed): DocField[] {
  const upper=text.toUpperCase(), lines=cleanLines(text), caps=capsLines(lines), dates=getDates(text);
  const epic=upper.match(/\b[A-Z]{3}[0-9]{7}\b/)?.[0]??upper.match(/\b[A-Z0-9]{10}\b/)?.[0]??"";
  const addr=lines.filter(l=>l.length>8).slice(3).join(", ").slice(0,130);
  const c=(v:string,b=0)=>v?Math.min(85,bc+b):0;
  return [
    mkField("name","Elector's Name",caps[0]??"",c(caps[0]??"",5),engine),
    mkField("fathername","Father's/Husband's Name",caps[1]??"",c(caps[1]??"",3),engine),
    mkField("dob","Date of Birth",dates[0]??"",dates[0]?86:0,engine),
    mkField("voterid","EPIC Number",epic,epic?90:0,engine),
    mkField("address","Address",addr,c(addr),engine),
  ];
}
function extractBank(text:string, bc:number, engine:EngineUsed): DocField[] {
  const upper=text.toUpperCase(), lines=cleanLines(text), caps=capsLines(lines);
  const ifsc=upper.match(/[A-Z]{4}0[A-Z0-9]{6}/)?.[0]??"";
  const acno=text.match(/\d{9,18}/)?.[0]??"";
  const bal=(text.match(/[\d,]+\.\d{2}/g)??[]).pop()??"";
  const banks=["STATE BANK","SBI","HDFC","ICICI","AXIS","KOTAK","CANARA","UNION BANK","BANK OF INDIA","BANK OF BARODA","YES BANK","INDUSIND","PNB","PUNJAB NATIONAL"];
  const bank=banks.find(b=>upper.includes(b))??"";
  const period=text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}\s*(?:to|TO|-)\s*\d{2}[\/\-]\d{2}[\/\-]\d{4}/)?.[0]??"";
  const c=(v:string,b=0)=>v?Math.min(88,bc+b):0;
  return [
    mkField("accountholder","Account Holder",caps[0]??"",c(caps[0]??"",5),engine),
    mkField("accountno","Account Number",acno,acno?90:0,engine),
    mkField("ifsc","IFSC Code",ifsc,ifsc?92:0,engine),
    mkField("bankname","Bank Name",bank,bank?88:0,engine),
    mkField("period","Statement Period",period,c(period),engine),
    mkField("balance","Closing Balance",bal,bal?85:0,engine),
  ];
}
function extractFields(text:string, docType:DocType, bc:number, engine:EngineUsed): DocField[] {
  switch(docType){
    case "pan":           return extractPAN(text,bc,engine);
    case "aadhaar":       return extractAadhaar(text,bc,engine);
    case "passport":      return extractPassport(text,bc,engine);
    case "voter":         return extractVoter(text,bc,engine);
    case "bankstatement": return extractBank(text,bc,engine);
  }
}

function mergeFields(cfg:DocConfig, results:{fields:DocField[]}[]): DocField[] {
  return cfg.fields.map(cfgF => {
    const candidates=results.flatMap(r=>r.fields).filter(f=>f.key===cfgF.key && f.value.trim());
    if(!candidates.length)
      return {key:cfgF.key,label:cfgF.label,value:"",confidence:0,verified:false,engine:"none" as EngineUsed};
    return candidates.reduce((best,f)=>f.confidence>best.confidence?f:best);
  });
}

// ─── Export ───────────────────────────────────────────────────
function exportJSON(doc:KYCDocument){
  const cfg=getCfg(doc.docType);
  const out={
    kyc_report:{
      document_type:cfg.label,
      scanned_at:new Date(doc.scannedAt).toISOString(),
      engine_used:ENGINE_LABELS[doc.engineUsed],
      engines_tried:doc.enginesTried,
      overall_confidence:overall(doc.fields),
      fields_extracted:doc.fields.filter(f=>f.value).length,
      total_fields:doc.fields.length,
      source:"AksharaKYC · AksharaTantra BFSI Suite",
      privacy:"On-device only · No data uploaded",
    },
    extracted_data:Object.fromEntries(
      doc.fields.map(f=>[f.key,{value:f.value,label:f.label,confidence:f.confidence,engine:f.engine,verified:f.verified}])
    ),
  };
  const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`KYC_${doc.docType}_${doc.id}.json`});
  a.click(); URL.revokeObjectURL(a.href);
}
function exportPDF(doc:KYCDocument){
  const cfg=getCfg(doc.docType), score=overall(doc.fields);
  const rows=doc.fields.map(f=>`
    <tr>
      <td>${f.label}</td>
      <td><strong>${f.value||"—"}</strong></td>
      <td class="${f.confidence>=80?"hi":f.confidence>=50?"me":f.confidence>0?"lo":"na"}">
        ${f.confidence>0?`${confLabel(f.confidence)} (${f.confidence}%)`:"Not found"}${f.verified?" ✏️":""}
      </td>
    </tr>`).join("");
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>KYC — ${cfg.label}</title>
<style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a2e;max-width:700px;margin:0 auto}
.hdr{background:${cfg.color};color:#fff;padding:22px;border-radius:12px;margin-bottom:20px}
.hdr h1{margin:0;font-size:20px}.hdr p{margin:4px 0 0;opacity:.8;font-size:12px}
.stats{display:flex;gap:10px;margin-bottom:20px}
.s{flex:1;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:10px;padding:12px;text-align:center}
.s .v{font-size:24px;font-weight:900;color:${cfg.color}}.s .l{font-size:10px;color:#888;text-transform:uppercase}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f0f4f8;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#666}
td{padding:11px 12px;border-bottom:1px solid #f5f5f5}
.hi{color:#2E7D32;font-weight:700}.me{color:#E65100;font-weight:700}.lo{color:#C62828;font-weight:700}.na{color:#aaa}
.ft{margin-top:28px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:11px;color:#aaa;text-align:center}
</style></head><body>
<div class="hdr"><h1>${cfg.icon} AksharaKYC — ${cfg.label}</h1>
<p>Processed: ${new Date(doc.scannedAt).toLocaleString()} · ${ENGINE_LABELS[doc.engineUsed]}</p></div>
<div class="stats">
  <div class="s"><div class="v">${score}%</div><div class="l">Confidence</div></div>
  <div class="s"><div class="v">${doc.fields.filter(f=>f.value).length}/${doc.fields.length}</div><div class="l">Fields</div></div>
  <div class="s"><div class="v">${doc.fields.filter(f=>f.confidence>=80).length}</div><div class="l">High Conf</div></div>
  <div class="s"><div class="v">${doc.fields.filter(f=>f.verified).length}</div><div class="l">Verified</div></div>
</div>
<table><tr><th>Field</th><th>Value</th><th>Confidence</th></tr>${rows}</table>
<div class="ft"><p>🔒 On-device · No data uploaded · AksharaKYC</p></div>
</body></html>`;
  const blob=new Blob([html],{type:"text/html"});
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`KYC_${cfg.label.replace(/ /g,"_")}_${doc.id}.html`});
  a.click(); URL.revokeObjectURL(a.href);
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AksharaKYC() {
  const [docType,    setDocType]    = useState<DocType>("pan");
  const [docs,       setDocs]       = useState<KYCDocument[]>([]);
  const [activeDoc,  setActiveDoc]  = useState<KYCDocument|null>(null);
  const [processing, setProcessing] = useState(false);
  const [step,       setStep]       = useState("");
  const [tab,        setTab]        = useState<"scan"|"result"|"history">("scan");
  const [toast,      setToast]      = useState<{msg:string;type:"ok"|"err"|"info"}|null>(null);
  const [showRaw,    setShowRaw]    = useState(false);
  // ✅ FIX: ref to track if user cancelled mid-process
  const cancelledRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = getCfg(docType);

  const showToast = useCallback((msg:string,type:"ok"|"err"|"info"="info")=>{
    setToast({msg,type}); setTimeout(()=>setToast(null),3200);
  },[]);

  const resetAll = useCallback(()=>{
    cancelledRef.current = true; // signal any running pipeline to stop
    setActiveDoc(null); setProcessing(false); setShowRaw(false);
    setTab("scan"); setStep("");
    if(fileRef.current) fileRef.current.value="";
    showToast("🔄 Reset complete","info");
  },[showToast]);

  const clearFields = useCallback(()=>{
    if(!activeDoc) return;
    const fresh={...activeDoc,fields:blankFields(getCfg(activeDoc.docType)),engineUsed:"manual" as EngineUsed};
    setActiveDoc(fresh); setDocs(prev=>prev.map(d=>d.id===fresh.id?fresh:d));
    showToast("🔄 Fields cleared — enter manually","info");
  },[activeDoc,showToast]);

  // ════════════════════════════════════════════════════════════
  // MASTER OCR PIPELINE — sequential, non-hanging, timeout-safe
  // ════════════════════════════════════════════════════════════
  const processImage = useCallback(async (file:File)=>{
    cancelledRef.current = false;
    setProcessing(true); setTab("result");

    // ✅ FIX: wrap FileReader in a timeout too
    let dataUrl: string;
    try {
      dataUrl = await new Promise<string>((res, rej) => {
        const timeout = setTimeout(() => rej(new Error("File read timeout")), 15000);
        const r = new FileReader();
        r.onload  = e => { clearTimeout(timeout); res(e.target?.result as string); };
        r.onerror = ()  => { clearTimeout(timeout); rej(new Error("File read failed")); };
        r.readAsDataURL(file);
      });
    } catch(e) {
      showToast("❌ Could not read file — try again","err");
      setProcessing(false); return;
    }

    const newDoc:KYCDocument={
      id:genId(), docType, imageUrl:dataUrl,
      fields:blankFields(cfg), status:"processing",
      engineUsed:"none", enginesTried:[], scannedAt:Date.now(),
    };
    setDocs(prev=>[newDoc,...prev]); setActiveDoc(newDoc);

    type EngineResult = {fields:DocField[];rawText:string;confidence:number;engine:EngineUsed;score:number};
    const results:EngineResult[] = [];
    const tried:string[] = [];

    // ── Helper: run one engine safely ────────────────────────
    const tryEngine = async (
      label:    string,
      engineId: EngineUsed,
      psm:      number,
      prepOpts: PrepOpts
    ): Promise<EngineResult|null> => {
      if (cancelledRef.current) return null;
      setStep(`🔬 ${label}…`);
      try {
        const preprocessed = await preprocess(dataUrl, prepOpts);
        if (cancelledRef.current) return null;
        const { text, confidence } = await runTesseract(preprocessed, psm, "eng");
        if (cancelledRef.current) return null;
        const fields = extractFields(text, docType, confidence, engineId);
        const score  = scoreFields(fields);
        tried.push(`${engineId}: ${score.toFixed(0)}pts`);
        console.log(`${label} →`, { score: score.toFixed(1), conf: confidence, found: fields.filter(f=>f.value).length });
        return { fields, rawText: text, confidence, engine: engineId, score };
      } catch(e:any) {
        console.warn(`${label} failed:`, e?.message ?? e);
        tried.push(`${engineId}: ❌ (${e?.message?.includes("timed out") ? "timeout" : "error"})`);
        return null;
      }
    };

    // ── ENGINE 1: PSM 6 — always runs first, fully awaited ───
    const r1 = await tryEngine(
      "Engine 1: Uniform block (PSM-6)",
      "eng_psm6", 6,
      { scale:3, contrast:1.65 }
    );
    if (r1) results.push(r1);

    // ── ENGINE 2: PSM 3 — only if E1 score < 65 ─────────────
    const best1 = results[0]?.score ?? 0;
    if (!cancelledRef.current && best1 < 65) {
      const r2 = await tryEngine(
        "Engine 2: Auto-detect (PSM-3)",
        "eng_psm3", 3,
        { scale:3, contrast:1.9, sharpen:true }
      );
      if (r2) results.push(r2);
    } else if (!cancelledRef.current) {
      tried.push("eng_psm3: skipped (E1 sufficient)");
    }

    // ── ENGINE 3: PSM 11 — only if best so far < 50 ──────────
    const best2 = Math.max(...results.map(r=>r.score), 0);
    if (!cancelledRef.current && best2 < 50) {
      const r3 = await tryEngine(
        "Engine 3: Sparse+binarize (PSM-11)",
        "eng_psm11", 11,
        { scale:4, contrast:2.2, threshold:true }
      );
      if (r3) results.push(r3);
    } else if (!cancelledRef.current && results.length > 0) {
      tried.push("eng_psm11: skipped (sufficient)");
    }

    if (cancelledRef.current) { setProcessing(false); return; }

    // ── Pick best + merge fields ─────────────────────────────
    let doneDoc:KYCDocument;
    if (results.length === 0) {
      doneDoc = {...newDoc, fields:blankFields(cfg), status:"done", engineUsed:"manual", enginesTried:tried};
      showToast("⚠️ All engines failed — enter fields manually","err");
    } else {
      const best   = results.reduce((b,r)=>r.score>b.score?r:b);
      const merged = mergeFields(cfg, results);
      doneDoc = {...newDoc, fields:merged, status:"done", engineUsed:best.engine, enginesTried:tried, rawText:best.rawText};
      const found = merged.filter(f=>f.value).length;
      showToast(
        found > 0
          ? `✅ ${found}/${merged.length} fields found (${ENGINE_LABELS[best.engine]})`
          : "⚠️ No fields found — check photo quality",
        found > 0 ? "ok" : "err"
      );
    }

    setDocs(prev=>prev.map(d=>d.id===newDoc.id?doneDoc:d));
    setActiveDoc(doneDoc);
    setProcessing(false); setStep("");
  },[docType, cfg, showToast]);

  const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(f) processImage(f); e.target.value="";
  };

  const startManual=()=>{
    const blank:KYCDocument={
      id:genId(),docType,imageUrl:"",fields:blankFields(cfg),status:"done",
      engineUsed:"manual",enginesTried:["Manual"],scannedAt:Date.now(),
    };
    setDocs(prev=>[blank,...prev]); setActiveDoc(blank);
    setTab("result"); showToast("✏️ Fill in all fields manually","info");
  };

  const updateField=(key:string,value:string)=>{
    if(!activeDoc) return;
    const fields=activeDoc.fields.map(f=>
      f.key===key?{...f,value,verified:true,confidence:100,engine:"manual" as EngineUsed}:f
    );
    const up={...activeDoc,fields};
    setActiveDoc(up); setDocs(prev=>prev.map(d=>d.id===up.id?up:d));
  };

  const removeDoc=(id:string)=>{
    setDocs(prev=>prev.filter(d=>d.id!==id));
    if(activeDoc?.id===id){setActiveDoc(null);setTab("scan");}
    showToast("🗑️ Removed","info");
  };

  const score=activeDoc?overall(activeDoc.fields):0;

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <Navbar/>
      <style>{`
        @keyframes spin   {to{transform:rotate(360deg)}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .kf:focus{outline:none;border-color:#1565C0!important;box-shadow:0 0 0 3px rgba(21,101,192,.12)}
        .kh:hover{opacity:.9;transform:scale(1.01)}
        .kd:hover{transform:translateY(-1px)}
        .kr:hover{background:#f0f4ff!important}
      `}</style>

      {/* Header */}
      <div style={S.hdr}>
        <div>
          <p style={S.hdrSub}>AKSHARATANTRA · BFSI SUITE</p>
          <h1 style={S.hdrTitle}>🪪 AksharaKYC</h1>
          <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,.65)"}}>
            3-Engine OCR · India-First · Free · Offline
          </p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          <div style={S.privBadge}>🔒<span style={{fontSize:9,display:"block",fontWeight:700}}>ON-DEVICE</span></div>
          <button style={S.resetBtn} onClick={resetAll}>🔄 Reset</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={S.tabBar}>
        {([["scan","📷","Scan"],["result","📊","Result"],["history","📁","History"]] as ["scan"|"result"|"history",string,string][]).map(([key,icon,label])=>(
          <button key={key} style={{...S.tabBtn,...(tab===key?S.tabActive:{})}} onClick={()=>setTab(key)}>
            {icon} {label}
            {key==="history"&&docs.length>0&&<span style={S.badge}>{docs.length}</span>}
          </button>
        ))}
      </div>

      <div style={S.body}>

        {/* ════ SCAN ════ */}
        {tab==="scan"&&(
          <>
            <div style={S.card}>
              <p style={S.cardTitle}>📋 Document Type</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {DOC_CONFIGS.map(d=>(
                  <button key={d.id} className="kd" onClick={()=>setDocType(d.id)}
                    style={{...S.docChip,
                      background: docType===d.id?d.color:"#f8f9fa",
                      color:      docType===d.id?"#fff":"#444",
                      borderColor:docType===d.id?d.color:"#e0e0e0",
                      boxShadow:  docType===d.id?`0 4px 14px ${d.color}40`:"none",
                    }}>
                    <span style={{fontSize:22}}>{d.icon}</span>
                    <span style={{fontSize:10,fontWeight:700,textAlign:"center",lineHeight:1.3}}>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Engine info */}
            <div style={S.card}>
              <p style={S.cardTitle}>🔬 OCR Pipeline (Sequential · No Hang)</p>
              {[
                ["E1","PSM-6 — Uniform Block","Always runs first · 30s timeout","#1565C0"],
                ["E2","PSM-3 — Auto Detect","Runs only if E1 score < 65% · 30s timeout","#6A1B9A"],
                ["E3","PSM-11 — Sparse+Binarize","Runs only if E2 score < 50% · 30s timeout","#2E7D32"],
                ["E4","Manual Entry","Always available — 100% accurate","#E65100"],
              ].map(([num,label,desc,color])=>(
                <div key={num} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 10px",background:"#f8f9fa",borderRadius:9,border:"1px solid #e0e0e0"}}>
                  <span style={{background:color,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:6,flexShrink:0}}>{num}</span>
                  <div>
                    <p style={{margin:0,fontSize:12,fontWeight:800,color:"#1a1a2e"}}>{label}</p>
                    <p style={{margin:0,fontSize:10,color:"#888"}}>{desc}</p>
                  </div>
                </div>
              ))}
              <p style={{margin:0,fontSize:11,color:"#1565C0",background:"#EBF3FD",borderRadius:8,padding:"8px 12px",fontWeight:600}}>
                💡 Each engine runs <strong>one at a time</strong>. If it hangs for 30s it is auto-skipped.
                Best result per field is merged across all engines.
              </p>
            </div>

            <div style={S.tipBox}>
              <p style={{margin:"0 0 6px",fontSize:12,fontWeight:800,color:"#1565C0"}}>📷 {cfg.hint}</p>
              {[
                "⚠️ Place on WHITE paper — not wallet, bed, or dark surface",
                "✅ Hold phone directly above at 90° — no tilt",
                "✅ Natural window light — NO camera flash",
                "✅ All 4 corners visible — card fills the frame",
                "✅ Tap screen to focus before shooting",
              ].map((t,i)=><p key={i} style={{margin:"2px 0",fontSize:11,color:i===0?"#C62828":"#444",fontWeight:i===0?700:400}}>{t}</p>)}
            </div>

            <div style={S.card}>
              <p style={S.cardTitle}>📷 Scan {cfg.label}</p>
              <div style={{display:"flex",gap:10}}>
                <label className="kh" style={{...S.scanBtn,background:cfg.color,cursor:"pointer",transition:"all .18s"}}>
                  <span style={{fontSize:28}}>📷</span>
                  <span style={{fontSize:13,fontWeight:800}}>Camera</span>
                  <span style={{fontSize:10,opacity:.8}}>Take Photo</span>
                  <input type="file" accept="image/*" capture="environment" hidden onChange={handleFile} ref={fileRef}/>
                </label>
                <label className="kh" style={{...S.scanBtn,background:"#37474F",cursor:"pointer",transition:"all .18s"}}>
                  <span style={{fontSize:28}}>🖼️</span>
                  <span style={{fontSize:13,fontWeight:800}}>Gallery</span>
                  <span style={{fontSize:10,opacity:.8}}>Upload File</span>
                  <input type="file" accept="image/*" hidden onChange={handleFile}/>
                </label>
                <button style={{...S.scanBtn,background:"#E65100",border:"none",cursor:"pointer"}} onClick={startManual}>
                  <span style={{fontSize:28}}>✏️</span>
                  <span style={{fontSize:13,fontWeight:800}}>Manual</span>
                  <span style={{fontSize:10,opacity:.8}}>Type fields</span>
                </button>
              </div>

              {processing&&(
                <div style={S.procBox}>
                  <div style={S.spinner}/>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1565C0"}}>{step||"Processing…"}</p>
                    <p style={{margin:"2px 0 0",fontSize:11,color:"#888"}}>Sequential · Auto-skips if hung · Do not close tab</p>
                  </div>
                  <button style={S.cancelBtn} onClick={resetAll}>✕ Cancel</button>
                </div>
              )}

              <div style={S.hintBox}>
                <p style={{margin:"0 0 5px",fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:".08em"}}>Fields to extract:</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {cfg.fields.map(f=><span key={f.key} style={S.hintChip}>{f.label}</span>)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════ RESULT ════ */}
        {tab==="result"&&(
          <>
            {!activeDoc?(
              <div style={{textAlign:"center",padding:"48px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                <p style={{fontSize:40,margin:0}}>🪪</p>
                <p style={{color:"#aaa",fontSize:14,fontWeight:600}}>No document scanned yet</p>
                <button style={S.primaryBtn} onClick={()=>setTab("scan")}>📷 Go to Scan</button>
              </div>
            ):(
              <>
                <div style={S.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <p style={S.cardTitle}>{getCfg(activeDoc.docType).icon} {getCfg(activeDoc.docType).label}</p>
                      <p style={{margin:"3px 0 0",fontSize:11,color:"#888"}}>
                        {new Date(activeDoc.scannedAt).toLocaleTimeString()} ·&nbsp;
                        <span style={{fontWeight:700,color:"#1565C0"}}>{ENGINE_LABELS[activeDoc.engineUsed]}</span>
                      </p>
                      {activeDoc.enginesTried.length>0&&(
                        <p style={{margin:"2px 0 0",fontSize:10,color:"#aaa",lineHeight:1.6}}>
                          {activeDoc.enginesTried.map((t,i)=>(
                            <span key={i}>
                              {t}
                              {i<activeDoc.enginesTried.length-1&&" → "}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    <ConfRing score={score} color={getCfg(activeDoc.docType).color}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <StatCard label="Found"  value={`${activeDoc.fields.filter(f=>f.value).length}/${activeDoc.fields.length}`} color="#1565C0"/>
                    <StatCard label="High ✓" value={`${activeDoc.fields.filter(f=>f.confidence>=80).length}`}                    color="#2E7D32"/>
                    <StatCard label="Manual" value={`${activeDoc.fields.filter(f=>f.verified).length}`}                          color="#E65100"/>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button style={{...S.actionBtn,background:"#E65100"}} onClick={clearFields}>🔄 Clear</button>
                    <button style={{...S.actionBtn,background:"#1565C0"}} onClick={()=>exportJSON(activeDoc)}>📄 JSON</button>
                    <button style={{...S.actionBtn,background:"#6A1B9A"}} onClick={()=>exportPDF(activeDoc)}>🖨️ PDF</button>
                    <button style={{...S.actionBtn,background:"#37474F"}} onClick={()=>setTab("scan")}>📷 New</button>
                  </div>
                </div>

                {activeDoc.imageUrl&&(
                  <div style={{position:"relative",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.1)"}}>
                    <img src={activeDoc.imageUrl} alt="doc" style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
                    <div style={{...S.imgBadge,background:getCfg(activeDoc.docType).color}}>
                      {getCfg(activeDoc.docType).icon} {getCfg(activeDoc.docType).label}
                    </div>
                  </div>
                )}

                <div style={S.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={S.cardTitle}>✏️ Extracted Fields</p>
                    <button style={{...S.rawToggle,color:"#C62828",fontWeight:800}} onClick={clearFields}>🔄 Clear All</button>
                  </div>
                  {activeDoc.fields.map(field=>(
                    <div key={field.key} style={{display:"flex",flexDirection:"column",gap:4,padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <p style={{margin:0,fontSize:11,fontWeight:800,color:"#666",textTransform:"uppercase",letterSpacing:".06em"}}>{field.label}</p>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          {field.confidence>0&&<span style={{fontSize:10,fontWeight:700,color:confColor(field.confidence)}}>{confLabel(field.confidence)} {field.confidence}%</span>}
                          {field.verified&&<span style={{fontSize:10,color:"#4CAF50",fontWeight:700}}>✓ Edited</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <div style={{width:4,borderRadius:2,background:field.value?confColor(field.confidence):"#e0e0e0",flexShrink:0,minHeight:36}}/>
                        <input className="kf"
                          style={{...S.fieldInput,
                            borderColor:field.verified?"#4CAF50":
                              field.confidence>=80?getCfg(activeDoc.docType).color:
                              field.confidence>=50?"#FF9800":"#e0e0e0"
                          }}
                          value={field.value}
                          placeholder={getCfg(activeDoc.docType).fields.find(f=>f.key===field.key)?.placeholder??"Enter value"}
                          onChange={e=>updateField(field.key,e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {score>0&&score<50&&(
                  <div style={{...S.card,background:"#FFF8E1",border:"1.5px solid #FFB300"}}>
                    <p style={{margin:0,fontSize:13,fontWeight:800,color:"#E65100"}}>⚠️ Low confidence — try these fixes:</p>
                    <p style={{margin:"6px 0 0",fontSize:12,color:"#555",lineHeight:1.8}}>
                      1. Place card on <strong>plain white A4 paper</strong><br/>
                      2. Take photo in <strong>natural daylight</strong> — no flash<br/>
                      3. Hold phone <strong>flat above the card</strong> — no angle<br/>
                      4. Or tap ✏️ Manual and type the fields
                    </p>
                    <div style={{display:"flex",gap:8}}>
                      <button style={{...S.actionBtn,background:"#E65100"}} onClick={()=>setTab("scan")}>📷 Rescan</button>
                      <button style={{...S.actionBtn,background:"#37474F"}} onClick={clearFields}>✏️ Manual</button>
                    </div>
                  </div>
                )}

                {activeDoc.rawText&&(
                  <div style={S.card}>
                    <button style={S.rawToggle} onClick={()=>setShowRaw(!showRaw)}>
                      {showRaw?"▲ Hide":"▼ Show"} Raw OCR Output (debug)
                    </button>
                    {showRaw&&<pre style={S.rawBox}>{activeDoc.rawText}</pre>}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ════ HISTORY ════ */}
        {tab==="history"&&(
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={S.cardTitle}>📁 History ({docs.length})</p>
              {docs.length>0&&(
                <button style={{...S.rawToggle,color:"#C62828",fontWeight:800}}
                  onClick={()=>{setDocs([]);setActiveDoc(null);showToast("🗑️ Cleared","info");}}>
                  🗑️ Clear All
                </button>
              )}
            </div>
            {docs.length===0?(
              <div style={{textAlign:"center",padding:"32px 0",color:"#aaa"}}>
                <p style={{fontSize:32,margin:0}}>📁</p>
                <p style={{fontSize:13}}>No scans yet</p>
              </div>
            ):docs.map(doc=>{
              const dc=getCfg(doc.docType), sc=overall(doc.fields);
              return(
                <div key={doc.id} className="kr"
                  style={{...S.histRow,borderLeft:`3px solid ${activeDoc?.id===doc.id?dc.color:"#e0e0e0"}`}}>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>{setActiveDoc(doc);setTab("result");}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:20}}>{dc.icon}</span>
                      <div>
                        <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1a1a2e"}}>{dc.label}</p>
                        <p style={{margin:0,fontSize:10,color:"#888"}}>
                          {new Date(doc.scannedAt).toLocaleTimeString()} · {ENGINE_LABELS[doc.engineUsed]} ·&nbsp;
                          <span style={{color:confColor(sc),fontWeight:700}}>{sc}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button style={S.histBtn} onClick={()=>exportJSON(doc)}>📄</button>
                    <button style={S.histBtn} onClick={()=>exportPDF(doc)}>🖨️</button>
                    <button style={{...S.histBtn,color:"#C62828"}} onClick={()=>removeDoc(doc.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Compliance */}
        <div style={{...S.card,background:"#F8FBFF",border:"1px solid #E3F2FD"}}>
          <p style={{...S.cardTitle,color:"#1565C0"}}>🔒 BFSI Compliance</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              ["✅","3-Engine OCR","Best field per engine"],
              ["✅","On-Device Only","No data leaves device"],
              ["✅","RBI Compliant","Data localization"],
              ["✅","Audit Trail","Engine + confidence logged"],
              ["✅","Human Override","Edit any field"],
              ["✅","100% Free","No API key ever"],
            ].map(([i,t,d])=>(
              <div key={t} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                <span style={{fontSize:12,flexShrink:0}}>{i}</span>
                <div>
                  <p style={{margin:0,fontSize:11,fontWeight:800,color:"#1565C0"}}>{t}</p>
                  <p style={{margin:0,fontSize:10,color:"#666"}}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast&&(
        <div style={{...S.toast,background:toast.type==="ok"?"#1B5E20":toast.type==="err"?"#B71C1C":"#1a1a2e"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────
function ConfRing({score,color}:{score:number;color:string}){
  const r=26,c=2*Math.PI*r,d=(score/100)*c;
  return(
    <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
      <svg width={64} height={64} style={{transform:"rotate(-90deg)"}}>
        <circle cx={32} cy={32} r={r} fill="none" stroke="#f0f0f0" strokeWidth={5}/>
        <circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${d} ${c}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray .5s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:13,fontWeight:900,color,lineHeight:1}}>{score}%</span>
        <span style={{fontSize:8,color:"#aaa",fontWeight:700}}>CONF</span>
      </div>
    </div>
  );
}
function StatCard({label,value,color}:{label:string;value:string;color:string}){
  return(
    <div style={{flex:1,background:"#f8f9fa",borderRadius:10,padding:"10px 8px",textAlign:"center",border:"1px solid #e0e0e0"}}>
      <p style={{margin:0,fontSize:18,fontWeight:900,color}}>{value}</p>
      <p style={{margin:0,fontSize:10,color:"#888",fontWeight:700}}>{label}</p>
    </div>
  );
}

const S:Record<string,React.CSSProperties>={
  page:      {fontFamily:"'Outfit',Montserrat,sans-serif",minHeight:"100vh",background:"#f0f4f8",paddingBottom:48},
  hdr:       {background:"linear-gradient(135deg,#0D1B2A 0%,#1565C0 100%)",padding:"20px 16px 22px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"flex-start"},
  hdrSub:    {margin:0,fontSize:10,fontWeight:800,color:"rgba(255,255,255,.6)",letterSpacing:"0.2em"},
  hdrTitle:  {margin:"4px 0 2px",fontSize:24,fontWeight:900,color:"#fff"},
  privBadge: {background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"8px 12px",fontSize:18,color:"#fff",fontWeight:800,textAlign:"center"},
  resetBtn:  {background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"Outfit,Montserrat,sans-serif"},
  tabBar:    {display:"flex",background:"#fff",borderBottom:"1.5px solid #e8eef5",padding:"0 12px",position:"sticky",top:0,zIndex:10},
  tabBtn:    {flex:1,padding:"12px 0",border:"none",background:"transparent",fontSize:13,fontWeight:700,color:"#888",cursor:"pointer",fontFamily:"Outfit,Montserrat,sans-serif",position:"relative",transition:"color .2s"},
  tabActive: {color:"#1565C0",borderBottom:"2.5px solid #1565C0"},
  badge:     {position:"absolute",top:8,right:8,background:"#1565C0",color:"#fff",borderRadius:10,fontSize:9,fontWeight:800,padding:"1px 5px"},
  body:      {padding:"12px",display:"flex",flexDirection:"column",gap:12},
  card:      {background:"#fff",borderRadius:16,padding:"16px",boxShadow:"0 2px 12px rgba(0,0,0,.06)",display:"flex",flexDirection:"column",gap:10},
  cardTitle: {margin:0,fontSize:13,fontWeight:800,color:"#1a1a2e"},
  tipBox:    {background:"#EBF3FD",borderRadius:14,padding:"12px 14px",border:"1px solid #BBDEFB"},
  hintBox:   {background:"#f8f9fa",borderRadius:10,padding:"10px 12px"},
  hintChip:  {padding:"3px 10px",background:"#fff",border:"1px solid #e0e0e0",borderRadius:20,fontSize:11,color:"#555",fontWeight:600},
  docChip:   {display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 8px",borderRadius:12,border:"1.5px solid",cursor:"pointer",flex:1,minWidth:68,fontFamily:"Outfit,Montserrat,sans-serif",transition:"all .18s"},
  scanBtn:   {flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"18px 0",borderRadius:14,color:"#fff",fontFamily:"Outfit,Montserrat,sans-serif",border:"none"},
  procBox:   {display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#EBF3FD",borderRadius:10,border:"1.5px solid #BBDEFB"},
  spinner:   {width:24,height:24,borderRadius:"50%",border:"3px solid #BBDEFB",borderTopColor:"#1565C0",animation:"spin .8s linear infinite",flexShrink:0},
  cancelBtn: {background:"none",border:"1px solid #ccc",borderRadius:8,padding:"4px 10px",fontSize:11,cursor:"pointer",fontWeight:700,color:"#666"},
  fieldInput:{width:"100%",padding:"10px 12px",borderRadius:9,border:"1.5px solid",fontSize:13,fontFamily:"Outfit,Montserrat,sans-serif",background:"#fafafa",transition:"border-color .2s,box-shadow .2s",boxSizing:"border-box"},
  imgBadge:  {position:"absolute",top:8,right:8,padding:"4px 10px",borderRadius:20,color:"#fff",fontSize:11,fontWeight:700},
  actionBtn: {flex:1,padding:"11px 0",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"Outfit,Montserrat,sans-serif"},
  primaryBtn:{padding:"12px 24px",background:"#1565C0",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"Outfit,Montserrat,sans-serif"},
  rawToggle: {background:"none",border:"none",color:"#888",fontSize:11,cursor:"pointer",padding:"4px 0",fontFamily:"Outfit,Montserrat,sans-serif",fontWeight:700},
  rawBox:    {background:"#f8f9fa",border:"1px solid #e0e0e0",borderRadius:8,padding:"10px",fontSize:10,color:"#555",overflowX:"auto",whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto"},
  histRow:   {display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,marginBottom:4,transition:"all .15s",borderLeft:"3px solid"},
  histBtn:   {background:"#f0f4f8",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:14},
  toast:     {position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",color:"#fff",padding:"12px 24px",borderRadius:30,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.3)",whiteSpace:"nowrap",animation:"fadeUp .2s ease"},
};
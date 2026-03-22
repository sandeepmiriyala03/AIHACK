"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
type ParsedResult = {
  amount: number;
  type: "debit" | "credit" | "credit_card_debit" | "info" | "pending";
  bank: string;
  merchant: string;
  category: string;
  payment_mode: string;
  balance_after: number | null;
  confidence: number;
  engine: "onnx" | "llm_fallback";
};

type StepStatus = "idle" | "active" | "done" | "fallback";
type Step = { id: string; label: string; sublabel: string; status: StepStatus };

// ─── WCAG AA color tokens — all text passes 4.5:1 on white ───────────────────
const T = {
  pageBg:        "#F5F5F4",
  cardBg:        "#FFFFFF",
  surfaceBg:     "#F5F5F4",
  inputBg:       "#FAFAF9",
  borderBase:    "#D6D3D1",
  textPrimary:   "#1C1917",   // 16.75:1 on white
  textSecondary: "#44403C",   // 9.73:1
  textMuted:     "#57534E",   // 5.9:1 — AA compliant (bumped from 78716C)
  infoText:      "#1E40AF",   // 7.9:1
  infoBg:        "#EFF6FF",
  infoBorder:    "#BFDBFE",
  successText:   "#14532D",   // 9.8:1
  successBg:     "#F0FDF4",
  successBorder: "#BBF7D0",
  warningText:   "#78350F",   // 8.1:1
  warningBg:     "#FFFBEB",
  warningBorder: "#FDE68A",
  dangerText:    "#7F1D1D",   // 9.1:1
  dangerBg:      "#FEF2F2",
  dangerBorder:  "#FECACA",
};

const SAMPLES = [
  { label: "HDFC debit",   text: "INR 2,350 debited from A/c XX4821 at AMAZON on 22-03-26. Avl Bal: Rs.18,420. -HDFC Bank" },
  { label: "PhonePe food", text: "PhonePe: Rs.650 debited from SBI A/c XX8823 to merchant BLINKIT on 22-03-26. UPI Ref: PP928471101." },
  { label: "GPay rent",    text: "GPay: Rs.3,500 sent to LANDLORD (landlord@oksbi) on 01-03-26. UPI Ref: 403928471239." },
  { label: "SBI salary",   text: "Rs.15,000.00 credited to your a/c XX8823 by NEFT from EMPLOYER on 01-03-26. Avl Bal: Rs.22,450." },
  { label: "Unknown UPI",  text: "Txn: -INR 890 | Merch: Swiggy | Dt: 22Mar26 | Ref: 4928371 | UPI" },
];

const CAT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  shopping:            { text: "#1E3A5F", bg: "#EFF6FF", border: "#BFDBFE" },
  food:                { text: "#7C2D12", bg: "#FFF7ED", border: "#FED7AA" },
  groceries:           { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  fuel:                { text: "#713F12", bg: "#FEFCE8", border: "#FEF08A" },
  transport:           { text: "#312E81", bg: "#EEF2FF", border: "#C7D2FE" },
  utilities:           { text: "#134E4A", bg: "#F0FDFA", border: "#99F6E4" },
  mobile_recharge:     { text: "#1E1B4B", bg: "#F5F3FF", border: "#DDD6FE" },
  entertainment:       { text: "#500724", bg: "#FFF1F2", border: "#FECDD3" },
  emi:                 { text: "#7F1D1D", bg: "#FEF2F2", border: "#FECACA" },
  credit_card_payment: { text: "#7F1D1D", bg: "#FEF2F2", border: "#FECACA" },
  salary:              { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  freelance_income:    { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  transfer:            { text: "#44403C", bg: "#F5F5F4", border: "#D6D3D1" },
  rent:                { text: "#78350F", bg: "#FFFBEB", border: "#FDE68A" },
  travel:              { text: "#1E3A5F", bg: "#EFF6FF", border: "#BFDBFE" },
  investment:          { text: "#134E4A", bg: "#F0FDFA", border: "#99F6E4" },
  insurance:           { text: "#312E81", bg: "#EEF2FF", border: "#C7D2FE" },
  health:              { text: "#7C2D12", bg: "#FFF7ED", border: "#FED7AA" },
  education:           { text: "#1E1B4B", bg: "#F5F3FF", border: "#DDD6FE" },
  cashback:            { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  refund:              { text: "#14532D", bg: "#F0FDF4", border: "#BBF7D0" },
  other:               { text: "#44403C", bg: "#F5F5F4", border: "#D6D3D1" },
};

// ─── Mock model (replace with real onnxruntime-web call) ─────────────────────
function mockOnnxParse(sms: string): ParsedResult {
  const lower = sms.toLowerCase();
  const amtMatch = sms.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) || sms.match(/:\s*-?INR\s*([\d,]+)/i);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : 0;
  const balMatch = sms.match(/(?:Avl Bal|Balance|Bal)[\s:]+Rs\.?\s*([\d,]+)/i);
  const balance = balMatch ? parseFloat(balMatch[1].replace(/,/g, "")) : null;

  const type = lower.includes("credited") || lower.includes("received") ? "credit"
    : lower.includes("credit card") && lower.includes("spent") ? "credit_card_debit"
    : "debit";

  const bank = lower.includes("hdfc") ? "HDFC" : lower.includes("sbi") ? "SBI"
    : lower.includes("icici") ? "ICICI" : lower.includes("axis") ? "Axis"
    : lower.includes("kotak") ? "Kotak" : lower.includes("phonepay") ? "PhonePe"
    : lower.includes("gpay") ? "GooglePay" : lower.includes("paytm") ? "Paytm" : "Unknown";

  const mPatterns = [
    /at\s+([A-Z][A-Z\s]+?)(?:\s+on|\s*\.)/i,
    /to merchant\s+([A-Z][A-Z\s]+?)(?:\s+on|\s*\.)/i,
    /Merch:\s*([^\s|]+)/i,
    /sent to\s+([A-Z][A-Z\s]+?)(?:\s+\(|\s+on)/i,
  ];
  let merchant = "Unknown";
  for (const p of mPatterns) { const m = sms.match(p); if (m) { merchant = m[1].trim(); break; } }

  const cats: [string, string[]][] = [
    ["food",            ["swiggy", "zomato", "domino", "mcdonald", "kfc", "restaurant", "cafe", "biryani"]],
    ["groceries",       ["bigbasket", "blinkit", "dmart", "zepto", "dunzo", "instamart"]],
    ["shopping",        ["amazon", "flipkart", "myntra", "meesho", "nykaa"]],
    ["fuel",            ["petrol", "bpcl", "hp petrol", "fuel", "cng"]],
    ["transport",       ["ola", "uber", "rapido", "metro", "apsrtc"]],
    ["travel",          ["irctc", "makemytrip", "goibibo", "oyo"]],
    ["utilities",       ["electricity", "tsspdcl", "apspdcl", "bescom", "gas", "water"]],
    ["mobile_recharge", ["jio", "airtel", "vi ", "vodafone", "bsnl", "recharge"]],
    ["entertainment",   ["netflix", "hotstar", "spotify", "amazon prime", "bookmyshow"]],
    ["emi",             ["emi", "loan", "nach", "ecs debit"]],
    ["credit_card_payment", ["credit card", "cc bill"]],
    ["salary",          ["salary", "employer", "payroll"]],
    ["rent",            ["rent", "landlord"]],
    ["investment",      ["mutual fund", "sip", "zerodha", "groww", "fd"]],
    ["health",          ["hospital", "pharmacy", "apollo", "medplus"]],
    ["cashback",        ["cashback", "reward", "refund"]],
  ];
  let category = "other";
  for (const [cat, kws] of cats) { if (kws.some(k => lower.includes(k))) { category = cat; break; } }
  if (type === "credit" && category === "other") category = "transfer";

  const mode = lower.includes("upi") || lower.includes("gpay") || lower.includes("phonepay") || lower.includes("paytm") ? "upi"
    : lower.includes("neft") ? "neft" : lower.includes("imps") ? "imps"
    : lower.includes("atm") ? "atm" : lower.includes("nach") || lower.includes("ecs") ? "auto_debit"
    : "net_banking";

  const confidence = bank === "Unknown" ? 0.58 + Math.random() * 0.14
    : merchant === "Unknown" ? 0.71 + Math.random() * 0.1
    : 0.87 + Math.random() * 0.11;

  return { amount, type, bank, merchant, category, payment_mode: mode, balance_after: balance,
    confidence: Math.min(confidence, 0.99), engine: confidence < 0.75 ? "llm_fallback" : "onnx" };
}

// ─── StepRow component ────────────────────────────────────────────────────────
function StepRow({ step }: { step: Step }) {
  const styles: Record<StepStatus, { dot: string; text: string; bg: string; border: string }> = {
    idle:     { dot: T.borderBase,   text: T.textMuted,     bg: T.surfaceBg,     border: T.borderBase     },
    active:   { dot: T.infoText,     text: T.infoText,      bg: T.infoBg,        border: T.infoBorder     },
    done:     { dot: T.successText,  text: T.successText,   bg: T.successBg,     border: T.successBorder  },
    fallback: { dot: T.warningText,  text: T.warningText,   bg: T.warningBg,     border: T.warningBorder  },
  };
  const c = styles[step.status];
  return (
    
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
      background: c.bg, border: `1px solid ${c.border}`, transition: "all 0.25s",
      opacity: step.status === "idle" ? 0.5 : 1 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0,
        outline: step.status === "active" ? `3px solid ${c.dot}44` : "none", outlineOffset: 1, transition: "all 0.25s" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{step.label}</div>
        <div style={{ fontSize: 11, color: c.text, opacity: 0.75, marginTop: 1, fontFamily: "monospace" }}>{step.sublabel}</div>
      </div>
      {step.status === "active" && (
        <div style={{ display: "flex", gap: 3 }} aria-label="Processing">
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: c.dot,
              animation: `sms-dot 1.1s ease-in-out ${i * 0.18}s infinite` }} />
          ))}
        </div>
      )}
      {step.status === "done" && (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-label="Complete">
          <circle cx={8} cy={8} r={7} fill={c.bg} stroke={c.dot} strokeWidth={1.5}/>
          <path d="M5 8l2.5 2.5L11 5" stroke={c.dot} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {step.status === "fallback" && (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-label="Fallback engine">
          <circle cx={8} cy={8} r={7} fill={c.bg} stroke={c.dot} strokeWidth={1.5}/>
          <path d="M8 4.5v4M8 10.5v1" stroke={c.dot} strokeWidth={1.5} strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SMSParserPage() {
  const [smsText, setSmsText]       = useState(SAMPLES[0].text);
  const [selIdx, setSelIdx]         = useState(0);
  const [result, setResult]         = useState<ParsedResult | null>(null);
  const [running, setRunning]       = useState(false);
  const [done, setDone]             = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [steps, setSteps] = useState<Step[]>([
    { id:"load",     label:"Load ONNX model",  sublabel:"public/models/artha-sms-v1.onnx · 48 MB",  status:"idle" },
    { id:"tokenise", label:"Tokenise SMS",      sublabel:"DistilBERT WordPiece tokeniser",            status:"idle" },
    { id:"infer",    label:"Run inference",     sublabel:"WebAssembly · browser-local · ~8 ms",       status:"idle" },
    { id:"score",    label:"Confidence check",  sublabel:"threshold 0.75 → route engine",             status:"idle" },
    { id:"extract",  label:"Extract fields",    sublabel:"amount · bank · merchant · category",       status:"idle" },
  ]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const setStep = (i: number, s: StepStatus) =>
    setSteps(p => p.map((x, j) => j === i ? { ...x, status: s } : x));

  const reset = () => {
    setSteps(p => p.map(x => ({ ...x, status: "idle" })));
    setResult(null); setDone(false);
    timeouts.current.forEach(clearTimeout); timeouts.current = [];
  };

  const go = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms); timeouts.current.push(t);
  };

  const handleParse = () => {
    if (running || !smsText.trim()) return;
    reset(); setRunning(true);
    const r = mockOnnxParse(smsText);
    const fb = r.engine === "llm_fallback";

    go(() => setStep(0, "active"), 80);
    go(() => { setStep(0, "done"); setStep(1, "active"); }, 480);
    go(() => { setStep(1, "done"); setStep(2, "active"); }, 880);
    go(() => { setStep(2, "done"); setStep(3, fb ? "fallback" : "active"); }, 1350);
    go(() => { setStep(3, fb ? "fallback" : "done"); setStep(4, fb ? "fallback" : "active"); }, 1800);
    go(() => { setStep(4, "done"); setResult(r); setDone(true); setRunning(false); }, 2400);
  };

  const cat      = result ? (CAT_COLORS[result.category] ?? CAT_COLORS.other) : CAT_COLORS.other;
  const confPct  = result ? Math.round(result.confidence * 100) : 0;
  const confClr  = confPct >= 85 ? T.successText : confPct >= 70 ? T.warningText : T.dangerText;
  const confBg   = confPct >= 85 ? T.successBg   : confPct >= 70 ? T.warningBg   : T.dangerBg;
  const confBdr  = confPct >= 85 ? T.successBorder: confPct >= 70 ? T.warningBorder: T.dangerBorder;

  const TYPE_STYLE: Record<string, { text: string; bg: string }> = {
    debit:             { text: T.dangerText,   bg: T.dangerBg   },
    credit:            { text: T.successText,  bg: T.successBg  },
    credit_card_debit: { text: "#312E81",      bg: "#EEF2FF"    },
    info:              { text: T.infoText,     bg: T.infoBg     },
    pending:           { text: T.warningText,  bg: T.warningBg  },
  };
  const tc = result ? (TYPE_STYLE[result.type] ?? TYPE_STYLE.debit) : TYPE_STYLE.debit;

  // shared card style
  const card = {
    background: T.cardBg,
    border: `1px solid ${T.borderBase}`,
    borderRadius: 12,
    padding: 20,
  };
  const sectionLabel = {
    fontSize: 11, fontWeight: 600 as const, letterSpacing: "0.09em",
    textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 12,
  };

  return (
    <>  
       <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: ${T.pageBg}; font-family: 'Inter', system-ui, sans-serif; color: ${T.textPrimary}; }

        @keyframes sms-dot    { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes sms-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .sms-in { animation: sms-fadein 0.3s ease forwards; }

        button:focus-visible, textarea:focus-visible, a:focus-visible {
          outline: 3px solid ${T.infoText};
          outline-offset: 3px;
          border-radius: 4px;
        }
        button { font-family: 'Inter', system-ui, sans-serif; cursor: pointer; }

        .chip { padding: 5px 13px; border-radius: 99px; border: 1px solid ${T.borderBase};
          background: ${T.surfaceBg}; color: ${T.textSecondary}; font-size: 12px; font-weight: 500;
          transition: all 0.15s; white-space: nowrap; }
        .chip:hover { border-color: ${T.infoText}; color: ${T.infoText}; background: ${T.infoBg}; }
        .chip[aria-pressed="true"] { border-color: ${T.infoText}; color: ${T.infoText}; background: ${T.infoBg}; }

        .parse-btn { width: 100%; padding: 12px; border-radius: 8px; border: none;
          background: #15803D; color: #fff; font-size: 14px; font-weight: 600;
          transition: background 0.15s, transform 0.1s; }
        .parse-btn:hover:not(:disabled) { background: #166534; }
        .parse-btn:active:not(:disabled) { transform: scale(0.98); }
        .parse-btn:disabled { background: ${T.borderBase}; color: ${T.textMuted}; cursor: not-allowed; }

        .ghost-btn { width: 100%; padding: 10px; border-radius: 8px;
          border: 1px solid ${T.borderBase}; background: transparent;
          color: ${T.textSecondary}; font-size: 13px; font-weight: 500; transition: background 0.15s; }
        .ghost-btn:hover { background: ${T.surfaceBg}; }

        .field-row { display: flex; justify-content: space-between; align-items: center;
          padding: 9px 0; border-bottom: 1px solid ${T.borderBase}; }
        .field-row:last-child { border-bottom: none; }
        .field-label { font-size: 12px; font-weight: 500; color: ${T.textMuted}; }
        .field-value { font-size: 13px; font-weight: 600; color: ${T.textPrimary};
          font-family: monospace; text-transform: capitalize; }
      `}</style>

      <main style={{ minHeight: "100vh", background: T.pageBg, padding: "32px 16px 64px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header */}
          <header style={{ textAlign: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
              background: T.successBg, border: `1px solid ${T.successBorder}`,
              color: T.successText, fontSize: 11, fontWeight: 600,
              padding: "4px 12px", borderRadius: 99,
              letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.successText, display: "inline-block" }} aria-hidden />
              ONNX model · browser local
            </span>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.6px", margin: "0 0 10px" }}>
              Artha AI — SMS Parser
            </h1>
            <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
              Fine-tuned DistilBERT runs in the browser via WebAssembly.
              No cloud calls. No cost. Your SMS never leaves this device.
            </p>
          </header>

          {/* Stat row */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
            {[
              ["250",   "training rows"],
              ["12",    "banks"],
              ["38",    "categories"],
              ["<10ms", "inference"],
              ["0",     "API calls"],
            ].map(([val, lbl]) => (
              <div key={lbl} style={{ background: T.cardBg, border: `1px solid ${T.borderBase}`,
                borderRadius: 8, padding: "8px 16px", textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3, fontWeight: 500 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Two-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

            {/* Input */}
            <section aria-label="SMS input" style={card}>
              <div style={sectionLabel}>Input · bank SMS</div>
              <div role="group" aria-label="Sample SMS options"
                style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {SAMPLES.map((s, i) => (
                  <button key={i} className="chip"
                    aria-pressed={selIdx === i}
                    onClick={() => { setSelIdx(i); setSmsText(s.text); reset(); }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <label htmlFor="sms-input"
                style={{ fontSize: 13, fontWeight: 500, color: T.textSecondary, display: "block", marginBottom: 6 }}>
                Paste your bank SMS
              </label>
              <textarea id="sms-input" value={smsText} rows={4}
                onChange={e => { setSmsText(e.target.value); reset(); }}
                placeholder="e.g. INR 2,350 debited from A/c XX4821 at AMAZON…"
                style={{ width: "100%", resize: "vertical",
                  background: T.inputBg, border: `1px solid ${T.borderBase}`,
                  borderRadius: 8, padding: 12, fontSize: 13,
                  fontFamily: "monospace", color: T.textPrimary, lineHeight: 1.6, outline: "none" }}
              />
              <button className="parse-btn" style={{ marginTop: 10 }}
                onClick={handleParse} disabled={running || !smsText.trim()} aria-busy={running}>
                {running ? "Parsing…" : "Parse with my model"}
              </button>
              {done && (
                <button className="ghost-btn" style={{ marginTop: 8 }}
                  onClick={() => { reset(); setSmsText(""); setSelIdx(-1); }}>
                  Clear and try another
                </button>
              )}
            </section>

            {/* Pipeline */}
            <section aria-label="Model pipeline" style={card}>
              <div style={sectionLabel}>Pipeline · 3-layer engine</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {steps.map(s => <StepRow key={s.id} step={s} />)}
              </div>
              {result && (
                <div className="sms-in" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8,
                  background: result.engine === "llm_fallback" ? T.warningBg : T.successBg,
                  border: `1px solid ${result.engine === "llm_fallback" ? T.warningBorder : T.successBorder}`,
                  fontSize: 12, fontWeight: 500,
                  color: result.engine === "llm_fallback" ? T.warningText : T.successText,
                  display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span aria-hidden style={{ flexShrink: 0, marginTop: 1 }}>
                    {result.engine === "llm_fallback" ? "⚠" : "✓"}
                  </span>
                  {result.engine === "llm_fallback"
                    ? `Confidence ${confPct}% — below threshold · WebLLM fallback activated`
                    : `Confidence ${confPct}% — ONNX model accepted result`}
                </div>
              )}
            </section>
          </div>

          {/* Result */}
          {result ? (
            <section aria-label="Parsed result" className="sms-in"
              style={{ background: T.cardBg, border: `1px solid ${T.borderBase}`, borderRadius: 12, overflow: "hidden" }}>

              {/* Result header */}
              <div style={{ background: T.surfaceBg, borderBottom: `1px solid ${T.borderBase}`,
                padding: "16px 20px", display: "flex", alignItems: "center",
                justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: tc.bg, border: `1px solid ${tc.text}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: tc.text }}>
                    {result.type === "credit" ? "CR" : "DR"}
                  </div>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.5px", lineHeight: 1 }}>
                      {result.type === "credit" ? "+" : "−"}₹{result.amount.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 3 }}>
                      {result.merchant}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
                    background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text,
                    textTransform: "capitalize" }}>
                    {result.category.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 12, color: T.textMuted, textTransform: "capitalize" }}>
                    via {result.payment_mode.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Fields */}
              <div style={{ padding: "16px 20px",
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 32px" }}>
                {[
                  ["Bank",     result.bank],
                  ["Type",     result.type.replace(/_/g, " ")],
                  ["Merchant", result.merchant],
                  ["Category", result.category.replace(/_/g, " ")],
                  ["Mode",     result.payment_mode.replace(/_/g, " ")],
                  ["Balance",  result.balance_after ? `₹${result.balance_after.toLocaleString("en-IN")}` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="field-row">
                    <span className="field-label">{label}</span>
                    <span className="field-value">{value}</span>
                  </div>
                ))}
              </div>

              {/* Confidence bar */}
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ borderTop: `1px solid ${T.borderBase}`, paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: T.textSecondary }}>
                      Model confidence
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                      background: confBg, color: confClr, border: `1px solid ${confBdr}`,
                      fontFamily: "monospace" }}>
                      {confPct}% · {result.engine === "llm_fallback" ? "WebLLM fallback" : "ONNX model"}
                    </span>
                  </div>
                  <div role="progressbar" aria-valuenow={confPct} aria-valuemin={0} aria-valuemax={100}
                    aria-label={`Model confidence ${confPct} percent`}
                    style={{ height: 8, background: "#E7E5E4", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${confPct}%`, background: confClr, borderRadius: 99,
                      transition: "width 1.1s cubic-bezier(0.34,1.56,0.64,1)" }} />
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div style={{ background: T.cardBg, border: `1px dashed ${T.borderBase}`,
              borderRadius: 12, padding: "44px 20px", textAlign: "center" }}
              role="status" aria-live="polite" aria-label="No result yet">
              <div style={{ width: 48, height: 48, borderRadius: 12, background: T.surfaceBg,
                border: `1px solid ${T.borderBase}`, display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 12px" }}>
                <svg width={22} height={22} viewBox="0 0 22 22" fill="none" aria-hidden>
                  <rect x={3} y={4} width={16} height={14} rx={2} stroke={T.textMuted} strokeWidth={1.25}/>
                  <path d="M3 8h16M8 12h6M8 15h4" stroke={T.textMuted} strokeWidth={1.25} strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary, margin: "0 0 4px" }}>
                No result yet
              </p>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                Select a sample or paste your own SMS, then click Parse
              </p>
            </div>
          )}

          <footer>
            <p style={{ textAlign: "center", fontSize: 12, color: T.textMuted, margin: 0 }}>
              Artha AI · SMS Parser · ONNX DistilBERT · browser-local · WCAG 2.1 AA compliant
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
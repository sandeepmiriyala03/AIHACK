"use client";
export const dynamic = 'force-dynamic';

// SMSParser.tsx
// ─────────────────────────────────────────────
// Paste one or many bank SMSes → instant parse
// Debit / Credit / Transfer clearly shown
// One-click CSV export of all transactions
// ─────────────────────────────────────────────

import { useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
type TxnType = "debit" | "credit" | "transfer" | "info";

type Transaction = {
  id:           string;
  raw:          string;
  amount:       number;
  type:         TxnType;
  bank:         string;
  account:      string;
  merchant:     string;
  category:     string;
  paymentMode:  string;
  balanceAfter: number | null;
  date:         string;
  refNo:        string;
};

// ═══════════════════════════════════════════════════════
// CORE PARSER  — rule-based, deterministic, fast
// ═══════════════════════════════════════════════════════
function parseSMS(raw: string): Transaction {
  const s = raw.trim();
  const l = s.toLowerCase();
  const id = Math.random().toString(36).slice(2, 9);

  // ── Amount ──────────────────────────────────────────
  const amtPatterns = [
    /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:INR|Rs\.?|₹)/i,
    /Amt[:\s]+([\d,]+)/i,
    /amount[:\s]+([\d,]+)/i,
  ];
  let amount = 0;
  for (const p of amtPatterns) {
    const m = s.match(p);
    if (m) { amount = parseFloat(m[1].replace(/,/g, "")); break; }
  }

  // ── Type ─────────────────────────────────────────────
  const creditWords = ["credited", "credit of", "received from", "cr to", "cr on", "deposited", "cashback", "refund", "reversal", "reward", "salary credited", "bonus credit", "claim credit", "fd matured", "interest credited", "dividend", "sweep in"];
  const debitWords  = ["debited", "debit of", "spent at", "paid to", "dr to", "dr on", "withdrawn", "emi", "nach debit", "ecs debit", "auto debit", "autopay"];
  const isCredit = creditWords.some(w => l.includes(w));
  const isDebit  = debitWords.some(w => l.includes(w));
  const isTransfer = (l.includes("sent to") || l.includes("transferred to") || l.includes("neft") || l.includes("imps") || l.includes("rtgs")) && !isCredit && !isDebit;

  const type: TxnType =
    isCredit   ? "credit"   :
    isDebit    ? "debit"    :
    isTransfer ? "transfer" : "info";

  // ── Bank ─────────────────────────────────────────────
  const bankMap: [string, string[]][] = [
    ["HDFC",            ["hdfc"]],
    ["SBI",             ["sbi", "yono sbi", "yono", "state bank"]],
    ["ICICI",           ["icici"]],
    ["Axis",            ["axis bank", "axis"]],
    ["Kotak",           ["kotak"]],
    ["Yes Bank",        ["yes bank"]],
    ["IDFC FIRST",      ["idfc first", "idfc"]],
    ["IndusInd",        ["indusind"]],
    ["Bank of Baroda",  ["bank of baroda", "bob bank"]],
    ["Canara Bank",     ["canara"]],
    ["PNB",             ["pnb", "punjab national"]],
    ["Union Bank",      ["union bank"]],
    ["PhonePe",         ["phonepe", "phonepay"]],
    ["GooglePay",       ["gpay", "google pay"]],
    ["Paytm",           ["paytm"]],
    ["Amazon Pay",      ["amazon pay", "amazonpay"]],
    ["CRED",            ["cred"]],
    ["BHIM",            ["bhim"]],
  ];
  let bank = "Unknown";
  for (const [name, keys] of bankMap) {
    if (keys.some(k => l.includes(k))) { bank = name; break; }
  }

  // ── Account number ────────────────────────────────────
  const accMatch = s.match(/[Aa]\/[Cc]\s*([Xx0-9]{4,8})|[Aa]cct?\s*([Xx0-9]{4,8})|[Aa]ccount\s*([Xx0-9]{4,8})/);
  const account = accMatch ? (accMatch[1] || accMatch[2] || accMatch[3] || "").replace(/x/gi, "X") : "—";

  // ── Merchant ──────────────────────────────────────────
  const merchantPatterns = [
    /\bat\s+([A-Z][A-Z0-9 &\-\.]+?)(?:\s+on\s|\s*\.|,|\s+Avl|\s+Bal)/,
    /to merchant\s+([A-Z][A-Z ]+?)(?:\s+on|\.|,)/i,
    /;([A-Z][A-Z0-9 ]+?);/,
    /paid to\s+([A-Z][A-Z ]+?)(?:\s+on|via|\.)/i,
    /sent to\s+([A-Z][A-Za-z ]+?)(?:\s+\(|\s+on|via)/i,
    /Merch:\s*([^\s|]+)/i,
    /from\s+([A-Z]{3,}(?:\s+[A-Z]{2,})*)\s+(?:on|via)/,
  ];
  let merchant = "—";
  for (const p of merchantPatterns) {
    const m = s.match(p);
    if (m && m[1] && m[1].trim().length > 1 && m[1].trim().length < 50) {
      merchant = m[1].trim().replace(/\s+/g, " ");
      break;
    }
  }

  // ── Category ─────────────────────────────────────────
  const catRules: [string, string[]][] = [
    ["Food",             ["swiggy","zomato","domino","mcdonald","kfc","restaurant","cafe","biryani","pizza","subway","licious","pani puri","chai"]],
    ["Groceries",        ["bigbasket","blinkit","dmart","zepto","dunzo","instamart","kirana","vegetable","milk","fresho","reliance smart","country delight"]],
    ["Shopping",         ["amazon","flipkart","myntra","meesho","nykaa","decathlon","crossword","urban ladder","pepperfry","tanishq","malabar gold","croma"]],
    ["Fuel",             ["petrol","bpcl","hp petrol","indian oil","fuel","cng"]],
    ["Transport",        ["ola","uber","rapido","metro","apsrtc","tsrtc","auto rickshaw","fasttag","toll","nhai","bus","yulu","parking","car wash"]],
    ["Travel",           ["irctc","makemytrip","goibibo","oyo","indigo","air india","spicejet","vistara","redbus","cleartrip","ixigo","hotel","flight","train ticket"]],
    ["Utilities",        ["electricity","tsspdcl","apspdcl","bescom","mseb","tneb","msedcl","wbsedcl","indane gas","hp gas","mahanagar gas","water bill","hmwssb"]],
    ["Mobile/Internet",  ["jio","airtel","vi ","vodafone","bsnl","recharge","postpaid","broadband","act fibernet","jio fiber"]],
    ["Entertainment",    ["netflix","hotstar","spotify","amazon prime","bookmyshow","zee5","sonyliv","jiocinema","audible","tata play","airtel dth"]],
    ["EMI/Loan",         ["emi","loan","nach debit","ecs debit","lazypay","simpl","slice card","zestmoney","stashfin","navi","moneyview","kreditbee","bajaj finserv"]],
    ["Credit Card",      ["credit card","cc bill","cred"]],
    ["Salary",           ["salary","payroll","emp code"]],
    ["Investment",       ["mutual fund","sip","zerodha","groww","fd","fixed deposit","ppf","nps","epf","wazirx","coinswitch","kuvera","rd a/c"]],
    ["Insurance",        ["lic","star health","care health","niva bupa","digit insurance","acko","tata aig","policybazaar","health insurance","vehicle insurance","term life"]],
    ["Health",           ["hospital","pharmacy","apollo","medplus","practo","1mg","pharmeasy","cult fit","dental","netmeds","gym"]],
    ["Education",        ["school fees","college fees","university","byju","unacademy","vedantu","tuition","coursera","allen","iit"]],
    ["Government",       ["income tax","gst payment","advance tax","stamp duty","passport","traffic challan","property tax","bbmp","municipal"]],
    ["Donation",         ["temple","iskcon","cry india","give india","tirupati","pandit","donation"]],
    ["Cashback/Refund",  ["cashback","reward points","scratch card","refund","reversal","redemption"]],
    ["Transfer",         ["sent to","transferred","neft","imps","rtgs","nri remittance","cheque"]],
    ["Rent",             ["rent","landlord","housing"]],
    ["Bank Charges",     ["maintenance charge","sms banking","atm usage fee","locker charges","demat charges","service charge"]],
    ["Income",           ["gratuity","bonus credit","reimbursement","hra","medical claim","freelance","dividend","pension","matured","credited"]],
  ];
  let category = "Other";
  for (const [cat, kws] of catRules) {
    if (kws.some(k => l.includes(k))) { category = cat; break; }
  }

  // ── Payment mode ──────────────────────────────────────
  const mode =
    l.includes("upi") || l.includes("gpay") || l.includes("phonepe") || l.includes("bhim") || l.includes("@") ? "UPI"
    : l.includes("neft")    ? "NEFT"
    : l.includes("imps")    ? "IMPS"
    : l.includes("rtgs")    ? "RTGS"
    : l.includes("atm")     ? "ATM"
    : l.includes("nach") || l.includes("ecs") || l.includes("autopay") || l.includes("auto debit") ? "Auto Debit"
    : l.includes("cheque")  ? "Cheque"
    : l.includes("fastag")  ? "FASTag"
    : l.includes("wallet")  ? "Wallet"
    : l.includes("debit card") || l.includes("card ending") ? "Debit Card"
    : l.includes("credit card") ? "Credit Card"
    : "Net Banking";

  // ── Balance ───────────────────────────────────────────
  const balMatch = s.match(/(?:Avl Bal|Available Bal|Balance|Bal|Remaining balance)[:\s]+Rs\.?\s*([\d,]+)/i);
  const balanceAfter = balMatch ? parseFloat(balMatch[1].replace(/,/g, "")) : null;

  // ── Date ─────────────────────────────────────────────
  const dateMatch = s.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{2,4})/i);
  const date = dateMatch ? dateMatch[0] : new Date().toLocaleDateString("en-IN");

  // ── Ref No ────────────────────────────────────────────
  const refMatch = s.match(/(?:Ref(?:erence)?[:\s#]+|UPI Ref[:\s]+|TXN[:\s]+|Ref\s*No[:\s]+)([A-Z0-9]{6,20})/i);
  const refNo = refMatch ? refMatch[1] : "—";

  return { id, raw, amount, type, bank, account, merchant, category, paymentMode: mode, balanceAfter, date, refNo };
}

// ═══════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════
function exportCSV(txns: Transaction[]) {
  const headers = ["Date","Type","Amount (₹)","Bank","Account","Merchant","Category","Payment Mode","Balance After","Ref No","Raw SMS"];
  const rows = txns.map(t => [
    t.date,
    t.type.toUpperCase(),
    t.amount.toFixed(2),
    t.bank,
    t.account,
    `"${t.merchant.replace(/"/g, "'")}"`,
    t.category,
    t.paymentMode,
    t.balanceAfter !== null ? t.balanceAfter.toFixed(2) : "",
    t.refNo,
    `"${t.raw.replace(/"/g, "'").replace(/\n/g, " ")}"`,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ═══════════════════════════════════════════════════════
// COLOUR HELPERS
// ═══════════════════════════════════════════════════════
const TYPE_CLR: Record<TxnType, { bg: string; text: string; border: string; label: string }> = {
  credit:   { bg:"#f0fdf4", text:"#15803d", border:"#bbf7d0", label:"CREDIT"   },
  debit:    { bg:"#fef2f2", text:"#dc2626", border:"#fecaca", label:"DEBIT"    },
  transfer: { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe", label:"TRANSFER" },
  info:     { bg:"#f5f5f4", text:"#57534e", border:"#d6d3d1", label:"INFO"     },
};

const CAT_PALETTE: Record<string, string> = {
  "Food":"#ea580c","Groceries":"#16a34a","Shopping":"#2563eb",
  "Fuel":"#ca8a04","Transport":"#7c3aed","Travel":"#0891b2",
  "Utilities":"#0f766e","Mobile/Internet":"#6d28d9","Entertainment":"#db2777",
  "EMI/Loan":"#dc2626","Credit Card":"#9f1239","Salary":"#15803d",
  "Investment":"#0369a1","Insurance":"#1d4ed8","Health":"#b45309",
  "Education":"#4338ca","Government":"#92400e","Donation":"#be185d",
  "Cashback/Refund":"#059669","Transfer":"#475569","Rent":"#d97706",
  "Bank Charges":"#71717a","Income":"#16a34a","Other":"#737373",
};

// ═══════════════════════════════════════════════════════
// TRANSACTION CARD
// ═══════════════════════════════════════════════════════
function TxnCard({ t, onRemove }: { t: Transaction; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CLR[t.type];
  const cc = CAT_PALETTE[t.category] ?? "#737373";

  return (
    <div style={{
      background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,
      overflow:"hidden",transition:"box-shadow .15s",
    }}>
      {/* Main row */}
      <div
        onClick={() => setExpanded(x => !x)}
        style={{
          display:"flex",alignItems:"center",gap:12,padding:"14px 16px",
          cursor:"pointer",userSelect:"none",
        }}
      >
        {/* Type badge */}
        <div style={{
          minWidth:64,textAlign:"center",padding:"3px 8px",borderRadius:6,
          background:tc.bg,color:tc.text,border:`1px solid ${tc.border}`,
          fontSize:11,fontWeight:700,letterSpacing:".06em",flexShrink:0,
        }}>
          {tc.label}
        </div>

        {/* Amount */}
        <div style={{
          fontSize:20,fontWeight:800,color:t.type==="credit"?"#15803d":t.type==="debit"?"#dc2626":"#1d4ed8",
          minWidth:110,fontVariantNumeric:"tabular-nums",flexShrink:0,
        }}>
          {t.type==="credit"?"+":"−"}₹{t.amount.toLocaleString("en-IN",{minimumFractionDigits:0})}
        </div>

        {/* Merchant + category */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {t.merchant !== "—" ? t.merchant : t.bank}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
            <span style={{
              display:"inline-block",width:8,height:8,borderRadius:"50%",
              background:cc,flexShrink:0,
            }}/>
            <span style={{fontSize:12,color:"#6b7280"}}>{t.category}</span>
            <span style={{fontSize:12,color:"#9ca3af"}}>·</span>
            <span style={{fontSize:12,color:"#9ca3af"}}>{t.paymentMode}</span>
          </div>
        </div>

        {/* Right side */}
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:12,color:"#6b7280"}}>{t.bank}</div>
          <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{t.date}</div>
        </div>

        {/* Chevron */}
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none"
          style={{flexShrink:0,transform:expanded?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>
          <path d="M4 6l4 4 4-4" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{borderTop:"1px solid #f3f4f6",padding:"12px 16px",background:"#fafafa"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"8px 16px",marginBottom:12}}>
            {[
              ["Account",  t.account],
              ["Balance",  t.balanceAfter !== null ? `₹${t.balanceAfter.toLocaleString("en-IN")}` : "—"],
              ["Ref No",   t.refNo],
              ["Mode",     t.paymentMode],
            ].map(([lbl,val]) => (
              <div key={lbl}>
                <div style={{fontSize:11,color:"#9ca3af",fontWeight:600,letterSpacing:".05em",textTransform:"uppercase"}}>{lbl}</div>
                <div style={{fontSize:13,color:"#374151",fontWeight:600,marginTop:2,fontFamily:"monospace"}}>{val}</div>
              </div>
            ))}
          </div>
          {/* Raw SMS */}
          <div style={{
            fontSize:12,color:"#6b7280",lineHeight:1.6,padding:"8px 10px",
            background:"#f3f4f6",borderRadius:6,fontFamily:"monospace",
            wordBreak:"break-word",
          }}>
            {t.raw}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{
              marginTop:8,padding:"4px 12px",borderRadius:6,border:"1px solid #fecaca",
              background:"#fef2f2",color:"#dc2626",fontSize:12,fontWeight:600,cursor:"pointer",
            }}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════
function Summary({ txns }: { txns: Transaction[] }) {
  const totalCredit   = txns.filter(t => t.type==="credit").reduce((s,t)=>s+t.amount,0);
  const totalDebit    = txns.filter(t => t.type==="debit" || t.type==="transfer").reduce((s,t)=>s+t.amount,0);
  const net           = totalCredit - totalDebit;

  // Category breakdown
  const catTotals: Record<string,number> = {};
  txns.filter(t => t.type==="debit").forEach(t => {
    catTotals[t.category] = (catTotals[t.category]||0) + t.amount;
  });
  const topCats = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxCat  = topCats[0]?.[1] || 1;

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
      {/* Totals */}
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:20}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9ca3af",letterSpacing:".08em",textTransform:"uppercase",marginBottom:16}}>
          Summary
        </div>
        {[
          {label:"Total Credits",  val:totalCredit,  clr:"#15803d"},
          {label:"Total Debits",   val:totalDebit,   clr:"#dc2626"},
          {label:"Net Flow",       val:net,           clr:net>=0?"#15803d":"#dc2626"},
          {label:"Transactions",   val:txns.length,  clr:"#1d4ed8", isCount:true},
        ].map(({label,val,clr,isCount})=>(
          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f3f4f6"}}>
            <span style={{fontSize:13,color:"#6b7280",fontWeight:500}}>{label}</span>
            <span style={{fontSize:16,fontWeight:800,color:clr,fontVariantNumeric:"tabular-nums"}}>
              {isCount ? val : `${val>=0?"+":"-"}₹${Math.abs(val as number).toLocaleString("en-IN")}`}
            </span>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {topCats.length > 0 && (
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:20}}>
          <div style={{fontSize:12,fontWeight:700,color:"#9ca3af",letterSpacing:".08em",textTransform:"uppercase",marginBottom:16}}>
            Top Spending Categories
          </div>
          {topCats.map(([cat,total])=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:CAT_PALETTE[cat]??"#737373",display:"inline-block"}}/>
                  <span style={{fontSize:13,color:"#374151",fontWeight:500}}>{cat}</span>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:"#111827",fontVariantNumeric:"tabular-nums"}}>
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
              <div style={{height:6,background:"#f3f4f6",borderRadius:99,overflow:"hidden"}}>
                <div style={{
                  height:"100%",borderRadius:99,
                  width:`${(total/maxCat)*100}%`,
                  background:CAT_PALETTE[cat]??"#737373",
                  transition:"width .6s cubic-bezier(.34,1.56,.64,1)",
                }}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
export default function SMSParserPage() {
  const [input,  setInput]  = useState("");
  const [txns,   setTxns]   = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all"|TxnType>("all");
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Parse all SMSes — split on blank lines or numbered lines
  const handleParse = useCallback(() => {
    const chunks = input
      .split(/\n{2,}|\n(?=\d+[\.\)])|---+/)
      .map(s => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter(s => s.length > 10);

    if (!chunks.length) return;

    const parsed = chunks.map(parseSMS);
    setTxns(prev => [...parsed, ...prev]);
    setInput("");
    textRef.current?.focus();
  }, [input]);

  const removeOne = useCallback((id: string) => {
    setTxns(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = () => { setTxns([]); setInput(""); };

  const filtered = filter === "all" ? txns : txns.filter(t => t.type === filter);

  const counts = {
    all:      txns.length,
    credit:   txns.filter(t=>t.type==="credit").length,
    debit:    txns.filter(t=>t.type==="debit").length,
    transfer: txns.filter(t=>t.type==="transfer").length,
  };

  return (
    <>
      <Navbar />
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f9fafb; }
        .parse-btn {
          background:#111827; color:#fff; border:none; border-radius:8px;
          padding:12px 28px; font-size:14px; font-weight:700; cursor:pointer;
          transition:background .15s,transform .1s;
        }
        .parse-btn:hover { background:#1f2937; }
        .parse-btn:active { transform:scale(.97); }
        .parse-btn:disabled { background:#d1d5db; color:#9ca3af; cursor:not-allowed; }
        .csv-btn {
          background:#15803d; color:#fff; border:none; border-radius:8px;
          padding:10px 22px; font-size:13px; font-weight:700; cursor:pointer;
          transition:background .15s;
        }
        .csv-btn:hover { background:#166534; }
        .ghost-btn {
          background:#fff; color:#6b7280; border:1px solid #d1d5db; border-radius:8px;
          padding:10px 22px; font-size:13px; font-weight:600; cursor:pointer;
          transition:background .15s;
        }
        .ghost-btn:hover { background:#f9fafb; }
        .filter-pill {
          border:1px solid #e5e7eb; background:#fff; border-radius:99px;
          padding:6px 16px; font-size:13px; font-weight:600; cursor:pointer;
          color:#6b7280; transition:all .15s;
        }
        .filter-pill.active { background:#111827; color:#fff; border-color:#111827; }
        textarea {
          width:100%; resize:vertical; border:1.5px solid #e5e7eb; border-radius:10px;
          padding:14px; font-size:13px; font-family:monospace; line-height:1.6;
          color:#111827; background:#fafafa; outline:none; min-height:140px;
          transition:border-color .15s;
        }
        textarea:focus { border-color:#6b7280; }
      `}</style>

      <main style={{minHeight:"100vh",background:"#f9fafb",padding:"32px 16px 80px"}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",flexDirection:"column",gap:24}}>

          {/* ── Header ─────────────────────────────── */}
          <header>
            <h1 style={{fontSize:28,fontWeight:800,color:"#111827",letterSpacing:"-.5px"}}>
              SMS Transaction Parser
            </h1>
            <p style={{fontSize:14,color:"#6b7280",marginTop:6,lineHeight:1.6}}>
              Paste any bank SMS — HDFC, SBI, ICICI, Axis, UPI apps and more.
              Instantly categorised. Export to CSV for your records.
            </p>
          </header>

          {/* ── Input box ──────────────────────────── */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:20}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:8}}>
              Paste SMS here — one or many (separate with a blank line)
            </label>
            <textarea
              ref={textRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && (e.ctrlKey||e.metaKey)) handleParse(); }}
              placeholder={`INR 2,350 debited from A/c XX4821 at AMAZON on 22-03-26. Avl Bal: Rs.18,420. -HDFC Bank\n\nRs.15,000 credited to your a/c XX8823 by NEFT from EMPLOYER on 01-03-26. Avl Bal: Rs.22,450.\n\nPhonePe: Rs.450 paid to Swiggy on 21-03-26. UPI Ref: PP928471236.`}
            />
            <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12,flexWrap:"wrap"}}>
              <button
                className="parse-btn"
                onClick={handleParse}
                disabled={!input.trim()}
              >
                Parse SMS
              </button>
              <span style={{fontSize:12,color:"#9ca3af"}}>or Ctrl+Enter</span>
            </div>
          </div>

          {/* ── Results ─────────────────────────────── */}
          {txns.length > 0 && (
            <>
              {/* Summary */}
              <Summary txns={txns} />

              {/* Toolbar */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {(["all","credit","debit","transfer"] as const).map(f => (
                    <button
                      key={f}
                      className={`filter-pill${filter===f?" active":""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                      <span style={{
                        marginLeft:6,background:filter===f?"#374151":"#f3f4f6",
                        color:filter===f?"#fff":"#6b7280",
                        borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:700,
                      }}>
                        {counts[f as keyof typeof counts] ?? txns.length}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="csv-btn" onClick={() => exportCSV(txns)}>
                    ↓ Export CSV
                  </button>
                  <button className="ghost-btn" onClick={clearAll}>
                    Clear All
                  </button>
                </div>
              </div>

              {/* Transaction list */}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {filtered.length === 0 && (
                  <div style={{textAlign:"center",padding:40,color:"#9ca3af",fontSize:14}}>
                    No {filter} transactions
                  </div>
                )}
                {filtered.map(t => (
                  <TxnCard key={t.id} t={t} onRemove={() => removeOne(t.id)} />
                ))}
              </div>

              {/* Bottom export */}
              <div style={{textAlign:"center",paddingTop:8}}>
                <button className="csv-btn" style={{padding:"12px 40px",fontSize:14}}
                  onClick={() => exportCSV(txns)}>
                  ↓ Download Full CSV Report ({txns.length} transactions)
                </button>
                <p style={{fontSize:12,color:"#9ca3af",marginTop:8}}>
                  Includes: Date · Type · Amount · Bank · Account · Merchant · Category · Mode · Balance · Ref No
                </p>
              </div>
            </>
          )}

          {txns.length === 0 && (
            <div style={{
              border:"2px dashed #e5e7eb",borderRadius:14,padding:"48px 24px",
              textAlign:"center",background:"#fff",
            }}>
              <div style={{fontSize:40,marginBottom:12}}>📱</div>
              <p style={{fontSize:15,fontWeight:600,color:"#374151"}}>No transactions yet</p>
              <p style={{fontSize:13,color:"#9ca3af",marginTop:6}}>
                Paste a bank SMS above and click Parse
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

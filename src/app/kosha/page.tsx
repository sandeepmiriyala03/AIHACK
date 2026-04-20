export const dynamic = 'force-dynamic';
"use client";

// ============================================================
// AksharaKosha v3 — AI-Powered Finance Tracker
// AI Features (all free, no API key):
//   🧠 1. Auto-categorize from note text (keyword engine)
//   💡 2. Monthly spending insights (window.ai + math fallback)
//   🎯 3. Budget planner & savings goal (math + localStorage)
//   📷 4. Bill scanner — OCR receipt + auto-fill (Tesseract.js)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
// ─── Currency config ──────────────────────────────────────────
interface CurrencyConfig {
  code: string; symbol: string; locale: string;
  country: string; flag: string; region: string;
}
const CURRENCIES: CurrencyConfig[] = [
  { code:"INR", symbol:"₹",   locale:"en-IN", country:"India",      flag:"🇮🇳", region:"Main"     },
  { code:"USD", symbol:"$",   locale:"en-US", country:"USA",        flag:"🇺🇸", region:"Main"     },
  { code:"GBP", symbol:"£",   locale:"en-GB", country:"UK",         flag:"🇬🇧", region:"Main"     },
  { code:"EUR", symbol:"€",   locale:"de-DE", country:"Europe",     flag:"🇪🇺", region:"Main"     },
  { code:"JPY", symbol:"¥",   locale:"ja-JP", country:"Japan",      flag:"🇯🇵", region:"Main"     },
  { code:"AED", symbol:"د.إ", locale:"ar-AE", country:"UAE",        flag:"🇦🇪", region:"Main"     },
  { code:"LKR", symbol:"Rs.", locale:"si-LK", country:"Sri Lanka",  flag:"🇱🇰", region:"Neighbor" },
  { code:"NPR", symbol:"Rs.", locale:"ne-NP", country:"Nepal",      flag:"🇳🇵", region:"Neighbor" },
  { code:"BDT", symbol:"৳",   locale:"bn-BD", country:"Bangladesh", flag:"🇧🇩", region:"Neighbor" },
  { code:"PKR", symbol:"Rs.", locale:"ur-PK", country:"Pakistan",   flag:"🇵🇰", region:"Neighbor" },
  { code:"BTN", symbol:"Nu.", locale:"dz-BT", country:"Bhutan",     flag:"🇧🇹", region:"Neighbor" },
  { code:"MMK", symbol:"K",   locale:"my-MM", country:"Myanmar",    flag:"🇲🇲", region:"Neighbor" },
];

// ─── Categories ───────────────────────────────────────────────
interface Category { id:string; label:string; icon:string; type:"expense"|"income"|"both"; }
const CATEGORIES: Category[] = [
  { id:"food",       label:"Food",          icon:"🍱", type:"expense" },
  { id:"transport",  label:"Transport",     icon:"🚗", type:"expense" },
  { id:"bills",      label:"Bills",         icon:"🏠", type:"expense" },
  { id:"medical",    label:"Medical",       icon:"🏥", type:"expense" },
  { id:"education",  label:"Education",     icon:"🎓", type:"expense" },
  { id:"shopping",   label:"Shopping",      icon:"🛍️", type:"expense" },
  { id:"travel",     label:"Travel",        icon:"✈️", type:"expense" },
  { id:"office",     label:"Office",        icon:"💼", type:"expense" },
  { id:"team_lunch", label:"Team Lunch",    icon:"🍽️", type:"expense" },
  { id:"other_exp",  label:"Other",         icon:"📦", type:"expense" },
  { id:"salary",     label:"Salary",        icon:"💰", type:"income"  },
  { id:"freelance",  label:"Freelance",     icon:"💻", type:"income"  },
  { id:"investment", label:"Investment",    icon:"📈", type:"income"  },
  { id:"reimburse",  label:"Reimbursement", icon:"🔄", type:"income"  },
  { id:"other_inc",  label:"Other",         icon:"🎁", type:"income"  },
];

// ─── Types ────────────────────────────────────────────────────
interface Transaction {
  id:string; type:"income"|"expense"; amount:number;
  categoryId:string; note:string; date:string;
  createdAt:number; currencyCode:string;
}
interface BudgetGoal { amount:number; month:string; }
type TabKey = "today"|"monthly"|"charts"|"yearly"|"ai"|"help";

// ════════════════════════════════════════════════════════════
// AI FEATURE 1 — AUTO CATEGORIZE (keyword engine)
// ════════════════════════════════════════════════════════════
const KEYWORD_MAP: Record<string, string[]> = {
  food:       ["swiggy","zomato","lunch","dinner","breakfast","coffee","tea","biryani","pizza","burger","restaurant","hotel","canteen","mess","tiffin","snack","biscuit","grocery","milk","vegetables","fruits","rice","dal"],
  transport:  ["uber","ola","auto","cab","bus","train","metro","petrol","diesel","fuel","parking","toll","rapido","bike","scooter","rickshaw","taxi","flight","ticket","travel"],
  bills:      ["electricity","water","gas","rent","maintenance","wifi","internet","broadband","mobile","recharge","dth","netflix","hotstar","amazon prime","subscription","emi","loan"],
  medical:    ["apollo","hospital","clinic","doctor","medicine","tablet","pharmacy","medplus","netmeds","pharmacy","surgery","test","lab","health","insurance","dental","eye"],
  education:  ["school","college","university","fees","course","book","stationery","pen","notebook","tuition","coaching","udemy","coursera","certification","exam"],
  shopping:   ["amazon","flipkart","myntra","meesho","nykaa","ajio","shopping","clothes","shoes","dress","shirt","jeans","accessories","bag","watch"],
  travel:     ["hotel","resort","airbnb","makemytrip","goibibo","yatra","flight","trip","tour","holiday","vacation","booking","oyo"],
  office:     ["office","stationery","printer","ink","client","meeting","business","laptop","keyboard","mouse","headphone"],
  team_lunch: ["team lunch","team dinner","office lunch","office dinner","team outing","office party"],
  salary:     ["salary","ctc","payroll","credited","hike","bonus","increment","appraisal"],
  freelance:  ["freelance","project","client payment","invoice","upwork","fiverr","payment received"],
  investment: ["mutual fund","stocks","sip","fd","fixed deposit","gold","crypto","investment","portfolio","dividend"],
  reimburse:  ["reimbursement","refund","cashback","claim","returned"],
};

function autoCategorize(note: string, type: "income"|"expense"): string {
  if (!note.trim()) return type === "income" ? "salary" : "food";
  const lower = note.toLowerCase();
  for (const [catId, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (cat && (cat.type === type || cat.type === "both")) return catId;
    }
  }
  return type === "income" ? "other_inc" : "other_exp";
}

// ════════════════════════════════════════════════════════════
// AI FEATURE 2 — SPENDING INSIGHTS (window.ai + math fallback)
// ════════════════════════════════════════════════════════════
interface Insight { icon:string; title:string; desc:string; type:"good"|"warn"|"tip"; }

function generateMathInsights(
  monthTx: Transaction[],
  prevMonthTx: Transaction[],
  currency: CurrencyConfig
): Insight[] {
  const insights: Insight[] = [];
  const income  = monthTx.filter(t=>t.type==="income" ).reduce((s,t)=>s+t.amount,0);
  const expense = monthTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const prevExp = prevMonthTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const savings = income - expense;
  const savRate = income > 0 ? Math.round((savings/income)*100) : 0;

  // Savings rate insight
  if (savRate > 20)
    insights.push({ icon:"🎉", title:"Great savings!", desc:`You saved ${savRate}% of income this month. Keep it up!`, type:"good" });
  else if (savRate > 0)
    insights.push({ icon:"💡", title:"Savings can improve", desc:`You saved ${savRate}% this month. Aim for 20%+.`, type:"tip" });
  else if (expense > income)
    insights.push({ icon:"⚠️", title:"Spending exceeds income", desc:`You spent ${fmt(expense-income,currency)} more than you earned.`, type:"warn" });

  // Expense vs last month
  if (prevExp > 0 && expense > prevExp) {
    const diff = expense - prevExp;
    insights.push({ icon:"📈", title:"Spending increased", desc:`You spent ${fmt(diff,currency)} more than last month.`, type:"warn" });
  } else if (prevExp > 0 && expense < prevExp) {
    const diff = prevExp - expense;
    insights.push({ icon:"📉", title:"Spending reduced", desc:`You spent ${fmt(diff,currency)} less than last month. Well done!`, type:"good" });
  }

  // Top category
  const catTotals = CATEGORIES
    .filter(c=>c.type==="expense"||c.type==="both")
    .map(cat=>({ cat, total:monthTx.filter(t=>t.type==="expense"&&t.categoryId===cat.id).reduce((s,t)=>s+t.amount,0) }))
    .filter(x=>x.total>0).sort((a,b)=>b.total-a.total);

  if (catTotals[0]) {
    const top = catTotals[0];
    const pct = expense > 0 ? Math.round((top.total/expense)*100) : 0;
    insights.push({ icon:top.cat.icon, title:`${top.cat.label} is top spend`, desc:`${pct}% of expenses — ${fmt(top.total,currency)} this month.`, type: pct>40?"warn":"tip" });
  }

  // Food tip
  const foodTotal = catTotals.find(x=>x.cat.id==="food")?.total??0;
  if (foodTotal > 0 && expense > 0 && (foodTotal/expense) > 0.35)
    insights.push({ icon:"🍱", title:"High food spending", desc:"Cook at home 3 days a week — could save 30% on food.", type:"tip" });

  // Transport tip
  const transportTotal = catTotals.find(x=>x.cat.id==="transport")?.total??0;
  if (transportTotal > 0 && (transportTotal/expense) > 0.20)
    insights.push({ icon:"🚗", title:"Transport costs high", desc:"Consider carpooling or public transport to cut costs.", type:"tip" });

  if (insights.length === 0)
    insights.push({ icon:"📊", title:"Keep tracking!", desc:"Add more transactions to see AI insights about your spending.", type:"tip" });

  return insights;
}

async function generateAIInsights(
  monthTx: Transaction[],
  prevMonthTx: Transaction[],
  currency: CurrencyConfig
): Promise<Insight[]> {
  // Try Chrome window.ai (Gemini Nano)
  try {
    if ("ai" in window && (window as any).ai?.languageModel) {
      const session = await (window as any).ai.languageModel.create();
      const income  = monthTx.filter(t=>t.type==="income" ).reduce((s,t)=>s+t.amount,0);
      const expense = monthTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);

      const catTotals = CATEGORIES
        .filter(c=>c.type==="expense")
        .map(cat=>({ label:cat.label, total:monthTx.filter(t=>t.type==="expense"&&t.categoryId===cat.id).reduce((s,t)=>s+t.amount,0) }))
        .filter(x=>x.total>0).sort((a,b)=>b.total-a.total).slice(0,4);

      const prompt = `You are a personal finance advisor. 
        Income: ${income} ${currency.code}
        Expenses: ${expense} ${currency.code}  
        Top categories: ${catTotals.map(c=>`${c.label}: ${c.total}`).join(", ")}
        Give 2 short actionable money-saving tips in 1 sentence each. Be specific and friendly.`;

      const result = await session.prompt(prompt);
      await session.destroy();

      // Parse AI response into insights
      const lines = result.split("\n").filter((l:string)=>l.trim().length>10).slice(0,2);
      const aiInsights: Insight[] = lines.map((line:string,i:number)=>({
        icon: i===0?"🤖":"💡",
        title: i===0?"AI Tip":"AI Suggestion",
        desc: line.replace(/^[\d\.\-\*]+\s*/,"").trim(),
        type: "tip" as const,
      }));

      // Combine AI + math insights
      return [...aiInsights, ...generateMathInsights(monthTx, prevMonthTx, currency)];
    }
  } catch { /* fall through to math */ }

  return generateMathInsights(monthTx, prevMonthTx, currency);
}

// ════════════════════════════════════════════════════════════
// AI FEATURE 3 — BUDGET PLANNER (math + localStorage)
// ════════════════════════════════════════════════════════════
function saveBudgetGoal(goal: BudgetGoal) {
  localStorage.setItem("aksharakosha_budget", JSON.stringify(goal));
}
function loadBudgetGoal(): BudgetGoal | null {
  try {
    const raw = localStorage.getItem("aksharakosha_budget");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getBudgetAnalysis(goal: BudgetGoal, monthTx: Transaction[], currency: CurrencyConfig) {
  const spent   = monthTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const pct     = Math.min(100, Math.round((spent/goal.amount)*100));
  const remain  = Math.max(0, goal.amount - spent);
  const today   = new Date();
  const daysIn  = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  const daysLeft = daysInMonth - daysIn;
  const dailyLimit = daysLeft > 0 ? remain/daysLeft : 0;
  const status  = pct >= 100 ? "over" : pct >= 80 ? "warn" : "good";
  return { spent, remain, pct, dailyLimit, daysLeft, status, daysIn };
}

// ════════════════════════════════════════════════════════════
// AI FEATURE 4 — BILL SCANNER (Tesseract.js OCR)
// ════════════════════════════════════════════════════════════
async function scanBillImage(file: File): Promise<{ amount: number|null; note: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        const { data: { text } } = await worker.recognize(e.target?.result as string);
        await worker.terminate();

        // Extract amount — look for ₹/Rs/$ followed by numbers
        const amtMatch = text.match(/(?:₹|Rs\.?|INR|USD|\$|£|€|total|amount|grand total)[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i)
                      ?? text.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:\/\-|only|rupees)/i);
        const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g,"")) : null;

        // Extract merchant name — first meaningful line
        const lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>3&&!/^[0-9\s\.\,\-\/]+$/.test(l));
        const note  = lines[0]?.slice(0,40) ?? "Scanned receipt";

        resolve({ amount, note });
      } catch {
        resolve({ amount: null, note: "Could not read receipt" });
      }
    };
    reader.readAsDataURL(file);
  });
}

// ─── IndexedDB ────────────────────────────────────────────────
const DB_NAME="aksharakosha", DB_VER=1, STORE="transactions";
function openDB(): Promise<IDBDatabase> {
  return new Promise((res,rej)=>{
    const req=indexedDB.open(DB_NAME,DB_VER);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:"id"}).createIndex("date","date"); };
    req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error);
  });
}
async function saveTx(tx:Transaction){ const db=await openDB(),tr=db.transaction(STORE,"readwrite"); tr.objectStore(STORE).put(tx); return new Promise<void>((r,j)=>{tr.oncomplete=()=>r();tr.onerror=()=>j(tr.error);}); }
async function loadAllTx():Promise<Transaction[]>{ const db=await openDB(),tr=db.transaction(STORE,"readonly"); return new Promise((r,j)=>{const req=tr.objectStore(STORE).getAll();req.onsuccess=()=>r(req.result??[]);req.onerror=()=>j(req.error);}); }
async function deleteTxById(id:string){ const db=await openDB(),tr=db.transaction(STORE,"readwrite"); tr.objectStore(STORE).delete(id); return new Promise<void>((r,j)=>{tr.oncomplete=()=>r();tr.onerror=()=>j(tr.error);}); }
async function deleteAllTx(){ const db=await openDB(),tr=db.transaction(STORE,"readwrite"); tr.objectStore(STORE).clear(); return new Promise<void>((r,j)=>{tr.oncomplete=()=>r();tr.onerror=()=>j(tr.error);}); }

// ─── Helpers ──────────────────────────────────────────────────
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const todayStr=()=>new Date().toISOString().slice(0,10);
const getMonthName=(i:number)=>new Date(2024,i,1).toLocaleString("default",{month:"short"});
const getCat=(id:string)=>CATEGORIES.find(c=>c.id===id)??CATEGORIES[0];
function fmt(amount:number,cur:CurrencyConfig):string{
  try{ return new Intl.NumberFormat(cur.locale,{style:"currency",currency:cur.code,maximumFractionDigits:cur.code==="JPY"||cur.code==="MMK"?0:2}).format(amount); }
  catch{ return `${cur.symbol}${amount.toLocaleString()}`; }
}
function emptyForm(){ return {type:"expense" as "income"|"expense",amount:"",categoryId:"food",note:"",date:todayStr()}; }
function exportToExcel(transactions:Transaction[],currency:CurrencyConfig){
  const headers=["Date","Type","Category","Note","Amount","Currency"];
  const rows=transactions.sort((a,b)=>a.date.localeCompare(b.date)).map(tx=>{const cat=getCat(tx.categoryId);return[tx.date,tx.type,cat.label,tx.note||"",tx.amount.toString(),tx.currencyCode];});
  const totalIn=transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalOut=transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const csv=[[`AksharaKosha Finance Report`],[`Exported: ${new Date().toLocaleDateString()}`],[`Currency: ${currency.flag} ${currency.code}`],[],[...headers],...rows,[],["SUMMARY"],["Total Income","","","",totalIn.toString(),currency.code],["Total Expense","","","",totalOut.toString(),currency.code],["Net Savings","","","",`${totalIn-totalOut}`,currency.code]].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`AksharaKosha_${todayStr()}.csv`;a.click();URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function AksharaKosha() {
  const [transactions,   setTransactions]   = useState<Transaction[]>([]);
  const [activeTab,      setActiveTab]      = useState<TabKey>("today");
  const [currency,       setCurrency]       = useState<CurrencyConfig>(CURRENCIES[0]);
  const [showCurrPicker, setShowCurrPicker] = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [form,           setForm]           = useState(emptyForm());
  const [toast,          setToast]          = useState("");
  const [viewMonth,      setViewMonth]      = useState(new Date().getMonth());
  const [viewYear,       setViewYear]       = useState(new Date().getFullYear());
  const [showDeleteAll,  setShowDeleteAll]  = useState(false);

  // AI states
  const [insights,       setInsights]       = useState<Insight[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [budgetGoal,     setBudgetGoal]     = useState<BudgetGoal|null>(null);
  const [budgetInput,    setBudgetInput]    = useState("");
  const [scanLoading,    setScanLoading]    = useState(false);
  const [scanResult,     setScanResult]     = useState<{amount:number|null;note:string}|null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ loadAllTx().then(setTransactions).catch(console.error); },[]);
  useEffect(()=>{ const g=loadBudgetGoal(); if(g) setBudgetGoal(g); },[]);

  const showToast=(msg:string)=>{ setToast(msg); setTimeout(()=>setToast(""),2400); };

  // ── Derived data ────────────────────────────────────────────
  const todayTx  = transactions.filter(t=>t.date===todayStr());
  const monthTx  = transactions.filter(t=>{ const[y,m]=t.date.split("-").map(Number); return y===viewYear&&m===viewMonth+1; });
  const prevMonthTx = transactions.filter(t=>{ const[y,m]=t.date.split("-").map(Number); const pm=viewMonth===0?11:viewMonth-1; const py=viewMonth===0?viewYear-1:viewYear; return y===py&&m===pm+1; });
  const todayIn  = todayTx.filter(t=>t.type==="income" ).reduce((s,t)=>s+t.amount,0);
  const todayOut = todayTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const monthIn  = monthTx.filter(t=>t.type==="income" ).reduce((s,t)=>s+t.amount,0);
  const monthOut = monthTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const catBreakdown = CATEGORIES.filter(c=>c.type==="expense"||c.type==="both").map(cat=>({cat,total:monthTx.filter(t=>t.type==="expense"&&t.categoryId===cat.id).reduce((s,t)=>s+t.amount,0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const maxCatAmt = catBreakdown[0]?.total??1;
  const yearlyData = Array.from({length:12},(_,i)=>{ const txs=transactions.filter(t=>{const[y,m]=t.date.split("-").map(Number);return y===viewYear&&m===i+1;}); return {month:getMonthName(i),income:txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expense:txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)}; });
  const maxYearAmt = Math.max(...yearlyData.map(d=>Math.max(d.income,d.expense)),1);
  const navMonth=(dir:1|-1)=>{ if(dir===1){if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);}else{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);}};

  // ── Save transaction ────────────────────────────────────────
  const handleSave = async () => {
    const amt=parseFloat(form.amount);
    if(!amt||amt<=0){showToast("⚠️ Enter a valid amount");return;}
    const tx:Transaction={ id:uid(),type:form.type,amount:amt,categoryId:form.categoryId,note:form.note.trim(),date:form.date,createdAt:Date.now(),currencyCode:currency.code };
    await saveTx(tx);
    setTransactions(prev=>[...prev,tx]);
    setForm(emptyForm()); setShowForm(false);
    showToast(tx.type==="income"?"✅ Income added!":"✅ Expense added!");
  };

  const handleDelete=async(id:string)=>{ await deleteTxById(id); setTransactions(prev=>prev.filter(t=>t.id!==id)); showToast("🗑️ Deleted"); };
  const handleDeleteAll=async()=>{ await deleteAllTx(); setTransactions([]); setShowDeleteAll(false); showToast("🗑️ All data cleared"); };

  // ── AI Feature 1: Auto-categorize on note change ──────────
  const handleNoteChange = (note: string) => {
    const catId = autoCategorize(note, form.type);
    setForm(f=>({...f, note, categoryId: catId}));
  };

  // ── AI Feature 2: Load insights ───────────────────────────
  const loadInsights = async () => {
    setInsightLoading(true);
    const result = await generateAIInsights(monthTx, prevMonthTx, currency);
    setInsights(result);
    setInsightLoading(false);
  };
  useEffect(()=>{ if(activeTab==="ai") loadInsights(); },[activeTab, viewMonth, viewYear]);

  // ── AI Feature 3: Save budget goal ───────────────────────
  const handleSaveBudget = () => {
    const amt = parseFloat(budgetInput);
    if(!amt||amt<=0){showToast("⚠️ Enter a valid budget");return;}
    const goal:BudgetGoal={ amount:amt, month:`${viewYear}-${String(viewMonth+1).padStart(2,"0")}` };
    saveBudgetGoal(goal);
    setBudgetGoal(goal);
    setBudgetInput("");
    showToast("🎯 Budget goal set!");
  };

  // ── AI Feature 4: Bill scanner ────────────────────────────
  const handleScanBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setScanLoading(true);
    setScanResult(null);
    const result = await scanBillImage(file);
    setScanResult(result);
    setScanLoading(false);
    if(result.amount){
      setForm(f=>({
        ...f,
        amount: result.amount!.toString(),
        note:   result.note,
        categoryId: autoCategorize(result.note, "expense"),
        type:   "expense",
      }));
      setShowForm(true);
      showToast("✅ Bill scanned! Check the form.");
    } else {
      showToast("⚠️ Could not read amount. Try a clearer photo.");
    }
    if(scanRef.current) scanRef.current.value="";
  };

  const budgetAnalysis = budgetGoal ? getBudgetAnalysis(budgetGoal, monthTx, currency) : null;

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div style={S.page}>
      <Navbar />
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <p style={S.headerSub}>AKSHARATANTRA · AI</p>
          <h1 style={S.headerTitle}>🏦 AksharaKosha</h1>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* Bill scanner FAB in header */}
          <label style={S.scanBtn} title="Scan Bill with AI">
            {scanLoading ? "⏳" : "📷"}
            <input ref={scanRef} type="file" accept="image/*" capture="environment" hidden onChange={handleScanBill}/>
          </label>
          <button style={S.currBtn} onClick={()=>setShowCurrPicker(!showCurrPicker)}>
            {currency.flag} {currency.symbol} ▾
          </button>
        </div>
      </div>

      {/* ── Currency Picker ── */}
      {showCurrPicker && (
        <div style={S.currDropdown}>
          {["Main","Neighbor"].map(region=>(
            <div key={region}>
              <p style={S.currRegionLabel}>{region==="Main"?"🌍 Global":"🌏 South Asia"}</p>
              {CURRENCIES.filter(c=>c.region===region).map(c=>(
                <button key={c.code} style={{...S.currOption,background:currency.code===c.code?"#E8F5E9":"#fff",fontWeight:currency.code===c.code?800:600}}
                  onClick={()=>{setCurrency(c);setShowCurrPicker(false);}}>
                  {c.flag} {c.country} <span style={{color:"#888",fontWeight:400}}>{c.symbol} {c.code}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div style={S.tabBar}>
        {([
          ["today",   "💰","Today"  ],
          ["monthly", "📅","Monthly"],
          ["charts",  "📊","Charts" ],
          ["yearly",  "📁","Yearly" ],
          ["ai",      "🧠","AI"     ],
          ["help",    "❓","Help"   ],
        ] as [TabKey,string,string][]).map(([key,icon,label])=>(
          <button key={key} style={{...S.tab,...(activeTab===key?S.tabActive:{})}} onClick={()=>setActiveTab(key)}>
            <span style={{fontSize:14}}>{icon}</span>
            <span style={{fontSize:9,fontWeight:800,color:activeTab===key?"#fff":"#888"}}>{label}</span>
          </button>
        ))}
      </div>

      {/* ════ TODAY ════ */}
      {activeTab==="today" && (
        <div style={S.section}>
          {/* Budget progress if set */}
          {budgetAnalysis && (
            <div style={{...S.card,border:`1.5px solid ${budgetAnalysis.status==="over"?"#EF5350":budgetAnalysis.status==="warn"?"#FF9800":"#4CAF50"}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <p style={S.cardTitle}>🎯 Monthly Budget</p>
                <p style={{margin:0,fontSize:12,fontWeight:800,color:budgetAnalysis.status==="over"?"#C62828":budgetAnalysis.status==="warn"?"#E65100":"#2E7D32"}}>
                  {budgetAnalysis.pct}% used
                </p>
              </div>
              <div style={{height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${budgetAnalysis.pct}%`,background:budgetAnalysis.status==="over"?"#EF5350":budgetAnalysis.status==="warn"?"#FF9800":"#4CAF50",borderRadius:4,transition:"width 0.4s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:"#666"}}>Spent: {fmt(budgetAnalysis.spent,currency)}</span>
                <span style={{fontSize:11,color:"#666"}}>Left: {fmt(budgetAnalysis.remain,currency)}</span>
              </div>
              {budgetAnalysis.daysLeft>0&&budgetAnalysis.remain>0&&(
                <p style={{margin:0,fontSize:12,color:"#1565C0",fontWeight:700}}>
                  💡 Daily limit: {fmt(budgetAnalysis.dailyLimit,currency)} for {budgetAnalysis.daysLeft} days left
                </p>
              )}
            </div>
          )}

          <div style={S.summaryRow}>
            <SummaryCard label="📥 Income"  value={fmt(todayIn, currency)}  color="#2E7D32" border="#A5D6A7"/>
            <SummaryCard label="📤 Expense" value={fmt(todayOut,currency)} color="#C62828" border="#EF9A9A"/>
          </div>
          <BalanceCard label="💼 Net Today" value={fmt(todayIn-todayOut,currency)} positive={todayIn-todayOut>=0}/>

          {/* Bill scanner hint */}
          <div style={S.aiHintBox}>
            <span style={{fontSize:18}}>📷</span>
            <div>
              <p style={{margin:0,fontSize:12,fontWeight:800,color:"#1565C0"}}>AI Bill Scanner</p>
              <p style={{margin:0,fontSize:11,color:"#555"}}>Tap the 📷 button in the header to scan any receipt — amount auto-fills!</p>
            </div>
          </div>

          {todayTx.length===0
            ? <Empty icon="💰" text="No transactions today" sub="Tap ➕ below or 📷 to scan a bill"/>
            : [...todayTx].reverse().map(tx=><TxRow key={tx.id} tx={tx} currency={currency} onDelete={handleDelete}/>)
          }
          <div style={S.actionRow}>
            <button style={S.actionBtn} onClick={()=>exportToExcel(transactions,currency)}>📊 Excel</button>
            <button style={{...S.actionBtn,color:"#C62828",borderColor:"#EF9A9A"}} onClick={()=>setShowDeleteAll(true)}>🗑️ Clear All</button>
          </div>
        </div>
      )}

      {/* ════ MONTHLY ════ */}
      {activeTab==="monthly" && (
        <div style={S.section}>
          <MonthNav month={viewMonth} year={viewYear} onChange={navMonth}/>
          <div style={S.summaryRow}>
            <SummaryCard label="📥 Income"  value={fmt(monthIn, currency)}  color="#2E7D32" border="#A5D6A7"/>
            <SummaryCard label="📤 Expense" value={fmt(monthOut,currency)} color="#C62828" border="#EF9A9A"/>
          </div>
          <BalanceCard label="💾 Savings" value={fmt(monthIn-monthOut,currency)} positive={monthIn-monthOut>=0}/>
          {monthTx.length===0
            ? <Empty icon="📅" text={`No transactions in ${getMonthName(viewMonth)}`} sub=""/>
            : [...monthTx].reverse().map(tx=><TxRow key={tx.id} tx={tx} currency={currency} onDelete={handleDelete}/>)
          }
          <button style={S.fullBtn} onClick={()=>exportToExcel(transactions,currency)}>📥 Download Excel Report</button>
        </div>
      )}

      {/* ════ CHARTS ════ */}
      {activeTab==="charts" && (
        <div style={S.section}>
          <MonthNav month={viewMonth} year={viewYear} onChange={navMonth}/>
          <div style={S.card}>
            <p style={S.cardTitle}>📊 {getMonthName(viewMonth)} Overview</p>
            <div style={{display:"flex",gap:16,justifyContent:"center",alignItems:"flex-end",height:160,paddingBottom:8}}>
              {[{label:"📥 In",val:monthIn,color:"#4CAF50"},{label:"📤 Out",val:monthOut,color:"#EF5350"},{label:"💾 Save",val:Math.abs(monthIn-monthOut),color:monthIn-monthOut>=0?"#4A90E2":"#FF7043"}].map(bar=>{
                const h=Math.max(6,(bar.val/Math.max(monthIn,monthOut,1))*120);
                return(<div key={bar.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <p style={{margin:0,fontSize:11,fontWeight:700,color:bar.color}}>{fmt(bar.val,currency)}</p>
                  <div style={{width:52,height:h,background:bar.color,borderRadius:"6px 6px 0 0"}}/>
                  <p style={{margin:0,fontSize:11,color:"#666",fontWeight:700}}>{bar.label}</p>
                </div>);
              })}
            </div>
            {monthIn>0&&(<div style={{background:"#f0f4f8",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}>
              <p style={{margin:0,fontSize:12,color:"#666"}}>Savings Rate</p>
              <p style={{margin:0,fontSize:18,fontWeight:900,color:monthIn-monthOut>=0?"#2E7D32":"#C62828"}}>{Math.round(((monthIn-monthOut)/monthIn)*100)}%</p>
            </div>)}
          </div>
          <div style={S.card}>
            <p style={S.cardTitle}>🏷️ Spending by Category</p>
            {catBreakdown.length===0?<p style={{color:"#aaa",fontSize:12,textAlign:"center",padding:"16px 0"}}>No expenses this month</p>
              :catBreakdown.map(({cat,total})=>(
              <div key={cat.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18,width:26,textAlign:"center"}}>{cat.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#333"}}>{cat.label}</span>
                    <span style={{fontSize:12,fontWeight:800,color:"#555"}}>{fmt(total,currency)}</span>
                  </div>
                  <div style={{height:7,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(total/maxCatAmt)*100}%`,background:"#4A90E2",borderRadius:4}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ YEARLY ════ */}
      {activeTab==="yearly" && (
        <div style={S.section}>
          <div style={S.monthNav}>
            <button style={S.navBtn} onClick={()=>setViewYear(y=>y-1)}>◀</button>
            <p style={S.monthLabel}>{viewYear} Overview</p>
            <button style={S.navBtn} onClick={()=>setViewYear(y=>y+1)}>▶</button>
          </div>
          <div style={S.summaryRow}>
            <SummaryCard label="📥 Total In"  value={fmt(yearlyData.reduce((s,d)=>s+d.income, 0),currency)} color="#2E7D32" border="#A5D6A7" small/>
            <SummaryCard label="📤 Total Out" value={fmt(yearlyData.reduce((s,d)=>s+d.expense,0),currency)} color="#C62828" border="#EF9A9A" small/>
          </div>
          <div style={S.card}>
            <p style={S.cardTitle}>📊 Jan–Dec {viewYear}</p>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:110,overflowX:"auto",paddingBottom:4}}>
              {yearlyData.map((d,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flex:1,minWidth:20}}>
                  <div style={{display:"flex",gap:2,alignItems:"flex-end",height:84}}>
                    <div style={{width:9,height:Math.max(2,(d.income/maxYearAmt)*84),background:"#4CAF50",borderRadius:"3px 3px 0 0"}}/>
                    <div style={{width:9,height:Math.max(2,(d.expense/maxYearAmt)*84),background:"#EF5350",borderRadius:"3px 3px 0 0"}}/>
                  </div>
                  <p style={{margin:0,fontSize:8,color:"#888",fontWeight:700}}>{d.month}</p>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:14,justifyContent:"center"}}>
              <LegendDot color="#4CAF50" label="Income"/>
              <LegendDot color="#EF5350" label="Expense"/>
            </div>
          </div>
          <div style={S.card}>
            <p style={S.cardTitle}>📋 Month by Month</p>
            {yearlyData.map((d,i)=>{
              const net=d.income-d.expense,has=d.income>0||d.expense>0;
              return(<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"7px 0",borderBottom:i<11?"1px solid #f8f8f8":"none",opacity:has?1:0.35}}>
                <span style={S.yearMonth}>{d.month}</span>
                <span style={{flex:1,fontSize:11,color:"#2E7D32"}}>{d.income>0?fmt(d.income,currency):"—"}</span>
                <span style={{flex:1,fontSize:11,color:"#C62828"}}>{d.expense>0?fmt(d.expense,currency):"—"}</span>
                <span style={{minWidth:70,fontSize:11,fontWeight:800,color:net>=0?"#1565C0":"#C62828",textAlign:"right"}}>{has?(net>=0?"+":"")+fmt(net,currency):"—"}</span>
              </div>);
            })}
          </div>
          <button style={S.fullBtn} onClick={()=>exportToExcel(transactions,currency)}>📥 Download Full Year Excel</button>
        </div>
      )}

      {/* ════ AI TAB ════ */}
      {activeTab==="ai" && (
        <div style={S.section}>

          {/* ── AI Feature 2: Insights ── */}
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={S.cardTitle}>💡 AI Spending Insights</p>
              <button style={S.refreshBtn} onClick={loadInsights} disabled={insightLoading}>
                {insightLoading?"⏳":"🔄"}
              </button>
            </div>
            <MonthNav month={viewMonth} year={viewYear} onChange={navMonth}/>
            {insightLoading
              ? <p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"20px 0"}}>🧠 Analyzing your spending...</p>
              : insights.length===0
                ? <p style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"20px 0"}}>Add transactions to see insights</p>
                : insights.map((ins,i)=>(
                  <div key={i} style={{...S.insightRow,background:ins.type==="good"?"#E8F5E9":ins.type==="warn"?"#FFF3E0":"#EBF3FD",borderColor:ins.type==="good"?"#A5D6A7":ins.type==="warn"?"#FFCC80":"#BBDEFB"}}>
                    <span style={{fontSize:22,flexShrink:0}}>{ins.icon}</span>
                    <div>
                      <p style={{margin:0,fontSize:13,fontWeight:800,color:"#1a1a2e"}}>{ins.title}</p>
                      <p style={{margin:"3px 0 0",fontSize:12,color:"#555",lineHeight:1.5}}>{ins.desc}</p>
                    </div>
                  </div>
                ))
            }
            <p style={{margin:0,fontSize:10,color:"#bbb",textAlign:"center"}}>
              {("ai" in (typeof window!=="undefined"?window:{}))?"🤖 Powered by Chrome AI + smart math":"📊 Powered by smart math analysis"}
            </p>
          </div>

          {/* ── AI Feature 3: Budget Planner ── */}
          <div style={S.card}>
            <p style={S.cardTitle}>🎯 Budget Planner</p>
            {!budgetGoal ? (
              <>
                <p style={{margin:0,fontSize:13,color:"#555"}}>Set a monthly spending budget and get daily limit alerts.</p>
                <div style={{display:"flex",gap:8}}>
                  <input type="number" inputMode="decimal" placeholder={`Budget (${currency.symbol})`}
                    value={budgetInput} onChange={e=>setBudgetInput(e.target.value)}
                    style={{...S.input,flex:1}}/>
                  <button style={{...S.fullBtn,width:"auto",padding:"0 20px"}} onClick={handleSaveBudget}>Set</button>
                </div>
              </>
            ) : budgetAnalysis ? (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,color:"#555"}}>Budget: {fmt(budgetGoal.amount,currency)}</span>
                  <button style={{background:"none",border:"none",fontSize:12,color:"#EF5350",cursor:"pointer",fontWeight:700}} onClick={()=>{setBudgetGoal(null);localStorage.removeItem("aksharakosha_budget");}}>Remove</button>
                </div>
                <div style={{height:12,background:"#f0f4f8",borderRadius:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${budgetAnalysis.pct}%`,background:budgetAnalysis.status==="over"?"#EF5350":budgetAnalysis.status==="warn"?"#FF9800":"#4CAF50",borderRadius:6,transition:"width 0.4s"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                  <span style={{color:"#C62828",fontWeight:700}}>Spent: {fmt(budgetAnalysis.spent,currency)}</span>
                  <span style={{color:"#2E7D32",fontWeight:700}}>Left: {fmt(budgetAnalysis.remain,currency)}</span>
                </div>
                {budgetAnalysis.status==="over"
                  ? <div style={{...S.insightRow,background:"#FFEBEE",borderColor:"#EF9A9A"}}><span>🚨</span><p style={{margin:0,fontSize:12,fontWeight:700,color:"#C62828"}}>Over budget by {fmt(budgetAnalysis.spent-budgetGoal.amount,currency)}!</p></div>
                  : <div style={{...S.insightRow,background:"#EBF3FD",borderColor:"#BBDEFB"}}><span>💡</span><p style={{margin:0,fontSize:12,color:"#1565C0"}}>Spend max <strong>{fmt(budgetAnalysis.dailyLimit,currency)}/day</strong> for the next {budgetAnalysis.daysLeft} days to stay on track.</p></div>
                }
              </>
            ) : null}
          </div>

          {/* ── AI Feature 4: Bill Scanner ── */}
          <div style={S.card}>
            <p style={S.cardTitle}>📷 AI Bill Scanner</p>
            <p style={{margin:0,fontSize:13,color:"#555",lineHeight:1.6}}>
              Take a photo of any receipt or bill. AI reads the amount and merchant name, then auto-fills the expense form.
            </p>
            <label style={{...S.fullBtn,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",background:"#1565C0"}}>
              {scanLoading?"⏳ Scanning...":"📷 Tap to Scan Receipt"}
              <input type="file" accept="image/*" capture="environment" hidden onChange={handleScanBill}/>
            </label>
            {scanResult && (
              <div style={{...S.insightRow,background:scanResult.amount?"#E8F5E9":"#FFF3E0",borderColor:scanResult.amount?"#A5D6A7":"#FFCC80"}}>
                <span style={{fontSize:22}}>{scanResult.amount?"✅":"⚠️"}</span>
                <div>
                  <p style={{margin:0,fontSize:13,fontWeight:800,color:"#1a1a2e"}}>
                    {scanResult.amount?`${fmt(scanResult.amount,currency)} detected`:"Amount not found"}
                  </p>
                  <p style={{margin:"2px 0 0",fontSize:12,color:"#555"}}>{scanResult.note}</p>
                </div>
              </div>
            )}
            <p style={{margin:0,fontSize:11,color:"#aaa",textAlign:"center"}}>
              Powered by Tesseract.js · Works offline · No data uploaded
            </p>
          </div>

          {/* ── AI Feature 1: Auto-categorize demo ── */}
          <div style={S.card}>
            <p style={S.cardTitle}>🧠 Smart Auto-Categorize</p>
            <p style={{margin:0,fontSize:13,color:"#555",lineHeight:1.6}}>
              When adding an expense, just type the note — category is selected automatically.
            </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
  {[["swiggy biryani","🍱 Food"],["ola cab","🚗 Transport"],["apollo pharmacy","🏥 Medical"],["amazon order","🛍️ Shopping"],["salary credited","💰 Salary"]].map(([ex,cat])=>(
    <div key={ex} style={{background:"#f0f4f8",borderRadius:8,padding:"6px 10px",fontSize:11}}>
      <span style={{color:"#888"}}>{`"${ex}"`}</span> → <strong style={{color:"#4CAF50"}}>{cat}</strong>
    </div>
  ))}
</div>
          </div>

        </div>
      )}

      {/* ════ HELP ════ */}
      {activeTab==="help" && (
        <div style={S.section}>
          <div style={S.card}>
            <p style={S.cardTitle}>🚀 How to Use AksharaKosha</p>
            {[
              ["1️⃣","Select currency","Tap flag button top right → pick your country"],
              ["2️⃣","Scan a bill","Tap 📷 in header → photo of receipt → auto-fills amount"],
              ["3️⃣","Add expense","Tap ➕ → type note → category auto-selected → save"],
              ["4️⃣","Add income","Tap ➕ → Income → enter salary → save"],
              ["5️⃣","Set budget","🧠 AI tab → Budget Planner → enter monthly limit"],
              ["6️⃣","View insights","🧠 AI tab → AI Spending Insights → see tips"],
              ["7️⃣","Monthly view","📅 tab → use ◀▶ to browse months"],
              ["8️⃣","Charts","📊 tab → income vs expense + category breakdown"],
              ["9️⃣","Excel export","Tap 📥 Download Excel in Monthly or Yearly tab"],
              ["🔟","Delete all","❓ Help tab → Danger Zone → Delete All"],
            ].map(([num,title,desc])=>(
              <div key={num} style={S.helpRow}>
                <span style={S.helpNum}>{num}</span>
                <div><p style={S.helpTitle}>{title}</p><p style={S.helpDesc}>{desc}</p></div>
              </div>
            ))}
          </div>
          <div style={{...S.card,border:"1.5px solid #FFCDD2"}}>
            <p style={{...S.cardTitle,color:"#C62828"}}>⚠️ Danger Zone</p>
            <p style={{margin:0,fontSize:13,color:"#666"}}>Permanently delete all transactions. Cannot be undone.</p>
            <button style={{...S.fullBtn,background:"#EF5350",marginTop:4}} onClick={()=>setShowDeleteAll(true)}>🗑️ Delete All My Data</button>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button style={S.fab} onClick={()=>setShowForm(true)}>＋</button>

      {/* ── Add Transaction Modal ── */}
      {showForm && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <p style={S.modalTitle}>{form.type==="income"?"📥 Add Income":"📤 Add Expense"}</p>
              <button style={S.closeBtn} onClick={()=>{setShowForm(false);setForm(emptyForm());setScanResult(null);}}>✕</button>
            </div>
            <div style={{display:"flex",gap:8}}>
              {(["expense","income"] as const).map(type=>(
                <button key={type} style={{...S.typeBtn,background:form.type===type?(type==="income"?"#4CAF50":"#EF5350"):"#f0f4f8",color:form.type===type?"#fff":"#666"}}
                  onClick={()=>setForm(f=>({...f,type,categoryId:autoCategorize(f.note,type)}))}>
                  {type==="income"?"📥 Income":"📤 Expense"}
                </button>
              ))}
            </div>

            <FormField label={`Amount (${currency.symbol})`}>
              <input type="number" inputMode="decimal" placeholder="0.00" value={form.amount}
                onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                style={{...S.input,fontSize:22,fontWeight:800,textAlign:"center"}} autoFocus/>
            </FormField>

            {/* Note with auto-categorize */}
            <FormField label="Note (AI auto-categorizes)">
              <input type="text" placeholder="e.g. Swiggy dinner, Ola cab..." value={form.note}
                onChange={e=>handleNoteChange(e.target.value)} style={S.input}/>
              {form.note && (
                <p style={{margin:0,fontSize:11,color:"#4CAF50",fontWeight:700}}>
                  🧠 Auto-selected: {getCat(form.categoryId).icon} {getCat(form.categoryId).label}
                </p>
              )}
            </FormField>

            <FormField label="Category (tap to override)">
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {CATEGORIES.filter(c=>c.type===form.type||c.type==="both").map(cat=>(
                  <button key={cat.id} style={{...S.catChip,background:form.categoryId===cat.id?"#EBF3FD":"#f8f9fa",borderColor:form.categoryId===cat.id?"#4A90E2":"#e0e0e0",fontWeight:form.categoryId===cat.id?800:600}}
                    onClick={()=>setForm(f=>({...f,categoryId:cat.id}))}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Date">
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={S.input}/>
            </FormField>

            <button style={{...S.saveBtn,background:form.type==="income"?"#4CAF50":"#4A90E2"}} onClick={handleSave}>
              💾 Save {form.type==="income"?"Income":"Expense"}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete All Confirm ── */}
      {showDeleteAll && (
        <div style={S.overlay}>
          <div style={{...S.modal,gap:16}}>
            <p style={{...S.modalTitle,color:"#C62828"}}>⚠️ Delete All Data?</p>
            <p style={{margin:0,fontSize:13,color:"#555",lineHeight:1.7}}>This will permanently delete <strong>all {transactions.length} transactions</strong>. Cannot be undone.</p>
            <div style={{display:"flex",gap:10}}>
              <button style={{...S.typeBtn,flex:1,background:"#f0f4f8",color:"#555"}} onClick={()=>setShowDeleteAll(false)}>Cancel</button>
              <button style={{...S.typeBtn,flex:1,background:"#EF5350",color:"#fff"}} onClick={handleDeleteAll}>Yes, Delete All</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────
function SummaryCard({label,value,color,border,small=false}:{label:string;value:string;color:string;border:string;small?:boolean}) {
  return(<div style={{flex:1,background:"#fff",borderRadius:12,padding:"12px 14px",border:`1.5px solid ${border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
    <p style={{margin:"0 0 4px",fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</p>
    <p style={{margin:0,fontSize:small?13:16,fontWeight:800,color}}>{value}</p>
  </div>);
}
function BalanceCard({label,value,positive}:{label:string;value:string;positive:boolean}) {
  return(<div style={{background:"#fff",borderRadius:12,padding:"14px 16px",border:`2px solid ${positive?"#4A90E2":"#EF5350"}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <p style={{margin:0,fontSize:12,fontWeight:700,color:"#666"}}>{label}</p>
    <p style={{margin:0,fontSize:20,fontWeight:900,color:positive?"#1565C0":"#C62828"}}>{positive?"+":""}{value}</p>
  </div>);
}
function TxRow({tx,currency,onDelete}:{tx:Transaction;currency:CurrencyConfig;onDelete:(id:string)=>void}) {
  const cat=getCat(tx.categoryId);
  return(<div style={{background:"#fff",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
    <div style={{width:36,height:36,borderRadius:10,background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.icon}</div>
    <div style={{flex:1}}>
      <p style={{margin:0,fontSize:13,fontWeight:700,color:"#1a1a2e"}}>{cat.label}</p>
      {tx.note&&<p style={{margin:"1px 0 0",fontSize:11,color:"#888"}}>{tx.note}</p>}
      <p style={{margin:"2px 0 0",fontSize:10,color:"#bbb"}}>{tx.date}</p>
    </div>
    <p style={{margin:0,fontSize:14,fontWeight:800,color:tx.type==="income"?"#2E7D32":"#C62828",flexShrink:0}}>{tx.type==="income"?"+":"-"}{fmt(tx.amount,currency)}</p>
    <button style={{background:"none",border:"none",cursor:"pointer",fontSize:14,padding:"4px",flexShrink:0}} onClick={()=>onDelete(tx.id)}>🗑️</button>
  </div>);
}
function MonthNav({month,year,onChange}:{month:number;year:number;onChange:(d:1|-1)=>void}) {
  return(<div style={{background:"#fff",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
    <button style={S.navBtn} onClick={()=>onChange(-1)}>◀</button>
    <p style={S.monthLabel}>{getMonthName(month)} {year}</p>
    <button style={S.navBtn} onClick={()=>onChange(1)}>▶</button>
  </div>);
}
function Empty({icon,text,sub}:{icon:string;text:string;sub:string}) {
  return(<div style={{textAlign:"center",padding:"36px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
    <p style={{fontSize:32,margin:0}}>{icon}</p>
    <p style={{color:"#aaa",fontSize:13,margin:0}}>{text}</p>
    {sub&&<p style={{color:"#bbb",fontSize:12,margin:0}}>{sub}</p>}
  </div>);
}
function FormField({label,children}:{label:string;children:React.ReactNode}) {
  return(<div style={{display:"flex",flexDirection:"column",gap:6}}>
    <p style={{margin:0,fontSize:11,fontWeight:800,color:"#888",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</p>
    {children}
  </div>);
}
function LegendDot({color,label}:{color:string;label:string}) {
  return(<div style={{display:"flex",alignItems:"center",gap:5}}>
    <div style={{width:12,height:12,background:color,borderRadius:2}}/>
    <span style={{fontSize:11,color:"#666"}}>{label}</span>
  </div>);
}

// ─── Styles ───────────────────────────────────────────────────
const S:Record<string,React.CSSProperties>={
  page:         {fontFamily:"Montserrat, sans-serif",minHeight:"100vh",background:"#f0f4f8",paddingBottom:90},
  header:       {background:"linear-gradient(135deg,#1B5E20 0%,#4CAF50 100%)",padding:"18px 16px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"},
  headerSub:    {margin:0,fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.6)",letterSpacing:"0.2em"},
  headerTitle:  {margin:"4px 0 0",fontSize:22,fontWeight:800,color:"#fff"},
  currBtn:      {background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:20,padding:"6px 14px",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"Montserrat, sans-serif"},
  scanBtn:      {background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",flexShrink:0},
  currDropdown: {background:"#fff",margin:"0 12px",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",overflow:"hidden",border:"1px solid #e0e0e0",zIndex:100,maxHeight:340,overflowY:"auto"},
  currRegionLabel:{padding:"8px 16px 4px",fontSize:10,fontWeight:800,color:"#4CAF50",letterSpacing:"0.1em",background:"#f9f9f9"},
  currOption:   {width:"100%",padding:"11px 16px",border:"none",borderBottom:"1px solid #f0f0f0",fontSize:13,cursor:"pointer",fontFamily:"Montserrat, sans-serif",textAlign:"left"},
  tabBar:       {display:"flex",margin:"12px 12px 0",background:"#fff",borderRadius:14,padding:4,gap:2,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"},
  tab:          {flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 2px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"Montserrat, sans-serif",background:"transparent",transition:"all 0.18s"},
  tabActive:    {background:"#4CAF50",boxShadow:"0 3px 10px rgba(76,175,80,0.4)",transform:"translateY(-1px)"},
  section:      {padding:"12px",display:"flex",flexDirection:"column",gap:10},
  summaryRow:   {display:"flex",gap:10},
  card:         {background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:12},
  cardTitle:    {margin:0,fontSize:13,fontWeight:800,color:"#4CAF50"},
  monthNav:     {background:"#fff",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"},
  monthLabel:   {margin:0,fontSize:15,fontWeight:800,color:"#1a1a2e"},
  navBtn:       {background:"#f0f4f8",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:14,fontWeight:800,color:"#4CAF50"},
  yearMonth:    {width:28,fontSize:11,fontWeight:800,color:"#555",flexShrink:0},
  actionRow:    {display:"flex",gap:10},
  actionBtn:    {flex:1,padding:"10px 0",background:"#fff",border:"1.5px solid #e0e0e0",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Montserrat, sans-serif",color:"#4CAF50"},
  fullBtn:      {padding:"13px 0",background:"#4CAF50",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"Montserrat, sans-serif",width:"100%"},
  insightRow:   {display:"flex",gap:12,alignItems:"flex-start",padding:"12px",borderRadius:12,border:"1.5px solid"},
  aiHintBox:    {display:"flex",gap:12,alignItems:"center",padding:"12px 14px",background:"#EBF3FD",borderRadius:12,border:"1.5px solid #BBDEFB"},
  refreshBtn:   {background:"#f0f4f8",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,fontWeight:700},
  fab:          {position:"fixed",bottom:24,right:20,width:56,height:56,borderRadius:"50%",background:"#4CAF50",border:"none",color:"#fff",fontSize:28,cursor:"pointer",boxShadow:"0 4px 16px rgba(76,175,80,0.5)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"},
  overlay:      {position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  modal:        {background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",padding:"20px 16px 32px",display:"flex",flexDirection:"column",gap:14},
  modalHeader:  {display:"flex",justifyContent:"space-between",alignItems:"center"},
  modalTitle:   {margin:0,fontSize:16,fontWeight:800,color:"#1a1a2e"},
  closeBtn:     {background:"#f0f4f8",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14,color:"#666"},
  typeBtn:      {flex:1,padding:"10px 0",borderRadius:10,border:"none",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"Montserrat, sans-serif",transition:"all 0.15s"},
  input:        {padding:"11px 14px",borderRadius:10,border:"1.5px solid #e0e0e0",fontSize:14,fontFamily:"Montserrat, sans-serif",background:"#fafafa",width:"100%",boxSizing:"border-box",outline:"none"},
  catChip:      {padding:"6px 10px",borderRadius:20,border:"1.5px solid",fontSize:12,cursor:"pointer",fontFamily:"Montserrat, sans-serif",transition:"all 0.12s"},
  saveBtn:      {padding:"14px 0",borderRadius:12,border:"none",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"Montserrat, sans-serif",marginTop:4},
  toast:        {position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#1a1a2e",color:"#fff",padding:"12px 24px",borderRadius:30,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,0.3)",whiteSpace:"nowrap"},
  helpRow:      {display:"flex",gap:12,alignItems:"flex-start",paddingBottom:10,borderBottom:"1px solid #f5f5f5"},
  helpNum:      {fontSize:18,flexShrink:0,width:26},
  helpTitle:    {margin:"0 0 2px",fontSize:13,fontWeight:800,color:"#1a1a2e"},
  helpDesc:     {margin:0,fontSize:12,color:"#666",lineHeight:1.6},
};

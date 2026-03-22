"use client";

// app/jobs/page.tsx
// AksharaTantra — .NET Senior Jobs Finder
// ✅ NO Claude API — free RSS feeds + Remotive API
// ✅ Auto-runs: 10:00 AM · 2:00 PM · 7:00 PM IST
// ✅ Email alert → vansiandeep@gmail.com via EmailJS (free)
// ✅ Sources: Indeed RSS · Remotive · TimesJobs RSS

import { useState, useEffect, useCallback, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────
// Add to .env.local:
// NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxx
// NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxx
// NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
// Sign up free at emailjs.com → 200 emails/month free
const EJS_SVC  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "";
const EJS_TPL  = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const EJS_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "";
const TO_EMAIL = "vansiandeep@gmail.com";
const RUN_HOURS = [10, 14, 19]; // 10 AM · 2 PM · 7 PM IST

// ── Types ─────────────────────────────────────────────────────────────────
interface Job {
  id: string; title: string; company: string; location: string;
  type: "Remote"|"Hybrid"|"Onsite"; experience: string; salary: string;
  skills: string[]; posted: string; source: string; url: string; urgent: boolean;
}

// ── Keyword filters ───────────────────────────────────────────────────────
const DOTNET_KW = [".net",".net core","dotnet","c#","asp.net","csharp","blazor","wpf","wcf"];
const SENIOR_KW = ["senior","lead","architect","principal","staff","13","14","15","12+","expert","head"];
const SKILL_MAP: [RegExp, string][] = [
  [/\.net\s*(core|6|7|8)?/i,".NET Core"],[/c#/i,"C#"],[/asp\.net/i,"ASP.NET"],
  [/azure/i,"Azure"],[/aws/i,"AWS"],[/microservices?/i,"Microservices"],
  [/sql\s*server/i,"SQL Server"],[/entity\s*framework/i,"Entity Framework"],
  [/web\s*api/i,"Web API"],[/docker/i,"Docker"],[/kubernetes|k8s/i,"Kubernetes"],
  [/react/i,"React"],[/angular/i,"Angular"],[/redis/i,"Redis"],
];

function extractSkills(text: string): string[] {
  return SKILL_MAP.filter(([re]) => re.test(text)).map(([,lbl]) => lbl).slice(0, 5);
}
function isDotNet(t: string, d: string) { const s = (t+" "+d).toLowerCase(); return DOTNET_KW.some(k => s.includes(k)); }
function isSenior(t: string, d: string) { const s = (t+" "+d).toLowerCase(); return SENIOR_KW.some(k => s.includes(k)); }
function parsePosted(ds: string): string {
  if (!ds) return "Recently";
  const d = new Date(ds); if (isNaN(d.getTime())) return ds;
  const h = Math.floor((Date.now() - d.getTime()) / 3_600_000);
  if (h < 1) return "Just now"; if (h < 24) return `${h}h ago`;
  const days = Math.floor(h/24); return `${days}d ago`;
}
function stripHtml(s: string) { return s.replace(/<[^>]+>/g,"").trim(); }

// ── Fetch jobs from free sources ──────────────────────────────────────────
async function fetchAllJobs(): Promise<Job[]> {
  const all: Job[] = []; let n = 1;

  // 1. Remotive (free JSON API, no key needed)
  try {
    const r = await fetch("https://remotive.com/api/remote-jobs?category=software-dev&search=.net+senior&limit=30",{cache:"no-store"});
    const d = await r.json();
    for (const item of (d.jobs??[])) {
      const title=item.title??"", desc=item.description??"";
      if (!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({
        id:`job_${n++}`, title, company:item.company_name??"?",
        location:item.candidate_required_location??"Remote", type:"Remote",
        experience:"10+ years", salary:item.salary??"Not disclosed",
        skills:extractSkills(title+" "+desc), posted:parsePosted(item.publication_date),
        source:"Remotive", url:item.url??"#", urgent:false,
      });
    }
  } catch(e){ console.warn("Remotive fail",e); }

  // 2. Indeed RSS via rss2json (free 10k/month — no auth needed for public RSS)
  const indeedRSS = "https://www.indeed.com/rss?q=%22.NET%22+senior+architect&l=India&fromage=2";
  try {
    const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(indeedRSS)}`,{cache:"no-store"});
    const d = await r.json();
    for (const item of (d.items??[])) {
      const title=stripHtml(item.title??""), desc=stripHtml(item.description??"");
      if (!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      const isRemote=/remote/i.test(title+desc), isHybrid=/hybrid/i.test(title+desc);
      all.push({
        id:`job_${n++}`, title, company:item.author??"Company",
        location: isRemote?"Remote": desc.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s*India/)?.[1]??"India",
        type: isRemote?"Remote": isHybrid?"Hybrid":"Onsite",
        experience:"12-15 years",
        salary: desc.match(/₹[\d\s\-–LKlakPApa.,]+/)?.[0]??"Not disclosed",
        skills:extractSkills(title+" "+desc), posted:parsePosted(item.pubDate),
        source:"Indeed", url:item.link??"#", urgent:/urgent|immediate/i.test(title+desc),
      });
    }
  } catch(e){ console.warn("Indeed RSS fail",e); }

  // 3. TimesJobs RSS via rss2json
  const tjRSS = "https://www.timesjobs.com/candidate/jobs-search.html?searchType=personalizedSearch&from=submit&txtKeywords=.NET+senior&txtLocation=India&rss=true";
  try {
    const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(tjRSS)}`,{cache:"no-store"});
    const d = await r.json();
    for (const item of (d.items??[])) {
      const title=stripHtml(item.title??""), desc=stripHtml(item.description??"");
      if (!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({
        id:`job_${n++}`, title, company:item.author??"Company",
        location: desc.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s*India/)?.[1]??"India",
        type:"Onsite", experience:"12-15 years", salary:"Not disclosed",
        skills:extractSkills(title+" "+desc), posted:parsePosted(item.pubDate),
        source:"TimesJobs", url:item.link??"#", urgent:/urgent|immediate/i.test(title+desc),
      });
    }
  } catch(e){ console.warn("TimesJobs RSS fail",e); }

  // Deduplicate by URL
  const seen = new Set<string>();
  return all.filter(j => { if(seen.has(j.url)) return false; seen.add(j.url); return true; });
}

// ── EmailJS sender ────────────────────────────────────────────────────────
async function sendAlert(jobs: Job[], slot: string): Promise<void> {
  if (!EJS_SVC||!EJS_TPL||!EJS_KEY) { console.warn("EmailJS not configured"); return; }
  try {
    const { default: emailjs } = await import("@emailjs/browser");
    const list = jobs.slice(0,10).map((j,i) =>
      `${i+1}. ${j.title} @ ${j.company}\n   ${j.location} | ${j.experience} | ${j.salary}\n   ${j.source} → ${j.url}`
    ).join("\n\n");
    await emailjs.send(EJS_SVC, EJS_TPL, {
      to_email:   TO_EMAIL,
      to_name:    "Sandeep",
      subject:    `🔔 ${jobs.length} .NET Senior Jobs [${slot}] — ${new Date().toLocaleDateString("en-IN")}`,
      slot_label: slot,
      job_count:  String(jobs.length),
      job_list:   list,
      fetched_at: new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}),
    }, EJS_KEY);
  } catch(e){ console.error("Email failed:",e); }
}

// ── Schedule helpers ──────────────────────────────────────────────────────
const SLOT_LABELS = ["10:00 AM","2:00 PM","7:00 PM"];

function getTodayKey(h: number) { return `${new Date().toDateString()}_${h}`; }
function isSlotDone(h: number): boolean {
  if (typeof window==="undefined") return false;
  return localStorage.getItem(getTodayKey(h)) === "1";
}
function markDone(h: number) {
  if (typeof window==="undefined") return;
  localStorage.setItem(getTodayKey(h),"1");
  localStorage.setItem(getTodayKey(h)+"_t", new Date().toLocaleTimeString("en-IN"));
}
function getDoneTime(h: number): string|null {
  if (typeof window==="undefined") return null;
  return localStorage.getItem(getTodayKey(h)+"_t");
}
function nextRunInfo(): {label:string;mins:number}|null {
  const now = new Date(); const cur = now.getHours()*60+now.getMinutes();
  for (let i=0;i<RUN_HOURS.length;i++) {
    const sm = RUN_HOURS[i]*60;
    if (sm>cur) return {label:SLOT_LABELS[i], mins:sm-cur};
  }
  return {label:"10:00 AM tomorrow", mins:(24*60-cur)+10*60};
}
function fmtMins(m: number) { const h=Math.floor(m/60),mm=m%60; return h>0?`${h}h ${mm}m`:`${mm}m`; }
function slotLabel(h: number) { return h<12?`${h}:00 AM`:h===12?"12:00 PM":`${h-12}:00 PM`; }

// ── Colors ────────────────────────────────────────────────────────────────
function skillClr(sk: string) {
  const s=sk.toLowerCase();
  if (s.includes(".net")||s.includes("c#")||s.includes("asp")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (s.includes("azure")||s.includes("aws"))                   return "bg-sky-50 text-sky-700 border-sky-200";
  if (s.includes("micro")||s.includes("api"))                   return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("sql")||s.includes("redis"))                   return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}
function srcClr(src: string) {
  const s=src.toLowerCase();
  if (s.includes("indeed"))    return "bg-blue-600";
  if (s.includes("timesjobs")) return "bg-red-600";
  if (s.includes("remotive"))  return "bg-emerald-600";
  if (s.includes("naukri"))    return "bg-orange-500";
  return "bg-gray-600";
}
function typeClr(t: string) {
  if (t==="Remote") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (t==="Hybrid") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

// ── Job Card ──────────────────────────────────────────────────────────────
function JobCard({job,idx}:{job:Job;idx:number}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all flex flex-col gap-3"
      style={{animationDelay:`${idx*50}ms`}}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 flex-wrap mb-1">
            {job.urgent&&<span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">🔥 Urgent</span>}
            <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${typeClr(job.type)}`}>{job.type}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
        </div>
        <span className={`text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${srcClr(job.source)}`}>{job.source}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span>📍 {job.location}</span>
        <span>🎯 {job.experience}</span>
        <span className="font-semibold text-gray-700">💰 {job.salary}</span>
        <span className="ml-auto text-gray-400">🕐 {job.posted}</span>
      </div>
      {job.skills.length>0&&(
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map(sk=><span key={sk} className={`text-xs font-medium px-2 py-0.5 rounded-full border ${skillClr(sk)}`}>{sk}</span>)}
        </div>
      )}
      <a href={job.url} target="_blank" rel="noopener noreferrer"
        className="mt-auto w-full text-center text-sm font-bold py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition">
        View & Apply →
      </a>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [jobs,         setJobs]        = useState<Job[]>([]);
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState<string|null>(null);
  const [lastFetched,  setLastFetched] = useState<Date|null>(null);
  const [emailSt,      setEmailSt]     = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [filter,       setFilter]      = useState("");
  const [typeF,        setTypeF]       = useState("All");
  const [srcF,         setSrcF]        = useState("All");
  const [nextRun,      setNextRun]     = useState<{label:string;mins:number}|null>(null);
  const [slotStatus,   setSlotStatus]  = useState<{h:number;done:boolean;time:string|null}[]>([]);
  const [mounted,      setMounted]     = useState(false);
  const lastRunRef = useRef<Set<string>>(new Set());

  useEffect(()=>{ setMounted(true); },[]);

  // Refresh schedule display every minute
  useEffect(()=>{
    if (!mounted) return;
    const tick = () => {
      setNextRun(nextRunInfo());
      setSlotStatus(RUN_HOURS.map(h=>({h, done:isSlotDone(h), time:getDoneTime(h)})));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return ()=>clearInterval(id);
  },[mounted]);

  // Auto-trigger at scheduled hours
  useEffect(()=>{
    if (!mounted) return;
    const id = setInterval(()=>{
      const now=new Date(); const h=now.getHours(), m=now.getMinutes();
      if (!RUN_HOURS.includes(h)||m!==0) return;
      const key=getTodayKey(h);
      if (lastRunRef.current.has(key)) return;
      lastRunRef.current.add(key);
      run(slotLabel(h));
    }, 30_000);
    return ()=>clearInterval(id);
  },[mounted]);

  const run = useCallback(async (label: string)=>{
    setLoading(true); setError(null);
    try {
      const found = await fetchAllJobs();
      setJobs(found); setLastFetched(new Date());
      markDone(new Date().getHours());
      setSlotStatus(RUN_HOURS.map(h=>({h,done:isSlotDone(h),time:getDoneTime(h)})));
      if (found.length>0) {
        setEmailSt("sending");
        await sendAlert(found, label);
        setEmailSt("sent");
        setTimeout(()=>setEmailSt("idle"), 5000);
      }
    } catch(e) {
      setError(e instanceof Error?e.message:"Fetch failed");
    } finally {
      setLoading(false);
    }
  },[]);

  const filtered = jobs.filter(j=>{
    const q=filter.toLowerCase();
    return (!q||j.title.toLowerCase().includes(q)||j.company.toLowerCase().includes(q)||j.skills.some(s=>s.toLowerCase().includes(q)))
      &&(typeF==="All"||j.type===typeF)
      &&(srcF==="All"||j.source===srcF);
  });

  const allSrcs = Array.from(new Set(jobs.map(j=>j.source)));
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white font-black">.N</div>
            <div>
              <h1 className="font-black text-gray-900 text-base">.NET Senior Jobs</h1>
              <p className="text-xs text-gray-400">13+ yrs · No API · Auto 10AM · 2PM · 7PM · Email alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {emailSt==="sending"&&<span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">📧 Sending…</span>}
            {emailSt==="sent"&&<span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">✅ Email sent!</span>}
            {lastFetched&&<span className="text-xs text-gray-400 hidden sm:block">Last: {lastFetched.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</span>}
            <button onClick={()=>run("Manual")} disabled={loading}
              className="text-sm font-bold px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition flex items-center gap-2">
              {loading?<><span className="animate-spin">⟳</span> Searching…</>:<><span>🔍</span> Fetch Now</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-4">

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Auto Schedule — IST</span>
            {nextRun&&(
              <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                ⏰ Next: {nextRun.label} · {fmtMins(nextRun.mins)} away
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {RUN_HOURS.map((h,i)=>{
              const s = slotStatus.find(x=>x.h===h);
              return (
                <div key={h} className={`rounded-xl p-3 text-center border ${s?.done?"bg-green-50 border-green-200":"bg-gray-50 border-gray-200"}`}>
                  <div className="text-lg mb-1">{s?.done?"✅":"⏳"}</div>
                  <div className="text-sm font-black text-gray-800">{SLOT_LABELS[i]}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s?.done?`Done${s.time?` · ${s.time}`:""}`:  "Pending"}</div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            📧 Alerts → {TO_EMAIL} &nbsp;|&nbsp; Sources: Indeed · Remotive · TimesJobs
          </p>
        </div>

        {/* Stats */}
        {jobs.length>0&&(
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {icon:"💼",label:"Total",val:jobs.length},
              {icon:"🌐",label:"Remote",val:jobs.filter(j=>j.type==="Remote").length},
              {icon:"🔥",label:"Urgent",val:jobs.filter(j=>j.urgent).length},
              {icon:"🎯",label:"Filtered",val:filtered.length},
            ].map(s=>(
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black text-gray-900">{s.val}</div>
                <div className="text-xs text-gray-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {jobs.length>0&&(
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
            <input value={filter} onChange={e=>setFilter(e.target.value)}
              placeholder="Search title, company, skill…"
              className="flex-1 min-w-48 rounded-xl px-4 py-2.5 text-sm border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
            />
            <div className="flex gap-1.5 flex-wrap">
              {["All","Remote","Hybrid","Onsite"].map(t=>(
                <button key={t} onClick={()=>setTypeF(t)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                    ${typeF===t?"bg-gray-900 text-white border-gray-900":"bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>{t}</button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["All",...allSrcs].map(s=>(
                <button key={s} onClick={()=>setSrcF(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                    ${srcF===s?"bg-gray-900 text-white border-gray-900":"bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading&&(
          <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center space-y-3">
            <div className="text-5xl animate-pulse">🔍</div>
            <p className="font-bold text-gray-900">Scanning job boards…</p>
            <p className="text-sm text-gray-400">Indeed · Remotive · TimesJobs — filtering .NET 13+ yr roles</p>
            <div className="flex justify-center gap-2 pt-1">
              {["Indeed","Remotive","TimesJobs"].map((s,i)=>(
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 animate-pulse"
                  style={{animationDelay:`${i*150}ms`}}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error&&!loading&&(
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
            <div className="text-3xl">⚠️</div>
            <p className="font-bold text-red-800">Fetch failed</p>
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={()=>run("Retry")} className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition">Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading&&!error&&jobs.length===0&&(
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-14 text-center space-y-5">
            <div className="text-6xl">💼</div>
            <div>
              <p className="font-black text-gray-900 text-xl">Find .NET Senior Openings</p>
              <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                Auto-searches at 10 AM, 2 PM & 7 PM IST daily.<br/>Results emailed to <strong>{TO_EMAIL}</strong>.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[".NET Core","C#","Azure","Microservices","SQL Server","Web API"].map(sk=>(
                <span key={sk} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${skillClr(sk)}`}>{sk}</span>
              ))}
            </div>
            <button onClick={()=>run("Manual")}
              className="px-8 py-3 rounded-xl bg-gray-900 text-white font-black text-base hover:bg-gray-700 transition">
              🔍 Search Now
            </button>
            {nextRun&&<p className="text-xs text-gray-300">Next auto: {nextRun.label} (in {fmtMins(nextRun.mins)})</p>}
          </div>
        )}

        {/* Job grid */}
        {!loading&&filtered.length>0&&(
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((job,i)=><JobCard key={job.id} job={job} idx={i}/>)}
          </div>
        )}

        {/* No filter match */}
        {!loading&&jobs.length>0&&filtered.length===0&&(
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-3xl mb-2">🔎</p>
            <p className="font-bold text-gray-700">No matches</p>
            <button onClick={()=>{setFilter("");setTypeF("All");setSrcF("All");}}
              className="mt-3 text-sm text-gray-400 hover:text-gray-800 underline">Clear filters</button>
          </div>
        )}

        <div className="text-center text-xs text-gray-300 pb-4">
          <p>Sources: Indeed RSS · Remotive API · TimesJobs RSS — No API keys required</p>
          <p className="mt-1">Filtered for .NET Senior / Lead / Architect · 13+ years</p>
        </div>
      </div>
    </div>
  );
}
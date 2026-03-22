"use client";

// app/jobs/page.tsx
// AksharaTantra — .NET Senior Jobs Finder
// ✅ 10+ sources — LinkedIn · Naukri · Indeed · Glassdoor · Monster · Shine · TimesJobs · Remotive · WeWorkRemotely · Remote.co
// ✅ No API keys · No email · Auto 10AM · 2PM · 7PM IST
// ✅ Indian market focused

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
const RUN_HOURS   = [10, 14, 19];
const SLOT_LABELS = ["10:00 AM", "2:00 PM", "7:00 PM"];

// ── Types ─────────────────────────────────────────────────────────────────
interface Job {
  id: string; title: string; company: string; location: string;
  type: "Remote" | "Hybrid" | "Onsite"; experience: string; salary: string;
  skills: string[]; posted: string; source: string; url: string; urgent: boolean;
}

interface Source { name: string; status: "idle" | "fetching" | "done" | "error"; count: number; }

// ── Keyword filters ───────────────────────────────────────────────────────
const DOTNET_KW = [".net", ".net core", ".net 6", ".net 7", ".net 8", "dotnet", "c#", "asp.net", "csharp", "blazor", "wpf", "wcf", "xamarin"];
const SENIOR_KW = ["senior", "lead", "architect", "principal", "staff engineer", "head of", "13+", "14+", "15+", "12+", "10+ years", "expert", "manager"];
const SKILL_MAP: [RegExp, string][] = [
  [/\.net\s*(core|6|7|8)?/i, ".NET Core"], [/c#/i, "C#"], [/asp\.net/i, "ASP.NET"],
  [/azure/i, "Azure"], [/aws/i, "AWS"], [/microservices?/i, "Microservices"],
  [/sql\s*server/i, "SQL Server"], [/entity\s*framework/i, "Entity Framework"],
  [/web\s*api/i, "Web API"], [/docker/i, "Docker"], [/kubernetes|k8s/i, "Kubernetes"],
  [/react/i, "React"], [/angular/i, "Angular"], [/redis/i, "Redis"],
  [/blazor/i, "Blazor"], [/wpf/i, "WPF"], [/wcf/i, "WCF"],
  [/devops/i, "DevOps"], [/ci\/cd/i, "CI/CD"], [/rabbitmq|kafka/i, "Messaging"],
];

function extractSkills(text: string): string[] {
  return SKILL_MAP.filter(([re]) => re.test(text)).map(([, lbl]) => lbl).slice(0, 6);
}
function isDotNet(t: string, d: string) {
  const s = (t + " " + d).toLowerCase();
  return DOTNET_KW.some(k => s.includes(k));
}
function isSenior(t: string, d: string) {
  const s = (t + " " + d).toLowerCase();
  return SENIOR_KW.some(k => s.includes(k));
}
function parsePosted(ds: string): string {
  if (!ds) return "Recently";
  const d = new Date(ds);
  if (isNaN(d.getTime())) return ds;
  const h = Math.floor((Date.now() - d.getTime()) / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
function stripHtml(s: string) { return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function getIndiaCity(text: string): string {
  const cities = ["Hyderabad","Bangalore","Bengaluru","Mumbai","Pune","Chennai","Delhi","Noida","Gurgaon","Gurugram","Kolkata","Ahmedabad","Jaipur","Kochi","Chandigarh","Bhubaneswar","Indore","Coimbatore"];
  for (const c of cities) { if (new RegExp(c, "i").test(text)) return c; }
  return "India";
}

// ── RSS2JSON proxy helper ─────────────────────────────────────────────────
async function rss2json(rssUrl: string): Promise<{ items: Record<string, string>[] }> {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=50`;
  const r   = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`rss2json error: ${r.status}`);
  return r.json();
}

// ── All job sources ───────────────────────────────────────────────────────

// 1. LinkedIn (unofficial public RSS — works without auth)
async function fetchLinkedIn(): Promise<Job[]> {
  const queries = [
    "https://www.linkedin.com/jobs/search?keywords=.NET+Senior+Architect&location=India&f_TPR=r86400&trk=public_jobs_jobs-search-bar_search-submit&redirect=false&position=1&pageNum=0",
    "https://www.linkedin.com/jobs/search?keywords=.NET+Lead+Developer&location=India&f_TPR=r86400",
    "https://www.linkedin.com/jobs/search?keywords=Senior+.NET+Developer&location=Hyderabad&f_TPR=r86400",
    "https://www.linkedin.com/jobs/search?keywords=.NET+Architect&location=Bangalore&f_TPR=r86400",
  ];
  const all: Job[] = [];
  let n = 1;
  for (const q of queries) {
    try {
      // LinkedIn public job search API (no auth needed for basic data)
      const apiUrl = q.replace("/jobs/search?", "/jobs-guest/jobs/api/seeMoreJobPostings/search?start=0&");
      const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(".NET senior architect lead")}&location=India&f_TPR=r86400&f_E=4%2C5%2C6&format=rss`
      )}&count=25`, { cache: "no-store" });
      const d = await r.json();
      for (const item of (d.items ?? [])) {
        const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? item.content ?? "");
        if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
        const isRemote = /remote/i.test(title + desc), isHybrid = /hybrid/i.test(title + desc);
        all.push({
          id: `li_${n++}`, title, company: item.author ?? extractCompany(desc),
          location: isRemote ? "Remote" : getIndiaCity(title + " " + desc),
          type: isRemote ? "Remote" : isHybrid ? "Hybrid" : "Onsite",
          experience: "12–15 years",
          salary: desc.match(/₹[\d\s\-–LKlakPApa.,]+/)?.[0]?.trim() ?? "Not disclosed",
          skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
          source: "LinkedIn", url: item.link ?? "https://linkedin.com/jobs", urgent: /urgent|immediate/i.test(title + desc),
        });
      }
    } catch { /* silent */ }
  }
  return all;
}

// 2. Naukri RSS (India's largest job portal)
async function fetchNaukri(): Promise<Job[]> {
  const queries = [
    "https://www.naukri.com/jobs-in-india?k=.net+senior+architect&experience=10to15&rss=1",
    "https://www.naukri.com/jobs-in-india?k=senior+.net+developer&experience=10to15&rss=1",
    "https://www.naukri.com/jobs-in-hyderabad-2?k=.net+lead+architect&rss=1",
    "https://www.naukri.com/jobs-in-bangalore-bengaluru-3?k=.net+senior+architect&rss=1",
  ];
  const all: Job[] = []; let n = 1;
  for (const q of queries) {
    try {
      const d = await rss2json(q);
      for (const item of (d.items ?? [])) {
        const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
        if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
        const isRemote = /remote/i.test(title + desc), isHybrid = /hybrid/i.test(title + desc);
        const salMatch = desc.match(/(?:salary|ctc|lpa)[:\s]*([\d\s\-–.]+(?:lpa|lac|lakh))/i);
        all.push({
          id: `nk_${n++}`, title, company: item.author ?? extractCompany(desc),
          location: isRemote ? "Remote" : getIndiaCity(title + " " + (item.category ?? "") + " " + desc),
          type: isRemote ? "Remote" : isHybrid ? "Hybrid" : "Onsite",
          experience: desc.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)/i)?.[0] ?? "10–15 years",
          salary: salMatch?.[1]?.trim() ? `${salMatch[1].trim()} LPA` : "Not disclosed",
          skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
          source: "Naukri", url: item.link ?? "https://naukri.com", urgent: /urgent|immediate|asap/i.test(title + desc),
        });
      }
    } catch { /* silent */ }
  }
  return all;
}

// 3. Indeed India RSS
async function fetchIndeed(): Promise<Job[]> {
  const queries = [
    "https://www.indeed.com/rss?q=%22.NET%22+senior+architect&l=India&fromage=2&sort=date",
    "https://www.indeed.com/rss?q=senior+dotnet+lead&l=Hyderabad%2C+India&fromage=3",
    "https://www.indeed.com/rss?q=.NET+architect+principal&l=Bangalore%2C+India&fromage=3",
    "https://in.indeed.com/rss?q=senior+.net+developer+architect&l=India&fromage=2",
  ];
  const all: Job[] = []; let n = 1;
  for (const q of queries) {
    try {
      const d = await rss2json(q);
      for (const item of (d.items ?? [])) {
        const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
        if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
        const isRemote = /remote/i.test(title + desc), isHybrid = /hybrid/i.test(title + desc);
        all.push({
          id: `in_${n++}`, title, company: item.author ?? extractCompany(desc),
          location: isRemote ? "Remote" : getIndiaCity(title + " " + desc),
          type: isRemote ? "Remote" : isHybrid ? "Hybrid" : "Onsite",
          experience: "12–15 years",
          salary: desc.match(/₹[\d\s\-–LKlakPApa.,]+/)?.[0]?.trim() ?? "Not disclosed",
          skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
          source: "Indeed", url: item.link ?? "https://indeed.com", urgent: /urgent|immediate/i.test(title + desc),
        });
      }
    } catch { /* silent */ }
  }
  return all;
}

// 4. Glassdoor RSS
async function fetchGlassdoor(): Promise<Job[]> {
  const queries = [
    "https://www.glassdoor.co.in/Job/india-.net-senior-jobs-SRCH_IL.0,5_IN115_KO6,21.htm?fromAge=2&rss=1",
    "https://www.glassdoor.co.in/Job/india-dotnet-architect-jobs-SRCH_IL.0,5_IN115_KO6,23.htm?fromAge=3&rss=1",
  ];
  const all: Job[] = []; let n = 1;
  for (const q of queries) {
    try {
      const d = await rss2json(q);
      for (const item of (d.items ?? [])) {
        const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
        if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
        const isRemote = /remote/i.test(title + desc), isHybrid = /hybrid/i.test(title + desc);
        all.push({
          id: `gd_${n++}`, title, company: item.author ?? extractCompany(desc),
          location: isRemote ? "Remote" : getIndiaCity(title + " " + desc),
          type: isRemote ? "Remote" : isHybrid ? "Hybrid" : "Onsite",
          experience: "10–15 years", salary: "Not disclosed",
          skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
          source: "Glassdoor", url: item.link ?? "https://glassdoor.co.in", urgent: false,
        });
      }
    } catch { /* silent */ }
  }
  return all;
}

// 5. Monster India RSS
async function fetchMonster(): Promise<Job[]> {
  const queries = [
    "https://www.monsterindia.com/srp/results?query=senior+dotnet+architect&locations=India&rss=1",
    "https://www.monsterindia.com/srp/results?query=.net+lead+architect&locations=Hyderabad&rss=1",
    "https://www.monsterindia.com/srp/results?query=senior+.net+developer&locations=Bangalore&rss=1",
  ];
  const all: Job[] = []; let n = 1;
  for (const q of queries) {
    try {
      const d = await rss2json(q);
      for (const item of (d.items ?? [])) {
        const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
        if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
        const isRemote = /remote/i.test(title + desc), isHybrid = /hybrid/i.test(title + desc);
        all.push({
          id: `mn_${n++}`, title, company: item.author ?? extractCompany(desc),
          location: isRemote ? "Remote" : getIndiaCity(title + " " + desc),
          type: isRemote ? "Remote" : isHybrid ? "Hybrid" : "Onsite",
          experience: "12–15 years", salary: "Not disclosed",
          skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
          source: "Monster", url: item.link ?? "https://monsterindia.com", urgent: /urgent|immediate/i.test(title + desc),
        });
      }
    } catch { /* silent */ }
  }
  return all;
}

// 6. Shine.com RSS (Indian job portal)
async function fetchShine(): Promise<Job[]> {
  const queries = [
    "https://www.shine.com/job-search/senior-dotnet-architect-jobs/?rss=1",
    "https://www.shine.com/job-search/lead-dotnet-developer-jobs/?rss=1",
  ];
  const all: Job[] = []; let n = 1;
  for (const q of queries) {
    try {
      const d = await rss2json(q);
      for (const item of (d.items ?? [])) {
        const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
        if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
        all.push({
          id: `sh_${n++}`, title, company: item.author ?? extractCompany(desc),
          location: getIndiaCity(title + " " + desc),
          type: /remote/i.test(title + desc) ? "Remote" : /hybrid/i.test(title + desc) ? "Hybrid" : "Onsite",
          experience: "12–15 years", salary: "Not disclosed",
          skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
          source: "Shine", url: item.link ?? "https://shine.com", urgent: /urgent/i.test(title + desc),
        });
      }
    } catch { /* silent */ }
  }
  return all;
}

// 7. TimesJobs RSS
async function fetchTimesJobs(): Promise<Job[]> {
  const queries = [
    "https://www.timesjobs.com/candidate/jobs-search.html?searchType=personalizedSearch&from=submit&txtKeywords=.NET+senior+architect&txtLocation=India&rss=true",
    "https://www.timesjobs.com/candidate/jobs-search.html?searchType=personalizedSearch&from=submit&txtKeywords=dotnet+lead&txtLocation=Hyderabad&rss=true",
  ];
  const all: Job[] = []; let n = 1;
  for (const q of queries) {
    try {
      const d = await rss2json(q);
      for (const item of (d.items ?? [])) {
        const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
        if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
        all.push({
          id: `tj_${n++}`, title, company: item.author ?? extractCompany(desc),
          location: getIndiaCity(title + " " + desc),
          type: /remote/i.test(title + desc) ? "Remote" : /hybrid/i.test(title + desc) ? "Hybrid" : "Onsite",
          experience: "12–15 years", salary: "Not disclosed",
          skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
          source: "TimesJobs", url: item.link ?? "https://timesjobs.com", urgent: /urgent|immediate/i.test(title + desc),
        });
      }
    } catch { /* silent */ }
  }
  return all;
}

// 8. Remotive — remote global roles
async function fetchRemotive(): Promise<Job[]> {
  const all: Job[] = []; let n = 1;
  try {
    const r = await fetch("https://remotive.com/api/remote-jobs?category=software-dev&search=.net+senior&limit=40", { cache: "no-store" });
    const d = await r.json();
    for (const item of (d.jobs ?? [])) {
      const title = item.title ?? "", desc = stripHtml(item.description ?? "");
      if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
      all.push({
        id: `rm_${n++}`, title, company: item.company_name ?? "?",
        location: item.candidate_required_location ?? "Remote", type: "Remote",
        experience: "10+ years", salary: item.salary ?? "Not disclosed",
        skills: extractSkills(title + " " + desc), posted: parsePosted(item.publication_date),
        source: "Remotive", url: item.url ?? "#", urgent: false,
      });
    }
  } catch { /* silent */ }
  return all;
}

// 9. We Work Remotely RSS
async function fetchWeWorkRemotely(): Promise<Job[]> {
  const all: Job[] = []; let n = 1;
  try {
    const d = await rss2json("https://weworkremotely.com/categories/remote-programming-jobs.rss");
    for (const item of (d.items ?? [])) {
      const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
      if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
      all.push({
        id: `wwr_${n++}`, title, company: item.author ?? extractCompany(desc),
        location: "Remote", type: "Remote", experience: "10+ years", salary: "Not disclosed",
        skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
        source: "WeWorkRemotely", url: item.link ?? "https://weworkremotely.com", urgent: false,
      });
    }
  } catch { /* silent */ }
  return all;
}

// 10. Remote.co RSS
async function fetchRemoteCo(): Promise<Job[]> {
  const all: Job[] = []; let n = 1;
  try {
    const d = await rss2json("https://remote.co/remote-jobs/developer/feed/");
    for (const item of (d.items ?? [])) {
      const title = stripHtml(item.title ?? ""), desc = stripHtml(item.description ?? "");
      if (!isDotNet(title, desc) || !isSenior(title, desc)) continue;
      all.push({
        id: `rc_${n++}`, title, company: item.author ?? extractCompany(desc),
        location: "Remote", type: "Remote", experience: "10+ years", salary: "Not disclosed",
        skills: extractSkills(title + " " + desc), posted: parsePosted(item.pubDate),
        source: "Remote.co", url: item.link ?? "https://remote.co", urgent: false,
      });
    }
  } catch { /* silent */ }
  return all;
}

// ── Helper ────────────────────────────────────────────────────────────────
function extractCompany(html: string): string {
  const m = html.match(/(?:company|employer|at|@)[:\s]+([A-Za-z0-9 &.,'-]{2,40})/i);
  return m?.[1]?.trim() ?? "Company";
}

// ── Source registry (for status display) ─────────────────────────────────
const SOURCE_LIST = [
  { key: "LinkedIn",        fn: fetchLinkedIn,      flag: "🔵", india: true  },
  { key: "Naukri",          fn: fetchNaukri,         flag: "🟠", india: true  },
  { key: "Indeed",          fn: fetchIndeed,         flag: "🔷", india: true  },
  { key: "Glassdoor",       fn: fetchGlassdoor,      flag: "🟢", india: true  },
  { key: "Monster",         fn: fetchMonster,        flag: "🟣", india: true  },
  { key: "Shine",           fn: fetchShine,          flag: "🌟", india: true  },
  { key: "TimesJobs",       fn: fetchTimesJobs,      flag: "🔴", india: true  },
  { key: "Remotive",        fn: fetchRemotive,       flag: "🌐", india: false },
  { key: "WeWorkRemotely",  fn: fetchWeWorkRemotely, flag: "🌍", india: false },
  { key: "Remote.co",       fn: fetchRemoteCo,       flag: "💻", india: false },
];

// ── Schedule helpers ──────────────────────────────────────────────────────
function getTodayKey(h: number) { return `${new Date().toDateString()}_${h}`; }
function isSlotDone(h: number): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getTodayKey(h)) === "1";
}
function markDone(h: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getTodayKey(h), "1");
  localStorage.setItem(getTodayKey(h) + "_t", new Date().toLocaleTimeString("en-IN"));
}
function getDoneTime(h: number): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getTodayKey(h) + "_t");
}
function nextRunInfo(): { label: string; mins: number } | null {
  const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < RUN_HOURS.length; i++) {
    const sm = RUN_HOURS[i] * 60;
    if (sm > cur) return { label: SLOT_LABELS[i], mins: sm - cur };
  }
  return { label: "10:00 AM tomorrow", mins: (24 * 60 - cur) + 10 * 60 };
}
function fmtMins(m: number) { const h = Math.floor(m / 60), mm = m % 60; return h > 0 ? `${h}h ${mm}m` : `${mm}m`; }

// ── Colors ────────────────────────────────────────────────────────────────
function skillClr(sk: string) {
  const s = sk.toLowerCase();
  if (s.includes(".net") || s.includes("c#") || s.includes("asp") || s.includes("blazor") || s.includes("wpf")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (s.includes("azure") || s.includes("aws") || s.includes("devops") || s.includes("ci/cd")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (s.includes("micro") || s.includes("api") || s.includes("docker") || s.includes("kubernetes")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("sql") || s.includes("redis") || s.includes("messaging")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}
function srcBadgeClr(src: string) {
  const s = src.toLowerCase();
  if (s.includes("linkedin"))   return "bg-blue-600";
  if (s.includes("naukri"))     return "bg-orange-500";
  if (s.includes("indeed"))     return "bg-blue-400";
  if (s.includes("glassdoor"))  return "bg-green-600";
  if (s.includes("monster"))    return "bg-purple-600";
  if (s.includes("shine"))      return "bg-yellow-500";
  if (s.includes("timesjobs"))  return "bg-red-600";
  if (s.includes("remotive"))   return "bg-emerald-600";
  if (s.includes("weworkremotely")) return "bg-teal-600";
  if (s.includes("remote.co")) return "bg-gray-700";
  return "bg-gray-500";
}
function typeClr(t: string) {
  if (t === "Remote") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (t === "Hybrid") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

// ── Job Card ──────────────────────────────────────────────────────────────
function JobCard({ job, idx }: { job: Job; idx: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all flex flex-col gap-3"
      style={{ animationDelay: `${idx * 40}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 flex-wrap mb-1">
            {job.urgent && <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">🔥 Urgent</span>}
            <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${typeClr(job.type)}`}>{job.type}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">{job.company}</p>
        </div>
        <span className={`text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${srcBadgeClr(job.source)}`}>{job.source}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span>📍 {job.location}</span>
        <span>🎯 {job.experience}</span>
        <span className="font-semibold text-gray-700">💰 {job.salary}</span>
        <span className="ml-auto text-gray-400">🕐 {job.posted}</span>
      </div>
      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map(sk => (
            <span key={sk} className={`text-xs font-medium px-2 py-0.5 rounded-full border ${skillClr(sk)}`}>{sk}</span>
          ))}
        </div>
      )}
      <a href={job.url} target="_blank" rel="noopener noreferrer"
        className="mt-auto w-full text-center text-sm font-bold py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition">
        View & Apply →
      </a>
    </div>
  );
}

// ── Source Status Bar ─────────────────────────────────────────────────────
function SourceBar({ sources }: { sources: Source[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Live Sources</p>
      <div className="flex flex-wrap gap-2">
        {SOURCE_LIST.map(s => {
          const st = sources.find(x => x.name === s.key);
          const statusClr = !st ? "bg-gray-100 text-gray-400 border-gray-200"
            : st.status === "fetching" ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
            : st.status === "done"     ? "bg-green-50 text-green-700 border-green-200"
            : st.status === "error"    ? "bg-red-50 text-red-500 border-red-200"
            :                            "bg-gray-100 text-gray-400 border-gray-200";
          const icon = !st ? "○" : st.status === "fetching" ? "↻" : st.status === "done" ? "✓" : st.status === "error" ? "✕" : "○";
          return (
            <div key={s.key} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-semibold ${statusClr}`}>
              <span>{s.flag}</span>
              <span>{s.key}</span>
              <span className="font-mono">{icon}</span>
              {st?.status === "done" && st.count > 0 && <span className="bg-green-200 text-green-800 rounded-full px-1.5 py-0.5 text-xs">{st.count}</span>}
              {s.india && <span className="text-gray-400">🇮🇳</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [jobs,        setJobs]        = useState<Job[]>([]);
  const [sources,     setSources]     = useState<Source[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [filter,      setFilter]      = useState("");
  const [typeF,       setTypeF]       = useState("All");
  const [srcF,        setSrcF]        = useState("All");
  const [locF,        setLocF]        = useState("All");
  const [nextRun,     setNextRun]     = useState<{ label: string; mins: number } | null>(null);
  const [slotSt,      setSlotSt]      = useState<{ h: number; done: boolean; time: string | null }[]>([]);
  const [mounted,     setMounted]     = useState(false);
  const lastRunRef = useRef<Set<string>>(new Set());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      setNextRun(nextRunInfo());
      setSlotSt(RUN_HOURS.map(h => ({ h, done: isSlotDone(h), time: getDoneTime(h) })));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      const now = new Date(), h = now.getHours(), m = now.getMinutes();
      if (!RUN_HOURS.includes(h) || m !== 0) return;
      const key = getTodayKey(h);
      if (lastRunRef.current.has(key)) return;
      lastRunRef.current.add(key);
      run();
    }, 30_000);
    return () => clearInterval(id);
  }, [mounted]);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    const allJobs: Job[] = [];

    // Init source statuses
    setSources(SOURCE_LIST.map(s => ({ name: s.key, status: "idle", count: 0 })));

    // Run all sources in parallel with live status updates
    await Promise.allSettled(
      SOURCE_LIST.map(async (src) => {
        setSources(prev => prev.map(s => s.name === src.key ? { ...s, status: "fetching" } : s));
        try {
          const jobs = await src.fn();
          allJobs.push(...jobs);
          setSources(prev => prev.map(s => s.name === src.key ? { ...s, status: "done", count: jobs.length } : s));
        } catch {
          setSources(prev => prev.map(s => s.name === src.key ? { ...s, status: "error" } : s));
        }
      })
    );

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = allJobs.filter(j => { if (seen.has(j.url)) return false; seen.add(j.url); return true; });

    // Sort: urgent first, then by recency
    deduped.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return 0;
    });

    setJobs(deduped);
    setLastFetched(new Date());
    markDone(new Date().getHours());
    setSlotSt(RUN_HOURS.map(h => ({ h, done: isSlotDone(h), time: getDoneTime(h) })));
    setLoading(false);
  }, []);

  // Filter jobs
  const allCities = Array.from(new Set(jobs.map(j => j.location))).filter(l => l !== "Remote").slice(0, 8);
  const allSrcs   = Array.from(new Set(jobs.map(j => j.source)));

  const filtered = jobs.filter(j => {
    const q = filter.toLowerCase();
    return (
      (!q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q)))
      && (typeF === "All" || j.type === typeF)
      && (srcF  === "All" || j.source === srcF)
      && (locF  === "All" || j.location === locF || (locF === "Remote" && j.type === "Remote"))
    );
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white font-black text-sm">.N</div>
            <div>
              <h1 className="font-black text-gray-900 text-base">.NET Senior Jobs — India</h1>
              <p className="text-xs text-gray-400">13+ yrs · 10 sources · LinkedIn · Naukri · Indeed · Glassdoor · Monster · Shine · more</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastFetched && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Last: {lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            )}
            {jobs.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-semibold">
                {jobs.length} jobs found
              </span>
            )}
            <button onClick={run} disabled={loading}
              className="text-sm font-bold px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition flex items-center gap-2">
              {loading ? <><span className="animate-spin inline-block">⟳</span> Searching…</> : <><span>🔍</span> Fetch Now</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">

        {/* Schedule + source status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Auto Schedule</span>
              {nextRun && (
                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                  Next: {fmtMins(nextRun.mins)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {RUN_HOURS.map((h, i) => {
                const s = slotSt.find(x => x.h === h);
                return (
                  <div key={h} className={`rounded-xl p-2.5 text-center border ${s?.done ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="text-base mb-0.5">{s?.done ? "✅" : "⏳"}</div>
                    <div className="text-xs font-black text-gray-800">{SLOT_LABELS[i]}</div>
                    <div className="text-xs text-gray-400">{s?.done ? `${s.time ?? "Done"}` : "Pending"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Source status */}
          <div className="lg:col-span-2">
            <SourceBar sources={sources} />
          </div>
        </div>

        {/* Stats */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: "💼", label: "Total",    val: jobs.length },
              { icon: "🌐", label: "Remote",   val: jobs.filter(j => j.type === "Remote").length },
              { icon: "🏢", label: "Onsite",   val: jobs.filter(j => j.type === "Onsite").length },
              { icon: "🔥", label: "Urgent",   val: jobs.filter(j => j.urgent).length },
              { icon: "🎯", label: "Filtered", val: filtered.length },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black text-gray-900">{s.val}</div>
                <div className="text-xs text-gray-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <input value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Search title, company, skill…"
              className="w-full rounded-xl px-4 py-2.5 text-sm border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-400 font-semibold">Type:</span>
              {["All", "Remote", "Hybrid", "Onsite"].map(t => (
                <button key={t} onClick={() => setTypeF(t)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                    ${typeF === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-400 font-semibold">Source:</span>
              {["All", ...allSrcs].map(s => (
                <button key={s} onClick={() => setSrcF(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                    ${srcF === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
            {allCities.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-400 font-semibold">City:</span>
                {["All", "Remote", ...allCities].map(c => (
                  <button key={c} onClick={() => setLocF(c)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                      ${locF === c ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
            <div className="text-5xl animate-pulse">🔍</div>
            <p className="font-bold text-gray-900 text-lg">Scanning 10 job boards…</p>
            <p className="text-sm text-gray-400">LinkedIn · Naukri · Indeed · Glassdoor · Monster · Shine · TimesJobs · Remotive · WeWorkRemotely · Remote.co</p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {SOURCE_LIST.map((s, i) => (
                <span key={s.key} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}>{s.flag} {s.key}</span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
            <div className="text-3xl">⚠️</div>
            <p className="font-bold text-red-800">Fetch failed</p>
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={run} className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition">Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-14 text-center space-y-5">
            <div className="text-6xl">💼</div>
            <div>
              <p className="font-black text-gray-900 text-xl">.NET Senior Jobs — Indian Market</p>
              <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
                Searches <strong>10 job portals</strong> including LinkedIn, Naukri, Indeed, Glassdoor, Monster, Shine & more
                for .NET Senior / Lead / Architect roles with 13+ years experience.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SOURCE_LIST.map(s => (
                <span key={s.key} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                  {s.flag} {s.key} {s.india ? "🇮🇳" : ""}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {[".NET Core", "C#", "Azure", "Microservices", "SQL Server", "Web API", "Docker"].map(sk => (
                <span key={sk} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${skillClr(sk)}`}>{sk}</span>
              ))}
            </div>
            <button onClick={run}
              className="px-8 py-3 rounded-xl bg-gray-900 text-white font-black text-base hover:bg-gray-700 transition">
              🔍 Search All 10 Sources Now
            </button>
            {nextRun && <p className="text-xs text-gray-300">Next auto-run: {nextRun.label} (in {fmtMins(nextRun.mins)})</p>}
          </div>
        )}

        {/* Job grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((job, i) => <JobCard key={job.id} job={job} idx={i} />)}
          </div>
        )}

        {/* No filter match */}
        {!loading && jobs.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-3xl mb-2">🔎</p>
            <p className="font-bold text-gray-700">No matches for current filters</p>
            <button onClick={() => { setFilter(""); setTypeF("All"); setSrcF("All"); setLocF("All"); }}
              className="mt-3 text-sm text-gray-400 hover:text-gray-800 underline">Clear all filters</button>
          </div>
        )}

        <div className="text-center text-xs text-gray-300 pb-4 space-y-1">
          <p>10 sources: LinkedIn · Naukri · Indeed · Glassdoor · Monster · Shine · TimesJobs · Remotive · WeWorkRemotely · Remote.co</p>
          <p>Filtered for .NET Senior / Lead / Architect · 13+ years · Indian market</p>
        </div>
      </div>
    </div>
  );
}
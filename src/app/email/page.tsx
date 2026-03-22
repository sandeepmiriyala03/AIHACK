"use client";



import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";

const RUN_HOURS   = [10, 14, 19];
const SLOT_LABELS = ["10 AM", "2 PM", "7 PM"];

// ── Types ─────────────────────────────────────────────────────────────────
interface Job {
  id: string; title: string; company: string; location: string;
  type: "Remote" | "Hybrid" | "Onsite"; experience: string; salary: string;
  skills: string[]; posted: string; source: string; url: string; urgent: boolean;
}
interface Source { name: string; status: "idle"|"fetching"|"done"|"error"; count: number; }

// ── Keyword filters ───────────────────────────────────────────────────────
const DOTNET_KW = [".net",".net core",".net 6",".net 7",".net 8","dotnet","c#","asp.net","csharp","blazor","wpf","wcf","xamarin"];
const SENIOR_KW = ["senior","lead","architect","principal","staff engineer","head of","13+","14+","15+","12+","10+ years","expert","manager"];
const SKILL_MAP: [RegExp,string][] = [
  [/\.net\s*(core|6|7|8)?/i,".NET Core"],[/c#/i,"C#"],[/asp\.net/i,"ASP.NET"],
  [/azure/i,"Azure"],[/aws/i,"AWS"],[/microservices?/i,"Microservices"],
  [/sql\s*server/i,"SQL Server"],[/entity\s*framework/i,"Entity Framework"],
  [/web\s*api/i,"Web API"],[/docker/i,"Docker"],[/kubernetes|k8s/i,"Kubernetes"],
  [/react/i,"React"],[/angular/i,"Angular"],[/redis/i,"Redis"],
  [/blazor/i,"Blazor"],[/wpf/i,"WPF"],[/wcf/i,"WCF"],
  [/devops/i,"DevOps"],[/ci\/cd/i,"CI/CD"],[/rabbitmq|kafka/i,"Messaging"],
];
function extractSkills(t:string){return SKILL_MAP.filter(([re])=>re.test(t)).map(([,l])=>l).slice(0,5);}
function isDotNet(t:string,d:string){const s=(t+" "+d).toLowerCase();return DOTNET_KW.some(k=>s.includes(k));}
function isSenior(t:string,d:string){const s=(t+" "+d).toLowerCase();return SENIOR_KW.some(k=>s.includes(k));}
function parsePosted(ds:string):string{
  if(!ds) return "Recently";
  const d=new Date(ds); if(isNaN(d.getTime())) return ds;
  const h=Math.floor((Date.now()-d.getTime())/3_600_000);
  if(h<1) return "Just now"; if(h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
function stripHtml(s:string){return s.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();}
function getCity(text:string):string{
  const cities=["Hyderabad","Bangalore","Bengaluru","Mumbai","Pune","Chennai","Delhi","Noida","Gurgaon","Gurugram","Kolkata","Ahmedabad","Jaipur","Kochi","Chandigarh","Indore"];
  for(const c of cities){if(new RegExp(c,"i").test(text)) return c;}
  return "India";
}
async function rss2json(url:string):Promise<{items:Record<string,string>[]}>{
  const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=50`,{cache:"no-store"});
  if(!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
function extractCompany(h:string):string{
  return h.match(/(?:company|at|@)[:\s]+([A-Za-z0-9 &.,'-]{2,35})/i)?.[1]?.trim()??"Company";
}

// ── Fetch functions ───────────────────────────────────────────────────────
async function fetchLinkedIn():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  try{
    const d=await rss2json(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(".NET senior architect lead")}&location=India&f_TPR=r86400&f_E=4%2C5%2C6&format=rss`);
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`li_${n++}`,title,company:item.author??extractCompany(desc),
        location:/remote/i.test(title+desc)?"Remote":getCity(title+desc),
        type:/remote/i.test(title+desc)?"Remote":/hybrid/i.test(title+desc)?"Hybrid":"Onsite",
        experience:"12–15 yrs",salary:desc.match(/₹[\d\s\-–LKlakPApa.,]+/)?.[0]??"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.pubDate),
        source:"LinkedIn",url:item.link??"https://linkedin.com/jobs",urgent:/urgent|immediate/i.test(title+desc)});
    }
  }catch{}
  return all;
}
async function fetchNaukri():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  const qs=["https://www.naukri.com/jobs-in-india?k=.net+senior+architect&experience=10to15&rss=1",
             "https://www.naukri.com/jobs-in-hyderabad-2?k=.net+lead+architect&rss=1",
             "https://www.naukri.com/jobs-in-bangalore-bengaluru-3?k=.net+senior+architect&rss=1"];
  for(const q of qs){try{
    const d=await rss2json(q);
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      const sal=desc.match(/(?:salary|ctc|lpa)[:\s]*([\d\s\-–.]+(?:lpa|lac|lakh))/i);
      all.push({id:`nk_${n++}`,title,company:item.author??extractCompany(desc),
        location:/remote/i.test(title+desc)?"Remote":getCity(title+(item.category??"")+" "+desc),
        type:/remote/i.test(title+desc)?"Remote":/hybrid/i.test(title+desc)?"Hybrid":"Onsite",
        experience:desc.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)/i)?.[0]??"10–15 yrs",
        salary:sal?.[1]?.trim()?`${sal[1].trim()} LPA`:"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.pubDate),
        source:"Naukri",url:item.link??"https://naukri.com",urgent:/urgent|immediate|asap/i.test(title+desc)});
    }
  }catch{}}
  return all;
}
async function fetchIndeed():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  const qs=["https://www.indeed.com/rss?q=%22.NET%22+senior+architect&l=India&fromage=2&sort=date",
             "https://www.indeed.com/rss?q=senior+dotnet+lead&l=Hyderabad%2C+India&fromage=3",
             "https://in.indeed.com/rss?q=senior+.net+developer+architect&l=India&fromage=2"];
  for(const q of qs){try{
    const d=await rss2json(q);
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`in_${n++}`,title,company:item.author??extractCompany(desc),
        location:/remote/i.test(title+desc)?"Remote":getCity(title+desc),
        type:/remote/i.test(title+desc)?"Remote":/hybrid/i.test(title+desc)?"Hybrid":"Onsite",
        experience:"12–15 yrs",salary:desc.match(/₹[\d\s\-–LKlakPApa.,]+/)?.[0]??"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.pubDate),
        source:"Indeed",url:item.link??"https://indeed.com",urgent:/urgent|immediate/i.test(title+desc)});
    }
  }catch{}}
  return all;
}
async function fetchGlassdoor():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  const qs=["https://www.glassdoor.co.in/Job/india-.net-senior-jobs-SRCH_IL.0,5_IN115_KO6,21.htm?fromAge=2&rss=1"];
  for(const q of qs){try{
    const d=await rss2json(q);
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`gd_${n++}`,title,company:item.author??extractCompany(desc),
        location:/remote/i.test(title+desc)?"Remote":getCity(title+desc),
        type:/remote/i.test(title+desc)?"Remote":/hybrid/i.test(title+desc)?"Hybrid":"Onsite",
        experience:"10–15 yrs",salary:"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.pubDate),
        source:"Glassdoor",url:item.link??"https://glassdoor.co.in",urgent:false});
    }
  }catch{}}
  return all;
}
async function fetchMonster():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  const qs=["https://www.monsterindia.com/srp/results?query=senior+dotnet+architect&locations=India&rss=1",
             "https://www.monsterindia.com/srp/results?query=.net+lead+architect&locations=Hyderabad&rss=1"];
  for(const q of qs){try{
    const d=await rss2json(q);
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`mn_${n++}`,title,company:item.author??extractCompany(desc),
        location:/remote/i.test(title+desc)?"Remote":getCity(title+desc),
        type:/remote/i.test(title+desc)?"Remote":/hybrid/i.test(title+desc)?"Hybrid":"Onsite",
        experience:"12–15 yrs",salary:"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.pubDate),
        source:"Monster",url:item.link??"https://monsterindia.com",urgent:/urgent|immediate/i.test(title+desc)});
    }
  }catch{}}
  return all;
}
async function fetchShine():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  const qs=["https://www.shine.com/job-search/senior-dotnet-architect-jobs/?rss=1"];
  for(const q of qs){try{
    const d=await rss2json(q);
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`sh_${n++}`,title,company:item.author??extractCompany(desc),location:getCity(title+desc),
        type:/remote/i.test(title+desc)?"Remote":/hybrid/i.test(title+desc)?"Hybrid":"Onsite",
        experience:"12–15 yrs",salary:"Not disclosed",skills:extractSkills(title+desc),
        posted:parsePosted(item.pubDate),source:"Shine",url:item.link??"https://shine.com",urgent:/urgent/i.test(title+desc)});
    }
  }catch{}}
  return all;
}
async function fetchTimesJobs():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  const qs=["https://www.timesjobs.com/candidate/jobs-search.html?searchType=personalizedSearch&from=submit&txtKeywords=.NET+senior+architect&txtLocation=India&rss=true",
             "https://www.timesjobs.com/candidate/jobs-search.html?searchType=personalizedSearch&from=submit&txtKeywords=dotnet+lead&txtLocation=Hyderabad&rss=true"];
  for(const q of qs){try{
    const d=await rss2json(q);
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`tj_${n++}`,title,company:item.author??extractCompany(desc),location:getCity(title+desc),
        type:/remote/i.test(title+desc)?"Remote":/hybrid/i.test(title+desc)?"Hybrid":"Onsite",
        experience:"12–15 yrs",salary:"Not disclosed",skills:extractSkills(title+desc),
        posted:parsePosted(item.pubDate),source:"TimesJobs",url:item.link??"https://timesjobs.com",
        urgent:/urgent|immediate/i.test(title+desc)});
    }
  }catch{}}
  return all;
}
async function fetchRemotive():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  try{
    const r=await fetch("https://remotive.com/api/remote-jobs?category=software-dev&search=.net+senior&limit=40",{cache:"no-store"});
    const d=await r.json();
    for(const item of(d.jobs??[])){
      const title=item.title??"",desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`rm_${n++}`,title,company:item.company_name??"?",
        location:item.candidate_required_location??"Remote",type:"Remote",
        experience:"10+ yrs",salary:item.salary??"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.publication_date),
        source:"Remotive",url:item.url??"#",urgent:false});
    }
  }catch{}
  return all;
}
async function fetchWeWorkRemotely():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  try{
    const d=await rss2json("https://weworkremotely.com/categories/remote-programming-jobs.rss");
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`wwr_${n++}`,title,company:item.author??extractCompany(desc),
        location:"Remote",type:"Remote",experience:"10+ yrs",salary:"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.pubDate),
        source:"WeWorkRemotely",url:item.link??"https://weworkremotely.com",urgent:false});
    }
  }catch{}
  return all;
}
async function fetchRemoteCo():Promise<Job[]>{
  const all:Job[]=[]; let n=1;
  try{
    const d=await rss2json("https://remote.co/remote-jobs/developer/feed/");
    for(const item of(d.items??[])){
      const title=stripHtml(item.title??""),desc=stripHtml(item.description??"");
      if(!isDotNet(title,desc)||!isSenior(title,desc)) continue;
      all.push({id:`rc_${n++}`,title,company:item.author??extractCompany(desc),
        location:"Remote",type:"Remote",experience:"10+ yrs",salary:"Not disclosed",
        skills:extractSkills(title+desc),posted:parsePosted(item.pubDate),
        source:"Remote.co",url:item.link??"https://remote.co",urgent:false});
    }
  }catch{}
  return all;
}

const SOURCE_LIST=[
  {key:"LinkedIn",       fn:fetchLinkedIn,      flag:"in", color:"#0A66C2", india:true },
  {key:"Naukri",         fn:fetchNaukri,         flag:"nk", color:"#FF7555", india:true },
  {key:"Indeed",         fn:fetchIndeed,         flag:"id", color:"#2164F3", india:true },
  {key:"Glassdoor",      fn:fetchGlassdoor,      flag:"gd", color:"#0CAA41", india:true },
  {key:"Monster",        fn:fetchMonster,        flag:"mn", color:"#6E00FF", india:true },
  {key:"Shine",          fn:fetchShine,          flag:"sh", color:"#F59E0B", india:true },
  {key:"TimesJobs",      fn:fetchTimesJobs,      flag:"tj", color:"#DC2626", india:true },
  {key:"Remotive",       fn:fetchRemotive,       flag:"rm", color:"#059669", india:false},
  {key:"WeWorkRemotely", fn:fetchWeWorkRemotely, flag:"wr", color:"#0891B2", india:false},
  {key:"Remote.co",      fn:fetchRemoteCo,       flag:"rc", color:"#374151", india:false},
];

// ── Schedule helpers ──────────────────────────────────────────────────────
function getTodayKey(h:number){return`${new Date().toDateString()}_${h}`;}
function isSlotDone(h:number):boolean{if(typeof window==="undefined")return false;return localStorage.getItem(getTodayKey(h))==="1";}
function markDone(h:number){if(typeof window==="undefined")return;localStorage.setItem(getTodayKey(h),"1");localStorage.setItem(getTodayKey(h)+"_t",new Date().toLocaleTimeString("en-IN"));}
function getDoneTime(h:number):string|null{if(typeof window==="undefined")return null;return localStorage.getItem(getTodayKey(h)+"_t");}
function nextRunInfo():{label:string;mins:number}|null{
  const now=new Date(),cur=now.getHours()*60+now.getMinutes();
  for(let i=0;i<RUN_HOURS.length;i++){const sm=RUN_HOURS[i]*60;if(sm>cur)return{label:SLOT_LABELS[i],mins:sm-cur};}
  return{label:"10 AM tomorrow",mins:(24*60-cur)+10*60};
}
function fmtMins(m:number){const h=Math.floor(m/60),mm=m%60;return h>0?`${h}h ${mm}m`:`${mm}m`;}

// ── Skill chip colors ─────────────────────────────────────────────────────
function skillStyle(sk:string):{bg:string;text:string}{
  const s=sk.toLowerCase();
  if(s.includes(".net")||s.includes("c#")||s.includes("asp")||s.includes("blazor")) return{bg:"#EDE9FE",text:"#5B21B6"};
  if(s.includes("azure")||s.includes("aws")||s.includes("devops"))                  return{bg:"#DBEAFE",text:"#1D4ED8"};
  if(s.includes("micro")||s.includes("api")||s.includes("docker"))                  return{bg:"#D1FAE5",text:"#065F46"};
  if(s.includes("sql")||s.includes("redis")||s.includes("messaging"))               return{bg:"#FEF3C7",text:"#92400E"};
  return{bg:"#F3F4F6",text:"#374151"};
}
function typeStyle(t:string):{bg:string;text:string;border:string}{
  if(t==="Remote") return{bg:"#ECFDF5",text:"#065F46",border:"#6EE7B7"};
  if(t==="Hybrid") return{bg:"#FFFBEB",text:"#92400E",border:"#FCD34D"};
  return{bg:"#F9FAFB",text:"#374151",border:"#D1D5DB"};
}
function srcStyle(src:string):string{
  return SOURCE_LIST.find(s=>s.key===src)?.color??"#374151";
}

// ── Job Card ──────────────────────────────────────────────────────────────
function JobCard({job,idx}:{job:Job;idx:number}){
  const ts=typeStyle(job.type);
  return(
    <div className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{background:"#FFFFFF",border:"1px solid #E5E7EB",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",animationDelay:`${idx*40}ms`}}>
      {/* Top color strip */}
      <div className="h-1 w-full" style={{background:srcStyle(job.source)}}/>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex gap-1.5 flex-wrap mb-1.5">
              {job.urgent&&(
                <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{background:"#FEF2F2",color:"#B91C1C",border:"1px solid #FECACA"}}>🔥 Urgent</span>
              )}
              <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{background:ts.bg,color:ts.text,border:`1px solid ${ts.border}`}}>{job.type}</span>
            </div>
            <h3 className="font-bold text-sm leading-snug line-clamp-2" style={{color:"#111827"}}>{job.title}</h3>
            <p className="text-xs font-medium mt-0.5" style={{color:"#6B7280"}}>{job.company}</p>
          </div>
          {/* Source badge */}
          <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs"
            style={{background:srcStyle(job.source)}}>
            {SOURCE_LIST.find(s=>s.key===job.source)?.flag.toUpperCase()??job.source.slice(0,2).toUpperCase()}
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-1.5 text-xs" style={{color:"#6B7280"}}>
          <span className="flex items-center gap-1">📍 <span className="truncate">{job.location}</span></span>
          <span className="flex items-center gap-1">🕐 {job.posted}</span>
          <span className="flex items-center gap-1">🎯 {job.experience}</span>
          <span className="flex items-center gap-1 font-semibold" style={{color:"#111827"}}>💰 {job.salary}</span>
        </div>

        {/* Skills */}
        {job.skills.length>0&&(
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map(sk=>{
              const{bg,text}=skillStyle(sk);
              return<span key={sk} className="text-xs font-medium px-2 py-0.5 rounded-lg" style={{background:bg,color:text}}>{sk}</span>;
            })}
          </div>
        )}

        {/* CTA */}
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          className="mt-auto w-full text-center text-sm font-bold py-3 rounded-xl transition-opacity hover:opacity-90 active:opacity-75"
          style={{background:srcStyle(job.source),color:"#FFFFFF",display:"block",minHeight:"44px",lineHeight:"18px",paddingTop:"13px"}}>
          View & Apply →
        </a>
      </div>
    </div>
  );
}

// ── Source pill ───────────────────────────────────────────────────────────
function SourcePill({src,st}:{src:typeof SOURCE_LIST[0];st:Source|undefined}){
  const done=st?.status==="done", fetching=st?.status==="fetching", err=st?.status==="error";
  return(
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all"
      style={{
        background: fetching?"#FFFBEB":done?"#ECFDF5":err?"#FEF2F2":"#F9FAFB",
        color:       fetching?"#92400E":done?"#065F46":err?"#B91C1C":"#6B7280",
        border:`1px solid ${fetching?"#FCD34D":done?"#6EE7B7":err?"#FECACA":"#E5E7EB"}`,
      }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:src.color}}/>
      <span>{src.key}</span>
      {fetching&&<span className="animate-spin text-xs">↻</span>}
      {done&&<span>✓</span>}
      {err&&<span>✕</span>}
      {done&&st.count>0&&<span className="rounded-full px-1.5 py-0.5 font-bold text-xs" style={{background:"#D1FAE5",color:"#065F46"}}>{st.count}</span>}
      {src.india&&<span>🇮🇳</span>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function JobsPage(){
  const[jobs,setJobs]=useState<Job[]>([]);
  const[sources,setSources]=useState<Source[]>([]);
  const[loading,setLoading]=useState(false);
  const[lastFetched,setLastFetched]=useState<Date|null>(null);
  const[filter,setFilter]=useState("");
  const[typeF,setTypeF]=useState("All");
  const[srcF,setSrcF]=useState("All");
  const[locF,setLocF]=useState("All");
  const[nextRun,setNextRun]=useState<{label:string;mins:number}|null>(null);
  const[slotSt,setSlotSt]=useState<{h:number;done:boolean;time:string|null}[]>([]);
  const[mounted,setMounted]=useState(false);
  const[showFilters,setShowFilters]=useState(false);
  const lastRunRef=useRef<Set<string>>(new Set());

  useEffect(()=>{setMounted(true);},[]);

  useEffect(()=>{
    if(!mounted) return;
    const tick=()=>{setNextRun(nextRunInfo());setSlotSt(RUN_HOURS.map(h=>({h,done:isSlotDone(h),time:getDoneTime(h)})));};
    tick(); const id=setInterval(tick,60_000); return()=>clearInterval(id);
  },[mounted]);

  useEffect(()=>{
    if(!mounted) return;
    const id=setInterval(()=>{
      const now=new Date(),h=now.getHours(),m=now.getMinutes();
      if(!RUN_HOURS.includes(h)||m!==0) return;
      const key=getTodayKey(h); if(lastRunRef.current.has(key)) return;
      lastRunRef.current.add(key); run();
    },30_000); return()=>clearInterval(id);
  },[mounted]);

  const run=useCallback(async()=>{
    setLoading(true);
    const allJobs:Job[]=[];
    setSources(SOURCE_LIST.map(s=>({name:s.key,status:"idle",count:0})));
    await Promise.allSettled(SOURCE_LIST.map(async src=>{
      setSources(prev=>prev.map(s=>s.name===src.key?{...s,status:"fetching"}:s));
      try{
        const jobs=await src.fn(); allJobs.push(...jobs);
        setSources(prev=>prev.map(s=>s.name===src.key?{...s,status:"done",count:jobs.length}:s));
      }catch{setSources(prev=>prev.map(s=>s.name===src.key?{...s,status:"error"}:s));}
    }));
    const seen=new Set<string>();
    const deduped=allJobs.filter(j=>{if(seen.has(j.url))return false;seen.add(j.url);return true;});
    deduped.sort((a,b)=>(a.urgent&&!b.urgent)?-1:(!a.urgent&&b.urgent)?1:0);
    setJobs(deduped); setLastFetched(new Date());
    markDone(new Date().getHours());
    setSlotSt(RUN_HOURS.map(h=>({h,done:isSlotDone(h),time:getDoneTime(h)})));
    setLoading(false);
  },[]);

  const allCities=Array.from(new Set(jobs.map(j=>j.location))).filter(l=>l!=="Remote").slice(0,8);
  const allSrcs=Array.from(new Set(jobs.map(j=>j.source)));
  const filtered=jobs.filter(j=>{
    const q=filter.toLowerCase();
    return(!q||j.title.toLowerCase().includes(q)||j.company.toLowerCase().includes(q)||j.skills.some(s=>s.toLowerCase().includes(q)))
      &&(typeF==="All"||j.type===typeF)&&(srcF==="All"||j.source===srcF)
      &&(locF==="All"||j.location===locF||(locF==="Remote"&&j.type==="Remote"));
  });

  if(!mounted) return null;

  return(
    <div className="min-h-screen pb-24" style={{background:"#F8F9FA",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"/>
      <Navbar/>

      {/* ── Hero header ── */}
      <div style={{background:"linear-gradient(135deg,#0F172A 0%,#1E293B 50%,#0F172A 100%)",paddingTop:"env(safe-area-inset-top)"}}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs" style={{background:"#3B82F6",color:"#fff"}}>.N</div>
                <span className="text-xs font-semibold" style={{color:"#94A3B8"}}>AksharaTantra Jobs</span>
              </div>
              <h1 className="text-xl font-black" style={{color:"#F1F5F9"}}>Senior .NET Jobs</h1>
              <p className="text-xs mt-0.5" style={{color:"#64748B"}}>13+ years · India market · 10 sources · Live RSS</p>
            </div>
            <div className="flex items-center gap-2">
              {lastFetched&&<span className="text-xs" style={{color:"#64748B"}}>Updated {lastFetched.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}</span>}
              {jobs.length>0&&<span className="text-xs font-bold rounded-full px-2.5 py-1" style={{background:"#1E40AF",color:"#BFDBFE"}}>{jobs.length} jobs</span>}
              <button onClick={run} disabled={loading}
                className="flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                style={{background:"#3B82F6",color:"#fff",minHeight:"44px"}}>
                {loading?<><span className="animate-spin">↻</span><span>Searching…</span></>:<><span>🔍</span><span>Fetch Now</span></>}
              </button>
            </div>
          </div>

          {/* Schedule bar */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {RUN_HOURS.map((h,i)=>{
              const s=slotSt.find(x=>x.h===h);
              return(
                <div key={h} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{background:s?.done?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.08)",
                          color:s?.done?"#6EE7B7":"#94A3B8",border:`1px solid ${s?.done?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.1)"}`}}>
                  {s?.done?"✅":"⏳"} {SLOT_LABELS[i]}
                  {s?.done&&s.time&&<span style={{color:"#4ADE80",opacity:0.7}}>{s.time}</span>}
                </div>
              );
            })}
            {nextRun&&(
              <span className="text-xs ml-auto" style={{color:"#475569"}}>
                ⏰ Next: {nextRun.label} · {fmtMins(nextRun.mins)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* Source pills */}
        {sources.length>0&&(
          <div className="rounded-2xl p-4" style={{background:"#fff",border:"1px solid #E5E7EB"}}>
            <p className="text-xs font-bold mb-2.5" style={{color:"#9CA3AF",letterSpacing:"0.08em"}}>LIVE SOURCES</p>
            <div className="flex flex-wrap gap-2">
              {SOURCE_LIST.map(s=><SourcePill key={s.key} src={s} st={sources.find(x=>x.name===s.key)}/>)}
            </div>
          </div>
        )}

        {/* Stats strip */}
        {jobs.length>0&&(
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
            {[
              {emoji:"💼",label:"Total",val:jobs.length,clr:"#3B82F6"},
              {emoji:"🌐",label:"Remote",val:jobs.filter(j=>j.type==="Remote").length,clr:"#10B981"},
              {emoji:"🔥",label:"Urgent",val:jobs.filter(j=>j.urgent).length,clr:"#EF4444"},
              {emoji:"🎯",label:"Showing",val:filtered.length,clr:"#8B5CF6"},
            ].map(s=>(
              <div key={s.label} className="rounded-2xl p-3 text-center" style={{background:"#fff",border:"1px solid #E5E7EB"}}>
                <div className="text-lg">{s.emoji}</div>
                <div className="text-xl font-black mt-0.5" style={{color:s.clr}}>{s.val}</div>
                <div className="text-xs font-medium mt-0.5" style={{color:"#9CA3AF"}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search + filter toggle */}
        {jobs.length>0&&(
          <div className="rounded-2xl p-4 space-y-3" style={{background:"#fff",border:"1px solid #E5E7EB"}}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color:"#9CA3AF"}}>🔍</span>
                <input value={filter} onChange={e=>setFilter(e.target.value)}
                  placeholder="Title, company, skill…"
                  className="w-full rounded-xl pl-9 pr-4 text-sm outline-none"
                  style={{background:"#F9FAFB",border:"1px solid #E5E7EB",color:"#111827",height:"44px",
                    fontFamily:"'DM Sans',sans-serif"}}
                />
              </div>
              <button onClick={()=>setShowFilters(v=>!v)}
                className="rounded-xl px-4 text-sm font-bold flex items-center gap-1.5 transition-all"
                style={{background:showFilters?"#EFF6FF":"#F9FAFB",color:showFilters?"#1D4ED8":"#374151",
                  border:`1px solid ${showFilters?"#BFDBFE":"#E5E7EB"}`,height:"44px"}}>
                ⚙️ Filters {(typeF!=="All"||srcF!=="All"||locF!=="All")&&<span className="w-2 h-2 rounded-full bg-blue-500"/>}
              </button>
            </div>
            {showFilters&&(
              <div className="space-y-2.5 pt-1">
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>Work Type</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {["All","Remote","Hybrid","Onsite"].map(t=>(
                      <button key={t} onClick={()=>setTypeF(t)}
                        className="text-xs font-semibold px-3 rounded-full transition-all"
                        style={{background:typeF===t?"#1E40AF":"#F3F4F6",color:typeF===t?"#fff":"#374151",
                          border:`1px solid ${typeF===t?"#1E40AF":"#E5E7EB"}`,height:"32px"}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>Source</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {["All",...allSrcs].map(s=>(
                      <button key={s} onClick={()=>setSrcF(s)}
                        className="text-xs font-semibold px-3 rounded-full transition-all"
                        style={{background:srcF===s?"#1E40AF":"#F3F4F6",color:srcF===s?"#fff":"#374151",
                          border:`1px solid ${srcF===s?"#1E40AF":"#E5E7EB"}`,height:"32px"}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {allCities.length>0&&(
                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>City</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {["All","Remote",...allCities].map(c=>(
                        <button key={c} onClick={()=>setLocF(c)}
                          className="text-xs font-semibold px-3 rounded-full transition-all"
                          style={{background:locF===c?"#1E40AF":"#F3F4F6",color:locF===c?"#fff":"#374151",
                            border:`1px solid ${locF===c?"#1E40AF":"#E5E7EB"}`,height:"32px"}}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(typeF!=="All"||srcF!=="All"||locF!=="All")&&(
                  <button onClick={()=>{setFilter("");setTypeF("All");setSrcF("All");setLocF("All");}}
                    className="text-xs font-semibold underline" style={{color:"#6B7280"}}>
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading&&(
          <div className="rounded-2xl p-10 text-center space-y-4" style={{background:"#fff",border:"1px solid #E5E7EB"}}>
            <div className="text-4xl animate-pulse">🔍</div>
            <p className="font-bold text-base" style={{color:"#111827"}}>Scanning 10 job boards…</p>
            <p className="text-sm" style={{color:"#9CA3AF"}}>Filtering .NET Senior / Lead / Architect · 13+ years</p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {SOURCE_LIST.map((s,i)=>(
                <span key={s.key} className="text-xs px-2.5 py-1 rounded-full animate-pulse font-medium"
                  style={{background:"#F3F4F6",color:"#6B7280",animationDelay:`${i*80}ms`}}>
                  {s.key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading&&jobs.length===0&&(
          <div className="rounded-2xl p-10 text-center space-y-5" style={{background:"#fff",border:"1px dashed #D1D5DB"}}>
            <div className="text-5xl">💼</div>
            <div>
              <p className="font-black text-lg" style={{color:"#111827"}}>Senior .NET Jobs — India</p>
              <p className="text-sm mt-1.5 max-w-sm mx-auto leading-relaxed" style={{color:"#6B7280"}}>
                10 job portals · LinkedIn · Naukri · Indeed · Glassdoor · Monster · Shine & more.<br/>
                Auto-runs at 10 AM · 2 PM · 7 PM IST.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SOURCE_LIST.map(s=>(
                <span key={s.key} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{background:"#F3F4F6",color:"#374151",border:"1px solid #E5E7EB"}}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{background:s.color,verticalAlign:"middle"}}/>
                  {s.key}{s.india?" 🇮🇳":""}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[".NET Core","C#","Azure","Microservices","SQL Server","Web API","Docker"].map(sk=>{
                const{bg,text}=skillStyle(sk);
                return<span key={sk} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{background:bg,color:text}}>{sk}</span>;
              })}
            </div>
            <button onClick={run}
              className="font-black text-base px-8 py-3.5 rounded-2xl transition-all active:scale-95 hover:opacity-90"
              style={{background:"#1D4ED8",color:"#fff",minHeight:"52px"}}>
              🔍 Search All 10 Sources
            </button>
            {nextRun&&<p className="text-xs" style={{color:"#9CA3AF"}}>Next auto-run: {nextRun.label} · in {fmtMins(nextRun.mins)}</p>}
          </div>
        )}

        {/* Job grid */}
        {!loading&&filtered.length>0&&(
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((job,i)=><JobCard key={job.id} job={job} idx={i}/>)}
          </div>
        )}

        {/* No filter match */}
        {!loading&&jobs.length>0&&filtered.length===0&&(
          <div className="rounded-2xl p-10 text-center" style={{background:"#fff",border:"1px solid #E5E7EB"}}>
            <p className="text-3xl mb-2">🔎</p>
            <p className="font-bold" style={{color:"#374151"}}>No matches for current filters</p>
            <button onClick={()=>{setFilter("");setTypeF("All");setSrcF("All");setLocF("All");}}
              className="mt-3 text-sm font-semibold underline" style={{color:"#6B7280"}}>
              Clear filters
            </button>
          </div>
        )}

        <div className="text-center text-xs pb-4 space-y-1" style={{color:"#D1D5DB"}}>
          <p>10 sources · LinkedIn · Naukri · Indeed · Glassdoor · Monster · Shine · TimesJobs · Remotive · WeWorkRemotely · Remote.co</p>
          <p>.NET Senior / Lead / Architect · 13+ years · Indian market</p>
        </div>
      </div>
    </div>
  );
}
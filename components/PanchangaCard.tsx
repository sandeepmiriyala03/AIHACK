"use client";

// components/PanchangaCard.tsx
// ✅ Full multilingual support — te, hi, ta, kn, ml, mr, en
// ✅ All UI labels, Tithi, Nakshatra, Vara, Masa etc in selected language
// ✅ Location-aware sunrise/sunset
// ✅ Jean Meeus Chapter 47 Moon formula (50 terms)

import { useState, useCallback } from "react";
import { getLang } from "@/lib/panchangaLang";

type LocationProp = { lat: number; lng: number; city?: string } | null;

// ══════════════════════════════════════════════
// SAMVATSARA (always Sanskrit — proper nouns)
// ══════════════════════════════════════════════
const SAMVATSARA = ["ప్రభవ","విభవ","శుక్ల","ప్రమోదూత","ప్రజోత్పత్తి","అంగీరస","శ్రీముఖ","భావ","యువ","ధాత","ఈశ్వర","బహుధాన్య","ప్రమాది","విక్రమ","వృష","చిత్రభాను","స్వభాను","తారణ","పార్థివ","వ్యయ","సర్వజిత్","సర్వధారి","విరోధి","వికృతి","ఖర","నందన","విజయ","జయ","మన్మధ","దుర్ముఖి","హేవిళంబి","విళంబి","వికారి","శార్వరి","ప్లవ","శుభకృత్","శోభకృత్","క్రోధి","విశ్వావసు","పరాభవ","ప్లవంగ","కీలక","సౌమ్య","సాధారణ","విరోధకృత్","పరీధావి","ప్రమాదీచ","ఆనంద","రాక్షస","నల","పింగళ","కాళయుక్తి","సిద్ధార్థి","రౌద్రి","దుర్మతి","దుందుభి","రుధిరోద్గారి","రక్తాక్షి","క్రోధన","అక్షయ"];
const RAHU_SLOT   = [8,2,7,5,6,4,3];
const YAMA_SLOT   = [5,4,3,2,1,7,6];
const GULIKA_SLOT = [7,6,5,4,3,2,1];
const VARJYA_OFF  = [6.50,7.25,8.00,5.75,6.50,7.25,8.00,5.75,6.50,7.25,8.00,5.75,6.50,7.25,8.00,5.75,6.50,7.25,8.00,5.75,6.50,7.25,8.00,5.75,6.50,7.25,8.00];
const AMRITA_OFF  = [1.00,1.75,2.50,3.25,4.00,4.75,5.50,6.25,7.00,7.75,8.50,9.25,10.0,10.75,11.5,0.25,1.00,1.75,2.50,3.25,4.00,4.75,5.50,6.25,7.00,7.75,8.50];
const DURMUHU_OFF = [3.50,6.00,7.00,5.00,4.50,5.50,4.00];
const VARA_CLR    = ["#f59e0b","#3b82f6","#ef4444","#10b981","#8b5cf6","#ec4899","#6b7280"];

// ══════════════════════════════════════════════
// ASTRONOMY
// ══════════════════════════════════════════════
const toRad  = (d: number) => d * Math.PI / 180;
const mod360 = (x: number) => ((x % 360) + 360) % 360;

function julianDay(dt: Date): number {
  const Y = dt.getUTCFullYear(), M = dt.getUTCMonth() + 1;
  const D = dt.getUTCDate() + dt.getUTCHours() / 24 + dt.getUTCMinutes() / 1440;
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}
function sunLon(jd: number): number {
  const T = (jd - 2451545) / 36525;
  const L0 = mod360(280.46646 + 36000.76983 * T);
  const M  = mod360(357.52911 + 35999.05029 * T), Mr = toRad(M);
  return mod360(L0 + (1.914602 - 0.004817 * T) * Math.sin(Mr) + 0.019993 * Math.sin(2*Mr) + 0.000289 * Math.sin(3*Mr));
}
function moonLon(jd: number): number {
  const T = (jd-2451545)/36525, T2=T*T, T3=T2*T, T4=T3*T;
  const Lp=mod360(218.3164477+481267.88123421*T-0.0015786*T2+T3/538841-T4/65194000);
  const D =mod360(297.8501921+445267.1114034*T -0.0018819*T2+T3/545868 -T4/113065000);
  const M =mod360(357.5291092+35999.0502909*T  -0.0001536*T2+T3/24490000);
  const Mp=mod360(134.9633964+477198.8675055*T +0.0087414*T2+T3/69699  -T4/14712000);
  const F =mod360(93.2720950 +483202.0175233*T -0.0036539*T2-T3/3526000+T4/863310000);
  const A1=mod360(119.75+131.849*T), A2=mod360(53.09+479264.290*T);
  const E=1-0.002516*T-0.0000074*T2, E2=E*E, r=toRad;
  const terms:number[][]=[
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],
    [0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],
    [0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],
    [0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],
    [4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
    [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],
    [2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
    [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],
    [2,-1,0,-2,-596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487],
  ];
  let SL=0;
  for(const [dD,dM,dMp,dF,c] of terms){
    let cc=c;
    if(Math.abs(dM)===1) cc*=E; else if(Math.abs(dM)===2) cc*=E2;
    SL+=cc*Math.sin(r(dD*D+dM*M+dMp*Mp+dF*F));
  }
  SL+=3958*Math.sin(r(A1))+1962*Math.sin(r(Lp-F))+318*Math.sin(r(A2));
  return mod360(Lp+SL/1000000);
}
function ayanamsa(jd: number): number { return 23.85022+0.013643*((jd-2451545)/36525); }

const _ugadiCache: Record<number,Date> = {};
function findUgadi(year: number): Date {
  if (_ugadiCache[year]) return _ugadiCache[year];
  let d = new Date(Date.UTC(year,1,10));
  for(let i=0;i<70;i++){
    const jd=julianDay(d), ayan=ayanamsa(jd);
    const sL=mod360(sunLon(jd)-ayan), mL=mod360(moonLon(jd)-ayan), diff=mod360(mL-sL);
    if((sL>=330||sL<30)&&diff>=0&&diff<13){ _ugadiCache[year]=new Date(d); return _ugadiCache[year]; }
    d=new Date(d.getTime()+86400000);
  }
  _ugadiCache[year]=new Date(Date.UTC(year,2,25)); return _ugadiCache[year];
}
function getSamvatsara(dt: Date): string {
  const ugadi=findUgadi(dt.getFullYear());
  const shaka=dt>=ugadi?dt.getFullYear()-78:dt.getFullYear()-79;
  return SAMVATSARA[((shaka-1909)%60+60)%60];
}
function getTeluguMasaIdx(dt: Date): number {
  const ugadi=findUgadi(dt.getFullYear());
  const ugadiBase=dt>=ugadi?ugadi:findUgadi(dt.getFullYear()-1);
  let masa=0, cursor=new Date(ugadiBase);
  for(let m=0;m<13;m++){
    const next=new Date(cursor.getTime()+29.5*86400000);
    if(next>dt) break; masa=m+1; cursor=next;
  }
  return masa%12;
}
function getSunriseSunset(dt: Date, userLat=17.385, userLon=78.486): {sr:number;ss:number} {
  const lat=userLat, lon=userLon, tz=5.5;
  const jd=julianDay(new Date(Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate(),6)));
  const n=jd-2451545.0;
  const L=mod360(280.46+0.9856474*n), g=mod360(357.528+0.9856003*n);
  const lam=mod360(L+1.915*Math.sin(toRad(g))+0.020*Math.sin(toRad(2*g)));
  const eps=23.439-0.0000004*n;
  const RA=Math.atan2(Math.cos(toRad(eps))*Math.sin(toRad(lam)),Math.cos(toRad(lam)))*180/Math.PI;
  const dec=Math.asin(Math.sin(toRad(eps))*Math.sin(toRad(lam)))*180/Math.PI;
  const eot=(L-RA)*4;
  const ha=Math.acos((Math.sin(toRad(-0.833))-Math.sin(toRad(lat))*Math.sin(toRad(dec)))/(Math.cos(toRad(lat))*Math.cos(toRad(dec))))*180/Math.PI;
  const noon=12-eot/60-(lon-tz*15)/15;
  return {sr:noon-ha/15,ss:noon+ha/15};
}

function fmtHHMM(h: number): string {
  const hh=((Math.floor(h)%24)+24)%24, mm=Math.round((h-Math.floor(h))*60)%60;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}
function fmtT(h: number, lang: string): string {
  const hh24=((Math.floor(h)%24)+24)%24, mm=Math.round((h-Math.floor(h))*60)%60;
  const L = getLang(lang);
  const isTE = lang==="te";
  const suf = hh24>=18 ? (isTE?"రా":"PM") : hh24>=12 ? (isTE?"సా":"PM") : hh24>=6 ? (isTE?"ఉ":"AM") : (isTE?"రా":"AM");
  const hh12=hh24%12||12;
  return `${suf} ${String(hh12).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}
function fmtRange(s: number, e: number, lang: string): string {
  return `${fmtT(s,lang)} - ${fmtT(e,lang)}`;
}
function slotTime(sr: number, ss: number, slot: number, lang: string): string {
  const h=(ss-sr)/8, s=sr+(slot-1)*h, ef=s+h;
  return `${fmtT(s,lang)} - ${fmtT(ef,lang)}`;
}
function endTimeStr(hrs: number, lang: string): string {
  const d=new Date(Date.now()+hrs*3600000);
  const h=d.getHours(), m=d.getMinutes();
  const isTE=lang==="te";
  const suf=h>=18?(isTE?"రా":"PM"):h>=12?(isTE?"సా":"PM"):(isTE?"ఉ":"AM");
  const L=getLang(lang);
  return `${suf} ${String(h%12||12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${L.labels.upto}`;
}

// ── Main calculation (language-aware) ────────────────────────────────────
export function calcForDate(dt: Date, userLat?: number, userLon?: number, langCode = "te") {
  const L  = getLang(langCode);
  const utc = new Date(Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate(),0,30));
  const jd  = julianDay(utc), ayan=ayanamsa(jd);
  const sL  = mod360(sunLon(jd)-ayan), mL=mod360(moonLon(jd)-ayan), diff=mod360(mL-sL);
  const tIdx=Math.floor(diff/12)%30, nIdx=Math.floor(mL/(360/27))%27;
  const yIdx=Math.floor(mod360(sL+mL)/(360/27))%27, kIdx=Math.floor(diff/6)%11;
  const solarMIdx=Math.floor(sL/30)%12, mIdx=getTeluguMasaIdx(dt), vIdx=dt.getDay();
  const {sr,ss}=getSunriseSunset(dt,userLat,userLon);
  const varjyaS=sr+VARJYA_OFF[nIdx], amritaS=sr+AMRITA_OFF[nIdx], durmuhuS=sr+DURMUHU_OFF[vIdx];

  const pakshaSuffix = tIdx<15 ? L.shuklaSuffix : L.krishnaSuffix;

  return {
    vara:        L.varaFull[vIdx],
    varaShort:   L.varaShort[vIdx],
    varaLong:    L.varaLong[vIdx],
    vIdx,
    tithi:       L.tithi[tIdx],
    tithiNext:   L.tithi[(tIdx+1)%30],
    tithiEnd:    endTimeStr(((12-(diff%12))/12)*23.6, langCode),
    paksha:      tIdx<15 ? L.shuklaPaksha : L.krishnaPaksha,
    pakshaS:     pakshaSuffix,
    nak:         L.nak[nIdx],
    nakNext:     L.nak[(nIdx+1)%27],
    nakEnd:      endTimeStr((1-(mL%(360/27))/(360/27))*0.93*24, langCode),
    yoga:        L.yoga[yIdx],
    yogaNext:    L.yoga[(yIdx+1)%27],
    karana:      L.karana[kIdx],
    karana2:     L.karana[(kIdx+1)%11],
    masa:        L.masa[mIdx],
    ritu:        L.ritu[mIdx],
    ayana:       L.ayana[mIdx],
    sunRashi:    L.rashi[solarMIdx],
    moonRashi:   L.rashi[Math.floor(mL/30)%12],
    samvatsara:  getSamvatsara(dt),
    sunrise:     fmtHHMM(sr),
    sunset:      fmtHHMM(ss),
    srH:sr, ssH:ss,
    rahuKaal:    slotTime(sr,ss,RAHU_SLOT[vIdx],langCode),
    yamaGanda:   slotTime(sr,ss,YAMA_SLOT[vIdx],langCode),
    guliKaal:    slotTime(sr,ss,GULIKA_SLOT[vIdx],langCode),
    varjyam:     fmtRange(varjyaS,varjyaS+1.8,langCode),
    amritakalam: fmtRange(amritaS,amritaS+1.6,langCode),
    durmuhurtam: fmtRange(durmuhuS,durmuhuS+0.8,langCode),
  };
}

const daysInMonth=(y:number,m:number)=>new Date(y,m+1,0).getDate();
const CAL_START={year:2026,month:2}, CAL_END={year:2028,month:3};
function allMonths(){
  const arr:{year:number;month:number}[]=[];
  let {year:y,month:m}=CAL_START;
  while(y<CAL_END.year||(y===CAL_END.year&&m<=CAL_END.month)){
    arr.push({year:y,month:m}); m++; if(m>11){m=0;y++;}
  }
  return arr;
}

// ── Canvas helpers ────────────────────────────────────────────────────────
async function loadTeluguFont(): Promise<void> {
  if(document.fonts.check("700 16px 'Noto Sans Telugu'")) return;
  try{
    const face=new FontFace("Noto Sans Telugu",
      "url(https://fonts.gstatic.com/s/notosanstelugu/v27/0nksC9PgP_wGh21A2oeqDeFW6zy2mhiNd_wT29OSyx1HK_ANhgIWxA.woff2)",
      {weight:"400 900"});
    await face.load(); document.fonts.add(face); await document.fonts.ready;
  }catch{}
}
function triggerImageDownload(canvas: HTMLCanvasElement, filename: string){
  canvas.toBlob((blob)=>{
    if(!blob) return;
    const url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url; a.download=filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  },"image/png");
}
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

async function downloadWhatsApp(dt: Date, loc?: LocationProp, langCode="te"){
  await loadTeluguFont();
  const L=getLang(langCode);
  const p=calcForDate(dt,loc?.lat,loc?.lng,langCode);
  const ugadi=findUgadi(dt.getFullYear()), isU=dt.toDateString()===ugadi.toDateString();
  const dd=String(dt.getDate()).padStart(2,"0"), mm=String(dt.getMonth()+1).padStart(2,"0"), yyyy=dt.getFullYear();
  const dateDisp=`${dd}-${mm}-${yyyy}`;
  const W=1080,H=1920;
  const canvas=document.createElement("canvas"); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#f0f4f0"; ctx.fillRect(0,0,W,H);
  const cx=60,cy=60,cw=W-120,ch=H-120,cr=32;
  ctx.shadowColor="rgba(0,0,0,0.18)"; ctx.shadowBlur=40; ctx.fillStyle="#ffffff";
  roundRect(ctx,cx,cy,cw,ch,cr); ctx.fill(); ctx.shadowColor="transparent"; ctx.shadowBlur=0;
  const hdrH=260;
  ctx.save(); roundRect(ctx,cx,cy,cw,hdrH,cr); ctx.clip();
  const g1=ctx.createLinearGradient(cx,cy,cx+cw,cy+hdrH);
  g1.addColorStop(0,"#0a7a6e"); g1.addColorStop(0.5,"#128c7e"); g1.addColorStop(1,"#075e54");
  ctx.fillStyle=g1; ctx.fillRect(cx,cy,cw,hdrH); ctx.restore();
  ctx.textAlign="center";
  ctx.fillStyle="#a7f3d0"; ctx.font="500 34px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(`🙏  ${L.greeting}  🙏`,W/2,cy+60);
  ctx.fillStyle="#ffffff"; ctx.font="900 52px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(`${p.vara}${isU?" 🌸":""}`,W/2,cy+128);
  ctx.font="600 30px 'Noto Sans Telugu', sans-serif"; ctx.fillStyle="#a7f3d0";
  ctx.fillText(`${L.labels.samvatsaraLabel}: ${p.samvatsara}`,W/2,cy+176);
  if(loc?.city){ctx.font="400 24px 'Noto Sans Telugu', sans-serif"; ctx.fillStyle="#6ee7b7"; ctx.fillText(`📍 ${loc.city}`,W/2,cy+212);}
  ctx.textAlign="left";
  const bx=cx+48, rx=cx+cw-48; let ry=cy+hdrH+36; const lh=64;
  function dRow(lbl:string,val:string,next="",div=false){
    if(div){ctx.strokeStyle="#e2e8f0";ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(bx,ry-10);ctx.lineTo(rx,ry-10);ctx.stroke();ctx.setLineDash([]);ry+=10;}
    ctx.fillStyle="#6b7280"; ctx.font="700 28px 'Noto Sans Telugu', sans-serif"; ctx.fillText(lbl,bx,ry);
    ctx.fillStyle="#111827"; ctx.textAlign="right"; ctx.fillText(val,rx,ry); ctx.textAlign="left";
    if(next){ry+=28;ctx.fillStyle="#9ca3af";ctx.font="400 22px 'Noto Sans Telugu', sans-serif";ctx.textAlign="right";ctx.fillText(`${L.labels.next}: ${next}`,rx,ry);ctx.textAlign="left";ry+=lh-28;}else{ry+=lh;}
    ctx.strokeStyle="#f3f4f6";ctx.lineWidth=1.5;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(bx,ry-12);ctx.lineTo(rx,ry-12);ctx.stroke();
  }
  dRow(L.labels.ayanaritu,`${p.ayana}, ${p.ritu}`);
  dRow(L.labels.masapaksha,`${p.masa}, ${p.paksha}`);
  dRow(L.labels.tithiLabel,`${p.pakshaS} ${p.tithi} — ${p.tithiEnd}`,p.tithiNext,true);
  dRow(L.labels.nakLabel,`${p.nak} — ${p.nakEnd}`,p.nakNext);
  dRow(L.labels.yogaLabel,p.yoga,p.yogaNext);
  dRow(L.labels.karanaLabel,p.karana,p.karana2);
  dRow(L.labels.varjyam,p.varjyam,"",true);
  dRow(L.labels.amritakalam,p.amritakalam);
  dRow(L.labels.durmuhurtam,p.durmuhurtam);
  dRow(L.labels.sunRashi,p.sunRashi,"",true);
  dRow(L.labels.moonRashi,p.moonRashi);
  dRow(L.labels.rahuKaal,p.rahuKaal,"",true);
  dRow(L.labels.yamaGanda,p.yamaGanda);
  dRow(L.labels.guliKaal,p.guliKaal);
  dRow(L.labels.sunrise,p.sunrise,"",true);
  dRow(L.labels.sunset,p.sunset);
  const footY=cy+ch-110;
  ctx.save(); roundRect(ctx,cx,footY,cw,110,cr); ctx.clip();
  const g2=ctx.createLinearGradient(cx,footY,cx+cw,footY+110);
  g2.addColorStop(0,"#075e54"); g2.addColorStop(1,"#128c7e");
  ctx.fillStyle=g2; ctx.fillRect(cx,footY,cw,110); ctx.restore();
  ctx.textAlign="center"; ctx.fillStyle="#ffffff";
  ctx.font="900 40px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(`${dateDisp}  🙏`,W/2,footY+50);
  ctx.fillStyle="#a7f3d0"; ctx.font="400 22px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(L.aiNote,W/2,footY+90);
  triggerImageDownload(canvas,`panchanga_whatsapp_${dateDisp}.png`);
}

async function downloadPoster(dt: Date, loc?: LocationProp, langCode="te"){
  await loadTeluguFont();
  const L=getLang(langCode);
  const p=calcForDate(dt,loc?.lat,loc?.lng,langCode);
  const ugadi=findUgadi(dt.getFullYear()), isUgadi=dt.toDateString()===ugadi.toDateString();
  const dd=String(dt.getDate()).padStart(2,"0"), mmn=String(dt.getMonth()+1).padStart(2,"0"), yyyy=dt.getFullYear();
  const dateStr=`${dt.getDate()} ${L.month[dt.getMonth()]} ${yyyy}${isUgadi?" — "+L.labels.ugadi:""}`;
  const dateDisp=`${dd}-${mmn}-${yyyy}`;
  const locLabel=loc?.city?`📍 ${loc.city}`:"";
  const W=1080,H=1080;
  const canvas=document.createElement("canvas"); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#111111"; ctx.lineWidth=12; ctx.strokeRect(6,6,W-12,H-12);
  ctx.strokeStyle="#111111"; ctx.lineWidth=2; ctx.strokeRect(22,22,W-44,H-44);
  ctx.textAlign="left"; ctx.fillStyle="#444444";
  ctx.font="600 24px 'Noto Sans Telugu', sans-serif"; ctx.fillText(L.greeting,48,64);
  ctx.fillStyle="#111111"; ctx.font="900 80px sans-serif"; ctx.fillText("PANCHĀNGAM",48,140);
  ctx.textAlign="right"; ctx.fillStyle="#111111";
  ctx.font="700 24px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(`${p.samvatsara} ${L.samvatsara}`,W-48,108);
  ctx.fillStyle="#111111"; ctx.fillRect(36,172,W-72,90);
  ctx.textAlign="left"; ctx.fillStyle="#ffffff";
  ctx.font="900 38px 'Noto Sans Telugu', sans-serif"; ctx.fillText(dateStr,58,220);
  ctx.textAlign="left"; ctx.fillStyle="#aaaaaa";
  ctx.font="400 22px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(`${p.vara} (${p.varaLong})  —  ${p.ritu}  ${locLabel}`,58,252);
  const gx=36,gy=270,gw=W-72,gh=H-270-58,hw=gw/2,hh=gh/2;
  ctx.strokeStyle="#dddddd"; ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(gx+hw,gy);ctx.lineTo(gx+hw,gy+gh);ctx.stroke();
  ctx.beginPath();ctx.moveTo(gx,gy+hh);ctx.lineTo(gx+gw,gy+hh);ctx.stroke();
  function qTitle(t:string,qx:number,qy:number){
    ctx.fillStyle="#111"; ctx.font="700 17px 'Noto Sans Telugu', sans-serif";
    ctx.textAlign="left"; ctx.fillText(t.toUpperCase(),qx+14,qy+24);
    ctx.strokeStyle="#111"; ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(qx+14,qy+32);ctx.lineTo(qx+hw-14,qy+32);ctx.stroke();
  }
  function qRow(lbl:string,val:string,qx:number,y:number,sub=""){
    ctx.textAlign="left"; ctx.fillStyle="#666"; ctx.font="600 18px 'Noto Sans Telugu', sans-serif"; ctx.fillText(lbl,qx+14,y);
    ctx.textAlign="right"; ctx.fillStyle="#111"; ctx.font="700 18px 'Noto Sans Telugu', sans-serif"; ctx.fillText(val,qx+hw-14,y);
    if(sub){ctx.fillStyle="#999";ctx.font="400 14px 'Noto Sans Telugu', sans-serif";ctx.fillText(sub,qx+hw-14,y+16);}
    ctx.strokeStyle="#f0f0f0";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(qx+14,y+(sub?24:7));ctx.lineTo(qx+hw-14,y+(sub?24:7));ctx.stroke();
  }
  const q1x=gx,q1y=gy; qTitle(L.labels.panchangaAngalu,q1x,q1y);
  let qy1=q1y+50; const rs=40;
  qRow(L.labels.tithiLabel,`${p.pakshaS} ${p.tithi}`,q1x,qy1,`${L.labels.next}: ${p.tithiNext}`); qy1+=rs+8;
  qRow(L.labels.nakLabel,p.nak,q1x,qy1,`${L.labels.next}: ${p.nakNext}`); qy1+=rs+8;
  qRow(L.labels.yogaLabel,p.yoga,q1x,qy1,`${L.labels.next}: ${p.yogaNext}`); qy1+=rs+8;
  qRow(L.labels.karanaLabel,p.karana,q1x,qy1,`${L.labels.next}: ${p.karana2}`); qy1+=rs+8;
  qRow(L.labels.masaLabel,p.masa,q1x,qy1); qy1+=rs;
  qRow(L.labels.pakshaLabel,p.paksha,q1x,qy1);
  const q2x=gx+hw,q2y=gy; qTitle(L.labels.rashuluSunrise,q2x,q2y);
  let qy2=q2y+50; const bw2=(hw-44)/2;
  ctx.fillStyle="#f9fafb";ctx.strokeStyle="#ddd";ctx.lineWidth=1;
  ctx.fillRect(q2x+14,qy2,bw2,60);ctx.strokeRect(q2x+14,qy2,bw2,60);
  ctx.fillRect(q2x+14+bw2+14,qy2,bw2,60);ctx.strokeRect(q2x+14+bw2+14,qy2,bw2,60);
  ctx.textAlign="center";
  ctx.fillStyle="#666";ctx.font="600 16px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(L.labels.sunRashi,q2x+14+bw2/2,qy2+20);
  ctx.fillStyle="#111";ctx.font="700 20px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(p.sunRashi,q2x+14+bw2/2,qy2+48);
  ctx.fillStyle="#666";ctx.font="600 16px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(L.labels.moonRashi,q2x+14+bw2+14+bw2/2,qy2+20);
  ctx.fillStyle="#111";ctx.font="700 20px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(p.moonRashi,q2x+14+bw2+14+bw2/2,qy2+48); qy2+=72;
  ctx.fillStyle="#111";ctx.fillRect(q2x+14,qy2,bw2,54);ctx.fillRect(q2x+14+bw2+14,qy2,bw2,54);
  ctx.fillStyle="#aaa";ctx.font="600 15px 'Noto Sans Telugu', sans-serif";ctx.textAlign="center";
  ctx.fillText(L.labels.sunrise,q2x+14+bw2/2,qy2+18);
  ctx.fillText(L.labels.sunset,q2x+14+bw2+14+bw2/2,qy2+18);
  ctx.fillStyle="#fff";ctx.font="900 24px sans-serif";
  ctx.fillText(p.sunrise,q2x+14+bw2/2,qy2+46);
  ctx.fillText(p.sunset,q2x+14+bw2+14+bw2/2,qy2+46); qy2+=68;
  ctx.textAlign="left";ctx.fillStyle="#555";ctx.font="700 16px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(L.labels.auspicious,q2x+14,qy2); qy2+=24;
  function mRow(lbl:string,val:string,y:number){
    ctx.textAlign="left";ctx.fillStyle="#666";ctx.font="600 17px 'Noto Sans Telugu', sans-serif";ctx.fillText(lbl,q2x+14,y);
    ctx.textAlign="right";ctx.fillStyle="#111";ctx.font="700 17px 'Noto Sans Telugu', sans-serif";ctx.fillText(val,q2x+hw-14,y);
  }
  mRow(L.labels.varjyam,p.varjyam,qy2+20);
  mRow(L.labels.amritakalam,p.amritakalam,qy2+46);
  mRow(L.labels.durmuhurtam,p.durmuhurtam,qy2+72);
  const q3x=gx,q3y=gy+hh; qTitle(L.labels.ashubhaKaala,q3x,q3y);
  function kRow(lbl:string,val:string,y:number,acc:string){
    ctx.fillStyle=acc;ctx.fillRect(q3x+14,y-20,5,28);
    ctx.textAlign="left";ctx.fillStyle="#111";ctx.font="700 20px 'Noto Sans Telugu', sans-serif";ctx.fillText(lbl,q3x+26,y);
    ctx.textAlign="right";ctx.fillStyle="#333";ctx.font="600 18px 'Noto Sans Telugu', sans-serif";ctx.fillText(val,q3x+hw-14,y);
    ctx.strokeStyle="#eee";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q3x+14,y+9);ctx.lineTo(q3x+hw-14,y+9);ctx.stroke();
  }
  kRow(L.labels.rahuKaal,p.rahuKaal,q3y+62,"#111");
  kRow(L.labels.yamaGanda,p.yamaGanda,q3y+108,"#555");
  kRow(L.labels.guliKaal,p.guliKaal,q3y+154,"#999");
  const q4x=gx+hw,q4y=gy+hh; qTitle(L.labels.kaalamanam,q4x,q4y);
  let qy4=q4y+50; const rs4=36;
  function q4r(lbl:string,val:string){
    ctx.textAlign="left";ctx.fillStyle="#666";ctx.font="600 18px 'Noto Sans Telugu', sans-serif";ctx.fillText(lbl,q4x+14,qy4);
    ctx.textAlign="right";ctx.fillStyle="#111";ctx.font="700 18px 'Noto Sans Telugu', sans-serif";ctx.fillText(val,q4x+hw-14,qy4);
    ctx.strokeStyle="#f0f0f0";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q4x+14,qy4+7);ctx.lineTo(q4x+hw-14,qy4+7);ctx.stroke();
    qy4+=rs4;
  }
  q4r(L.labels.samvatsaraLabel,p.samvatsara);
  q4r(L.labels.masaLabel,p.masa);
  q4r(L.labels.pakshaLabel,p.paksha);
  q4r(L.labels.rituLabel,p.ritu);
  q4r(L.labels.ayanaLabel,p.ayana);
  q4r(L.labels.vara,p.vara);
  const fy=H-52;
  ctx.strokeStyle="#111";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(36,fy-8);ctx.lineTo(W-36,fy-8);ctx.stroke();
  ctx.textAlign="left";ctx.fillStyle="#555";ctx.font="400 20px 'Noto Sans Telugu', sans-serif";
  ctx.fillText(L.aiNote,46,fy+18);
  triggerImageDownload(canvas,`panchanga_poster_${dateDisp}.png`);
}

function triggerPDF(loc?: LocationProp, langCode="te"){
  const L=getLang(langCode);
  const months=allMonths(), today=new Date();
  const VC=["#f59e0b","#3b82f6","#ef4444","#10b981","#8b5cf6","#ec4899","#6b7280"];
  const locLabel=loc?.city?`📍 ${loc.city}`:"";
  let html=`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Kannada:wght@400;700&family=Noto+Sans+Malayalam:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans Telugu','Noto Sans Devanagari','Noto Sans Tamil','Noto Sans Kannada','Noto Sans Malayalam',sans-serif}
.page{width:297mm;min-height:210mm;page-break-after:always;padding:6mm;background:#fff9f0}
.cover{background:linear-gradient(135deg,#7c2d12,#c2410c,#d97706);display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:210mm}
.hdr{background:linear-gradient(135deg,#7c2d12,#c2410c,#d97706);color:white;padding:8px 14px;border-radius:10px;margin-bottom:6px}
.hdr h2{font-size:14pt;font-weight:900}.hdr p{font-size:7pt;color:#fde68a}
.wk{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:3px}
.wkh{text-align:center;padding:3px;font-weight:700;font-size:9pt;border-radius:5px}
.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.cell{border:0.5px solid #e5e7eb;border-radius:7px;padding:3px;min-height:26mm;background:white;position:relative}
.cell.sun{background:#fff1f2}.cell.sat{background:#f5f3ff}
.cell.tod{background:#fef9c3;border:2px solid #f97316}.cell.ugd{border:2px solid #f59e0b;background:#fef3c7}
.cell.purn{border-left:3px solid #3b82f6}.cell.amav{border-left:3px solid #6b7280}.cell.ek{border-left:3px solid #22c55e}
.cell.emp{border:none;background:transparent}
.dn{font-size:11pt;font-weight:900;line-height:1;margin-bottom:1px}
.ti{font-size:7pt;font-weight:700;line-height:1.3}.nk{font-size:6pt;color:#6b7280}.rh{font-size:5.5pt;color:#dc2626;position:absolute;bottom:2px;left:3px}
.dot{position:absolute;top:2px;right:2px;width:5px;height:5px;border-radius:50%}
.foot{background:#7c2d12;color:#fde68a;font-size:6.5pt;text-align:center;padding:3px;border-radius:5px;margin-top:4px}
@media print{.page{page-break-after:always}}
</style></head><body>`;
  html+=`<div class="cover"><div style="text-align:center">
<div style="font-size:26pt;font-weight:900;color:#fde68a">${L.title}</div>
<div style="font-size:16pt;color:white;margin-top:8px">2026 – 2028</div>
${locLabel?`<div style="font-size:11pt;color:#fde68a;margin-top:6px">${locLabel}</div>`:""}
<div style="font-size:9pt;color:#fcd34d;margin-top:20px">aksharatantra.vercel.app</div>
<div style="font-size:7pt;color:#fed7aa;margin-top:6px">${L.aiNote}</div>
</div></div>`;
  for(const {year,month} of months){
    const ugadi=findUgadi(year), fDow=new Date(year,month,1).getDay(), tot=daysInMonth(year,month);
    const samv=getSamvatsara(new Date(year,month,15));
    const cells:(number|null)[]=[...Array(fDow).fill(null)];
    for(let d=1;d<=tot;d++) cells.push(d);
    while(cells.length%7!==0) cells.push(null);
    html+=`<div class="page"><div class="hdr"><h2>🗓️ ${L.month[month]} ${year}${locLabel?`  ${locLabel}`:""}</h2>
<p>${samv} ${L.samvatsara}</p></div><div class="wk">`;
    L.varaShort.forEach((v,i)=>{ html+=`<div class="wkh" style="color:${VC[i]}">${v}</div>`; });
    html+=`</div><div class="grid">`;
    cells.forEach((day,idx)=>{
      const di=idx%7;
      if(!day){html+=`<div class="cell emp"></div>`;return;}
      const dt=new Date(year,month,day);
      const p=calcForDate(dt,loc?.lat,loc?.lng,langCode);
      const isT=dt.toDateString()===today.toDateString(), isU=dt.toDateString()===ugadi.toDateString();
      const isEk=p.tithi===L.tithi[10]||p.tithi===L.tithi[25];
      const isPu=p.tithi===L.tithi[14], isAm=p.tithi===L.tithi[29];
      const cls=["cell",di===0?"sun":"",di===6?"sat":"",isT?"tod":"",isU?"ugd":"",
        !isU&&isPu?"purn":"",!isU&&isAm?"amav":"",!isU&&!isPu&&!isAm&&isEk?"ek":""].filter(Boolean).join(" ");
      const dot=isU?`<div class="dot" style="background:#f59e0b"></div>`:
        isPu?`<div class="dot" style="background:#3b82f6"></div>`:
        isAm?`<div class="dot" style="background:#6b7280"></div>`:
        isEk?`<div class="dot" style="background:#22c55e"></div>`:"";
      html+=`<div class="${cls}">${dot}
<div class="dn" style="color:${VC[di]}">${day}</div>
<div class="ti" style="color:${p.pakshaS===L.shuklaSuffix?"#1e40af":"#6b21a8"}">${p.pakshaS} ${p.tithi}</div>
<div class="nk">${p.nak}</div>
${isU?`<div class="nk" style="color:#92400e;font-weight:700">🌸 ${L.labels.ugadi}</div>`:""}
<div class="rh">${L.labels.rahuKaal.slice(0,3)}: ${p.rahuKaal.split("-")[0]}</div>
</div>`;
    });
    html+=`</div><div class="foot">${L.aiNote}</div></div>`;
  }
  html+=`</body></html>`;
  const win=window.open("","_blank","width=1400,height=900");
  if(!win){alert("Popup blocked");return;}
  win.document.write(html); win.document.close();
  win.onload=()=>{win.focus();win.print();};
}

// ── Popup ─────────────────────────────────────────────────────────────────
function PanchangaPopup({dt,onClose,location,langCode}:{dt:Date;onClose:()=>void;location:LocationProp;langCode:string}){
  const L=getLang(langCode);
  const p=calcForDate(dt,location?.lat,location?.lng,langCode);
  const ugadi=findUgadi(dt.getFullYear()), isUgadi=dt.toDateString()===ugadi.toDateString();
  const rows=[
    {label:L.labels.vara,value:p.vara},
    {label:L.labels.samvatsaraLabel,value:p.samvatsara},
    {label:L.labels.ayanaritu,value:`${p.ayana}, ${p.ritu}`},
    {label:L.labels.masapaksha,value:`${p.masa}, ${p.paksha}`},
    {label:L.labels.tithiLabel,value:`${p.tithi} — ${p.tithiEnd}`,next:`${L.labels.next}: ${p.tithiNext}`},
    {label:L.labels.nakLabel,value:`${p.nak} — ${p.nakEnd}`,next:`${L.labels.next}: ${p.nakNext}`},
    {label:L.labels.yogaLabel,value:p.yoga,next:`${L.labels.next}: ${p.yogaNext}`},
    {label:L.labels.karanaLabel,value:`${p.karana} → ${p.karana2}`},
    {label:L.labels.sunRashi,value:p.sunRashi},
    {label:L.labels.moonRashi,value:p.moonRashi},
    {label:L.labels.sunrise,value:p.sunrise},
    {label:L.labels.sunset,value:p.sunset},
    {label:L.labels.varjyam,value:p.varjyam},
    {label:L.labels.amritakalam,value:p.amritakalam},
    {label:L.labels.durmuhurtam,value:p.durmuhurtam},
  ];
  const kaalas=[
    {label:L.labels.rahuKaal,value:p.rahuKaal,cls:"bg-red-50 border-red-200 text-red-700"},
    {label:L.labels.yamaGanda,value:p.yamaGanda,cls:"bg-orange-50 border-orange-200 text-orange-700"},
    {label:L.labels.guliKaal,value:p.guliKaal,cls:"bg-yellow-50 border-yellow-200 text-yellow-700"},
  ];
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{background:"rgba(0,0,0,0.55)"}} onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 z-10 px-5 pt-5 pb-4"
          style={{background:"linear-gradient(135deg,#7c2d12,#c2410c,#d97706)"}}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-amber-200 text-xs font-semibold">🙏 {L.greeting}</p>
              <h2 className="text-white font-black text-lg mt-0.5">
                {dt.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              </h2>
              {location?.city&&<p className="text-amber-200 text-xs mt-0.5">📍 {location.city}</p>}
              {isUgadi&&(
                <div className="mt-1 inline-flex items-center gap-1 bg-yellow-400 rounded-full px-3 py-0.5">
                  <span className="text-xs font-black text-yellow-900">🌸 {L.labels.ugadi}!</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-2">
              <button onClick={()=>downloadWhatsApp(dt,location,langCode)}
                className="bg-white/20 hover:bg-white/35 rounded-full w-9 h-9 flex items-center justify-center text-white text-sm font-bold">💬</button>
              <button onClick={()=>downloadPoster(dt,location,langCode)}
                className="bg-white/20 hover:bg-white/35 rounded-full w-9 h-9 flex items-center justify-center text-white text-sm font-bold">🖼️</button>
              <button onClick={onClose}
                className="bg-white/20 hover:bg-white/35 rounded-full w-9 h-9 flex items-center justify-center text-white font-bold">✕</button>
            </div>
          </div>
        </div>
        <div className="px-5 py-1 divide-y divide-gray-50">
          {rows.map((r,i)=>(
            <div key={i} className="flex items-start justify-between py-2.5">
              <div className="text-xs text-gray-400 font-medium w-28 flex-shrink-0 pt-0.5">{r.label}</div>
              <div className="flex-1 text-right">
                <div className="text-sm font-semibold text-gray-800">{r.value}</div>
                {r.next&&<div className="text-xs text-amber-600 mt-0.5">{r.next}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4 pt-2">
          <p className="text-xs font-bold text-gray-500 mb-2">{L.inauspicious}</p>
          <div className="space-y-1.5">
            {kaalas.map((k,i)=>(
              <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${k.cls}`}>
                <span className="font-semibold">{k.label}</span>
                <span className="font-mono">{k.value}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-gray-300 pb-3">{L.aiNote}</p>
      </div>
    </div>
  );
}

// ── Month Grid ─────────────────────────────────────────────────────────────
function MonthGrid({year,month,onSelect,selected,location,langCode}:{
  year:number;month:number;onSelect:(d:Date)=>void;selected:Date|null;location:LocationProp;langCode:string;
}){
  const L=getLang(langCode);
  const today=new Date(), firstDow=new Date(year,month,1).getDay(), total=daysInMonth(year,month);
  const ugadi=findUgadi(year);
  const cells:(number|null)[]=[...Array(firstDow).fill(null)];
  for(let d=1;d<=total;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const weeks:(number|null)[][]=[];
  for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  return(
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {L.varaShort.map((v,i)=>(
          <div key={v} className="text-center py-1.5 text-xs font-black rounded-lg" style={{color:VARA_CLR[i]}}>{v}</div>
        ))}
      </div>
      {weeks.map((week,wi)=>(
        <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
          {week.map((day,di)=>{
            if(!day) return <div key={di} style={{minHeight:"60px"}}/>;
            const dt=new Date(year,month,day);
            const isToday=dt.toDateString()===today.toDateString();
            const isSel=selected&&dt.toDateString()===selected.toDateString();
            const isUgadi=dt.toDateString()===ugadi.toDateString();
            const p=calcForDate(dt,location?.lat,location?.lng,langCode);
            const isEk=p.tithi===L.tithi[10]||p.tithi===L.tithi[25];
            const isPurn=p.tithi===L.tithi[14], isAma=p.tithi===L.tithi[29];
            return(
              <button key={di} onClick={()=>onSelect(dt)}
                className={`relative rounded-xl p-1 text-left transition-all hover:scale-[1.05] hover:shadow-md active:scale-95
                  ${isSel?"ring-2 ring-orange-500 shadow-lg bg-orange-50 scale-[1.03]":""}
                  ${isToday&&!isSel?"bg-amber-50 border-2 border-amber-400":""}
                  ${di===0&&!isSel&&!isToday?"bg-red-50":""}
                  ${di===6&&!isSel&&!isToday?"bg-violet-50":""}
                  ${!isSel&&!isToday&&di!==0&&di!==6?"bg-white border border-gray-100 hover:border-amber-200":""}`}
                style={{minHeight:"60px"}}>
                {(isUgadi||isPurn||isAma||isEk)&&(
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full
                    ${isUgadi?"bg-yellow-400":isPurn?"bg-blue-400":isAma?"bg-gray-500":"bg-green-400"}`}/>
                )}
                <div className="text-sm font-black leading-none mb-0.5" style={{color:VARA_CLR[di]}}>{day}</div>
                <div className="font-semibold leading-tight truncate"
                  style={{fontSize:"9px",color:p.pakshaS===L.shuklaSuffix?"#1e40af":"#6b21a8"}}>
                  {p.pakshaS} {p.tithi}
                </div>
                <div className="text-gray-400 truncate" style={{fontSize:"8px"}}>{p.nak}</div>
                {isUgadi&&<div className="truncate font-bold" style={{fontSize:"8px",color:"#92400e"}}>🌸 {L.labels.ugadi}</div>}
                {isToday&&<div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"/>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────
export function PanchangaCard({location,lang="te"}:{location?:LocationProp;lang?:string}){
  const L=getLang(lang);
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [selected,setSel]=useState<Date|null>(null);
  const [pdfBusy,setPDF]=useState(false);

  const goMonth=useCallback((dir:number)=>{
    let m=month+dir, y=year;
    if(m>11){m=0;y++;} if(m<0){m=11;y--;}
    if(y<CAL_START.year||(y===CAL_START.year&&m<CAL_START.month)) return;
    if(y>CAL_END.year||(y===CAL_END.year&&m>CAL_END.month)) return;
    setYear(y); setMonth(m);
  },[year,month]);

  const todayP=calcForDate(now,location?.lat,location?.lng,lang);
  const samv=getSamvatsara(new Date(year,month,15));
  const isStart=year===CAL_START.year&&month===CAL_START.month;
  const isEnd=year===CAL_END.year&&month===CAL_END.month;

  return(
    <div className="max-w-2xl mx-auto px-2 py-4 space-y-4">
      {/* Header */}
      <div className="rounded-3xl overflow-hidden shadow-xl"
        style={{background:"linear-gradient(135deg,#7c2d12,#c2410c,#d97706)"}}>
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <p className="text-amber-200 text-xs font-semibold">🙏 {L.greeting}</p>
            <h1 className="text-white font-black text-xl mt-0.5">{L.title}</h1>
            <p className="text-amber-200 text-xs mt-0.5">{samv} {L.samvatsara}</p>
            {location&&<p className="text-amber-300 text-xs mt-1">📍 {location.city||`${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`}</p>}
          </div>
          <button onClick={()=>{setPDF(true);setTimeout(()=>{triggerPDF(location??undefined,lang);setPDF(false);},100);}}
            disabled={pdfBusy}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl px-4 py-2.5 text-sm font-bold transition hover:scale-105 disabled:opacity-50">
            {pdfBusy?"⏳":L.labels.pdf}
          </button>
        </div>
        <div className="px-5 pb-4 flex items-center justify-between">
          <button onClick={()=>goMonth(-1)} disabled={isStart}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-30 text-white rounded-xl px-4 py-2 text-sm font-bold transition">◀</button>
          <p className="text-white font-black text-xl">{L.month[month]} {year}</p>
          <button onClick={()=>goMonth(1)} disabled={isEnd}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-30 text-white rounded-xl px-4 py-2 text-sm font-bold transition">▶</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-1">
        {[
          {dot:"bg-yellow-400",label:L.labels.ugadi},
          {dot:"bg-blue-400",label:L.labels.pournami},
          {dot:"bg-gray-500",label:L.labels.amavasya},
          {dot:"bg-green-400",label:L.labels.ekadashi},
          {dot:"bg-orange-500",label:L.labels.today},
        ].map(l=>(
          <div key={l.label} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm border border-gray-100">
            <div className={`w-2.5 h-2.5 rounded-full ${l.dot}`}/>
            <span className="text-xs text-gray-600 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="bg-white rounded-3xl shadow-lg p-3 border border-gray-100">
        <MonthGrid year={year} month={month} onSelect={setSel} selected={selected} location={location??null} langCode={lang}/>
      </div>

      {/* Today quick view */}
      <div className="bg-white rounded-3xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{L.todaySummary}</h3>
            <p className="text-xs text-gray-400">{now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>downloadWhatsApp(now,location??null,lang)}
              className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 hover:bg-green-100 transition">
              {L.labels.whatsapp}
            </button>
            <button onClick={()=>downloadPoster(now,location??null,lang)}
              className="text-xs text-gray-600 font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-100 transition">
              {L.labels.poster}
            </button>
            <button onClick={()=>setSel(now)}
              className="text-xs text-amber-600 font-semibold bg-amber-50 rounded-xl px-3 py-1.5 hover:bg-amber-100 transition">
              {L.fullDetails}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            {label:L.labels.samvatsaraLabel,value:todayP.samvatsara,bg:"bg-amber-50 text-amber-800"},
            {label:L.labels.tithiLabel,value:`${todayP.pakshaS} ${todayP.tithi}`,bg:"bg-blue-50 text-blue-800"},
            {label:L.labels.nakLabel,value:todayP.nak,bg:"bg-yellow-50 text-yellow-800"},
            {label:L.labels.rahuKaal,value:todayP.rahuKaal,bg:"bg-red-50 text-red-800"},
          ].map(r=>(
            <div key={r.label} className={`rounded-2xl p-3 ${r.bg}`}>
              <div className="text-xs opacity-60 font-medium">{r.label}</div>
              <div className="text-sm font-bold mt-0.5 leading-snug">{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {selected&&<PanchangaPopup dt={selected} onClose={()=>setSel(null)} location={location??null} langCode={lang}/>}

      <p className="text-center text-xs text-gray-300 pb-2">{L.clickDate} | {L.aiNote}</p>
    </div>
  );
}
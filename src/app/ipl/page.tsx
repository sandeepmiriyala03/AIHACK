"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
// ═══════════════════════════════════════════════════════════════
// CANVAS CONSTANTS
// ═══════════════════════════════════════════════════════════════
const CW = 780, CH = 510;
const CX = 390, CY = 255;
const GRX = 340, GRY = 232;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type ShotType = "defend"|"single"|"drive"|"pull"|"slog"|"helicopter";
type DeliveryType = "full"|"short"|"yorker"|"bouncer"|"slower"|"spin";
type BallOutcome = 0|1|2|4|6|"W"|"Wd"|"Nb";
type AnimPhase = "idle"|"runup"|"delivery"|"impact"|"travel"|"celebrate"|"done";

interface V2 { x:number; y:number }
const v2=(x:number,y:number):V2=>({x,y});
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const lerpV=(a:V2,b:V2,t:number):V2=>v2(lerp(a.x,b.x,t),lerp(a.y,b.y,t));
const easeOut=(t:number)=>1-(1-t)*(1-t);
const easeInOut=(t:number)=>t<0.5?2*t*t:1-2*(1-t)*(1-t);
const toS=(w:V2):V2=>v2(CX+w.x,CY+w.y);
const dist=(a:V2,b:V2)=>Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);

interface IPLTeam { name:string; short:string; primary:string; secondary:string; text:string; flag:string }
interface InningsData { runs:number; wickets:number; legalBalls:number; extras:number; events:EvtRecord[] }
interface EvtRecord { outcome:BallOutcome; commentary:string; overNum:number; ballInOver:number }
type GamePhase = "select"|"toss"|"match"|"innings-break"|"result";

// ═══════════════════════════════════════════════════════════════
// FIELD POSITIONS (world coords: y- = bowling end, y+ = batting end)
// ═══════════════════════════════════════════════════════════════
const POS = {
  BOWLER_START: v2(0,-178),
  BOWLER_CREASE: v2(0,-92),
  NON_STRIKER: v2(-14,-78),
  UMPIRE_BOWL: v2(26,-118),
  BATSMAN: v2(0,88),
  KEEPER: v2(10,120),
  UMPIRE_SQ: v2(-130,88),
  // 9 fielders
  SLIP:    v2(38,130),
  GULLY:   v2(115,68),
  POINT:   v2(215,6),
  COVER:   v2(200,-60),
  MID_OFF: v2(74,-208),
  MID_ON:  v2(-74,-208),
  MID_WKT: v2(-195,-36),
  SQ_LEG:  v2(-215,68),
  FINE_LEG:v2(-100,220),
  THIRD_MAN:v2(100,220),
};

const FIELDER_LABELS: Record<string,string> = {
  SLIP:"SL", GULLY:"GU", POINT:"PT", COVER:"CV", MID_OFF:"MO",
  MID_ON:"MN", MID_WKT:"MW", SQ_LEG:"SQ", FINE_LEG:"FL", THIRD_MAN:"TM",
  KEEPER:"WK",
};

// ═══════════════════════════════════════════════════════════════
// TEAMS
// ═══════════════════════════════════════════════════════════════
const TEAMS: IPLTeam[] = [
  {name:"Chennai Super Kings",        short:"CSK",  primary:"#F7B731",secondary:"#1A3A5C",text:"#1A3A5C",flag:"🦁"},
  {name:"Mumbai Indians",             short:"MI",   primary:"#004C93",secondary:"#D4AF37",text:"#FFFFFF",flag:"🔵"},
  {name:"Royal Challengers Bengaluru",short:"RCB",  primary:"#CC0000",secondary:"#222222",text:"#FFFFFF",flag:"🔴"},
  {name:"Kolkata Knight Riders",      short:"KKR",  primary:"#3A225D",secondary:"#DDB84C",text:"#FFFFFF",flag:"⚡"},
  {name:"Sunrisers Hyderabad",        short:"SRH",  primary:"#F26522",secondary:"#111111",text:"#FFFFFF",flag:"🌅"},
  {name:"Rajasthan Royals",           short:"RR",   primary:"#E54096",secondary:"#1B2B74",text:"#FFFFFF",flag:"👑"},
  {name:"Delhi Capitals",             short:"DC",   primary:"#0078BC",secondary:"#D71920",text:"#FFFFFF",flag:"🦅"},
  {name:"Punjab Kings",               short:"PBKS", primary:"#D71920",secondary:"#B4975A",text:"#FFFFFF",flag:"👊"},
];

// ═══════════════════════════════════════════════════════════════
// OUTCOME MATRIX
// ═══════════════════════════════════════════════════════════════
type OW = {W:number;0:number;1:number;2:number;4:number;6:number};
const M: Record<ShotType, Record<DeliveryType, OW>> = {
  defend:     {full:{W:3,0:74,1:18,2:5,4:0,6:0},  short:{W:2,0:70,1:20,2:8,4:0,6:0},   yorker:{W:4,0:72,1:18,2:6,4:0,6:0},  bouncer:{W:8,0:62,1:20,2:10,4:0,6:0}, slower:{W:3,0:68,1:22,2:7,4:0,6:0}, spin:{W:4,0:65,1:22,2:9,4:0,6:0}},
  single:     {full:{W:5,0:8,1:72,2:12,4:3,6:0},  short:{W:4,0:5,1:75,2:14,4:2,6:0},   yorker:{W:6,0:15,1:65,2:12,4:2,6:0},bouncer:{W:5,0:10,1:68,2:15,4:2,6:0},slower:{W:4,0:8,1:72,2:14,4:2,6:0}, spin:{W:5,0:8,1:70,2:14,4:3,6:0}},
  drive:      {full:{W:15,0:5,1:10,2:10,4:45,6:15},short:{W:28,0:10,1:15,2:20,4:25,6:2},yorker:{W:40,0:25,1:18,2:12,4:5,6:0},bouncer:{W:30,0:15,1:15,2:15,4:20,6:5},slower:{W:22,0:10,1:15,2:10,4:30,6:13},spin:{W:18,0:8,1:12,2:10,4:38,6:14}},
  pull:       {full:{W:22,0:10,1:18,2:12,4:28,6:10},short:{W:8,0:3,1:8,2:11,4:35,6:35}, yorker:{W:35,0:28,1:18,2:12,4:5,6:2},bouncer:{W:12,0:4,1:8,2:10,4:33,6:33},slower:{W:18,0:8,1:14,2:12,4:30,6:18},spin:{W:20,0:8,1:12,2:12,4:28,6:20}},
  slog:       {full:{W:28,0:5,1:5,2:5,4:25,6:32}, short:{W:22,0:4,1:4,2:5,4:23,6:42},  yorker:{W:48,0:18,1:8,2:5,4:8,6:13},bouncer:{W:38,0:8,1:4,2:4,4:18,6:28},slower:{W:32,0:8,1:4,2:4,4:20,6:32}, spin:{W:28,0:7,1:5,2:5,4:23,6:32}},
  helicopter: {full:{W:18,0:5,1:8,2:10,4:28,6:31},short:{W:28,0:8,1:8,2:10,4:20,6:26}, yorker:{W:15,0:8,1:12,2:15,4:25,6:25},bouncer:{W:32,0:10,1:8,2:10,4:18,6:22},slower:{W:22,0:8,1:8,2:10,4:22,6:30},spin:{W:22,0:8,1:8,2:10,4:22,6:30}},
};

function wPick<T>(items:T[],ws:number[]):T{
  let r=Math.random()*ws.reduce((a,b)=>a+b,0);
  for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i];}
  return items[items.length-1];
}
function rollOutcome(shot:ShotType,del:DeliveryType):BallOutcome{
  const wt=M[shot][del];
  const entries=Object.entries(wt) as [string,number][];
  const total=entries.reduce((a,[,v])=>a+v,0);
  let r=Math.random()*total;
  for(const[k,v]of entries){r-=v;if(r<=0)return(k==="W"?"W":Number(k)) as BallOutcome;}
  return 0;
}
function pickDelivery(lb:number):DeliveryType{
  const ov=Math.floor(lb/6);
  const dels:DeliveryType[]=["full","short","yorker","bouncer","slower","spin"];
  if(ov>=16) return wPick(dels,[10,5,35,10,25,15]);
  if(ov<6)   return wPick(dels,[30,20,10,15,10,15]);
  return wPick(dels,[20,15,15,15,15,20]);
}
function pickAIShot(runs:number,wickets:number,lb:number,target:number):ShotType{
  const ballsLeft=120-lb;
  const needed=target-runs;
  const rrr=ballsLeft>0?(needed/ballsLeft)*6:999;
  const shots:ShotType[]=["defend","single","drive","pull","slog","helicopter"];
  if(wickets>=8) return wPick(shots,[20,30,20,15,10,5]);
  if(rrr>14) return wPick(shots,[2,5,15,15,35,28]);
  if(rrr>10) return wPick(shots,[5,10,20,20,25,20]);
  if(rrr>7)  return wPick(shots,[10,20,25,22,13,10]);
  return wPick(shots,[15,30,28,18,5,4]);
}
function checkExtra():"Wd"|"Nb"|null{
  const r=Math.random();
  if(r<0.035) return "Wd";
  if(r<0.055) return "Nb";
  return null;
}
const COMM:Record<string,string[]>={
  W:["WICKET! Brilliant catch!","BOWLED! Stumps go flying!","OUT! LBW plumb in front!","OUT! Edged to keeper!","CAUGHT! Screamer at slip!","OUT! Top-edge to fine leg!"],
  "0":["Dot ball! Tight bowling.","Beaten outside off!","Well defended.","Played and missed!","Hits the pads, no run."],
  "1":["Quick single taken!","Worked to leg for one.","Pushed to mid-off, single.","Dabbed to third man, one."],
  "2":["Two runs! Great running!","Driven for two.","Two more! Good cricket."],
  "4":["FOUR! Cracking shot!","FOUR! Racing to the fence!","BOUNDARY! Through the covers!","FOUR! Down to fine leg!","FOUR! Slashed over point!"],
  "6":["SIX! Massive hit!","SIX! Gone into the stands!","MAXIMUM! Huge six!","SIX! The crowd erupts!","SIX! Over long-on, gone!"],
  "Wd":["Wide ball! Extra run awarded.","Down leg, called wide."],
  "Nb":["No ball! Front foot transgression! Free hit next ball!"],
};
const pick=(a:string[])=>a[Math.floor(Math.random()*a.length)];
const getComm=(o:BallOutcome)=>pick(COMM[o==="W"?"W":o==="Wd"?"Wd":o==="Nb"?"Nb":String(o)]||COMM["0"]);

function emptyInnings():InningsData{return{runs:0,wickets:0,legalBalls:0,extras:0,events:[]};}
function isOver(inn:InningsData):boolean{return inn.wickets>=10||inn.legalBalls>=120;}
function oversStr(lb:number):string{return`${Math.floor(lb/6)}.${lb%6}`;}

// ═══════════════════════════════════════════════════════════════
// BALL DESTINATION
// ═══════════════════════════════════════════════════════════════
function getBallDest(shot:ShotType,outcome:BallOutcome):V2{
  if(outcome==="W"){
    const dest:Record<ShotType,V2>={defend:POS.KEEPER,single:POS.KEEPER,drive:POS.GULLY,pull:POS.SQ_LEG,slog:POS.MID_WKT,helicopter:POS.FINE_LEG};
    return dest[shot];
  }
  if(outcome==="Wd"||outcome==="Nb") return v2(14,128);
  const dirs:Record<ShotType,V2>={
    defend:     v2(6,72),
    single:     v2(58,-158),
    drive:      v2(220,-148),
    pull:       v2(-232,28),
    slog:       v2(-162,-225),
    helicopter: v2(-88,232),
  };
  const dir=dirs[shot];
  const mag=Math.sqrt(dir.x*dir.x+dir.y*dir.y);
  const n=v2(dir.x/mag,dir.y/mag);
  if(outcome===6) return v2(n.x*(GRX*1.25),n.y*(GRY*1.25));
  if(outcome===4) return v2(n.x*(GRX-18),n.y*(GRY-18));
  const scales:Record<number,number>={0:0.18,1:0.52,2:0.76};
  const sc=scales[outcome as number]??0.52;
  return v2(n.x*GRX*sc,n.y*GRY*sc);
}

// Which fielder key is closest to ball destination?
function closestFielder(dest:V2):string{
  const fielders:{key:string;pos:V2}[]=[
    {key:"KEEPER",pos:POS.KEEPER},{key:"SLIP",pos:POS.SLIP},{key:"GULLY",pos:POS.GULLY},
    {key:"POINT",pos:POS.POINT},{key:"COVER",pos:POS.COVER},{key:"MID_OFF",pos:POS.MID_OFF},
    {key:"MID_ON",pos:POS.MID_ON},{key:"MID_WKT",pos:POS.MID_WKT},{key:"SQ_LEG",pos:POS.SQ_LEG},
    {key:"FINE_LEG",pos:POS.FINE_LEG},{key:"THIRD_MAN",pos:POS.THIRD_MAN},
  ];
  let best="KEEPER",bd=99999;
  for(const f of fielders){const d=dist(dest,f.pos);if(d<bd){bd=d;best=f.key;}}
  return best;
}

// ═══════════════════════════════════════════════════════════════
// CANVAS DRAW HELPERS
// ═══════════════════════════════════════════════════════════════
function hexAlpha(hex:string,a:number):string{
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return`rgba(${r},${g},${b},${a})`;
}

function drawStands(ctx:CanvasRenderingContext2D,t1:IPLTeam,t2:IPLTeam){
  ctx.fillStyle="#111";
  ctx.fillRect(0,0,CW,CH);
  // Draw tiered stands as concentric oval bands in 4 sections
  for(let tier=18;tier>=0;tier--){
    const sx=GRX+22+tier*12;
    const sy=GRY+15+tier*8;
    const alpha=0.55-tier*0.02;
    // Top half (bowling end stands) - fielding team color
    ctx.beginPath();
    ctx.ellipse(CX,CY,sx,sy,0,Math.PI,2*Math.PI);
    ctx.fillStyle=hexAlpha(tier%2===0?t2.primary:t2.secondary,alpha);
    ctx.fill();
    // Bottom half (batting end stands) - batting team color
    ctx.beginPath();
    ctx.ellipse(CX,CY,sx,sy,0,0,Math.PI);
    ctx.fillStyle=hexAlpha(tier%2===0?t1.primary:t1.secondary,alpha);
    ctx.fill();
  }
  // Crowd dots for realism
  for(let i=0;i<220;i++){
    const angle=Math.random()*Math.PI*2;
    const rxv=GRX+(15+Math.random()*170);
    const ryv=GRY+(10+Math.random()*110);
    const px=CX+rxv*Math.cos(angle),py=CY+ryv*Math.sin(angle);
    if(px<6||px>CW-6||py<6||py>CH-6) continue;
    ctx.fillStyle=`hsl(${Math.random()*360},70%,${50+Math.random()*30}%)`;
    ctx.beginPath();
    ctx.arc(px,py,2,0,Math.PI*2);
    ctx.fill();
  }
}

function drawGround(ctx:CanvasRenderingContext2D){
  // Outfield gradient
  const grd=ctx.createRadialGradient(CX,CY,30,CX,CY,GRX);
  grd.addColorStop(0,"#4CAF50");grd.addColorStop(0.4,"#388E3C");grd.addColorStop(1,"#2E7D32");
  ctx.fillStyle=grd;
  ctx.beginPath();
  ctx.ellipse(CX,CY,GRX,GRY,0,0,Math.PI*2);
  ctx.fill();
  // Mowing pattern (alternating dark/light oval strips)
  for(let i=0;i<10;i++){
    const sr=1-(i/10);
    ctx.beginPath();
    ctx.ellipse(CX,CY,GRX*sr,GRY*sr,0,0,Math.PI*2);
    ctx.strokeStyle=i%2===0?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.03)";
    ctx.lineWidth=GRX*0.1;
    ctx.stroke();
  }
  // Boundary rope
  ctx.beginPath();
  ctx.ellipse(CX,CY,GRX-6,GRY-6,0,0,Math.PI*2);
  ctx.strokeStyle="rgba(255,255,255,0.9)";
  ctx.lineWidth=3;
  ctx.stroke();
  // Inner 30-yard circle
  ctx.beginPath();
  ctx.ellipse(CX,CY,160,110,0,0,Math.PI*2);
  ctx.strokeStyle="rgba(255,255,255,0.18)";
  ctx.lineWidth=1.5;
  ctx.setLineDash([6,6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPitch(ctx:CanvasRenderingContext2D,stumpFly:number){
  const pw=20,ph=192;
  const px=CX-pw/2,py=CY-ph/2;
  // Pitch surface
  const pg=ctx.createLinearGradient(px,py,px+pw,py+ph);
  pg.addColorStop(0,"#C8B66B");pg.addColorStop(0.5,"#D4C47A");pg.addColorStop(1,"#C8B66B");
  ctx.fillStyle=pg;
  ctx.fillRect(px,py,pw,ph);
  ctx.strokeStyle="rgba(100,80,30,0.4)";
  ctx.lineWidth=1;
  ctx.strokeRect(px,py,pw,ph);

  // Crease lines
  ctx.strokeStyle="white";ctx.lineWidth=2;
  // Bowling end crease
  ctx.beginPath();ctx.moveTo(CX-28,CY-92);ctx.lineTo(CX+28,CY-92);ctx.stroke();
  // Batting end popping crease
  ctx.beginPath();ctx.moveTo(CX-28,CY+78);ctx.lineTo(CX+28,CY+78);ctx.stroke();
  // Bowling end popping crease
  ctx.beginPath();ctx.moveTo(CX-28,CY-78);ctx.lineTo(CX+28,CY-78);ctx.stroke();
  // Return creases
  ctx.beginPath();ctx.moveTo(CX-28,CY-92);ctx.lineTo(CX-28,CY-78);ctx.stroke();
  ctx.beginPath();ctx.moveTo(CX+28,CY-92);ctx.lineTo(CX+28,CY-78);ctx.stroke();

  // Bowling end stumps (3 stumps)
  const bsy=CY-92;
  for(let i=-1;i<=1;i++){
    ctx.fillStyle="#c8a44a";
    ctx.fillRect(CX+i*5-1.5,bsy-18,3,18);
    // Bail
    ctx.fillStyle="#f0d090";
    ctx.fillRect(CX-5.5,bsy-18.5,11,2);
  }

  // Batting end stumps (can scatter on wicket)
  const bey=CY+88;
  for(let i=-1;i<=1;i++){
    const fly=stumpFly>0?Math.sin(stumpFly*Math.PI)*24*(i===0?0.5:i>0?1:-1.2):0;
    const flyY=stumpFly>0?-stumpFly*30:0;
    ctx.save();
    ctx.translate(CX+i*5+fly,bey+flyY);
    ctx.fillStyle="#c8a44a";
    ctx.fillRect(-1.5,0,3,-18);
    ctx.restore();
  }
  if(stumpFly<=0){
    ctx.fillStyle="#f0d090";
    ctx.fillRect(CX-5.5,bey-18.5,11,2);
  }
}

function drawPlayerFigure(
  ctx:CanvasRenderingContext2D,
  wx:number,wy:number,
  color:string,
  label:string,
  isKeeper=false,
  isHighlight=false,
  batSwingT=0,
  hasBat=false,
  isUmpire=false,
  armAngle=0,
){
  const s=toS(v2(wx,wy));
  const x=s.x,y=s.y;

  // Highlight glow
  if(isHighlight){
    ctx.beginPath();
    ctx.arc(x,y,22,0,Math.PI*2);
    ctx.fillStyle="rgba(255,220,0,0.35)";
    ctx.fill();
  }

  // Shadow
  ctx.fillStyle="rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x+2,y+5,13,6,0,0,Math.PI*2);
  ctx.fill();

  // Legs
  ctx.strokeStyle=color;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x-4,y+4);ctx.lineTo(x-7,y+14);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+4,y+4);ctx.lineTo(x+7,y+14);ctx.stroke();
  // White trousers
  ctx.strokeStyle="#eee";ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(x-4,y+4);ctx.lineTo(x-7,y+14);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+4,y+4);ctx.lineTo(x+7,y+14);ctx.stroke();

  // Body/jersey
  ctx.fillStyle=isUmpire?"#FFFFF0":color;
  ctx.beginPath();
  ctx.ellipse(x,y,11,14,0,0,Math.PI*2);
  ctx.fill();
  // Jersey stripe
  ctx.strokeStyle="rgba(255,255,255,0.3)";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x,y+8);ctx.stroke();

  // Bowling arm (animated)
  if(armAngle!==0){
    ctx.strokeStyle=color;ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(x,y-4);
    ctx.lineTo(x+Math.cos(armAngle)*18,y+Math.sin(armAngle)*18);
    ctx.stroke();
  }

  // Bat (for batsman)
  if(hasBat){
    const baseA=Math.PI*0.4;
    const swingA=baseA-batSwingT*(Math.PI*0.7);
    ctx.save();
    ctx.translate(x+9,y+2);
    ctx.rotate(-swingA);
    // Bat handle
    ctx.fillStyle="#5a3010";
    ctx.fillRect(-2,-22,4,14);
    // Grip tape
    ctx.strokeStyle="#222";ctx.lineWidth=1.5;
    for(let gi=0;gi<4;gi++){
      ctx.beginPath();ctx.moveTo(-2,-22+gi*3.5);ctx.lineTo(2,-22+gi*3.5);ctx.stroke();
    }
    // Bat blade
    ctx.fillStyle="#D4A855";
    ctx.beginPath();
    ctx.roundRect(-5,-8,10,16,2);
    ctx.fill();
    ctx.strokeStyle="#8B6914";ctx.lineWidth=1;ctx.stroke();
    ctx.restore();
  }

  // Gloves for keeper
  if(isKeeper){
    ctx.fillStyle="#FFD700";
    ctx.beginPath();ctx.ellipse(x-14,y,6,4,Math.PI*0.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+14,y,6,4,-Math.PI*0.2,0,Math.PI*2);ctx.fill();
  }

  // Head with helmet
  const headColor=isUmpire?"#FFFACD":(hasBat?"#2a2a4a":"#1a1a2e");
  ctx.fillStyle=headColor;
  ctx.beginPath();
  ctx.arc(x,y-12,8,0,Math.PI*2);
  ctx.fill();
  // Helmet grill (for batsman/keeper)
  if(hasBat||isKeeper){
    ctx.strokeStyle=isKeeper?"#B8860B":"#555";
    ctx.lineWidth=1.5;
    for(let g=0;g<3;g++){
      ctx.beginPath();ctx.moveTo(x-5,y-14+g*3);ctx.lineTo(x+5,y-14+g*3);ctx.stroke();
    }
  }
  // Umpire hat
  if(isUmpire){
    ctx.fillStyle="#FFFFFF";
    ctx.fillRect(x-8,y-22,16,4);
    ctx.fillRect(x-5,y-22,10,8);
  }
  // Face skin
  ctx.fillStyle="#D4A07A";
  ctx.beginPath();
  ctx.arc(x,y-12,4,Math.PI,Math.PI*2);
  ctx.fill();

  // Label below player
  ctx.fillStyle="rgba(0,0,0,0.75)";
  ctx.fillRect(x-12,y+17,24,11);
  ctx.fillStyle="#fff";
  ctx.font="bold 9px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(label,x,y+22.5);
  ctx.textBaseline="alphabetic";
}

function drawBall(ctx:CanvasRenderingContext2D,ballPos:V2,trail:V2[],visible:boolean,sixHeight:number){
  if(!visible) return;
  const s=toS(ballPos);
  const scale=sixHeight>0?Math.max(0.5,1-sixHeight/200):1;

  // Trail
  for(let i=0;i<trail.length;i++){
    const ts=toS(trail[i]);
    const alpha=0.08+(i/trail.length)*0.25;
    const r=5*scale*(i/trail.length);
    ctx.fillStyle=`rgba(255,255,200,${alpha})`;
    ctx.beginPath();ctx.arc(ts.x,ts.y-sixHeight*(i/trail.length)*0.5,r,0,Math.PI*2);ctx.fill();
  }

  const bx=s.x,by=s.y-sixHeight;
  // Glow
  const gl=ctx.createRadialGradient(bx,by,0,bx,by,14*scale);
  gl.addColorStop(0,"rgba(255,255,150,0.6)");gl.addColorStop(1,"rgba(255,255,150,0)");
  ctx.fillStyle=gl;
  ctx.beginPath();ctx.arc(bx,by,14*scale,0,Math.PI*2);ctx.fill();
  // Ball shadow (on ground when in air)
  if(sixHeight>10){
    ctx.fillStyle="rgba(0,0,0,0.2)";
    ctx.beginPath();ctx.ellipse(s.x,s.y+2,6*scale*0.6,3*scale*0.6,0,0,Math.PI*2);ctx.fill();
  }
  // Ball body
  const gr=ctx.createRadialGradient(bx-2,by-2,0,bx,by,6*scale);
  gr.addColorStop(0,"#FF6060");gr.addColorStop(0.6,"#CC0000");gr.addColorStop(1,"#800000");
  ctx.fillStyle=gr;
  ctx.beginPath();ctx.arc(bx,by,6*scale,0,Math.PI*2);ctx.fill();
  // Seam
  ctx.strokeStyle="rgba(255,200,200,0.7)";ctx.lineWidth=1*scale;
  ctx.beginPath();
  ctx.ellipse(bx,by,6*scale,3*scale,Math.PI/4,0,Math.PI);
  ctx.stroke();
}

function drawBoundaryFlash(ctx:CanvasRenderingContext2D,flashT:number,color:string){
  if(flashT<=0) return;
  const alpha=flashT*0.5;
  ctx.beginPath();
  ctx.ellipse(CX,CY,GRX-3,GRY-3,0,0,Math.PI*2);
  ctx.strokeStyle=hexAlpha(color,alpha);
  ctx.lineWidth=10;
  ctx.stroke();
}

function drawSixFireworks(ctx:CanvasRenderingContext2D,t:number){
  if(t<=0) return;
  const count=18;
  for(let i=0;i<count;i++){
    const a=(i/count)*Math.PI*2;
    const r=t*120;
    const fx=CX+Math.cos(a)*r,fy=CY+Math.sin(a)*r*0.6;
    const alpha=1-t;
    ctx.fillStyle=`hsla(${i*20},100%,60%,${alpha})`;
    ctx.beginPath();ctx.arc(fx,fy,4+t*6,0,Math.PI*2);ctx.fill();
  }
  // Stars
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2+t;
    const r=t*180;
    ctx.fillStyle=`rgba(255,255,100,${(1-t)*0.8})`;
    ctx.beginPath();ctx.arc(CX+Math.cos(a)*r,CY+Math.sin(a)*r*0.55,3+t*5,0,Math.PI*2);ctx.fill();
  }
}

function drawCelebText(ctx:CanvasRenderingContext2D,text:string,color:string,t:number){
  if(!text||t<=0) return;
  const alpha=t<0.2?t/0.2:t>0.8?(1-t)/0.2:1;
  const scale=t<0.15?t/0.15*1.2:1;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.translate(CX,CY);
  ctx.scale(scale,scale);
  ctx.font=`bold ${52}px Arial`;
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.strokeStyle="#000";ctx.lineWidth=5;ctx.strokeText(text,0,0);
  ctx.fillStyle=color;ctx.fillText(text,0,0);
  ctx.restore();
}

function drawScorePanel(ctx:CanvasRenderingContext2D,batting:IPLTeam,fielding:IPLTeam,inn:InningsData,phase:string,target?:number){
  // Top-left scoreboard
  const sw=220,sh=72,sx=8,sy=8;
  ctx.fillStyle="rgba(0,0,0,0.78)";
  roundRect(ctx,sx,sy,sw,sh,10);
  ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,0.2)";ctx.lineWidth=1;
  roundRect(ctx,sx,sy,sw,sh,10);ctx.stroke();

  ctx.font="bold 13px Arial";ctx.textAlign="left";ctx.fillStyle=batting.primary;
  ctx.fillText(batting.short,sx+12,sy+22);
  ctx.font="bold 24px Arial";ctx.fillStyle="#fff";
  ctx.fillText(`${inn.runs}/${inn.wickets}`,sx+12,sy+50);
  ctx.font="13px Arial";ctx.fillStyle="rgba(255,255,255,0.7)";
  ctx.fillText(`${oversStr(inn.legalBalls)} ov`,sx+12,sy+65);

  if(target!==undefined){
    ctx.font="bold 12px Arial";ctx.fillStyle="#FFD700";ctx.textAlign="right";
    const needed=target-inn.runs;const bl=120-inn.legalBalls;
    ctx.fillText(`Need ${Math.max(0,needed)} off ${bl}b`,sx+sw-10,sy+22);
    const rrr=bl>0?((needed/bl)*6).toFixed(2):"—";
    ctx.font="11px Arial";ctx.fillStyle="rgba(255,255,255,0.6)";
    ctx.fillText(`RRR: ${rrr}`,sx+sw-10,sy+38);
  }

  // Top-right: fielding team + over dots
  const fr=CW-8,ft=8;
  ctx.font="bold 13px Arial";ctx.textAlign="right";ctx.fillStyle=fielding.primary;
  ctx.fillText(fielding.short+" bowling",fr,ft+18);

  // Current over dots
  const overEvts=inn.events.filter(e=>e.overNum===Math.floor(inn.legalBalls/6));
  let dotX=CW-16;
  for(let i=overEvts.length-1;i>=0;i--){
    const e=overEvts[i];
    const bc=e.outcome==="W"?"#ef4444":e.outcome===6?"#8b5cf6":e.outcome===4?"#3b82f6":e.outcome===0?"#555":"#22c55e";
    ctx.fillStyle=bc;
    ctx.beginPath();ctx.arc(dotX,ft+38,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="bold 8px Arial";ctx.textAlign="center";
    ctx.fillText(String(e.outcome).slice(0,2),dotX,ft+41);
    dotX-=20;
  }
}

function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function IPLCricketGame(){
  const [gamePhase, setGamePhase] = useState<GamePhase>("select");
  const [playerTeam, setPlayerTeam] = useState<IPLTeam|null>(null);
  const [aiTeam, setAiTeam] = useState<IPLTeam|null>(null);
  const [playerBatsFirst, setPlayerBatsFirst] = useState(true);
  const [playerInn, setPlayerInn] = useState<InningsData>(emptyInnings());
  const [aiInn, setAiInn] = useState<InningsData>(emptyInnings());
  const [commentary, setCommentary] = useState("Welcome! Select your team to start.");
  const [tossWon, setTossWon] = useState<boolean|null>(null);
  const [tossAnim, setTossAnim] = useState(false);
  const [canShoot, setCanShoot] = useState(false);
  const [lastOut, setLastOut] = useState<BallOutcome|null>(null);

  const canvasRef=useRef<HTMLCanvasElement>(null);
  const rafRef=useRef<number>(0);
  const standsDrawn=useRef(false);
  const standsCanvas=useRef<HTMLCanvasElement|null>(null);
const [isSecondInnings, setIsSecondInnings] = useState(false);
  // ── Animation state (ref = no re-render) ──────────────────────────────────
  const anim=useRef({
    phase:"idle" as AnimPhase,
    startMs:0,durMs:1000,
    bowlerPos:v2(0,-178),
    ballPos:v2(0,-92),ballVisible:false,
    trail:[] as V2[],
    destPos:v2(0,120),
    outcome:null as BallOutcome|null,
    shot:null as ShotType|null,
    celebText:"",celebColor:"#fff",
    stumpFly:0,
    boundaryFlash:0,
    sixT:0,sixHeight:0,
    highlightKey:"",
    batSwingT:0,
    armAngle:-Math.PI/2, // bowler arm angle
    onDone:null as (()=>void)|null,
  });

  // ── Draw everything ────────────────────────────────────────────────────────
  const drawFrame=useCallback(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const ctx=canvas.getContext("2d");
    if(!ctx) return;
    const a=anim.current;
    const batting=playerBatsFirst?playerTeam!:aiTeam!;
    const fielding=playerBatsFirst?aiTeam!:playerTeam!;
    const inn=playerBatsFirst?playerInn:aiInn;

    ctx.clearRect(0,0,CW,CH);

    // Draw pre-rendered stands
    if(standsCanvas.current){
      ctx.drawImage(standsCanvas.current,0,0);
    }

    drawGround(ctx);
    drawPitch(ctx,a.stumpFly);

    // Boundary flash
    drawBoundaryFlash(ctx,a.boundaryFlash,"#FFD700");

    // Draw fielders
    const fielderKeys=["SLIP","GULLY","POINT","COVER","MID_OFF","MID_ON","MID_WKT","SQ_LEG","FINE_LEG","THIRD_MAN"] as const;
    type FKey = typeof fielderKeys[number];
    for(const key of fielderKeys){
      const pos=POS[key];
      drawPlayerFigure(ctx,pos.x,pos.y,fielding.primary,FIELDER_LABELS[key],false,a.highlightKey===key,0,false,false,0);
    }
    // Keeper
    drawPlayerFigure(ctx,POS.KEEPER.x,POS.KEEPER.y,fielding.primary,"WK",true,a.highlightKey==="KEEPER",0,false,false,0);

    // Umpires
    drawPlayerFigure(ctx,POS.UMPIRE_BOWL.x,POS.UMPIRE_BOWL.y,"#FFFFF0","UM",false,false,0,false,true,0);
    drawPlayerFigure(ctx,POS.UMPIRE_SQ.x,POS.UMPIRE_SQ.y,"#FFFFF0","UM",false,false,0,false,true,
      (a.outcome===4&&a.phase==="celebrate")?Math.PI/2:(a.outcome===6&&a.phase==="celebrate")?Math.PI/2:0
    );

    // Non-striker
    drawPlayerFigure(ctx,POS.NON_STRIKER.x,POS.NON_STRIKER.y,batting.primary,"NS",false,false,0,true,false,0);

    // Batsman
    drawPlayerFigure(ctx,POS.BATSMAN.x,POS.BATSMAN.y,batting.primary,"BAT",false,false,a.batSwingT,true,false,0);

    // Bowler
    const bowlerRunAngle=a.phase==="runup"?Math.PI*0.25:a.phase==="delivery"?-Math.PI*0.5+a.armAngle:0;
    drawPlayerFigure(ctx,a.bowlerPos.x,a.bowlerPos.y,fielding.primary,"BWL",false,false,0,false,false,
      a.phase==="delivery"?a.armAngle-Math.PI/2:0
    );

    // Ball
    drawBall(ctx,a.ballPos,a.trail,a.ballVisible,a.sixHeight);

    // Six fireworks
    if(a.sixT>0) drawSixFireworks(ctx,a.sixT);

    // Celebration text
    if(a.phase==="celebrate"||a.phase==="done"){
      const celebT=(Date.now()-a.startMs)/a.durMs;
      drawCelebText(ctx,a.celebText,a.celebColor,Math.min(1,celebT));
    }

    // Score panel
    const target=playerBatsFirst?undefined:playerInn.runs+1;
    drawScorePanel(ctx,batting,fielding,inn,"match",target);
  },[playerTeam,aiTeam,playerBatsFirst,playerInn,aiInn]);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  const rafLoop=useCallback((ts:number)=>{
    const a=anim.current;
    const elapsed=ts-a.startMs;
    const t=Math.min(elapsed/a.durMs,1);

    switch(a.phase){
      case "idle": break;

      case "runup":{
        a.bowlerPos=lerpV(POS.BOWLER_START,POS.BOWLER_CREASE,easeOut(t));
        a.armAngle=-Math.PI/2+t*Math.PI*0.3;
        if(t>=1){
          a.phase="delivery";a.startMs=ts;a.durMs=420;
          a.ballVisible=true;a.ballPos={...POS.BOWLER_CREASE};a.trail=[];
          a.armAngle=Math.PI*0.8;
        }
        break;
      }

      case "delivery":{
        // Ball from bowler to batsman, slight swing arc
        const bt=easeInOut(t);
        const swing=a.shot==="drive"?0.15:a.shot==="pull"?-0.1:0.05;
        a.ballPos=v2(
          lerp(POS.BOWLER_CREASE.x,POS.BATSMAN.x+swing*30*Math.sin(bt*Math.PI),bt),
          lerp(POS.BOWLER_CREASE.y,POS.BATSMAN.y,bt)
        );
        // Bowler arm follows through
        a.armAngle=Math.PI*0.8-t*Math.PI*1.3;
        a.trail.push({...a.ballPos});
        if(a.trail.length>6) a.trail.shift();
        if(t>=1){
          a.phase="impact";a.startMs=ts;a.durMs=220;a.trail=[];a.batSwingT=0;
        }
        break;
      }

      case "impact":{
        a.batSwingT=easeOut(t);
        if(t>=1){
          a.phase="travel";a.startMs=ts;
          a.durMs=(a.outcome===4||a.outcome===6)?1100:780;
          a.batSwingT=1;a.trail=[];
        }
        break;
      }

      case "travel":{
        const tt=easeOut(t);
        if(a.outcome===6){
          a.ballPos=lerpV(POS.BATSMAN,a.destPos,tt);
          a.sixHeight=Math.sin(tt*Math.PI)*110;
        } else {
          a.ballPos=lerpV(POS.BATSMAN,a.destPos,tt);
          a.sixHeight=0;
        }
        if(a.outcome===4) a.boundaryFlash=Math.sin(tt*Math.PI*4)*0.7*tt;
        a.trail.push({...a.ballPos});
        if(a.trail.length>12) a.trail.shift();
        if(t>=0.85&&(a.outcome===1||a.outcome===2||a.outcome===0||a.outcome==="W"))
          a.highlightKey=closestFielder(a.destPos);
        if(t>=1){
          a.phase="celebrate";a.startMs=ts;a.durMs=1300;
          a.trail=[];a.boundaryFlash=0;
          if(a.outcome===6) a.sixT=0.01;
        }
        break;
      }

      case "celebrate":{
        if(a.outcome===6) a.sixT=Math.min(1,elapsed/a.durMs);
        if(t>=1){
          a.phase="done";
          a.ballVisible=false;a.bowlerPos={...POS.BOWLER_START};
          a.batSwingT=0;a.sixT=0;a.sixHeight=0;a.stumpFly=0;
          a.highlightKey="";a.celebText="";
          a.outcome=null;a.shot=null;
          if(a.onDone){a.onDone();a.onDone=null;}
        }
        break;
      }

      case "done": break;
    }

    drawFrame();
    rafRef.current=requestAnimationFrame(rafLoop);
  },[drawFrame]);

  // ── Start RAF on mount ──────────────────────────────────────────────────────
  useEffect(()=>{
    rafRef.current=requestAnimationFrame(rafLoop);
    return()=>cancelAnimationFrame(rafRef.current);
  },[rafLoop]);

  // ── Pre-render stands to offscreen canvas ───────────────────────────────────
  useEffect(()=>{
    if(!playerTeam||!aiTeam) return;
    const off=document.createElement("canvas");
    off.width=CW;off.height=CH;
    const ctx=off.getContext("2d");
    if(ctx) drawStands(ctx,playerTeam,aiTeam);
    standsCanvas.current=off;
  },[playerTeam,aiTeam]);

  // ── Ball animation trigger ─────────────────────────────────────────────────
  const triggerBall=useCallback((shot:ShotType,outcome:BallOutcome,del:DeliveryType,comm:string,onDone:()=>void)=>{
    const a=anim.current;
    const dest=getBallDest(shot,outcome);
    a.shot=shot;a.outcome=outcome;a.destPos=dest;
    a.phase="runup";a.startMs=performance.now();a.durMs=700;
    a.bowlerPos={...POS.BOWLER_START};a.ballVisible=false;a.trail=[];
    a.stumpFly=outcome==="W"?0.001:0;
    a.highlightKey="";a.sixT=0;a.sixHeight=0;a.boundaryFlash=0;
    a.armAngle=-Math.PI/2;
    // Set celebration text
    a.celebText=outcome==="W"?"OUT!":outcome===6?"SIX! 🏏":outcome===4?"FOUR! 🎯":outcome===2?"TWO!":outcome===1?"ONE!":outcome==="Wd"?"WIDE":outcome==="Nb"?"NO BALL":"·";
    a.celebColor=outcome==="W"?"#ef4444":outcome===6?"#8b5cf6":outcome===4?"#FFD700":outcome==="Wd"||outcome==="Nb"?"#f59e0b":"#4ade80";
    a.onDone=()=>{
      // Stump fly effect timing
      if(outcome==="W"){a.stumpFly=1;}
      onDone();
    };
    // Stump scatter happens at moment of wicket
    if(outcome==="W"){
      setTimeout(()=>{const aa=anim.current;aa.stumpFly=0.6;},1100);
    }
    setCommentary(comm);
    setCanShoot(false);
  },[]);

  // ── Player shot handler ────────────────────────────────────────────────────
  const handleShot=useCallback((shot:ShotType)=>{
    if(!canShoot||anim.current.phase!=="idle"&&anim.current.phase!=="done") return;
    const del=pickDelivery(playerInn.legalBalls);
    const extra=checkExtra();
    let outcome:BallOutcome;
    let newInn:InningsData;
    if(extra){
      outcome=extra;
      newInn={...playerInn,runs:playerInn.runs+1,extras:playerInn.extras+1,
        events:[...playerInn.events,{outcome,commentary:getComm(outcome),overNum:Math.floor(playerInn.legalBalls/6),ballInOver:playerInn.legalBalls%6}]};
    } else {
      outcome=rollOutcome(shot,del);
      const isW=outcome==="W";
      const runs=isW?0:(outcome as number);
      newInn={...playerInn,runs:playerInn.runs+runs,wickets:playerInn.wickets+(isW?1:0),
        legalBalls:playerInn.legalBalls+1,
        events:[...playerInn.events,{outcome,commentary:getComm(outcome),overNum:Math.floor(playerInn.legalBalls/6),ballInOver:playerInn.legalBalls%6}]};
    }
    setLastOut(outcome);
    triggerBall(shot,outcome,del,getComm(outcome),()=>{
      setPlayerInn(newInn);
      if (isOver(newInn)) {
  if (!isSecondInnings) {
    // First innings complete
    setIsSecondInnings(true);
    setGamePhase("innings-break");
  } else {
    // Second innings complete
    setGamePhase("result");
  }
} else {
        setCanShoot(true);
        anim.current.phase="idle";
      }
    });
  },[canShoot,playerInn,triggerBall]);

  // ── AI innings auto-play ────────────────────────────────────────────────────
const aiTurnRef = useRef(false);

useEffect(() => {
  if (gamePhase !== "match") return;


const isAiBatting =
  (playerBatsFirst && isSecondInnings) ||   // AI chasing
  (!playerBatsFirst && !isSecondInnings);   // AI batting first
  if (!isAiBatting) return;

  if (anim.current.phase !== "idle") return;

  const target = isSecondInnings ? playerInn.runs + 1 : 0;
 if (isOver(aiInn) || (isSecondInnings && aiInn.runs >= target)) {
  if (isSecondInnings) {
    setGamePhase("result");
  } else {
    setIsSecondInnings(true);
    setGamePhase("innings-break");
  }
  return
}
  if (aiTurnRef.current) return;
  aiTurnRef.current = true;

  const timer = setTimeout(() => {
    const del = pickDelivery(aiInn.legalBalls);
    const extra = checkExtra();

    let outcome: BallOutcome;
    let newInn: InningsData;

    if (extra) {
      outcome = extra;

      newInn = {
        ...aiInn,
        runs: aiInn.runs + 1,
        extras: aiInn.extras + 1,
        events: [
          ...aiInn.events,
          {
            outcome,
            commentary: getComm(outcome),
            overNum: Math.floor(aiInn.legalBalls / 6),
            ballInOver: aiInn.legalBalls % 6
          }
        ]
      };

      const shot = pickAIShot(
        aiInn.runs,
        aiInn.wickets,
        aiInn.legalBalls,
        target
      );

      triggerBall(shot, outcome, del, getComm(outcome), () => {
        setAiInn(newInn);

        // ✅ RESET HERE (correct place)
        aiTurnRef.current = false;

        anim.current.phase = "idle";
      });

    } else {
      const shot = pickAIShot(
        aiInn.runs,
        aiInn.wickets,
        aiInn.legalBalls,
        target
      );

      outcome = rollOutcome(shot, del);

      const isW = outcome === "W";
      const runs = isW ? 0 : (outcome as number);

      newInn = {
        ...aiInn,
        runs: aiInn.runs + runs,
        wickets: aiInn.wickets + (isW ? 1 : 0),
        legalBalls: aiInn.legalBalls + 1,
        events: [
          ...aiInn.events,
          {
            outcome,
            commentary: getComm(outcome),
            overNum: Math.floor(aiInn.legalBalls / 6),
            ballInOver: aiInn.legalBalls % 6
          }
        ]
      };

      triggerBall(shot, outcome, del, getComm(outcome), () => {
        setAiInn(newInn);

        const won = newInn.runs >= target;

        // ✅ RESET HERE (correct place)
        aiTurnRef.current = false;

        if (isOver(newInn) || won) {
          setGamePhase("result");
        } else {
          anim.current.phase = "idle";
        }
      });
    }

  }, 900);

  return () => {
    clearTimeout(timer);
   aiTurnRef.current = false; 
  };

}, [gamePhase, playerBatsFirst, aiInn, playerInn.runs, triggerBall]);

  // ── When player innings done, start AI (if player batted first) ─────────────
  useEffect(()=>{
    if(gamePhase==="innings-break"&&playerBatsFirst){
      // Handled by Start button
    }
  },[gamePhase,playerBatsFirst]);

  // ── Toss ───────────────────────────────────────────────────────────────────
  const handleToss=()=>{
    setTossAnim(true);
    setTimeout(()=>{setTossWon(Math.random()>0.5);setTossAnim(false);},1300);
  };
  const startMatch=(batFirst:boolean)=>{
    setPlayerBatsFirst(batFirst);
    setGamePhase("match");
    setPlayerInn(emptyInnings());setAiInn(emptyInnings());
    setCanShoot(batFirst);
    anim.current.phase="idle";
    anim.current.bowlerPos={...POS.BOWLER_START};
    standsCanvas.current=null;
  };

  const reset=()=>{
    setGamePhase("select");setPlayerTeam(null);setAiTeam(null);
    setTossWon(null);setPlayerInn(emptyInnings());setAiInn(emptyInnings());
    setCommentary("Welcome! Select your team.");setCanShoot(false);
    anim.current.phase="idle";standsCanvas.current=null;
  };

  // ── Result ──────────────────────────────────────────────────────────────────
  const target=playerInn.runs+1;
  const playerWon=gamePhase==="result"?(aiInn.runs<target&&isOver(aiInn)):null;

  return (
  
    <>
        <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Poppins:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --orange:#FF6200;--gold:#FFD700;--navy:#002147;--green:#1a7a2e;
          --bg:#FDF8F0;--white:#fff;--gray:#6B7280;
        }
        body{background:var(--bg);font-family:'Poppins',sans-serif;color:#1a1a1a}
        .wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:16px 8px 60px;
          background:radial-gradient(ellipse at 10% 0%,rgba(255,98,0,.06) 0%,transparent 50%),
                     radial-gradient(ellipse at 90% 100%,rgba(255,215,0,.08) 0%,transparent 50%),
                     var(--bg)}
        .logo{font-family:'Oswald',sans-serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:700;
          color:var(--navy);letter-spacing:-.02em;text-align:center;margin-bottom:4px}
        .logo span{color:var(--orange)}
        .subtitle{font-size:12px;color:var(--gray);text-align:center;margin-bottom:16px}
        /* Canvas */
        .canvas-wrap{position:relative;border-radius:16px;overflow:hidden;
          box-shadow:0 8px 40px rgba(0,0,0,0.25);max-width:${CW}px;width:100%;
          background:#111;border:3px solid #2a2a2a}
        canvas{display:block;width:100%;height:auto}
        /* Team grid */
        .team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;width:100%;max-width:760px}
        .team-card{border-radius:12px;padding:14px 10px;cursor:pointer;border:2px solid transparent;
          transition:transform .15s,box-shadow .15s;display:flex;flex-direction:column;align-items:center;gap:5px}
        .team-card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(0,0,0,.18)}
        .team-flag{font-size:26px}
        .team-short{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700}
        .team-full{font-size:10px;font-weight:500;text-align:center;opacity:.85;line-height:1.2}
        /* Toss card */
        .toss-card{background:var(--white);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.1);
          padding:32px 28px;max-width:400px;width:100%;display:flex;flex-direction:column;align-items:center;gap:18px}
        .coin{width:90px;height:90px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:36px;border:6px solid var(--gold);background:linear-gradient(135deg,#FFD700,#FF8C00);
          box-shadow:0 4px 18px rgba(255,140,0,.4)}
        .coin.spin{animation:coinSpin 1.3s ease-in-out}
        @keyframes coinSpin{0%{transform:rotateY(0)}50%{transform:rotateY(720deg)}100%{transform:rotateY(0)}}
        .toss-btn{padding:12px 30px;border-radius:99px;background:var(--orange);color:#fff;border:none;
          font-family:'Oswald',sans-serif;font-size:17px;font-weight:600;cursor:pointer;letter-spacing:.05em;
          transition:all .15s}
        .toss-btn:hover{background:#e05600;transform:scale(1.03)}
        .choice-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .choice-btn{padding:11px 24px;border-radius:10px;border:2px solid;font-family:'Oswald',sans-serif;
          font-size:15px;font-weight:600;cursor:pointer;transition:all .15s}
        .choice-btn.bat{background:var(--orange);color:#fff;border-color:var(--orange)}
        .choice-btn.bowl{background:var(--navy);color:#fff;border-color:var(--navy)}
        /* Shot panel */
        .shot-panel{width:100%;max-width:${CW}px;background:var(--white);border-radius:0 0 16px 16px;
          padding:14px 12px 12px;box-shadow:0 4px 16px rgba(0,0,0,.1);
          border:3px solid #2a2a2a;border-top:none}
        .comm-box{font-size:13px;font-weight:500;color:var(--gray);margin-bottom:10px;min-height:18px;
          padding:0 4px;border-left:3px solid var(--orange);padding-left:8px}
        .shot-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
        .shot-btn{padding:10px 4px 8px;border-radius:10px;border:none;cursor:pointer;
          display:flex;flex-direction:column;align-items:center;gap:4px;
          transition:transform .12s,box-shadow .12s;
          box-shadow:0 3px 8px rgba(0,0,0,.15)}
        .shot-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.2)}
        .shot-btn:active:not(:disabled){transform:scale(.96)}
        .shot-btn:disabled{opacity:.38;cursor:not-allowed}
        .shot-icon{font-size:20px}
        .shot-name{font-size:10px;font-weight:700;font-family:'Oswald',sans-serif;letter-spacing:.04em}
        .shot-risk{font-size:9px;opacity:.75}
        /* AI indicator */
        .ai-bar{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;
          font-size:13px;color:var(--gray)}
        .ai-dot{width:8px;height:8px;border-radius:50%;background:var(--orange);animation:pulse 1s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        /* Innings break / result */
        .modal-card{background:var(--white);border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.15);
          padding:36px 28px;max-width:460px;width:100%;text-align:center}
        .big-score{font-family:'Oswald',sans-serif;font-size:52px;font-weight:700;color:var(--orange);line-height:1}
        .target-text{font-family:'Oswald',sans-serif;font-size:22px;font-weight:600;color:var(--navy);margin:10px 0}
        .result-emoji{font-size:64px;margin-bottom:8px}
        .result-title{font-family:'Oswald',sans-serif;font-size:clamp(1.8rem,5vw,2.8rem);font-weight:700;margin-bottom:6px}
        .sc-box{background:#F9FAFB;border-radius:10px;padding:12px 16px;text-align:left;margin:14px 0}
        .sc-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #E5E7EB}
        .sc-row:last-child{border:none}
        .sc-score{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700}
        .play-btn{padding:13px 40px;border-radius:99px;background:var(--orange);color:#fff;border:none;
          font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;cursor:pointer;letter-spacing:.06em;
          box-shadow:0 4px 14px rgba(255,98,0,.35);transition:all .15s;margin-top:8px}
        .play-btn:hover{background:#e05600;transform:scale(1.04)}
        .sec-head{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;
          color:var(--gray);margin-bottom:10px;text-align:center}
        @media(max-width:600px){
          .shot-grid{grid-template-columns:repeat(3,1fr)}
          .shot-btn{padding:9px 4px 7px}
        }
        @media(max-width:400px){.team-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div className="wrap">
        <div className="logo">IPL<span>T20</span></div>
        <p className="subtitle">Full Match Simulation • Stadium View</p>

        {/* ── TEAM SELECT ── */}
        {gamePhase==="select"&&(
          <>
            <p className="sec-head" style={{marginBottom:10}}>Choose Your Team</p>
            <div className="team-grid">
              {TEAMS.map(team=>(
                <div key={team.short} className="team-card"
                  style={{background:team.primary,color:team.text}}
                  onClick={()=>{
                    const others=TEAMS.filter(t=>t.short!==team.short);
                    const ai=others[Math.floor(Math.random()*others.length)];
                    setPlayerTeam(team);setAiTeam(ai);setGamePhase("toss");
                  }}>
                  <span className="team-flag">{team.flag}</span>
                  <span className="team-short" style={{color:team.text}}>{team.short}</span>
                  <span className="team-full" style={{color:team.text}}>{team.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TOSS ── */}
        {gamePhase==="toss"&&playerTeam&&aiTeam&&(
          <div className="toss-card">
            <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
              <div style={{textAlign:"center"}}>
                <div style={{background:playerTeam.primary,color:playerTeam.text,padding:"8px 18px",borderRadius:8,fontFamily:"Oswald",fontSize:18,fontWeight:700}}>{playerTeam.short}</div>
                <div style={{fontSize:11,color:"var(--gray)",marginTop:4}}>You</div>
              </div>
              <div style={{fontFamily:"Oswald",fontSize:20,color:"var(--gray)"}}>vs</div>
              <div style={{textAlign:"center"}}>
                <div style={{background:aiTeam.primary,color:aiTeam.text,padding:"8px 18px",borderRadius:8,fontFamily:"Oswald",fontSize:18,fontWeight:700}}>{aiTeam.short}</div>
                <div style={{fontSize:11,color:"var(--gray)",marginTop:4}}>AI</div>
              </div>
            </div>
            <div className={`coin${tossAnim?" spin":""}`}>🪙</div>
            {tossWon===null?(
              <button className="toss-btn" onClick={handleToss} disabled={tossAnim}>{tossAnim?"Tossing...":"TOSS THE COIN"}</button>
            ):(
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"Oswald",fontSize:20,fontWeight:700,color:tossWon?"var(--green)":"#ef4444",marginBottom:12}}>
                  {tossWon?"🎉 You Won the Toss!":"😬 AI Won the Toss"}
                </div>
                {tossWon?(
                  <>
                    <div style={{fontSize:13,color:"var(--gray)",marginBottom:14}}>Choose to bat or bowl first:</div>
                    <div className="choice-row">
                      <button className="choice-btn bat" onClick={()=>startMatch(true)}>🏏 BAT FIRST</button>
                      <button className="choice-btn bowl" onClick={()=>startMatch(false)}>⚾ BOWL FIRST</button>
                    </div>
                  </>
                ):(
                  <>
                    <div style={{fontSize:13,color:"var(--gray)",marginBottom:14}}>AI chose to bat first. You will chase.</div>
                    <button className="choice-btn bowl" onClick={()=>startMatch(false)}>START MATCH</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MATCH ── */}
        {gamePhase==="match"&&playerTeam&&aiTeam&&(
          <>
            <div className="canvas-wrap">
              <canvas ref={canvasRef} width={CW} height={CH} />
            </div>
            <div className="shot-panel">
              <div className="comm-box">{commentary}</div>
              {playerBatsFirst?(
                <>
                  <div className="shot-grid">
                    {([
                      {id:"defend",    icon:"🛡️",name:"DEFEND",    risk:"Safe",       bg:"#3B82F6",text:"#fff"},
                      {id:"single",    icon:"🏃",name:"SINGLE",    risk:"Rotate",     bg:"#22C55E",text:"#fff"},
                      {id:"drive",     icon:"🎯",name:"DRIVE",     risk:"Timing",     bg:"#F59E0B",text:"#fff"},
                      {id:"pull",      icon:"💪",name:"PULL",      risk:"Short ball", bg:"#FF6200",text:"#fff"},
                      {id:"slog",      icon:"💥",name:"SLOG",      risk:"High risk",  bg:"#EF4444",text:"#fff"},
                      {id:"helicopter",icon:"🚁",name:"HELICO",    risk:"Death shot", bg:"#8B5CF6",text:"#fff"},
                    ] as {id:ShotType;icon:string;name:string;risk:string;bg:string;text:string}[]).map(s=>(
                      <button key={s.id} className="shot-btn"
                        style={{background:s.bg,color:s.text}}
                        onClick={()=>handleShot(s.id)}
                        disabled={!canShoot}>
                        <span className="shot-icon">{s.icon}</span>
                        <span className="shot-name">{s.name}</span>
                        <span className="shot-risk">{s.risk}</span>
                      </button>
                    ))}
                  </div>
                </>
              ):(
                <div className="ai-bar">
                  <div className="ai-dot"/>
                  <span>{aiTeam.short} AI is batting... watch the match!</span>
                </div>
              )}
            </div>
            <div style={{marginTop:10}}>
              <button onClick={reset} style={{padding:"6px 18px",borderRadius:99,background:"#fff",border:"1.5px solid #ddd",fontSize:12,cursor:"pointer",fontFamily:"Poppins"}}>⟳ New Match</button>
            </div>
          </>
        )}

        {/* ── INNINGS BREAK ── */}
        {gamePhase==="innings-break"&&playerTeam&&aiTeam&&(
          <div className="modal-card">
            <div style={{fontSize:13,color:"var(--gray)",marginBottom:6}}>1st Innings Complete</div>
            <div className="big-score">{playerInn.runs}/{playerInn.wickets}</div>
            <div style={{fontSize:13,color:"var(--gray)",marginTop:4}}>{playerTeam.short} · {oversStr(playerInn.legalBalls)} overs</div>
            <div style={{height:1,background:"#e5e7eb",margin:"16px 0"}}/>
            <div className="target-text">{aiTeam.short} need {playerInn.runs+1} to win</div>
            <div style={{fontSize:12,color:"var(--gray)"}}>in 20 overs · 10 wickets in hand</div>
            <div style={{height:20}}/>
            <button className="play-btn" onClick={()=>{
              setGamePhase("match");setPlayerBatsFirst(false);
              setCanShoot(false);anim.current.phase="idle";
              standsCanvas.current=null;
            }}>START AI INNINGS</button>
            <div style={{marginTop:10}}>
              <button onClick={reset} style={{fontSize:12,color:"var(--gray)",background:"none",border:"none",cursor:"pointer"}}>New Match</button>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {gamePhase==="result"&&playerTeam&&aiTeam&&(
          <div className="modal-card">
            <div className="result-emoji">{playerWon?"🏆":"😤"}</div>
            <div className="result-title" style={{color:playerWon?"var(--green)":"#ef4444"}}>
              {playerWon?`${playerTeam.short} Wins!`:`${aiTeam.short} Wins!`}
            </div>
            <div style={{fontSize:13,color:"var(--gray)",marginBottom:4}}>
              {playerWon?`You defended ${playerInn.runs} runs!`:`AI chased down ${target} runs!`}
            </div>
            <div className="sc-box">
              <div className="sc-row">
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{playerTeam.short} <span style={{fontSize:10,color:"var(--gray)"}}>1st Inn</span></div>
                  <div style={{fontSize:11,color:"var(--gray)"}}>{oversStr(playerInn.legalBalls)} ov · Extras: {playerInn.extras}</div>
                </div>
                <div className="sc-score" style={{color:playerTeam.primary}}>{playerInn.runs}/{playerInn.wickets}</div>
              </div>
              <div className="sc-row">
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{aiTeam.short} <span style={{fontSize:10,color:"var(--gray)"}}>2nd Inn</span></div>
                  <div style={{fontSize:11,color:"var(--gray)"}}>{oversStr(aiInn.legalBalls)} ov · Extras: {aiInn.extras}</div>
                </div>
                <div className="sc-score" style={{color:aiTeam.primary}}>{aiInn.runs}/{aiInn.wickets}</div>
              </div>
            </div>
            <button className="play-btn" onClick={reset}>PLAY AGAIN</button>
          </div>
        )}
      </div>
    </>
  );
}
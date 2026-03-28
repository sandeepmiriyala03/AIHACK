"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
// ─── Types ────────────────────────────────────────────────────────────────────
type ShotType = "defend" | "single" | "drive" | "pull" | "slog" | "helicopter";
type DeliveryType = "full" | "short" | "yorker" | "bouncer" | "slower" | "spin";
type BallOutcome = 0 | 1 | 2 | 3 | 4 | 6 | "W" | "Wd" | "Nb";

interface BallEvent {
  shot?: ShotType;
  delivery: DeliveryType;
  outcome: BallOutcome;
  commentary: string;
  isWicket: boolean;
  isExtra: boolean;
  overNum: number;
  ballInOver: number;
}

interface InningsData {
  runs: number;
  wickets: number;
  legalBalls: number;
  extras: number;
  events: BallEvent[];
}

interface IPLTeam {
  name: string;
  short: string;
  primary: string;
  secondary: string;
  textOnPrimary: string;
  flag: string;
}

type GamePhase = "select" | "toss" | "player-bat" | "innings-break" | "ai-bat" | "result";

interface GameState {
  phase: GamePhase;
  playerTeam: IPLTeam | null;
  aiTeam: IPLTeam | null;
  playerBatsFirst: boolean;
  playerInnings: InningsData;
  aiInnings: InningsData;
  lastEvent: BallEvent | null;
  isAnimating: boolean;
  tossWon: boolean | null;
  showShotFeedback: string | null;
}

// ─── Teams ────────────────────────────────────────────────────────────────────
const TEAMS: IPLTeam[] = [
  { name: "Chennai Super Kings",        short: "CSK",  primary: "#F7B731", secondary: "#1A3A5C", textOnPrimary: "#1A3A5C", flag: "🦁" },
  { name: "Mumbai Indians",             short: "MI",   primary: "#004C93", secondary: "#D4AF37", textOnPrimary: "#FFFFFF", flag: "🔵" },
  { name: "Royal Challengers Bengaluru",short: "RCB",  primary: "#D01C1F", secondary: "#2C2C2C", textOnPrimary: "#FFFFFF", flag: "🔴" },
  { name: "Kolkata Knight Riders",      short: "KKR",  primary: "#3A225D", secondary: "#DDB84C", textOnPrimary: "#FFFFFF", flag: "⚡" },
  { name: "Sunrisers Hyderabad",        short: "SRH",  primary: "#F26522", secondary: "#000000", textOnPrimary: "#FFFFFF", flag: "🌅" },
  { name: "Rajasthan Royals",           short: "RR",   primary: "#E54096", secondary: "#1B2B74", textOnPrimary: "#FFFFFF", flag: "👑" },
  { name: "Delhi Capitals",             short: "DC",   primary: "#0078BC", secondary: "#D71920", textOnPrimary: "#FFFFFF", flag: "🦅" },
  { name: "Punjab Kings",               short: "PBKS", primary: "#D71920", secondary: "#B4975A", textOnPrimary: "#FFFFFF", flag: "🦁" },
];

// ─── Outcome Matrix ───────────────────────────────────────────────────────────
type OW = { W: number; 0: number; 1: number; 2: number; 4: number; 6: number };

const MATRIX: Record<ShotType, Record<DeliveryType, OW>> = {
  defend:     { full:{W:3,0:75,1:18,2:4,4:0,6:0},  short:{W:2,0:70,1:20,2:8,4:0,6:0},  yorker:{W:4,0:72,1:18,2:6,4:0,6:0},  bouncer:{W:8,0:62,1:20,2:10,4:0,6:0}, slower:{W:3,0:68,1:22,2:7,4:0,6:0},  spin:{W:4,0:65,1:22,2:9,4:0,6:0}  },
  single:     { full:{W:5,0:8,1:72,2:12,4:3,6:0},  short:{W:4,0:5,1:75,2:14,4:2,6:0},  yorker:{W:6,0:15,1:65,2:12,4:2,6:0}, bouncer:{W:5,0:10,1:68,2:15,4:2,6:0},slower:{W:4,0:8,1:72,2:14,4:2,6:0},  spin:{W:5,0:8,1:70,2:14,4:3,6:0}  },
  drive:      { full:{W:15,0:5,1:10,2:10,4:45,6:15},short:{W:28,0:10,1:15,2:20,4:25,6:2},yorker:{W:40,0:25,1:18,2:12,4:5,6:0}, bouncer:{W:30,0:15,1:15,2:15,4:20,6:5},slower:{W:22,0:10,1:15,2:10,4:30,6:13},spin:{W:18,0:8,1:12,2:10,4:38,6:14}},
  pull:       { full:{W:22,0:10,1:18,2:12,4:28,6:10},short:{W:8,0:3,1:8,2:11,4:35,6:35},yorker:{W:35,0:28,1:18,2:12,4:5,6:2},  bouncer:{W:12,0:4,1:8,2:10,4:33,6:33}, slower:{W:18,0:8,1:14,2:12,4:30,6:18}, spin:{W:20,0:8,1:12,2:12,4:28,6:20}},
  slog:       { full:{W:28,0:5,1:5,2:5,4:25,6:32}, short:{W:22,0:4,1:4,2:5,4:23,6:42}, yorker:{W:48,0:18,1:8,2:5,4:8,6:13},  bouncer:{W:38,0:8,1:4,2:4,4:18,6:28},  slower:{W:32,0:8,1:4,2:4,4:20,6:32},  spin:{W:28,0:7,1:5,2:5,4:23,6:32} },
  helicopter: { full:{W:18,0:5,1:8,2:10,4:28,6:31},short:{W:28,0:8,1:8,2:10,4:20,6:26},yorker:{W:15,0:8,1:12,2:15,4:25,6:25}, bouncer:{W:32,0:10,1:8,2:10,4:18,6:22}, slower:{W:22,0:8,1:8,2:10,4:22,6:30},  spin:{W:22,0:8,1:8,2:10,4:22,6:30} },
};

// ─── Commentary ───────────────────────────────────────────────────────────────
const COMM: Record<string, string[]> = {
  W:  ["WICKET! Caught at the boundary!","BOWLED! Stumps cartwheeling!","OUT! Edge to the keeper!","LBW! Plumb in front!","CAUGHT! Brilliant catch!","OUT! Top-edge swirling to fine leg!"],
  "0":["Dot ball. Well defended.","Beaten outside off!","Good delivery, no run.","Played and missed!","Tight line, no room to score."],
  "1":["Quick single taken.","Pushed for one.","Worked to leg, single.","Dabbed to third man, one run."],
  "2":["Two runs! Good running!","Driven for two.","Two more added to total!"],
  "4":["FOUR! Cracking shot!","FOUR! Racing to the boundary!","FOUR! Through the covers!","BOUNDARY! Down to fine leg!","FOUR! Slashed over point!"],
  "6":["SIX! Massive hit!","SIX! Over long-on!","SIX! Gone into the stands!","MAXIMUM! Huge six!","SIX! The crowd goes wild!"],
  Wd: ["Wide ball! Extra run.","Down leg, called wide.","Wide outside off!"],
  Nb: ["No ball! Front foot no ball! Extra run.","Front foot no ball! Extra run."],
};
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
const getComm = (o: BallOutcome) => pick(COMM[o === "W" ? "W" : o === "Wd" ? "Wd" : o === "Nb" ? "Nb" : String(o)] || COMM["0"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function wPick<T>(items: T[], w: number[]): T {
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

function rollOutcome(shot: ShotType, del: DeliveryType): BallOutcome {
  const wts = MATRIX[shot][del];
  const entries = Object.entries(wts) as [string, number][];
  const total = entries.reduce((a, [, v]) => a + v, 0);
  let r = Math.random() * total;
  for (const [k, v] of entries) { r -= v; if (r <= 0) return (k === "W" ? "W" : Number(k)) as BallOutcome; }
  return 0;
}

function pickDelivery(innings: InningsData): DeliveryType {
  const over = Math.floor(innings.legalBalls / 6);
  const dels: DeliveryType[] = ["full","short","yorker","bouncer","slower","spin"];
  if (over >= 16) return wPick(dels, [10,5,35,10,25,15]);
  if (over < 6)   return wPick(dels, [30,20,10,15,10,15]);
  return wPick(dels, [20,15,15,15,15,20]);
}

function pickAIShot(innings: InningsData, target: number): ShotType {
  const ballsLeft = 120 - innings.legalBalls;
  const runsNeeded = target - innings.runs;
  const rrr = ballsLeft > 0 ? (runsNeeded / ballsLeft) * 6 : 999;
  const shots: ShotType[] = ["defend","single","drive","pull","slog","helicopter"];
  if (innings.wickets >= 8)  return wPick(shots, [20,30,20,15,10,5]);
  if (rrr > 14) return wPick(shots, [2,5,15,15,35,28]);
  if (rrr > 10) return wPick(shots, [5,10,20,20,25,20]);
  if (rrr > 7)  return wPick(shots, [10,20,25,22,13,10]);
  return wPick(shots, [15,30,28,18,5,4]);
}

function checkExtra(): "Wd" | "Nb" | null {
  const r = Math.random();
  if (r < 0.04) return "Wd";
  if (r < 0.065) return "Nb";
  return null;
}

function isOver(inn: InningsData): boolean {
  return inn.wickets >= 10 || inn.legalBalls >= 120;
}

function oversStr(lb: number): string {
  return `${Math.floor(lb / 6)}.${lb % 6}`;
}

function emptyInnings(): InningsData {
  return { runs: 0, wickets: 0, legalBalls: 0, extras: 0, events: [] };
}

function processBall(inn: InningsData, shot: ShotType, del: DeliveryType): { newInn: InningsData; event: BallEvent } {
  const extra = checkExtra();
  const overNum = Math.floor(inn.legalBalls / 6);
  const ballInOver = inn.legalBalls % 6;

  if (extra) {
    const event: BallEvent = { shot, delivery: del, outcome: extra, commentary: getComm(extra), isWicket: false, isExtra: true, overNum, ballInOver };
    return { newInn: { ...inn, runs: inn.runs + 1, extras: inn.extras + 1, events: [...inn.events, event] }, event };
  }

  const outcome = rollOutcome(shot, del);
  const isWicket = outcome === "W";
  const runs = isWicket ? 0 : (outcome as number);
  const event: BallEvent = { shot, delivery: del, outcome, commentary: getComm(outcome), isWicket, isExtra: false, overNum, ballInOver };
  return {
    newInn: {
      runs: inn.runs + runs,
      wickets: inn.wickets + (isWicket ? 1 : 0),
      legalBalls: inn.legalBalls + 1,
      extras: inn.extras,
      events: [...inn.events, event],
    },
    event,
  };
}

function initialState(): GameState {
  return {
    phase: "select", playerTeam: null, aiTeam: null,
    playerBatsFirst: true, playerInnings: emptyInnings(), aiInnings: emptyInnings(),
    lastEvent: null, isAnimating: false, tossWon: null, showShotFeedback: null,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function IPLCricketGame() {
  const [state, setState] = useState<GameState>(initialState);
  const [tossAnim, setTossAnim] = useState(false);

  // AI bat loop
  useEffect(() => {
    if (state.phase !== "ai-bat" || state.isAnimating) return;
    if (isOver(state.aiInnings)) {
      setState(s => ({ ...s, phase: "result" }));
      return;
    }
    const target = state.playerInnings.runs + 1;
    const timer = setTimeout(() => {
      const del = pickDelivery(state.aiInnings);
      const shot = pickAIShot(state.aiInnings, target);
      const { newInn, event } = processBall(state.aiInnings, shot, del);
      const won = newInn.runs >= target;
      setState(s => ({
        ...s,
        aiInnings: newInn,
        lastEvent: event,
        isAnimating: true,
        phase: (isOver(newInn) || won) ? "result" : "ai-bat",
      }));
    }, 800);
    return () => clearTimeout(timer);
  }, [state.phase, state.aiInnings, state.isAnimating, state.playerInnings.runs]);

  useEffect(() => {
    if (state.isAnimating) {
      const t = setTimeout(() => setState(s => ({ ...s, isAnimating: false })), 600);
      return () => clearTimeout(t);
    }
  }, [state.isAnimating]);

  const handleTeamSelect = (team: IPLTeam) => {
    const others = TEAMS.filter(t => t.short !== team.short);
    const aiTeam = others[Math.floor(Math.random() * others.length)];
    setState(s => ({ ...s, playerTeam: team, aiTeam, phase: "toss" }));
  };

  const handleToss = () => {
    setTossAnim(true);
    setTimeout(() => {
      const won = Math.random() > 0.5;
      setState(s => ({ ...s, tossWon: won }));
      setTossAnim(false);
    }, 1200);
  };

  const handleBatChoice = (batFirst: boolean) => {
    setState(s => ({ ...s, playerBatsFirst: batFirst, phase: batFirst ? "player-bat" : "ai-bat" }));
  };

  const handleShot = useCallback((shot: ShotType) => {
    if (state.phase !== "player-bat" || state.isAnimating) return;
    if (isOver(state.playerInnings)) return;
    const del = pickDelivery(state.playerInnings);
    const { newInn, event } = processBall(state.playerInnings, shot, del);
    const labels: Record<ShotType, string> = {
      defend: "🛡️ Defended!", single: "🏃 Single!", drive: "🎯 Drive!",
      pull: "💪 Pull!", slog: "💥 Slog!", helicopter: "🚁 Helicopter!"
    };
    setState(s => ({
      ...s,
      playerInnings: newInn,
      lastEvent: event,
      isAnimating: true,
      showShotFeedback: labels[shot],
      phase: isOver(newInn) ? "innings-break" : "player-bat",
    }));
    setTimeout(() => setState(s => ({ ...s, showShotFeedback: null })), 900);
  }, [state]);

  const reset = () => { setState(initialState()); setTossAnim(false); };

  const pt = state.playerTeam;
  const at = state.aiTeam;

  // ─── Score info ─────────────────────────────────────────────────────────────
  const pInn = state.playerInnings;
  const aInn = state.aiInnings;
  const target = pInn.runs + 1;
  const needed = target - aInn.runs;
  const ballsLeft = 120 - aInn.legalBalls;

  // Current over balls (for dot/run display)
  const currentOverEventsP = pInn.events.filter(e => e.overNum === Math.floor(pInn.legalBalls / 6) && !e.isExtra);
  const currentOverEventsA = aInn.events.filter(e => e.overNum === Math.floor(aInn.legalBalls / 6) && !e.isExtra);

  function ballColor(o: BallOutcome): string {
    if (o === "W") return "#ef4444";
    if (o === 6) return "#8b5cf6";
    if (o === 4) return "#3b82f6";
    if (o === "Wd" || o === "Nb") return "#f59e0b";
    if (o === 0) return "#9ca3af";
    return "#22c55e";
  }
  function ballLabel(o: BallOutcome): string {
    if (o === "Wd") return "Wd";
    if (o === "Nb") return "Nb";
    return String(o);
  }

  // Result calculation
  const playerWon = (() => {
    if (state.phase !== "result") return null;
    if (aInn.runs >= target) return false;
    if (isOver(aInn) && aInn.runs < target) return true;
    return null;
  })();
  const tie = playerWon === null && state.phase === "result" && aInn.runs === pInn.runs;

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Poppins:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --ipl-orange:#FF6200;--ipl-gold:#FFD700;--ipl-green:#1a7a2e;
          --ipl-navy:#002147;--bg:#FFF8F0;--white:#FFFFFF;
          --gray-50:#F9FAFB;--gray-100:#F3F4F6;--gray-200:#E5E7EB;--gray-400:#9CA3AF;--gray-700:#374151;
          --radius:14px;--shadow:0 2px 16px rgba(0,0,0,0.10);
        }
        body{background:var(--bg);font-family:'Poppins',sans-serif;color:var(--gray-700)}

        .cg-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px 12px 80px;
          background:var(--bg);
          background-image:
            radial-gradient(ellipse at 10% 0%,rgba(255,98,0,.07) 0%,transparent 50%),
            radial-gradient(ellipse at 90% 100%,rgba(255,215,0,.09) 0%,transparent 50%);
        }

        /* Header */
        .cg-header{text-align:center;margin-bottom:20px}
        .cg-title{font-family:'Oswald',sans-serif;font-size:clamp(2rem,5vw,3rem);font-weight:700;
          color:var(--ipl-navy);letter-spacing:-.02em;line-height:1}
        .cg-title span{color:var(--ipl-orange)}
        .cg-subtitle{font-size:13px;color:var(--gray-400);margin-top:4px}

        /* Card */
        .card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px}

        /* Team select grid */
        .team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;width:100%;max-width:780px;margin-top:8px}
        .team-card{border-radius:12px;padding:16px 12px;cursor:pointer;border:2px solid transparent;
          transition:transform .15s,box-shadow .15s;display:flex;flex-direction:column;align-items:center;gap:6px;
          position:relative;overflow:hidden}
        .team-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.15)}
        .team-card .team-flag{font-size:28px}
        .team-card .team-short{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700}
        .team-card .team-name{font-size:11px;font-weight:500;text-align:center;opacity:.85}

        /* Toss */
        .toss-wrap{display:flex;flex-direction:column;align-items:center;gap:20px;padding:40px 20px;max-width:400px;width:100%}
        .coin{width:100px;height:100px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:40px;border:6px solid var(--ipl-gold);background:linear-gradient(135deg,#FFD700,#FF8C00);
          box-shadow:0 4px 20px rgba(255,140,0,.4)}
        .coin.spin{animation:coinSpin 1.2s ease-in-out}
        @keyframes coinSpin{0%{transform:rotateY(0)}50%{transform:rotateY(720deg)}100%{transform:rotateY(0)}}
        .toss-btn{padding:12px 32px;border-radius:99px;background:var(--ipl-orange);color:#fff;border:none;
          font-family:'Oswald',sans-serif;font-size:18px;font-weight:600;cursor:pointer;letter-spacing:.05em;
          transition:background .15s,transform .1s}
        .toss-btn:hover{background:#e05600;transform:scale(1.03)}

        /* Choice buttons */
        .choice-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
        .choice-btn{padding:12px 28px;border-radius:10px;border:2px solid;font-family:'Oswald',sans-serif;
          font-size:16px;font-weight:600;cursor:pointer;transition:all .15s;letter-spacing:.04em}
        .choice-btn.bat{background:var(--ipl-orange);color:#fff;border-color:var(--ipl-orange)}
        .choice-btn.bowl{background:var(--ipl-navy);color:#fff;border-color:var(--ipl-navy)}
        .choice-btn:hover{opacity:.88;transform:scale(1.03)}

        /* Scoreboard */
        .scoreboard{display:flex;gap:12px;align-items:stretch;width:100%;max-width:760px;margin-bottom:12px;flex-wrap:wrap}
        .score-main{flex:1;min-width:200px;background:var(--ipl-navy);border-radius:14px;padding:16px 20px;color:#fff;
          display:flex;flex-direction:column;gap:4px}
        .score-runs{font-family:'Oswald',sans-serif;font-size:clamp(2.2rem,6vw,3rem);font-weight:700;line-height:1;color:var(--ipl-gold)}
        .score-overs{font-size:14px;opacity:.8}
        .score-side{display:flex;flex-direction:column;gap:8px;min-width:140px}
        .info-box{background:var(--white);border-radius:10px;padding:10px 14px;box-shadow:var(--shadow);flex:1;
          display:flex;flex-direction:column;gap:2px}
        .info-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--gray-400)}
        .info-val{font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:var(--ipl-navy);line-height:1.1}

        /* Over display */
        .over-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:var(--white);border-radius:10px;
          padding:10px 14px;box-shadow:var(--shadow);width:100%;max-width:760px;margin-bottom:12px}
        .over-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--gray-400);margin-right:4px}
        .ball-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-family:'Oswald',sans-serif;font-size:13px;font-weight:700;color:#fff}

        /* Shot buttons */
        .shot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;max-width:500px}
        .shot-btn{padding:14px 8px;border-radius:12px;border:none;cursor:pointer;display:flex;flex-direction:column;
          align-items:center;gap:5px;transition:transform .12s,box-shadow .12s;font-family:'Poppins',sans-serif;
          box-shadow:0 3px 10px rgba(0,0,0,.12)}
        .shot-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.18)}
        .shot-btn:active:not(:disabled){transform:translateY(0) scale(.97)}
        .shot-btn:disabled{opacity:.45;cursor:not-allowed}
        .shot-icon{font-size:24px}
        .shot-name{font-size:12px;font-weight:600;line-height:1}
        .shot-sub{font-size:10px;opacity:.75}

        /* Commentary */
        .commentary{width:100%;max-width:760px;background:var(--white);border-radius:12px;
          box-shadow:var(--shadow);padding:12px 16px;border-left:4px solid var(--ipl-orange);margin-bottom:12px;
          min-height:52px}
        .comm-ball{font-size:11px;color:var(--gray-400);margin-bottom:2px}
        .comm-text{font-size:14px;font-weight:500;color:var(--gray-700)}

        /* Feedback flash */
        .shot-feedback{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
          background:rgba(0,0,0,.75);color:#fff;padding:16px 32px;border-radius:16px;
          font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;pointer-events:none;
          animation:feedbackPop .9s ease forwards;z-index:100}
        @keyframes feedbackPop{0%{opacity:0;transform:translate(-50%,-60%) scale(.8)}
          20%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}
          70%{opacity:1;transform:translate(-50%,-50%) scale(1)}
          100%{opacity:0;transform:translate(-50%,-40%) scale(.95)}}

        /* Target banner */
        .target-banner{width:100%;max-width:760px;border-radius:12px;padding:12px 18px;margin-bottom:12px;
          display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
        .crr-box{font-size:12px;font-weight:500}

        /* Innings break */
        .break-card{text-align:center;max-width:440px;width:100%;padding:36px 24px}
        .break-score{font-family:'Oswald',sans-serif;font-size:48px;font-weight:700;color:var(--ipl-orange);line-height:1}
        .break-target{font-family:'Oswald',sans-serif;font-size:22px;font-weight:600;color:var(--ipl-navy);margin:8px 0}
        .break-sub{font-size:13px;color:var(--gray-400)}

        /* Result */
        .result-card{text-align:center;max-width:500px;width:100%;padding:40px 28px}
        .result-emoji{font-size:64px;line-height:1;margin-bottom:8px}
        .result-title{font-family:'Oswald',sans-serif;font-size:clamp(1.8rem,5vw,2.8rem);font-weight:700;margin-bottom:4px}
        .result-sub{font-size:14px;color:var(--gray-400);margin-bottom:20px}
        .scorecard{background:var(--gray-50);border-radius:10px;padding:14px;text-align:left;margin-bottom:20px}
        .sc-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;
          border-bottom:1px solid var(--gray-200)}
        .sc-row:last-child{border-bottom:none}
        .sc-team{font-size:13px;font-weight:600}
        .sc-score{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700}

        /* Play again */
        .play-btn{padding:13px 40px;border-radius:99px;background:var(--ipl-orange);color:#fff;border:none;
          font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;cursor:pointer;letter-spacing:.06em;
          transition:background .15s,transform .1s;box-shadow:0 4px 14px rgba(255,98,0,.35)}
        .play-btn:hover{background:#e05600;transform:scale(1.04)}

        /* AI indicator */
        .ai-thinking{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--gray-400);
          background:var(--white);padding:8px 14px;border-radius:99px;box-shadow:var(--shadow)}
        .ai-dot{width:8px;height:8px;border-radius:50%;background:var(--ipl-orange);
          animation:pulse 1s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

        /* Section heading */
        .section-head{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;
          color:var(--gray-400);margin-bottom:10px;text-align:center}

        /* Nav bar top */
        .top-nav{width:100%;max-width:760px;display:flex;justify-content:space-between;align-items:center;
          margin-bottom:18px;flex-wrap:wrap;gap:8px}
        .nav-team-pill{padding:6px 14px;border-radius:99px;font-size:13px;font-weight:600;
          font-family:'Oswald',sans-serif;letter-spacing:.05em}
        .nav-btn{padding:7px 16px;border-radius:8px;background:var(--white);color:var(--gray-700);
          border:1.5px solid var(--gray-200);font-size:12px;font-weight:600;cursor:pointer;
          transition:all .12s;font-family:'Poppins',sans-serif}
        .nav-btn:hover{background:var(--gray-100);border-color:var(--gray-400)}

        @media(max-width:600px){
          .shot-grid{grid-template-columns:repeat(3,1fr)}
          .shot-btn{padding:10px 4px}
          .shot-icon{font-size:20px}
          .score-runs{font-size:2rem}
        }
      `}</style>

      <div className="cg-wrap">
        <div className="cg-header">
          <h1 className="cg-title">IPL<span>T20</span></h1>
          <p className="cg-subtitle">India Premier League Cricket Simulator</p>
        </div>

        {/* ── TEAM SELECT ── */}
        {state.phase === "select" && (
          <>
            <p className="section-head">Choose Your Team</p>
            <div className="team-grid">
              {TEAMS.map(team => (
                <div
                  key={team.short}
                  className="team-card"
                  style={{ background: team.primary, color: team.textOnPrimary }}
                  onClick={() => handleTeamSelect(team)}
                >
                  <span className="team-flag">{team.flag}</span>
                  <span className="team-short" style={{ color: team.textOnPrimary }}>{team.short}</span>
                  <span className="team-name" style={{ color: team.textOnPrimary }}>{team.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TOSS ── */}
        {state.phase === "toss" && pt && at && (
          <div className="toss-wrap card">
            <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ background: pt.primary, color: pt.textOnPrimary, padding: "10px 20px", borderRadius: 10, fontFamily: "Oswald", fontSize: 20, fontWeight: 700 }}>{pt.short}</div>
                <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>You</div>
              </div>
              <div style={{ fontSize: 22, color: "var(--gray-400)" }}>vs</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ background: at.primary, color: at.textOnPrimary, padding: "10px 20px", borderRadius: 10, fontFamily: "Oswald", fontSize: 20, fontWeight: 700 }}>{at.short}</div>
                <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>AI</div>
              </div>
            </div>
            <div className={`coin ${tossAnim ? "spin" : ""}`}>🪙</div>
            {state.tossWon === null ? (
              <button className="toss-btn" onClick={handleToss} disabled={tossAnim}>
                {tossAnim ? "Tossing..." : "TOSS THE COIN"}
              </button>
            ) : (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Oswald", fontSize: 22, fontWeight: 700, color: state.tossWon ? "var(--ipl-green)" : "#ef4444" }}>
                    {state.tossWon ? "🎉 You Won the Toss!" : "😬 AI Won the Toss"}
                  </div>
                  {state.tossWon ? (
                    <>
                      <div style={{ fontSize: 14, color: "var(--gray-400)", margin: "8px 0 16px" }}>Choose to bat or bowl first:</div>
                      <div className="choice-row">
                        <button className="choice-btn bat" onClick={() => handleBatChoice(true)}>🏏 BAT FIRST</button>
                        <button className="choice-btn bowl" onClick={() => handleBatChoice(false)}>⚾ BOWL FIRST</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: "var(--gray-400)", margin: "8px 0 16px" }}>AI chose to bat first. You will chase.</div>
                      <button className="choice-btn bowl" onClick={() => handleBatChoice(false)}>START MATCH</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PLAYER BATTING ── */}
        {state.phase === "player-bat" && pt && at && (
          <>
            <div className="top-nav">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="nav-team-pill" style={{ background: pt.primary, color: pt.textOnPrimary }}>{pt.short}</span>
                <span style={{ fontSize: 12, color: "var(--gray-400)" }}>vs</span>
                <span className="nav-team-pill" style={{ background: at.primary, color: at.textOnPrimary }}>{at.short}</span>
              </div>
              <button className="nav-btn" onClick={reset}>⟳ New Game</button>
            </div>

            {/* Scoreboard */}
            <div className="scoreboard">
              <div className="score-main">
                <div style={{ fontSize: 12, opacity: .7, letterSpacing: ".1em", textTransform: "uppercase" }}>{pt.short} Innings</div>
                <div className="score-runs">{pInn.runs}/{pInn.wickets}</div>
                <div className="score-overs">Overs: {oversStr(pInn.legalBalls)} / 20.0</div>
              </div>
              <div className="score-side">
                <div className="info-box">
                  <div className="info-label">Run Rate</div>
                  <div className="info-val">{pInn.legalBalls > 0 ? ((pInn.runs / pInn.legalBalls) * 6).toFixed(1) : "0.0"}</div>
                </div>
                <div className="info-box">
                  <div className="info-label">Wickets Left</div>
                  <div className="info-val">{10 - pInn.wickets}</div>
                </div>
              </div>
            </div>

            {/* Current over balls */}
            <div className="over-row">
              <span className="over-label">This Over</span>
              {currentOverEventsP.length === 0 && <span style={{ fontSize: 12, color: "var(--gray-400)" }}>No balls yet</span>}
              {currentOverEventsP.map((e, i) => (
                <div key={i} className="ball-dot" style={{ background: ballColor(e.outcome) }}>{ballLabel(e.outcome)}</div>
              ))}
            </div>

            {/* Commentary */}
            <div className="commentary">
              {state.lastEvent ? (
                <>
                  <div className="comm-ball">Ball {pInn.legalBalls}/{120} · {state.lastEvent.delivery} delivery</div>
                  <div className="comm-text">{state.lastEvent.commentary}</div>
                </>
              ) : (
                <div className="comm-text" style={{ color: "var(--gray-400)" }}>Play your first shot — choose wisely!</div>
              )}
            </div>

            {/* Shot buttons */}
            <p className="section-head">Select Your Shot</p>
            <div className="shot-grid">
              {([
                { id: "defend",     icon: "🛡️", name: "Defend",      sub: "Safe & Solid",  bg: "#3B82F6", text: "#fff" },
                { id: "single",     icon: "🏃", name: "Single",      sub: "Rotate Strike", bg: "#22C55E", text: "#fff" },
                { id: "drive",      icon: "🎯", name: "Drive",        sub: "Timing Shot",   bg: "#F59E0B", text: "#fff" },
                { id: "pull",       icon: "💪", name: "Pull",         sub: "Short Ball",    bg: "#FF6200", text: "#fff" },
                { id: "slog",       icon: "💥", name: "Slog",         sub: "High Risk",     bg: "#EF4444", text: "#fff" },
                { id: "helicopter", icon: "🚁", name: "Helicopter",   sub: "Death Special", bg: "#8B5CF6", text: "#fff" },
              ] as { id: ShotType; icon: string; name: string; sub: string; bg: string; text: string }[]).map(s => (
                <button
                  key={s.id}
                  className="shot-btn"
                  style={{ background: s.bg, color: s.text }}
                  onClick={() => handleShot(s.id)}
                  disabled={state.isAnimating || isOver(pInn)}
                >
                  <span className="shot-icon">{s.icon}</span>
                  <span className="shot-name">{s.name}</span>
                  <span className="shot-sub">{s.sub}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── INNINGS BREAK ── */}
        {state.phase === "innings-break" && pt && at && (
          <div className="card break-card">
            <div style={{ fontSize: 14, color: "var(--gray-400)", marginBottom: 8 }}>1st Innings Complete</div>
            <div className="break-score">{pInn.runs}/{pInn.wickets}</div>
            <div style={{ fontSize: 14, color: "var(--gray-400)", margin: "4px 0" }}>
              {pt.short} · {oversStr(pInn.legalBalls)} overs
            </div>
            <div style={{ height: 1, background: "var(--gray-200)", margin: "16px 0" }} />
            <div className="break-target">{at.short} need {pInn.runs + 1} to win</div>
            <div className="break-sub">in 20 overs · {10} wickets in hand</div>
            <div style={{ height: 20 }} />
            <button
              className="play-btn"
              onClick={() => setState(s => ({ ...s, phase: "ai-bat", aiInnings: emptyInnings(), lastEvent: null }))}
            >
              START AI INNINGS
            </button>
          </div>
        )}

        {/* ── AI BATTING ── */}
        {state.phase === "ai-bat" && pt && at && (
          <>
            <div className="top-nav">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="nav-team-pill" style={{ background: at.primary, color: at.textOnPrimary }}>{at.short} Batting</span>
                <span style={{ fontSize: 12, color: "var(--gray-400)" }}>Target: {target}</span>
              </div>
              <button className="nav-btn" onClick={reset}>⟳ New Game</button>
            </div>

            {/* Target banner */}
            <div className="target-banner" style={{
              background: needed <= 0 ? "#dcfce7" : aInn.wickets >= 8 ? "#fef2f2" : "#fff7ed",
              border: `1.5px solid ${needed <= 0 ? "#86efac" : aInn.wickets >= 8 ? "#fca5a5" : "#fdba74"}`
            }}>
              <div>
                <div style={{ fontFamily: "Oswald", fontSize: 22, fontWeight: 700, color: "var(--ipl-navy)" }}>
                  Need {Math.max(0, needed)} off {ballsLeft} balls
                </div>
                <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 2 }}>
                  RRR: {ballsLeft > 0 ? ((needed / ballsLeft) * 6).toFixed(2) : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, color: at.primary }}>{aInn.runs}/{aInn.wickets}</div>
                <div style={{ fontSize: 12, color: "var(--gray-400)" }}>{oversStr(aInn.legalBalls)} overs</div>
              </div>
            </div>

            {/* Current over balls */}
            <div className="over-row">
              <span className="over-label">This Over</span>
              {currentOverEventsA.length === 0 && <span style={{ fontSize: 12, color: "var(--gray-400)" }}>No balls yet</span>}
              {currentOverEventsA.map((e, i) => (
                <div key={i} className="ball-dot" style={{ background: ballColor(e.outcome) }}>{ballLabel(e.outcome)}</div>
              ))}
            </div>

            {/* Commentary */}
            <div className="commentary">
              {state.lastEvent ? (
                <>
                  <div className="comm-ball">Ball {aInn.legalBalls}/{120} · {state.lastEvent.delivery} · shot: {state.lastEvent.shot}</div>
                  <div className="comm-text">{state.lastEvent.commentary}</div>
                </>
              ) : (
                <div className="comm-text" style={{ color: "var(--gray-400)" }}>AI innings is about to begin...</div>
              )}
            </div>

            <div className="ai-thinking">
              <div className="ai-dot" />
              <span>{at.short} AI is {state.isAnimating ? "playing..." : "thinking..."}</span>
            </div>

            {/* Your innings ref */}
            <div style={{ marginTop: 16, background: "var(--white)", borderRadius: 10, padding: "10px 16px", boxShadow: "var(--shadow)", width: "100%", maxWidth: 760, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--gray-400)" }}>{pt.short} scored</span>
              <span style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, color: "var(--ipl-navy)" }}>{pInn.runs}/{pInn.wickets} ({oversStr(pInn.legalBalls)} ov)</span>
            </div>
          </>
        )}

        {/* ── RESULT ── */}
        {state.phase === "result" && pt && at && (
          <div className="card result-card">
            <div className="result-emoji">{tie ? "🤝" : playerWon ? "🏆" : "😤"}</div>
            <div className="result-title" style={{ color: tie ? "var(--ipl-navy)" : playerWon ? "var(--ipl-green)" : "#ef4444" }}>
              {tie ? "It's a Tie!" : playerWon ? `${pt.short} Wins!` : `${at.short} Wins!`}
            </div>
            <div className="result-sub">
              {tie && "Both teams scored the same. Super Over needed!"}
              {playerWon && `${pt.short} defended their total of ${pInn.runs}`}
              {!tie && !playerWon && `${at.short} chased down the target of ${target} ${aInn.wickets < 10 ? `with ${10 - aInn.wickets} wickets to spare` : "off the last ball!"}`}
            </div>
            <div className="scorecard">
              <div className="sc-row">
                <div>
                  <div className="sc-team">{pt.short} (1st Innings)</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{oversStr(pInn.legalBalls)} overs · Extras: {pInn.extras}</div>
                </div>
                <div className="sc-score" style={{ color: pt.primary }}>{pInn.runs}/{pInn.wickets}</div>
              </div>
              <div className="sc-row">
                <div>
                  <div className="sc-team">{at.short} (2nd Innings)</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{oversStr(aInn.legalBalls)} overs · Extras: {aInn.extras}</div>
                </div>
                <div className="sc-score" style={{ color: at.primary }}>{aInn.runs}/{aInn.wickets}</div>
              </div>
            </div>
            <button className="play-btn" onClick={reset}>PLAY AGAIN</button>
          </div>
        )}

        {/* Shot feedback flash */}
        {state.showShotFeedback && (
          <div className="shot-feedback">{state.showShotFeedback}</div>
        )}
      </div>
    </>
  );
}

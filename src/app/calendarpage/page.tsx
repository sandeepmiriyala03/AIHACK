export const dynamic = 'force-dynamic';
"use client";

/**
 * AksharaTantra — Personal Calendar
 * Month view + personal events + Panchanga data overlay
 * 100% offline after first load, no external calendar API needed
 */

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import AddIcon         from "@mui/icons-material/Add";
import DeleteIcon      from "@mui/icons-material/Delete";
import EditIcon        from "@mui/icons-material/Edit";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TodayIcon       from "@mui/icons-material/Today";
import CloseIcon       from "@mui/icons-material/Close";
import SaveIcon        from "@mui/icons-material/Save";
import AccessTimeIcon  from "@mui/icons-material/AccessTime";
import LabelIcon       from "@mui/icons-material/Label";

// ── Types ──────────────────────────────────────────────────────────────────
interface CalEvent {
  id: string;
  date: string;          // YYYY-MM-DD
  title: string;
  time?: string;         // HH:MM
  note?: string;
  color: string;
}

// ── Panchanga calculation (simplified — Amanta system) ─────────────────────
function getPanchanga(date: Date) {
  // Tithi (lunar day) — cycles 1-30 every ~29.53 days
  const MOON_CYCLE = 29.530588853;
  const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z");
  const diffDays = (date.getTime() - KNOWN_NEW_MOON.getTime()) / 86400000;
  const cyclePos = ((diffDays % MOON_CYCLE) + MOON_CYCLE) % MOON_CYCLE;
  const tithiNum = Math.floor(cyclePos / (MOON_CYCLE / 30)) + 1;

  const TITHIS = [
    "Pratipadā","Dvitīyā","Tṛtīyā","Chaturthī","Pañchamī","Ṣaṣṭhī","Saptamī",
    "Aṣṭamī","Navamī","Daśamī","Ekādaśī","Dvādaśī","Trayodaśī","Chaturdaśī",
    "Amāvāsyā","Pratipadā","Dvitīyā","Tṛtīyā","Chaturthī","Pañchamī","Ṣaṣṭhī",
    "Saptamī","Aṣṭamī","Navamī","Daśamī","Ekādaśī","Dvādaśī","Trayodaśī",
    "Chaturdaśī","Pūrṇimā",
  ];
  const NAKSHATRAS = [
    "Aśvinī","Bharaṇī","Kṛttikā","Rohiṇī","Mṛgaśirā","Ārdrā","Punarvasu",
    "Puṣya","Āśleṣā","Maghā","Pūrva Phalguni","Uttara Phalguni","Hastā",
    "Chitrā","Svātī","Viśākhā","Anurādhā","Jyeṣṭhā","Mūla","Pūrvāṣāḍhā",
    "Uttarāṣāḍhā","Śravaṇa","Dhaniṣṭhā","Śatabhiṣā","Pūrva Bhādrapadā",
    "Uttara Bhādrapadā","Revatī",
  ];

  const SIDEREAL_YEAR = 365.256363;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const nakshatraIdx = Math.floor(
    ((dayOfYear / SIDEREAL_YEAR) * 27 + 0.5) % 27
  );

  const PAKSHA = tithiNum <= 15 ? "Śukla Pakṣa" : "Kṛṣṇa Pakṣa";
  const VARAS = ["Ravi Vāra","Soma Vāra","Maṅgala Vāra","Budha Vāra","Guru Vāra","Śukra Vāra","Śani Vāra"];

  // Rahu Kaal by weekday (approximate — for Hyderabad)
  const RAHU = [
    "4:30–6:00pm","7:30–9:00am","3:00–4:30pm","12:00–1:30pm",
    "1:30–3:00pm","10:30am–12:00pm","9:00–10:30am",
  ];

  const MASA_NAMES = [
    "Māgha","Phālguna","Chaitra","Vaiśākha","Jyeṣṭha","Āṣāḍha",
    "Śrāvaṇa","Bhādrapada","Āśvina","Kārtika","Mārgaśīrṣa","Pauṣa",
  ];
  const masaIdx = Math.floor(((date.getMonth() + 10) % 12));

  return {
    tithi: TITHIS[tithiNum - 1] ?? TITHIS[0],
    paksha: PAKSHA,
    nakshatra: NAKSHATRAS[nakshatraIdx],
    vara: VARAS[date.getDay()],
    masa: MASA_NAMES[masaIdx],
    rahuKaal: RAHU[date.getDay()],
    isEkadashi: tithiNum === 11 || tithiNum === 26,
    isFullMoon: tithiNum === 30,
    isNewMoon: tithiNum === 15,
  };
}

// ── Storage helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = "aksharatantra_calendar_events";
function loadEvents(): CalEvent[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveEvents(events: CalEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ── Helpers ────────────────────────────────────────────────────────────────
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const EVENT_COLORS = [
  "#10b981","#3b82f6","#f59e0b","#ec4899","#8b5cf6","#ef4444","#06b6d4",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Modal for add/edit event ────────────────────────────────────────────────
function EventModal({
  initial, dateStr, onSave, onClose,
}: {
  initial?: CalEvent; dateStr: string; onSave: (e: CalEvent) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [color, setColor] = useState(initial?.color ?? EVENT_COLORS[0]);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: initial?.id ?? Date.now().toString(),
      date: dateStr,
      title: title.trim(),
      time: time || undefined,
      note: note.trim() || undefined,
      color,
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440,
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#fafaf9",
        }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            {initial ? "Edit event" : "Add event"} — {dateStr}
          </div>
          <button onClick={onClose} style={{
            background: "#f1f5f9", border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CloseIcon style={{ fontSize: 16, color: "#64748b" }} />
          </button>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Event title *
            </label>
            <input
              autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Puja, Meeting, Birthday..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #e5e7eb", fontSize: 14, fontFamily: "'DM Sans',sans-serif",
                outline: "none", color: "#0f172a", background: "#fafaf9",
              }}
              onFocus={e => e.target.style.borderColor = "#10b981"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Time */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <AccessTimeIcon style={{ fontSize: 13 }} /> Time (optional)
            </label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              style={{
                padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
                fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none",
                color: "#0f172a", background: "#fafaf9",
              }} />
          </div>

          {/* Note */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Note (optional)
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add details..."
              rows={2}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #e5e7eb", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                outline: "none", color: "#0f172a", background: "#fafaf9", resize: "vertical",
              }} />
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <LabelIcon style={{ fontSize: 13 }} /> Color
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {EVENT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c, border: "none",
                  cursor: "pointer", outline: color === c ? `3px solid ${c}` : "none",
                  outlineOffset: 2, transition: "transform 0.15s",
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                }} />
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={save} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 24px", background: "#10b981", color: "#fff", border: "none",
            borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700,
            cursor: "pointer", marginTop: 4, transition: "all 0.18s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "#059669")}
            onMouseLeave={e => (e.currentTarget.style.background = "#10b981")}
          >
            <SaveIcon style={{ fontSize: 18 }} /> Save event
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main calendar component ────────────────────────────────────────────────
export default function CalendarPage() {
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(toKey(new Date()));
  const [modal, setModal] = useState<{ open: boolean; edit?: CalEvent }>({ open: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEvents(loadEvents());
  }, []);

  const persistEvents = useCallback((evs: CalEvent[]) => {
    setEvents(evs);
    saveEvents(evs);
  }, []);

  const addOrEdit = (e: CalEvent) => {
    const filtered = events.filter(ev => ev.id !== e.id);
    persistEvents([...filtered, e]);
  };

  const deleteEvent = (id: string) => persistEvents(events.filter(e => e.id !== id));

  // Calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedPanchanga = getPanchanga(new Date(selectedDate));
  const selectedEvents = events
    .filter(e => e.date === selectedDate)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  const eventsOnDay = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === key);
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #10b981; --ink: #0f172a; --muted: #64748b;
          --border: #f1f5f9; --bg: #fafaf9; --surface: #ffffff;
        }
        body { background: var(--bg); color: var(--ink); font-family: 'DM Sans', sans-serif; }

        .cal-wrap { min-height: 100vh; background: var(--bg); padding: 80px 0 80px; }

        .cal-layout {
          max-width: 1100px; margin: 0 auto;
          padding: 32px clamp(16px,4vw,40px);
          display: grid; grid-template-columns: 1fr 340px; gap: 24px;
          align-items: start;
        }
        @media(max-width:860px) { .cal-layout { grid-template-columns: 1fr; } }

        .cal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .cal-month {
          font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--ink);
        }
        .nav-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--surface); border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; flex-shrink: 0;
        }
        .nav-btn:hover { border-color: var(--green); background: rgba(16,185,129,0.06); }

        .cal-grid {
          display: grid; grid-template-columns: repeat(7,1fr); gap: 4px;
        }
        .day-header {
          text-align: center; font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 0;
        }
        .day-cell {
          min-height: 82px; border-radius: 12px; padding: 8px;
          background: var(--surface); border: 1.5px solid var(--border);
          cursor: pointer; transition: all 0.15s; position: relative;
        }
        .day-cell:hover { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.02); }
        .day-cell.today { border-color: var(--green); }
        .day-cell.selected { background: rgba(16,185,129,0.06); border-color: var(--green); }
        .day-cell.other-month { opacity: 0; pointer-events: none; }

        .day-num {
          font-size: 13px; font-weight: 700; color: var(--ink);
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .day-cell.today .day-num {
          background: var(--green); color: #fff; font-weight: 800;
        }

        .event-dot {
          display: flex; align-items: center; gap: 4px;
          margin-top: 3px; font-size: 10px; font-weight: 600;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          padding: 2px 5px; border-radius: 5px; max-width: 100%;
        }

        /* Side panel */
        .side-panel {
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: 20px; overflow: hidden; position: sticky; top: 100px;
        }
        .panel-section {
          padding: 18px 20px; border-bottom: 1px solid var(--border);
        }
        .panel-section:last-child { border-bottom: none; }
        .panel-title {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800;
          color: var(--ink); margin-bottom: 12px; display: flex; align-items: center; gap: 7px;
        }
        .panchanga-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 6px 0; border-bottom: 1px solid #f8fafc; font-size: 13px;
        }
        .panchanga-row:last-child { border-bottom: none; }
        .p-key { color: #94a3b8; font-weight: 500; flex-shrink: 0; width: 90px; }
        .p-val { color: var(--ink); font-weight: 600; text-align: right; flex: 1; }

        .event-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 10px; background: #f8fafc;
          margin-bottom: 8px; position: relative; border: 1px solid #f1f5f9;
        }
        .event-color-bar {
          width: 3px; border-radius: 99px; flex-shrink: 0; align-self: stretch; min-height: 36px;
        }
        .event-actions {
          display: flex; gap: 4px; margin-left: auto; flex-shrink: 0;
        }
        .act-btn {
          width: 28px; height: 28px; border: none; border-radius: 7px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          background: transparent; transition: background 0.15s;
        }
        .act-btn:hover { background: #f1f5f9; }

        .add-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 11px 16px; border-radius: 12px;
          background: rgba(16,185,129,0.08); border: 1.5px dashed rgba(16,185,129,0.4);
          color: #059669; font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.18s;
        }
        .add-btn:hover { background: rgba(16,185,129,0.14); border-color: #10b981; }

        .special-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 99px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        @media(max-width:640px) { .day-cell { min-height: 60px; padding: 5px; } }
      `}</style>

      <Navbar />

      <div className="cal-wrap">
        {/* Page header */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,4vw,40px) 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <CalendarMonthIcon style={{ fontSize: 28, color: "#10b981" }} />
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, color: "#0f172a" }}>
              Personal Calendar
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 0 }}>
            Your events alongside Panchanga data — Tithi, Nakshatra & Rahu Kaal. All data stays on your device.
          </p>
        </div>

        <div className="cal-layout">

          {/* ── Calendar grid ─────────────────────────────────────────── */}
          <div>
            {/* Month nav */}
            <div className="cal-header">
              <button className="nav-btn"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}>
                <ChevronLeftIcon style={{ fontSize: 20, color: "#64748b" }} />
              </button>
              <div>
                <div className="cal-month">{MONTHS[month]} {year}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="nav-btn"
                  onClick={() => { setViewDate(new Date()); setSelectedDate(toKey(today)); }}
                  title="Go to today"
                  style={{ fontSize: 11, fontWeight: 700, color: "#10b981", width: "auto", padding: "0 12px", gap: 4 }}>
                  <TodayIcon style={{ fontSize: 15, color: "#10b981" }} />
                  Today
                </button>
                <button className="nav-btn"
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                  <ChevronRightIcon style={{ fontSize: 20, color: "#64748b" }} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="cal-grid" style={{ marginBottom: 4 }}>
              {DAYS.map(d => (
                <div key={d} className="day-header">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="cal-grid">
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="day-cell other-month" />;
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = key === toKey(today);
                const isSel = key === selectedDate;
                const dayEvents = eventsOnDay(day);
                const panch = getPanchanga(new Date(year, month, day));

                let cls = "day-cell";
                if (isToday) cls += " today";
                if (isSel) cls += " selected";

                return (
                  <div key={key} className={cls}
                    onClick={() => setSelectedDate(key)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div className="day-num">{day}</div>
                      {(panch.isFullMoon || panch.isNewMoon || panch.isEkadashi) && (
                        <span style={{ fontSize: 12 }}>
                          {panch.isFullMoon ? "🌕" : panch.isNewMoon ? "🌑" : "🪔"}
                        </span>
                      )}
                    </div>
                    {/* Tithi (tiny) */}
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {panch.tithi}
                    </div>
                    {/* Event dots */}
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className="event-dot"
                        style={{ background: ev.color + "18", color: ev.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: ev.color, display: "inline-block", flexShrink: 0 }} />
                        {ev.time ? `${ev.time} ` : ""}{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Side panel ────────────────────────────────────────────── */}
          <div className="side-panel">

            {/* Selected date heading */}
            <div className="panel-section" style={{ background: "#f0fdf4" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                    {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric" })}
                  </div>
                </div>
                {selectedDate === toKey(today) && (
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 99, background: "#10b981", color: "#fff" }}>
                    TODAY
                  </span>
                )}
              </div>
              {/* Special day badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {selectedPanchanga.isFullMoon && (
                  <span className="special-badge" style={{ background: "rgba(245,158,11,0.1)", color: "#d97706" }}>🌕 Pūrṇimā</span>
                )}
                {selectedPanchanga.isNewMoon && (
                  <span className="special-badge" style={{ background: "rgba(100,116,139,0.1)", color: "#475569" }}>🌑 Amāvāsyā</span>
                )}
                {selectedPanchanga.isEkadashi && (
                  <span className="special-badge" style={{ background: "rgba(139,92,246,0.1)", color: "#7c3aed" }}>🪔 Ekādaśī</span>
                )}
              </div>
            </div>

            {/* Panchanga */}
            <div className="panel-section">
              <div className="panel-title">
                🕉️ Panchanga
              </div>
              {[
                ["Vara",      selectedPanchanga.vara],
                ["Tithi",     selectedPanchanga.tithi],
                ["Paksha",    selectedPanchanga.paksha],
                ["Nakshatra", selectedPanchanga.nakshatra],
                ["Masa",      selectedPanchanga.masa],
                ["Rahu Kaal", selectedPanchanga.rahuKaal],
              ].map(([k, v]) => (
                <div key={k} className="panchanga-row">
                  <span className="p-key">{k}</span>
                  <span className="p-val">{v}</span>
                </div>
              ))}
              <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>
                * Approximate — verify with DrikPanchang
              </p>
            </div>

            {/* Events for selected day */}
            <div className="panel-section">
              <div className="panel-title">
                <CalendarMonthIcon style={{ fontSize: 16, color: "#10b981" }} />
                Events
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {selectedEvents.length === 0 && (
                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, textAlign: "center", padding: "8px 0" }}>
                  No events — add one below.
                </p>
              )}

              {selectedEvents.map(ev => (
                <div key={ev.id} className="event-item">
                  <div className="event-color-bar" style={{ background: ev.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.title}
                    </div>
                    {ev.time && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <AccessTimeIcon style={{ fontSize: 11 }} /> {ev.time}
                      </div>
                    )}
                    {ev.note && (
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{ev.note}</div>
                    )}
                  </div>
                  <div className="event-actions">
                    <button className="act-btn" onClick={() => setModal({ open: true, edit: ev })} title="Edit">
                      <EditIcon style={{ fontSize: 14, color: "#64748b" }} />
                    </button>
                    <button className="act-btn" onClick={() => deleteEvent(ev.id)} title="Delete">
                      <DeleteIcon style={{ fontSize: 14, color: "#ef4444" }} />
                    </button>
                  </div>
                </div>
              ))}

              <button className="add-btn" onClick={() => setModal({ open: true })}>
                <AddIcon style={{ fontSize: 18 }} /> Add event for {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Event modal */}
      {modal.open && (
        <EventModal
          initial={modal.edit}
          dateStr={selectedDate}
          onSave={addOrEdit}
          onClose={() => setModal({ open: false })}
        />
      )}

      <GoToTopButton />
    </>
  );
}

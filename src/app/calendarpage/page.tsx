"use client";
export const dynamic = 'force-dynamic';

/**
 * AksharaTantra — Personal Calendar
 * Month view + personal events + Panchanga data overlay
 * 100% offline after first load, no external calendar API needed
 */

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import { Add as AddIcon } from "../../lib/yuktai-icons";
import { Delete as DeleteIcon } from "../../lib/yuktai-icons";
import { Edit as EditIcon } from "../../lib/yuktai-icons";
import { ChevronLeft as ChevronLeftIcon } from "../../lib/yuktai-icons";
import { ChevronRight as ChevronRightIcon } from "../../lib/yuktai-icons";
import { CalendarMonth as CalendarMonthIcon } from "../../lib/yuktai-icons";
import { Today as TodayIcon } from "../../lib/yuktai-icons";
import { Close as CloseIcon } from "../../lib/yuktai-icons";
import { Save as SaveIcon } from "../../lib/yuktai-icons";
import { AccessTime as AccessTimeIcon } from "../../lib/yuktai-icons";
import { Label as LabelIcon } from "../../lib/yuktai-icons";
import PageIntro from "@/components/PageIntro";

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
    <div className="is-d12e224" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="is-a608522">
        {/* Header */}
        <div className="is-ed79f36">
          <div className="is-8f2594c">
            {initial ? "Edit event" : "Add event"} — {dateStr}
          </div>
          <button onClick={onClose} className="is-1741743">
            <CloseIcon className="is-60585d5" />
          </button>
        </div>

        <div className="is-9726693">
          {/* Title */}
          <div>
            <label className="is-de3e938">
              Event title *
            </label>
            <input
              autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Puja, Meeting, Birthday..."
              className="is-0a4ce9b"
              onFocus={e => e.target.style.borderColor = "#10b981"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Time */}
          <div>
            <label className="is-adecdc3">
              <AccessTimeIcon className="is-7667453" /> Time (optional)
            </label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="is-5d2c711" />
          </div>

          {/* Note */}
          <div>
            <label className="is-de3e938">
              Note (optional)
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className="is-7750eda" />
          </div>

          {/* Color */}
          <div>
            <label className="is-8dc16b2">
              <LabelIcon className="is-7667453" /> Color
            </label>
            <div className="is-13262f5">
              {EVENT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className="is-16473de" style={{ background: c, border: "none", cursor: "pointer", outline: color === c ? `3px solid ${c}` : "none", outlineOffset: 2, transition: "transform 0.15s", transform: color === c ? "scale(1.2)" : "scale(1)" }} />
              ))}
            </div>
          </div>

          {/* Save */}
          <button onClick={save} className="is-72becc0"
            onMouseEnter={e => (e.currentTarget.style.background = "#059669")}
            onMouseLeave={e => (e.currentTarget.style.background = "#10b981")}
          >
            <SaveIcon className="is-768e1f2" /> Save event
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

  if (!mounted) return <PageIntro href="/calendarpage" />; // text for the raw HTML (agents, search)

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
        <div className="is-0a8c77e">
          <div className="is-9bb79fb">
            <CalendarMonthIcon className="is-a55610d" />
            <h1 className="is-471df5d">
              Personal Calendar
            </h1>
          </div>
          <p className="is-055d956">
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
                <ChevronLeftIcon className="is-ba5643e" />
              </button>
              <div>
                <div className="cal-month">{MONTHS[month]} {year}</div>
              </div>
              <div className="is-4a5d9a1">
                <button className="nav-btn is-884c160"
                  onClick={() => { setViewDate(new Date()); setSelectedDate(toKey(today)); }}
                  title="Go to today"
>
                  <TodayIcon className="is-ce83129" />
                  Today
                </button>
                <button className="nav-btn"
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                  <ChevronRightIcon className="is-ba5643e" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="cal-grid is-56c00b6">
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
                    <div className="is-695916a">
                      <div className="day-num">{day}</div>
                      {(panch.isFullMoon || panch.isNewMoon || panch.isEkadashi) && (
                        <span className="is-345895d">
                          {panch.isFullMoon ? "🌕" : panch.isNewMoon ? "🌑" : "🪔"}
                        </span>
                      )}
                    </div>
                    {/* Tithi (tiny) */}
                    <div className="is-1a7dff0">
                      {panch.tithi}
                    </div>
                    {/* Event dots */}
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className="event-dot"
                        style={{ background: ev.color + "18", color: ev.color }}>
                        <span className="is-e6b0c9d" style={{ background: ev.color, display: "inline-block", flexShrink: 0 }} />
                        {ev.time ? `${ev.time} ` : ""}{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="is-48cd742">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Side panel ────────────────────────────────────────────── */}
          <div className="side-panel">

            {/* Selected date heading */}
            <div className="panel-section is-75400da">
              <div className="is-651ca08">
                <div>
                  <div className="is-30bc1b5">
                    {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </div>
                  <div className="is-1406953">
                    {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric" })}
                  </div>
                </div>
                {selectedDate === toKey(today) && (
                  <span className="is-0d77f66">
                    TODAY
                  </span>
                )}
              </div>
              {/* Special day badges */}
              <div className="is-d543bc0">
                {selectedPanchanga.isFullMoon && (
                  <span className="special-badge is-8841979">🌕 Pūrṇimā</span>
                )}
                {selectedPanchanga.isNewMoon && (
                  <span className="special-badge is-67c87bf">🌑 Amāvāsyā</span>
                )}
                {selectedPanchanga.isEkadashi && (
                  <span className="special-badge is-e8990c4">🪔 Ekādaśī</span>
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
              <p className="is-3fb1f34">
                * Approximate — verify with DrikPanchang
              </p>
            </div>

            {/* Events for selected day */}
            <div className="panel-section">
              <div className="panel-title">
                <CalendarMonthIcon className="is-8c98ab0" />
                Events
                <span className="is-5fd592f">
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                </span>
              </div>

              {selectedEvents.length === 0 && (
                <p className="is-179e356">
                  No events — add one below.
                </p>
              )}

              {selectedEvents.map(ev => (
                <div key={ev.id} className="event-item">
                  <div className="event-color-bar" style={{ background: ev.color }} />
                  <div className="is-ec2eba2">
                    <div className="is-5f8a4c4">
                      {ev.title}
                    </div>
                    {ev.time && (
                      <div className="is-23c4499">
                        <AccessTimeIcon className="is-6ec7081" /> {ev.time}
                      </div>
                    )}
                    {ev.note && (
                      <div className="is-ddc78ae">{ev.note}</div>
                    )}
                  </div>
                  <div className="event-actions">
                    <button className="act-btn" onClick={() => setModal({ open: true, edit: ev })} title="Edit">
                      <EditIcon className="is-41aec17" />
                    </button>
                    <button className="act-btn" onClick={() => deleteEvent(ev.id)} title="Delete">
                      <DeleteIcon className="is-684d369" />
                    </button>
                  </div>
                </div>
              ))}

              <button className="add-btn" onClick={() => setModal({ open: true })}>
                <AddIcon className="is-768e1f2" /> Add event for {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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

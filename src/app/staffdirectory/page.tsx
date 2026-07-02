"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Card,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
  Button,
} from "@mui/material";
import Navbar from "@/components/Navbar";

// ── yuktai (yours) — all 7 icons imported ──────────────────
import {
  YuktaiGrid,
  type GridColumn,
  type GridTheme,
  SearchIcon,
  SortUpIcon,
  SortDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  CloseIcon,
} from "@yuktishaalaa/yuktai";

// ── MUI icons ──────────────────────────────────────────────
import PaletteIcon      from "@mui/icons-material/Palette";
import ExpandMoreIcon   from "@mui/icons-material/ExpandMore";
import LightModeIcon    from "@mui/icons-material/LightMode";
import DarkModeIcon     from "@mui/icons-material/DarkMode";
import ContrastIcon     from "@mui/icons-material/Contrast";
import VisibilityIcon   from "@mui/icons-material/Visibility";
import MenuBookIcon     from "@mui/icons-material/MenuBook";
import KeyboardIcon     from "@mui/icons-material/Keyboard";
import AutoAwesomeIcon  from "@mui/icons-material/AutoAwesomeRounded";
import TrendingUpIcon   from "@mui/icons-material/TrendingUpRounded";
import TrendingDownIcon from "@mui/icons-material/TrendingDownRounded";
import CakeIcon         from "@mui/icons-material/CakeRounded";
import WarningIcon      from "@mui/icons-material/WarningRounded";
import MicRoundedIcon      from "@mui/icons-material/MicRounded";
import SendRoundedIcon     from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "yuktai-grid-theme";
const G = "#10b981";
const TEXT_MAIN = "#0f172a";
const TEXT_SUB  = "#64748b";
const BORDER    = "#e2e8f0";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface EmployeeRow extends Record<string, unknown> {
  rowId:  string | number;
  name:   string;
  salary: number;
  age:    number | null;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time: string;
}

type HighlightStrategy = "none" | "top-salary" | "low-salary" | "youngest" | "oldest" | "anomaly-salary";

// ─────────────────────────────────────────────────────────────
// Theme options
// ─────────────────────────────────────────────────────────────
const THEMES: { value: GridTheme; label: string; icon: React.ReactNode }[] = [
  { value: "default",       label: "Default",       icon: <LightModeIcon fontSize="small" /> },
  { value: "high-contrast", label: "High Contrast", icon: <ContrastIcon  fontSize="small" /> },
  { value: "dark",          label: "Dark",          icon: <DarkModeIcon  fontSize="small" /> },
  { value: "color-blind",   label: "Color Blind",   icon: <VisibilityIcon fontSize="small" /> },
  { value: "dyslexia",      label: "Dyslexia",      icon: <MenuBookIcon  fontSize="small" /> },
];

const HIGHLIGHT_ACTIONS: {
  key:   HighlightStrategy;
  label: string;
  icon:  React.ReactNode;
  color: string;
  desc:  string;
}[] = [
  { key: "top-salary",     label: "Top 5 Salaries",    icon: <TrendingUpIcon fontSize="small" />,   color: "#10b981", desc: "Highest earners" },
  { key: "low-salary",     label: "Bottom 5 Salaries", icon: <TrendingDownIcon fontSize="small" />, color: "#f59e0b", desc: "Lowest earners" },
  { key: "youngest",       label: "Youngest 5",         icon: <CakeIcon fontSize="small" />,         color: "#3b82f6", desc: "Youngest employees" },
  { key: "oldest",         label: "Oldest 5",           icon: <CakeIcon fontSize="small" />,         color: "#8b5cf6", desc: "Oldest employees" },
  { key: "anomaly-salary", label: "Salary Anomalies",   icon: <WarningIcon fontSize="small" />,      color: "#dc2626", desc: "Statistically unusual" },
];

// ─────────────────────────────────────────────────────────────
// Speech Recognition hook
// ─────────────────────────────────────────────────────────────
function useSpeechRecognition() {
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported,  setSupported]  = useState(true);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const recog = new SR();
    recog.continuous     = false;
    recog.interimResults = false;
    recog.lang           = "en-US";
    recog.onresult = (event: any) => {
      setTranscript(event.results[0][0].transcript);
      setListening(false);
    };
    recog.onerror = () => setListening(false);
    recog.onend   = () => setListening(false);
    recogRef.current = recog;
  }, []);

  const start = useCallback(() => {
    if (!recogRef.current) return;
    setTranscript("");
    setListening(true);
    try { recogRef.current.start(); } catch { setListening(false); }
  }, []);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, transcript, supported, start, stop };
}

// ─────────────────────────────────────────────────────────────
// TTS helper
// ─────────────────────────────────────────────────────────────
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 1;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

// ─────────────────────────────────────────────────────────────
// Answer questions from grid data
// ─────────────────────────────────────────────────────────────
function answerQuestion(question: string, rows: EmployeeRow[]): string {
  if (rows.length === 0) return "There is no employee data loaded yet.";
  const q = question.toLowerCase();

  if (/how many|count|total/.test(q)) {
    return `There are ${rows.length} employees in the grid.`;
  }
  if (/(highest|max|top).*(salary|pay)/.test(q)) {
    const s = [...rows].filter(r => !isNaN(r.salary)).sort((a, b) => b.salary - a.salary);
    if (s.length === 0) return "No salary data available.";
    return `The highest salary is rupees ${s[0].salary.toLocaleString("en-IN")}, held by ${s[0].name}.`;
  }
  if (/(lowest|min).*(salary|pay)/.test(q)) {
    const s = [...rows].filter(r => !isNaN(r.salary)).sort((a, b) => a.salary - b.salary);
    if (s.length === 0) return "No salary data available.";
    return `The lowest salary is rupees ${s[0].salary.toLocaleString("en-IN")}, held by ${s[0].name}.`;
  }
  if (/(average|avg).*(salary|pay)/.test(q)) {
    const s = rows.map(r => r.salary).filter(v => !isNaN(v));
    if (s.length === 0) return "No salary data.";
    const avg = s.reduce((a, b) => a + b, 0) / s.length;
    return `The average salary is rupees ${Math.round(avg).toLocaleString("en-IN")}.`;
  }
  if (/(average|avg).*(age)/.test(q)) {
    const a = rows.map(r => r.age).filter((v): v is number => v != null);
    if (a.length === 0) return "No age data.";
    const avg = a.reduce((x, y) => x + y, 0) / a.length;
    return `The average age is ${Math.round(avg)} years.`;
  }
  if (/oldest/.test(q)) {
    const w = rows.filter(r => r.age != null) as (EmployeeRow & { age: number })[];
    if (w.length === 0) return "No age data.";
    const old = [...w].sort((a, b) => b.age - a.age)[0];
    return `The oldest employee is ${old.name} at ${old.age} years.`;
  }
  if (/youngest/.test(q)) {
    const w = rows.filter(r => r.age != null) as (EmployeeRow & { age: number })[];
    if (w.length === 0) return "No age data.";
    const y = [...w].sort((a, b) => a.age - b.age)[0];
    return `The youngest employee is ${y.name} at ${y.age} years.`;
  }
  return "I can answer questions about employees. Try 'highest salary', 'how many employees', or 'average age'.";
}

// ═════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════
export default function Home() {
  const [employees,      setEmployees]      = useState<any[]>([]);
  const [highlightIds,   setHighlightIds]   = useState<(string | number)[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<HighlightStrategy>("none");
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(false);
  const [theme,          setTheme]          = useState<GridTheme>("default");

  // ── Chat state ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Hi! I'm Yukti. Say or type: 'search Sandeep', 'dark theme', 'top salaries', 'highest salary', or 'clear highlights'.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { listening, transcript, supported, start, stop } = useSpeechRecognition();

  // ── Load saved theme ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as GridTheme | null;
    if (saved && THEMES.some((t) => t.value === saved)) setTheme(saved);
  }, []);

  const handleThemeChange = (_e: unknown, newTheme: GridTheme | null) => {
    if (!newTheme) return;
    setTheme(newTheme);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, newTheme);
  };

  // ── Fetch data ──
  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((response) => {
        const list = Array.isArray(response) ? response : (response.data ?? []);
        setEmployees(list);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  // ── Apply highlight ──
  const applyHighlight = async (strategy: HighlightStrategy) => {
    if (strategy === "none" || strategy === activeStrategy) {
      setHighlightIds([]);
      setActiveStrategy("none");
      return;
    }
    try {
      const res = await fetch(`/api/employees?highlight=${strategy}`);
      const response = await res.json();
      setHighlightIds(response.highlightIds ?? []);
      setActiveStrategy(strategy);
    } catch (err) {
      console.error("Highlight failed:", err);
    }
  };

  const clearHighlight = () => {
    setHighlightIds([]);
    setActiveStrategy("none");
  };

  // ── Map rows ──
  const rows: EmployeeRow[] = useMemo(
    () => employees.map((emp: any, idx: number) => ({
      rowId:  (emp.id as string | number) ?? idx,
      name:   String(emp.name ?? "Unknown"),
      salary: Number(emp.salary ?? 0),
      age:    emp.age == null ? null : Number(emp.age),
    })),
    [employees]
  );

  const columns: GridColumn<EmployeeRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "age", label: "Age", type: "number", sortable: true, align: "right",
      render: (value) => (value == null ? "N/A" : `${value} yrs`) },
    { key: "salary", label: "Salary", type: "number", sortable: true, align: "right",
      render: (value) => value == null ? "N/A" : `₹${Number(value).toLocaleString("en-IN")}` },
  ];

  // ── Auto scroll chat ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  // ── Process voice/text command ──
  const processCommand = (text: string): string => {
    const t = text.toLowerCase().trim();

    // COMMAND: theme changes
    if (/dark|night|dark theme|dark mode/.test(t)) {
      handleThemeChange(null, "dark");
      return "Switched to dark theme.";
    }
    if (/light|light theme|default theme/.test(t)) {
      handleThemeChange(null, "default");
      return "Switched to default theme.";
    }
    if (/high contrast|contrast/.test(t)) {
      handleThemeChange(null, "high-contrast");
      return "Switched to high contrast theme.";
    }
    if (/dyslexia|dyslexic/.test(t)) {
      handleThemeChange(null, "dyslexia");
      return "Switched to dyslexia-friendly theme.";
    }
    if (/color blind|colour blind|colorblind/.test(t)) {
      handleThemeChange(null, "color-blind");
      return "Switched to color-blind theme.";
    }

    // COMMAND: highlight actions
    if (/top salar|highest salar|highest paid/.test(t)) {
      applyHighlight("top-salary");
      return "Highlighting top 5 salaries.";
    }
    if (/low salar|lowest salar|bottom salar/.test(t)) {
      applyHighlight("low-salary");
      return "Highlighting bottom 5 salaries.";
    }
    if (/youngest/.test(t)) {
      applyHighlight("youngest");
      return "Highlighting youngest 5 employees.";
    }
    if (/oldest/.test(t)) {
      applyHighlight("oldest");
      return "Highlighting oldest 5 employees.";
    }
    if (/anomal|unusual|suspicious|outlier/.test(t)) {
      applyHighlight("anomaly-salary");
      return "Highlighting salary anomalies.";
    }
    if (/clear highlight|remove highlight|no highlight/.test(t)) {
      clearHighlight();
      return "Cleared all highlights.";
    }

    // COMMAND: search
    if (/^(search|find|look for|show me)\s+(.+)/.test(t)) {
      const match = t.match(/^(search|find|look for|show me)\s+(.+)/);
      const term = match?.[2]?.trim();
      if (term) {
        // Try to find search input in grid and update it
        const searchInput = document.querySelector<HTMLInputElement>('[data-yuktai-grid] input[type="search"]');
        if (searchInput) {
          // Native setter
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          setter?.call(searchInput, term);
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          return `Searching for "${term}".`;
        }
        return `Search command received: "${term}", but I could not find the search box.`;
      }
    }
    if (/clear search|reset search/.test(t)) {
      const searchInput = document.querySelector<HTMLInputElement>('[data-yuktai-grid] input[type="search"]');
      if (searchInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        setter?.call(searchInput, "");
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        return "Search cleared.";
      }
      return "Search box not found.";
    }

    // COMMAND: questions (answer + TTS)
    if (/^(how many|highest|lowest|average|avg|oldest|youngest|who|what|which)/.test(t)) {
      return answerQuestion(text, rows);
    }

    // COMMAND: help
    if (/help|what can you do|commands/.test(t)) {
      return "Try: 'search Ravi', 'dark theme', 'top salaries', 'youngest', 'salary anomalies', 'clear highlights', 'highest salary'.";
    }

    return `I heard "${text}". Try 'help' to see what I can do.`;
  };

  const handleChatSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "user", text: trimmed, time }]);
    setChatInput("");
    setTimeout(() => {
      const answer = processCommand(trimmed);
      const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, { role: "ai", text: answer, time: t }]);
      speak(answer);
    }, 300);
  };

  useEffect(() => {
    if (transcript) handleChatSubmit(transcript);
  }, [transcript]);

  const suggestions = [
    "Highest salary",
    "Top salaries",
    "Dark theme",
    "Youngest",
    "Clear highlights",
  ];

  const activeAction = HIGHLIGHT_ACTIONS.find((a) => a.key === activeStrategy);

  return (
    <>
      <Navbar />

      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>

        {/* ─── HEADING ─── */}
        <Box mb={3}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Yuktai Grid Demo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accessible AI-powered data grid · 5 WCAG themes · Voice + Chat · Ask & Highlight · zero API key
          </Typography>
        </Box>

        {/* ─── ASK & HIGHLIGHT ─── */}
        <Card sx={{ borderRadius: 4, mb: 2, p: { xs: 1.5, sm: 2 }, bgcolor: "#f0fdf4", border: "1px solid #86efac" }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
              <AutoAwesomeIcon sx={{ color: G }} fontSize="small" />
              <Typography variant="body2" fontWeight={600} color="#166534">
                Ask & Highlight
              </Typography>
              <Chip label="v4.2.0" size="small" sx={{ bgcolor: G, color: "#fff", fontWeight: 700, fontSize: "0.65rem", height: 20 }} />
              {activeAction && (
                <>
                  <Chip label={`${highlightIds.length} highlighted`} size="small" sx={{ bgcolor: activeAction.color, color: "#fff", fontSize: "0.7rem" }} />
                  <Button size="small" onClick={clearHighlight} startIcon={<CloseIcon size={14} />} sx={{ textTransform: "none", fontSize: "0.75rem", color: "#64748b" }}>
                    Clear
                  </Button>
                </>
              )}
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Click a button OR click 🎤 and say "top salaries" / "youngest" / "salary anomalies".
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {HIGHLIGHT_ACTIONS.map((action) => {
                const isActive = activeStrategy === action.key;
                return (
                  <Tooltip key={action.key} title={action.desc} arrow>
                    <Button
                      size="small"
                      variant={isActive ? "contained" : "outlined"}
                      startIcon={action.icon}
                      onClick={() => applyHighlight(action.key)}
                      disabled={loading || error}
                      sx={{
                        textTransform: "none", fontSize: "0.8rem",
                        bgcolor: isActive ? action.color : "transparent",
                        color: isActive ? "#fff" : action.color,
                        borderColor: action.color,
                        "&:hover": { bgcolor: isActive ? action.color : `${action.color}15`, borderColor: action.color },
                      }}
                    >
                      {action.label}
                    </Button>
                  </Tooltip>
                );
              })}
            </Stack>
          </Stack>
        </Card>

        {/* ─── THEME SWITCHER ─── */}
        <Card sx={{ borderRadius: 4, mb: 2, p: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PaletteIcon color="primary" fontSize="small" />
              <Typography variant="body2" fontWeight={600}>Theme</Typography>
              <Chip label={THEMES.find((t) => t.value === theme)?.label} size="small" color="primary" variant="outlined" />
            </Stack>
            <ToggleButtonGroup
              value={theme}
              exclusive
              onChange={handleThemeChange}
              size="small"
              aria-label="Grid theme selector"
              sx={{ flexWrap: "wrap", "& .MuiToggleButton-root": { px: 1.5, py: 0.5, textTransform: "none", fontSize: "0.8rem" } }}
            >
              {THEMES.map((t) => (
                <ToggleButton key={t.value} value={t.value} aria-label={`${t.label} theme`}>
                  <Tooltip title={t.label} arrow>
                    <Stack direction="row" alignItems="center" spacing={0.7}>
                      {t.icon}
                      <Box sx={{ display: { xs: "none", md: "inline" } }}>{t.label}</Box>
                    </Stack>
                  </Tooltip>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Card>

        {/* ─── ERROR ─── */}
        {!loading && error && (
          <Card sx={{ borderRadius: 4, p: 4, mb: 2, textAlign: "center" }}>
            <CloseIcon size={40} color="#dc2626" />
            <Typography variant="h6" fontWeight="bold" mt={1.5}>Could not load employee data</Typography>
            <Typography color="text.secondary" mt={0.5}>Check your connection and try refreshing.</Typography>
          </Card>
        )}

        {/* ─── GRID ─── */}
        {!error && (
          <Card sx={{ borderRadius: 4, overflow: "hidden", p: { xs: 1, sm: 2 }, mb: 3 }}>
            <YuktaiGrid
              data={rows}
              columns={columns}
              rowKey="rowId"
              loading={loading}
              search={true}
              view="auto"
              theme={theme}
              pagination={{ pageSize: 10 }}
              highlightIds={highlightIds}
              highlightColor={activeAction?.color ? `${activeAction.color}30` : "#FEF3C7"}
              autoScrollToHighlight={true}
              empty={
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CloseIcon size={32} color="#94a3b8" />
                  <Typography color="text.secondary" mt={1}>No employees match your search</Typography>
                </Box>
              }
            />
          </Card>
        )}

        {/* ─── GRID CONTROLS OVERVIEW ─── */}
        <Accordion sx={{ borderRadius: 4, mb: 2 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Grid Controls Overview</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <VolumeUpRoundedIcon sx={{ color: G, fontSize: 20 }} />
                <Typography variant="body2">
                  <strong>Voice Assistant (NEW):</strong> Click 🤖 button bottom-right → mic → speak commands like "dark theme" or "top salaries".
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <AutoAwesomeIcon sx={{ color: G, fontSize: 20 }} />
                <Typography variant="body2">
                  <strong>Ask & Highlight (NEW):</strong> Rows glow yellow — full data stays visible for context.
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <SearchIcon size={20} color="#0D9488" />
                <Typography variant="body2"><strong>Search:</strong> Real-time filtering across all columns.</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <SortUpIcon size={20} color="#0D9488" />
                <Typography variant="body2"><strong>Sort ascending:</strong> First click on any column header.</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <SortDownIcon size={20} color="#0D9488" />
                <Typography variant="body2"><strong>Sort descending:</strong> Second click. Third click clears.</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ChevronLeftIcon size={20} color="#0D9488" />
                <Typography variant="body2"><strong>Previous page:</strong> Navigate one page back.</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ChevronRightIcon size={20} color="#0D9488" />
                <Typography variant="body2"><strong>Next page:</strong> Move to the next page.</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <CheckIcon size={20} color="#10b981" />
                <Typography variant="body2"><strong>WCAG 2.2 compliant:</strong> Keyboard + screen reader ready.</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <CloseIcon size={20} color="#dc2626" />
                <Typography variant="body2"><strong>Empty state:</strong> Clear message when no rows match.</Typography>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* ─── VOICE COMMANDS HELP ─── */}
        <Accordion sx={{ borderRadius: 4, mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <MicRoundedIcon fontSize="small" sx={{ color: G }} />
              <Typography fontWeight={600}>Voice Commands</Typography>
              <Chip label="NEW" size="small" sx={{ bgcolor: G, color: "#fff", fontWeight: 700, fontSize: "0.6rem", height: 18 }} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.2}>
              <Typography variant="body2"><strong>🔍 Search:</strong> "search Ravi", "find Sandeep", "clear search"</Typography>
              <Typography variant="body2"><strong>🎨 Themes:</strong> "dark theme", "light theme", "dyslexia", "high contrast"</Typography>
              <Typography variant="body2"><strong>✨ Highlights:</strong> "top salaries", "youngest", "oldest", "salary anomalies", "clear highlights"</Typography>
              <Typography variant="body2"><strong>❓ Questions:</strong> "highest salary?", "average age?", "how many employees?"</Typography>
              <Typography variant="body2"><strong>💡 Help:</strong> "help", "what can you do"</Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* ─── KEYBOARD SHORTCUTS ─── */}
        <Accordion sx={{ borderRadius: 4 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <KeyboardIcon fontSize="small" color="primary" />
              <Typography fontWeight={600}>Keyboard shortcuts</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={0.5}>
              <Typography variant="body2"><strong>Tab</strong> — Move between cells</Typography>
              <Typography variant="body2"><strong>Arrow keys</strong> — Move within the grid</Typography>
              <Typography variant="body2"><strong>Enter</strong> — Activate a cell or button</Typography>
              <Typography variant="body2"><strong>Esc</strong> — Close any open dropdown</Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* ─── FOOTER ─── */}
        <Box sx={{ mt: 3, p: 2, textAlign: "center", bgcolor: "grey.50", borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
            <CheckIcon size={14} color="#10b981" />
            <Typography variant="caption" color="text.secondary">
              Powered by{" "}
              <Typography component="a" href="https://www.npmjs.com/package/@yuktishaalaa/yuktai" target="_blank" rel="noopener noreferrer" variant="caption" sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none" }}>
                @yuktishaalaa/yuktai
              </Typography>
              {" "}v4.2.0 — accessibility + AI for Next.js · free forever
            </Typography>
          </Stack>
        </Box>
      </Container>

      {/* ═══════════ FLOATING CHAT BUTTON ═══════════ */}
      {/* Positioned ABOVE the InstallFab from Navbar */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
        style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 9998,
          width: 56, height: 56, borderRadius: 28,
          background: chatOpen ? "#dc2626" : G, color: "#fff",
          border: "none", cursor: "pointer",
          boxShadow: "0 8px 20px rgba(16,185,129,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {chatOpen ? <CloseIcon size={22} color="#fff" /> : <SmartToyRoundedIcon style={{ fontSize: 28 }} />}
      </button>

      {chatOpen && (
        <div role="dialog" aria-label="Yukti Assistant" style={{
          position: "fixed", bottom: 160, right: 24,
          width: 360, maxWidth: "calc(100vw - 48px)",
          height: 500, maxHeight: "70vh",
          background: "#fff", border: `1px solid ${BORDER}`,
          borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          zIndex: 9997, display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ padding: "14px 16px", background: G, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            <SmartToyRoundedIcon style={{ fontSize: 24 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Yukti Grid Assistant</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                {supported ? "Voice + Chat · Offline · Free" : "Chat only (voice not supported)"}
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} aria-label="Close" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", color: "#fff" }}>
              <CloseIcon size={20} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%", padding: "10px 14px", borderRadius: 12,
                background: msg.role === "user" ? "#dbeafe" : "#f0fdf4",
                color: TEXT_MAIN, fontSize: 13.5, lineHeight: 1.5,
              }}>
                <div>{msg.text}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{msg.time}</div>
              </div>
            ))}
            {listening && (
              <div style={{
                alignSelf: "flex-end", padding: "10px 14px", borderRadius: 12,
                background: "#fee2e2", color: "#991b1b", fontSize: 13.5, fontStyle: "italic",
              }}>
                🎤 Listening...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div style={{ padding: "6px 12px", borderTop: `1px solid ${BORDER}`, display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, background: "#fff" }}>
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => handleChatSubmit(s)}
                style={{
                  padding: "4px 10px", borderRadius: 12,
                  background: "#f0fdf4", border: "1px solid #86efac",
                  color: "#166534", fontSize: 11.5, cursor: "pointer",
                  whiteSpace: "nowrap", fontWeight: 500,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: 10, display: "flex", gap: 6, borderTop: `1px solid ${BORDER}`, background: "#f8fafc" }}>
            <input
              type="text" value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleChatSubmit(chatInput)}
              placeholder="Type or click mic..."
              aria-label="Chat input"
              style={{ flex: 1, padding: "8px 12px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", color: TEXT_MAIN, fontSize: 13, outline: "none" }}
            />
            {supported && (
              <button onClick={listening ? stop : start} aria-label={listening ? "Stop listening" : "Start voice input"} style={{
                width: 36, height: 36, borderRadius: 8,
                background: listening ? "#ef4444" : G, color: "#fff",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                animation: listening ? "yuktai-pulse 1s ease-in-out infinite" : "none",
              }}>
                <MicRoundedIcon style={{ fontSize: 18 }} />
              </button>
            )}
            <button onClick={() => handleChatSubmit(chatInput)} aria-label="Send" disabled={!chatInput.trim()} style={{
              padding: "0 12px",
              background: chatInput.trim() ? G : "#94a3b8",
              color: "#fff", border: "none", borderRadius: 8,
              cursor: chatInput.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <SendRoundedIcon style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes yuktai-pulse {
          0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0    rgba(239,68,68,0.4); }
          50%      { transform: scale(1.1); box-shadow: 0 0 0 8px  rgba(239,68,68,0);   }
        }
      `}</style>
    </>
  );
}
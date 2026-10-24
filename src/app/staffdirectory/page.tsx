"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Yuktai Grid Demo — server mode (1,000,000 employees in Neon)
//
// The browser only ever holds one page of rows. yuktai v5.1's parser turns a
// question into filters / sort / limit in the browser, and the API
// (/api/employees → FastAPI main.py → Neon) runs it against every row.
// ─────────────────────────────────────────────────────────────────────────────

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
  TextField,
  MenuItem,
  Select,
  IconButton,
} from "@mui/material";
import Navbar from "@/components/Navbar";

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
  // v5.1 agentic toolkit
  toGridToolColumns,
  parseGridQuery,
  executeGridQuery,
  findMentionedColumn,
  planTasks,
  type YuktaiGridRule,
  type GridToolFilter,
  type GridToolSort,
} from "@yuktishaalaa/yuktai";

import { Palette as PaletteIcon } from "../../lib/yuktai-icons";
import { ExpandMore as ExpandMoreIcon } from "../../lib/yuktai-icons";
import { LightMode as LightModeIcon } from "../../lib/yuktai-icons";
import { DarkMode as DarkModeIcon } from "../../lib/yuktai-icons";
import { Contrast as ContrastIcon } from "../../lib/yuktai-icons";
import { Visibility as VisibilityIcon } from "../../lib/yuktai-icons";
import { MenuBook as MenuBookIcon } from "../../lib/yuktai-icons";
import KeyboardIcon     from "@mui/icons-material/Keyboard";
import { AutoAwesomeRounded as AutoAwesomeIcon } from "../../lib/yuktai-icons";
import TrendingUpIcon   from "@mui/icons-material/TrendingUpRounded";
import TrendingDownIcon from "@mui/icons-material/TrendingDownRounded";
import CakeIcon         from "@mui/icons-material/CakeRounded";
import { WarningRounded as WarningIcon } from "../../lib/yuktai-icons";
import { FilterAltRounded as FilterAltIcon } from "../../lib/yuktai-icons";
import BarChartIcon     from "@mui/icons-material/BarChartRounded";
import { EventRounded as EventIcon } from "../../lib/yuktai-icons";
import StorageIcon      from "@mui/icons-material/StorageRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "../../lib/yuktai-icons";
import { ListAltRounded as ListAltIcon } from "../../lib/yuktai-icons";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "yuktai-grid-theme";
const G = "#10b981";
const BORDER    = "#e2e8f0";
const YUKTAI_VERSION = "5.1.0";
const PAGE_SIZES = [10, 20, 50, 100];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface EmployeeRow extends Record<string, unknown> {
  rowId:      number;
  name:       string;
  department: string;
  age:        number | null;
  salary:     number;
  joinedOn:   string | null;
}

interface ApiEmployee { id: number; name: string; department: string; age: number | null; salary: number; joinedOn: string | null }

interface PageResponse {
  rows: ApiEmployee[];
  pagination: { page: number; pageSize: number; totalRows: number; totalPages: number; maxPageSize: number };
}

interface StatsResponse {
  overall: { value: number | null; count: number };
  groups: { group: string | number | null; value: number | null; count: number }[];
}

interface AnomalyResponse {
  totalOutliers: number;
  lower?: number;
  upper?: number;
  rows: ApiEmployee[];
}

interface Query {
  filters:  GridToolFilter[];
  search:   string;
  sort:     GridToolSort | null;
  page:     number;
  pageSize: number;
}


const START: Query = { filters: [], search: "", sort: null, page: 1, pageSize: 20 };

// ─────────────────────────────────────────────────────────────
// Themes and quick actions
// ─────────────────────────────────────────────────────────────
const THEMES: { value: GridTheme; label: string; icon: React.ReactNode }[] = [
  { value: "default",       label: "Default",       icon: <LightModeIcon fontSize="small" /> },
  { value: "high-contrast", label: "High Contrast", icon: <ContrastIcon  fontSize="small" /> },
  { value: "dark",          label: "Dark",          icon: <DarkModeIcon  fontSize="small" /> },
  { value: "color-blind",   label: "Color Blind",   icon: <VisibilityIcon fontSize="small" /> },
  { value: "dyslexia",      label: "Dyslexia",      icon: <MenuBookIcon  fontSize="small" /> },
];

const QUICK_ACTIONS: { key: string; label: string; question: string; icon: React.ReactNode; color: string }[] = [
  { key: "top-salary",  label: "Top 5 Salaries",        question: "top 5 by salary",             icon: <TrendingUpIcon fontSize="small" />,   color: "#10b981" },
  { key: "low-salary",  label: "Bottom 5 Salaries",     question: "bottom 5 by salary",          icon: <TrendingDownIcon fontSize="small" />, color: "#f59e0b" },
  { key: "youngest",    label: "Youngest 5",            question: "bottom 5 by age",             icon: <CakeIcon fontSize="small" />,         color: "#3b82f6" },
  { key: "over-lakh",   label: "Salary over 1 lakh",    question: "salary over 1 lakh",          icon: <FilterAltIcon fontSize="small" />,    color: "#0ea5e9" },
  { key: "age-range",   label: "Age 25–35",             question: "age between 25 and 35",       icon: <FilterAltIcon fontSize="small" />,    color: "#14b8a6" },
  { key: "joined",      label: "Joined this month",     question: "joined this month",           icon: <EventIcon fontSize="small" />,        color: "#8b5cf6" },
  { key: "by-dept",     label: "Avg salary by dept",    question: "average salary by department",icon: <BarChartIcon fontSize="small" />,     color: "#0f766e" },
  { key: "unusual",     label: "Unusual salaries",      question: "anything unusual?",           icon: <WarningIcon fontSize="small" />,      color: "#dc2626" },
];

// Words that send a question from yuktai's built-in grid assistant to the
// server agent (substring match). Anything else stays with the assistant's
// own tools, which work on the rows currently on screen.
const DATA_PHRASES = [
  "how many", "count", "number of", "salary", "salaries", "age", "average", "avg", "mean",
  "total", "sum", "department", "dept", "joined", "hired", "new joiners", "unusual", "anomal",
  "outlier", "anything odd", "highest", "lowest", "youngest", "oldest", "newest", "top ", "bottom ",
  "between", "over ", "under ", "above", "below", "more than", "less than", " then ", "summar",
  "engineering", "finance", "sales", "marketing", "support", "design", "research", "legal", "operations",
  "human resources",
];

// Telugu questions → the English question the server agent understands
const TELUGU: Array<[RegExp, string]> = [
  [/ఎంత మంది|ఎన్ని/, "how many employees"],
  [/అత్యధిక జీతం|ఎక్కువ జీతం/, "highest salary"],
  [/తక్కువ జీతం|అతి తక్కువ జీతం/, "lowest salary"],
  [/సగటు జీతం/, "average salary by department"],
  [/అసాధారణ/, "anything unusual?"],
  [/ఈ నెల/, "joined this month"],
  [/క్లియర్|తీసివేయి/, "clear"],
];
const TELUGU_PHRASES = ["ఎంత మంది", "ఎన్ని", "జీతం", "అసాధారణ", "ఈ నెల", "క్లియర్", "తీసివేయి"];
const fromTelugu = (text: string) => TELUGU.find(([re]) => re.test(text))?.[1] ?? text;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const rupees = (n: number | null | undefined) => (n == null ? "N/A" : `₹${Math.round(n).toLocaleString("en-IN")}`);
const fmt = (n: number) => n.toLocaleString("en-IN");
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function api<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const res = await fetch(`/api/employees${path}?${qs}`, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? body.error ?? `Request failed (${res.status})`);
  return body as T;
}

const queryParams = (q: Query) => ({
  filters: q.filters.length ? JSON.stringify(q.filters) : undefined,
  search: q.search || undefined,
});

const fetchPage = (q: Query) =>
  api<PageResponse>("", { ...queryParams(q), page: q.page, pageSize: q.pageSize, sortKey: q.sort?.key, sortDir: q.sort?.direction });

const toRow = (e: ApiEmployee): EmployeeRow => ({
  rowId: e.id, name: e.name, department: e.department, age: e.age, salary: Number(e.salary), joinedOn: e.joinedOn,
});

const queryKey = (q: Query) => JSON.stringify(q);

/** "joined this month", "hired last week" → a date-range filter on joinedOn. */
function periodFilter(text: string): { filter: GridToolFilter; label: string } | null {
  const m = text.match(/\b(this|last)\s+(week|month|year)\b/);
  if (!m || !/\b(join|joined|joining|hire|hired|new)\b/.test(text)) return null;
  const today = new Date();
  let from: Date;
  let to = today;
  if (m[2] === "week") {
    from = new Date(today);
    from.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday
  } else if (m[2] === "month") {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
  } else {
    from = new Date(today.getFullYear(), 0, 1);
  }
  if (m[1] === "last") {
    to = new Date(from);
    to.setDate(to.getDate() - 1);
    if (m[2] === "week") from = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 7);
    if (m[2] === "month") from = new Date(from.getFullYear(), from.getMonth() - 1, 1);
    if (m[2] === "year") from = new Date(from.getFullYear() - 1, 0, 1);
  }
  return { filter: { key: "joinedOn", operator: "between", value: [iso(from) as unknown as number, iso(to) as unknown as number] }, label: `joined ${m[1]} ${m[2]}` };
}

// ═════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════
export default function StaffDirectory() {
  const [theme,        setTheme]        = useState<GridTheme>("default");
  const [query,        setQuery]        = useState<Query>(START);
  const [page,         setPage]         = useState<{ rows: EmployeeRow[]; total: number; totalPages: number; maxPageSize: number }>({ rows: [], total: 0, totalPages: 1, maxPageSize: 100 });
  const [override,     setOverride]     = useState<{ rows: EmployeeRow[]; label: string } | null>(null);
  const [table,        setTable]        = useState<{ label: string; value: string; count: number }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [departments,  setDepartments]  = useState<string[]>([]);
  const [highlightIds, setHighlightIds] = useState<(string | number)[]>([]);
  const [activeKey,    setActiveKey]    = useState<string | null>(null);
  const [answer,       setAnswer]       = useState("");
  const [question,     setQuestion]     = useState("");
  const [busy,         setBusy]         = useState(false);

  const loadedKey = useRef<string>("");
  const requestId = useRef(0);

  // ── Theme ──
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as GridTheme | null;
      if (saved && THEMES.some((t) => t.value === saved)) setTheme(saved);
    } catch { /* storage blocked */ }
  }, []);
  const changeTheme = (t: GridTheme | null) => {
    if (!t) return;
    setTheme(t);
    try { window.localStorage.setItem(STORAGE_KEY, t); } catch { /* storage blocked */ }
  };

  // ── Columns ──
  const columns: GridColumn<EmployeeRow>[] = useMemo(() => [
    { key: "name",       label: "Name",       sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "age",        label: "Age",        type: "number", sortable: true, align: "right", render: (v) => (v == null ? "N/A" : `${v} yrs`) },
    { key: "salary",     label: "Salary",     type: "number", sortable: true, align: "right", render: (v) => rupees(v as number) },
    { key: "joinedOn",   label: "Joined",     type: "date",   sortable: true, render: (v) => (v ? new Date(String(v)).toLocaleDateString("en-IN") : "N/A") },
  ], []);
  const toolColumns = useMemo(() => toGridToolColumns(columns), [columns]);
  // Department names let the parser understand "in Engineering – Pune"
  const knownValues = useMemo(() => departments.map((d) => ({ department: d })), [departments]);

  // ── Load a page from the API ──
  const load = useCallback(async (q: Query) => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const res = await fetchPage(q);
      if (id !== requestId.current) return null; // a newer request won
      const next = { rows: res.rows.map(toRow), total: res.pagination.totalRows, totalPages: res.pagination.totalPages, maxPageSize: res.pagination.maxPageSize };
      setPage(next);
      loadedKey.current = queryKey(q);
      return next;
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : "Could not load employees.");
      return null;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Paging, page size and header sorting reload here; questions load directly
  useEffect(() => {
    if (queryKey(query) !== loadedKey.current) void load(query);
  }, [query, load]);

  // Department list (once)
  useEffect(() => {
    api<StatsResponse>("/stats", { agg: "count", groupBy: "department", limit: 200 })
      .then((s) => setDepartments(s.groups.map((g) => String(g.group ?? "")).filter(Boolean)))
      .catch(() => { /* questions still work without it */ });
  }, []);

  const clearAll = useCallback(() => {
    setQuery(START);
    setOverride(null);
    setTable([]);
    setHighlightIds([]);
    setActiveKey(null);
    setAnswer("");
  }, []);

  const describeFilter = useCallback((f: GridToolFilter) => {
    const label = toolColumns.find((c) => c.key === f.key)?.label ?? f.key;
    if (Array.isArray(f.value)) return `${label} ${f.value[0]} – ${f.value[1]}`;
    const n = Number(f.value);
    const v = Number.isFinite(n) && typeof f.value === "number" ? fmt(Math.round(n)) : `"${f.value}"`;
    const op = { greaterThan: ">", lessThan: "<", between: "", equals: "=", contains: "contains", startsWith: "starts with", endsWith: "ends with" }[f.operator];
    return `${label} ${op} ${v}`;
  }, [toolColumns]);

  // ── The agent: every question becomes an API call over all rows ──
  const askData = useCallback(async (raw: string, base: Query): Promise<string> => {
    const text = raw.trim().replace(/[?!]+$/, "");
    const lower = text.toLowerCase();
    const period = periodFilter(lower);
    // Date words are handled by the period filter, not searched as text
    const plain = period ? lower.replace(/\b(joined|joining|join|hired|hire|new|this|last|week|month|year)\b/g, " ") : lower;
    const withPeriod = (filters: GridToolFilter[]) =>
      period ? [...filters.filter((f) => f.key !== "joinedOn"), period.filter] : filters;
    setOverride(null);
    setTable([]);
    const scopeOf = (q: Query) => {
      const parts = [...q.filters.map(describeFilter), q.search && `search "${q.search}"`].filter(Boolean);
      return parts.length ? ` (within: ${parts.join("; ")})` : "";
    };

    // 1. "how many …"
    if (/\bhow many\b|\bcount\b|\bnumber of\b/.test(lower)) {
      const rest = plain.replace(/\b(how many|count|number of|employees?|staff|people|are there|do we have|in total)\b/g, " ");
      const parsed = parseGridQuery(rest, toolColumns, { data: knownValues });
      const filters = withPeriod(parsed.filters.length ? parsed.filters : base.filters);
      const search = parsed.search.join(" ") || (parsed.filters.length ? "" : base.search);
      const s = await api<StatsResponse>("/stats", { agg: "count", ...queryParams({ ...base, filters, search }) });
      const scope = filters.length || search ? ` matching ${[...filters.map(describeFilter), search && `"${search}"`].filter(Boolean).join(", ")}` : "";
      return `${fmt(s.overall.count)} employees${scope}.`;
    }

    // 2. "highest salary", "youngest", "oldest" → name the person
    const sup = lower.match(/\b(highest|lowest|max|min|maximum|minimum)\s+(salary|age)\b|\b(youngest|oldest|newest|longest serving)\b/);
    if (sup && !/\b\d+\b/.test(lower)) {
      const word = sup[0];
      const key = sup[2] ?? (/newest|longest/.test(word) ? "joinedOn" : "age");
      const desc = /highest|max|oldest|newest/.test(word);
      const next: Query = { ...base, sort: { key, direction: desc ? "desc" : "asc" }, page: 1 };
      const res = await load(next);
      setQuery(next);
      const top = res?.rows[0];
      if (!top) return "No data available.";
      setHighlightIds([top.rowId]);
      const value = key === "salary" ? rupees(top.salary) : key === "age" ? `${top.age} years` : `joined ${top.joinedOn}`;
      return `${top.name} (${top.department}) has the ${word}: ${value}.${scopeOf(base)}`;
    }

    // 3. Unusual values → anomaly endpoint
    if (/unusual|anomal|outlier|odd|strange|suspicious/.test(lower)) {
      const column = /\bage\b/.test(lower) ? "age" : "salary";
      const a = await api<AnomalyResponse>("/anomalies", { column, ...queryParams(base), limit: 25 });
      if (!a.totalOutliers) return `Nothing unusual in ${column}${scopeOf(base)}. Say "clear" to check all employees.`;
      const rows = a.rows.map(toRow);
      setOverride({ rows, label: `${fmt(a.totalOutliers)} unusual ${column} value(s)` });
      setHighlightIds(rows.map((r) => r.rowId));
      const lo = Math.max(0, a.lower ?? 0);
      const range = column === "salary"
        ? (lo > 0 ? `${rupees(lo)} – ${rupees(a.upper)}` : `up to ${rupees(a.upper)}`)
        : `${Math.round(lo)} – ${Math.round(a.upper ?? 0)} years`;
      return `${fmt(a.totalOutliers)} employee(s) have a ${column} far outside the normal range (${range})${scopeOf(base)}.\nMost unusual: ${rows.slice(0, 5).map((r) => `${r.name} ${column === "salary" ? rupees(r.salary) : `${r.age} yrs`}`).join(", ")}.`;
    }

    // 4. Several steps → plan, run once on the server, report what changed
    const plan = planTasks(text);
    if (plan.length > 1) {
      let next: Query = { ...base, page: 1 };
      const notes: string[] = [];
      const after: { action: string; text: string }[] = [];
      for (const step of plan) {
        const cond = step.text.replace(/^\s*(show|filter|find|list|open|sort|order|rank|highlight|mark|flag|count|summari[sz]e|clear|reset)\b/i, " ");
        if (step.action === "clear") { next = { ...START, pageSize: next.pageSize }; notes.push("✓ Cleared filters"); continue; }
        if (step.action === "filter") {
          const p = parseGridQuery(cond, toolColumns, { data: knownValues });
          let filters = next.filters;
          for (const f of p.filters) filters = [...filters.filter((x) => x.key !== f.key), f];
          next = { ...next, filters: withPeriod(filters), search: [next.search, ...p.search].filter(Boolean).join(" "), sort: p.sort ?? next.sort };
          notes.push(`✓ ${p.explanation}`);
          continue;
        }
        if (step.action === "sort") {
          const p = parseGridQuery(step.text, toolColumns);
          const column = p.sort ? null : findMentionedColumn(cond, toolColumns);
          const sort = p.sort ?? (column ? { key: column.key, direction: /desc|high|large|most|newest|latest|old/i.test(step.text) ? "desc" as const : "asc" as const } : null);
          if (sort) { next = { ...next, sort }; notes.push(`✓ Sorted by ${toolColumns.find((c) => c.key === sort.key)?.label} ${sort.direction === "desc" ? "high → low" : "low → high"}`); }
          else notes.push("⚠ Couldn't tell which column to sort by");
          continue;
        }
        after.push(step);
      }
      const res = await load(next);
      setQuery(next);
      const lines = [...notes];
      for (const step of after) {
        if (step.action === "highlight") {
          const p = parseGridQuery(step.text.replace(/^\s*(highlight|mark|flag)\b/i, " "), toolColumns, { data: res?.rows ?? [] });
          const hits = executeGridQuery(res?.rows ?? [], toolColumns, { ...p, sort: null });
          setHighlightIds(hits.map((r) => r.rowId));
          lines.push(`✓ Highlighted ${hits.length} row(s) on this page`);
        } else if (step.action === "summarize" || step.action === "count") {
          const s = await api<StatsResponse>("/stats", { metric: "salary", agg: "avg", ...queryParams(next) });
          lines.push(`✓ ${fmt(page.total)} → ${fmt(res?.total ?? 0)} employees. Average salary ${rupees(s.overall.value)}.`);
        } else if (step.action === "anomalies") {
          const a = await api<AnomalyResponse>("/anomalies", { column: "salary", ...queryParams(next), limit: 25 });
          setHighlightIds(a.rows.map((r) => r.id));
          lines.push(`✓ ${fmt(a.totalOutliers)} unusual salaries`);
        } else {
          lines.push(`⚠ "${step.text}" isn't supported in the large-data demo`);
        }
      }
      if (next.filters.length) lines.push(`Filters: ${next.filters.map(describeFilter).join("; ")}`);
      return lines.join("\n");
    }

    // 5. Totals, averages, groups → stats endpoint (BI copilot)
    if (/\b(average|avg|mean|total|sum)\b|\b(by|per|each|which)\s+(department|dept|team)\b/.test(lower)) {
      const metric = /\bage\b/.test(lower) && !/\bsalar/.test(lower) ? "age" : "salary";
      const agg = /\b(total|sum)\b/.test(lower) ? "sum" : /\b(highest|max|most)\b/.test(lower) && !/average|avg|mean/.test(lower) ? "max" : /\b(lowest|min|least)\b/.test(lower) && !/average|avg|mean/.test(lower) ? "min" : "avg";
      const grouped = /\b(department|dept|team)s?\b/.test(lower);
      const lowestFirst = /\b(lowest|least|bottom|worst)\b/.test(lower);
      const rest = plain.replace(/\b(average|avg|mean|total|sum|salary|salaries|age|by|per|each|which|department|dept|team|has|have|the|highest|lowest|most|least)\b/g, " ");
      const parsed = parseGridQuery(rest, toolColumns, { data: knownValues });
      const filters = withPeriod([...base.filters.filter((f) => !parsed.filters.some((p) => p.key === f.key)), ...parsed.filters]);
      const scope = { ...base, filters, search: [base.search, ...parsed.search].filter(Boolean).join(" ") };
      const s = await api<StatsResponse>("/stats", { metric, agg, groupBy: grouped ? "department" : undefined, order: lowestFirst ? "asc" : "desc", limit: 50, ...queryParams(scope) });
      const show = (v: number | null) => (metric === "salary" ? rupees(v) : `${(v ?? 0).toFixed(1)} yrs`);
      const aggWord = { avg: "Average", sum: "Total", max: "Highest", min: "Lowest" }[agg];
      if (grouped && s.groups.length) {
        setTable(s.groups.map((g) => ({ label: String(g.group ?? "—"), value: show(g.value), count: g.count })));
        const top = s.groups[0];
        return `${top.group} has the ${lowestFirst ? "lowest" : "highest"} ${aggWord!.toLowerCase()} ${metric}: ${show(top.value)} (${fmt(top.count)} employees). Overall: ${show(s.overall.value)}.${scopeOf(scope)}`;
      }
      return `${aggWord} ${metric}: ${show(s.overall.value)} across ${fmt(s.overall.count)} employees.${scopeOf(scope)}`;
    }

    // 6. Filters, rankings and lookups → one page from the server
    const cleaned = plain.replace(/^\s*(search|find|look for|show me|show|list|who are|who is)\s+/, "");
    const parsed = parseGridQuery(cleaned, toolColumns, { data: knownValues });
    const limit = parsed.limit ? Math.min(parsed.limit, page.maxPageSize) : null;
    const next: Query = {
      filters: withPeriod(parsed.filters),
      search: parsed.search.join(" "),
      sort: parsed.sort,
      page: 1,
      pageSize: limit ?? base.pageSize,
    };
    const res = await load(next);
    setQuery(next);
    if (!res) return "Sorry, the staff API didn't answer. Please try again.";
    if (limit) setHighlightIds(res.rows.map((r) => r.rowId));
    else if (next.search && res.total <= next.pageSize) setHighlightIds(res.rows.map((r) => r.rowId));
    else setHighlightIds([]);
    const what = [parsed.explanation.replace(/^Showing rows where /, "").replace(/\.$/, "").replace(/,? first \d+$/, ""), period?.label].filter((x) => x && !/No conditions/.test(x)).join(", ");
    return `${fmt(res.total)} employee(s) found${what ? ` (${what})` : ""}.${limit ? ` Showing the first ${limit}.` : ""}${parsed.notes.length ? ` ${parsed.notes.join(" ")}` : ""}`;
  }, [toolColumns, knownValues, describeFilter, load, page.maxPageSize, page.total]);

  const runQuestion = useCallback(async (q: string, key: string | null = null, base?: Query) => {
    if (!q.trim()) return "";
    setBusy(true);
    try {
      const text = await askData(q, base ?? query);
      setAnswer(text);
      setActiveKey(key);
      return text;
    } catch (e) {
      const msg = `Sorry, that didn't work: ${e instanceof Error ? e.message : "unknown error"}.`;
      setAnswer(msg);
      return msg;
    } finally {
      setBusy(false);
    }
  }, [askData, query]);

  const toggleQuickAction = (action: typeof QUICK_ACTIONS[number]) => {
    if (activeKey === action.key) { clearAll(); return; }
    setHighlightIds([]);
    void runQuestion(action.question, action.key, { ...START, pageSize: query.pageSize });
  };

  const processCommand = async (text: string): Promise<string> => {
    const t = text.toLowerCase().trim();
    if (/\b(clear|remove|reset)\b.*\b(highlights?|filters?|all|everything)\b|^(clear|reset)$/.test(t)) { clearAll(); return "Cleared filters, sorting and highlights."; }
    if (/\b(help|what can you do|commands)\b/.test(t)) return "Try: 'how many employees', 'salary over 1 lakh and age under 30', 'average salary by department', 'joined this month', 'top 10 by salary', 'anything unusual?', or a theme like 'dark theme'.";
    if (/\b(dark|night)\b/.test(t))                 { changeTheme("dark");          return "Switched to dark theme."; }
    if (/\bhigh contrast\b/.test(t))                { changeTheme("high-contrast"); return "Switched to high contrast theme."; }
    if (/\bdyslexi(a|c)\b/.test(t))                 { changeTheme("dyslexia");      return "Switched to dyslexia-friendly theme."; }
    if (/\bcolou?r ?blind\b/.test(t))               { changeTheme("color-blind");   return "Switched to color-blind theme."; }
    if (/\b(light|default) (theme|mode)\b/.test(t)) { changeTheme("default");       return "Switched to default theme."; }
    return runQuestion(text);
  };

  // ── yuktai's built-in grid assistant → server agent ──
  // customRules run before the assistant's own logic, so data questions are
  // answered over all employees in Neon, not just the rows on screen.
  const agentRules = useMemo<YuktaiGridRule<EmployeeRow>[]>(() => [
    {
      name: "themes-and-clear",
      description: "Grid themes and reset",
      phrases: ["dark theme", "dark mode", "high contrast", "dyslexia", "colour blind", "color blind", "light theme", "default theme", "clear", "reset"],
      execute: async ({ input }) => { const reply = await processCommand(input); setAnswer(reply); return reply; },
    },
    {
      name: "telugu-questions",
      description: "Telugu questions answered over all employees",
      phrases: TELUGU_PHRASES,
      execute: async ({ input }) => { const reply = await processCommand(fromTelugu(input)); setAnswer(reply); return reply; },
    },
    {
      name: "all-employees",
      description: "Counts, filters, averages, departments and unusual rows over all employees in Neon",
      phrases: DATA_PHRASES,
      execute: ({ input }) => runQuestion(input),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [runQuestion]);

  const activeAction = QUICK_ACTIONS.find((a) => a.key === activeKey);
  const gridRows = override?.rows ?? page.rows;
  const hasState = Boolean(query.filters.length || query.search || query.sort || highlightIds.length || override || table.length);

  return (
    <>
      <Navbar />

      {/* Top padding clears the fixed navbar (60px mobile, ~68px desktop) */}
      <Container maxWidth="xl" sx={{ pt: { xs: "84px", lg: "96px" }, pb: 4, px: { xs: 2, sm: 3 } }}>
        {/* ─── HEADING ─── */}
        <Box className="is-dc2cb2d">
          <Stack direction="row" spacing={1} useFlexGap className="is-fd08d76">
            <Typography variant="h4" component="h1" className="is-be8e63c">Yuktai Grid Demo</Typography>
            <Chip label={`v${YUKTAI_VERSION} · Agentic AI`} size="small" className="is-8d83dc4" />
            <Chip icon={<StorageIcon />} label={loading && !page.total ? "Connecting…" : `${fmt(page.total)} employees in Neon`} size="small" variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary" className="is-68a09f7">
            Ask questions about every employee in the database · the server filters, sorts and summarises · your browser only loads one page
          </Typography>
        </Box>

        {/* ─── ASK THE DATA ─── */}
        <Card sx={{ borderRadius: 4, mb: 2, p: { xs: 1.5, sm: 2 }, bgcolor: "#f0fdf4", border: "1px solid #86efac" }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} useFlexGap className="is-fd08d76">
              <AutoAwesomeIcon className="is-20bb596" fontSize="small" />
              <Typography variant="body2" component="h2" color="#166534" className="is-db11729">Ask the data</Typography>
              {query.filters.map((f) => <Chip key={f.key} label={describeFilter(f)} size="small" variant="outlined" className="is-dcab718" />)}
              {query.search && <Chip label={`search: ${query.search}`} size="small" variant="outlined" className="is-dcab718" />}
              {highlightIds.length > 0 && <Chip label={`${highlightIds.length} highlighted`} size="small" sx={{ bgcolor: activeAction?.color ?? G, color: "#fff", fontSize: "0.7rem" }} />}
              {hasState && (
                <Button size="small" onClick={clearAll} startIcon={<CloseIcon size={14} />} className="is-966c142">Clear</Button>
              )}
              <Box className="is-a7667d4" />
              <Chip
                icon={<SmartToyRoundedIcon />}
                label="Or use the yuktai assistant in the grid (chat + voice)"
                size="small"
                className="is-07903ed"
              />
            </Stack>

            <Stack component="form" direction="row" spacing={1} onSubmit={(e) => { e.preventDefault(); void processCommand(question).then((reply) => setAnswer(reply)); }}>
              <TextField
                size="small" fullWidth value={question} onChange={(e) => setQuestion(e.target.value)}
                label="Ask a question about all employees"
                placeholder="e.g. salary over 1 lakh and age under 30"
                className="is-af4660a"
              />
              <Button type="submit" variant="contained" disabled={busy || !question.trim()} sx={{ bgcolor: G, textTransform: "none", "&:hover": { bgcolor: "#059669" } }}>
                {busy ? "…" : "Ask"}
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap className="is-14c2360">
              {QUICK_ACTIONS.map((action) => {
                const isActive = activeKey === action.key;
                return (
                  <Tooltip key={action.key} title={`Asks: “${action.question}”`} arrow>
                    <Button
                      size="small" variant={isActive ? "contained" : "outlined"} startIcon={action.icon}
                      onClick={() => toggleQuickAction(action)} disabled={busy} aria-pressed={isActive}
                      sx={{ textTransform: "none", fontSize: "0.8rem", bgcolor: isActive ? action.color : "transparent", color: isActive ? "#fff" : action.color, borderColor: action.color, "&:hover": { bgcolor: isActive ? action.color : `${action.color}15`, borderColor: action.color } }}
                    >
                      {action.label}
                    </Button>
                  </Tooltip>
                );
              })}
            </Stack>

            <Typography variant="body2" aria-live="polite" className="is-4c981be">{answer}</Typography>

            {table.length > 0 && (
              <Box className="is-18fac1f">
                <table className="is-0959bb4">
                  <caption className="is-4729d2c">Results by department</caption>
                  <thead>
                    <tr>{["Department", "Value", "Employees"].map((h) => <th key={h} scope="col" style={{ textAlign: h === "Department" ? "left" : "right", padding: "6px 12px", borderBottom: `1px solid ${BORDER}` }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {table.slice(0, 50).map((r) => (
                      <tr key={r.label}>
                        <td className="is-f522118">{r.label}</td>
                        <td className="is-cdebab9">{r.value}</td>
                        <td className="is-cdebab9">{fmt(r.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Stack>
        </Card>

        {/* ─── THEME ─── */}
        <Card sx={{ borderRadius: 4, mb: 2, p: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1} className="is-d0da858">
              <PaletteIcon color="primary" fontSize="small" />
              <Typography variant="body2" className="is-db11729">Theme</Typography>
              <Chip label={THEMES.find((t) => t.value === theme)?.label} size="small" color="primary" variant="outlined" />
            </Stack>
            <ToggleButtonGroup
              value={theme} exclusive onChange={(_e, v) => changeTheme(v)} size="small" aria-label="Grid theme selector"
              sx={{ flexWrap: "wrap", "& .MuiToggleButton-root": { px: 1.5, py: 0.5, textTransform: "none", fontSize: "0.8rem" } }}
            >
              {THEMES.map((t) => (
                <ToggleButton key={t.value} value={t.value} aria-label={`${t.label} theme`}>
                  <Stack direction="row" spacing={0.7} className="is-d0da858">
                    {t.icon}
                    <Box sx={{ display: { xs: "none", md: "inline" } }}>{t.label}</Box>
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Card>

        {/* ─── ERROR ─── */}
        {error && (
          <Card role="alert" className="is-0d6958e">
            <CloseIcon size={32} color="#dc2626" />
            <Typography variant="h6" className="is-930bf8a">Could not load employee data</Typography>
            <Typography color="text.secondary" className="is-57eca19">{error}</Typography>
            <Button className="is-3b07de8" onClick={() => void load(query)}>Try again</Button>
          </Card>
        )}

        {/* ─── GRID ─── */}
        <Card sx={{ borderRadius: 4, overflow: "hidden", p: { xs: 1, sm: 2 }, mb: 3 }}>
          {override && (
            <Stack direction="row" spacing={1} className="is-359ead3">
              <WarningIcon fontSize="small" className="is-610bd2f" />
              <Typography variant="body2" className="is-db11729">Showing {override.label}</Typography>
              <Button size="small" onClick={() => { setOverride(null); setHighlightIds([]); }} className="is-33831cd">Back to all employees</Button>
            </Stack>
          )}
          <YuktaiGrid
            data={gridRows}
            columns={columns}
            rowKey="rowId"
            loading={loading}
            search={false}
            pagination={false}
            view="auto"
            theme={theme}
            highlightIds={highlightIds}
            highlightColor={activeAction?.color ? `${activeAction.color}30` : "#FEF3C7"}
            autoScrollToHighlight
            ai
            webmcp
            toolName="aksharatantra_staff"
            locale="en-US"
            inputLanguage="en-IN"
            customRules={agentRules}
            onSortChange={(s) => setQuery((q) => ({ ...q, sort: s && s.direction ? { key: s.key, direction: s.direction } : null, page: 1 }))}
            empty={
              <Box className="is-78cd38b">
                <CloseIcon size={32} color="#94a3b8" />
                <Typography color="text.secondary" className="is-68a09f7">No employees match. Try “clear” to reset.</Typography>
              </Box>
            }
          />

          {/* Server-side pager */}
          {!override && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} className="is-3afa32d">
              <Typography variant="body2" color="text.secondary" aria-live="polite">
                {fmt(page.total)} employee(s) · page {fmt(query.page)} of {fmt(page.totalPages)}
              </Typography>
              <Stack direction="row" spacing={1} className="is-d0da858">
                <Typography variant="body2" component="label" htmlFor="page-size">Rows per page</Typography>
                <Select
                  size="small" value={query.pageSize} inputProps={{ id: "page-size" }}
                  onChange={(e) => setQuery((q) => ({ ...q, pageSize: Number(e.target.value), page: 1 }))}
                >
                  {PAGE_SIZES.filter((n) => n <= page.maxPageSize).map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
                <IconButton aria-label="Previous page" disabled={query.page <= 1 || loading} onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>
                  <ChevronLeftIcon size={20} />
                </IconButton>
                <IconButton aria-label="Next page" disabled={query.page >= page.totalPages || loading} onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>
                  <ChevronRightIcon size={20} />
                </IconButton>
              </Stack>
            </Stack>
          )}
        </Card>

        {/* ─── WHAT YOU CAN ASK ─── */}
        <Accordion className="is-4881ea9" defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} className="is-d0da858">
              <ListAltIcon fontSize="small" className="is-20bb596" />
              <Typography className="is-db11729">What you can ask</Typography>
              <Chip label="v5.1" size="small" className="is-52c886b" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.2}>
              <Typography variant="body2"><strong>🔢 Counts:</strong> &quot;how many employees&quot;, &quot;how many with salary over 1 lakh&quot;</Typography>
              <Typography variant="body2"><strong>🔎 Filters:</strong> &quot;salary over 1 lakh and age under 30&quot;, &quot;age between 25 and 35&quot;, &quot;name starts with Ravi&quot;. Amounts like 50k, 1.5 lakh and 2 crore work.</Typography>
              <Typography variant="body2"><strong>🏢 Departments:</strong> &quot;average salary by department&quot;, &quot;lowest average salary by department&quot;, &quot;Engineering&quot;</Typography>
              <Typography variant="body2"><strong>📅 Dates:</strong> &quot;joined this month&quot;, &quot;hired last week&quot;, &quot;how many joined this year&quot;</Typography>
              <Typography variant="body2"><strong>🏆 Rankings:</strong> &quot;top 10 by salary&quot;, &quot;highest salary&quot;, &quot;youngest&quot;, &quot;newest&quot;</Typography>
              <Typography variant="body2"><strong>⚠️ Unusual data:</strong> &quot;anything unusual?&quot;, &quot;unusual ages&quot;</Typography>
              <Typography variant="body2"><strong>🔁 Several steps:</strong> &quot;show salary over 50k, then sort by age, then summarize&quot;</Typography>
              <Typography variant="body2"><strong>🎨 Themes (chat):</strong> &quot;dark theme&quot;, &quot;high contrast&quot;, &quot;dyslexia&quot;. <strong>Reset:</strong> &quot;clear&quot;</Typography>
              <Typography variant="caption" color="text.secondary">
                yuktai understands the question in your browser with rules (no cloud AI); the database answers it over all rows. Unusual phrasing may need rewording.
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion className="is-4881ea9">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className="is-db11729">🎯 Grid controls (all 7 Yuktai icons)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><VolumeUpRoundedIcon className="is-8925140" /><Typography variant="body2"><strong>yuktai assistant:</strong> open the AI assistant built into the grid, type or speak a question (English or Telugu, e.g. &quot;ఎంత మంది&quot;). Data questions are answered over all employees.</Typography></Stack>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><SearchIcon size={20} color="#0D9488" /><Typography variant="body2"><strong>Search:</strong> type a name or department in the question box.</Typography></Stack>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><SortUpIcon size={20} color="#0D9488" /><Typography variant="body2"><strong>Sort ascending:</strong> click a column header; the server sorts all rows.</Typography></Stack>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><SortDownIcon size={20} color="#0D9488" /><Typography variant="body2"><strong>Sort descending:</strong> click again.</Typography></Stack>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><ChevronLeftIcon size={20} color="#0D9488" /><Typography variant="body2"><strong>Previous page</strong></Typography></Stack>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><ChevronRightIcon size={20} color="#0D9488" /><Typography variant="body2"><strong>Next page</strong></Typography></Stack>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><CheckIcon size={20} color="#10b981" /><Typography variant="body2"><strong>WCAG 2.2:</strong> keyboard and screen-reader ready.</Typography></Stack>
              <Stack direction="row" spacing={1.5} className="is-d0da858"><CloseIcon size={20} color="#dc2626" /><Typography variant="body2"><strong>Empty state:</strong> clear message when no rows match.</Typography></Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion className="is-d850e37">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} className="is-d0da858">
              <KeyboardIcon fontSize="small" color="primary" />
              <Typography className="is-db11729">Keyboard shortcuts</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={0.5}>
              <Typography variant="body2"><strong>Tab</strong>: move between controls and cells</Typography>
              <Typography variant="body2"><strong>Enter</strong>: send a question or activate a button</Typography>
              <Typography variant="body2"><strong>Esc</strong>: close any open dropdown</Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Box className="is-5b18880">
          <Stack direction="row" spacing={0.5} className="is-d866968">
            <CheckIcon size={14} color="#10b981" />
            <Typography variant="caption" color="text.secondary">
              Powered by{" "}
              <Typography component="a" href="https://www.npmjs.com/package/@yuktishaalaa/yuktai" target="_blank" rel="noopener noreferrer" variant="caption" sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none" }}>@yuktishaalaa/yuktai</Typography>
              {" "}v{YUKTAI_VERSION} · Next.js → FastAPI → Neon PostgreSQL
            </Typography>
          </Stack>
        </Box>
      </Container>

      <style>{`
        @keyframes yuktai-pulse {
          0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0   rgba(239,68,68,0.4); }
          50%      { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(239,68,68,0);   }
        }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>
    </>
  );
}
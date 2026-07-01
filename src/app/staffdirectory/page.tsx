"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Skeleton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
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
} from "@yuktishaalaa/yuktai";
// Icons
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CakeIcon from "@mui/icons-material/Cake";
import GroupsIcon from "@mui/icons-material/Groups";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ContrastIcon from "@mui/icons-material/Contrast";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MenuBookIcon from "@mui/icons-material/MenuBook";

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://yuktishaalaa-ai.vercel.app";

// ─────────────────────────────────────────────────────────────────────────────
// Row type for YuktaiGrid
// ─────────────────────────────────────────────────────────────────────────────
interface EmployeeRow extends Record<string, unknown> {
  rowId:  string | number;
  name:   string;
  salary: number;
  age:    number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme options for switcher
// ─────────────────────────────────────────────────────────────────────────────
const THEMES: { value: GridTheme; label: string; icon: React.ReactNode }[] = [
  { value: "default",        label: "Default",       icon: <LightModeIcon fontSize="small" /> },
  { value: "high-contrast",  label: "High Contrast", icon: <ContrastIcon fontSize="small" /> },
  { value: "dark",           label: "Dark",          icon: <DarkModeIcon fontSize="small" /> },
  { value: "color-blind",    label: "Color Blind",   icon: <VisibilityIcon fontSize="small" /> },
  { value: "dyslexia",       label: "Dyslexia",      icon: <MenuBookIcon fontSize="small" /> },
];

const STORAGE_KEY = "yuktai-grid-theme";

export default function Home() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [theme,     setTheme]     = useState<GridTheme>("default");

  // ── Load saved theme from localStorage on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as GridTheme | null;
    if (saved && THEMES.some(t => t.value === saved)) {
      setTheme(saved);
    }
  }, []);

  // ── Persist theme when changed ──
  const handleThemeChange = (_e: unknown, newTheme: GridTheme | null) => {
    if (!newTheme) return;
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    }
  };

  // ── Fetch employee data ──
  useEffect(() => {
    fetch(`${API_BASE_URL}/employee/employees`)
      .then((response) => response.json())
      .then((data: unknown[]) => {
        setEmployees(Array.isArray(data) ? (data as EmployeeRow[]) : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const rows: EmployeeRow[] = useMemo(
    () =>
      employees.map((emp, idx) => ({
        rowId:  (emp.id as string | number) ?? idx,
        name:   String(emp.name ?? "Unknown"),
        salary: Number(emp.salary ?? 0),
        age:    emp.age == null ? null : Number(emp.age),
      })),
    [employees]
  );

  const maxSalary = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.max(...rows.map((r) => r.salary || 0));
  }, [rows]);

  const avgAge = useMemo(() => {
    if (rows.length === 0) return 0;
    const totalAge = rows.reduce((a, b) => a + (b.age || 0), 0);
    return Math.round(totalAge / rows.length);
  }, [rows]);

  const columns: GridColumn<EmployeeRow>[] = [
    { key: "name",   label: "Name",   sortable: true },
    {
      key:      "age",
      label:    "Age",
      type:     "number",
      sortable: true,
      align:    "right",
      render:   (value) => (value == null ? "N/A" : `${value} yrs`),
    },
    {
      key:      "salary",
      label:    "Salary",
      type:     "number",
      sortable: true,
      align:    "right",
      render:   (value) =>
        value == null ? "N/A" : `₹${Number(value).toLocaleString("en-IN")}`,
    },
  ];

  return (
    <>
      <Navbar />
      <Box sx={{ mt: 2 }} />
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 3 } }}
      >

        {/* ─── PAGE HEADING ─── */}
        <Box mb={3}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            yuktai Grid Demo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accessible AI-powered data grid · 5 WCAG themes · mobile-first · zero API key
          </Typography>
        </Box>

        {/* ─── USER GUIDE AT TOP ─── */}
        <UserGuide />

        {/* ─── SUMMARY CARDS ─── */}
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} mb={{ xs: 3, md: 4 }} mt={1}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <SummaryCard
              icon={<GroupsIcon />}
              color="primary.light"
              label="Employees"
              value={loading ? null : rows.length}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <SummaryCard
              icon={<CurrencyRupeeIcon />}
              color="success.light"
              label="Highest Salary"
              value={loading ? null : `₹${maxSalary.toLocaleString("en-IN")}`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <SummaryCard
              icon={<CakeIcon />}
              color="info.light"
              label="Average Age"
              value={loading ? null : `${avgAge} Yrs`}
            />
          </Grid>
        </Grid>

        {/* ─── THEME SWITCHER ─── */}
        <Card sx={{ borderRadius: 4, mb: 2, overflow: "hidden" }}>
          <CardContent sx={{ py: { xs: 1.5, sm: 2 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaletteIcon color="primary" fontSize="small" />
                <Typography variant="body2" fontWeight={600}>
                  Theme
                </Typography>
                <Chip
                  label={THEMES.find(t => t.value === theme)?.label}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>

              <ToggleButtonGroup
                value={theme}
                exclusive
                onChange={handleThemeChange}
                size="small"
                aria-label="Grid theme selector"
                sx={{
                  flexWrap: "wrap",
                  "& .MuiToggleButton-root": {
                    px: 1.5,
                    py: 0.5,
                    textTransform: "none",
                    fontSize: "0.8rem",
                  },
                }}
              >
                {THEMES.map((t) => (
                  <ToggleButton
                    key={t.value}
                    value={t.value}
                    aria-label={`${t.label} theme`}
                  >
                    <Tooltip title={t.label} arrow>
                      <Stack direction="row" alignItems="center" spacing={0.7}>
                        {t.icon}
                        <Box sx={{ display: { xs: "none", md: "inline" } }}>
                          {t.label}
                        </Box>
                      </Stack>
                    </Tooltip>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </CardContent>
        </Card>

        {/* ─── ERROR STATE ─── */}
        {!loading && error && (
          <EmptyState
            title="Couldn't load employee data"
            subtitle="Check your connection and try refreshing the page."
          />
        )}

        {/* ─── YUKTAI GRID ─── */}
        {!error && (
          <Card sx={{ borderRadius: 4, overflow: "hidden", p: { xs: 1, sm: 2 } }}>
            <YuktaiGrid
              data={rows}
              columns={columns}
              rowKey="rowId"
              loading={loading}
              search={true}
              view="auto"
              theme={theme}
              pagination={{ pageSize: 10 }}
              empty={
                <Box
                  sx={{
                    display:        "flex",
                    flexDirection:  "column",
                    alignItems:     "center",
                    justifyContent: "center",
                    py:             6,
                  }}
                >
                  <SentimentDissatisfiedIcon
                    sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    No employees match your search
                  </Typography>
                </Box>
              }
            />
          </Card>
        )}
      </Container>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Guide
// ─────────────────────────────────────────────────────────────────────────────
function UserGuide() {
  return (
    <Card sx={{ borderRadius: 4, mb: 3, overflow: "hidden" }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
          mb={1}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AccessibilityNewIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              How to use this grid
            </Typography>
          </Stack>
          <Chip
            label="Accessible · Free · Open source"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: { sm: "auto" } }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          A step-by-step guide. No login. No setup. Works on any device.
        </Typography>
      </CardContent>

      {/* Step 1 — Theme */}
      <Accordion defaultExpanded disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.light", width: 32, height: 32 }}>
              <PaletteIcon fontSize="small" />
            </Avatar>
            <Typography fontWeight={600}>Step 1 — Change the theme</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" mb={1.5}>
            Use the <strong>theme switcher</strong> below the summary cards to pick what works best for you:
          </Typography>
          <Stack spacing={0.8} pl={1}>
            <Typography variant="body2">🌞 <strong>Default</strong> — Standard WCAG AA contrast (4.5:1)</Typography>
            <Typography variant="body2">🔆 <strong>High Contrast</strong> — WCAG AAA · 7:1 ratio · best for low vision</Typography>
            <Typography variant="body2">🌙 <strong>Dark</strong> — Easier on eyes in low light</Typography>
            <Typography variant="body2">👁 <strong>Color Blind</strong> — Patterns + safe palette (Deuteranopia, Protanopia, Tritanopia)</Typography>
            <Typography variant="body2">📖 <strong>Dyslexia</strong> — Atkinson Hyperlegible font + extra spacing</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" mt={1.5} display="block">
            ✨ Your choice is saved automatically — it stays the same next time you visit.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Step 2 — Search */}
      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "success.light", width: 32, height: 32 }}>
            <SearchIcon size={18} />
            </Avatar>
            <Typography fontWeight={600}>Step 2 — Search employees</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" mb={1.5}>
            Type any name in the <strong>search box</strong> at the top of the grid.
          </Typography>
          <Typography variant="body2">
            The grid filters instantly across all columns — name, age, and salary.
            Indic language names (Telugu, Hindi, Tamil) work too.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Step 3 — Sort */}
      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "info.light", width: 32, height: 32 }}>
              <SortUpIcon size={18} />
            </Avatar>
            <Typography fontWeight={600}>Step 3 — Sort columns</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" mb={1}>
            Click any <strong>column header</strong> to sort:
          </Typography>
          <Stack spacing={0.5} pl={1}>
            <Typography variant="body2">▲ First click — ascending (A → Z, low → high)</Typography>
            <Typography variant="body2">▼ Second click — descending (Z → A, high → low)</Typography>
            <Typography variant="body2">— Third click — clears the sort</Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Step 4 — Keyboard */}
      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "warning.light", width: 32, height: 32 }}>
              <KeyboardIcon fontSize="small" />
            </Avatar>
            <Typography fontWeight={600}>Step 4 — Keyboard navigation</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" mb={1}>
            No mouse needed. Use the keyboard:
          </Typography>
          <Stack spacing={0.5} pl={1}>
            <Typography variant="body2"><strong>Tab</strong> — Move between cells</Typography>
            <Typography variant="body2"><strong>Arrow keys</strong> — Move within the grid</Typography>
            <Typography variant="body2"><strong>Enter</strong> — Activate a cell or button</Typography>
            <Typography variant="body2"><strong>Esc</strong> — Close any open dropdown</Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Step 5 — Screen Reader */}
      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "secondary.light", width: 32, height: 32 }}>
              <VolumeUpIcon fontSize="small" />
            </Avatar>
            <Typography fontWeight={600}>Step 5 — Screen reader support</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" mb={1}>
            The grid follows the <strong>WAI-ARIA grid pattern</strong>. Works with:
          </Typography>
          <Stack spacing={0.5} pl={1}>
            <Typography variant="body2">• NVDA (Windows · free)</Typography>
            <Typography variant="body2">• JAWS (Windows)</Typography>
            <Typography variant="body2">• VoiceOver (Mac/iOS · built-in)</Typography>
            <Typography variant="body2">• TalkBack (Android · built-in)</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" mt={1.5} display="block">
            Row position, column name, and cell value are announced automatically.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ p: 2, bgcolor: "grey.50", textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Powered by{" "}
          <Typography
            component="a"
            href="https://www.npmjs.com/package/@yuktishaalaa/yuktai"
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none" }}
          >
            @yuktishaalaa/yuktai
          </Typography>
          {" "}— accessibility + AI for Next.js · free forever
        </Typography>
      </Box>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Card
// ─────────────────────────────────────────────────────────────────────────────
function SummaryCard({
  icon,
  color,
  label,
  value,
}: {
  icon:  React.ReactNode;
  color: string;
  label: string;
  value: string | number | null;
}) {
  return (
    <Card sx={{ borderRadius: 4, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: color, width: 44, height: 44 }}>{icon}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography color="text.secondary" variant="body2">
              {label}
            </Typography>
            {value === null ? (
              <Skeleton variant="text" width={80} height={32} />
            ) : (
              <Typography variant="h5" fontWeight="bold" noWrap>
                {value}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty / Error state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ textAlign: "center", py: { xs: 5, sm: 7 } }}>
        {/* Updated CloseIcon */}
        <CloseIcon /> 
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}
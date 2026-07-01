"use client";

import { useEffect, useMemo, useState } from "react";
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

// ── MUI icons — kept where yuktai has no equivalent ──────────
import PaletteIcon      from "@mui/icons-material/Palette";
import ExpandMoreIcon   from "@mui/icons-material/ExpandMore";
import LightModeIcon    from "@mui/icons-material/LightMode";
import DarkModeIcon     from "@mui/icons-material/DarkMode";
import ContrastIcon     from "@mui/icons-material/Contrast";
import VisibilityIcon   from "@mui/icons-material/Visibility";
import MenuBookIcon     from "@mui/icons-material/MenuBook";
import KeyboardIcon     from "@mui/icons-material/Keyboard";

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://yuktishaalaa-ai.vercel.app";

const STORAGE_KEY = "yuktai-grid-theme";

// ─────────────────────────────────────────────────────────────
// Row type
// ─────────────────────────────────────────────────────────────
interface EmployeeRow extends Record<string, unknown> {
  rowId:  string | number;
  name:   string;
  salary: number;
  age:    number | null;
}

// ─────────────────────────────────────────────────────────────
// Theme options for switcher
// ─────────────────────────────────────────────────────────────
const THEMES: { value: GridTheme; label: string; icon: React.ReactNode }[] = [
  { value: "default",       label: "Default",       icon: <LightModeIcon fontSize="small" /> },
  { value: "high-contrast", label: "High Contrast", icon: <ContrastIcon  fontSize="small" /> },
  { value: "dark",          label: "Dark",          icon: <DarkModeIcon  fontSize="small" /> },
  { value: "color-blind",   label: "Color Blind",   icon: <VisibilityIcon fontSize="small" /> },
  { value: "dyslexia",      label: "Dyslexia",      icon: <MenuBookIcon  fontSize="small" /> },
];

export default function Home() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [theme,     setTheme]     = useState<GridTheme>("default");

  // ── Load saved theme ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as GridTheme | null;
    if (saved && THEMES.some((t) => t.value === saved)) {
      setTheme(saved);
    }
  }, []);

  // ── Persist theme ──
  const handleThemeChange = (_e: unknown, newTheme: GridTheme | null) => {
    if (!newTheme) return;
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newTheme);
    }
  };

  // ── Fetch employees ──
  useEffect(() => {
    fetch(`${API_BASE_URL}/employee/employees`)
      .then((res) => res.json())
      .then((data: unknown[]) => {
        setEmployees(Array.isArray(data) ? (data as EmployeeRow[]) : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  // ── Map API rows to grid rows ──
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

      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>

        {/* ─── PAGE HEADING ─── */}
        <Box mb={3}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Yuktai Grid Demo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accessible AI-powered data grid · 5 WCAG themes · mobile-first · zero API key
          </Typography>
        </Box>

        {/* ─── THEME SWITCHER ─── */}
        <Card sx={{ borderRadius: 4, mb: 2, p: { xs: 1.5, sm: 2 } }}>
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
                label={THEMES.find((t) => t.value === theme)?.label}
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
                  px:            1.5,
                  py:            0.5,
                  textTransform: "none",
                  fontSize:      "0.8rem",
                },
              }}
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

        {/* ─── ERROR STATE ─── */}
        {!loading && error && (
          <Card sx={{ borderRadius: 4, p: 4, mb: 2, textAlign: "center" }}>
            {/* yuktai CloseIcon for error indicator */}
            <CloseIcon size={40} color="#dc2626" />
            <Typography variant="h6" fontWeight="bold" mt={1.5}>
              Could not load employee data
            </Typography>
            <Typography color="text.secondary" mt={0.5}>
              Check your connection and try refreshing the page.
            </Typography>
          </Card>
        )}

        {/* ─── YUKTAI GRID ─── */}
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
              empty={
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CloseIcon size={32} color="#94a3b8" />
                  <Typography color="text.secondary" mt={1}>
                    No employees match your search
                  </Typography>
                </Box>
              }
            />
          </Card>
        )}

        {/* ─── GRID CONTROLS OVERVIEW (uses ALL 7 yuktai icons) ─── */}
        <Accordion sx={{ borderRadius: 4, mb: 2 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Grid Controls Overview</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>

              {/* 1. Search — SearchIcon */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <SearchIcon size={20} color="#0D9488" />
                <Typography variant="body2">
                  <strong>Search:</strong> Real-time filtering across all columns.
                  Type in the box above the grid — supports Indic languages too.
                </Typography>
              </Stack>

              {/* 2. Sort ascending — SortUpIcon */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <SortUpIcon size={20} color="#0D9488" />
                <Typography variant="body2">
                  <strong>Sort ascending:</strong> First click on any column header
                  sorts A → Z or low → high.
                </Typography>
              </Stack>

              {/* 3. Sort descending — SortDownIcon */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <SortDownIcon size={20} color="#0D9488" />
                <Typography variant="body2">
                  <strong>Sort descending:</strong> Second click on same header
                  sorts Z → A or high → low. Third click clears the sort.
                </Typography>
              </Stack>

              {/* 4. Previous page — ChevronLeftIcon */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ChevronLeftIcon size={20} color="#0D9488" />
                <Typography variant="body2">
                  <strong>Previous page:</strong> Navigate one page back in
                  the pagination bar at the bottom of the grid.
                </Typography>
              </Stack>

              {/* 5. Next page — ChevronRightIcon */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ChevronRightIcon size={20} color="#0D9488" />
                <Typography variant="body2">
                  <strong>Next page:</strong> Move to the next page of results.
                </Typography>
              </Stack>

              {/* 6. Success/Enabled — CheckIcon */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <CheckIcon size={20} color="#10b981" />
                <Typography variant="body2">
                  <strong>WCAG 2.2 compliant:</strong> Keyboard navigation, screen
                  reader support, and 44×44 px touch targets — all built in.
                </Typography>
              </Stack>

              {/* 7. Empty state — CloseIcon */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <CloseIcon size={20} color="#dc2626" />
                <Typography variant="body2">
                  <strong>Empty state:</strong> When no rows match your search or
                  the data source is empty, a clear message appears in the grid.
                </Typography>
              </Stack>

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
          </Stack>
        </Box>
      </Container>
    </>
  );
}
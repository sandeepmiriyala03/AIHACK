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
} from "@mui/material";
import { YuktaiGrid, type GridColumn } from "@yuktishaalaa/yuktai";
import PlatformOverview from "@/components/PlatformOverview";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CakeIcon from "@mui/icons-material/Cake";
import GroupsIcon from "@mui/icons-material/Groups";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import Navbar from "@/components/Navbar";

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic production URL handler
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://yuktishaalaa-ai.vercel.app";

// ─────────────────────────────────────────────────────────────────────────────
// Row type — must extend Record<string, unknown> for YuktaiGrid generics
// ─────────────────────────────────────────────────────────────────────────────
interface EmployeeRow extends Record<string, unknown> {
  rowId:  string | number;
  name:   string;
  salary: number;
  age:    number | null;
}

export default function Home() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/employee/employees`)
      .then((response) => response.json())
      .then((data: unknown[]) => {
        setEmployees(Array.isArray(data) ? data as EmployeeRow[] : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // ── Only non-sensitive fields are surfaced ──
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

  // ─────────────────────────────────────────────────────────────────────────
  // Yuktai grid columns
  // ─────────────────────────────────────────────────────────────────────────
  const columns: GridColumn<EmployeeRow>[] = [
    {
      key:      "name",
      label:    "Name",
      sortable: true,
    },
    {
      key:      "age",
      label:    "Age",
      type:     "number",
      sortable: true,
      align:    "right",
      render:   (value) =>
        value == null ? "N/A" : `${value} yrs`,
    },
    {
      key:      "salary",
      label:    "Salary",
      type:     "number",
      sortable: true,
      align:    "right",
      render:   (value) =>
        value == null
          ? "N/A"
          : `₹${Number(value).toLocaleString("en-IN")}`,
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
        <PlatformOverview />

        {/* ─── Summary Analytics Section ─── */}
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} mb={{ xs: 3, md: 4 }}>
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

        {/* ─── Error state ─── */}
        {!loading && error && (
          <EmptyState
            title="Couldn't load employee data"
            subtitle="Check your connection and try refreshing the page."
          />
        )}

        {/* ─── YuktaiGrid (replaces MUI DataGrid) ─── */}
        {!error && (
          <Card sx={{ borderRadius: 4, overflow: "hidden", p: { xs: 1, sm: 2 } }}>
            <YuktaiGrid
              data={rows}
              columns={columns}
              rowKey="rowId"
              loading={loading}
              search={true}
              view="auto"
              theme="default"
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
// Reusable Summary Card
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
        <SentimentDissatisfiedIcon
          sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }}
        />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}
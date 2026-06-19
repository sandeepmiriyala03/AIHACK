"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import PlatformOverview from "@/components/PlatformOverview";
import SearchIcon from "@mui/icons-material/Search";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CakeIcon from "@mui/icons-material/Cake";
import GroupsIcon from "@mui/icons-material/Groups";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import Navbar from "@/components/Navbar";

// Dynamic production URL handler
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://yuktishaalaa-ai.vercel.app";

export default function Home() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/employee/employees`)
      .then((response) => response.json())
      .then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // Only non-sensitive fields are surfaced: no employee ID, no department ID.
  // A stable internal row id is still required by DataGrid, derived but never shown.
  const rows = useMemo(
    () =>
      employees.map((emp, idx) => ({
        rowId: emp.id ?? idx,
        name: emp.name || "Unknown",
        salary: emp.salary ?? 0,
        age: emp.age ?? null,
      })),
    [employees]
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const maxSalary = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.max(...rows.map((r) => r.salary || 0));
  }, [rows]);

  const avgAge = useMemo(() => {
    if (rows.length === 0) return 0;
    const totalAge = rows.reduce((a, b) => a + (b.age || 0), 0);
    return Math.round(totalAge / rows.length);
  }, [rows]);

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "age",
      headerName: "Age",
      width: 110,
      type: "number",
      valueFormatter: (value) => (value == null ? "N/A" : `${value} yrs`),
    },
    {
      field: "salary",
      headerName: "Salary",
      flex: 1,
      minWidth: 160,
      type: "number",
      valueFormatter: (value) =>
        value == null ? "N/A" : `₹${Number(value).toLocaleString("en-IN")}`,
    },
  ];

  return (
    <>
      <Navbar />
      <Box sx={{ mt: 2 }} />
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <PlatformOverview />

        {/* Summary Analytics Section */}
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

        {/* Search */}
        <Card sx={{ mb: { xs: 2, md: 3 }, borderRadius: 4 }}>
          <CardContent sx={{ py: { xs: 2, sm: 2.5 } }}>
            <TextField
              fullWidth
              size="small"
              label="Search employee by name"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {!loading && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                {filteredRows.length} {filteredRows.length === 1 ? "result" : "results"}
                {search ? ` for "${search}"` : ""}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Error state */}
        {!loading && error && (
          <EmptyState
            title="Couldn't load employee data"
            subtitle="Check your connection and try refreshing the page."
          />
        )}

        {/* Data Grid */}
        {!error && (
          <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ width: "100%" }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(row) => row.rowId}
                loading={loading}
                autoHeight
                disableColumnMenu
                disableRowSelectionOnClick
                density="comfortable"
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  sorting: { sortModel: [{ field: "name", sort: "asc" }] },
                }}
                pageSizeOptions={[10, 25, 50]}
                slots={{
                  noRowsOverlay: () => (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 6,
                      }}
                    >
                      <SentimentDissatisfiedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                      <Typography color="text.secondary">No employees match your search</Typography>
                    </Box>
                  ),
                }}
                sx={{
                  border: "none",
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: "grey.100",
                    fontWeight: "bold",
                  },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                    outline: "none",
                  },
                  "& .MuiDataGrid-row:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              />
            </Box>
          </Card>
        )}
      </Container>
    </>
  );
}

function SummaryCard({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
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

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ textAlign: "center", py: { xs: 5, sm: 7 } }}>
        <SentimentDissatisfiedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}
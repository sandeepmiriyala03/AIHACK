"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid, // Note: For modern MUI v5+, consider switching to Grid2 if you use newer layouts
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CakeIcon from "@mui/icons-material/Cake";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/Groups";
import Navbar from "@/components/Navbar";
// Dynamic production URL handler
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://yuktishaalaa-ai.vercel.app";

export default function Home() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    // Hits the live production API URL now!
    fetch(`${API_BASE_URL}/employee/employees`)
      .then((response) => response.json())
      .then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching employees:", error);
        setLoading(false);
      });
  }, []);

  const filteredEmployees = useMemo(() => {
    let data = [...employees];

    data = data.filter((emp) =>
      emp.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === "id") {
      data.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    if (sortBy === "name") {
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    if (sortBy === "salary") {
      data.sort((a, b) => (b.salary || 0) - (a.salary || 0));
    }

    return data;
  }, [employees, search, sortBy]);

  // Reset to page 1 if search filters out rows below current pagination depth
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;

  const pagedEmployees = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Safe Math Computations (Won't crash if employees list is empty)
  const maxSalary = useMemo(() => {
    if (employees.length === 0) return 0;
    return Math.max(...employees.map((x) => x.salary || 0));
  }, [employees]);

  const avgAge = useMemo(() => {
    if (employees.length === 0) return 0;
    const totalAge = employees.reduce((a, b) => a + (b.age || 0), 0);
    return Math.round(totalAge / employees.length);
  }, [employees]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ mt: 2 }} />
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold">
            Yuktishaalaa AI
          </Typography>
          <Typography color="text.secondary">
            Employee Management Dashboard
          </Typography>
        </CardContent>
      </Card>

      {/* Summary Analytics Section */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.light" }}>
                  <GroupsIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary">Employees</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {employees.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "success.light" }}>
                  <CurrencyRupeeIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary">Highest Salary</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₹{maxSalary.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "info.light" }}>
                  <CakeIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary">Average Age</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {avgAge} Yrs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Control Panel */}
      <Card sx={{ mb: 4, borderRadius: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Search Employee by Name"
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="id">ID</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="salary">Salary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Employee Grid Stream */}
      <Grid container spacing={3}>
        {pagedEmployees.map((emp) => (
          <Grid key={emp.id} size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                borderRadius: 4,
                height: "100%",
                transition: "all .3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: "grey.200", color: "grey.700" }}>
                    <PersonIcon />
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" fontWeight="bold">
                        {emp.name || "Unknown"}
                      </Typography>

                      <Box>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Profile">
                          <IconButton size="small" color="warning">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                      <Chip size="small" variant="outlined" label={`ID: ${emp.id}`} />
                      <Chip size="small" color="success" variant="soft" icon={<CurrencyRupeeIcon />} label={`${emp.salary}`} />
                      <Chip size="small" variant="outlined" icon={<CakeIcon />} label={`Age: ${emp.age}`} />
                      <Chip size="small" color="info" variant="soft" icon={<BusinessIcon />} label={`Dept: ${emp.departmentid || 'N/A'}`} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {pagedEmployees.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textCol: "text.secondary", textAlign: "center", py: 6 }}>
              <Typography variant="subtitle1">No employees found matching your filters.</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Pagination Controls */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <Pagination
          page={page}
          count={totalPages}
          color="primary"
          onChange={(_, value) => setPage(value)}
        />
      </Box>
    </Container>
    </>
  );
}
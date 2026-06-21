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
  Chip,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CodeIcon from "@mui/icons-material/Code";
import BugReportIcon from "@mui/icons-material/BugReport";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import Navbar from "@/components/Navbar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://yuktishaalaa-ai.vercel.app";


export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/users`)
      .then((response) => response.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const rows = useMemo(
    () =>
      users.map((user, idx) => ({
        id: user.id ?? idx,
        username: user.username || "Unknown Team Member",
        role: user.role || "Developer",
      })),
    [users]
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.username.toLowerCase().includes(q));
  }, [rows, search]);

  const getRoleConfig = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return { color: "#dc2626", bg: "#fef2f2", icon: <AdminPanelSettingsIcon fontSize="small" /> };
      case "developer":
        return { color: "#2563eb", bg: "#eff6ff", icon: <CodeIcon fontSize="small" /> };
      case "qa":
        return { color: "#d97706", bg: "#fffbeb", icon: <BugReportIcon fontSize="small" /> };
      default:
        return { color: "#4b5563", bg: "#f3f4f6", icon: <GroupsIcon fontSize="small" /> };
    }
  };

  return (
    <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", pb: 6, color: "#0f172a" }}>
      {/* Platform Navigation */}
      <Navbar />
      
      {/* Structural Offset: Clear height gap to prevent fixed Navbar from covering text */}
      <Box sx={{ height: { xs: "56px", sm: "64px", md: "72px" } }} />

      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 3, sm: 4, md: 6 },
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        
        {/* --- Header & Analytics Block --- */}
        <Grid container spacing={3} mb={5} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="800" sx={{ color: "#0f172a", letterSpacing: "-0.025em" }}>
              Team Workspace Contributors
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
              Manage access control policies, audit platform accounts, and handle developer roles.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, bgcolor: "#f8fafc", boxShadow: "none", border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: "16px !important" }}>
                <Avatar sx={{ bgcolor: "#eff6ff", color: "#2563eb", width: 40, height: 40 }}>
                  <GroupsIcon />
                </Avatar>
                <Box>
                  <Typography sx={{ color: "#64748b", fontWeight: 500 }} variant="caption">Total Members</Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: "#0f172a" }}>
                    {loading ? <Skeleton width={40} /> : rows.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* --- Minimal Search Configuration --- */}
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: "none", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <CardContent>
            <TextField
              fullWidth
              size="small"
              label="Filter team member by workspace handle"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#0f172a",
                  "& fieldset": { borderColor: "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#cbd5e1" },
                  "&.Mui-focused fieldset": { borderColor: "#0f172a" },
                },
                "& .MuiInputLabel-root": { color: "#64748b" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#0f172a" }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* --- Error Fallback UI --- */}
        {error && (
          <EmptyState title="Platform Service Disconnected" subtitle="Unable to establish a link with Neon PostgreSQL database backend." />
        )}

        {/* --- Responsive Light Grid View --- */}
        {!error && (
          <>
            {loading ? (
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((n) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                    <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            ) : filteredRows.length === 0 ? (
              <EmptyState title="No active accounts discovered" subtitle="Your search query yielded zero records inside our schema." />
            ) : (
              <Grid container spacing={3}>
                {filteredRows.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          bgcolor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            borderColor: "#94a3b8",
                            boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
                          },
                        }}
                      >
                        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: 3 }}>
                          {/* Top: Avatar and Entity Identifier */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                bgcolor: roleConfig.bg,
                                color: roleConfig.color,
                                fontWeight: "700",
                                border: `1px solid ${roleConfig.color}30`,
                                width: 40,
                                height: 40,
                                fontSize: "1rem"
                              }}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="caption" sx={{ color: "#94a3b8", fontFamily: "monospace", fontWeight: 600 }}>
                              UID_{user.id}
                            </Typography>
                          </Box>

                          {/* Middle: Clear Typography */}
                          <Box>
                            <Typography variant="h6" fontWeight="700" noWrap sx={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
                              {user.username}
                            </Typography>
                          </Box>

                          {/* Bottom: Refined Flat Badges */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 2, borderTop: "1px solid #f1f5f9" }}>
                            <Chip
                              icon={roleConfig.icon}
                              label={user.role}
                              size="small"
                              sx={{
                                bgcolor: roleConfig.bg,
                                color: roleConfig.color,
                                border: `1px solid ${roleConfig.color}30`,
                                fontWeight: 600,
                                borderRadius: "6px",
                                "& .MuiChip-icon": { color: "inherit" }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: "#64748b", 
                                fontWeight: 500,
                                cursor: "pointer", 
                                "&:hover": { color: "#000000" },
                                transition: "color 0.15s"
                              }}
                            >
                              Details →
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card sx={{ borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "none", mt: 2 }}>
      <CardContent sx={{ textAlign: "center", py: 6 }}>
        <SentimentDissatisfiedIcon sx={{ fontSize: 40, color: "#94a3b8", mb: 1.5 }} />
        <Typography variant="subtitle1" fontWeight="700" sx={{ color: "#0f172a" }} gutterBottom>{title}</Typography>
        <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 380, mx: "auto" }}>{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}
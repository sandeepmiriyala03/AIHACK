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

import { Search as SearchIcon } from "../../lib/yuktai-icons";
import { Groups as GroupsIcon } from "../../lib/yuktai-icons";
import { AdminPanelSettings as AdminPanelSettingsIcon } from "../../lib/yuktai-icons";
import { Code as CodeIcon } from "../../lib/yuktai-icons";
import { BugReport as BugReportIcon } from "../../lib/yuktai-icons";
import { SentimentDissatisfied as SentimentDissatisfiedIcon } from "../../lib/yuktai-icons";
import Navbar from "@/components/Navbar";

// Standardize absolute routing directly to your production instance
const API_BASE_URL = "https://yuktishaalaa-ai.vercel.app";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Sanitized to handle the exact live production endpoint directly
    fetch(`${API_BASE_URL}/users/users`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Double safety check: unpack standard nested results if wrapped by backend router
        const cleanData = Array.isArray(data) 
          ? data 
          : (data && Array.isArray(data.users) ? data.users : []);
          
        setUsers(cleanData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Production Data Load Error:", err);
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
    <Box className="is-3a7decf">
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
            <Typography variant="h4" fontWeight="800" className="is-6cdbe26">
              Team Workspace Contributors
            </Typography>
            <Typography variant="body2" className="is-34c99a7">
              Manage access control policies, audit platform accounts, and handle developer roles.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="is-3722d53">
              <CardContent className="is-4349b6a">
                <Avatar className="is-13c5fe4">
                  <GroupsIcon />
                </Avatar>
                <Box>
                  <Typography className="is-3882234" variant="caption">Total Members</Typography>
                  <Typography variant="h5" fontWeight="700" className="is-743d48d">
                    {loading ? <Skeleton width={40} /> : rows.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* --- Minimal Search Configuration --- */}
        <Card className="is-52c8214">
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
                    <SearchIcon fontSize="small" className="is-28e6a79" />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* --- Error Fallback UI --- */}
        {error && (
          <EmptyState title="Platform Service Disconnected" subtitle="Unable to establish a link with database backend." />
        )}

        {/* --- Responsive Light Grid View --- */}
        {!error && (
          <>
            {loading ? (
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((n) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                    <Skeleton variant="rounded" height={160} className="is-838095d" />
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
                        <CardContent className="is-b049c15">
                          {/* Top: Avatar and Entity Identifier */}
                          <Box className="is-948e6d6">
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
                            <Typography variant="caption" className="is-550e119">
                              UID_{user.id}
                            </Typography>
                          </Box>

                          {/* Middle: Clear Typography */}
                          <Box>
                            <Typography variant="h6" fontWeight="700" noWrap className="is-02d70a3">
                              {user.username}
                            </Typography>
                          </Box>

                          {/* Bottom: Refined Flat Badges */}
                          <Box className="is-dfe7ac3">
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
    <Card className="is-8612595">
      <CardContent className="is-b9599b2">
        <SentimentDissatisfiedIcon className="is-d4a45c9" />
        <Typography variant="subtitle1" fontWeight="700" className="is-743d48d" gutterBottom>{title}</Typography>
        <Typography variant="body2" className="is-aa6e401">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}
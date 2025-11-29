"use client";

import { useState } from "react";

// MUI Components
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Grid,
  Paper,
  Stack,
  Divider,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarIcon from "@mui/icons-material/Star";
import LockIcon from "@mui/icons-material/Lock";
import BoltIcon from "@mui/icons-material/Bolt";
import LanguageIcon from "@mui/icons-material/Language";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";

// Your Components
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import ShareSection from "@/components/SocailMedia/ShareSection";

type SectionKey =
  | "hero"
  | "mission"
  | "features"
  | "howItWorks"
  | "whyChoose"
  | "privacy";

export default function About() {
  const [expanded, setExpanded] = useState<SectionKey | false>("hero");

  const handleToggle =
    (key: SectionKey) =>
    (_: any, isExpanded: boolean): void => {
      setExpanded(isExpanded ? key : false);
    };

  return (
    <>
      <Navbar />

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* PAGE HEADER */}
        <Box textAlign="center" sx={{ mb: 10 }}>
          <Typography variant="h3" fontWeight="800" gutterBottom>
            About <span style={{ color: "#1976d2" }}>AksharaTantra</span>
          </Typography>

          <Typography variant="h6" sx={{ maxWidth: 700, mx: "auto", color: "text.secondary" }}>
            A multilingual OCR + Vedic processing engine — private, offline-first, smart,
            and built for the next generation.
          </Typography>
        </Box>

        {/* ===================== SECTIONS ===================== */}
        <Stack spacing={3}>

          {/* HERO */}
          <Accordion expanded={expanded === "hero"} onChange={handleToggle("hero")}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StarIcon color="warning" /> Welcome to AksharaTantra
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                AksharaTantra makes text extraction simple and private. Upload multilingual
                images and extract clean, editable text instantly.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* MISSION */}
          <Accordion expanded={expanded === "mission"} onChange={handleToggle("mission")}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LanguageIcon color="success" /> Our Mission
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                To make global information accessible in any language — with full privacy.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* FEATURES */}
          <Accordion expanded={expanded === "features"} onChange={handleToggle("features")}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BoltIcon color="primary" /> Key Features
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Grid container spacing={2}>
                {[
                  "🌍 34+ languages including Telugu & Sanskrit",
                  "⚡ Fast OCR powered by optimized Tesseract",
                  "📱 PWA support on all devices",
                  "🧠 Smart cleanup + Vedic pitch marking",
                ].map((item, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Paper sx={{ p: 2 }} elevation={2}>
                      {item}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* HOW IT WORKS */}
          <Accordion expanded={expanded === "howItWorks"} onChange={handleToggle("howItWorks")}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MobileFriendlyIcon color="secondary" /> How It Works
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Grid container spacing={3}>
                {[
                  { title: "Upload", desc: "Upload single or bulk files" },
                  { title: "OCR Extract", desc: "Processing is done locally" },
                  { title: "Export", desc: "HTML, EPUB, JSON, Book mode" },
                ].map((s, i) => (
                  <Grid item xs={12} md={4} key={i}>
                    <Paper sx={{ p: 3 }} elevation={3}>
                      <Typography variant="h6">{s.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {s.desc}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* WHY CHOOSE US */}
          <Accordion expanded={expanded === "whyChoose"} onChange={handleToggle("whyChoose")}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">❤️ Why Choose Us?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                <Typography>• Completely free</Typography>
                <Typography>• Offline-first architecture</Typography>
                <Typography>• No uploads — 100% local OCR</Typography>
                <Typography>• Best for Vedic + multilingual workflows</Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* PRIVACY */}
          <Accordion expanded={expanded === "privacy"} onChange={handleToggle("privacy")}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LockIcon color="error" /> Privacy & Security
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Typography>
                No data leaves your device. No server. No cloud. Total privacy.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Stack>

        {/* ===================== CTA ===================== */}
        <Box textAlign="center" sx={{ mt: 10 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            href="/upload"
            sx={{ px: 6, py: 2 }}
          >
            🚀 Try AksharaTantra Now
          </Button>

          <Divider sx={{ my: 5 }} />

          {/* SHARE SECTION */}
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Enjoying AksharaTantra? Share it with your friends and colleagues!      <ShareSection />
          </Typography>

     
        </Box>
      </Container>

      <GoToTopButton />
    </>
  );
}

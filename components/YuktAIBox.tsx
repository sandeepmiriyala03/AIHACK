"use client";

import { useState } from "react";
import YuktAI from "yuktai-js";

import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
  Grid,
} from "@mui/material";

export default function Page() {
  const [docTab, setDocTab] = useState(0);
  const [demoTab, setDemoTab] = useState(0);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const runAI = async () => {
    const res = await YuktAI.run("ai.text", input || "Hello");
    setOutput(res);
  };

  const runOCR = async () => {
    if (!file) return alert("Upload image");
    const res = await YuktAI.run("image.ocr.smart", { file });
    setOutput(typeof res === "string" ? res : res?.text || "");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6, mt: { xs: 6, md: 8 } }}>

      {/* 🔥 HERO WITH LOGO */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection={{ xs: "column", md: "row" }}
        gap={4}
        mb={8}
      >
        {/* LOGO */}
        <Box
          component="img"
          src="/Log one.png"
          alt="YuktAI Logo"
          sx={{
            width: { xs: 120, md: 160 },
            borderRadius: 3,
            bgcolor: "#020617",
            p: 1,
          }}
        />

        {/* TEXT */}
        <Box textAlign={{ xs: "center", md: "left" }}>
          <Typography
            variant={isMobile ? "h4" : "h2"}
            fontWeight={900}
            sx={{
              background: "linear-gradient(90deg, #7b61ff, #00c6ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            YuktAI
          </Typography>

          <Typography variant="h6" color="text.secondary" mt={1}>
           AI Engine ,Do more with less
          </Typography>

          <Typography variant="body2" mt={1}>
            Built by Sandeep Miriyala
          </Typography>

          <Box mt={2}>
            <Typography
              variant="caption"
              sx={{
                px: 2,
                py: 0.5,
                bgcolor: "#ede9fe",
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              🚧 Early Stage • Open Source • Actively Building
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ⚡ FRAMEWORK SUPPORT */}
      <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography variant="h6">⚡ Works with your stack</Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2} textAlign="center">
          {[
            { name: "Angular", icon: "🅰️" },
            { name: "Next.js", icon: "▲" },
            { name: "React", icon: "⚛️" },
          ].map((fw) => (
            <Grid item xs={4} key={fw.name}>
              <Typography fontSize={28}>{fw.icon}</Typography>
              <Typography fontWeight={600}>{fw.name}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* 🧠 DESCRIPTION */}
      <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography>
          YuktAI is built using a vibe coding approach — 50% human thinking and
          50% AI assistance. It is a lightweight, open-source AI runtime that
          works directly inside your apps without heavy dependencies.
        </Typography>
      </Paper>

      {/* 🌍 VISION */}
      <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography>
          This project is just getting started 🚀. We are building a complete AI
          ecosystem with text, OCR (Tesseract-based), voice, and plugin systems.
          Many more features are coming soon.
        </Typography>
      </Paper>

      {/* ⚙️ HOW IT WORKS */}
      <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography variant="h6">⚙️ How It Works</Typography>
        <Divider sx={{ my: 2 }} />

        <Typography align="center">
          UI → YuktAI Runtime → Plugin → Output
        </Typography>
      </Paper>

      {/* 📦 USAGE */}
      <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography variant="h6">📦 Usage</Typography>
        <Divider sx={{ my: 2 }} />

        <Box component="pre" sx={{ fontSize: 13 }}>
{`npm install git+https://github.com/sandeepmiriyala03/yuktai.git

import YuktAI from "yuktai-js";

await YuktAI.run("ai.text", "Hello");
await YuktAI.run("image.ocr.smart", { file });`}
        </Box>
      </Paper>

      {/* 📘 DOCUMENTATION */}
      <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography variant="h6">📘 Documentation</Typography>
        <Divider sx={{ my: 2 }} />

        <Tabs value={docTab} onChange={(e, v) => setDocTab(v)}>
          <Tab label="Angular" />
          <Tab label="Next.js" />
          <Tab label="React" />
        </Tabs>

        <Box mt={2}>
          <Box component="pre">
{`import YuktAI from "yuktai-js";
await YuktAI.run("ai.text", "Hello");`}
          </Box>
        </Box>
      </Paper>

      {/* 🚀 DEMO */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6">🚀 Demo</Typography>
        <Divider sx={{ my: 2 }} />

        <Tabs
          value={demoTab}
          onChange={(e, v) => setDemoTab(v)}
          variant="fullWidth"
        >
          <Tab label="AI Text" />
          <Tab label="OCR" />
        </Tabs>

        <Box mt={2}>
          {demoTab === 0 && (
            <>
              <TextField
                fullWidth
                placeholder="Enter prompt..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button variant="contained" fullWidth onClick={runAI}>
                Run AI
              </Button>
            </>
          )}

          {demoTab === 1 && (
            <>
              <Button variant="outlined" component="label" fullWidth>
                Upload Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFile(e.target.files?.[0] || null)
                  }
                />
              </Button>

              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={runOCR}
              >
                Run OCR
              </Button>
            </>
          )}
        </Box>

        {/* OUTPUT */}
        <Box mt={3}>
          <Typography variant="subtitle2">Output</Typography>

          <Box
            sx={{
              mt: 1,
              p: 2,
              bgcolor: "#0f172a",
              color: "#fff",
              borderRadius: 2,
              minHeight: 120,
              whiteSpace: "pre-wrap",
            }}
          >
            {output || "Result will appear here..."}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
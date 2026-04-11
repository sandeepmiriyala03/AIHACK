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
    <Container maxWidth="md" sx={{ py: 6, mt: { xs: 8, md: 10 } }}>

      {/* 🔥 HERO */}
      <Box textAlign="center" mb={6}>
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
      </Box>

      {/* 🧠 DESCRIPTION */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="body1">
          YuktAI is a lightweight AI engine that you built and hosted on GitHub.
          Instead of publishing to npm, you can directly install and use it
          inside your Next.js project. It works like any other library and can
          process text, voice, and plugins through a simple runtime system.
        </Typography>
      </Paper>

      {/* ⚙️ HOW IT WORKS */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6">⚙️ How It Works</Typography>
        <Divider sx={{ my: 2 }} />

        <Typography variant="body2">
          UI Input → YuktAI Runtime → Plugin Execution → Result Output
        </Typography>
      </Paper>

      {/* 📦 USAGE */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6">📦 Usage</Typography>
        <Divider sx={{ my: 2 }} />

        <Box component="pre" sx={{ fontSize: 13 }}>
{`npm install git+https://github.com/sandeepmiriyala03/yuktai.git

import YuktAI from "yuktai-js";

await YuktAI.run("ai.text", "Hello");
await YuktAI.run("image.ocr.smart", { file });`}
        </Box>
      </Paper>

      {/* 📘 DOCUMENTATION (TABS) */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6">📘 Documentation</Typography>
        <Divider sx={{ my: 2 }} />

        <Tabs
          value={docTab}
          onChange={(e, v) => setDocTab(v)}
          variant={isMobile ? "scrollable" : "standard"}
        >
          <Tab label="Angular" />
          <Tab label="Next.js" />
          <Tab label="React" />
        </Tabs>

        <Box mt={2}>
          {docTab === 0 && (
            <Box component="pre">
{`// Angular
import YuktAI from "yuktai-js";

await YuktAI.run("ai.text", "Hello Angular");`}
            </Box>
          )}

          {docTab === 1 && (
            <Box component="pre">
{`// Next.js
"use client";
import YuktAI from "yuktai-js";

await YuktAI.run("ai.text", "Hello Next.js");`}
            </Box>
          )}

          {docTab === 2 && (
            <Box component="pre">
{`// React
import YuktAI from "yuktai-js";

await YuktAI.run("ai.text", "Hello React");`}
            </Box>
          )}
        </Box>
      </Paper>

      {/* 🚀 DEMO (TABS) */}
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

              <Button variant="contained" onClick={runAI} fullWidth>
                Run AI
              </Button>
            </>
          )}

          {demoTab === 1 && (
            <>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}
              >
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

              <Button variant="contained" onClick={runOCR} fullWidth>
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
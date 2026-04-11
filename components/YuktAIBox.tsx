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

  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const runAI = async () => {
    setLoading(true);
    const start = performance.now();

    const res = await YuktAI.run("ai.text", input || "Hello");

    const end = performance.now();
    setTime(end - start);

    setOutput(res);
    setLoading(false);
  };

  const runOCR = async () => {
    if (!file) return alert("Upload image");

    setLoading(true);
    const start = performance.now();

    const res = await YuktAI.run("image.ocr.smart", { file });

    const end = performance.now();
    setTime(end - start);

    setOutput(typeof res === "string" ? res : res?.text || "");
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6, mt: { xs: 6, md: 8 } }}>

      {/* 🔥 HERO */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection={{ xs: "column", md: "row" }}
        gap={4}
        mb={8}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="YuktAI Logo"
          sx={{
            width: { xs: 120, md: 160 },
            borderRadius: 3,
            bgcolor: "#020617",
            p: 1,
          }}
        />

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
            AI Engine • Do More with Less
          </Typography>

          <Typography variant="body2" mt={1}>
            Built by Sandeep Miriyala
          </Typography>

          <Typography variant="caption" mt={2} display="block">
            🚧 Early Stage • Open Source • 50% Human • 50% AI • 100% Dream
          </Typography>
        </Box>
      </Box>

      {/* ⚡ FRAMEWORKS */}
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

      {/* 📦 USAGE */}
      <Paper sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography variant="h6">📦 Usage</Typography>
        <Divider sx={{ my: 2 }} />

        <Box
          component="pre"
          sx={{
            fontSize: 13,
            overflowX: "auto",
            bgcolor: "#0f172a",
            color: "#fff",
            p: 2,
            borderRadius: 2,
          }}
        >
{`npm install git+https://github.com/sandeepmiriyala03/yuktai.git

import YuktAI from "yuktai-js";

await YuktAI.run("ai.text", "Hello");
await YuktAI.run("image.ocr.smart", { file });`}
        </Box>

        <Button
          size="small"
          sx={{ mt: 1 }}
          onClick={() =>
            navigator.clipboard.writeText(
              "npm install git+https://github.com/sandeepmiriyala03/yuktai.git"
            )
          }
        >
          Copy Install Command
        </Button>
      </Paper>

      {/* 📘 DOCS */}
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

              <Button
                variant="contained"
                fullWidth
                onClick={runAI}
                disabled={loading}
              >
                {loading ? "Processing..." : "Run AI"}
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
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    if (f) setPreview(URL.createObjectURL(f));
                  }}
                />
              </Button>

              {preview && (
                <Box mt={2} textAlign="center">
                  <img
                    src={preview}
                    alt="preview"
                    style={{ maxWidth: "100%", borderRadius: 8 }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={runOCR}
                disabled={loading}
              >
                {loading ? "Processing..." : "Run OCR"}
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
              position: "relative",
              whiteSpace: "pre-wrap",
            }}
          >
            <Button
              size="small"
              sx={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => navigator.clipboard.writeText(output)}
            >
              Copy
            </Button>

            {loading ? "Processing..." : output || "Result will appear here..."}
          </Box>

          {/* ⏱ TIME */}
          {time && (
            <Typography variant="caption" display="block" mt={1}>
              ⏱️ {(time / 1000).toFixed(2)}s
            </Typography>
          )}

          {/* 🧠 META */}
          {output && (
            <Box mt={2}>
              <Typography variant="caption">
                🌐 Language: Auto-detected
              </Typography>
              <br />
              <Typography variant="caption">
                ⚙️ Engine: YuktAI Runtime
              </Typography>
              <br />
              <Typography variant="caption">
                💻 Device: Browser
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
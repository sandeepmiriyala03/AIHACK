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
  Grid,
} from "@mui/material";

export default function Page() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<number | null>(null);

  // CLEAR
  const handleClear = () => {
    setInput("");
    setOutput("");
    setFile(null);
    setTime(null);

    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  // CANCEL
  const handleCancel = () => {
    setLoading(false);
    setOutput("⛔ Cancelled");
  };

  // AI
  const runAI = async () => {
    try {
      setLoading(true);
      setOutput("");
      setTime(null);

      const start = performance.now();
      const res = await YuktAI.run("ai.text", input || "Hello");
      const end = performance.now();

      setTime(end - start);
      setOutput(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setOutput("❌ AI Error");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 OCR FIXED (MAIN FIX)
  const runOCR = async () => {
    if (!file) return setOutput("⚠️ Upload image first");

    try {
      setLoading(true);
      setOutput("");
      setTime(null);

      const start = performance.now();

      // ✅ Convert to ArrayBuffer
      const buffer = await file.arrayBuffer();

      // ✅ Send to YuktAI
      const res = await YuktAI.run("image.ocr.smart", {
        file: buffer,
        name: file.name,
        type: file.type,
      });

      const end = performance.now();

      setTime(end - start);

      // ✅ Better output formatting
      if (typeof res === "string") {
        setOutput(res);
      } else if (res?.text) {
        setOutput(
          `🧠 Text:\n${res.text}\n\n🎯 Confidence: ${res.confidence || 0}%`
        );
      } else {
        setOutput(JSON.stringify(res, null, 2));
      }
    } catch (e) {
      console.error(e);
      setOutput("❌ OCR Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      {/* HERO */}
      <Box textAlign="center" mb={5}>
        <Box component="img" src="/logo.png" sx={{ width: 120, mb: 2 }} />

        <Typography variant="h4" fontWeight={800}>
          YuktAI
        </Typography>

        <Typography color="text.secondary">
          AI Engine • Do More with Less
        </Typography>

        <Typography variant="caption" display="block" mt={1}>
          🚀 Open Source • 50% Human • 50% AI
        </Typography>
      </Box>

      {/* FRAMEWORKS */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6">Works with</Typography>
        <Divider sx={{ my: 1 }} />

        <Grid container spacing={2} textAlign="center">
          {[
            { name: "Angular", icon: "🅰️" },
            { name: "Next.js", icon: "▲" },
            { name: "React", icon: "⚛️" },
          ].map((f) => (
            <Grid item xs={4} key={f.name}>
              <Typography fontSize={24}>{f.icon}</Typography>
              <Typography>{f.name}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* DEMO */}
      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
          <Tab label="AI" />
          <Tab label="OCR" />
        </Tabs>

        <Box mt={2}>
          {/* AI */}
          {tab === 0 && (
            <>
              <TextField
                fullWidth
                placeholder="Enter prompt"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={runAI}
                disabled={loading || !input}
              >
                {loading ? "Running..." : "Run AI"}
              </Button>
            </>
          )}

          {/* OCR */}
          {tab === 1 && (
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

                    if (preview) URL.revokeObjectURL(preview);
                    if (f) setPreview(URL.createObjectURL(f));
                  }}
                />
              </Button>

              {preview && (
                <Box mt={2}>
                  <img
                    src={preview}
                    style={{ width: "100%", borderRadius: 6 }}
                  />
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                onClick={runOCR}
                disabled={loading || !file}
              >
                {loading ? "Running..." : "Run OCR"}
              </Button>
            </>
          )}
        </Box>

        {/* OUTPUT */}
        <Box mt={3}>
          <Typography variant="subtitle2">Output</Typography>

          <Box
            sx={{
              bgcolor: "#111",
              color: "#fff",
              p: 2,
              borderRadius: 1,
              minHeight: 100,
              mt: 1,
              whiteSpace: "pre-wrap",
            }}
          >
            {loading ? "Processing..." : output || "No output"}
          </Box>

          {time && (
            <Typography variant="caption" mt={1} display="block">
              ⏱ {(time / 1000).toFixed(2)}s
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
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
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";

import ImageIcon from "@mui/icons-material/Image";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Page() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // OCR
  const handleOCR = async () => {
    if (!file) return alert("Upload image");

    try {
      setLoading(true);
      const res = await YuktAI.run("image.ocr.smart", { file });
      setOutput(typeof res === "string" ? res : res?.text || "");
    } catch (e: any) {
      setOutput("❌ OCR Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // AI
  const handleAI = async () => {
    if (!input) return;

    try {
      setLoading(true);
      const res = await YuktAI.run("ai.text", input);
      setOutput(res);
    } catch (e: any) {
      setOutput("❌ AI Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => navigator.clipboard.writeText(output);

  const handleClear = () => {
    setOutput("");
    setFile(null);
    setInput("");
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      
      {/* 🔥 HEADER (FIXED + VISIBLE) */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" fontWeight={700}>
          YuktAI
        </Typography>

        <Typography variant="h6" color="text.secondary">
          Open Source AI Engine — Do more with less
        </Typography>

        <Typography variant="body2" mt={1} color="text.secondary">
          by Sandeep Miriyala
        </Typography>
      </Box>

      {/* 🔥 MAIN CARD */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        
        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          centered
          sx={{ mb: 3 }}
        >
          <Tab icon={<ImageIcon />} label="OCR" />
          <Tab icon={<SmartToyIcon />} label="AI" />
        </Tabs>

        {/* OCR TAB */}
        {tab === 0 && (
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

            {file && (
              <Box mb={2}>
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  style={{
                    width: "100%",
                    borderRadius: 10,
                  }}
                />
              </Box>
            )}

            <Button
              variant="contained"
              startIcon={<ImageIcon />}
              onClick={handleOCR}
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Run OCR"}
            </Button>
          </>
        )}

        {/* AI TAB */}
        {tab === 1 && (
          <>
            <TextField
              fullWidth
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              startIcon={<SmartToyIcon />}
              onClick={handleAI}
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Run AI"}
            </Button>
          </>
        )}
      </Paper>

      {/* 🔥 OUTPUT */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
        <Typography variant="h6">Output</Typography>

        <Box
          sx={{
            mt: 2,
            whiteSpace: "pre-wrap",
            minHeight: 120,
            bgcolor: "#f5f5f5",
            p: 2,
            borderRadius: 2,
          }}
        >
          {output || "Result will appear here..."}
        </Box>

        {output && (
          <Box mt={2} display="flex" gap={1} justifyContent="center">
            <Button
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              variant="outlined"
            >
              Copy
            </Button>

            <Button
              startIcon={<DeleteIcon />}
              onClick={handleClear}
              color="error"
              variant="outlined"
            >
              Clear
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
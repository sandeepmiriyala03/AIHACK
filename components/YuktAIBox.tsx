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
} from "@mui/material";

import SmartToyIcon from "@mui/icons-material/SmartToy";
import ImageIcon from "@mui/icons-material/Image";

export default function Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // 🔹 Text AI
  const handleRun = async () => {
    if (!input) return;

    const res = await YuktAI.run("ai.text", input);
    setOutput(res);
  };

  // 🔹 OCR
  const handleOCR = async () => {
    if (!file) {
      alert("Please upload an image");
      return;
    }

    const res = await YuktAI.run("image.ocr", { file });

    setOutput(typeof res === "string" ? res : JSON.stringify(res, null, 2));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      
      {/* 🔥 Branding */}
      <Typography variant="h4" gutterBottom>
        YuktAI
      </Typography>

      <Typography color="text.secondary" mb={3}>
        AI Engine — Do more with less
      </Typography>

      {/* 🤖 AI SECTION */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🤖 AI
        </Typography>

        <Typography variant="body2" mb={2}>
          {'Use "ai.text" plugin easily'}
        </Typography>

        <TextField
          fullWidth
          placeholder="Type something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          startIcon={<SmartToyIcon />}
          onClick={handleRun}
          fullWidth
        >
          Run AI
        </Button>
      </Paper>

      {/* 📷 OCR SECTION */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📷 OCR (Image → Text)
        </Typography>

        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ mb: 2 }}
        >
          Upload Image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Button>

        <Button
          variant="contained"
          startIcon={<ImageIcon />}
          onClick={handleOCR}
          fullWidth
        >
          Run OCR
        </Button>
      </Paper>

      {/* 🔹 OUTPUT */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Output</Typography>

        <Box
          sx={{
            mt: 2,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 14,
          }}
        >
          {output}
        </Box>
      </Paper>
    </Container>
  );
}
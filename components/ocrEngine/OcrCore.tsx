"use client";

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";

export default function OcrCore({
  file,
  language,
  onResult,
}: {
  file: File | null;
  language: string;
  onResult?: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const runOCR = async () => {
    if (!file) return;

    setLoading(true);

    // TODO: Replace with real Tesseract.js OCR logic
    setTimeout(() => {
      const fakeText = `Extracted text for: ${file.name} (${language})`;

      // 👍 ESLint-safe version (no unused-expression warning)
      if (onResult) {
        onResult(fakeText);
      }

      setLoading(false);
    }, 1000);
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        disabled={loading || !file}
        onClick={runOCR}
        startIcon={<BoltIcon />}
      >
        {loading ? "Processing..." : "Run OCR"}
      </Button>

      {!file && (
        <Typography color="text.secondary" mt={1}>
          Upload an image first.
        </Typography>
      )}
    </Box>
  );
}

"use client";

import { useState } from "react";
import { Box, Button, Typography, LinearProgress } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

import { ocrRecognizeImage } from "@/components/ocrEngine/ocrWorker";

const LANG_LABELS: Record<string, string> = {
  tel: "Telugu",
  san: "Sanskrit",
  sa: "Sanskrit",
  hin: "Hindi",
  eng: "English",
  tam: "Tamil",
  kan: "Kannada",
  mal: "Malayalam",
};

export default function BulkOcrProcessor({
  files = [],          // 🔥 DEFAULT VALUE (fixes crash)
  language,
  onComplete,
}: {
  files?: File[];      // 🔥 optional type (fixes crash)
  language: string;
  onComplete?: (results: string[]) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const startBulk = async () => {
    if (!files || files.length === 0) return;   // 🔥 safe guard

    setProcessing(true);
    setCurrentPage(0);
    setProgress(0);
    setProgressText("");

    const langLabel = LANG_LABELS[language] ?? language.toUpperCase();
    const results: string[] = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentPage(i + 1);

      const text = await ocrRecognizeImage(files[i], language, (m) => {
        if (m.status === "recognizing text") {
          const pct = ((m.progress ?? 0) * 100) | 0;

          setProgressText(
            `Page ${i + 1}/${files.length} — OCR ${langLabel}: ${pct}%`
          );
          setProgress(pct);
        }
      });

      results.push(text);
    }

    setProcessing(false);
    setProgress(100);
    setProgressText("Bulk OCR complete");

    onComplete?.(results);
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="secondary"
        disabled={processing || files.length === 0}   // 🔥 safe: always array
        onClick={startBulk}
        startIcon={<AutoFixHighIcon />}
      >
        {processing ? "Processing..." : "Run Bulk OCR"}
      </Button>

      {files.length === 0 && (
        <Typography color="text.secondary" mt={1}>
          Upload images first.
        </Typography>
      )}

      {processing && (
        <Box mt={2}>
          <Typography fontSize="0.85rem" color="text.secondary">
            {progressText}
          </Typography>

          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />

          <Typography mt={1} fontSize="0.8rem" color="text.secondary">
            {progress}% complete
          </Typography>
        </Box>
      )}
    </Box>
  );
}

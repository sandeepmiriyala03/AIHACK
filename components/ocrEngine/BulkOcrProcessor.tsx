"use client";

import { useState, useEffect } from "react";
import { Box, Button, Typography, LinearProgress } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { ocrRecognizeImage } from "@/components/ocrEngine/ocrWorker";

const LANG_LABELS: Record<string, string> = {
  ara: "Arabic",
  asm: "Assamese",
  ben: "Bengali",
  bod: "Bodo",
  chi_sim: "Chinese (Simplified)",
  chi_tra: "Chinese (Traditional)",
  deu: "German",
  eng: "English",
  fra: "French",
  guj: "Gujarati",
  hin: "Hindi",
  ita: "Italian",
  jpn: "Japanese",
  kan: "Kannada",
  kor: "Korean",
  mal: "Malayalam",
  mar: "Marathi",
  nep: "Nepali",
  nld: "Dutch",
  ori: "Odia",
  osd: "Orientation & Script Detection",
  pan: "Punjabi",
  por: "Portuguese",
  rus: "Russian",
  san: "Sanskrit",
  snd: "Sindhi",
  spa: "Spanish",
  swe: "Swedish",
  tam: "Tamil",
  tel: "Telugu",
  tha: "Thai",
  tur: "Turkish",
  urd: "Urdu",
  vie: "Vietnamese",

  // aliases
  sa: "Sanskrit",
};


export default function BulkOcrProcessor({
  files = [],
  language,
  onComplete,
  autoStart = false, // NEW PROP
}: {
  files?: File[];
  language: string;
  onComplete?: (results: string[]) => void;
  autoStart?: boolean; // NEW PROP
}) {
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const startBulk = async () => {
    if (!files || files.length === 0) return;

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
          const pct = Math.floor((m.progress ?? 0) * 100);
          setProgress(pct);
          setProgressText(`Page ${i + 1}/${files.length} — OCR ${langLabel}: ${pct}%`);
        }
      });

      results.push(text);
    }

    setProcessing(false);
    setProgress(100);
    setProgressText("Bulk OCR complete");

    onComplete?.(results);
  };

  // Auto-start OCR when autoStart becomes true
  useEffect(() => {
    if (autoStart && !processing && files.length > 0) {
      startBulk();
    }
  }, [autoStart]);

  return (
    <Box>
      <Button
        variant="contained"
        color="secondary"
        disabled={processing || files.length === 0}
        onClick={startBulk}
        startIcon={<AutoFixHighIcon />}
      >
        {processing ? "Processing..." : "Run Bulk OCR"}
      </Button>

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

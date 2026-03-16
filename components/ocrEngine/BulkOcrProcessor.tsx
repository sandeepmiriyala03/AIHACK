"use client";

import { useState, useEffect, useCallback } from "react";
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
};

/* ---------- NORMALIZE OCR LANGUAGE ---------- */
function normalizeOcrLang(lang: string): string {
  // OSD cannot run alone
  if (lang === "osd") return "osd+eng";

  // Indic / complex scripts work better with +eng
  const needEnglish = ["san", "ori", "asm", "bod"];
  if (needEnglish.includes(lang)) return `${lang}+eng`;

  return lang;
}

type BulkOcrProcessorProps = {
  files?: File[];
  language: string;
  onComplete?: (results: string[]) => void;
  autoStart?: boolean;
};

export default function BulkOcrProcessor({
  files = [],
  language,
  onComplete,
  autoStart = false,
}: BulkOcrProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  /* ---------- BULK OCR ---------- */
  const startBulk = useCallback(async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    setProgressText("");

    const ocrLang = normalizeOcrLang(language);
    const langLabel = LANG_LABELS[language] ?? language.toUpperCase();
    const results: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const text = await ocrRecognizeImage(files[i], ocrLang, (m) => {
        if (m.status === "recognizing text") {
          const pct = Math.floor((m.progress ?? 0) * 100);
          const overall =
            Math.floor(((i + pct / 100) / files.length) * 100);

          setProgress(overall);
          setProgressText(
            `Page ${i + 1}/${files.length} — OCR ${langLabel}: ${pct}%`
          );
        }
      });

      if (!text?.trim()) {
        console.warn(`OCR failed: page ${i + 1}, lang=${ocrLang}`);
      }

      results.push(text || "");
    }

    setProcessing(false);
    setProgress(100);
    setProgressText("Bulk OCR complete");

    onComplete?.(results);
  }, [files, language, onComplete]);

  /* ---------- AUTO START ---------- */
  useEffect(() => {
    if (autoStart && !processing && files.length > 0) {
      startBulk();
    }
  }, [autoStart, processing, files.length, startBulk]);

  /* ---------- UI ---------- */
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

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1 }}
          />

          <Typography mt={1} fontSize="0.8rem" color="text.secondary">
            {progress}% complete
          </Typography>
        </Box>
      )}
    </Box>
  );
}

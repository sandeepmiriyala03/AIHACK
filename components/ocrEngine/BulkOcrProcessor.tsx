"use client";

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

export default function BulkOcrProcessor({
  files,
  language,
  onComplete,
}: {
  files: File[];
  language: string;
  onComplete?: (results: string[]) => void;
}) {
  const [processing, setProcessing] = useState<boolean>(false);

  const startBulk = () => {
    setProcessing(true);

    // Fake bulk OCR simulation
    setTimeout(() => {
      const results: string[] = files.map(
        (f, i) => `Page ${i + 1}: Extracted content (${language})`
      );

      // FIXED: Proper call without unused-expression warning
      if (onComplete) {
        onComplete(results);
      }

      setProcessing(false);
    }, 1000);
  };

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

      {files.length === 0 && (
        <Typography color="text.secondary" mt={1}>
          Upload images first.
        </Typography>
      )}
    </Box>
  );
}

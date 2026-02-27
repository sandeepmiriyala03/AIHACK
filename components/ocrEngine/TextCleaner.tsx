"use client";

import { Box, Button } from "@mui/material";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

export default function TextCleaner({
  text,
  onClean,
}: {
  text: string;
  onClean?: (cleaned: string) => void;
}) {
  const cleanText = () => {
    const cleaned = text
      .replace(/\s+/g, " ")
      .replace(/[^\S\r\n]+/g, " ")
      .trim();

    if (onClean) {
      onClean(cleaned);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        color="warning"
        onClick={cleanText}
        startIcon={<CleaningServicesIcon />}
      >
        Clean OCR Text
      </Button>
    </Box>
  );
}

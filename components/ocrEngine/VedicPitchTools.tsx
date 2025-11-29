"use client";

import { Box, Button } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function VedicPitchTools({
  onApplyPitch,
}: {
  onApplyPitch?: (mark: string) => void;
}) {
  return (
    <Box display="flex" gap={2}>
      <Button
        variant="contained"
        color="success"
        startIcon={<ArrowUpwardIcon />}
        onClick={() => onApplyPitch && onApplyPitch("̍")}
      >
        High Pitch (Udatta)
      </Button>

      <Button
        variant="contained"
        color="error"
        startIcon={<ArrowDownwardIcon />}
        onClick={() => onApplyPitch && onApplyPitch("̱")}
      >
        Low Pitch (Anudatta)
      </Button>
    </Box>
  );
}

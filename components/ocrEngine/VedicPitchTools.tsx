"use client";

import { Box, Button } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function VedicPitchTools({
  onApplyPitch,
}: {
  onApplyPitch: (type: "high" | "low") => void;
}) {
  return (
    <Box display="flex" gap={2}>
      <Button
        variant="contained"
        color="success"
        startIcon={<ArrowUpwardIcon />}
        onClick={() => onApplyPitch("high")}
      >
        High Pitch
      </Button>

      <Button
        variant="contained"
        color="primary"
        startIcon={<ArrowDownwardIcon />}
        onClick={() => onApplyPitch("low")}
      >
        Low Pitch
      </Button>
    </Box>
  );
}

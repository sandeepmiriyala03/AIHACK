"use client";

import { Box, Button, Tooltip } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DragHandleIcon from "@mui/icons-material/DragHandle";

type PitchType = "high" | "low" | "svarita";

type VedicPitchToolsProps = {
  onApplyPitch: (type: PitchType) => void;
  disabled?: boolean; // disable when no text selection
};

export default function VedicPitchTools({
  onApplyPitch,
  disabled = false,
}: VedicPitchToolsProps) {
  return (
    <Box display="flex" gap={1} flexWrap="wrap">
      <Tooltip title="Udātta (High pitch)">
        <span>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<ArrowUpwardIcon />}
            disabled={disabled}
            onClick={() => onApplyPitch("high")}
          >
            Udātta
          </Button>
        </span>
      </Tooltip>

      <Tooltip title="Anudātta (Low pitch)">
        <span>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<ArrowDownwardIcon />}
            disabled={disabled}
            onClick={() => onApplyPitch("low")}
          >
            Anudātta
          </Button>
        </span>
      </Tooltip>

      <Tooltip title="Svarita (Combined / falling pitch)">
        <span>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<DragHandleIcon />}
            disabled={disabled}
            onClick={() => onApplyPitch("svarita")}
          >
            Svarita
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}

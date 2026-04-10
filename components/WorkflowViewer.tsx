"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import DownloadIcon from "@mui/icons-material/Download";
import InsightsIcon from "@mui/icons-material/Insights";

export default function WorkflowViewer() {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/arch/upload.png";
    link.download = "workflow.png";
    link.click();
  };

  return (
    <div className="mb-8 text-center">

      {/* 🔘 BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md mx-auto"
        aria-label="View workflow diagram"
      >
        <InsightsIcon />
        Workflow of this Page
      </button>

      {/* 🪟 DIALOG */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="lg"
        aria-labelledby="workflow-dialog"
      >
        <DialogContent className="bg-white dark:bg-gray-900">

          {/* 🔧 TOOLBAR */}
          <div className="flex justify-between items-center mb-3">

            <h3 className="font-semibold text-lg">
              🧠 Upload Page Workflow
            </h3>

            <div className="flex gap-2">

              <Tooltip title="Zoom In">
                <IconButton onClick={() => setZoom((z) => z + 0.2)}>
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Zoom Out">
                <IconButton onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}>
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download">
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Close">
                <IconButton onClick={() => setOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>

            </div>
          </div>

          {/* 🖼️ IMAGE */}
          <div className="flex justify-center overflow-auto">
            <img
              src="/arch/upload.png"
              alt="Upload workflow diagram"
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.2s ease",
              }}
              className="rounded-lg"
            />
          </div>

          {/* 📄 DESCRIPTION */}
          <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
            End-to-end workflow: Upload → Processing → NLP → Local AI → Answer
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
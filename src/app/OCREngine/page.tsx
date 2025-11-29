"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

/* ---------------- MATERIAL UI ---------------- */
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LanguageIcon from "@mui/icons-material/Language";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

export default function OcrEnginePage() {
  return (
    <>
      <Navbar />

      <main
        className="
          w-full min-h-screen 
          bg-gradient-to-b 
          from-gray-50 to-white 
          dark:from-gray-900 dark:to-gray-800 
          px-6 md:px-12 lg:px-24 py-16
        "
      >
        <h1 className="text-3xl md:text-5xl font-bold text-left text-gray-900 dark:text-white mb-12">
          🧠 AksharaTantra OCR Engine
        </h1>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* --------- 1. Language Selection ---------- */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" gap={2} alignItems="center">
                <LanguageIcon className="text-blue-600" />
                <Typography variant="h6">Select Language</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                <b>LanguageSelector Component will render here.</b>  
                Allows user to choose OCR language dynamically  
                (Telugu, Sanskrit, Hindi, English, etc.)
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* --------- 2. Upload Section ---------- */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" gap={2} alignItems="center">
                <UploadFileIcon className="text-green-600" />
                <Typography variant="h6">Upload Images (Single / Bulk)</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                <b>OcrUploader Component will render here.</b>  
                Users upload multiple images and validate input.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* --------- 3. Cleaning Section ---------- */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" gap={2} alignItems="center">
                <CleaningServicesIcon className="text-yellow-600" />
                <Typography variant="h6">OCR Text Cleaning</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                <b>TextCleaner Component will render here.</b>  
                Fix spacing, unicode issues, remove OCR noise.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* --------- 4. Editor ---------- */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" gap={2} alignItems="center">
                <EditNoteIcon className="text-purple-600" />
                <Typography variant="h6">OCR Editor & Page Preview</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                <b>OcrEditor + OcrPreviewList Components will be here.</b>  
                Edit text, reorder pages, delete pages.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* --------- 5. Vedic Tools ---------- */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" gap={2} alignItems="center">
                <AutoFixHighIcon className="text-pink-500" />
                <Typography variant="h6">Vedic Pitch Tools</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                <b>VedicPitchTools Component will render here.</b>  
                Works only for Telugu & Sanskrit.  
                Adds High 🔼 / Low 🔽 pitch marks.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* --------- 6. Export Section ---------- */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" gap={2} alignItems="center">
                <LibraryBooksIcon className="text-indigo-600" />
                <Typography variant="h6">Export as HTML / EPUB / JSON</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                <b>HtmlBookBuilder + EpubGenerator + JsonExporter will render here.</b>  
                Creates full digital book (HTML / EPUB / JSON).
              </Typography>
            </AccordionDetails>
          </Accordion>
        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

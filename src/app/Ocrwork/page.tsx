"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

import BulkOcrProcessor from "@/components/ocrEngine/BulkOcrProcessor";
import TextCleaner from "@/components/ocrEngine/TextCleaner";
import VedicPitchTools from "@/components/ocrEngine/VedicPitchTools";
import { exportJson } from "@/components/bookEngine/JsonExporter";

import {
  Box,
  Card,
  Typography,
  Button,
  Divider,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";

const ALL_LANGS = [
  { value: "ara", label: "Arabic" },
  { value: "asm", label: "Assamese" },
  { value: "ben", label: "Bengali" },
  { value: "bod", label: "Bodo" },
  { value: "chi_sim", label: "Chinese (Simplified)" },
  { value: "chi_tra", label: "Chinese (Traditional)" },
  { value: "deu", label: "German" },
  { value: "eng", label: "English" },
  { value: "fra", label: "French" },
  { value: "guj", label: "Gujarati" },
  { value: "hin", label: "Hindi" },
  { value: "ita", label: "Italian" },
  { value: "jpn", label: "Japanese" },
  { value: "kan", label: "Kannada" },
  { value: "kor", label: "Korean" },
  { value: "mal", label: "Malayalam" },
  { value: "mar", label: "Marathi" },
  { value: "nep", label: "Nepali" },
  { value: "nld", label: "Dutch" },
  { value: "ori", label: "Odia" },
  { value: "pan", label: "Punjabi" },
  { value: "por", label: "Portuguese" },
  { value: "rus", label: "Russian" },
  { value: "san", label: "Sanskrit" },
  { value: "snd", label: "Sindhi" },
  { value: "spa", label: "Spanish" },
  { value: "swe", label: "Swedish" },
  { value: "tam", label: "Tamil" },
  { value: "tel", label: "Telugu" },
  { value: "tha", label: "Thai" },
  { value: "tur", label: "Turkish" },
  { value: "urd", label: "Urdu" },
  { value: "vie", label: "Vietnamese" },
];

export default function OcrWorkPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [editorText, setEditorText] = useState("");

  const [bookTitle, setBookTitle] = useState("Untitled Book");
  const [plannedPages, setPlannedPages] = useState(0);

  const [language, setLanguage] = useState("");
  const [status, setStatus] = useState("Idle");

  const isVedicLanguage = ["tel", "san", "sa"].includes(language);

  const [ocrDone, setOcrDone] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [filesTouched, setFilesTouched] = useState(false);

  /* ---------------- FILE SELECT ---------------- */
  const handleFilesSelected = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (!ev.target.files) return;
    const arr = Array.from(ev.target.files);

    setFiles(arr);
    setFilesTouched(true);
    setStatus(`${arr.length} file(s) selected`);

    resetOcrState();
  };

  const resetOcrState = () => {
    setOcrDone(false);
    setOcrRunning(false);
    setPages([]);
    setCurrentIdx(-1);
    setEditorText("");
  };

  /* ---------------- DRAG DROP ---------------- */
  const handleDrop = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    const dropped = Array.from(ev.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!dropped.length) return;

    setFiles((prev) => [...prev, ...dropped]);
    setFilesTouched(true);
    setStatus(`${dropped.length} image(s) added`);

    resetOcrState();
  }, []);

  const handleDragOver = (ev: React.DragEvent) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
  };

  /* ---------------- AUTO START OCR AFTER 10 SEC ---------------- */
  useEffect(() => {
    if (!files.length || !language || ocrRunning || ocrDone) return;

    const timer = setTimeout(() => {
      setOcrRunning(true);
      setStatus("Auto-starting OCR...");
    }, 30000);

    return () => clearTimeout(timer);
  }, [files, language]);

  /* ---------------- OCR COMPLETE ---------------- */
  const handleBulkComplete = (texts: string[]) => {
    setPages(texts);
    if (texts.length) {
      setCurrentIdx(0);
      setEditorText(texts[0]);
      setStatus(`OCR done — ${texts.length} page(s)`);
    }
    setOcrRunning(false);
    setOcrDone(texts.length > 0);
  };

  /* ---------------- PAGE EDITING ---------------- */
  const openPageForEdit = (index: number) => {
    setCurrentIdx(index);
    setEditorText(pages[index] ?? "");
    if (pages.length) setOcrDone(true);
  };

  const saveEditedPage = () => {
    if (currentIdx < 0) return;
    const updated = [...pages];
    updated[currentIdx] = editorText;
    setPages(updated);
    setStatus("Page saved");
  };

  const deletePage = () => {
    if (currentIdx < 0) return;
    if (!confirm(`Delete page ${currentIdx + 1}?`)) return;

    const updated = pages.filter((_, idx) => idx !== currentIdx);
    setPages(updated);
    setEditorText("");
    setCurrentIdx(-1);

    setStatus("Page deleted");
    if (!updated.length) setOcrDone(false);
  };

  /* ---------------- EXPORT ---------------- */
  const handleDownloadJson = () => {
    exportJson(
      { bookTitle, language, pages, createdAt: new Date().toISOString() },
      bookTitle.replace(/\s+/g, "_")
    );
    setStatus("JSON downloaded");
  };

  const handleDownloadHtml = async () => {
    setStatus("Building HTML...");
    try {
      
      const mod = await import("@/components/bookEngine/HtmlBookBuilder");
      const html = mod.buildHtmlBook(bookTitle, pages);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookTitle.replace(/\s+/g, "_")}.html`;
      a.click();

      URL.revokeObjectURL(url);
      setStatus("HTML downloaded");
    } catch (err) {
      setStatus("HTML export failed");
    }
  };

  const handleDownloadEpub = async () => {
    setStatus("Building EPUB...");
    try {
      const mod = await import("@/components/bookEngine/EpubGenerator");
      const blob = await mod.generateEpub(bookTitle, pages);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookTitle.replace(/\s+/g, "_")}.epub`;
      a.click();

      URL.revokeObjectURL(url);
      setStatus("EPUB downloaded");
    } catch (err) {
      setStatus("EPUB export failed");
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <Navbar />

      <Box sx={{ p: 4, background: "#f5f5f5", minHeight: "100vh" }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
         RajaTantra OCR Engine
        </Typography>

      <Card sx={{ p: 2, mb: 4 }}>
  <Typography variant="h6" fontWeight="bold">
    About & How to Use
  </Typography>

          <Typography fontSize={15} mt={1} color="gray">
            RajaTantra OCR Engine  runs fully inside your browser — fast, private      
            Supports 32+ languages including Telugu, Sanskrit, Hindi, English, and more.
          </Typography>

          <Box mt={2} sx={{ lineHeight: 1.8 }}>
            <Typography fontWeight="bold">✨ Key Features</Typography>
            <Typography color="gray">✔️ 100% in-browser OCR — nothing uploaded to any server</Typography>
            <Typography color="gray">✔️ Supports 32+ Indian & global languages</Typography>
            <Typography color="gray">✔️ Bulk OCR for multiple scanned pages</Typography>
            <Typography color="gray">✔️ After uploading images, OCR auto-starts in 30 seconds (no manual click needed)</Typography>

            <Typography color="gray">✔️ Smart cleanup: spacing, noise removal & Unicode fixing</Typography>
            <Typography color="gray">✔️ Built-in editor to refine, correct and reorder pages</Typography>
            <Typography color="gray">✔️ Vedic High 🔼 & Low 🔽 pitch marks for Sanskrit/Telugu</Typography>
            <Typography color="gray">✔️ Export as HTML, EPUB, or JSON</Typography>
          </Box>

          <Box mt={2} sx={{ lineHeight: 1.8 }}>
            <Typography fontWeight="bold">🪄 How to Use</Typography>
            <Typography color="gray">➤ Select the OCR language</Typography>
            <Typography color="gray">➤ Upload scanned images (drag & drop supported)</Typography>
            <Typography color="gray">➤ Click “Start OCR” to extract text</Typography>
            <Typography color="gray">➤ Edit, clean and refine the extracted text</Typography>
            <Typography color="gray">➤ (Optional) Apply High/Low Vedic pitch marks</Typography>
            <Typography color="gray">➤ Export your output as HTML, EPUB or JSON</Typography>
          </Box>
        </Card>


        {/* BOOK META */}
        <Card sx={{ p: 2, mb: 4 }}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Book Title"
              fullWidth
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
            />
            <TextField
              label="Planned Pages"
              type="number"
              fullWidth
              value={plannedPages}
              onChange={(e) => setPlannedPages(Number(e.target.value))}
            />
          </Box>
        </Card>

        {/* LANGUAGE + UPLOAD */}
        <Card sx={{ p: 2, mb: 4 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <Typography fontWeight="bold">OCR Language</Typography>

              <Select
                fullWidth
                displayEmpty
                value={language}
                onChange={(e) => setLanguage(e.target.value as string)}
                renderValue={(selected) => {
                  if (!selected)
                    return <em style={{ color: "#888" }}>Select OCR Language</em>;
                  return ALL_LANGS.find((l) => l.value === selected)?.label;
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select OCR Language</em>
                </MenuItem>
                {ALL_LANGS.sort((a, b) => a.label.localeCompare(b.label)).map(
                  (lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  )
                )}
              </Select>
            </div>

            {/* UPLOAD */}
            <div style={{ flex: 1, minWidth: 250 }}>
              <Typography fontWeight="bold">Upload Images</Typography>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFilesSelected}
              />

              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  border: "2px dashed #bdbdbd",
                  borderRadius: 2,
                  textAlign: "center",
                  background: "#fafafa",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#1976d2", background: "#f0f7ff" },
                }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Typography fontWeight="bold">📂 Click to Select Images</Typography>
                <Typography color="gray">or drag & drop here</Typography>

                {files.length > 0 && (
                  <Typography mt={1} color="green">
                    {files.length} image(s) selected
                  </Typography>
                )}
              </Box>

              <Box mt={2} display="flex" gap={1}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    if (!files.length) return setStatus("No files selected");
                    if (!language) return setStatus("Select OCR language");
                    setFilesTouched(true);
                    setStatus("Images ready for OCR");
                  }}
                >
                  Validate
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setFiles([]);
                    setFilesTouched(false);
                    resetOcrState();
                    setStatus("Files cleared");
                  }}
                >
                  Clear
                </Button>
              </Box>

              <Box mt={1}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  disabled={!files.length || !language || ocrRunning || !filesTouched}
                  onClick={() => {
                    setOcrRunning(true);
                    setStatus("Starting OCR...");
                  }}
                >
                  Start OCR
                </Button>
              </Box>
            </div>
          </div>
        </Card>

        {/* MAIN LAYOUT */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* LEFT: PAGE LIST */}
          <div style={{ flex: 1, minWidth: 250, maxWidth: 320 }}>
            <Card sx={{ p: 2 }}>
              <Typography fontWeight="bold">Pages ({pages.length})</Typography>
              <Box sx={{ maxHeight: 450, overflowY: "auto" }}>
                {pages.map((p, i) => (
                  <Card
                    key={i}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      cursor: "pointer",
                      background: currentIdx === i ? "#e3f2fd" : "#fafafa",
                    }}
                    onClick={() => openPageForEdit(i)}
                  >
                    <Typography variant="body2">{p.slice(0, 120)}...</Typography>
                    <Typography variant="caption">Page {i + 1}</Typography>
                  </Card>
                ))}
              </Box>
            </Card>
          </div>

          {/* RIGHT: OCR + EDITOR */}
          <div style={{ flex: 3, minWidth: 300 }}>
            <Card sx={{ p: 2, mb: 2 }}>
              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                {/* OCR Processor */}
                <BulkOcrProcessor
                  files={files}
                  language={language}
                  autoStart={ocrRunning}
                  onComplete={handleBulkComplete}
                />

                {/* Cleaner */}
                <TextCleaner
                  text={editorText}
                  onClean={(cleaned) => {
                    setEditorText(cleaned);
                    setStatus("Text cleaned");
                  }}
                />

                {/* Vedic Pitch */}
                {isVedicLanguage && (
                  <VedicPitchTools
                    onApplyPitch={(type) => {
                      const textarea = document.getElementById(
                        "editor-box"
                      ) as HTMLTextAreaElement;
                      if (!textarea) return;

                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      if (start === end) return;

                      const selected = editorText.substring(start, end);
                      const wrapped =
                        type === "high"
                          ? `<span class="hp-wrap">${selected}</span>`
                          : `<span class="lp-wrap">${selected}</span>`;

                      const newText =
                        editorText.substring(0, start) +
                        wrapped +
                        editorText.substring(end);

                      setEditorText(newText);
                    }}
                  />
                )}

                {/* Clear */}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditorText("");
                    setStatus("Editor cleared");
                  }}
                  disabled={!ocrDone || ocrRunning}
                >
                  Clear Text
                </Button>

                {/* Save/Delete */}
                {currentIdx >= 0 && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={saveEditedPage}
                      disabled={!ocrDone || ocrRunning}
                    >
                      Save Page
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={deletePage}
                      disabled={!ocrDone || ocrRunning}
                    >
                      Delete Page
                    </Button>
                  </>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              <textarea
                id="editor-box"
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "45vh",
                  maxHeight: "70vh",
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid #bbb",
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  resize: "vertical",
                  fontFamily: "inherit",
                  background: ocrRunning ? "#f5f5f5" : "white",
                  overflowY: "auto",
                }}
                disabled={ocrRunning || !ocrDone}
                placeholder="Edit OCR text here..."
              />
            </Card>

            {/* EXPORT SECTION - only after OCR */}
            {ocrDone && (
              <Card sx={{ p: 2 }}>
                <Typography fontWeight="bold" mb={2}>
                  Export Options
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button variant="contained" onClick={handleDownloadHtml}>
                    Export HTML
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDownloadEpub}
                  >
                    Export EPUB
                  </Button>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={handleDownloadJson}
                  >
                    Export JSON
                  </Button>
                </Box>
              </Card>
            )}
          </div>
        </div>

        <Typography textAlign="center" mt={4} color="gray">
          Status: {status}
        </Typography>
      </Box>

      <GoToTopButton />
    </>
  );
}

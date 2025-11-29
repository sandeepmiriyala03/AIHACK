"use client";

import React, { useState, useRef } from "react";
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

export default function OcrWorkPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [editorText, setEditorText] = useState<string>("");

  const [bookTitle, setBookTitle] = useState("Untitled Book");
  const [plannedPages, setPlannedPages] = useState<number>(0);

  const [language, setLanguage] = useState<string>("tel");
  const [status, setStatus] = useState<string>("Idle");

  const isVedicLanguage = ["tel", "san", "sa"].includes(language);

  /* FILE UPLOAD */
  const handleFilesSelected = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const list = ev.target.files;
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    setStatus(`${arr.length} file(s) ready`);
  };

  /* PAGE MANAGEMENT */
  const addPages = (texts: string[]) => {
    setPages((prev) => [...prev, ...texts]);
    setStatus(`Added ${texts.length} page(s)`);
  };

  const handleBulkComplete = (texts: string[]) => addPages(texts);

  const openPageForEdit = (index: number) => {
    setCurrentIdx(index);
    setEditorText(pages[index]);
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
    const updated = pages.filter((_, idx) => idx !== currentIdx);
    setPages(updated);
    setEditorText("");
    setCurrentIdx(-1);
    setStatus("Page deleted");
  };

  const clearText = () => {
    setEditorText("");
    setStatus("Editor cleared");
  };

  /* EXPORT JSON */
  const handleDownloadJson = () => {
    exportJson(
      { bookTitle, language, pages, createdAt: new Date().toISOString() },
      bookTitle.replace(/\s+/g, "_")
    );
    setStatus("JSON downloaded");
  };

  /* EXPORT HTML */
  const handleDownloadHtml = async () => {
    setStatus("Building HTML...");
    try {
      const mod = await import("@/components/bookEngine/HtmlBookBuilder");
      if (typeof mod.buildHtmlBook !== "function") {
        setStatus("❌ HtmlBookBuilder missing");
        return;
      }

      const html = mod.buildHtmlBook(bookTitle, pages);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        `${bookTitle.replace(/\s+/g, "_")}-${new Date()
          .toISOString()
          .slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      setStatus("✅ HTML downloaded");
    } catch (err) {
      console.error(err);
      setStatus("❌ HTML export failed");
    }
  };

  /* EXPORT EPUB */
  const handleDownloadEpub = async () => {
    setStatus("Building EPUB...");
    try {
      const mod = await import("@/components/bookEngine/EpubGenerator");
      if (typeof mod.generateEpub !== "function") {
        setStatus("❌ EpubGenerator missing");
        return;
      }

      const blob = await mod.generateEpub(bookTitle, pages);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        `${bookTitle.replace(/\s+/g, "_")}-${new Date()
          .toISOString()
          .slice(0, 10)}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      setStatus("✅ EPUB downloaded");
    } catch (err) {
      console.error(err);
      setStatus("❌ EPUB export failed");
    }
  };

  return (
    <>
      <Navbar />

      <Box sx={{ p: 4, background: "#f5f5f5", minHeight: "100vh" }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
          🧠 AksharaTantra — OCR Workbench
        </Typography>

        {/* HOW TO USE */}
        <Card sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" fontWeight="bold">
            📘 How to Use
          </Typography>
          <Typography fontSize={15} mt={1} color="gray">
            1️⃣ Select language <br />
            2️⃣ Upload scanned images <br />
            3️⃣ Run Bulk OCR <br />
            4️⃣ Edit text <br />
            5️⃣ Apply High/Low pitch <br />
            6️⃣ Export HTML / EPUB / JSON <br />
          </Typography>
        </Card>

        {/* BOOK META */}
        <Card sx={{ p: 2, mb: 4 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <Typography fontWeight="bold">Book Title</Typography>
              <TextField
                fullWidth
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, minWidth: 250 }}>
              <Typography fontWeight="bold">Planned Pages</Typography>
              <TextField
                type="number"
                fullWidth
                value={plannedPages}
                onChange={(e) => setPlannedPages(Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        {/* LANGUAGE + UPLOAD */}
        <Card sx={{ p: 2, mb: 4 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 250 }}>
              <Typography fontWeight="bold">OCR Language</Typography>
              <Select
                fullWidth
                value={language}
                onChange={(e) => setLanguage(e.target.value as string)}
              >
                <MenuItem value="tel">Telugu</MenuItem>
                <MenuItem value="san">Sanskrit</MenuItem>
                <MenuItem value="hin">Hindi</MenuItem>
                <MenuItem value="eng">English</MenuItem>
              </Select>
            </div>

            <div style={{ flex: 1, minWidth: 250 }}>
              <Typography fontWeight="bold">Upload Images</Typography>
              <Box display="flex" gap={2}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFilesSelected}
                />
                <Button
                  variant="contained"
                  onClick={() =>
                    setStatus(files.length ? "Files ready" : "No files")
                  }
                >
                  Validate
                </Button>
              </Box>
            </div>
          </div>
        </Card>

        {/* MAIN LAYOUT */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* LEFT SIDE */}
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
                    <Typography variant="body2">
                      {p.slice(0, 120)}...
                    </Typography>
                    <Typography variant="caption">Page {i + 1}</Typography>
                  </Card>
                ))}
              </Box>
            </Card>
          </div>

          {/* RIGHT SIDE */}
          <div style={{ flex: 3, minWidth: 300 }}>
            <Card sx={{ p: 2, mb: 2 }}>
              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                <BulkOcrProcessor
                  files={files}
                  language={language}
                  onComplete={handleBulkComplete}
                />

                <TextCleaner text={editorText} onClean={clearText} />

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

                <Button variant="outlined" onClick={clearText}>
                  Clear Text
                </Button>

                {currentIdx >= 0 && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={saveEditedPage}
                    >
                      Save Page
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={deletePage}
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
                  background: "white",
                  overflowY: "auto",
                  boxSizing: "border-box",
                }}
                placeholder="Edit OCR text here..."
              />
            </Card>

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

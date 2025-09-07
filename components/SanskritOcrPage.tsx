'use client';

import React, { useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import { FileUploadComponent } from "./FileUploadComponent";
import FileUploadManager from "@/components/FileUploadManager";
import { ActionsComponent } from "./ActionsComponent";
import { ErrorMessageComponent } from "./ErrorMessageComponent";
import { ExtractedTextSectionComponent } from "./ExtractedTextSectionComponent";
import { SanskritOcrExplanation } from "./SanskritOcrExplanation";
import type { LangOption } from "../types/types";

const SANSKRIT_LANG: LangOption = { value: "san", label: "Sanskrit", group: "indic" };
const MAX_OCR_TIME_MS = 30000;
const MIN_IMAGE_WIDTH = 100;

function resizeImageFile(file: File, minWidth: number, maxWidth: number): Promise<Blob | File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let targetWidth = img.width < minWidth ? minWidth : img.width;
      let targetHeight = Math.round((img.height * targetWidth) / img.width);
      if (targetWidth > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = Math.round((img.height * maxWidth) / img.width);
      }
      if (targetWidth === img.width) {
        resolve(file);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to resize image"));
        },
        file.type || "image/png",
        0.8
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

interface Page {
  id: string;
  text: string;
}

export default function SanskritOcrPage() {
  // State and refs for tabs, file, pages, loading, errors, progress
  const [activeTab, setActiveTab] = useState<"image" | "document">("document");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");

  // New states to collect book information on first page extracted
  const [bookTitle, setBookTitle] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [showBookInfoPrompt, setShowBookInfoPrompt] = useState(false);

  const cancelFlag = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer helpers
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      cancelFlag.current = true;
      setLoading(false);
      setImageError("OCR timed out after 30 seconds.");
      setProgress("OCR timed out.");
    }, MAX_OCR_TIME_MS);
  }, []);

  const updateProgress = (msg: string) => setProgress(msg);

  // Handles file input change, resets pages and errors
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    setProgress("");
    cancelFlag.current = false;
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFileUrl(null);
      setPages([]);
      setActivePageId(null);
      return;
    }
    setFile(selected);
    setFileUrl(URL.createObjectURL(selected));
    setPages([]);
    setActivePageId(null);
  };

  // OCR analysis runs Tesseract, adds page, prompts for book info on first page
  const onAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    updateProgress("Preprocessing image...");
    cancelFlag.current = false;
    startTimer();
    try {
      const preprocessedFile = await resizeImageFile(file, MIN_IMAGE_WIDTH, 1200);
      const url = URL.createObjectURL(preprocessedFile as Blob);
      setFileUrl(url);

      const { data } = await Tesseract.recognize(url, SANSKRIT_LANG.value, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            updateProgress(`OCR ${SANSKRIT_LANG.label}: ${(m.progress ?? 0) * 100 | 0}%`);
          }
        },
      });

      if (!cancelFlag.current) {
        const cleanedText = (data.text || "").replace(/\s+/g, " ").trim();
        if (!cleanedText) {
          setImageError("No text detected; try a clearer image.");
        } else {
          const newPageId = Date.now().toString();
          setPages((prev) => [...prev, { id: newPageId, text: cleanedText }]);
          setActivePageId(newPageId);
          updateProgress("OCR Complete");
          setFileUrl(null);
          URL.revokeObjectURL(url);
          if (pages.length === 0) setShowBookInfoPrompt(true); // Prompt for title after first page
        }
      }
    } catch {
      if (!cancelFlag.current) {
        setImageError("OCR failed; please try again.");
        updateProgress("");
      }
    } finally {
      setLoading(false);
      resetTimer();
    }
  };

  // Clear all
  const onClear = () => {
    cancelFlag.current = true;
    setFile(null);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    setPages([]);
    setActivePageId(null);
    setImageError("");
    setProgress("");
  };

  // Update active page text as user edits
  const onTextChange = (newText: string) => {
    if (!activePageId) return;
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, text: newText } : p))
    );
  };

  // Add a blank page manually
  const addBlankPage = () => {
    const newPageId = Date.now().toString();
    setPages((prev) => [...prev, { id: newPageId, text: "" }]);
    setActivePageId(newPageId);
  };

  // Delete page by id
  const deletePage = (id: string) => {
    setPages((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0) setActivePageId(filtered[0].id);
      else setActivePageId(null);
      return filtered;
    });
  };

  // Confirm Book Info Popup component
  const BookInfoPrompt = () => (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
    }}>
      <div style={{ background: "white", padding: 20, borderRadius: 8, maxWidth: 400, width: "90%" }}>
        <h3>Enter Book Information</h3>
        <input
          type="text"
          value={bookTitle}
          onChange={e => setBookTitle(e.target.value)}
          placeholder="Book Title"
          style={{ width: "100%", padding: 8, fontSize: 16, marginBottom: 12 }}
        />
        <textarea
          value={bookDescription}
          onChange={e => setBookDescription(e.target.value)}
          placeholder="Book Description (optional)"
          style={{ width: "100%", padding: 8, fontSize: 16, height: 80 }}
        />
        <button
          disabled={!bookTitle.trim()}
          onClick={() => setShowBookInfoPrompt(false)}
          style={{ marginTop: 12, padding: "10px 16px", cursor: "pointer" }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  // Generate downloadable offline HTML book with tabs and header/footer
  const downloadBook = () => {
    if (!bookTitle.trim()) {
      alert("Please enter book title before downloading.");
      return;
    }
    if (pages.length === 0) {
      alert("No pages to download.");
      return;
    }

    const todayStr = new Date().toLocaleDateString();

    const tabButtons = pages.map(
      (_, i) => `<button class="tablinks" onclick="openPage(event, 'Page${i + 1}')">Page ${i + 1}</button>`
    ).join("\n");

    const tabContents = pages.map(
      (p, i) => `
      <div id="Page${i + 1}" class="tabcontent" style="display:none; padding:10px; height:70vh;">
        <h3>Page ${i + 1}</h3>
        <textarea style="width:100%; height:100%; font-size:16px; font-family: monospace;">${p.text}</textarea>
      </div>`
    ).join("\n");

    const html = `<!DOCTYPE html>
<html lang="sa">
<head>
<meta charset="UTF-8" />
<title>${bookTitle}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding-top: 100px; }
  header { 
    position: fixed; top: 0; left: 0; right: 0; background: #3b82f6; color: white; 
    height: 80px; display: flex; align-items: center; justify-content: space-between; 
    padding: 0 30px; font-weight: bold; z-index: 1000;
  }
  header .title { font-size: 24px; text-align: center; flex-grow: 1; }
  header .left, header .right { font-size: 16px; }
  .tabs {
    position: fixed; top: 80px; left: 0; right: 0; background: #dbeafe; display: flex; 
    border-bottom: 1px solid #a5b4fc; z-index: 999;
  }
  .tabs button {
    flex: 1; padding: 15px; background: none; border: none; cursor: pointer; font-size: 16px;
  }
  .tabs button.active { background: #3b82f6; color: white; }
  .tabcontent { display: none; }
  textarea { width: 100%; height: 100%; box-sizing: border-box; padding: 10px; }
  footer { text-align: center; padding: 10px; font-size: 14px; color: #555; margin-top: 15px; border-top: 1px solid #ddd; }
  @media print { header, footer, .tabs { display: none; } }
</style>
</head>
<body>
<header>
  <div class="left">Pages: ${pages.length}</div>
  <div class="title">${bookTitle}</div>
  <div class="right">${todayStr}</div>
</header>
<div class="tabs">
  ${tabButtons}
</div>
${tabContents}
<footer>&copy; ${new Date().getFullYear()} YourProductName. All rights reserved.</footer>
<script>
  function openPage(evt, pageName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    document.getElementById(pageName).style.display = "block";
    evt.currentTarget.className += " active";
  }
  document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".tablinks").click();
  });
</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = bookTitle.trim().replace(/\s+/g, "_") + ".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "auto" }} aria-live="polite">
      <h1 style={{ marginBottom: 20, textAlign: "center" }}>यथाक्षरं पठनम् (Sanskrit OCR Book)</h1>

      <SanskritOcrExplanation />

      {/* Book info prompt */}
      {showBookInfoPrompt && (
        <div style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999,
        }}>
          <div style={{ background: "white", padding: 20, borderRadius: 8, width: 400 }}>
            <h3>Enter Book Information</h3>
            <input 
              type="text" 
              placeholder="Book Title" 
              value={bookTitle} 
              onChange={e => setBookTitle(e.target.value)} 
              style={{ width: "100%", padding: 8, marginBottom: 10 }} 
            />
            <textarea 
              placeholder="Book Description (optional)" 
              value={bookDescription} 
              onChange={e => setBookDescription(e.target.value)} 
              style={{ width: "100%", height: 80, padding: 8 }}
            />
            <button 
              onClick={() => setShowBookInfoPrompt(false)} 
              disabled={!bookTitle.trim()}
              style={{ padding: "10px 20px" }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Tabs for switching modes */}
      <div style={{
        display: "inline-flex", background: "#f0f0f0", borderRadius: 8,
        border: "1px solid #ccc", overflow: "hidden", marginBottom: 20,
      }}>
        <button 
          onClick={() => setActiveTab("document")}
          style={{
            cursor: "pointer",
            padding: "10px 20px",
            border: "none",
            background: activeTab === "document" ? "#4f46e5" : "transparent",
            color: activeTab === "document" ? "white" : "#555",
            fontWeight: activeTab === "document" ? "bold" : undefined,
          }}
          aria-selected={activeTab === "document"} role="tab" id="tab-document" aria-controls="tabpanel-document"
        >
          प्रलेखान्वासः
        </button>
        <button
          onClick={() => setActiveTab("image")}
          style={{
            cursor: "pointer",
            padding: "10px 20px",
            border: "none",
            background: activeTab === "image" ? "#4f46e5" : "transparent",
            color: activeTab === "image" ? "white" : "#555",
            fontWeight: activeTab === "image" ? "bold" : undefined,
          }}
          aria-selected={activeTab === "image"} role="tab" id="tab-image" aria-controls="tabpanel-image"
        >
          अक्षराङ्कनं वा प्रलेखान्वासः
        </button>
      </div>

      {/* Panels */}
      {activeTab === "image" && (
        <section role="tabpanel" id="tabpanel-image" aria-labelledby="tab-image" tabIndex={0}>
          <FileUploadComponent file={file} onFileChange={onFileChange} loading={loading} />

          {progress && <p style={{ marginTop: 10 }}>{progress}</p>}
          {imageError && <ErrorMessageComponent message={imageError} />}

          {/* Textarea to edit extracted page text */}
          {pages.length > 0 && activePageId && (
            <div style={{ marginTop: 15 }}>
              <label htmlFor="pageText" style={{ fontWeight: "bold", marginBottom: 5, display: "block" }}>
                Edit Extracted Text for Page {pages.findIndex(p => p.id === activePageId) + 1}:
              </label>
              <textarea 
                id="pageText" 
                style={{ width: "100%", height: 200, fontSize: 16 }}
                value={pages.find(p => p.id === activePageId)?.text || ""}
                onChange={e => onTextChange(e.target.value)} 
              />
            </div>
          )}

          {/* Pages tab buttons */}
          {pages.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {pages.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActivePageId(p.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: activePageId === p.id ? "2px solid #4f46e5" : "1px solid #ccc",
                    background: activePageId === p.id ? "#dbeafe" : "white",
                    cursor: "pointer",
                    fontWeight: activePageId === p.id ? "bold" : "normal",
                  }}>
                  Page {i + 1}
                </button>
              ))}
              <button 
                onClick={addBlankPage} 
                style={{ backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: 4, padding: "6px 12px", cursor: "pointer" }}>
                + Add Page
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
            <ActionsComponent
              mode={{ value: "manual", label: "Manual Selection" }}
              loading={loading}
              file={file}
              lang={[SANSKRIT_LANG]}
              onAnalyze={onAnalyze}
              onClear={onClear}
              onCancel={() => {
                cancelFlag.current = true;
                setLoading(false);
                setProgress("Operation cancelled");
                resetTimer();
              }}
            />

            {pages.length > 0 && !showBookInfoPrompt && (
              <button
                onClick={downloadBook}
                style={{ padding: "10px 20px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Download Book as HTML
              </button>
            )}
          </div>
        </section>
      )}

      {activeTab === "document" && (
        <section role="tabpanel" id="tabpanel-document" aria-labelledby="tab-document" tabIndex={0}>
          <FileUploadManager />
        </section>
      )}

      {/* Image preview */}
      {fileUrl && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <img src={fileUrl} alt="Uploaded preview" style={{ maxWidth: "100%", borderRadius: 12 }} />
        </div>
      )}

      {/* Extracted text preview */}
      <ExtractedTextSectionComponent progress={progress} fullText={pages.map(p => p.text).join("\n\n")} loading={loading} />

      {/* Book title input modal */}
      {showBookInfoPrompt && <BookInfoPrompt />}
    </div>
  );
}

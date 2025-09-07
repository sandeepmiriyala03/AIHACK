'use client';

import React, { useState, useRef, useCallback, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"image" | "document">("document");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");

  const [bookTitle, setBookTitle] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [showBookInfoPrompt, setShowBookInfoPrompt] = useState(false);

  const [showBot, setShowBot] = useState(false);
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [showCompletedPages, setShowCompletedPages] = useState(false);

  const cancelFlag = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setCompletedPages([]);
  };

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
        }
      }
      setFileUrl(null);
      URL.revokeObjectURL(url);
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
    setShowBookInfoPrompt(false);
    setBookTitle("");
    setBookDescription("");
    setCompletedPages([]);
  };

  const onTextChange = (newText: string) => {
    if (!activePageId) return;
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, text: newText } : p))
    );
  };

  const addBlankPage = () => {
    const newPageId = Date.now().toString();
    setPages((prev) => [...prev, { id: newPageId, text: "" }]);
    setActivePageId(newPageId);
  };

  const deletePage = (id: string) => {
    setPages((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0) setActivePageId(filtered[0].id);
      else setActivePageId(null);
      return filtered;
    });
    setCompletedPages(prev => prev.filter(pageId => pageId !== id));
  };

  const markPageAsCompleted = (id: string) => {
    setCompletedPages(prev => [...new Set([...prev, id])]);
  };

  const handleDownloadClick = () => {
    if (!bookTitle.trim()) {
      setShowBookInfoPrompt(true);
    } else {
      downloadBook();
    }
  };

  const confirmBookInfo = () => {
    if (!bookTitle.trim()) return;
    setShowBookInfoPrompt(false);
    downloadBook();
  };

  const downloadBook = () => {
    if (!bookTitle.trim() || pages.length === 0) {
      alert("Please enter a book title and ensure there are pages to download.");
      return;
    }

    const todayStr = new Date().toLocaleDateString();
    const year = new Date().getFullYear();

    const tabButtons = pages.map(
      (_, i) => `<button class="tablinks" onclick="openPage(event, 'Page${i + 1}')">Page ${i + 1}</button>`
    ).join("\n");

    const tabContents = pages.map(
      (p, i) => `
      <div id="Page${i + 1}" class="tabcontent" style="display:none; padding:10px;">
        <h3>Page ${i + 1}</h3>
        <textarea style="width:100%; height:400px; box-sizing:border-box; font-size:16px; font-family: monospace; border:1px solid #ccc; border-radius:8px; padding:10px;">${p.text}</textarea>
        <div style="margin-top:20px; padding:15px; border:1px dashed #4f46e5; border-radius:8px; background-color:#eef2ff;">
          <h4 style="margin-top:0;">Your Notes</h4>
          <textarea class="notes-field" style="width:100%; height:150px; box-sizing:border-box; font-size:14px; font-family:sans-serif; border:none; background:transparent; resize:vertical;"></textarea>
          <p style="font-size:12px; color:#6b7280; margin-top:10px;">*Notes are saved locally in your browser.</p>
        </div>
      </div>`
    ).join("\n");

    const descSection = bookDescription.trim() ?
      `<section style="padding:20px; margin-bottom:20px; border-bottom:1px solid #ccc;">
        <h2>Description</h2>
        <p>${bookDescription}</p>
      </section>` : "";

    const html = `<!DOCTYPE html>
<html lang="sa">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${bookTitle}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding-top: 100px; background-color: #f4f4f9; }
  header {
    position: fixed; top: 0; left: 0; right: 0; background: #3b82f6; color: white;
    height: 80px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 30px; font-weight: bold; z-index: 1000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  header .title { font-size: 24px; text-align: center; flex-grow: 1; }
  header .left, header .right { font-size: 16px; }
  .tabs {
    position: fixed; top: 80px; left: 0; right: 0; background: #dbeafe; display: flex;
    border-bottom: 1px solid #a5b4fc; z-index: 999; overflow-x: auto; white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
  .tabs button {
    flex-shrink: 0; padding: 15px; background: none; border: none; cursor: pointer; font-size: 16px;
    transition: background-color 0.3s, color 0.3s;
  }
  .tabs button.active { background: #3b82f6; color: white; }
  .tabcontent { display: none; padding: 20px; }
  textarea {
    box-sizing: border-box; padding: 10px; border: 1px solid #ccc; border-radius: 8px;
    font-size: 16px; font-family: monospace; resize: vertical;
  }
  .notes-field { background-color: white; border: 1px solid #ccc !important; }
  footer { text-align: center; padding: 10px; font-size: 14px; color: #555; margin-top: 15px; border-top: 1px solid #ddd; }
  
  /* Bot CSS */
  #bot-container {
    position: fixed; bottom: 20px; left: 20px; z-index: 1000;
  }
  #bot-icon {
    width: 50px; height: 50px; border-radius: 50%; background-color: #4f46e5;
    color: white; display: flex; justify-content: center; align-items: center;
    font-size: 24px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transition: transform 0.2s ease-in-out;
  }
  #bot-icon:hover { transform: scale(1.1); }
  #bot-chatbox {
    width: 280px; background-color: white; border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); padding: 15px;
    position: absolute; bottom: 70px; left: 0;
    transform-origin: bottom left; transition: transform 0.3s ease-in-out;
  }
  #bot-chatbox.hidden {
    display: none;
    transform: scale(0);
  }
  .bot-message h4 { margin: 0; color: #333; }
  .bot-message p { margin: 5px 0; font-size: 14px; color: #666; }
  .bot-actions { display: flex; gap: 8px; margin-top: 10px; }
  .bot-actions button {
    padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer;
    font-size: 12px; background-color: #3b82f6; color: white;
  }
  @media print { header, footer, .tabs, #bot-container { display: none; } }
</style>
</head>
<body>
<header>
  <div class="left">Pages: ${pages.length}</div>
  <div class="title">${bookTitle}</div>
  <div class="right">${todayStr}</div>
</header>
${descSection}
<div class="tabs">
  ${tabButtons}
</div>
<div id="page-content" style="padding: 100px 20px 20px;">
${tabContents}
</div>
<footer>&copy; ${year} AksharaTantra OCR generated.</footer>

<div id="bot-container">
  <div id="bot-icon" onclick="toggleBot()">&#x1F916;</div>
  <div id="bot-chatbox" class="hidden">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
      <h4 style="margin:0;">Book Overview</h4>
      <button onclick="toggleBot()" style="background:none; border:none; cursor:pointer; font-size:16px;">✖</button>
    </div>
    <div class="bot-message">
      <p>Total Pages: **${pages.length}**</p>
      <p>Start reading and keep your notes. Your progress is saved in your browser.</p>
    </div>
  </div>
</div>

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

  function toggleBot() {
    const chatbox = document.getElementById('bot-chatbox');
    chatbox.classList.toggle('hidden');
  }

  document.addEventListener("DOMContentLoaded", function() {
    const firstTab = document.querySelector(".tablinks");
    if (firstTab) {
      firstTab.click();
    }
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
          onClick={confirmBookInfo}
          style={{ marginTop: 12, padding: "10px 16px", cursor: "pointer" }}
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const BotChatbox = () => (
    <div style={{
      position: "fixed", bottom: 20, left: 20, width: 250,
      backgroundColor: "white", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      padding: 15, zIndex: 999,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h4 style={{ margin: 0 }}>Progress Overview</h4>
        <button onClick={() => setShowBot(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          ✖
        </button>
      </div>
      <p style={{ margin: "5px 0" }}>Total Pages: **{pages.length}**</p>
      <p style={{ margin: "5px 0" }}>Completed: **{completedPages.length}**</p>
      <p style={{ margin: "5px 0" }}>To Review: **{pages.length - completedPages.length}**</p>
      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => setShowCompletedPages(prev => !prev)}
          style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", fontSize: 12, flexGrow: 1 }}
        >
          {showCompletedPages ? "Hide Completed" : "View Completed"}
        </button>
      </div>
      {showCompletedPages && (
        <div style={{ marginTop: 10, maxHeight: 100, overflowY: "auto", borderTop: "1px solid #eee", paddingTop: 10 }}>
          <p style={{ fontSize: 12, fontWeight: "bold", margin: "0 0 5px 0" }}>Completed Pages IDs:</p>
          {completedPages.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 12 }}>
              {completedPages.map(id => (
                <li key={id}>{pages.findIndex(p => p.id === id) + 1}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 12 }}>None completed yet.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "auto" }} aria-live="polite">
      <h1 style={{ marginBottom: 20, textAlign: "center" }}>यथाक्षरं पठनम् (Sanskrit OCR Book)</h1>

      <SanskritOcrExplanation />

      {showBookInfoPrompt && <BookInfoPrompt />}

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

      {activeTab === "image" && (
        <section role="tabpanel" id="tabpanel-image" aria-labelledby="tab-image" tabIndex={0}>
          <FileUploadComponent file={file} onFileChange={onFileChange} loading={loading} />

          {progress && <p style={{ marginTop: 10 }}>{progress}</p>}
          {imageError && <ErrorMessageComponent message={imageError} />}

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

          {pages.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {pages.map((p, i) => (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <button
                    onClick={() => setActivePageId(p.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 4,
                      border: activePageId === p.id ? "2px solid #4f46e5" : "1px solid #ccc",
                      background: completedPages.includes(p.id) ? "#d4edda" : (activePageId === p.id ? "#dbeafe" : "white"),
                      cursor: "pointer",
                      fontWeight: activePageId === p.id ? "bold" : "normal",
                    }}>
                    Page {i + 1}
                  </button>
                  <button
                    onClick={() => markPageAsCompleted(p.id)}
                    disabled={completedPages.includes(p.id)}
                    style={{
                      marginTop: 4, padding: "2px 5px", fontSize: 10,
                      backgroundColor: completedPages.includes(p.id) ? "#28a745" : "#007bff",
                      color: "white", border: "none", borderRadius: 3, cursor: "pointer",
                    }}>
                    {completedPages.includes(p.id) ? "Completed ✓" : "Mark as Done"}
                  </button>
                </div>
              ))}
              <button
                onClick={addBlankPage}
                style={{ backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: 4, padding: "6px 12px", cursor: "pointer" }}>
                + Add Page
              </button>
            </div>
          )}

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

            {pages.length > 0 && (
              <button
                onClick={handleDownloadClick}
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

      {fileUrl && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <img src={fileUrl} alt="Uploaded preview" style={{ maxWidth: "100%", borderRadius: 12 }} />
        </div>
      )}

      <ExtractedTextSectionComponent progress={progress} fullText={pages.map(p => p.text).join("\n\n")} loading={loading} />
      
      {/* Bot Icon */}
      <div
        style={{
          position: "fixed", bottom: 20, left: 20,
          width: 50, height: 50, borderRadius: "50%",
          backgroundColor: "#4f46e5", color: "white",
          display: "flex", justifyContent: "center", alignItems: "center",
          fontSize: 24, cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
        }}
        onClick={() => setShowBot(true)}
      >
        &#x1F916; {/* Robot emoji */}
      </div>

   
    </div>
  );
}
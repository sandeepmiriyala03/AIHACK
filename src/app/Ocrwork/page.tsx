"use client";

import React, { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

import BulkOcrProcessor from "@/components/ocrEngine/BulkOcrProcessor";
import OcrCore from "@/components/ocrEngine/OcrCore";
import TextCleaner from "@/components/ocrEngine/TextCleaner";
import VedicPitchTools from "@/components/ocrEngine/VedicPitchTools";

import { exportJson } from "@/components/bookEngine/JsonExporter";

import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

const OcrWorkPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [editorText, setEditorText] = useState<string>("");

  const [language, setLanguage] = useState<string>("tel");
  const [status, setStatus] = useState<string>("Idle");

  /* --------------------------
        FILE UPLOAD
  -------------------------- */
  const handleFilesSelected = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const list = ev.target.files;
    if (!list) return;

    const arr = Array.from(list);
    setFiles(arr);
    setStatus(`${arr.length} file(s) ready`);
  };

  /* --------------------------
        PAGE MANAGEMENT
  -------------------------- */
  const addPages = (texts: string[]) => {
    setPages((prev) => [...prev, ...texts]);
    setStatus(`Added ${texts.length} page(s)`);
  };

  const handleSingleOcrResult = (text: string) => addPages([text]);
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
    setStatus(`Saved page ${currentIdx + 1}`);
  };

  const deletePage = (i: number) => {
    const updated = pages.filter((_, idx) => idx !== i);
    setPages(updated);

    if (currentIdx === i) {
      setCurrentIdx(-1);
      setEditorText("");
    } else if (currentIdx > i) {
      setCurrentIdx((v) => v - 1);
    }

    setStatus(`Deleted page ${i + 1}`);
  };

  /* --------------------------
        TEXT CLEANER
  -------------------------- */
  const handleClean = (cleaned: string) => {
    setEditorText(cleaned);
    setStatus("Text cleaned");
  };

  const isVedicLanguage = ["tel", "san", "sa"].includes(language);

  /* --------------------------
        EXPORT: HTML
  -------------------------- */
const handleDownloadHtml = async () => {
  setStatus("Building HTML...");

  try {
    const mod = await import("@/components/bookEngine/HtmlBookBuilder");

    if (typeof mod.buildHtmlBook !== "function") {
      setStatus("❌ HtmlBookBuilder.buildHtmlBook missing");
      return;
    }

    // Pass title first, then pages array (match buildHtmlBook signature)
    const html: string = mod.buildHtmlBook("AksharaTantra Book", pages);

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `AksharaTantra-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);  // Ensure element is in DOM
    a.click();
    document.body.removeChild(a);  // Clean up

    URL.revokeObjectURL(url);
    setStatus("✅ HTML downloaded successfully");
  } catch (err) {
    console.error("HTML export error:", err);
    setStatus("❌ HTML export failed");
  }
};

/* --------------------------
   EXPORT: EPUB
 -------------------------- */
const handleDownloadEpub = async () => {
  setStatus("Building EPUB...");

  try {
    const mod = await import("@/components/bookEngine/EpubGenerator");

    if (typeof mod.generateEpub !== "function") {
      setStatus("❌ EpubGenerator.generateEpub missing");
      return;
    }

    // Pass title first, then pages array (standard signature)
    const epubBlob: Blob = await mod.generateEpub("AksharaTantra Book", pages);

    const url = URL.createObjectURL(epubBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AksharaTantra-${new Date().toISOString().slice(0,10)}.epub`;
    
    // Ensure proper DOM handling for blob downloads
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    setStatus("✅ EPUB downloaded successfully");
  } catch (err) {
    console.error("EPUB export error:", err);
    setStatus("❌ EPUB export failed");
  }
};

  /* --------------------------
        EXPORT: JSON
  -------------------------- */
  const handleDownloadJson = () => {
    exportJson(
      { language, pages, createdAt: new Date().toISOString() },
      "AksharaTantra_Book"
    );
    setStatus("JSON downloaded");
  };

  /* --------------------------
        CLEAR
  -------------------------- */
  const clearAll = () => {
    setPages([]);
    setEditorText("");
    setCurrentIdx(-1);
    setStatus("Cleared all");
  };

  /* =========================================================
        UI LAYOUT
  ========================================================= */
  return (
    <>
      <Navbar />

      <main className="px-6 md:px-12 lg:px-24 py-12 bg-gray-50 min-h-screen">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">
          🧠 AksharaTantra — OCR Workbench
        </h1>

        {/* LANGUAGE + FILE UPLOAD */}
        <section className="grid sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block mb-1 font-medium">OCR Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border w-full rounded px-3 py-2"
            >
              <option value="tel">Telugu</option>
              <option value="san">Sanskrit</option>
              <option value="hin">Hindi</option>
              <option value="eng">English</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Upload Images</label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                onChange={handleFilesSelected}
                type="file"
                multiple
                accept="image/*"
                className="border px-3 py-2 rounded w-full"
              />

              <button
                onClick={() =>
                  setStatus(files.length ? "Files ready" : "No files selected")
                }
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Validate
              </button>
            </div>
          </div>
        </section>

        {/* OCR BUTTONS */}
        <section className="flex gap-4 mb-8 flex-wrap">
          <BulkOcrProcessor
            files={files}
            language={language}
            onComplete={handleBulkComplete}
          />

          <OcrCore
            file={files[0] ?? null}
            language={language}
            onResult={handleSingleOcrResult}
          />

          <TextCleaner text={editorText} onClean={handleClean} />

          {isVedicLanguage && (
            <VedicPitchTools
              text={editorText}
              onApply={(t) => setEditorText(t)}
            />
          )}
        </section>

        {/* PAGE LIST + EDITOR */}
        <section className="grid md:grid-cols-3 gap-6">
          {/* LIST */}
          <div className="bg-white p-4 rounded shadow-md h-fit">
            <h2 className="font-semibold mb-2">Pages</h2>

            <div className="max-h-72 overflow-auto space-y-2">
              {pages.length === 0 && (
                <div className="text-gray-500">No pages yet.</div>
              )}

              {pages.map((p, i) => (
                <div
                  key={i}
                  className={`p-2 border rounded ${
                    currentIdx === i ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  <button
                    onClick={() => openPageForEdit(i)}
                    className="text-left block w-full"
                  >
                    <div className="truncate text-sm">{p.slice(0, 120)}</div>
                    <div className="text-xs text-gray-500">
                      Page {i + 1}
                    </div>
                  </button>

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => openPageForEdit(i)}
                      className="text-xs border px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePage(i)}
                      className="text-xs border px-2 py-1 rounded text-red-600 bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={clearAll} className="px-3 py-2 border rounded">
                Clear
              </button>
            </div>
          </div>

          {/* EDITOR */}
          <div className="md:col-span-2 bg-white p-4 rounded shadow-md">
            <h2 className="font-semibold mb-2">Editor</h2>

            <textarea
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              rows={12}
              className="border rounded w-full p-3 text-lg"
              placeholder="Select a page to edit..."
            />

            <div className="mt-3 flex gap-2">
              <button
                onClick={saveEditedPage}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save Page
              </button>

              {currentIdx >= 0 && (
                <button
                  onClick={() => setEditorText(pages[currentIdx])}
                  className="px-4 py-2 border rounded"
                >
                  Revert
                </button>
              )}
            </div>
          </div>
        </section>

        {/* EXPORT */}
        <section className="mt-8 bg-white p-4 rounded shadow-md max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadHtml}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Download HTML
            </button>

            <button
              onClick={handleDownloadEpub}
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              Download EPUB
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-4 py-2 bg-gray-700 text-white rounded"
            >
              Download JSON
            </button>
          </div>
        </section>

        {/* STATUS */}
        <div className="mt-4 text-sm text-gray-600">Status: {status}</div>
      </main>

      <GoToTopButton />
    </>
  );
};

export default OcrWorkPage;

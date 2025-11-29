"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

type SectionKey =
  | "language"
  | "upload"
  | "cleaning"
  | "preview"
  | "vedicTools"
  | "export";

export default function OcrEnginePage() {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    language: false,
    upload: false,
    cleaning: false,
    preview: false,
    vedicTools: false,
    export: false,
  });

  const toggle = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const icon = (open: boolean) => (open ? "▾" : "▸");

  return (
    <>
      <Navbar />

      <main className="w-full min-h-screen bg-white dark:bg-gray-900 px-6 md:px-12 lg:px-24 py-16">
        <h1 className="text-3xl md:text-5xl font-bold text-left text-gray-900 dark:text-white mb-12">
          🧠 AksharaTantra OCR Engine
        </h1>

        {/* ---------- Language Selection ---------- */}
        <section className="mb-12 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.language}
            onClick={() => toggle("language")}
            className="cursor-pointer text-2xl font-semibold mb-4 select-none"
          >
            {icon(expanded.language)} 🔤 Select Language
          </h2>

          {expanded.language && (
            <div className="p-4 border rounded-lg">
              {/* Placeholder Component */}
              <p className="text-gray-600 dark:text-gray-300">
                <b>LanguageSelector Component will render here.</b>  
                User will pick language (Telugu / Sanskrit / Hindi / English / etc.)
              </p>
            </div>
          )}
        </section>

        {/* ---------- Upload Section ---------- */}
        <section className="mb-12 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.upload}
            onClick={() => toggle("upload")}
            className="cursor-pointer text-2xl font-semibold mb-4 select-none"
          >
            {icon(expanded.upload)} 📤 Upload Images (Single / Bulk)
          </h2>

          {expanded.upload && (
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
                <b>OcrUploader Component will render here.</b>  
                Upload multiple images, show file list, validate input.
              </p>
            </div>
          )}
        </section>

        {/* ---------- Cleaning Section ---------- */}
        <section className="mb-12 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.cleaning}
            onClick={() => toggle("cleaning")}
            className="cursor-pointer text-2xl font-semibold mb-4 select-none"
          >
            {icon(expanded.cleaning)} 🧽 OCR Text Cleaning (Generic)
          </h2>

          {expanded.cleaning && (
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
                <b>TextCleaner Component will render here.</b>  
                Auto spacing, unicode fix, removal of noise.
              </p>
            </div>
          )}
        </section>

        {/* ---------- Preview / Editor ---------- */}
        <section className="mb-12 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.preview}
            onClick={() => toggle("preview")}
            className="cursor-pointer text-2xl font-semibold mb-4 select-none"
          >
            {icon(expanded.preview)} 📝 OCR Editor & Preview
          </h2>

          {expanded.preview && (
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
                <b>OcrEditor + OcrPreviewList Components will render here.</b>
                Edit, delete, reorder pages.
              </p>
            </div>
          )}
        </section>

        {/* ---------- Vedic Tools ---------- */}
        <section className="mb-12 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.vedicTools}
            onClick={() => toggle("vedicTools")}
            className="cursor-pointer text-2xl font-semibold mb-4 select-none"
          >
            {icon(expanded.vedicTools)} 🕉 Vedic Pitch Tools (Only Telugu/Sanskrit)
          </h2>

          {expanded.vedicTools && (
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
                <b>VedicPitchTools Component will render here.</b>  
                High 🔼 / Low 🔽 pitch buttons for selected languages.
              </p>
            </div>
          )}
        </section>

        {/* ---------- Export Section ---------- */}
        <section className="mb-12 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.export}
            onClick={() => toggle("export")}
            className="cursor-pointer text-2xl font-semibold mb-4 select-none"
          >
            {icon(expanded.export)} 📚 Export as HTML / EPUB / JSON
          </h2>

          {expanded.export && (
            <div className="p-4 border rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
                <b>HtmlBookBuilder + EpubGenerator + JsonExporter Components will come here.</b>  
                Build multi-page book → download.
              </p>
            </div>
          )}
        </section>
      </main>

      <GoToTopButton />
    </>
  );
}

"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import FileLanguageAnalyzer from "@/components/FileLanguageAnalyzer";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

export default function UploadPage() {
  const [expanded, setExpanded] = useState({
    howToUse: true,
    whatYouCanUpload: true,
    privacyFirst: true,
  });

  const toggleSection = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const icon = (isExpanded) => (isExpanded ? "▾" : "▸");

  return (
    <>
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            📤 Upload & Decode Instantly
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Upload your images or documents and let{" "}
            <span className="text-blue-600 font-semibold">MultiDecode</span> extract text in seconds — with support for{" "}
            <b>34+ languages</b>.
          </p>
        </header>

        {/* How to Use - Expandable */}
        <section className="mb-12 max-w-4xl mx-auto text-left">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.howToUse}
            aria-controls="howto-content"
            onClick={() => toggleSection("howToUse")}
            onKeyDown={(e) => {
              if(e.key === "Enter" || e.key === " ") toggleSection("howToUse");
            }}
            className="cursor-pointer text-2xl font-semibold mb-4 text-gray-900 dark:text-white select-none"
          >
            How to Use {icon(expanded.howToUse)}
          </h2>
          {expanded.howToUse && (
            <ol id="howto-content" className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 text-lg">
              <li>Click the &quot;Choose File&quot; button to upload an image or document.</li>
              <li>Select your preferred language for OCR analysis (or let auto-detect handle it).</li>
              <li>View the extracted text instantly.</li>
            </ol>
          )}
        </section>

        {/* What You Can Upload - Expandable */}
        <section className="mb-16 max-w-4xl mx-auto text-left">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.whatYouCanUpload}
            aria-controls="upload-content"
            onClick={() => toggleSection("whatYouCanUpload")}
            onKeyDown={(e) => {
              if(e.key === "Enter" || e.key === " ") toggleSection("whatYouCanUpload");
            }}
            className="cursor-pointer text-2xl font-semibold mb-4 text-gray-900 dark:text-white select-none"
          >
            What You Can Upload {icon(expanded.whatYouCanUpload)}
          </h2>
          {expanded.whatYouCanUpload && (
            <ul
              id="upload-content"
              className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-lg"
            >
              <li>📄 Images (JPG, PNG, BMP, TIFF, etc.)</li>
              <li>📝 Scanned PDFs or handwritten text images</li>
              <li>🌍 Multi-language documents (supports 34+ languages)</li>
            </ul>
          )}
        </section>

        {/* Privacy First - Expandable */}
        <section className="mb-16 max-w-4xl mx-auto text-left">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.privacyFirst}
            aria-controls="privacy-content"
            onClick={() => toggleSection("privacyFirst")}
            onKeyDown={(e) => {
              if(e.key === "Enter" || e.key === " ") toggleSection("privacyFirst");
            }}
            className="cursor-pointer text-2xl font-semibold mb-4 text-gray-900 dark:text-white select-none"
          >
            🔒 Privacy First {icon(expanded.privacyFirst)}
          </h2>
          {expanded.privacyFirst && (
            <p
              id="privacy-content"
              className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              Your files are processed securely. <b>We do not save or store</b> any uploads or extracted text. All your documents remain private and only accessible to you.
            </p>
          )}
        </section>

        {/* FileLanguageAnalyzer - no expand/collapse */}
        <section className="mb-16">
          <FileLanguageAnalyzer />
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

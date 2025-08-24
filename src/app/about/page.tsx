"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

type SectionKey = "framework" | "ocr" | "languageData" | "installation" | "summary";

export default function About() {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    framework: false,
    ocr: false,
    languageData: false,
    installation: false,
    summary: false,
  });

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const icon = (isExpanded: boolean) => (isExpanded ? "▾" : "▸");

  return (
    <>
      <Navbar />

      <main className="container">
        <h1 className="title">Tools and Technologies Used</h1>

        {/* Framework and Platform */}
        <section className="section">
          <h2
            tabIndex={0}
            onClick={() => toggleSection("framework")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("framework");
            }}
            role="button"
            aria-expanded={expanded.framework}
            className="section-header"
          >
            Framework and Platform {icon(expanded.framework)}
          </h2>
          {expanded.framework && (
            <ul className="section-list">
              <li><strong>Next.js:</strong> React framework for SSR, SSG, and API routes enabling fast, SEO-friendly apps.</li>
              <li><strong>Progressive Web App (PWA):</strong> Provides offline capabilities, push notifications, and installability.</li>
            </ul>
          )}
        </section>

        {/* OCR and Document Processing */}
        <section className="section">
          <h2
            tabIndex={0}
            onClick={() => toggleSection("ocr")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("ocr");
            }}
            role="button"
            aria-expanded={expanded.ocr}
            className="section-header"
          >
            OCR and Document Processing {icon(expanded.ocr)}
          </h2>
          {expanded.ocr && (
            <ul className="section-list">
              <li><strong>Tesseract.js:</strong> JavaScript OCR engine for multi-language text recognition from images.</li>
              <li><strong>pdf-poppler:</strong> Converts PDF pages to images server-side for better OCR (outside Vercel).</li>
              <li><strong>pdf-parse:</strong> Extracts text directly from PDFs.</li>
              <li><strong>mammoth:</strong> Extracts text from Microsoft Word (.docx) files.</li>
              <li><strong>pptx2json:</strong> Parses PPTX slides for text extraction.</li>
              <li><strong>Compromise (nlp):</strong> Natural Language Processing library for keyword extraction and summarization.</li>
            </ul>
          )}
        </section>

        {/* OCR Language Data */}
        <section className="section">
          <h2
            tabIndex={0}
            onClick={() => toggleSection("languageData")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("languageData");
            }}
            role="button"
            aria-expanded={expanded.languageData}
            className="section-header"
          >
            OCR Language Data and Models {icon(expanded.languageData)}
          </h2>
          {expanded.languageData && (
            <>
              <p className="section-text">OCR trained language models (.traineddata files) sourced from:</p>
              <ul className="section-list">
                <li><a href="https://github.com/tesseract-ocr/tessdata_best" target="_blank" rel="noopener noreferrer" className="link">tessdata_best</a> – high quality OCR language models.</li>
                <li><a href="https://github.com/tesseract-ocr/tessdata" target="_blank" rel="noopener noreferrer" className="link">tessdata</a> – standard OCR models.</li>
              </ul>
              <p className="section-text">Language data placed in <code>public/tessdata</code> folder.</p>
            </>
          )}
        </section>

        {/* App Installation and Testing */}
        <section className="section">
          <h2
            tabIndex={0}
            onClick={() => toggleSection("installation")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("installation");
            }}
            role="button"
            aria-expanded={expanded.installation}
            className="section-header"
          >
            Application Installation and Testing {icon(expanded.installation)}
          </h2>
          {expanded.installation && (
            <ul className="section-list">
              <li>Supports PWA installation for desktops and mobiles.</li>
              <li>Testing includes manual validation of OCR accuracy on images and documents.</li>
              <li>Automated and performance tests with chunk concurrency control (using p-limit).</li>
            </ul>
          )}
        </section>

        {/* Summary */}
        <section className="section">
          <h2
            tabIndex={0}
            onClick={() => toggleSection("summary")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("summary");
            }}
            role="button"
            aria-expanded={expanded.summary}
            className="section-header"
          >
            Summary {icon(expanded.summary)}
          </h2>
          {expanded.summary && (
            <p className="section-text">
              This project combines modern web technologies (Next.js, PWA) with advanced OCR and NLP tools and multi-language support to provide fast, accurate document and image text extraction and analysis.
            </p>
          )}
        </section>
      </main>

      <GoToTopButton />
    </>
  );
}

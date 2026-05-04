"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

type SectionKey =
  | "framework"
  | "ocr"
  | "languageData"
  | "installation"
  | "summary";

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

      <main className="bg-white text-black min-h-screen py-12 px-6">

        <div className="max-w-4xl mx-auto">

          <h1 className="text-3xl font-bold mb-10 text-center">
            Tools and Technologies Used
          </h1>

          {/* Framework */}
          <section className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            <h2
              tabIndex={0}
              role="button"
              aria-expanded={expanded.framework}
              onClick={() => toggleSection("framework")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  toggleSection("framework");
              }}
              className="text-xl font-semibold cursor-pointer flex justify-between"
            >
              Framework and Platform
              <span>{icon(expanded.framework)}</span>
            </h2>

            {expanded.framework && (
              <ul className="mt-4 space-y-2 text-gray-800">
                <li>
                  <strong>Next.js:</strong> React framework for SSR, SSG and API
                  routes enabling fast SEO-friendly apps.
                </li>
                <li>
                  <strong>Progressive Web App (PWA):</strong> Provides offline
                  capabilities, push notifications and installability.
                </li>
              </ul>
            )}
          </section>

          {/* OCR */}
          <section className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            <h2
              tabIndex={0}
              role="button"
              aria-expanded={expanded.ocr}
              onClick={() => toggleSection("ocr")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleSection("ocr");
              }}
              className="text-xl font-semibold cursor-pointer flex justify-between"
            >
              OCR and Document Processing
              <span>{icon(expanded.ocr)}</span>
            </h2>

            {expanded.ocr && (
              <ul className="mt-4 space-y-2 text-gray-800">
                <li><strong>Tesseract.js:</strong> OCR engine for multi-language text recognition.</li>
                      <li><strong>pdf-parse:</strong> Extracts text directly from PDFs.</li>
                <li><strong>mammoth:</strong> Extracts text from DOCX files.</li>
                <li><strong>pptx2json:</strong> Parses PPTX slides.</li>
                <li><strong>Compromise (NLP):</strong> Used for keyword extraction.</li>
              </ul>
            )}
          </section>

          {/* Language Models */}
          <section className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            <h2
              tabIndex={0}
              role="button"
              aria-expanded={expanded.languageData}
              onClick={() => toggleSection("languageData")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  toggleSection("languageData");
              }}
              className="text-xl font-semibold cursor-pointer flex justify-between"
            >
              OCR Language Data and Models
              <span>{icon(expanded.languageData)}</span>
            </h2>

            {expanded.languageData && (
              <>
                <p className="mt-4 text-gray-800">
                  OCR trained models (.traineddata files) sourced from:
                </p>

                <ul className="mt-2 space-y-2">
                  <li>
                    <a
                      href="https://github.com/tesseract-ocr/tessdata_best"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      tessdata_best
                    </a>{" "}
                    – high quality OCR models
                  </li>

                  <li>
                    <a
                      href="https://github.com/tesseract-ocr/tessdata"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      tessdata
                    </a>{" "}
                    – standard OCR models
                  </li>
                </ul>

                <p className="mt-3">
                  Language data placed in <code>public/tessdata</code>.
                </p>
              </>
            )}
          </section>

          {/* Installation */}
          <section className="border border-gray-200 rounded-lg p-6 mb-6 bg-white">
            <h2
              tabIndex={0}
              role="button"
              aria-expanded={expanded.installation}
              onClick={() => toggleSection("installation")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  toggleSection("installation");
              }}
              className="text-xl font-semibold cursor-pointer flex justify-between"
            >
              Application Installation and Testing
              <span>{icon(expanded.installation)}</span>
            </h2>

            {expanded.installation && (
              <ul className="mt-4 space-y-2 text-gray-800">
                <li>Supports PWA installation for desktops and mobiles.</li>
                <li>Manual validation of OCR accuracy on images.</li>
                <li>Performance tests with chunk concurrency control.</li>
              </ul>
            )}
          </section>

          {/* Summary */}
          <section className="border border-gray-200 rounded-lg p-6 bg-white">
            <h2
              tabIndex={0}
              role="button"
              aria-expanded={expanded.summary}
              onClick={() => toggleSection("summary")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  toggleSection("summary");
              }}
              className="text-xl font-semibold cursor-pointer flex justify-between"
            >
              Summary
              <span>{icon(expanded.summary)}</span>
            </h2>

            {expanded.summary && (
              <p className="mt-4 text-gray-800">
                This project combines modern web technologies like Next.js and
                PWA with OCR and NLP tools to deliver fast and accurate document
                text extraction.
              </p>
            )}
          </section>

        </div>

      </main>

      <GoToTopButton />
    </>
  );
}

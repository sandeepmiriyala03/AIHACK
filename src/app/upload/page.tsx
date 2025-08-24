"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Instructions from "@/components/Instructions";
import FileUploadManager from "@/components/FileUploadManager";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";
import "@/Styles/Navbar.css";
type SectionKey = "instructions" | "fileUpload";

export default function Upload() {
  // Track expanded state for each section
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    instructions: true,
    fileUpload: true,
  });

  const toggleSection = (section: SectionKey) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const icon = (isExpanded: boolean) => (isExpanded ? "▾" : "▸");

  return (
    <>
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        <h1 className="title mb-8">Document Upload &amp; Analysis</h1>

        {/* Instructions Section */}
        <section className="instructions mb-8">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.instructions}
            aria-controls="instructions-content"
            onClick={() => toggleSection("instructions")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("instructions");
            }}
            className="cursor-pointer font-semibold text-xl mb-4 select-none"
          >
            Instructions {icon(expanded.instructions)}
          </h2>
          {expanded.instructions && (
            <div id="instructions-content">
              <Instructions />
            </div>
          )}
        </section>

        {/* File Upload Section */}
        <section className="file-upload mb-8">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.fileUpload}
            aria-controls="fileupload-content"
            onClick={() => toggleSection("fileUpload")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("fileUpload");
            }}
            className="cursor-pointer font-semibold text-xl mb-4 select-none"
          >
            File Upload Manager {icon(expanded.fileUpload)}
          </h2>
          {expanded.fileUpload && (
            <div id="fileupload-content">
              <FileUploadManager />
            </div>
          )}
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

"use client";

import React from 'react';
import Navbar from "@/components/Navbar";

import FileLanguageAnalyzer from "@/components/FileLanguageAnalyzer"; // The combined OCR & analysis component
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

export default function UploadPage() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem' }}>
  
        <FileLanguageAnalyzer />
      </main>
      <GoToTopButton />
    </>
  );
}

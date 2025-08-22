"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import FileLanguageAnalyzer from "@/components/FileLanguageAnalyzer"; // The combined OCR & analysis component
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

export default function UploadPage() {
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
            Upload your images or documents below and let{" "}
            <span className="text-blue-600 font-semibold">MultiDecode</span> extract text in seconds — with support for{" "}
            <b>34+ languages</b>.
          </p>
        </header>

        {/* Quick Steps / Instructions */}
        <section className="mb-12 max-w-4xl mx-auto text-left">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">How to Use</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 text-lg">
            <li>Click the &quot;Choose File&quot; button to upload an image or document.</li>
            <li>Select your preferred language for OCR analysis (or let auto-detect handle it).</li>
            <li>View the extracted text instantly.</li>
          </ol>
        </section>

        {/* Extra Info */}
        <section className="mb-16 max-w-4xl mx-auto text-left">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">What You Can Upload</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-lg">
            <li>📄 Images (JPG, PNG, BMP, TIFF, etc.)</li>
            <li>📝 Scanned PDFs or handwritten text images</li>
            <li>🌍 Multi-language documents (supports 34+ languages)</li>
          </ul>
        </section>

        {/* Privacy Note */}
        <section className="mb-16 max-w-4xl mx-auto text-left">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">🔒 Privacy First</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Your files are processed securely. <b>We do not save or store</b> any uploads or extracted text. All your documents remain private and only accessible to you.
          </p>
        </section>

        {/* Closing CTA */}
        <section className="text-center mt-12">
          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 mb-4">
            Ready to get started? Upload your file now and let MultiDecode handle the rest 🎉
          </p>
        </section>

        {/* The OCR/Analyzer Component */}
        <section className="mb-16">
          <FileLanguageAnalyzer />
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

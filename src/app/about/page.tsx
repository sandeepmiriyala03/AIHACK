"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

// Define valid keys as union type
type SectionKey = "intro" | "features" | "howItWorks" | "privacy" | "cta";

export default function About() {
  // Expanded states for all sections
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    intro: false,
    features: false,
    howItWorks: false,
    privacy: false,
    cta: false,
  });

  // Toggle function by key with typed parameter
  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Helper UI text for expand/collapse icon
  const icon = (isExpanded: boolean) => (isExpanded ? "▾" : "▸");

  return (
    <>
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        {/* Hero Section (not collapsible) */}
        <header className="page-header mb-12 text-left">
          <h1 className="title text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600">MultiDecode</span> 🚀
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
            Powerful, easy-to-use OCR platform supporting over 34 languages — upload your images and documents to instantly extract, explore, and understand text anywhere, anytime.
          </p>
        </header>

        {/* Intro / Story Section */}
        <section className="instructions mb-12 max-w-4xl text-justify space-y-6 text-gray-800 dark:text-gray-300">
          <h2
            className="cursor-pointer font-semibold text-xl mb-4"
            onClick={() => toggleSection("intro")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleSection("intro");
            }}
            aria-expanded={expanded.intro}
            aria-controls="intro-content"
          >
            Intro / Story {icon(expanded.intro)}
          </h2>
          {expanded.intro && (
            <div id="intro-content">
              <p>MultiDecode is your friendly platform for exploring and analyzing documents using powerful AI and OCR tools...</p>
              <p>The platform is designed with younger users and beginners in mind...</p>
              <p>We support <b>over 34 languages</b>, making text extraction seamless...</p>
              <p>If you have any questions, feedback, or need support, don’t hesitate to contact us.</p>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="features mb-16 max-w-5xl">
          <h2
            className="cursor-pointer text-2xl font-semibold mb-6 text-gray-900 dark:text-white"
            onClick={() => toggleSection("features")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleSection("features");
            }}
            aria-expanded={expanded.features}
            aria-controls="features-content"
          >
            ✨ What Makes MultiDecode Special? {icon(expanded.features)}
          </h2>
          {expanded.features && (
            <ul id="features-content" className="space-y-3 text-lg text-gray-700 dark:text-gray-300 list-disc pl-6">
              <li>🌍 <b>34+ Languages</b> supported with advanced OCR.</li>
              <li>⚡ <b>Fast & Accurate</b> extraction for instant results.</li>
              <li>📱 <b>User-Friendly</b> on desktop, tablet, and mobile.</li>
              <li>📤 <b>Upload Anything</b> — from scanned docs to photos.</li>
              <li>💡 <b>Educational & Fun</b> design for younger audiences.</li>
            </ul>
          )}
        </section>

        {/* How It Works */}
        <section className="how-it-works mb-16 max-w-5xl">
          <h2
            className="cursor-pointer text-2xl font-semibold mb-6 text-gray-900 dark:text-white"
            onClick={() => toggleSection("howItWorks")}
            aria-expanded={expanded.howItWorks}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleSection("howItWorks");
            }}
            aria-controls="how-it-works-content"
            role="button"
          >
            🛠 How It Works {icon(expanded.howItWorks)}
          </h2>
          {expanded.howItWorks && (
            <div id="how-it-works-content" className="grid gap-6 md:grid-cols-3 text-gray-800 dark:text-gray-200">
              <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
                📤 <b>Step 1:</b> Upload an image or document
              </div>
              <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
                🔍 <b>Step 2:</b> MultiDecode extracts the text instantly
              </div>
              <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
                📄 <b>Step 3:</b> Copy, edit, or export your result
              </div>
            </div>
          )}
        </section>

        {/* Privacy & Security */}
        <section className="privacy mb-16 max-w-5xl">
          <h2
            className="cursor-pointer text-2xl font-semibold mb-6 text-gray-900 dark:text-white"
            onClick={() => toggleSection("privacy")}
            aria-expanded={expanded.privacy}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleSection("privacy");
            }}
            aria-controls="privacy-content"
            role="button"
          >
            🔒 Privacy & Security {icon(expanded.privacy)}
          </h2>
          {expanded.privacy && (
            <p id="privacy-content" className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-justify">
              Your privacy comes first. MultiDecode <b>does NOT save, share, or store</b> your files or extracted text. Everything is handled securely so only you have access to your data.
            </p>
          )}
        </section>

        {/* Call To Action */}
        <section className="text-center mt-12">
          <a
            href="/upload"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg md:text-xl px-8 py-4 rounded-lg shadow-lg transition"
          >
            🚀 Start Using MultiDecode Today
          </a>
        </section>
      </main>

      <GoToTopButton />
    </>
  );
}

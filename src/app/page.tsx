"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

type SectionKey = "hero" | "mission" | "features" | "howItWorks" | "whyChoose" | "privacy";

export default function About() {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    hero: true,
    mission: true,
    features: true,
    howItWorks: true,
    whyChoose: true,
    privacy: true,
  });

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const icon = (open: boolean) => (open ? "▾" : "▸");

  return (
    <>
      <Navbar />
      <main className="w-full min-h-screen bg-white dark:bg-gray-900 px-6 md:px-12 lg:px-24 py-16">
        {/* Hero Section */}
        <section className="mb-20 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.hero}
            aria-controls="hero-content"
            onClick={() => toggleSection("hero")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("hero");
            }}
            className="cursor-pointer text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white text-left select-none"
          >
            {icon(expanded.hero)} Welcome to <span className="text-blue-600">MultiDecode</span> 🚀
          </h2>
          {expanded.hero && (
            <p id="hero-content" className="text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
              MultiDecode makes text extraction simple, fast, and accessible. Whether it’s images, scanned documents, or multilingual files – we help you decode information efficiently.
            </p>
          )}
        </section>

        {/* Mission */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.mission}
            aria-controls="mission-content"
            onClick={() => toggleSection("mission")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("mission");
            }}
            className="cursor-pointer text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-left select-none"
          >
            {icon(expanded.mission)} Our Mission
          </h2>
          {expanded.mission && (
            <p id="mission-content" className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-justify">
              To empower people around the world by making information accessible in any language, from any document, at any time.
            </p>
          )}
        </section>

        {/* Key Features */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.features}
            aria-controls="features-content"
            onClick={() => toggleSection("features")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("features");
            }}
            className="cursor-pointer text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-left select-none"
          >
            {icon(expanded.features)} Key Features
          </h2>
          {expanded.features && (
            <div id="features-content" className="grid gap-6 md:grid-cols-2 text-gray-800 dark:text-gray-200 text-left">
              <div>🌍 <b>Multi-Language OCR</b> – Supports 34+ languages.</div>
              <div>⚡ <b>Fast & Accurate</b> – Extract text in seconds.</div>
              <div>📱 <b>User-Friendly</b> – Works on both mobile & desktop.</div>
              <div>💡 <b>PWA Ready</b> – Install for smoother usage.</div>
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.howItWorks}
            aria-controls="how-it-works-content"
            onClick={() => toggleSection("howItWorks")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("howItWorks");
            }}
            className="cursor-pointer text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-left select-none"
          >
            {icon(expanded.howItWorks)} How It Works
          </h2>
          {expanded.howItWorks && (
            <div id="how-it-works-content" className="grid gap-6 md:grid-cols-3 text-left">
              <div className="p-6 border rounded-lg hover:shadow-lg transition">
                📤 <b>Step 1:</b> Upload your file
              </div>
              <div className="p-6 border rounded-lg hover:shadow-lg transition">
                🔍 <b>Step 2:</b> Let MultiDecode extract the text
              </div>
              <div className="p-6 border rounded-lg hover:shadow-lg transition">
                📄 <b>Step 3:</b> Copy, analyze, or export instantly
              </div>
            </div>
          )}
        </section>

        {/* Why Choose */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.whyChoose}
            aria-controls="why-choose-content"
            onClick={() => toggleSection("whyChoose")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("whyChoose");
            }}
            className="cursor-pointer text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-left select-none"
          >
            {icon(expanded.whyChoose)} Why Choose MultiDecode?
          </h2>
          {expanded.whyChoose && (
            <ul id="why-choose-content" className="space-y-3 text-lg text-gray-700 dark:text-gray-300 text-left">
              <li>✅ Completely free to use</li>
              <li>✅ Works on any device</li>
              <li>✅ Privacy-focused & secure</li>
              <li>✅ <b>We do NOT store your data</b> – everything is processed safely</li>
            </ul>
          )}
        </section>

        {/* Privacy */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2
            tabIndex={0}
            role="button"
            aria-expanded={expanded.privacy}
            aria-controls="privacy-content"
            onClick={() => toggleSection("privacy")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleSection("privacy");
            }}
            className="cursor-pointer text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-left select-none"
          >
            {icon(expanded.privacy)} Privacy & Security
          </h2>
          {expanded.privacy && (
            <p id="privacy-content" className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-justify">
              At MultiDecode, your privacy comes first. We <b>do not save, share, or store</b> any files or extracted text. All processing is done securely, so your information stays only with you.
            </p>
          )}
        </section>

        {/* Call to Action */}
        <section className="text-center mt-20">
          <a
            href="/upload"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg md:text-xl px-8 py-4 rounded-lg shadow-lg transition"
          >
            🚀 Try MultiDecode Now
          </a>
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import ShareSection from "@/components/SocailMedia/ShareSection";

import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

// Material Icons
import "@mui/icons-material";
import StarIcon from "@mui/icons-material/Star";
import LockIcon from "@mui/icons-material/Lock";
import BoltIcon from "@mui/icons-material/Bolt";
import LanguageIcon from "@mui/icons-material/Language";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

type SectionKey =
  | "hero"
  | "mission"
  | "features"
  | "howItWorks"
  | "whyChoose"
  | "privacy";

export default function About() {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    hero: true,
    mission: false,
    features: false,
    howItWorks: false,
    whyChoose: false,
    privacy: false,
  });

  const toggle = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const icon = (open: boolean) =>
    open ? (
      <ExpandLessIcon className="text-blue-600" />
    ) : (
      <ExpandMoreIcon className="text-blue-600" />
    );

  return (
    <>
      <Navbar />

      <main className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 px-6 md:px-12 lg:px-32 py-16">

        {/* HEADER */}
        <header className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            About <span className="text-blue-600">AksharaTantra</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A modern multilingual OCR + Vedic processing engine — fast, private,
            offline-capable & built for everyone.
          </p>
        </header>

        {/* CORE CONTENT */}
        <div className="space-y-10 max-w-5xl mx-auto">
          {[
            {
              key: "hero",
              title: (
                <>
                  <StarIcon className="text-yellow-500" /> Welcome to
                  AksharaTantra
                </>
              ),
              content:
                "AksharaTantra makes text extraction simple, private, and lightning-fast. Upload any multilingual image and instantly extract clean, editable text.",
            },
            {
              key: "mission",
              title: (
                <>
                  <LanguageIcon className="text-green-600" /> Our Mission
                </>
              ),
              content:
                "To make global information accessible in any language without sacrificing privacy or performance.",
            },
            {
              key: "features",
              title: (
                <>
                  <BoltIcon className="text-blue-500" /> Key Features
                </>
              ),
              content: (
                <ul className="grid gap-5 md:grid-cols-2">
                  <li>🌍 <b>34+ Languages Supported</b> — including Vedic-friendly Telugu & Sanskrit</li>
                  <li>⚡ <b>High-Speed OCR</b> powered by optimized Tesseract engine</li>
                  <li>📱 <b>PWA Support</b> — Install as an app on any device</li>
                  <li>🧠 <b>Smart Cleanup</b> — spacing, Vedic pitch marking, grapheme handling</li>
                </ul>
              ),
            },
            {
              key: "howItWorks",
              title: (
                <>
                  <MobileFriendlyIcon className="text-purple-500" /> How It
                  Works
                </>
              ),
              content: (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    📤 <b>Upload</b>
                    <p>Select single or bulk images in any language.</p>
                  </div>

                  <div className="p-6 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    🔍 <b>OCR Extract</b>
                    <p>AksharaTantra processes everything locally.</p>
                  </div>

                  <div className="p-6 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    📄 <b>Export</b>
                    <p>Save as HTML, EPUB, JSON, or Book preview.</p>
                  </div>
                </div>
              ),
            },
            {
              key: "whyChoose",
              title: (
                <>
                  ❤️ Why Choose Us?
                </>
              ),
              content: (
                <ul className="list-disc pl-8 space-y-2 text-lg">
                  <li>Completely free & offline-first</li>
                  <li>No server uploads — everything stays on your device</li>
                  <li>Powerful multilingual & Vedic OCR engine</li>
                  <li>High accuracy text cleanup and formatting</li>
                </ul>
              ),
            },
            {
              key: "privacy",
              title: (
                <>
                  <LockIcon className="text-red-500" /> Privacy & Security
                </>
              ),
              content:
                "No data is uploaded or stored anywhere. All OCR, all cleanup, all book building happens inside your browser. 100% private.",
            },
          ].map((sec) => (
            <section key={sec.key}>
              <button
                onClick={() => toggle(sec.key as SectionKey)}
                className="w-full flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-5 py-4 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <span className="text-left text-2xl font-semibold text-gray-900 dark:text-white">
                  {sec.title}
                </span>
                {icon(expanded[sec.key as SectionKey])}
              </button>

              {expanded[sec.key as SectionKey] && (
                <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  {sec.content}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* CALL TO ACTION */}
        <div className="text-center mt-20">
          <a
            href="/upload"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg md:text-xl px-10 py-4 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            🚀 Try AksharaTantra Now
          </a>

          {/* 🔗 Social Share Section */}
          <div className="mt-10 flex flex-col items-center">
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Share AksharaTantra with others:
            </p>
            <ShareSection />
          </div>
        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

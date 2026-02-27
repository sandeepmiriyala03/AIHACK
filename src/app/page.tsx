"use client";

import StarIcon from "@mui/icons-material/Star";
import LanguageIcon from "@mui/icons-material/Language";
import BoltIcon from "@mui/icons-material/Bolt";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";
import LockIcon from "@mui/icons-material/Lock";
import PsychologyIcon from "@mui/icons-material/Psychology";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import ShareSection from "@/components/SocailMedia/ShareSection";

export default function About() {
  const sectionBox =
    "p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-2xl";

  const title =
    "text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3";

  const content =
    "mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed";

  return (
    <>
      <Navbar />

      <main className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black px-6 md:px-16 lg:px-40 py-20">

        {/* ================= HERO ================= */}
        <header className="text-center mb-24">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
            AI That Reads Your World —{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 text-transparent bg-clip-text">
              Offline.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Multilingual OCR + Vedic AI Engine built for privacy,
            speed, and Indic knowledge systems.
            No uploads. No tracking. Pure browser AI.
          </p>

          <div className="mt-10">
            <a
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 text-lg rounded-full shadow-xl transition-transform hover:scale-105 inline-block"
            >
              🚀 Try Live OCR Demo
            </a>
          </div>
        </header>

        {/* ================= PROBLEM STATEMENT ================= */}
        <div className={`${sectionBox} mb-16`}>
          <h2 className={title}>
            ❌ The Problem with Most OCR Tools
          </h2>
          <p className={content}>
            Most OCR platforms send your documents to the cloud,
            store your data, and require internet access.
            For sensitive manuscripts, Vedic texts, or institutional archives —
            this creates privacy and reliability issues.
          </p>

          <p className={content}>
            AksharaTantra changes that completely.
          </p>
        </div>

        {/* ================= CORE SECTIONS ================= */}
        <div className="space-y-14 max-w-5xl mx-auto">

          {/* WELCOME */}
          <div className={sectionBox}>
            <h2 className={title}>
              <StarIcon className="text-yellow-500" />
              Welcome to AksharaTantra
            </h2>
            <p className={content}>
              Instantly extract multilingual text — fully offline,
              lightning-fast, and privacy-first.
              Designed especially for Telugu, Sanskrit, Hindi,
              English and 34+ languages.
            </p>
          </div>

          {/* MISSION */}
          <div className={sectionBox}>
            <h2 className={title}>
              <LanguageIcon className="text-green-600" />
              Our Mission
            </h2>
            <p className={content}>
              To empower scholars, students, digitization teams,
              and knowledge institutions with powerful offline AI tools —
              ensuring knowledge remains accessible and sovereign.
            </p>
          </div>

          {/* AI FEATURES */}
          <div className={sectionBox}>
            <h2 className={title}>
              <PsychologyIcon className="text-indigo-500" />
              AI-Powered Features
            </h2>

            <ul className="mt-4 space-y-3 text-gray-700 dark:text-gray-300 text-lg">
              <li>🌍 34+ Languages with Smart Script Handling</li>
              <li>⚡ High-Speed Optimized OCR Engine</li>
              <li>🧠 Vedic Pitch Marking & Intelligent Cleanup</li>
              <li>📱 Installable PWA — Works on Desktop & Mobile</li>
              <li>📚 Export as HTML, EPUB, JSON & Book Formats</li>
            </ul>
          </div>

          {/* COMPARISON */}
          <div className={sectionBox}>
            <h2 className={title}>
              <CompareArrowsIcon className="text-blue-500" />
              Why AksharaTantra is Different
            </h2>

            <div className="mt-6 grid md:grid-cols-2 gap-6 text-lg text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold mb-2">Cloud OCR Tools</h4>
                <ul className="space-y-2">
                  <li>❌ Requires Internet</li>
                  <li>❌ Uploads Your Data</li>
                  <li>❌ No Vedic Intelligence</li>
                  <li>❌ Not Installable</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-blue-600">
                  AksharaTantra
                </h4>
                <ul className="space-y-2">
                  <li>✅ 100% Offline</li>
                  <li>✅ Data Never Leaves Device</li>
                  <li>✅ Vedic Pitch & Cleanup Tools</li>
                  <li>✅ Installable PWA App</li>
                </ul>
              </div>
            </div>
          </div>

          {/* PRIVACY */}
          <div className={sectionBox}>
            <h2 className={title}>
              <LockIcon className="text-red-500" />
              Privacy & Security
            </h2>

            <p className={content}>
              No cloud. No storage. No analytics.
              Everything runs locally inside your browser.
              Your files never leave your device.
              True digital sovereignty.
            </p>
          </div>
        </div>

        {/* ================= FINAL CTA ================= */}
        <div className="text-center mt-28">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ready to Experience Private AI?
          </h3>

          <div className="mt-10">
            <a
              href="/upload"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-14 py-6 text-xl rounded-full shadow-xl transition-transform hover:scale-105 inline-block"
            >
              🚀 Start Using AksharaTantra
            </a>
          </div>

          <div className="mt-12">
            <ShareSection />
          </div>
        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

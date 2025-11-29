"use client";

import StarIcon from "@mui/icons-material/Star";
import LanguageIcon from "@mui/icons-material/Language";
import BoltIcon from "@mui/icons-material/Bolt";
import MobileFriendlyIcon from "@mui/icons-material/MobileFriendly";
import LockIcon from "@mui/icons-material/Lock";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import ShareSection from "@/components/SocailMedia/ShareSection";

export default function About() {
  const sectionBox =
    "p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700";

  const title = "text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2";
  const content = "mt-3 text-gray-700 dark:text-gray-300 text-lg leading-relaxed";

  return (
    <>
      <Navbar />

      <main className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 px-6 md:px-16 lg:px-40 py-16">

        {/* HEADER */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            About <span className="text-blue-600">AksharaTantra</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A multilingual OCR & Vedic processing engine — private, offline-first, and built for everyone.
          </p>
        </header>

        <div className="space-y-10 max-w-4xl mx-auto">

          {/* HERO */}
          <div className={sectionBox}>
            <h2 className={title}>
              <StarIcon className="text-yellow-500" /> Welcome to AksharaTantra
            </h2>
            <p className={content}>
              AksharaTantra instantly extracts multilingual text — fully offline, private, and fast. Perfect for
              Telugu, Sanskrit, Hindi, English and 34+ languages.
            </p>
          </div>

          {/* MISSION */}
          <div className={sectionBox}>
            <h2 className={title}>
              <LanguageIcon className="text-green-600" /> Our Mission
            </h2>
            <p className={content}>
              To make global documents easy to read and extract — without sending your data to any server.
            </p>
          </div>

          {/* FEATURES */}
          <div className={sectionBox}>
            <h2 className={title}>
              <BoltIcon className="text-blue-500" /> Key Features
            </h2>
            <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300 text-lg">
              <li>🌍 Supports 34+ languages including Telugu & Sanskrit</li>
              <li>⚡ Ultra-fast OCR powered by optimized Tesseract</li>
              <li>📱 Installable PWA — works on any device</li>
              <li>🧠 Smart Vedic marking, spacing cleanup & formatting</li>
            </ul>
          </div>

          {/* HOW IT WORKS */}
          <div className={sectionBox}>
            <h2 className={title}>
              <MobileFriendlyIcon className="text-purple-500" /> How It Works
            </h2>
            <ol className={content + " space-y-3"}>
              <li>📤 Upload: Single or bulk images</li>
              <li>🔍 OCR Engine: Processes locally inside your browser</li>
              <li>📚 Export: HTML, EPUB, JSON or digital book format</li>
            </ol>
          </div>

          {/* WHY CHOOSE US */}
          <div className={sectionBox}>
            <h2 className={title}>❤️ Why Choose Us?</h2>
            <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300 text-lg">
              <li>100% free & offline-first</li>
              <li>No data uploads — everything stays on your device</li>
              <li>High accuracy for Vedic and multilingual text</li>
              <li>Simple UI for all age groups</li>
            </ul>
          </div>

          {/* PRIVACY */}
          <div className={sectionBox}>
            <h2 className={title}>
              <LockIcon className="text-red-500" /> Privacy & Security
            </h2>
            <p className={content}>
              No cloud, no storage, no analytics. Everything runs locally.  
              Your files never leave your device — complete privacy.
            </p>
          </div>
        </div>

        {/* CTA SECTION */}
        <div className="text-center mt-20">
          <a
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 text-xl rounded-full shadow-lg transition-transform hover:scale-105 inline-block"
          >
            🚀 Try AksharaTantra Now
          </a>

          <div className="mt-10">
            <ShareSection />
          </div>
        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

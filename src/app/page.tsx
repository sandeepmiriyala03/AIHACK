"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

export default function About() {
  return (
    <>
      <Navbar />
      <main className="w-full min-h-screen bg-white dark:bg-gray-900 px-6 md:px-12 lg:px-24 py-16">
        
        {/* Hero Section (Left aligned instead of center) */}
        <section className="mb-20 max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white text-left">
            Welcome to <span className="text-blue-600">MultiDecode</span> 🚀
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
            MultiDecode makes text extraction simple, fast, and accessible. 
            Whether it’s images, scanned documents, or multilingual files – 
            we help you decode information efficiently.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-left">
            Our Mission
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-justify">
            To empower people around the world by making information accessible in
            any language, from any document, at any time.
          </p>
        </section>

        {/* Key Features */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-left">
            Key Features
          </h2>
          <div className="grid gap-6 md:grid-cols-2 text-gray-800 dark:text-gray-200 text-left">
            <div>🌍 <b>Multi-Language OCR</b> – Supports 34+ languages.</div>
            <div>⚡ <b>Fast & Accurate</b> – Extract text in seconds.</div>
            <div>📱 <b>User-Friendly</b> – Works on both mobile & desktop.</div>
            <div>💡 <b>PWA Ready</b> – Install for smoother usage.</div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-left">
            How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3 text-left">
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
        </section>

        {/* Why Choose */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-left">
            Why Choose MultiDecode?
          </h2>
          <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300 text-left">
            <li>✅ Completely free to use</li>
            <li>✅ Works on any device</li>
            <li>✅ Privacy-focused & secure</li>
            <li>✅ <b>We do NOT store your data</b> – everything is processed safely</li>
          </ul>
        </section>

        {/* Privacy Section */}
        <section className="mb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-left">
            Privacy & Security
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-justify">
            At MultiDecode, your privacy comes first. We <b>do not save, share, or store</b> 
            any files or extracted text. All processing is done securely, so your 
            information stays only with you.
          </p>
        </section>

        {/* Call to Action (Now Centered for Emphasis) */}
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

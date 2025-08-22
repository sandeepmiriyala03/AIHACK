"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

export default function About() {
  return (
    <>
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        {/* Hero Section */}
        <header className="page-header mb-12 text-left">
          <h1 className="title text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600">MultiDecode</span> 🚀
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
            Powerful, easy-to-use OCR platform supporting over 34 languages — 
            upload your images and documents to instantly extract, explore, 
            and understand text anywhere, anytime.
          </p>
        </header>

        {/* Intro / Story Section */}
        <section className="instructions mb-12 max-w-4xl text-justify space-y-6 text-gray-800 dark:text-gray-300">
          <p>
            MultiDecode is your friendly platform for exploring and analyzing
            documents using powerful AI and OCR tools. Whether you want to upload
            pictures or documents, extract text in multiple languages, or learn
            more about OCR, we provide an easy and fun experience.
          </p>
          <p>
            The platform is designed with younger users and beginners in mind,
            featuring a youthful, intuitive design 🧩 with engaging menus that
            make text extraction accessible and enjoyable for all ages.
          </p>
          <p>
            We support <b>over 34 languages</b>, making text extraction from
            images and documents seamless and versatile—all directly at
            your fingertips.
          </p>
          <p>
            If you have any questions, feedback, or need support, don’t hesitate
            to reach out via the Contact page. We’re here to help you get the
            most out of MultiDecode!
          </p>
        </section>

        {/* Features Section */}
        <section className="features mb-16 max-w-5xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            ✨ What Makes MultiDecode Special?
          </h2>
          <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300 list-disc pl-6">
            <li>🌍 <b>34+ Languages</b> supported with advanced OCR.</li>
            <li>⚡ <b>Fast & Accurate</b> extraction for instant results.</li>
            <li>📱 <b>User-Friendly</b> on desktop, tablet, and mobile.</li>
            <li>📤 <b>Upload Anything</b> — from scanned docs to photos.</li>
            <li>💡 <b>Educational & Fun</b> design for younger audiences.</li>
          </ul>
        </section>

        {/* How It Works */}
        <section className="how-it-works mb-16 max-w-5xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            🛠 How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3 text-gray-800 dark:text-gray-200">
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
        </section>

        {/* Privacy & Security */}
        <section className="privacy mb-16 max-w-5xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            🔒 Privacy & Security
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed text-justify">
            Your privacy comes first. MultiDecode <b>does NOT save, share, or
            store</b> your files or extracted text. Everything is handled securely
            so only you have access to your data.
          </p>
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

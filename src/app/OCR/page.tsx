"use client";

import Navbar from "@/components/Navbar";
import FileLanguageAnalyzer from "@/components/FileLanguageAnalyzer";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";


export default function UploadPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-12 space-y-20">

        {/* HERO */}
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            📤 Upload & Decode Instantly
          </h1>

          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 leading-relaxed">
            Upload images or documents and let{" "}
            <span className="text-blue-600 font-semibold">
              AksharaTantra
            </span>{" "}
            extract text instantly with support for <b>34+ languages</b>.
          </p>

          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <a
              href="#ocr-tool"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Start OCR
            </a>

            <a
              href="#how-it-works"
              className="px-6 py-3 border border-gray-400 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Learn More
            </a>
          </div>
        </section>


        {/* HOW IT WORKS */}
        <section id="how-it-works" className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center text-gray-900 dark:text-white">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                1️⃣ Upload
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Upload an image or scanned document containing text.
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                2️⃣ AI Recognition
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                AksharaTantra detects the script automatically and extracts the text.
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                3️⃣ Instant Result
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                The recognized text appears instantly for copying or editing.
              </p>
            </div>

          </div>
        </section>

        {/* WHAT YOU CAN UPLOAD */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            What You Can Upload
          </h2>

          <ul className="space-y-2 text-gray-800 dark:text-gray-300 text-lg">
            <li>📄 Images (JPG, PNG, BMP, TIFF)</li>
            <li>📝 Scanned documents</li>
            <li>✍️ Handwritten text images</li>
            <li>🌍 Multi-language documents</li>
          </ul>
        </section>

        {/* OCR ENGINE */}
        <section className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            ⚙️ Intelligent OCR Engine
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-blue-100 dark:bg-gray-800 p-6 rounded-xl shadow">
              <h3 className="font-semibold text-lg mb-2 text-blue-700">
                🤖 Tesseract OCR
              </h3>

              <p className="text-gray-800 dark:text-gray-300">
                Primary OCR engine used for most documents and languages.
                Optimized for printed and digital text recognition.
              </p>
            </div>

            <div className="bg-green-100 dark:bg-gray-800 p-6 rounded-xl shadow">
              <h3 className="font-semibold text-lg mb-2 text-green-700">
                🧠 PaddleOCR (Fallback)
              </h3>

              <p className="text-gray-800 dark:text-gray-300">
                If confidence is low, the system automatically switches to
                PaddleOCR for improved recognition of complex or handwritten text.
              </p>
            </div>

          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            The OCR engine used for your document will appear after processing.
          </p>
        </section>

     {/* PRIVACY + LOCAL AI */}
<section className="max-w-4xl mx-auto">
  <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
    🔒 Privacy-First & Local AI
  </h2>

  <p className="text-gray-800 dark:text-gray-300 text-lg leading-relaxed mb-4">
    AksharaTantra is built with a <b>privacy-first approach</b>. 
    Your data never leaves your device — everything runs directly in your browser.
  </p>

  <div className="space-y-3 text-gray-800 dark:text-gray-300 text-lg">
    <p>✅ No file uploads to servers</p>
    <p>✅ No cloud processing</p>
    <p>✅ No API keys required</p>
    <p>✅ 100% client-side execution</p>
  </div>

  <div className="mt-6 p-5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
    <h3 className="font-semibold text-lg mb-2 text-blue-600">
      ⚡ Powered by Local AI
    </h3>

    <p className="text-gray-800 dark:text-gray-300">
      This application uses <b>local AI models</b> powered by 
      <span className="font-semibold"> Xenova Transformers</span>, 
      enabling intelligent document understanding, semantic search, and question answering 
      directly in your browser — without sending any data to external servers.
    </p>
  </div>

  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
    This ensures complete privacy, faster response times, and a secure offline-friendly experience.
  </p>
</section>


        {/* OCR TOOL */}
        <section
          id="ocr-tool"
          className="max-w-5xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-300 dark:border-gray-700"
        >
          <FileLanguageAnalyzer />
        </section>
      </main>

      <GoToTopButton />
    </>
  );
}
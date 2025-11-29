"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

/* ---------------- MATERIAL UI ICONS ---------------- */
import LanguageIcon from "@mui/icons-material/Language";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

export default function OcrEnginePage() {
  return (
    <>
      <Navbar />

      <main
        className="
          w-full min-h-screen 
          bg-gradient-to-b 
          from-gray-50 to-white 
          dark:from-gray-900 dark:to-gray-800 
          px-6 md:px-12 lg:px-32 py-16
        "
      >
        {/* PAGE TITLE */}
        <header className="mb-16 text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
            🧠 AksharaTantra <span className="text-blue-600">OCR Engine</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
            A complete offline OCR + Vedic processing engine built for accuracy,
            privacy, and multilingual support.
          </p>
        </header>

        {/* LIST SECTIONS LIKE ABOUT PAGE */}
        <div className="max-w-4xl mx-auto space-y-8">

          {/* LANGUAGE SELECTOR */}
          <div className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <LanguageIcon className="text-5xl text-blue-600" />
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Select Language
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                LanguageSelector component will render here.
              </p>
            </div>
          </div>

          {/* UPLOAD */}
          <div className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <UploadFileIcon className="text-5xl text-green-600" />
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Upload Images
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                OcrUploader component will render here (Single / Bulk).
              </p>
            </div>
          </div>

          {/* TEXT CLEANER */}
          <div className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <CleaningServicesIcon className="text-5xl text-yellow-600" />
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                OCR Text Cleaning
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Smart cleanup tools: spacing fix, noise removal, unicode repair.
              </p>
            </div>
          </div>

          {/* EDITOR */}
          <div className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <EditNoteIcon className="text-5xl text-purple-600" />
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                OCR Editor & Page Preview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Edit, reorder, delete OCR pages using OcrEditor + PreviewList.
              </p>
            </div>
          </div>

          {/* VEDIC TOOLS */}
          <div className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <AutoFixHighIcon className="text-5xl text-pink-500" />
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Vedic Pitch Tools
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                High 🔼 & Low 🔽 pitch tools for Telugu / Sanskrit Vedic chants.
              </p>
            </div>
          </div>

          {/* EXPORT */}
          <div className="flex items-center gap-5 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <LibraryBooksIcon className="text-5xl text-indigo-600" />
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Export Formats
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Export as HTML, EPUB, JSON or build a complete digital book.
              </p>
            </div>
          </div>

        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

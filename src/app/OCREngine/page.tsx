"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

/* ---------------- MATERIAL UI ICONS (Correct Imports) ---------------- */
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
          px-6 md:px-12 lg:px-24 py-16
        "
      >
        <h1 className="text-3xl md:text-5xl font-bold text-left text-gray-900 dark:text-white mb-12">
          🧠 AksharaTantra OCR Engine
        </h1>

        <div className="max-w-4xl mx-auto space-y-8">

          {/* --------- 1. Language Selection ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <LanguageIcon className="text-4xl text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Select Language
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                LanguageSelector Component will render here
              </p>
            </div>
          </div>

          {/* --------- 2. Upload Section ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <UploadFileIcon className="text-4xl text-green-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Images
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                OcrUploader Component will render here
              </p>
            </div>
          </div>

          {/* --------- 3. Cleaning Section ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <CleaningServicesIcon className="text-4xl text-yellow-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                OCR Text Cleaning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                TextCleaner Component will render here
              </p>
            </div>
          </div>

          {/* --------- 4. Editor Section ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <EditNoteIcon className="text-4xl text-purple-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                OCR Editor
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                OcrEditor + OcrPreviewList will appear here
              </p>
            </div>
          </div>

          {/* --------- 5. Vedic Tools ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <AutoFixHighIcon className="text-4xl text-pink-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Vedic Pitch Tools
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                High 🔼 / Low 🔽 tone marks for Telugu & Sanskrit
              </p>
            </div>
          </div>

          {/* --------- 6. Export Section ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
            <LibraryBooksIcon className="text-4xl text-indigo-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export Options
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                HtmlBookBuilder + EpubGenerator + JsonExporter
              </p>
            </div>
          </div>

        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

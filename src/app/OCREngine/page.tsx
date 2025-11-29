"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";
import "@/Styles/Navbar.css";

/* ---------------- MATERIAL UI ICONS ---------------- */
import {
  LanguageIcon,
  UploadFileIcon,
  CleaningServicesIcon,
  EditNoteIcon,
  AutoFixHighIcon,
  LibraryBooksIcon,
} from "@mui/icons-material";

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
          <div className="flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
            <LanguageIcon className="text-3xl text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Select Language</h3>
              <p className="text-gray-600 dark:text-gray-400">LanguageSelector Component will render here</p>
            </div>
          </div>

          {/* --------- 2. Upload Section ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
            <UploadFileIcon className="text-3xl text-green-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Upload Images</h3>
              <p className="text-gray-600 dark:text-gray-400">OcrUploader Component will render here</p>
            </div>
          </div>

          {/* --------- 3. Cleaning Section ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
            <CleaningServicesIcon className="text-3xl text-yellow-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">OCR Text Cleaning</h3>
              <p className="text-gray-600 dark:text-gray-400">TextCleaner Component will render here</p>
            </div>
          </div>

          {/* --------- 4. Editor ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
            <EditNoteIcon className="text-3xl text-purple-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">OCR Editor</h3>
              <p className="text-gray-600 dark:text-gray-400">OcrEditor + OcrPreviewList Components will be here</p>
            </div>
          </div>

          {/* --------- 5. Vedic Tools ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
            <AutoFixHighIcon className="text-3xl text-pink-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Vedic Pitch Tools</h3>
              <p className="text-gray-600 dark:text-gray-400">VedicPitchTools Component will render here</p>
            </div>
          </div>

          {/* --------- 6. Export Section ---------- */}
          <div className="flex items-center gap-4 p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all">
            <LibraryBooksIcon className="text-3xl text-indigo-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Export Options</h3>
              <p className="text-gray-600 dark:text-gray-400">HtmlBookBuilder + EpubGenerator + JsonExporter</p>
            </div>
          </div>
        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

/* MATERIAL UI ICONS */
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
          bg-gradient-to-b from-gray-50 to-white 
          dark:from-gray-900 dark:to-gray-800
          px-6 md:px-12 lg:px-24 py-16
        "
      >
        {/* PAGE TITLE */}
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-14">
          🧠 AksharaTantra OCR Engine
        </h1>

        {/* CONTENT BLOCKS */}
        <div className="max-w-4xl mx-auto space-y-7">

          {/* ------ 1. Language Selector ------ */}
          <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 transition">
            <LanguageIcon className="text-4xl text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Select Language
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                LanguageSelector component will appear here.
              </p>
            </div>
          </div>

          {/* ------ 2. Upload Images ------ */}
          <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 transition">
            <UploadFileIcon className="text-4xl text-green-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Images (Single / Bulk)
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                OcrUploader component will appear here.
              </p>
            </div>
          </div>

          {/* ------ 3. Text Cleaning ------ */}
          <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 transition">
            <CleaningServicesIcon className="text-4xl text-yellow-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                OCR Text Cleaning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                TextCleaner component will fix spacing + noise.
              </p>
            </div>
          </div>

          {/* ------ 4. Editor & Preview ------ */}
          <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 transition">
            <EditNoteIcon className="text-4xl text-purple-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                OCR Editor & Preview
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                OcrEditor + OcrPreviewList will appear here.
              </p>
            </div>
          </div>

          {/* ------ 5. Vedic Tools ------ */}
          <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 transition">
            <AutoFixHighIcon className="text-4xl text-pink-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Vedic Pitch Tools
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add 🔼 High / 🔽 Low tones for Telugu & Sanskrit.
              </p>
            </div>
          </div>

          {/* ------ 6. Export Tools ------ */}
          <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 transition">
            <LibraryBooksIcon className="text-4xl text-indigo-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export as HTML / EPUB / JSON
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                BookBuilder + EpubGenerator + JsonExporter.
              </p>
            </div>
          </div>

        </div>
      </main>

      <GoToTopButton />
    </>
  );
}

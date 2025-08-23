"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";
import SanskritOcrPage from "@/components/SanskritOcrPage";

export default function UploadPage() {
  const [showOcr, setShowOcr] = useState(true);

  return (
    <>
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        <section className="mb-4">
          <h2 
            className="cursor-pointer text-2xl font-semibold text-gray-900 dark:text-white select-none"
            onClick={() => setShowOcr(!showOcr)}
            tabIndex={0}
            onKeyDown={(e) => {
              if(e.key === "Enter" || e.key === " ") setShowOcr(!showOcr);
            }}
            aria-expanded={showOcr}
          >
            {showOcr ? "▾" : "▸"} Sanskrit OCR Tool
          </h2>
        </section>
        {showOcr && (
          <section className="mb-16">
            <SanskritOcrPage />
          </section>
        )}
      </main>
      <GoToTopButton />
    </>
  );
}

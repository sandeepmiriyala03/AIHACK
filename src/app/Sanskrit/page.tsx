"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";
import SanskritOcrPage from "@/components/SanskritOcrPage";

export default function UploadPage() {
  return (
    <>
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        <section className="mb-16">
          <SanskritOcrPage />
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

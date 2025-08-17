"use client";

import Navbar from "@/components/Navbar";
import Instructions from "@/components/Instructions";
import FileLanguageAnalyzer from "@/components/FileLanguageAnalyzer";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css"; // Ensure your global styles path is correct

export default function upload() {
  return (
    <>
      <Navbar />
      <main className="container">
        <h1 className="title">Document Upload & Analysis</h1>
        <Instructions />
        <FileLanguageAnalyzer />
      </main>
      <GoToTopButton />
    </>
  );
}

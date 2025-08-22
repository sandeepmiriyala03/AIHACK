"use client";

import Navbar from "@/components/Navbar";
import Instructions from "@/components/Instructions";
import FileUploadManager from "@/components/FileUploadManager";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

export default function Upload() {
  return (
    <>
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-24 py-12">
        <h1 className="title mb-8">Document Upload & Analysis</h1>
        <Instructions />
        <FileUploadManager />
      </main>
      <GoToTopButton />
    </>
  );
}

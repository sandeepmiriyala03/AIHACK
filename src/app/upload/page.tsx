"use client";

import Navbar from "@/components/Navbar";
import Instructions from "@/components/Instructions";
import FileUploadManager from "@/components/FileUploadManager";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css"; // Ensure your global styles path is correct

export default function upload() {
  return (
    <>
      <Navbar />
      <main className="container">
        <h1 className="title">Document Upload & Analysis</h1>
        <Instructions />
        <FileUploadManager />
      </main>
      <GoToTopButton />
    </>
  );
}

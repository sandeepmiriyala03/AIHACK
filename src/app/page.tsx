"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

export default function About() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "2rem", textAlign: "center" }}>
        <h1 className="title" style={{ marginBottom: "1rem" }}>Welcome to MultiDecode!</h1>
        <div style={{ fontSize: "1.1rem", color: "#333" }}>
          <div>• Easily upload images and documents for text extraction.</div>
          <div>• Support for over 38 languages with powerful OCR technology.</div>
          <div>• Quickly analyze and process your documents with a user-friendly interface.</div>
           <div>• Install the app for a smoother and enhanced experience.</div>
        </div>

      </main>
      <GoToTopButton />
    </>
  );
}

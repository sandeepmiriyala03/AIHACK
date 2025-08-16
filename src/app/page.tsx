"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import "@/Styles/globals.css";

export default function About() {
  return (
    <>
      <Navbar />
      <main className="container">
        <h1 className="title">AI Document Analyzer</h1>
        <p>
          This application allows users to upload documents and analyze them using
          Optical Character Recognition (OCR) and Natural Language Processing (NLP)
          techniques.
        </p>
        <p>
          The goal is to provide an easy-to-use interface for document analysis,
          making it accessible for various use cases such as data extraction,
          information retrieval, and more.
        </p>   
      </main>
      <GoToTopButton />
    </>
  );
}
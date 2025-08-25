"use client";
import React from 'react';
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
import ImageReader from "@/components/ImageReader"; // Import the ImageReader component

export default function About() {
  return (
    <>
      <Navbar />
      <main className="container">
       
        <section className="section">
          {/* The ImageReader component is placed here */}
          <ImageReader />
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}
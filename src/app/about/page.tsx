"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

export default function About() {
  return (
    <>
      <Navbar />
      <main className="container">
        <header className="page-header">
          <h1 className="title">
            Welcome to MultiDecode!
          </h1>
          <p>
            Powerful, easy-to-use OCR platform supporting over 38 languages — upload your images and documents to instantly extract and explore text.
          </p>
        </header>

        <section className="instructions">
          <p>
            MultiDecode is your friendly platform for exploring and analyzing documents using powerful AI and OCR tools. Whether you want to upload pictures or documents, extract text from multiple languages, or learn more about OCR, we provide an easy and fun experience.
          </p>
          <p>
            The platform is designed with younger users and beginners in mind, featuring playful and intuitive design with cartoonish menus to make text extraction accessible and enjoyable for all ages.
          </p>
          <p>
            We support over 38 languages, making text extraction from images and documents seamless and versatile—all at your fingertips.
          </p>
          <p>
            If you have any questions, feedback, or need support, don’t hesitate to reach out via the Contact page. We’re here to help you get the most out of MultiDecode!
          </p>
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

"use client";
export const dynamic = 'force-dynamic';
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
export default function About() {
  return (
    <>
      <Navbar />
      <main className="container">
        <h3 className="title">Media</h3>
        <p>
          A video walkthrough of AksharaTantra: multilingual OCR for Sanskrit, Telugu, Hindi and 30+ other
          languages, handwriting reading, text to speech and the poster and e-book makers, all running in the
          browser with no sign-up. <a href="/">See all tools</a>.
        </p>
        <section className="section">
          <video controls width="100%" aria-label="AksharaTantra walkthrough video">
            <source src="/Multi.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

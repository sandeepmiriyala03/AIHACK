"use client";
import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";
export default function About() {
  return (
    <>
      <Navbar />
      <main className="container">
        <h3 className="title">Media</h3>
        <section className="section">
          <video controls width="100%">
            <source src="/Multidecode.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}
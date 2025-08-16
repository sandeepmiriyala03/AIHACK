"use client";

import Navbar from "@/components/Navbar";
import GoToTopButton from "@/components/GoToTopButton";

export default function About() {
  return (
    <>
      <Navbar />
      <main className="container">
        <h1 className="title">About AI Playground</h1>
        <section className="instructions">
          <p>
            Welcome to AI Playground, your friendly platform for exploring and 
            analyzing documents using powerful AI tools. Whether you want to 
            upload files, use various document tools, or learn more about AI, 
            we provide an easy and fun experience.
          </p>
          <p>
            This platform is designed with younger users in mind, featuring playful 
            design and cartoonish menus to make AI accessible and enjoyable for all ages.
          </p>
          <p>
            If you have any questions, feedback, or need support, feel free to reach 
            out to us via the Contact page.
          </p>
        </section>
      </main>
      <GoToTopButton />
    </>
  );
}

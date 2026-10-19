"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 300;

/**
 * Uses the .goToTopButton and .goToTopButton.show styles in globals.css.
 * The button stays mounted so the fade-in/out transition works; while
 * hidden it is out of the tab order and hidden from screen readers.
 */
export default function GoToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
      ticking = false;
    };

    // Run at most once per frame while scrolling
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update(); // correct state if the page loads already scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

    // Move keyboard focus back to the top for keyboard and screen reader users
    document.getElementById("main-content")?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`goToTopButton${visible ? " show" : ""}`}
      aria-label="Go to top"
      title="Go to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
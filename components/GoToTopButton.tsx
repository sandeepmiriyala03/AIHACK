import { useEffect, useState } from "react";

export default function GoToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function toggleVisibility() {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (!visible) return null;
  return (
    <button
      onClick={scrollToTop}
      className="goToTopButton"
      aria-label="Go to top"
      title="Go to top"
    >
      ↑ 
    </button>
  );
}

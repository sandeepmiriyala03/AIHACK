import Link from "next/link";
import { useState } from "react";
import InstallApp from "@/components/installapp"; // Adjust path if needed

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo">AI Playground</div>
        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
        <ul className={isOpen ? "nav-menu open" : "nav-menu"}>
          <li className="about">
            <Link href="/about">
              <span className="icon about-icon" aria-label="About">ℹ️</span>
              About
            </Link>
          </li>
          <li className="upload">
            <Link href="/upload">
              <span className="icon upload-icon" aria-label="Upload">⬆️</span>
              Upload
            </Link>
          </li>
          <li className="install">
            {/* Install button from InstallApp component */}
            <InstallApp />
          </li>
        </ul>
      </div>
    </nav>
  );
}

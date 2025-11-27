import Link from "next/link";
import { useState } from "react";
import InstallApp from "@/components/installapp";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">

        {/* Logo */}
        <div className="logo">
          <span>AksharaTantra</span>
        </div>

        {/* Toggle Button */}
        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          ☰
        </button>

        {/* Menu */}
        <ul className={isOpen ? "nav-menu open" : "nav-menu"}>
          <li className="upload" onClick={closeMenu}>
            <Link href="/upload">📤 Upload</Link>
          </li>

          <li className="upload" onClick={closeMenu}>
            <Link href="/OCR">🖼️ OCR</Link>
          </li>

          <li className="upload" onClick={closeMenu}>
            <Link href="/Sanskrit">यथाक्षरं पठनम्</Link>
          </li>

          <li className="about" onClick={closeMenu}>
            <Link href="/Media">🎥 Media</Link>
          </li>

          <li className="install" onClick={closeMenu}>
            <InstallApp />
          </li>
        </ul>
      </div>
    </nav>
  );
}

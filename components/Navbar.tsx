"use client";

import Link from "next/link";
import { useState } from "react";
import InstallApp from "@/components/installapp";

/* ---- MATERIAL UI ICONS ---- */
import MenuIcon from "@mui/icons-material/Menu";
import UploadIcon from "@mui/icons-material/Upload";
import ImageIcon from "@mui/icons-material/Image";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CollectionsIcon from "@mui/icons-material/Collections";
import TerminalIcon from "@mui/icons-material/Terminal";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">

        {/* ------- LOGO (IMAGE + TITLE) ------- */}
        <div className="logo">
          <Link 
            href="/" 
            onClick={closeMenu}
            className="flex items-center gap-2"
          >
            {/* Logo Image */}
            <img 
              src="/icon-512.png"
              alt="Logo"
              className="h-4 w-4" 
            />

            <span>AksharaTantra</span>
          </Link>
        </div>

        {/* ------- MENU BUTTON (MOBILE) ------- */}
        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          <MenuIcon className="text-2xl" />
        </button>

        {/* ------- MENU LIST ------- */}
        <ul className={isOpen ? "nav-menu open" : "nav-menu"}>

          <li className="upload" onClick={closeMenu}>
            <Link href="/upload" className="flex items-center gap-2">
              <UploadIcon className="text-blue-600" /> Upload
            </Link>
          </li>

          <li className="upload" onClick={closeMenu}>
            <Link href="/OCR" className="flex items-center gap-2">
              <ImageIcon className="text-green-600" /> OCR
            </Link>
          </li>

          <li className="upload" onClick={closeMenu}>
            <Link href="/Sanskrit" className="flex items-center gap-2">
              <MenuBookIcon className="text-purple-600" /> यथाक्षरं पठनम्
            </Link>
          </li>

          <li className="about" onClick={closeMenu}>
            <Link href="/Media" className="flex items-center gap-2">
              <CollectionsIcon className="text-yellow-600" /> Media
            </Link>
          </li>

          <li className="about" onClick={closeMenu}>
            <Link href="/OCREngine" className="flex items-center gap-2">
              <TerminalIcon className="text-pink-500" /> OCREngine
            </Link>
          </li>

          <li className="install" onClick={closeMenu}>
            <InstallApp />
          </li>

        </ul>
      </div>
    </nav>
  );
}

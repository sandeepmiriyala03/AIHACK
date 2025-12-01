"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

/* ---- MATERIAL UI ICONS ---- */
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import UploadIcon from "@mui/icons-material/Upload";
import ImageIcon from "@mui/icons-material/Image";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CollectionsIcon from "@mui/icons-material/Collections";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import HomeIcon from "@mui/icons-material/Home";
import DownloadIcon from "@mui/icons-material/Download";

/* ---- DEMO INSTALL APP COMPONENT ---- */
// Replace this with your actual InstallApp component
function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App is already installed or not installable on this device");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Show button even if not installable for demo purposes
  return (
    <button
      onClick={handleInstallClick}
      className="install-button"
      disabled={!isInstallable && deferredPrompt !== null}
    >
      <DownloadIcon />
      <span>Install App</span>
    </button>
  );
}

/* ---- TYPES ---- */
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  isSpecial?: boolean;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ---- NAVIGATION ITEMS ---- */
  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: <HomeIcon />,
      iconColor: "text-cyan-500",
    },
    {
      href: "/upload",
      label: "Upload",
      icon: <UploadIcon />,
      iconColor: "text-blue-600",
      isSpecial: true,
    },
    {
      href: "/OCR",
      label: "OCR",
      icon: <ImageIcon />,
      iconColor: "text-green-600",
    },
    {
      href: "/Ocrwork",
      label: "RajaTantra Engine",
      icon: <AutoFixHighIcon />,
      iconColor: "text-pink-500",
    },
    {
      href: "/Sanskrit",
      label: "यथाक्षरं पठनम्",
      icon: <MenuBookIcon />,
      iconColor: "text-purple-600",
    },
    {
      href: "/Media",
      label: "Media",
      icon: <CollectionsIcon />,
      iconColor: "text-yellow-600",
    },
  ];

  /* ---- CLOSE MENU HANDLER ---- */
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  /* ---- TOGGLE MENU HANDLER ---- */
  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /* ---- SCROLL HANDLER ---- */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---- CLOSE MENU ON ESCAPE KEY ---- */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeMenu]);

  /* ---- PREVENT BODY SCROLL WHEN MENU IS OPEN ---- */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay for mobile menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <nav
        className={`navbar ${scrolled ? "scrolled" : ""}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="nav-container">
          {/* ------- LOGO SECTION ------- */}
          <div className="logo">
            <Link
              href="/"
              onClick={closeMenu}
              className="logo-link"
              aria-label="AksharaTantra Home"
            >
              {/* Logo Image with fallback */}
              <div className="logo-icon-wrapper">
                <img
                  src="/icon-512.png"
                  alt="AksharaTantra Logo"
                  className="logo-image"
                  width={40}
                  height={40}
                  loading="eager"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Logo Text */}
              <span className="logo-text">
                Akshara<span className="logo-text-accent">Tantra</span>
              </span>
            </Link>
          </div>

          {/* ------- MOBILE MENU TOGGLE ------- */}
          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="nav-menu"
          >
            {isOpen ? (
              <CloseIcon className="menu-icon" />
            ) : (
              <MenuIcon className="menu-icon" />
            )}
          </button>

          {/* ------- NAVIGATION MENU ------- */}
          <ul
            id="nav-menu"
            className={`nav-menu ${isOpen ? "open" : ""}`}
            role="menubar"
          >
            {navItems.map((item) => (
              <li
                key={item.href}
                className={`nav-item-wrapper ${item.isSpecial ? "special" : ""}`}
                role="none"
              >
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="nav-item"
                  role="menuitem"
                >
                  <span className={`nav-icon ${item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}

            {/* Install App Button - ALWAYS VISIBLE */}
            <li className="nav-item-wrapper install" role="none">
              <div onClick={closeMenu}>
                <InstallApp />
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
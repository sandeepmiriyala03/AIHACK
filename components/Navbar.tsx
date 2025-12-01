"use client";

import Link from "next/link";
import Image from "next/image";
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

/* -------- BEFOREINSTALLPROMPT TYPE -------- */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/* -------- INSTALL APP COMPONENT -------- */
function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
      console.log("User accepted installation");
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <button
      onClick={handleInstallClick}
      className="install-button"
      disabled={!isInstallable}
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

/* ---- NAVBAR COMPONENT ---- */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeMenu();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
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
          {/* LOGO */}
          <div className="logo">
            <Link href="/" onClick={closeMenu} className="logo-link">
              <div className="logo-icon-wrapper">
                <Image
                  src="/icon-512.png"
                  alt="AksharaTantra Logo"
                  width={40}
                  height={40}
                  priority
                  className="logo-image"
                />
              </div>
              <span className="logo-text">
                Akshara<span className="logo-text-accent">Tantra</span>
              </span>
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <CloseIcon className="menu-icon" />
            ) : (
              <MenuIcon className="menu-icon" />
            )}
          </button>

          {/* MENU */}
          <ul id="nav-menu" className={`nav-menu ${isOpen ? "open" : ""}`}>
            {navItems.map((item) => (
              <li
                key={item.href}
                className={`nav-item-wrapper ${
                  item.isSpecial ? "special" : ""
                }`}
              >
                <Link href={item.href} onClick={closeMenu} className="nav-item">
                  <span className={`nav-icon ${item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}

            {/* PWA BUTTON */}
            <li className="nav-item-wrapper install">
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

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
import InstallMobileIcon from "@mui/icons-material/InstallMobile";

/* -------- BEFOREINSTALLPROMPT TYPE -------- */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/* -------- INSTALL APP (FAB ICON ONLY) -------- */
function InstallApp({ className = "" }: { className?: string }) {
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

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <button
      onClick={handleInstall}
      aria-label="Install App"
      title="Install App"
      className={`
        rounded-full shadow-lg
        bg-gradient-to-tr from-indigo-600 to-purple-600
        text-white
        p-3
        hover:scale-105 active:scale-95
        transition-transform
        ${className}
      `}
    >
      <InstallMobileIcon fontSize="medium" />
    </button>
  );
}

/* ---- TYPES ---- */
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
}

/* ---- NAVBAR ---- */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen((p) => !p);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  /* ---- NAV ITEMS ---- */
  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: <HomeIcon />, iconColor: "text-cyan-500" },
    {
      href: "/upload",
      label: "Upload",
      icon: <UploadIcon />,
      iconColor: "text-blue-600",
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

  /* ---- SCROLL EFFECT ---- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- ESC CLOSE ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeMenu]);

  /* ---- SCROLL LOCK ---- */
  useEffect(() => {
    if (!isOpen) return;

    const y = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  return (
    <>
      {/* BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] md:hidden"
          onClick={closeMenu}
        />
      )}

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          {/* LOGO */}
          <Link href="/" onClick={closeMenu} className="logo-link">
            <Image
              src="/icon-512.png"
              alt="AksharaTantra"
              width={40}
              height={40}
            />
            <span>
              Akshara<span className="accent">Tantra</span>
            </span>
          </Link>

          {/* MENU TOGGLE */}
          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* MENU */}
          <ul className={`nav-menu ${isOpen ? "open" : ""}`}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="nav-item"
                >
                  <span className={item.iconColor}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* INSTALL FAB – SINGLE INSTANCE */}
      <InstallApp
        className="
          fixed bottom-5 right-5 z-[1001]
          md:bottom-6 md:right-6
        "
      />
    </>
  );
}

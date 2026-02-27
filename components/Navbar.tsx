"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

/* ---- MATERIAL UI ICONS ---- */
import HomeIcon from "@mui/icons-material/Home";
import UploadIcon from "@mui/icons-material/Upload";
import ImageIcon from "@mui/icons-material/Image";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CollectionsIcon from "@mui/icons-material/Collections";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
/* -------- BEFORE INSTALL PROMPT -------- */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
/* -------- INSTALL FAB (INLINE STYLE + ALL DEVICES) -------- */
function InstallApp() {
  const [mounted, setMounted] = useState(false);
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setMounted(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!mounted || !promptEvent) return null;

  const install = async () => {
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } finally {
      setPromptEvent(null);
    }
  };

  return (
    <button
      onClick={install}
      aria-label="Install App"
      title="Install AksharaTantra"
      type="button"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        boxShadow: "0 12px 30px rgba(16,185,129,0.35)",
        zIndex: 9999,
        transition: "all 0.3s ease",
      }}
    >
      <InstallMobileIcon style={{ fontSize: "28px" }} />
    </button>
  );
}


/* -------- NAV ITEMS -------- */
const navItems = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/upload", label: "Upload", icon: <UploadIcon /> },
  { href: "/OCR", label: "OCR", icon: <ImageIcon /> },

  // 👇 Best place for Manuscript
  { href: "/Manuscript", label: "Manuscript", icon: <AutoStoriesIcon /> },

  { href: "/Ocrwork", label: "RajaTantra", icon: <AutoFixHighIcon /> },
  { href: "/Sanskrit", label: "यथाक्षरं", icon: <MenuBookIcon /> },
  { href: "/Media", label: "Media", icon: <CollectionsIcon /> },
];

/* -------- NAVBAR -------- */
export default function Navbar() {
  return (
    <>
      {/* ===== DESKTOP TOP NAV ===== */}
      <nav className="navbar-desktop">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <Image src="/icon-512.png" alt="AksharaTantra" width={36} height={36} />
            <span>
              Akshara
              <span style={{ color: "var(--color-primary)" }}>Tantra</span>
            </span>
          </Link>

          <div className="nav-links">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="mobile-topbar">
        <Link href="/" className="logo">
          <Image src="/icon-512.png" alt="AksharaTantra" width={32} height={32} />
          <span>
            Akshara
            <span style={{ color: "var(--color-primary)" }}>Tantra</span>
          </span>
        </Link>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="mobile-bottom-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ===== INSTALL APP FAB ===== */}
      <InstallApp />
    </>
  );
}

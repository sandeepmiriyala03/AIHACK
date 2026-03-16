"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/* ---- MATERIAL UI ICONS ---- */
import HomeIcon from "@mui/icons-material/Home";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import DrawIcon from "@mui/icons-material/Draw";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CollectionsIcon from "@mui/icons-material/Collections";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import MicIcon from "@mui/icons-material/Mic";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import FingerprintIcon from "@mui/icons-material/Fingerprint";

/* -------- INSTALL FAB -------- */

function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent) return null;

  const install = async () => {
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <button
      onClick={install}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        height: "52px",
        borderRadius: "26px",
        border: "1px solid rgba(16,185,129,0.3)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: hovered ? "0 20px 0 16px" : "0 16px",
        maxWidth: hovered ? "180px" : "52px",
        background: "linear-gradient(135deg, #0f766e 0%, #059669 100%)",
        color: "white",
        zIndex: 9999,
      }}
    >
      <InstallMobileIcon />
      {hovered && "Install"}
    </button>
  );
}

/* -------- NAV ITEMS -------- */

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/kosha", label: "Kosha", icon: AccountBalanceIcon },
  { href: "/kyc", label: "KYC", icon: FingerprintIcon },
  { href: "/upload", label: "Upload", icon: UploadFileIcon },
  { href: "/ocr", label: "OCR", icon: DocumentScannerIcon },
  { href: "/ocreng", label: "HTR Indic", icon: DrawIcon },
  { href: "/ocrwork", label: "RajaTantra", icon: HistoryEduIcon },
  { href: "/sanskrit", label: "यथाक्षरं", icon: MenuBookIcon },
  { href: "/media", label: "Media", icon: CollectionsIcon },
  { href: "/voice", label: "Voice", icon: MicIcon },
  { href: "/vedha", label: "Vedha", icon: AutoStoriesIcon },
  { href: "/badge", label: "Badge", icon: MilitaryTechIcon },
  { href: "/posters", label: "Poster", icon: DashboardCustomizeIcon },
];

/* -------- NAVBAR -------- */

export default function Navbar() {
  const pathname = usePathname(); // ✅ FIXED

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);

    check();

    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      {/* DESKTOP NAV */}
      {!isMobile && (
        <nav
          style={{
            position: "fixed",
            top: 0,
            width: "100%",
            background: "#0a0e17",
            padding: "16px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* FIXED ICON PATH */}
            <Image src="/icons/icon-512.png" alt="logo" width={24} height={24} />
            <span style={{ color: "white", fontWeight: 700 }}>AksharaTantra</span>
          </Link>

          <div style={{ display: "flex", gap: 10 }}>
            {navItems.map((item) => {
              const Icon = item.icon;

              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch // ✅ helps offline caching
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    color: active ? "#10b981" : "#ccc",
                    textDecoration: "none",
                  }}
                >
                  <Icon style={{ fontSize: 16 }} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* MOBILE DRAWER */}
      {isMobile && (
        <>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ position: "fixed", top: 10, left: 10 }}
          >
            <MenuIcon />
          </button>

          {mobileOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
              }}
              onClick={() => setMobileOpen(false)}
            />
          )}

          <div
            ref={drawerRef}
            style={{
              position: "fixed",
              top: 0,
              left: mobileOpen ? 0 : "-260px",
              width: 260,
              height: "100%",
              background: "#0d1117",
              transition: "0.3s",
              padding: 20,
              zIndex: 2000,
            }}
          >
            <button onClick={() => setMobileOpen(false)}>
              <CloseIcon />
            </button>

            {navItems.map((item) => {
              const Icon = item.icon;

              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 10,
                    color: active ? "#10b981" : "#ccc",
                    textDecoration: "none",
                  }}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <InstallApp />
    </>
  );
}
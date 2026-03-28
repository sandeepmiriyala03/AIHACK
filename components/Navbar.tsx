"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* Icons */
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DocumentScannerRoundedIcon from "@mui/icons-material/DocumentScannerRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import HistoryEduRoundedIcon from "@mui/icons-material/HistoryEduRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ImageSearchRoundedIcon from "@mui/icons-material/ImageSearchRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import InstallMobileRoundedIcon from "@mui/icons-material/InstallMobileRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";

const G = "#10b981"; 
const TEXT_MAIN = "#1e293b";
const TEXT_SUB = "#64748b";

const navGroups = [
  {
    group: "Banking", 
    items: [
      { href: "/kyc", label: "Identity Check", icon: FingerprintRoundedIcon },
      { href: "/calendarpage", label: "Day Planner", icon: CalendarMonthRoundedIcon },
    ],
  },
  {
    group: "Digitize", 
    items: [
      { href: "/aksharadrishti", label: "Photo Scanner", icon: ImageSearchRoundedIcon },
      { href: "/OCR", label: "Text Reader", icon: DocumentScannerRoundedIcon },
      { href: "/ocreng", label: "Handwriting Reader", icon: DrawRoundedIcon },
      { href: "/upload", label: "Add Files", icon: UploadFileRoundedIcon },
    ],
  },
  {
    group: "Games", 
    items: [
      { href: "/chess", label: "Mind Game", icon: SportsEsportsRoundedIcon }
    ],
  },
  {
    group: "Heritage", 
    items: [
      { href: "/Sanskrit", label: "Sanskrit Books", icon: MenuBookRoundedIcon },
      { href: "/vedha", label: "Old Stories", icon: AutoStoriesRoundedIcon },
      { href: "/Media", label: "Photo Gallery", icon: CollectionsRoundedIcon },
    ],
  },
  {
    group: "Labs", 
    items: [
      { href: "/Ocrwork", label: "New Ideas", icon: HistoryEduRoundedIcon },
      { href: "/onecrdb", label: "Data List", icon: ScienceRoundedIcon },
    ],
  },
  {
    group: "Studio", 
    items: [
      { href: "/posters", label: "Make Posters", icon: DashboardCustomizeRoundedIcon },
      { href: "/badge", label: "Certificates", icon: MilitaryTechRoundedIcon }
    ],
  },
  {
    group: "Voice AI", 
    items: [
      { href: "/voice", label: "Talking AI", icon: MicRoundedIcon }
    ],
  },
];

/* PWA Logic */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function useInstallState() {
  const [state, setState] = useState<"checking" | "installed" | "promptable" | "ios" | "unsupported">("checking");
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    if (isStandalone) { setState("installed"); return; }
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
    if (isIOS && isSafari) { setState("ios"); return; }
    
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setState("promptable");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerPrompt = async () => {
    if (!promptRef.current) return;
    await promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === "accepted") setState("installed");
    promptRef.current = null;
  };
  return { state, triggerPrompt };
}

function InstallFab() {
  const { state, triggerPrompt } = useInstallState();
  if (state === "checking" || state === "unsupported" || state === "installed") return null;

  return (
    <button onClick={triggerPrompt} style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999, height: 48, padding: "0 20px", 
      borderRadius: 24, border: "none", background: G, color: "white", cursor: "pointer", 
      display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
      fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 14, transition: '0.2s'
    }}>
      {state === "ios" ? <IosShareRoundedIcon style={{ fontSize: 20 }} /> : <InstallMobileRoundedIcon style={{ fontSize: 20 }} />}
      <span>{state === "ios" ? "Add to Home" : "Install App"}</span>
    </button>
  );
}

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        
        .at-desktop-nav {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 2000;
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px);
          transition: all 0.3s ease; border-bottom: 1px solid rgba(0,0,0,0.05);
          display: flex; justify-content: space-between; align-items: center;
          padding: ${scrolled ? "8px 40px" : "14px 40px"};
        }

        .at-link-main {
          display: flex; align-items: center; gap: 4px; padding: 8px 12px;
          color: ${TEXT_SUB}; font-family: 'Outfit', sans-serif; font-size: 13.5px;
          font-weight: 500; text-decoration: none; border-radius: 8px; transition: 0.2s;
        }
        .at-link-main:hover { background: rgba(0,0,0,0.04); color: ${TEXT_MAIN}; }

        .nav-container { position: relative; display: inline-block; }
        
        .dropdown-menu {
          position: absolute; top: 100%; left: 50%; transform: translateX(-50%) translateY(10px);
          min-width: 170px; background: white; border: 1px solid rgba(0,0,0,0.08); 
          border-radius: 12px; padding: 6px; visibility: hidden; opacity: 0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 5000; transition: all 0.2s ease;
        }
        
        /* Edge check for Studio & Labs (the last two) */
        .nav-container:nth-last-child(-n+2) .dropdown-menu {
          left: auto; right: 0; transform: translateY(10px);
        }

        .nav-container:hover .dropdown-menu { 
          visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0); 
        }
        
        .nav-container:nth-last-child(-n+2):hover .dropdown-menu {
          transform: translateY(0);
        }

        .dropdown-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          color: ${TEXT_SUB}; text-decoration: none; font-size: 13px; border-radius: 8px;
        }
        .dropdown-item:hover { background: rgba(16,185,129,0.06); color: ${G}; }

        .at-drawer {
          position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
          background: white; z-index: 2200; transform: translateX(-100%);
          transition: 0.3s ease; display: flex; flex-direction: column;
        }
        .at-drawer.open { transform: translateX(0); }
      `}</style>

      {!isMobile && (
        <nav className="at-desktop-nav">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Image src="/icon-512.png" alt="Logo" width={24} height={24} />
            <span style={{ color: TEXT_MAIN, fontWeight: 700, fontFamily: 'Outfit', fontSize: 18 }}>
              Akshara<span style={{ color: G }}>Tantra</span>
            </span>
          </Link>

          <div style={{ display: "flex", gap: 4 }}>
            <Link href="/" className="at-link-main">Home</Link>
            {navGroups.map((group) => (
              <div key={group.group} className="nav-container">
                <div className="at-link-main" style={{ cursor: "pointer" }}>
                  {group.group} <KeyboardArrowDownRoundedIcon style={{ fontSize: 16, opacity: 0.4 }} />
                </div>
                <div className="dropdown-menu">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} className="dropdown-item">
                      <item.icon style={{ fontSize: 18 }} /> {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div /> 
        </nav>
      )}

      {/* Mobile view logic same as before but ensured category rendering */}
      {isMobile && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, zIndex: 2000, background: "white", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #eee" }}>
            <button onClick={() => setDrawerOpen(true)} style={{ background: "#f1f5f9", border: "none", padding: 8, borderRadius: 8 }}><MenuRoundedIcon /></button>
            <div style={{ flex: 1, textAlign: "center", fontWeight: 700 }}>AksharaTantra</div>
          </div>
          {drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.1)", zIndex: 2100 }} />}
          <div className={`at-drawer ${drawerOpen ? "open" : ""}`}>
             <div style={{ padding: 20, display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee" }}>
              <span style={{ fontWeight: 700 }}>Menu</span>
              <CloseRoundedIcon onClick={() => setDrawerOpen(false)} />
            </div>
            <div style={{ overflowY: 'auto' }}>
              {navGroups.map(g => (
                <div key={g.group} style={{ padding: "10px 0" }}>
                  <div style={{ padding: "4px 20px", fontSize: 11, color: TEXT_SUB, fontWeight: 700, textTransform: "uppercase" }}>{g.group}</div>
                  {g.items.map(i => (
                    <Link key={i.href} href={i.href} onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", textDecoration: "none", color: TEXT_MAIN }}>
                      <i.icon style={{ fontSize: 20, color: G }} /> {i.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <InstallFab />
    </>
  );
}
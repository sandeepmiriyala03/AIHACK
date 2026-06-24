"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* Icons */
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
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ImageSearchRoundedIcon from "@mui/icons-material/ImageSearchRounded";
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import InstallMobileRoundedIcon from "@mui/icons-material/InstallMobileRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import GroupsIcon from "@mui/icons-material/Groups";

// Icons
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'; 
import SportsCricketRoundedIcon from '@mui/icons-material/SportsCricketRounded'; 
import SpellcheckRoundedIcon from '@mui/icons-material/SpellcheckRounded';         
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';     
import TextSnippetRoundedIcon from '@mui/icons-material/TextSnippetRounded';       
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';   
import LocalLibraryRoundedIcon from '@mui/icons-material/LocalLibraryRounded';     
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';   

const G = "#10b981"; 
const TEXT_MAIN = "#0f172a"; 
const TEXT_SUB = "#64748b"; 

const navGroups = [
  {
    group: "AI Tools & Digitize", 
    items: [
      { href: "/aksharadrishti", label: "Photo Scanner", icon: ImageSearchRoundedIcon },
      { href: "/OCR", label: "Text Reader", icon: DocumentScannerRoundedIcon },
      { href: "/ocreng", label: "Handwriting Reader", icon: DrawRoundedIcon },
      { href: "/upload", label: "Add Files", icon: UploadFileRoundedIcon },
      { href: "/voice", label: "Talking AI", icon: MicRoundedIcon }
    ],
  },
  {
    group: "Heritage & Culture", 
    items: [
      { href: "/Sanskrit", label: "Sanskrit Books", icon: MenuBookRoundedIcon },
      { href: "/vedha", label: "Old Stories", icon: AutoStoriesRoundedIcon },
      { href: "/kosha", label: "Kosha Dictionary", icon: SpellcheckRoundedIcon },
      { href: "/Media", label: "Photo Gallery", icon: CollectionsRoundedIcon },
    ],
  },
  {
    group: "Business & Recreation", 
    items: [
      { href: "/kyc", label: "Secure KYC", icon: VerifiedUserRoundedIcon }, 
      { href: "/smsparser", label: "SMS Parser", icon: TextSnippetRoundedIcon }, 
      { href: "/chess", label: "Vedic Chess", icon: SportsEsportsRoundedIcon }, 
      { href: "/ipl", label: "IPL Dashboard", icon: SportsCricketRoundedIcon }, 
    ],
  },
  {
    group: "Studio & Labs", 
    items: [
      { href: "/posters", label: "Make Posters", icon: DashboardCustomizeRoundedIcon },
      { href: "/badge", label: "Certificates", icon: MilitaryTechRoundedIcon },
      { href: "/Ocrwork", label: "New Ideas", icon: HistoryEduRoundedIcon },
      { href: "/onecrdb", label: "Data List", icon: ScienceRoundedIcon },
      { href: "/calendarpage", label: "Calendar", icon: CalendarMonthRoundedIcon }, 
      { href: "/ebook", label: "E-Book Maker", icon: LocalLibraryRoundedIcon }, 
      { href: "/rupantarcode", label: "RupantarCode", icon: CodeRoundedIcon },
      { href: "/staffdirectory", label: "Staff Directory", icon: GroupsIcon },
      { href: "/user", label: "User List", icon: AccountCircleRoundedIcon }, 
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
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1024); 
    const handleScroll = () => setScrolled(window.scrollY > 10);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (groupName: string) => {
    if (activeDropdown === groupName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(groupName);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        
        .at-desktop-nav {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 2000;
          background: #ffffff;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
          border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          padding: ${scrolled ? "10px 24px" : "14px 24px"};
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
        }

        .at-menu-wrapper {
          display: flex;
          gap: 2px; /* 📉 Reduced gap between items from 8px to 2px */
          flex-wrap: nowrap; 
          justify-content: flex-end;
          flex: 1;
          margin-left: 12px;
        }

        .at-link-main {
          display: flex; align-items: center; gap: 1px; 
          padding: 6px 6px; /* 📉 Reduced inner padding from 12px to 6px */
          color: ${TEXT_SUB}; font-family: 'Outfit', sans-serif; font-size: 13.5px;
          font-weight: 500; text-decoration: none; border-radius: 6px; transition: all 0.15s ease;
          white-space: nowrap;
          user-select: none;
        }
        .at-link-main:hover, .at-link-main.active { background: #f1f5f9; color: ${TEXT_MAIN}; }

        .nav-container { position: relative; display: inline-block; }
        
        .dropdown-menu {
          position: absolute; top: 100%; left: 50%; transform: translateX(-50%) translateY(8px);
          min-width: 210px; background: #ffffff; border: 1px solid #e2e8f0; 
          border-radius: 12px; padding: 6px; 
          display: none; 
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); 
          z-index: 5000;
        }
        
        .dropdown-menu.show {
          display: block;
        }
        
        /* Dropdown Edge Correction */
        .nav-container:nth-last-child(-n+2) .dropdown-menu {
          left: auto; right: 0; transform: translateY(8px);
        }

        .dropdown-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px;
          color: ${TEXT_SUB}; text-decoration: none; font-size: 13.5px; 
          font-family: 'Outfit', sans-serif; font-weight: 500; border-radius: 8px;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .dropdown-item:hover { background: #f8fafc; color: ${TEXT_MAIN}; }
        .dropdown-item:hover .dropdown-icon { color: ${TEXT_MAIN} !important; }

        .at-drawer {
          position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
          background: #ffffff; z-index: 2200; transform: translateX(-100%);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column;
          border-right: 1px solid #e2e8f0;
        }
        .at-drawer.open { transform: translateX(0); }
      `}</style>

      {!isMobile && (
        <nav className="at-desktop-nav" ref={navRef}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }} onClick={() => setActiveDropdown(null)}>
            <Image src="/icon-512.png" alt="Logo" width={22} height={22} />
            <span style={{ color: TEXT_MAIN, fontWeight: 700, fontFamily: 'Outfit', fontSize: 18, letterSpacing: "-0.02em" }}>
              Akshara<span style={{ color: G }}>Tantra</span>
            </span>
          </Link>

          <div className="at-menu-wrapper">
            <Link href="/" className="at-link-main" onClick={() => setActiveDropdown(null)}>Home</Link>
            {navGroups.map((group) => (
              <div key={group.group} className="nav-container">
                <div 
                  className={`at-link-main ${activeDropdown === group.group ? 'active' : ''}`} 
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleDropdown(group.group)}
                >
                  {group.group} <KeyboardArrowDownRoundedIcon style={{ fontSize: 13, opacity: 0.5, marginLeft: 1, transform: activeDropdown === group.group ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                <div className={`dropdown-menu ${activeDropdown === group.group ? 'show' : ''}`}>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} className="dropdown-item" onClick={() => setActiveDropdown(null)}>
                      <item.icon className="dropdown-icon" style={{ fontSize: 18, color: "#94a3b8", transition: "color 0.15s" }} /> {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      )}

      {/* Mobile view Layer */}
      {isMobile && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, zIndex: 2000, background: "#ffffff", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #e2e8f0", boxSizing: "border-box" }}>
            <button onClick={() => setDrawerOpen(true)} style={{ background: "#f1f5f9", border: "none", padding: 8, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><MenuRoundedIcon sx={{ color: TEXT_MAIN }} /></button>
            <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontFamily: "Outfit, sans-serif", fontSize: 16, color: TEXT_MAIN }}>AksharaTantra</div>
          </div>
          {drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.15)", backdropFilter: "blur(4px)", zIndex: 2100 }} />}
          <div className={`at-drawer ${drawerOpen ? "open" : ""}`}>
             <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontWeight: 700, fontFamily: "Outfit, sans-serif", color: TEXT_MAIN }}>Navigation</span>
              <CloseRoundedIcon onClick={() => setDrawerOpen(false)} style={{ cursor: "pointer", color: TEXT_SUB }} />
            </div>
            <div style={{ overflowY: 'auto', paddingBottom: 20 }}>
              {navGroups.map(g => (
                <div key={g.group} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ padding: "4px 20px", fontSize: 11, color: TEXT_SUB, fontFamily: "Outfit, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{g.group}</div>
                  {g.items.map(i => (
                    <Link key={i.href} href={i.href} onClick={() => setDrawerOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", textDecoration: "none", color: TEXT_MAIN, fontFamily: "Outfit, sans-serif", fontSize: 14.5, fontWeight: 500 }}>
                      <i.icon style={{ fontSize: 20, color: TEXT_SUB }} /> {i.label}
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
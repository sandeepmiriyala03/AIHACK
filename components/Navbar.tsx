"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

import HomeRoundedIcon               from "@mui/icons-material/HomeRounded";
import UploadFileRoundedIcon         from "@mui/icons-material/UploadFileRounded";
import DocumentScannerRoundedIcon    from "@mui/icons-material/DocumentScannerRounded";
import DrawRoundedIcon               from "@mui/icons-material/DrawRounded";
import HistoryEduRoundedIcon         from "@mui/icons-material/HistoryEduRounded";
import MenuBookRoundedIcon           from "@mui/icons-material/MenuBookRounded";
import CollectionsRoundedIcon        from "@mui/icons-material/CollectionsRounded";
import InstallMobileRoundedIcon      from "@mui/icons-material/InstallMobileRounded";
import MicRoundedIcon                from "@mui/icons-material/MicRounded";
import AutoStoriesRoundedIcon        from "@mui/icons-material/AutoStoriesRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import MilitaryTechRoundedIcon       from "@mui/icons-material/MilitaryTechRounded";
import AccountBalanceRoundedIcon     from "@mui/icons-material/AccountBalanceRounded";
import FingerprintRoundedIcon        from "@mui/icons-material/FingerprintRounded";
import CloseRoundedIcon              from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon               from "@mui/icons-material/MenuRounded";

/* ─── types ─────────────────────────────────────────────────── */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ─── all nav items ──────────────────────────────────────────── */
const navItems = [
  { href: "/",         label: "Home",       icon: HomeRoundedIcon },
  { href: "/kosha",    label: "Kosha",      icon: AccountBalanceRoundedIcon },
  { href: "/kyc",      label: "KYC",        icon: FingerprintRoundedIcon },
  { href: "/upload",   label: "Upload",     icon: UploadFileRoundedIcon },
  { href: "/OCR",      label: "OCR",        icon: DocumentScannerRoundedIcon },
  { href: "/ocreng",   label: "HTR Indic",  icon: DrawRoundedIcon },
  { href: "/Ocrwork",  label: "RajaTantra", icon: HistoryEduRoundedIcon },
  { href: "/Sanskrit", label: "यथाक्षरं",  icon: MenuBookRoundedIcon },
  { href: "/Media",    label: "Media",      icon: CollectionsRoundedIcon },
  { href: "/voice",    label: "Voice",      icon: MicRoundedIcon },
  { href: "/vedha",    label: "Vedha",      icon: AutoStoriesRoundedIcon },
  { href: "/badge",    label: "Badge",      icon: MilitaryTechRoundedIcon },
  { href: "/posters",  label: "Poster",     icon: DashboardCustomizeRoundedIcon },
];

/*
  3 icon-only shortcuts in the mobile top-bar right side.
  One tap = instant navigation. No label needed — icon alone is clear.
*/
const TOP_SHORTCUTS = [
  { href: "/",      icon: HomeRoundedIcon,        label: "Home"  },
  { href: "/voice", icon: MicRoundedIcon,         label: "Voice" },
  { href: "/Media", icon: CollectionsRoundedIcon, label: "Media" },
];

const G  = "#10b981";  // emerald
const BG = "#0a0e17";  // nav background

/* ─── scroll hook ────────────────────────────────────────────── */
function useScrolled(threshold = 10) {
  const [s, set] = useState(false);
  useEffect(() => {
    const fn = () => set(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return s;
}

/* ─── install FAB ────────────────────────────────────────────── */
function InstallFab() {
  const [deferredPrompt, setDP] = useState<BeforeInstallPromptEvent | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const h = (e: Event) => { e.preventDefault(); setDP(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (!mounted || !deferredPrompt) return null;

  return (
    <button
      onClick={async () => {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDP(null);
      }}
      aria-label="Install AksharaTantra app"
      style={{
        position: "fixed", bottom: 24, right: 18, zIndex: 3000,
        width: 50, height: 50, borderRadius: "50%", border: "none",
        background: `linear-gradient(135deg,#0f766e,${G})`,
        color: "white", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(5,150,105,.5)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <InstallMobileRoundedIcon style={{ fontSize: 22 }} />
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const [mounted,    setMounted]    = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrolled  = useScrolled();
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname  = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen)
      drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus();
  }, [drawerOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* ══════════════ GLOBAL CSS ══════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        /* skip link */
        .at-skip {
          position:absolute;top:-100px;left:14px;
          padding:7px 14px;background:${G};color:#000;
          border-radius:4px;font-family:Outfit,sans-serif;font-weight:600;
          z-index:9999;transition:top .2s;
        }
        .at-skip:focus{top:14px;}

        /* logo */
        .at-logo {
          display:flex;align-items:center;gap:9px;
          text-decoration:none;color:white;
          font-family:Outfit,sans-serif;font-weight:700;font-size:17px;
          transition:opacity .2s;flex-shrink:0;
        }
        .at-logo:hover{opacity:.85;}
        .at-logo-ring {
          border-radius:9px;
          background:rgba(16,185,129,.13);
          border:1px solid rgba(16,185,129,.28);
          display:flex;align-items:center;justify-content:center;
          transition:background .2s;flex-shrink:0;
        }
        .at-logo:hover .at-logo-ring{background:rgba(16,185,129,.22);}

        /* desktop nav link */
        .at-link {
          position:relative;
          display:inline-flex;align-items:center;gap:5px;
          padding:6px 11px;border-radius:8px;text-decoration:none;
          color:rgba(255,255,255,.6);
          font-family:Outfit,sans-serif;font-size:13px;font-weight:500;
          letter-spacing:.02em;white-space:nowrap;
          transition:color .18s,background .18s;
        }
        .at-link:hover{color:rgba(255,255,255,.95);background:rgba(255,255,255,.06);}
        .at-link.active{color:${G};background:rgba(16,185,129,.1);}
        .at-link.active::after{
          content:'';position:absolute;bottom:-2px;left:50%;
          transform:translateX(-50%);
          width:16px;height:2px;background:${G};border-radius:2px;
        }

        /* mobile top bar */
        .at-topbar {
          position:fixed;top:0;left:0;right:0;z-index:2000;
          height:56px;
          display:flex;align-items:center;
          padding:0 10px;gap:8px;
          transition:background .3s;
        }

        /* hamburger */
        .at-menu-btn {
          width:40px;height:40px;border-radius:10px;flex-shrink:0;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
          color:white;display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:background .15s;
          -webkit-tap-highlight-color:transparent;
        }
        .at-menu-btn:active{background:rgba(255,255,255,.14);}

        /* top-bar shortcut icon buttons */
        .at-shortcut {
          width:40px;height:40px;border-radius:10px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          text-decoration:none;
          color:rgba(255,255,255,.5);
          border:1px solid transparent;
          transition:color .15s,background .15s,border-color .15s;
          -webkit-tap-highlight-color:transparent;
          position:relative;
        }
        .at-shortcut:active{background:rgba(255,255,255,.08);}
        .at-shortcut.active{
          color:${G};
          background:rgba(16,185,129,.12);
          border-color:rgba(16,185,129,.25);
        }
        /* active dot indicator */
        .at-shortcut.active::after{
          content:'';position:absolute;bottom:5px;left:50%;
          transform:translateX(-50%);
          width:4px;height:4px;border-radius:50%;background:${G};
        }

        /* overlay */
        .at-overlay {
          position:fixed;inset:0;z-index:2100;
          background:rgba(0,0,0,.58);
          backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
          animation:at-fade .22s ease;
        }
        @keyframes at-fade{from{opacity:0}to{opacity:1}}

        /* drawer */
        .at-drawer {
          position:fixed;top:0;left:0;bottom:0;
          width:78vw;max-width:290px;
          background:#0c1019;
          border-right:1px solid rgba(255,255,255,.07);
          z-index:2200;
          display:flex;flex-direction:column;
          transform:translateX(-100%);
          transition:transform .28s cubic-bezier(.4,0,.2,1);
          will-change:transform;
        }
        .at-drawer.open{transform:translateX(0);}

        .at-drawer-head{
          display:flex;align-items:center;justify-content:space-between;
          padding:15px 13px 12px;
          border-bottom:1px solid rgba(255,255,255,.06);
          flex-shrink:0;
        }

        .at-drawer-body{
          flex:1;overflow-y:auto;padding:10px 9px 16px;
          display:flex;flex-direction:column;gap:2px;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none;
        }
        .at-drawer-body::-webkit-scrollbar{display:none;}

        /* drawer link */
        .at-dlink {
          display:flex;align-items:center;gap:12px;
          padding:10px 11px;border-radius:10px;
          text-decoration:none;
          color:rgba(255,255,255,.62);
          font-family:Outfit,sans-serif;font-size:14.5px;font-weight:500;
          border:1px solid transparent;
          transition:background .15s,color .15s,border-color .15s;
          -webkit-tap-highlight-color:transparent;
        }
        .at-dlink:hover{background:rgba(255,255,255,.06);color:white;}
        .at-dlink:active{background:rgba(255,255,255,.09);}
        .at-dlink.active{
          color:${G};
          background:rgba(16,185,129,.09);
          border-color:rgba(16,185,129,.18);
        }

        .at-dlink-icon{
          width:34px;height:34px;border-radius:9px;
          background:rgba(255,255,255,.05);
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;transition:background .15s;
        }
        .at-dlink.active .at-dlink-icon{background:rgba(16,185,129,.14);}

        /* drawer close btn */
        .at-close{
          width:33px;height:33px;border-radius:8px;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);
          color:rgba(255,255,255,.6);cursor:pointer;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          transition:background .15s,color .15s;
        }
        .at-close:hover{background:rgba(255,255,255,.12);color:white;}
        .at-close:active{background:rgba(255,255,255,.16);}

        /* drawer footer */
        .at-drawer-foot{
          padding:11px 13px;border-top:1px solid rgba(255,255,255,.05);
          font-family:Outfit,sans-serif;font-size:10px;font-weight:500;
          color:rgba(255,255,255,.18);letter-spacing:.07em;text-transform:uppercase;
          flex-shrink:0;
        }

        /* thin divider between Home and rest */
        .at-divider{height:1px;background:rgba(255,255,255,.05);margin:5px 3px;}
      `}</style>

      <a href="#main-content" className="at-skip">Skip to main content</a>

      {/* ════════ DESKTOP ════════ */}
      {!isMobile && (
        <nav aria-label="Main Navigation" style={{
          position:"fixed",top:0,left:0,width:"100%",zIndex:2000,
          background: scrolled ? "rgba(10,14,23,.94)" : BG,
          backdropFilter: scrolled ? "blur(18px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom:`1px solid ${scrolled ? "rgba(16,185,129,.1)" : "rgba(255,255,255,.04)"}`,
          padding: scrolled ? "10px 36px" : "14px 36px",
          display:"flex",justifyContent:"space-between",alignItems:"center",
          transition:"all .35s ease",
        }}>
          <Link href="/" className="at-logo">
            <span className="at-logo-ring" style={{ width:36, height:36 }}>
              <Image src="/icon-512.png" alt="AksharaTantra" width={22} height={22} />
            </span>
            Akshara<span style={{ color:G }}>Tantra</span>
          </Link>

          <div style={{ display:"flex",alignItems:"center",gap:2 }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`at-link${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}>
                  <Icon style={{ fontSize:15 }} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ════════ MOBILE ════════ */}
      {isMobile && (
        <>
          {/* Top bar */}
          <div className="at-topbar" style={{
            background: scrolled ? "rgba(10,14,23,.94)" : BG,
            backdropFilter: scrolled ? "blur(16px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom:"1px solid rgba(255,255,255,.06)",
          }}>

            {/* left: hamburger */}
            <button className="at-menu-btn"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="at-mobile-menu"
              onClick={() => setDrawerOpen(true)}>
              <MenuRoundedIcon style={{ fontSize:21 }} />
            </button>

            {/* centre: logo */}
            <Link href="/" className="at-logo"
              style={{ flex:1, justifyContent:"center", fontSize:15 }}>
              <span className="at-logo-ring" style={{ width:30,height:30,borderRadius:8 }}>
                <Image src="/icon-512.png" alt="AksharaTantra" width={18} height={18} />
              </span>
              Akshara<span style={{ color:G }}>Tantra</span>
            </Link>

            {/* right: 3 icon shortcuts */}
            <div style={{ display:"flex",alignItems:"center",gap:2 }}>
              {TOP_SHORTCUTS.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}
                    className={`at-shortcut${active ? " active" : ""}`}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}>
                    <Icon style={{ fontSize:21 }} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Overlay */}
          {drawerOpen && (
            <div className="at-overlay"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true" />
          )}

          {/* Drawer */}
          <div
            id="at-mobile-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={`at-drawer${drawerOpen ? " open" : ""}`}
          >
            {/* header */}
            <div className="at-drawer-head">
              <Link href="/" className="at-logo" style={{ fontSize:14 }}
                onClick={() => setDrawerOpen(false)}>
                <span className="at-logo-ring" style={{ width:30,height:30,borderRadius:8 }}>
                  <Image src="/icon-512.png" alt="" width={18} height={18} aria-hidden="true" />
                </span>
                Akshara<span style={{ color:G }}>Tantra</span>
              </Link>
              <button className="at-close" aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}>
                <CloseRoundedIcon style={{ fontSize:17 }} />
              </button>
            </div>

            {/* links */}
            <nav className="at-drawer-body" aria-label="All pages">
              {navItems.map(({ href, label, icon: Icon }, i) => {
                const active = pathname === href;
                return (
                  <React.Fragment key={href}>
                    {/* visual separator after Home */}
                    {i === 1 && <div className="at-divider" />}
                    <Link
                      href={href}
                      className={`at-dlink${active ? " active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <span className="at-dlink-icon">
                        <Icon style={{ fontSize:17 }} />
                      </span>
                      {label}
                    </Link>
                  </React.Fragment>
                );
              })}
            </nav>

            <div className="at-drawer-foot">
              AksharaTantra · Ancient scripts, modern tools
            </div>
          </div>
        </>
      )}

      <InstallFab />
    </>
  );
}
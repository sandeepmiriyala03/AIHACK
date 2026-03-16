"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

import HomeRoundedIcon           from "@mui/icons-material/HomeRounded";
import UploadFileRoundedIcon     from "@mui/icons-material/UploadFileRounded";
import DocumentScannerRoundedIcon from "@mui/icons-material/DocumentScannerRounded";
import DrawRoundedIcon           from "@mui/icons-material/DrawRounded";
import HistoryEduRoundedIcon     from "@mui/icons-material/HistoryEduRounded";
import MenuBookRoundedIcon       from "@mui/icons-material/MenuBookRounded";
import CollectionsRoundedIcon    from "@mui/icons-material/CollectionsRounded";
import InstallMobileRoundedIcon  from "@mui/icons-material/InstallMobileRounded";
import MicRoundedIcon            from "@mui/icons-material/MicRounded";
import AutoStoriesRoundedIcon    from "@mui/icons-material/AutoStoriesRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import MilitaryTechRoundedIcon   from "@mui/icons-material/MilitaryTechRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import FingerprintRoundedIcon    from "@mui/icons-material/FingerprintRounded";
import CloseRoundedIcon          from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon           from "@mui/icons-material/MenuRounded";
import GridViewRoundedIcon       from "@mui/icons-material/GridViewRounded";

/* ─── types ─────────────────────────────────────────────────── */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ─── nav items ─────────────────────────────────────────────── */
const navItems = [
  { href: "/",          label: "Home",      icon: HomeRoundedIcon },
  { href: "/kosha",     label: "Kosha",     icon: AccountBalanceRoundedIcon },
  { href: "/kyc",       label: "KYC",       icon: FingerprintRoundedIcon },
  { href: "/upload",    label: "Upload",    icon: UploadFileRoundedIcon },
  { href: "/OCR",       label: "OCR",       icon: DocumentScannerRoundedIcon },
  { href: "/ocreng",    label: "HTR Indic", icon: DrawRoundedIcon },
  { href: "/Ocrwork",   label: "RajaTantra",icon: HistoryEduRoundedIcon },
  { href: "/Sanskrit",  label: "यथाक्षरं", icon: MenuBookRoundedIcon },
  { href: "/Media",     label: "Media",     icon: CollectionsRoundedIcon },
  { href: "/voice",     label: "Voice",     icon: MicRoundedIcon },
  { href: "/vedha",     label: "Vedha",     icon: AutoStoriesRoundedIcon },
  { href: "/badge",     label: "Badge",     icon: MilitaryTechRoundedIcon },
  { href: "/posters",   label: "Poster",    icon: DashboardCustomizeRoundedIcon },
];

/* bottom-nav shows first 4 items + "More" */
const BOTTOM_PRIMARY = navItems.slice(0, 4);

/* ─── scroll hook ────────────────────────────────────────────── */
function useScrolled(t = 10) {
  const [s, setS] = useState(false);
  useEffect(() => {
    const fn = () => setS(window.scrollY > t);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [t]);
  return s;
}

/* ─── install fab ────────────────────────────────────────────── */
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
      aria-label="Install AksharaTantra"
      style={{
        position: "fixed", bottom: 88, right: 16, zIndex: 3000,
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg,#0f766e,#059669)",
        border: "none", color: "white", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(5,150,105,0.45)",
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
  const scrolled = useScrolled();
  const drawerRef = useRef<HTMLDivElement>(null);

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

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
    if (drawerOpen) drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus();
  }, [drawerOpen]);

  if (!mounted) return null;

  /* ── shared colour tokens ── */
  const G = "#10b981";   // emerald
  const BG = "#0a0e17";  // near-black

  return (
    <>
      {/* ───────────── GLOBAL CSS ───────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        /* ── Desktop nav link ── */
        .at-link {
          position: relative;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 11px; border-radius: 8px;
          text-decoration: none;
          color: rgba(255,255,255,0.6);
          font-family: 'Outfit', sans-serif;
          font-size: 13px; font-weight: 500;
          letter-spacing: 0.02em; white-space: nowrap;
          transition: color .18s, background .18s;
        }
        .at-link:hover { color: rgba(255,255,255,.95); background: rgba(255,255,255,.06); }
        .at-link.active { color: ${G}; background: rgba(16,185,129,.1); }
        .at-link.active::after {
          content: ''; position: absolute; bottom: -1px; left: 50%;
          transform: translateX(-50%);
          width: 18px; height: 2px; background: ${G}; border-radius: 2px;
        }

        /* ── Logo ── */
        .at-logo {
          display: flex; align-items: center; gap: 9px;
          text-decoration: none; color: white;
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 17px;
          transition: opacity .2s;
        }
        .at-logo:hover { opacity: .85; }
        .at-logo-ring {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(16,185,129,.12);
          border: 1px solid rgba(16,185,129,.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background .2s;
        }
        .at-logo:hover .at-logo-ring { background: rgba(16,185,129,.22); }

        /* ── Bottom nav (mobile) ── */
        .at-bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 2000;
          height: 64px;
          background: rgba(10,14,23,0.97);
          border-top: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex; align-items: stretch;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .at-bn-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px; text-decoration: none; border: none; background: none;
          color: rgba(255,255,255,0.38); cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          -webkit-tap-highlight-color: transparent;
          transition: color .15s;
          padding: 0;
        }
        .at-bn-item.active { color: ${G}; }
        .at-bn-item .at-bn-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: ${G}; margin-top: 1px;
          opacity: 0; transition: opacity .15s;
        }
        .at-bn-item.active .at-bn-dot { opacity: 1; }
        .at-bn-pill {
          width: 44px; height: 30px; border-radius: 15px;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .at-bn-item.active .at-bn-pill { background: rgba(16,185,129,.14); }
        .at-bn-item:active .at-bn-pill { background: rgba(255,255,255,.06); }

        /* ── Drawer ── */
        .at-overlay {
          position: fixed; inset: 0; z-index: 2100;
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
          animation: at-fadein .2s ease;
        }
        @keyframes at-fadein { from { opacity:0 } to { opacity:1 } }

        .at-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 76vw; max-width: 300px;
          background: #0d1117;
          border-right: 1px solid rgba(255,255,255,.06);
          z-index: 2200;
          display: flex; flex-direction: column;
          transform: translateX(-100%);
          transition: transform .28s cubic-bezier(.4,0,.2,1);
          will-change: transform;
        }
        .at-drawer.open { transform: translateX(0); }

        .at-drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .at-drawer-body {
          flex: 1; overflow-y: auto; padding: 10px 10px 20px;
          display: flex; flex-direction: column; gap: 3px;
          -webkit-overflow-scrolling: touch;
        }

        .at-dlink {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; border-radius: 10px;
          text-decoration: none;
          color: rgba(255,255,255,.65);
          font-family: 'Outfit', sans-serif; font-size: 14.5px; font-weight: 500;
          transition: background .15s, color .15s;
          -webkit-tap-highlight-color: transparent;
        }
        .at-dlink:hover, .at-dlink:active { background: rgba(255,255,255,.06); color: white; }
        .at-dlink.active { color: ${G}; background: rgba(16,185,129,.1); }

        .at-dlink-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,.05);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background .15s;
        }
        .at-dlink.active .at-dlink-icon { background: rgba(16,185,129,.15); }

        .at-drawer-foot {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,.05);
          font-family: 'Outfit', sans-serif; font-size: 10.5px;
          color: rgba(255,255,255,.2); letter-spacing: .06em; text-transform: uppercase;
        }

        .at-close {
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
          color: rgba(255,255,255,.65); display: flex; align-items: center;
          justify-content: center; cursor: pointer; flex-shrink: 0;
          transition: background .15s, color .15s;
        }
        .at-close:hover { background: rgba(255,255,255,.12); color: white; }

        /* ── Mobile top bar ── */
        .at-topbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 2000;
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 14px;
          font-family: 'Outfit', sans-serif;
          transition: background .3s, border-color .3s;
        }

        .at-menu-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
          color: white; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: background .15s;
          -webkit-tap-highlight-color: transparent;
        }
        .at-menu-btn:active { background: rgba(255,255,255,.14); }

        /* body padding so content isn't hidden by top+bottom bars */
        body { padding-top: 56px; padding-bottom: 64px; }
      `}</style>

      <a href="#main-content" style={{
        position: "absolute", top: -100, left: 16,
        padding: "8px 16px", background: G, color: "#000",
        borderRadius: 4, fontFamily: "Outfit,sans-serif",
        fontWeight: 600, zIndex: 9999, transition: "top .2s",
      }}>
        Skip to main content
      </a>

      {/* ══════════════ DESKTOP ══════════════ */}
      {!isMobile && (
        <nav aria-label="Main Navigation" style={{
          position: "fixed", top: 0, left: 0, width: "100%", zIndex: 2000,
          background: scrolled ? "rgba(10,14,23,.93)" : BG,
          backdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom: `1px solid ${scrolled ? "rgba(16,185,129,.1)" : "rgba(255,255,255,.04)"}`,
          padding: scrolled ? "10px 36px" : "14px 36px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          transition: "all .35s ease",
        }}>
          <Link href="/" className="at-logo">
            <span className="at-logo-ring">
              <Image src="/icon-512.png" alt="AksharaTantra" width={22} height={22} />
            </span>
            Akshara<span style={{ color: G }}>Tantra</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`at-link${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}>
                  <Icon style={{ fontSize: 15 }} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ══════════════ MOBILE ══════════════ */}
      {isMobile && (
        <>
          {/* Top bar */}
          <div className="at-topbar" style={{
            background: scrolled ? "rgba(10,14,23,.93)" : BG,
            backdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: "1px solid rgba(255,255,255,.06)",
          }}>
            <button className="at-menu-btn" aria-label="Open menu"
              aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
              <MenuRoundedIcon style={{ fontSize: 20 }} />
            </button>

            <Link href="/" className="at-logo" style={{ fontSize: 15 }}>
              <span className="at-logo-ring" style={{ width: 30, height: 30, borderRadius: 8 }}>
                <Image src="/icon-512.png" alt="AksharaTantra" width={18} height={18} />
              </span>
              Akshara<span style={{ color: G }}>Tantra</span>
            </Link>

            <div style={{ width: 38 }} /> {/* balance */}
          </div>

          {/* ── Bottom nav ── */}
          <nav className="at-bottom-nav" aria-label="Quick navigation">
            {BOTTOM_PRIMARY.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`at-bn-item${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}>
                  <span className="at-bn-pill">
                    <Icon style={{ fontSize: active ? 22 : 20 }} />
                  </span>
                  {label}
                  <span className="at-bn-dot" />
                </Link>
              );
            })}

            {/* More → opens drawer */}
            <button className="at-bn-item" onClick={() => setDrawerOpen(true)}
              aria-label="More navigation">
              <span className="at-bn-pill">
                <GridViewRoundedIcon style={{ fontSize: 20 }} />
              </span>
              More
              <span className="at-bn-dot" style={{ opacity: 0 }} />
            </button>
          </nav>

          {/* ── Overlay ── */}
          {drawerOpen && (
            <div className="at-overlay" onClick={() => setDrawerOpen(false)}
              aria-hidden="true" />
          )}

          {/* ── Drawer ── */}
          <div ref={drawerRef} role="dialog" aria-modal="true"
            aria-label="Navigation menu"
            className={`at-drawer${drawerOpen ? " open" : ""}`}>

            <div className="at-drawer-head">
              <Link href="/" className="at-logo" style={{ fontSize: 14 }}
                onClick={() => setDrawerOpen(false)}>
                <span className="at-logo-ring" style={{ width: 30, height: 30, borderRadius: 8 }}>
                  <Image src="/icon-512.png" alt="" width={18} height={18} aria-hidden="true" />
                </span>
                Akshara<span style={{ color: G }}>Tantra</span>
              </Link>
              <button className="at-close" aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}>
                <CloseRoundedIcon style={{ fontSize: 17 }} />
              </button>
            </div>

            <div className="at-drawer-body">
              {navItems.map(({ href, label, icon: Icon }, i) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}
                    className={`at-dlink${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setDrawerOpen(false)}
                    style={{ animationDelay: `${i * 25}ms` }}>
                    <span className="at-dlink-icon">
                      <Icon style={{ fontSize: 17 }} />
                    </span>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      <InstallFab />
    </>
  );
}
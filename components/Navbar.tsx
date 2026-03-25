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
import FingerprintRoundedIcon        from "@mui/icons-material/FingerprintRounded";
import CloseRoundedIcon              from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon               from "@mui/icons-material/MenuRounded";
import CurrencyRupeeRoundedIcon      from "@mui/icons-material/CurrencyRupeeRounded";
import CheckCircleRoundedIcon        from "@mui/icons-material/CheckCircleRounded";
import IosShareRoundedIcon           from "@mui/icons-material/IosShareRounded";
import ImageSearchRoundedIcon from "@mui/icons-material/ImageSearchRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
 import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
/* ─── types ─────────────────────────────────────────────────── */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ─── all nav items ──────────────────────────────────────────── */
const navItems = [
  { href: "/calendarpage", label: "Calendar", icon: CalendarMonthRoundedIcon },
  { href: "/onecrdb", label: "1 Crore DB", icon: SportsEsportsRoundedIcon },
    { href: "/chess", label: "Chess", icon: SportsEsportsRoundedIcon },
    { href: "/aksharadrishti",    label: "AksharaDrishti",   icon: ImageSearchRoundedIcon },
  { href: "/upload",    label: "Upload",      icon: UploadFileRoundedIcon },
  { href: "/OCR",       label: "OCR",         icon: DocumentScannerRoundedIcon },
  { href: "/ocreng",    label: "HTR Indic",   icon: DrawRoundedIcon },
  { href: "/Ocrwork",   label: "RajaTantra",  icon: HistoryEduRoundedIcon },
  { href: "/Sanskrit",  label: "यथाक्षरं",   icon: MenuBookRoundedIcon },
  { href: "/Media",     label: "Media",       icon: CollectionsRoundedIcon },
  { href: "/voice",     label: "Voice",       icon: MicRoundedIcon },
  { href: "/vedha",     label: "Vedha",       icon: AutoStoriesRoundedIcon },
  { href: "/badge",     label: "Badge",       icon: MilitaryTechRoundedIcon },
  { href: "/posters",   label: "Poster",      icon: DashboardCustomizeRoundedIcon },
  
  { href: "/kyc",       label: "KYC",         icon: FingerprintRoundedIcon },
];

const TOP_SHORTCUTS = [
  { href: "/",      icon: HomeRoundedIcon,        label: "Home"  },
  { href: "/voice", icon: MicRoundedIcon,         label: "Voice" },
  { href: "/Media", icon: CollectionsRoundedIcon, label: "Media" },
];

const G  = "#10b981";
const BG = "#0a0e17";

/* ─── helpers ────────────────────────────────────────────────── */
function useScrolled(threshold = 10) {
  const [s, set] = useState(false);
  useEffect(() => {
    const fn = () => set(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return s;
}

/**
 * Detect the install / PWA state of the current device.
 *
 * Returns one of:
 *   "installed"   – already running as a PWA (standalone/fullscreen)
 *   "promptable"  – Chrome/Edge on Android or Desktop; can call prompt()
 *   "ios"         – Safari iOS; must show "Add to Home Screen" instructions
 *   "unsupported" – everything else (old browsers, already-installed check failed, etc.)
 */
type InstallState = "checking" | "installed" | "promptable" | "ios" | "unsupported";

function useInstallState() {
  const [state, setState]  = useState<InstallState>("checking");
  const promptRef          = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Already running as installed PWA?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore – iOS Safari
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setState("installed");
      return;
    }

    // 2. Safari iOS — no beforeinstallprompt, manual flow needed
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
    if (isIOS && isSafari) {
      setState("ios");
      return;
    }

    // 3. Chrome/Edge/Samsung — wait for the browser prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setState("promptable");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 4. Fallback: if the event never fires within 3 s, mark unsupported
    //    (covers Firefox, already-installed without standalone flag, etc.)
    const timer = setTimeout(() => {
      if (!promptRef.current) setState("unsupported");
    }, 3000);

    // Also listen for successful install
    window.addEventListener("appinstalled", () => setState("installed"));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
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

/* ─── iOS instructions sheet ────────────────────────────────── */
function IosSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <style>{`
        @keyframes at-sheet-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        .at-ios-sheet{
          position:fixed;bottom:0;left:0;right:0;z-index:4000;
          background:#111827;
          border-top:1px solid rgba(16,185,129,.25);
          border-radius:18px 18px 0 0;
          padding:20px 22px 36px;
          animation:at-sheet-up .3s cubic-bezier(.4,0,.2,1);
          font-family:Outfit,sans-serif;
        }
        .at-ios-sheet h3{
          margin:0 0 6px;font-size:16px;font-weight:700;color:white;
        }
        .at-ios-sheet p{
          margin:0 0 18px;font-size:13.5px;color:rgba(255,255,255,.6);line-height:1.55;
        }
        .at-ios-step{
          display:flex;align-items:center;gap:12px;
          padding:10px 0;
          border-bottom:1px solid rgba(255,255,255,.06);
          font-size:13.5px;color:rgba(255,255,255,.8);
        }
        .at-ios-step:last-of-type{border-bottom:none;}
        .at-ios-num{
          width:26px;height:26px;border-radius:50%;
          background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);
          color:${G};font-size:12px;font-weight:700;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .at-ios-close{
          margin-top:18px;width:100%;padding:11px;border-radius:10px;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);
          color:rgba(255,255,255,.7);font-family:Outfit,sans-serif;
          font-size:14px;cursor:pointer;transition:background .15s;
        }
        .at-ios-close:hover{background:rgba(255,255,255,.13);}
      `}</style>

      {/* backdrop */}
      <div onClick={onClose} style={{
        position:"fixed",inset:0,zIndex:3999,
        background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",
      }} />

      <div className="at-ios-sheet" role="dialog" aria-modal="true"
        aria-label="Install instructions">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
          <h3>Add to Home Screen</h3>
          <button onClick={onClose} style={{
            background:"none",border:"none",color:"rgba(255,255,255,.5)",
            cursor:"pointer",padding:4,
          }}>
            <CloseRoundedIcon style={{ fontSize:20 }} />
          </button>
        </div>
        <p>Install AksharaTantra for offline access and a native app feel.</p>

        <div className="at-ios-step">
          <span className="at-ios-num">1</span>
          <span>Tap the <IosShareRoundedIcon style={{ fontSize:16,verticalAlign:"middle",color:G }} /> Share button at the bottom of Safari</span>
        </div>
        <div className="at-ios-step">
          <span className="at-ios-num">2</span>
          <span>Scroll down and tap <b style={{ color:"white" }}>&ldquo;Add to Home Screen&rdquo;</b></span>
        </div>
        <div className="at-ios-step">
          <span className="at-ios-num">3</span>
          <span>Tap <b style={{ color:"white" }}>&ldquo;Add&rdquo;</b> in the top-right corner</span>
        </div>

        <button className="at-ios-close" onClick={onClose}>Got it</button>
      </div>
    </>
  );
}

/* ─── Install FAB ────────────────────────────────────────────── */
function InstallFab() {
  const { state, triggerPrompt } = useInstallState();
  const [showIos, setShowIos]    = useState(false);
  const [mounted, setMounted]    = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || state === "checking" || state === "unsupported") return null;

  /* Already installed — show a subtle "installed" badge briefly, then hide */
  if (state === "installed") return null; // clean — no point showing once installed

  const handleClick = () => {
    if (state === "ios")       setShowIos(true);
    else if (state === "promptable") triggerPrompt();
  };

  const label =
    state === "ios"       ? "Install on iOS"  :
    state === "promptable"? "Install App"     : "";

  return (
    <>
      {showIos && <IosSheet onClose={() => setShowIos(false)} />}

      <button
        onClick={handleClick}
        aria-label={label}
        title={label}
        style={{
          position:"fixed", bottom:24, right:18, zIndex:3000,
          height:46,
          padding:"0 16px 0 12px",
          borderRadius:23,
          border:"1px solid rgba(16,185,129,.35)",
          background:`linear-gradient(135deg,#0f766e,${G})`,
          color:"white",
          cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          boxShadow:"0 4px 24px rgba(5,150,105,.45)",
          WebkitTapHighlightColor:"transparent",
          fontFamily:"Outfit,sans-serif",
          fontSize:13,
          fontWeight:600,
          letterSpacing:".03em",
          whiteSpace:"nowrap",
          transition:"transform .15s,box-shadow .15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(5,150,105,.6)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(5,150,105,.45)";
        }}
      >
        {state === "ios"
          ? <IosShareRoundedIcon style={{ fontSize:19 }} />
          : <InstallMobileRoundedIcon style={{ fontSize:19 }} />
        }
        <span style={{ display:"inline" }}>
          {state === "ios" ? "Add to Home" : "Install App"}
        </span>
      </button>
    </>
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        .at-skip {
          position:absolute;top:-100px;left:14px;
          padding:7px 14px;background:${G};color:#000;
          border-radius:4px;font-family:Outfit,sans-serif;font-weight:600;
          z-index:9999;transition:top .2s;
        }
        .at-skip:focus{top:14px;}

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

        .at-topbar {
          position:fixed;top:0;left:0;right:0;z-index:2000;
          height:56px;
          display:flex;align-items:center;
          padding:0 10px;gap:8px;
          transition:background .3s;
        }

        .at-menu-btn {
          width:40px;height:40px;border-radius:10px;flex-shrink:0;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
          color:white;display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:background .15s;
          -webkit-tap-highlight-color:transparent;
        }
        .at-menu-btn:active{background:rgba(255,255,255,.14);}

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
        .at-shortcut.active::after{
          content:'';position:absolute;bottom:5px;left:50%;
          transform:translateX(-50%);
          width:4px;height:4px;border-radius:50%;background:${G};
        }

        .at-overlay {
          position:fixed;inset:0;z-index:2100;
          background:rgba(0,0,0,.58);
          backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
          animation:at-fade .22s ease;
        }
        @keyframes at-fade{from{opacity:0}to{opacity:1}}

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

        .at-close{
          width:33px;height:33px;border-radius:8px;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);
          color:rgba(255,255,255,.6);cursor:pointer;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          transition:background .15s,color .15s;
        }
        .at-close:hover{background:rgba(255,255,255,.12);color:white;}
        .at-close:active{background:rgba(255,255,255,.16);}

        .at-drawer-foot{
          padding:11px 13px;border-top:1px solid rgba(255,255,255,.05);
          font-family:Outfit,sans-serif;font-size:10px;font-weight:500;
          color:rgba(255,255,255,.18);letter-spacing:.07em;text-transform:uppercase;
          flex-shrink:0;
        }

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
            <span className="at-logo-ring" style={{ width:36,height:36 }}>
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
          <div className="at-topbar" style={{
            background: scrolled ? "rgba(10,14,23,.94)" : BG,
            backdropFilter: scrolled ? "blur(16px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom:"1px solid rgba(255,255,255,.06)",
          }}>
            <button className="at-menu-btn"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="at-mobile-menu"
              onClick={() => setDrawerOpen(true)}>
              <MenuRoundedIcon style={{ fontSize:21 }} />
            </button>

            <Link href="/" className="at-logo"
              style={{ flex:1,justifyContent:"center",fontSize:15 }}>
              <span className="at-logo-ring" style={{ width:30,height:30,borderRadius:8 }}>
                <Image src="/icon-512.png" alt="AksharaTantra" width={18} height={18} />
              </span>
              Akshara<span style={{ color:G }}>Tantra</span>
            </Link>

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

          {drawerOpen && (
            <div className="at-overlay"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true" />
          )}

          <div
            id="at-mobile-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={`at-drawer${drawerOpen ? " open" : ""}`}
          >
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

            <nav className="at-drawer-body" aria-label="All pages">
              {navItems.map(({ href, label, icon: Icon }, i) => {
                const active = pathname === href;
                return (
                  <React.Fragment key={href}>
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

      {/* ════════ INSTALL FAB — always rendered, internally gated ════════ */}
      <InstallFab />
    </>
  );
}
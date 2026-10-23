"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Navbar — dropdown groups on desktop, a drawer on phones.
// All styles live in app/globals.css (section "NAVBAR", classes at-*).
// navGroups is exported: the home page builds its tool cards from it.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { CloseIcon } from "@yuktishaalaa/yuktai";

// Yuktai
import HubRoundedIcon                from "@mui/icons-material/HubRounded";
import InfoRoundedIcon               from "@mui/icons-material/InfoRounded";
// Vision AI
import ImageSearchRoundedIcon        from "@mui/icons-material/ImageSearchRounded";
import DocumentScannerRoundedIcon    from "@mui/icons-material/DocumentScannerRounded";
import DrawRoundedIcon               from "@mui/icons-material/DrawRounded";
import UploadFileRoundedIcon         from "@mui/icons-material/UploadFileRounded";
// Language AI
import RecordVoiceOverRoundedIcon    from "@mui/icons-material/RecordVoiceOverRounded";
import MenuBookRoundedIcon           from "@mui/icons-material/MenuBookRounded";
import AutoStoriesRoundedIcon        from "@mui/icons-material/AutoStoriesRounded";
import TranslateRoundedIcon          from "@mui/icons-material/TranslateRounded";
// Create
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import MilitaryTechRoundedIcon       from "@mui/icons-material/MilitaryTechRounded";
import LocalLibraryRoundedIcon       from "@mui/icons-material/LocalLibraryRounded";
import CalendarMonthRoundedIcon      from "@mui/icons-material/CalendarMonthRounded";
import CollectionsRoundedIcon        from "@mui/icons-material/CollectionsRounded";
// Chrome
import MenuRoundedIcon               from "@mui/icons-material/MenuRounded";
import KeyboardArrowDownRoundedIcon  from "@mui/icons-material/KeyboardArrowDownRounded";
import InstallMobileRoundedIcon      from "@mui/icons-material/InstallMobileRounded";
import IosShareRoundedIcon           from "@mui/icons-material/IosShareRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
// ── Menu: four AI-first groups. The logo links to Home. ──
// Grouped by what the AI does: Yuktai (agents), Vision AI (reads images),
// Language AI (speaks and understands Indic text), Create (makes things).
export type NavItem  = { href: string; label: string; icon: React.ElementType };
export type NavGroup = { group: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    group: "Yuktai",
    items: [
      { href: "/staffdirectory", label: "Agentic Grid",  icon: HubRoundedIcon },
      { href: "/yuktai",         label: "About Yuktai",  icon: InfoRoundedIcon },
    ],
  },
  {
    group: "Web Testing",
    items: [
      { href: "/test-your-website", label: "Test Your Website", icon: FactCheckRoundedIcon },
    ],
  },
  {
    group: "Vision AI",
    items: [
      { href: "/aksharadrishti", label: "Multilingual OCR",   icon: ImageSearchRoundedIcon },
      { href: "/OCR",            label: "Text Reader",        icon: DocumentScannerRoundedIcon },
      { href: "/ocreng",         label: "Handwriting Reader", icon: DrawRoundedIcon },
      { href: "/upload",         label: "Book Digitizer",     icon: UploadFileRoundedIcon },
    ],
  },
  {
    group: "Language AI",
    items: [
      { href: "/voice",    label: "Text to Speech",   icon: RecordVoiceOverRoundedIcon },
      { href: "/Sanskrit", label: "Sanskrit Reader",  icon: MenuBookRoundedIcon },
      { href: "/vedha",    label: "Vedic Digitizer",  icon: AutoStoriesRoundedIcon },
      { href: "/kosha",    label: "Kosha Dictionary", icon: TranslateRoundedIcon },
    ],
  },
  {
    group: "Create",
    items: [
      { href: "/posters",      label: "Poster Maker",  icon: DashboardCustomizeRoundedIcon },
      { href: "/badge",        label: "Certificates",  icon: MilitaryTechRoundedIcon },
      { href: "/ebook",        label: "E-Book Maker",  icon: LocalLibraryRoundedIcon },
      { href: "/calendarpage", label: "Panchanga Calendar", icon: CalendarMonthRoundedIcon },
      { href: "/Media",        label: "Photo Gallery", icon: CollectionsRoundedIcon },
    ],
  },
];

const isActivePath = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.toLowerCase().startsWith(href.toLowerCase());

const groupIsActive = (pathname: string, g: NavGroup) => g.items.some((i) => isActivePath(pathname, i.href));

// ── PWA install button ───────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "checking" | "installed" | "promptable" | "ios" | "unsupported";

function useInstallState() {
  const [state, setState] = useState<InstallState>("checking");
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) { setState("installed"); return; }

    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)) {
      setState("ios");
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setState("promptable");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
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
  if (state !== "promptable" && state !== "ios") return null;
  return (
    <button type="button" className="at-install" onClick={triggerPrompt}>
      {state === "ios" ? <IosShareRoundedIcon className="ico-20" /> : <InstallMobileRoundedIcon className="ico-20" />}
      <span>{state === "ios" ? "Add to Home" : "Install App"}</span>
    </button>
  );
}

function Brand({ name }: { name: string }) {
  return name === "AksharaTantra" ? <>Akshara<span className="at-brand__accent">Tantra</span></> : <>{name}</>;
}

// ── Navbar ───────────────────────────────────────────────────
export default function Navbar({ brand = "AksharaTantra" }: { brand?: string }) {
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    const onScroll = () => setScrolled(window.scrollY > 10);
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenGroup(null); setDrawerOpen(false); }
    };

    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close menus whenever the route changes
  useEffect(() => {
    setOpenGroup(null);
    setDrawerOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  return (
    <>
      {/* ─── Desktop ─── */}
      {!isMobile && (
        <nav className={`at-nav${scrolled ? " is-scrolled" : ""}`} ref={navRef} aria-label="Main">
          <Link href="/" className="at-brand">
            <Image src="/icon-512.png" alt="" width={22} height={22} />
            <span className="at-brand__name"><Brand name={brand} /></span>
          </Link>

          <div className="at-menu">
            {navGroups.map((group) => {
              const open = openGroup === group.group;
              return (
                <div key={group.group} className="at-menu__item">
                  <button
                    type="button"
                    className={`at-menu__btn${open ? " is-open" : ""}${groupIsActive(pathname, group) ? " is-current" : ""}`}
                    onClick={() => setOpenGroup(open ? null : group.group)}
                    aria-expanded={open}
                    aria-haspopup="menu"
                  >
                    {group.group}
                    <KeyboardArrowDownRoundedIcon className="at-menu__caret" />
                  </button>
                  <div className={`at-dd${open ? " is-open" : ""}`} role="menu">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className={`at-dd__item${isActivePath(pathname, item.href) ? " is-current" : ""}`}
                        onClick={() => setOpenGroup(null)}
                      >
                        <item.icon className="at-dd__icon" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      )}

      {/* ─── Phone ─── */}
      {isMobile && (
        <>
          <div className="at-mbar">
            <button type="button" className="at-mbar__menu" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <MenuRoundedIcon />
            </button>
            <Link href="/" className="at-mbar__brand"><Brand name={brand} /></Link>
          </div>

          {drawerOpen && <div className="at-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}

          <div className={`at-drawer${drawerOpen ? " is-open" : ""}`} aria-hidden={!drawerOpen}>
            <div className="at-drawer__head">
              <span className="at-drawer__title">Navigation</span>
              <button type="button" className="at-drawer__close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <CloseIcon size={22} />
              </button>
            </div>

            <div className="at-drawer__body">
              {navGroups.map((g) => (
                <div key={g.group} className="at-drawer__group">
                  <div className="at-drawer__label">{g.group}</div>
                  {g.items.map((i) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={`at-drawer__link${isActivePath(pathname, i.href) ? " is-current" : ""}`}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <i.icon className="at-drawer__icon" />
                      {i.label}
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
import type { Metadata, Viewport } from "next";
import "@/Styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";

import Footer from "@/components/Footer";
import NetworkStatusIndicator from "@/components/NetworkStatusIndicator";
import { GAListenerInner } from "@/components/GAListenerInner";
import YuktaiClient from "@/components/YuktaiClient";
import GoToTopButton from "@/components/GoToTopButton";

const SITE_URL = "https://aksharatantra.miriyala.in";
const GA_ID = "G-5VRRWW655G";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AksharaTantra",
    template: "%s · AksharaTantra",
  },
  description:
    "Yuktai Grid demo with an agentic AI assistant, plus OCR for 34 languages including Sanskrit, Telugu and other Indic scripts.",
  applicationName: "AksharaTantra",
  authors: [{ name: "Sandeep Miriyala" }],
  keywords: ["Yuktai", "Yuktai Grid", "agentic AI", "OCR", "Sanskrit", "Telugu", "Indic scripts", "accessibility"],
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "AksharaTantra",
    title: "AksharaTantra",
    description: "Yuktai Grid with an agentic AI assistant, and OCR for 34 languages.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "AksharaTantra" }],
  },
  twitter: {
    card: "summary",
    title: "AksharaTantra",
    description: "Yuktai Grid with an agentic AI assistant, and OCR for 34 languages.",
    images: ["/icon-512.png"],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AksharaTantra",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-192.png" }, { url: "/icon-512.png", sizes: "512x512" }],
    other: [{ rel: "mask-icon", url: "/icon-512.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#064e3b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Keyboard users can jump past the navbar */}
        <a href="#main-content" className="skipLink">
          Skip to main content
        </a>

        <YuktaiClient>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <NetworkStatusIndicator />
          <Footer />
          <GoToTopButton />
        </YuktaiClient>

        <GoogleAnalytics gaId={GA_ID} />
        <Suspense fallback={null}>
          <GAListenerInner gaId={GA_ID} />
        </Suspense>
      </body>
    </html>
  );
}
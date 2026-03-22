import type { Metadata, Viewport } from "next";
import "@/Styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";

import Footer from "@/components/Footer";
import NetworkStatusIndicator from "@/components/NetworkStatusIndicator";
import { GAListenerInner } from "@/components/GAListenerInner";

/* ---------- METADATA ---------- */
export const metadata: Metadata = {
  title: "AksharaTantra",
  description: "OCR for 34 languages – Sanskrit, Telugu, Indic scripts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AksharaTantra",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

/* ---------- VIEWPORT ---------- */
export const viewport: Viewport = {
  themeColor: "#26ffe7",
  width: "device-width",
  initialScale: 1,
};

/* ---------- ROOT LAYOUT ---------- */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        <NetworkStatusIndicator />
        <Footer />
        <GoogleAnalytics gaId="G-5VRRWW655G" />
        {/* ✅ GA Page View Tracker */}
        <Suspense fallback={null}>
          <GAListenerInner gaId="G-5VRRWW655G" />
        </Suspense>
      </body>
    </html>
  );
}
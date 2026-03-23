import type { Metadata, Viewport } from "next";
import "@/Styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";

import Footer from "@/components/Footer";
import NetworkStatusIndicator from "@/components/NetworkStatusIndicator";
import { GAListenerInner } from "@/components/GAListenerInner";


/* ---------- METADATA ---------- */
/* ---------- METADATA ---------- */
export const metadata: Metadata = {
  title: "AksharaTantra",
  description: "OCR for 34 languages – Sanskrit, Telugu, Indic scripts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Changed to black-translucent for a more native feel
    title: "AksharaTantra",
    // startupImage: [] <-- You can add splash screens here later
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icon-192.png" }, // Standard apple touch icon
      { url: "/icon-512.png", sizes: "512x512" },
    ],
    // Add other icons if needed
    other: [
      {
        rel: 'mask-icon',
        url: '/icon-512.png', // Ensure this matches your manifest's maskable icon
      },
    ],
  },
};

/* ---------- VIEWPORT ---------- */
// The themeColor here should ideally match your manifest.json for a seamless transition
export const viewport: Viewport = {
  themeColor: "#10b981", // Matching your brand green
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents accidental zooming on input focus in mobile
  userScalable: false,
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
        <Suspense fallback={null}>
          <GAListenerInner gaId="G-5VRRWW655G" />
        </Suspense>
      </body>
    </html>
  );
}
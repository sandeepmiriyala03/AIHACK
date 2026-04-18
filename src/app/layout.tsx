import type { Metadata, Viewport } from "next";
import "@/Styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";

import Footer from "@/components/Footer";
import NetworkStatusIndicator from "@/components/NetworkStatusIndicator";
import { GAListenerInner } from "@/components/GAListenerInner";
import YuktAIWrapper from "@/components/YuktAIWrapper";

export const metadata: Metadata = {
  title: "AksharaTantra",
  description: "OCR for 34 languages – Sanskrit, Telugu, Indic scripts",
  manifest: "/manifest.json",

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
    apple: [
      { url: "/icon-192.png" },
      { url: "/icon-512.png", sizes: "512x512" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icon-512.png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* 🔥 Global AI initializer */}
        <YuktAIWrapper />

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
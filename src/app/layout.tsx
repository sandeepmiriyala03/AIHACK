import type { Metadata } from "next";
import "@/Styles/globals.css";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
  title: "Multi-Language OCR Text Extractor",
  description: "Multi-Language OCR Text Extractor",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
       <head>
        <link rel="manifest" href="manifest.json" />
        <meta name="theme-color" content="#26ffe7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#171347" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
     
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}

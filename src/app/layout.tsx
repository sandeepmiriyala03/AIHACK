import type { Metadata } from "next";
import "@/Styles/globals.css";

export const metadata: Metadata = {
  title: "AI Document Analysis",
  description: "Upload and analyze documents with OCR and NLP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

// src/app/layout.tsx
import type { Metadata } from "next";
import YuktaiClient from "@/components/YuktaiClient"; // ✅ Import your new client component
// ... other imports

export const metadata: Metadata = {
  title: "AksharaTantra",
  // ... rest of your metadata
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <YuktaiClient>
          {children}
          {/* Include other global UI components inside or outside the client wrapper as needed */}
        </YuktaiClient>
      </body>
    </html>
  );
}
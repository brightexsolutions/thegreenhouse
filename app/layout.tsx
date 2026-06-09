import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { cn } from "@/lib/utils";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const bodyFont = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegreenhouseke.com"
  ),
  title: {
    default: "The Green House",
    template: "%s | The Green House",
  },
  description:
    "A cross-church quarterly worship & sharing evening in Nairobi. Low pressure. Real connection.",
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "The Green House",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(displayFont.variable, bodyFont.variable)}>
      <body className="antialiased force-light grain">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--forest)",
              color: "var(--cream)",
              border: "1px solid var(--moss)",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}

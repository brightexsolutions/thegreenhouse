import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { MobileScrollFix } from "@/components/mobile-scroll-fix";
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
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegreenhousekws.co.ke"
  ),
  title: {
    default: "Green House Worship Community",
    template: "%s | Green House Worship Community",
  },
  description:
    "A cross-church worship community in Nairobi, Kenya. Quarterly gatherings for worship, prayer, and real connection across churches. Low pressure. Everyone welcome.",
  keywords: [
    "worship community nairobi",
    "cross-church worship kenya",
    "nairobi worship gathering",
    "christian community nairobi",
    "worship night nairobi",
    "green house worship",
    "nairobi church fellowship",
    "worship and prayer nairobi",
    "quarterly worship nairobi",
    "nairobi community worship",
    "interdenominational worship kenya",
    "nairobi christian gathering",
  ],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Green House Worship Community",
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
        <MobileScrollFix />
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

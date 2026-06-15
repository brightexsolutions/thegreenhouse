import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { MobileScrollFix } from "@/components/mobile-scroll-fix";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GOOGLE_SITE_VERIFICATION, SOCIAL_INSTAGRAM } from "@/lib/constants";

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

const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.greenhousews.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_BASE),
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
  title: {
    default: "The Green House — Worship Community · Nairobi, Kenya",
    template: "%s | The Green House",
  },
  description:
    "A cross-church worship community in Nairobi, Kenya. Quarterly gatherings for worship, prayer, and real connection across churches. Low pressure. Everyone welcome.",
  keywords: [
    "greenhouse worship community nairobi",
    "the green house worship kenya",
    "cross-church worship nairobi",
    "nairobi worship gathering",
    "worship community nairobi kenya",
    "christian community nairobi",
    "worship night nairobi",
    "nairobi church fellowship",
    "worship and prayer nairobi kenya",
    "quarterly worship nairobi",
    "interdenominational worship kenya",
    "nairobi christian gathering",
    "greenhousews",
  ],
  icons: {
    icon:     "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    type:     "website",
    locale:   "en_KE",
    siteName: "The Green House Worship Community",
    url:      SITE_BASE,
  },
  twitter: { card: "summary_large_image" },
  robots:  { index: true, follow: true },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The Green House Worship Community",
  "alternateName": [
    "Green House Worship Community",
    "The Green House",
    "The Greenhouse Worship Session",
    "Green House Worship Session",
    "greenhousews",
  ],
  "url": SITE_BASE,
  "logo": `${SITE_BASE}/icon.svg`,
  "description": "A cross-church worship community in Nairobi, Kenya. Quarterly gatherings for worship, prayer, and real connection across churches.",
  "foundingDate": "2026",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Nairobi",
    "addressRegion": "Nairobi County",
    "addressCountry": "KE",
  },
  "areaServed": {
    "@type": "City",
    "name": "Nairobi",
    "sameAs": "https://www.wikidata.org/wiki/Q3870",
  },
  "sameAs": [SOCIAL_INSTAGRAM],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(displayFont.variable, bodyFont.variable)}>
      <body className="antialiased force-light grain" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
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

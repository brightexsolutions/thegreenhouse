"use client";

import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

interface EventQRCodeProps {
  slug: string;
}

export function EventQRCode({ slug }: EventQRCodeProps) {
  const url = `${SITE_URL}/events/${slug}?register=1`;

  return (
    <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-mist">
      <div className="flex items-center gap-2 self-start">
        <QrCode size={13} className="text-charcoal/40" />
        <span className="text-[10px] font-semibold text-charcoal/40 uppercase tracking-wider">Scan to register</span>
      </div>
      <div className="p-3 bg-white rounded-xl border border-mist/60">
        <QRCodeSVG
          value={url}
          size={140}
          fgColor="#1b3a2a"
          bgColor="#ffffff"
          level="M"
        />
      </div>
      <p className="text-[10px] text-charcoal/35 text-center leading-relaxed">
        Share this QR code at the venue or in printed materials
      </p>
    </div>
  );
}

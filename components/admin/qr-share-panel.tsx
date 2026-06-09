"use client";

import { useState, useEffect } from "react";
import { QrCode, Download } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

interface QrSharePanelProps {
  eventId:   string;
  eventSlug: string;
}

export function QrSharePanel({ eventId, eventSlug }: QrSharePanelProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const eventUrl = `${SITE_URL}/events/${eventSlug}`;

  useEffect(() => {
    // Generate QR from server API
    setQrUrl(`/api/admin/events/${eventId}/qr`);
  }, [eventId]);

  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="flex items-center gap-2 mb-3">
        <QrCode size={13} className="text-forest" />
        <h3 className="text-sm font-semibold text-charcoal">Registration QR</h3>
      </div>
      <p className="text-[11px] text-charcoal/50 mb-4 leading-relaxed">
        Print or display this code — it links to the event registration page.
      </p>

      {qrUrl && (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR code" className="w-20 h-20 rounded-lg border border-mist" />
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-charcoal/40 font-mono break-all">{eventUrl}</p>
            <a
              href={qrUrl}
              download={`qr-${eventSlug}.png`}
              className="inline-flex items-center gap-1.5 text-xs text-forest hover:underline"
            >
              <Download size={11} />
              Download QR
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

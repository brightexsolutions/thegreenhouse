"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  firstName:       string;
  lastName:        string;
  sessionLabel:    string;
  shortDate:       string;
  themeTitle:      string | null;
  themeScripture?: string | null;
  venueName?:      string | null;
  siteName?:       string;
}

export function BadgeDownload({ firstName, lastName, sessionLabel, shortDate, themeTitle, themeScripture, venueName, siteName = "The Green House" }: Props) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const SIZE = 1080;
      const canvas = document.createElement("canvas");
      canvas.width  = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      // ── Background gradient
      const bg = ctx.createLinearGradient(SIZE * 0.15, 0, SIZE * 0.55, SIZE);
      bg.addColorStop(0,    "#163022");
      bg.addColorStop(0.55, "#0d1f15");
      bg.addColorStop(1,    "#1b3a2a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // ── Gold radial glow (top centre)
      const glow = ctx.createRadialGradient(SIZE * 0.5, 0, 0, SIZE * 0.5, 0, SIZE * 0.55);
      glow.addColorStop(0,   "rgba(201,162,74,0.22)");
      glow.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // ── Subtle dot grid
      ctx.fillStyle = "rgba(201,162,74,0.04)";
      const dot = 24;
      for (let x = 0; x < SIZE; x += dot) {
        for (let y = 0; y < SIZE; y += dot) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Decorative ring (top-right)
      ctx.save();
      ctx.strokeStyle = "rgba(201,162,74,0.08)";
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(SIZE * 0.85, SIZE * -0.1, SIZE * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(SIZE * 0.85, SIZE * -0.1, SIZE * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ── Bottom-left ring
      ctx.save();
      ctx.strokeStyle = "rgba(201,162,74,0.06)";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(SIZE * 0.05, SIZE * 1.1, SIZE * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ── Load display font (Cormorant) from the page's loaded fonts
      const fonts = Array.from(document.fonts).map(f => f.family);
      const serif = fonts.includes("var(--font-cormorant)")
        ? "Cormorant Garamond"
        : fonts.find(f => f.toLowerCase().includes("cormorant")) ?? "Georgia";

      const cx = SIZE / 2;
      let y = SIZE * 0.28;

      // Brand label diamonds + text
      ctx.fillStyle = "rgba(201,162,74,0.6)";
      ctx.save();
      ctx.translate(cx - 130, y - 4);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
      ctx.save();
      ctx.translate(cx + 130, y - 4);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();

      ctx.fillStyle  = "rgba(201,162,74,0.6)";
      ctx.font       = `300 ${SIZE * 0.013}px sans-serif`;
      ctx.textAlign  = "center";
      ctx.letterSpacing = "5px";
      ctx.fillText(siteName.toUpperCase(), cx, y);
      ctx.letterSpacing = "0px";

      y += SIZE * 0.07;

      // "I'm attending"
      ctx.fillStyle = "rgba(247,242,232,0.55)";
      ctx.font      = `400 ${SIZE * 0.032}px ${serif}`;
      ctx.fillText("I'm attending", cx, y);

      y += SIZE * 0.095;

      // Session label (large, gold, may need wrapping)
      ctx.fillStyle = "#c9a24a";
      ctx.font      = `700 ${SIZE * 0.078}px ${serif}`;
      const maxW = SIZE * 0.74;
      const lh   = SIZE * 0.088;
      const words = sessionLabel.split(" ");
      let line = "";
      const lines: string[] = [];
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      for (const l of lines) { ctx.fillText(l, cx, y); y += lh; }

      // Theme (if any)
      if (themeTitle) {
        y += SIZE * 0.01;
        ctx.fillStyle  = "rgba(228,201,126,0.82)";
        ctx.font       = `400 italic ${SIZE * 0.029}px ${serif}`;
        ctx.fillText(themeTitle, cx, y);
        y += SIZE * 0.038;
        if (themeScripture) {
          ctx.fillStyle  = "rgba(247,242,232,0.38)";
          ctx.font       = `400 ${SIZE * 0.019}px sans-serif`;
          ctx.letterSpacing = "1px";
          ctx.fillText(themeScripture, cx, y);
          ctx.letterSpacing = "0px";
          y += SIZE * 0.038;
        } else {
          y += SIZE * 0.016;
        }
      } else {
        y += SIZE * 0.02;
      }

      // Divider line
      const dw = SIZE * 0.08;
      const grad = ctx.createLinearGradient(cx - dw, y, cx + dw, y);
      grad.addColorStop(0,   "transparent");
      grad.addColorStop(0.5, "rgba(201,162,74,0.5)");
      grad.addColorStop(1,   "transparent");
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - dw, y); ctx.lineTo(cx + dw, y);
      ctx.stroke();

      y += SIZE * 0.052;

      // Attendee name
      ctx.fillStyle = "rgba(247,242,232,0.9)";
      ctx.font      = `400 ${SIZE * 0.032}px ${serif}`;
      ctx.fillText(`${firstName} ${lastName}`, cx, y);

      y += SIZE * 0.048;

      // Date
      ctx.fillStyle = "rgba(247,242,232,0.5)";
      ctx.font      = `400 ${SIZE * 0.022}px sans-serif`;
      ctx.fillText(shortDate, cx, y);

      // Venue
      if (venueName) {
        y += SIZE * 0.034;
        ctx.fillStyle = "rgba(201,162,74,0.45)";
        ctx.font      = `400 ${SIZE * 0.017}px sans-serif`;
        ctx.letterSpacing = "2px";
        ctx.fillText(venueName.toUpperCase(), cx, y);
        ctx.letterSpacing = "0px";
      }

      // ── Bottom URL watermark
      const urlY = SIZE - SIZE * 0.04;
      ctx.fillStyle  = "rgba(247,242,232,0.3)";
      ctx.font       = `400 ${SIZE * 0.015}px sans-serif`;
      ctx.letterSpacing = "3px";
      ctx.fillText("www.greenhousews.co.ke", cx, urlY);
      ctx.letterSpacing = "0px";

      // ── Download
      await new Promise<void>(resolve => {
        canvas.toBlob(blob => {
          if (!blob) { resolve(); return; }
          const url = URL.createObjectURL(blob);
          const a   = document.createElement("a");
          a.href     = url;
          a.download = `badge-${firstName.toLowerCase()}-${lastName.toLowerCase()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
        }, "image/png");
      });
    } catch (err) {
      console.error("Badge generation failed:", err);
      alert("Could not generate badge. Please try again.");
    }
    setBusy(false);
  }

  return (
    <button
      onClick={download}
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold w-full disabled:opacity-60 transition-opacity"
      style={{ background: "rgba(201,162,74,0.15)", border: "1px solid rgba(201,162,74,0.35)", color: "#c9a24a" }}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {busy ? "Generating…" : "Download badge (PNG)"}
    </button>
  );
}

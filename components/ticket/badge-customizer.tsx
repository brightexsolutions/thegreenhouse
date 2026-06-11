"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X, Share2, Loader2, ImagePlus, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE    = 1080;
const MAX_MB  = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export interface BadgeProps {
  firstName:       string;
  lastName:        string;
  sessionLabel:    string;
  shortDate:       string;
  themeTitle?:     string | null;
  themeScripture?: string | null;
  venueName?:      string | null;
  siteName?:       string;
}

type VariantId = 1 | 2 | 3 | 4;

const VARIANTS: Array<{ id: VariantId; name: string; desc: string; bg: string; accent: string }> = [
  { id: 1, name: "Sanctuary", desc: "Dark & elegant",   bg: "linear-gradient(145deg,#163022,#0d1f15)", accent: "#c9a24a" },
  { id: 2, name: "Editorial", desc: "Clean & minimal",  bg: "#f0ebe0",                                  accent: "#1b3a2a" },
  { id: 3, name: "Dusk",      desc: "Warm & moody",     bg: "linear-gradient(160deg,#1a1218,#1b3a2a)", accent: "#c9a24a" },
  { id: 4, name: "Frame",     desc: "Photo-forward",    bg: "#0d1a12",                                  accent: "#c9a24a" },
];

// ─── Canvas helpers ──────────────────────────────────────────────────────────

function serif(): string {
  if (typeof document === "undefined") return "Georgia";
  return Array.from(document.fonts).find(f => f.family.toLowerCase().includes("cormorant"))?.family ?? "Georgia";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, cy); line = w; cy += lh; }
    else line = test;
  }
  if (line) { ctx.fillText(line, x, cy); cy += lh; }
  return cy;
}

function clipImg(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number, shape: "circle" | "rect", r = 0) {
  const ia = img.naturalWidth / img.naturalHeight;
  const ta = dw / dh;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ia > ta) { sw = sh * ta; sx = (img.naturalWidth - sw) / 2; }
  else          { sh = sw / ta; sy = (img.naturalHeight - sh) / 2; }
  ctx.save();
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(dx + dw / 2, dy + dh / 2, dw / 2, 0, Math.PI * 2);
  } else if (r > 0 && ctx.roundRect) {
    ctx.roundRect(dx, dy, dw, dh, r);
  } else {
    ctx.rect(dx, dy, dw, dh);
  }
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

// Draw image center-cropped into a rotated square/rect, centered at (cx,cy)
function clipImgRotated(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number, cy: number,
  w: number, h: number,
  angle: number,
  r = 0
) {
  const ia = img.naturalWidth / img.naturalHeight;
  const ta = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ia > ta) { sw = sh * ta; sx = (img.naturalWidth - sw) / 2; }
  else          { sh = sw / ta; sy = (img.naturalHeight - sh) / 2; }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  if (r > 0 && ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r);
  else ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  ctx.restore();
}

// ─── Variant 1: Sanctuary ────────────────────────────────────────────────────
function drawV1(ctx: CanvasRenderingContext2D, W: number, H: number, p: BadgeProps, photo: HTMLImageElement | null) {
  const sf = serif();
  // BG
  const bg = ctx.createLinearGradient(W * 0.15, 0, W * 0.55, H);
  bg.addColorStop(0, "#163022"); bg.addColorStop(0.55, "#0d1f15"); bg.addColorStop(1, "#1b3a2a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Gold glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.55);
  glow.addColorStop(0, "rgba(201,162,74,0.22)"); glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  // Dot grid
  ctx.fillStyle = "rgba(201,162,74,0.04)";
  for (let x = 0; x < W; x += 24) for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
  // Rings
  ctx.save(); ctx.strokeStyle = "rgba(201,162,74,0.07)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(W * 0.85, -H * 0.1, W * 0.52, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(W * 0.85, -H * 0.1, W * 0.38, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  const cx = W / 2;
  let y = H * 0.13;

  if (photo) {
    // Smaller circle + higher position so text below still fits within the canvas
    const r = W * 0.155;
    const cy = H * 0.25;
    clipImg(ctx, photo, cx - r, cy - r, r * 2, r * 2, "circle");
    ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(201,162,74,0.55)"; ctx.lineWidth = 3; ctx.stroke();
    y = cy + r + H * 0.04;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(201,162,74,0.6)"; ctx.font = `300 ${W * 0.013}px sans-serif`; ctx.letterSpacing = "5px";
  ctx.fillText((p.siteName ?? "THE GREEN HOUSE").toUpperCase(), cx, y); ctx.letterSpacing = "0px"; y += W * 0.056;
  ctx.fillStyle = "rgba(247,242,232,0.55)"; ctx.font = `400 ${W * 0.032}px ${sf}`;
  ctx.fillText("I'll be attending", cx, y); y += W * 0.076;
  ctx.fillStyle = "#c9a24a"; ctx.font = `700 ${W * 0.064}px ${sf}`;
  y = wrapText(ctx, p.sessionLabel, cx, y, W * 0.76, W * 0.074);
  if (p.themeTitle) {
    y += W * 0.01;
    ctx.fillStyle = "rgba(228,201,126,0.82)"; ctx.font = `italic 400 ${W * 0.027}px ${sf}`;
    ctx.fillText(`Theme: ${p.themeTitle}`, cx, y); y += W * 0.038;
    if (p.themeScripture) {
      ctx.fillStyle = "rgba(247,242,232,0.38)"; ctx.font = `400 ${W * 0.019}px sans-serif`;
      ctx.letterSpacing = "1px"; ctx.fillText(p.themeScripture, cx, y); ctx.letterSpacing = "0px"; y += W * 0.038;
    }
  } else { y += W * 0.022; }

  const dw = W * 0.08;
  const dg = ctx.createLinearGradient(cx - dw, y, cx + dw, y);
  dg.addColorStop(0, "transparent"); dg.addColorStop(0.5, "rgba(201,162,74,0.5)"); dg.addColorStop(1, "transparent");
  ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - dw, y); ctx.lineTo(cx + dw, y); ctx.stroke(); y += W * 0.053;

  ctx.fillStyle = "rgba(247,242,232,0.9)"; ctx.font = `400 ${W * 0.032}px ${sf}`;
  ctx.fillText(`${p.firstName} ${p.lastName}`, cx, y); y += W * 0.048;
  ctx.fillStyle = "rgba(247,242,232,0.5)"; ctx.font = `400 ${W * 0.022}px sans-serif`;
  ctx.fillText(p.shortDate, cx, y);
  if (p.venueName) {
    y += W * 0.035;
    ctx.fillStyle = "rgba(201,162,74,0.45)"; ctx.font = `400 ${W * 0.017}px sans-serif`;
    ctx.letterSpacing = "2px"; ctx.fillText(p.venueName.toUpperCase(), cx, y); ctx.letterSpacing = "0px";
  }
  ctx.fillStyle = "rgba(247,242,232,0.28)"; ctx.font = `300 ${W * 0.015}px sans-serif`;
  ctx.letterSpacing = "3px"; ctx.fillText("www.greenhousews.co.ke", cx, H - W * 0.04); ctx.letterSpacing = "0px";
}

// ─── Variant 2: Editorial ────────────────────────────────────────────────────
function drawV2(ctx: CanvasRenderingContext2D, W: number, H: number, p: BadgeProps, photo: HTMLImageElement | null) {
  const sf = serif();
  ctx.fillStyle = "#f7f2e8"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(27,58,42,0.022)";
  for (let x = 0; x < W; x += 20) for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }

  const pad = W * 0.055;
  ctx.strokeStyle = "rgba(27,58,42,0.12)"; ctx.lineWidth = 1.5; ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
  const ca = W * 0.04, cp = pad + W * 0.012;
  ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 2;
  ([[cp, cp, 1, 1], [W - cp, cp, -1, 1], [cp, H - cp, 1, -1], [W - cp, H - cp, -1, -1]] as [number, number, number, number][])
    .forEach(([x2, y2, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x2, y2 + sy * ca); ctx.lineTo(x2, y2); ctx.lineTo(x2 + sx * ca, y2); ctx.stroke(); });

  if (photo) {
    // Tilted square frame, upper-center
    const sqSize = W * 0.42;
    const sqCx = W / 2, sqCy = H * 0.25;
    const angle = Math.PI / 22;
    clipImgRotated(ctx, photo, sqCx, sqCy, sqSize, sqSize, angle, sqSize * 0.05);
    // Outer gold accent ring
    ctx.save(); ctx.translate(sqCx, sqCy); ctx.rotate(angle);
    ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sqSize / 2 - 4, -sqSize / 2 - 4, sqSize + 8, sqSize + 8, sqSize * 0.055);
    else ctx.rect(-sqSize / 2 - 4, -sqSize / 2 - 4, sqSize + 8, sqSize + 8);
    ctx.stroke();
    // Inner forest border
    ctx.strokeStyle = "rgba(27,58,42,0.4)"; ctx.lineWidth = 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize, sqSize * 0.05);
    else ctx.rect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);
    ctx.stroke();
    ctx.restore();

    // Text below, center-aligned
    const cx2 = W / 2; let ty = sqCy + sqSize / 2 + H * 0.05; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(27,58,42,0.4)"; ctx.font = `500 ${W * 0.013}px sans-serif`;
    ctx.letterSpacing = "4px"; ctx.fillText("I'LL BE ATTENDING", cx2, ty); ctx.letterSpacing = "0px"; ty += W * 0.062;
    ctx.fillStyle = "#1b3a2a"; ctx.font = `700 ${W * 0.063}px ${sf}`;
    ty = wrapText(ctx, p.sessionLabel, cx2, ty, W * 0.76, W * 0.072);
    ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx2 - W * 0.07, ty); ctx.lineTo(cx2 + W * 0.07, ty); ctx.stroke(); ty += W * 0.042;
    if (p.themeTitle) {
      ctx.fillStyle = "rgba(27,58,42,0.65)"; ctx.font = `italic 400 ${W * 0.026}px ${sf}`;
      ctx.fillText(`Theme: ${p.themeTitle}`, cx2, ty); ty += W * 0.036;
      if (p.themeScripture) {
        ctx.fillStyle = "rgba(27,58,42,0.4)"; ctx.font = `400 ${W * 0.019}px sans-serif`;
        ctx.fillText(p.themeScripture, cx2, ty); ty += W * 0.032;
      }
      ty += W * 0.008;
    }
    ctx.fillStyle = "#1b3a2a"; ctx.font = `400 ${W * 0.032}px ${sf}`;
    ctx.fillText(`${p.firstName} ${p.lastName}`, cx2, ty); ty += W * 0.042;
    ctx.fillStyle = "rgba(27,58,42,0.45)"; ctx.font = `400 ${W * 0.019}px sans-serif`;
    ctx.fillText(p.shortDate, cx2, ty);
    ctx.textAlign = "right"; ctx.fillStyle = "rgba(27,58,42,0.28)"; ctx.font = `300 ${W * 0.014}px sans-serif`;
    ctx.letterSpacing = "3px"; ctx.fillText((p.siteName ?? "THE GREEN HOUSE").toUpperCase(), W - pad - W * 0.04, H - pad - W * 0.035); ctx.letterSpacing = "0px";
  } else {
    const cx = W / 2; let y = H * 0.3; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(27,58,42,0.055)"; ctx.font = `700 ${W * 0.28}px ${sf}`;
    ctx.fillText("GH", cx, H * 0.66);
    ctx.fillStyle = "rgba(27,58,42,0.3)"; ctx.font = `500 ${W * 0.013}px sans-serif`;
    ctx.letterSpacing = "5px"; ctx.fillText("I'LL BE ATTENDING", cx, y); ctx.letterSpacing = "0px"; y += W * 0.072;
    ctx.fillStyle = "#1b3a2a"; ctx.font = `700 ${W * 0.075}px ${sf}`;
    y = wrapText(ctx, p.sessionLabel, cx, y, W * 0.75, W * 0.083);
    if (p.themeTitle) { y += W * 0.006; ctx.fillStyle = "rgba(201,162,74,0.85)"; ctx.font = `italic 400 ${W * 0.028}px ${sf}`; ctx.fillText(`Theme: ${p.themeTitle}`, cx, y); y += W * 0.042; }
    ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - W * 0.07, y); ctx.lineTo(cx + W * 0.07, y); ctx.stroke(); y += W * 0.052;
    ctx.fillStyle = "#1b3a2a"; ctx.font = `400 ${W * 0.032}px ${sf}`; ctx.fillText(`${p.firstName} ${p.lastName}`, cx, y); y += W * 0.046;
    ctx.fillStyle = "rgba(27,58,42,0.45)"; ctx.font = `400 ${W * 0.02}px sans-serif`; ctx.fillText(p.shortDate, cx, y);
    ctx.fillStyle = "rgba(27,58,42,0.25)"; ctx.font = `300 ${W * 0.015}px sans-serif`;
    ctx.letterSpacing = "3px"; ctx.fillText((p.siteName ?? "THE GREEN HOUSE").toUpperCase(), cx, H - pad - W * 0.035); ctx.letterSpacing = "0px";
  }
}

// ─── Variant 3: Dusk ─────────────────────────────────────────────────────────
function drawV3(ctx: CanvasRenderingContext2D, W: number, H: number, p: BadgeProps, photo: HTMLImageElement | null) {
  const sf = serif();
  const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bg.addColorStop(0, "#1a1218"); bg.addColorStop(0.6, "#1b2d1e"); bg.addColorStop(1, "#1b3a2a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, W * 0.6);
  glow.addColorStop(0, "rgba(201,162,74,0.16)"); glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  let y = H * 0.09;

  if (photo) {
    // Circle frame with double gold ring — photo sits on top of the dark background
    const pr = W * 0.165;
    const pcy = H * 0.25;
    clipImg(ctx, photo, cx - pr, pcy - pr, pr * 2, pr * 2, "circle");
    // Outer glow ring
    ctx.beginPath(); ctx.arc(cx, pcy, pr + 14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(201,162,74,0.15)"; ctx.lineWidth = 10; ctx.stroke();
    // Gold ring
    ctx.beginPath(); ctx.arc(cx, pcy, pr + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 3; ctx.stroke();
    // Inner accent ring
    ctx.beginPath(); ctx.arc(cx, pcy, pr + 12, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(201,162,74,0.22)"; ctx.lineWidth = 1.5; ctx.stroke();
    y = pcy + pr + H * 0.045;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(201,162,74,0.5)"; ctx.font = `300 ${W * 0.013}px sans-serif`;
  ctx.letterSpacing = "5px"; ctx.fillText((p.siteName ?? "THE GREEN HOUSE").toUpperCase(), cx, y); ctx.letterSpacing = "0px"; y += W * 0.055;
  ctx.fillStyle = "rgba(247,242,232,0.45)"; ctx.font = `300 ${W * 0.025}px ${sf}`;
  ctx.fillText("I'll be attending", cx, y); y += W * 0.074;
  ctx.fillStyle = "#f7f2e8"; ctx.font = `700 ${W * 0.065}px ${sf}`;
  y = wrapText(ctx, p.sessionLabel, cx, y, W * 0.82, W * 0.075);
  if (p.themeTitle) {
    y += W * 0.01; ctx.fillStyle = "#c9a24a"; ctx.font = `italic 400 ${W * 0.027}px ${sf}`;
    ctx.fillText(`Theme: ${p.themeTitle}`, cx, y); y += W * 0.038;
    if (p.themeScripture) {
      ctx.fillStyle = "rgba(247,242,232,0.45)"; ctx.font = `400 ${W * 0.02}px sans-serif`;
      ctx.letterSpacing = "1px"; ctx.fillText(p.themeScripture, cx, y); ctx.letterSpacing = "0px"; y += W * 0.036;
    }
  }

  const dv = W * 0.07;
  const dvg = ctx.createLinearGradient(cx - dv, y, cx + dv, y);
  dvg.addColorStop(0, "transparent"); dvg.addColorStop(0.5, "rgba(201,162,74,0.4)"); dvg.addColorStop(1, "transparent");
  ctx.strokeStyle = dvg; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - dv, y); ctx.lineTo(cx + dv, y); ctx.stroke(); y += W * 0.045;

  ctx.fillStyle = "rgba(247,242,232,0.88)"; ctx.font = `400 ${W * 0.033}px ${sf}`;
  ctx.fillText(`${p.firstName} ${p.lastName}`, cx, y); y += W * 0.047;
  ctx.fillStyle = "rgba(247,242,232,0.45)"; ctx.font = `400 ${W * 0.021}px sans-serif`;
  ctx.fillText(p.shortDate, cx, y);
  ctx.fillStyle = "rgba(247,242,232,0.22)"; ctx.font = `300 ${W * 0.015}px sans-serif`;
  ctx.letterSpacing = "3px"; ctx.fillText("www.greenhousews.co.ke", cx, H - W * 0.04); ctx.letterSpacing = "0px";
}

// ─── Variant 4: Frame ────────────────────────────────────────────────────────
function drawV4(ctx: CanvasRenderingContext2D, W: number, H: number, p: BadgeProps, photo: HTMLImageElement | null) {
  const sf = serif();
  // Always dark background — photo goes in a tilted square, never fills the canvas
  ctx.fillStyle = "#0d1a12"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(201,162,74,0.07)"; ctx.lineWidth = 1.5;
  for (let rc = W * 0.15; rc < W * 1.6; rc += W * 0.115) { ctx.beginPath(); ctx.arc(W, H, rc, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = "rgba(201,162,74,0.04)";
  for (let xd = 0; xd < W; xd += 28) for (let yd = 0; yd < H; yd += 28) { ctx.beginPath(); ctx.arc(xd, yd, 1.5, 0, Math.PI * 2); ctx.fill(); }
  const gRad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.46);
  gRad.addColorStop(0, "rgba(201,162,74,0.1)"); gRad.addColorStop(1, "transparent");
  ctx.fillStyle = gRad; ctx.fillRect(0, 0, W, H);

  const fi = W * 0.04;
  // Outer gold frame
  ctx.strokeStyle = "rgba(201,162,74,0.55)"; ctx.lineWidth = 2; ctx.strokeRect(fi, fi, W - fi * 2, H - fi * 2);
  ctx.strokeStyle = "rgba(201,162,74,0.18)"; ctx.lineWidth = 1;
  const fi2 = fi + W * 0.018; ctx.strokeRect(fi2, fi2, W - fi2 * 2, H - fi2 * 2);
  [[fi, fi], [W - fi, fi], [fi, H - fi], [W - fi, H - fi]].forEach(([x2, y2], i) => {
    ctx.save(); ctx.translate(x2, y2); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "rgba(201,162,74,0.55)"; ctx.fillRect(-5, -5, 10, 10); ctx.restore();
    ctx.beginPath(); ctx.arc(x2, y2, 18, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(201,162,74,0.25)"; ctx.lineWidth = 1; ctx.stroke();
    void i;
  });

  const cx = W / 2;
  let y = H * 0.34;

  if (photo) {
    // Tilted square, upper center — photo sits on dark bg as a decorative element
    const sqSize = W * 0.44;
    const sqCy = H * 0.27;
    const angle = Math.PI / 20;
    clipImgRotated(ctx, photo, cx, sqCy, sqSize, sqSize, angle, sqSize * 0.055);
    // Gold glow shadow behind the square
    ctx.save(); ctx.translate(cx, sqCy); ctx.rotate(angle);
    ctx.shadowColor = "rgba(201,162,74,0.35)"; ctx.shadowBlur = 30;
    ctx.strokeStyle = "#c9a24a"; ctx.lineWidth = 4;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize, sqSize * 0.055);
    else ctx.rect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Inner fine border
    ctx.strokeStyle = "rgba(201,162,74,0.3)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-sqSize / 2 + 7, -sqSize / 2 + 7, sqSize - 14, sqSize - 14, sqSize * 0.04);
    else ctx.rect(-sqSize / 2 + 7, -sqSize / 2 + 7, sqSize - 14, sqSize - 14);
    ctx.stroke();
    ctx.restore();
    y = sqCy + sqSize / 2 + H * 0.048;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(201,162,74,0.7)"; ctx.font = `300 ${W * 0.013}px sans-serif`;
  ctx.letterSpacing = "5px"; ctx.fillText("I'LL BE ATTENDING", cx, y); ctx.letterSpacing = "0px"; y += W * 0.067;
  ctx.fillStyle = "#f7f2e8"; ctx.font = `700 ${W * 0.065}px ${sf}`;
  y = wrapText(ctx, p.sessionLabel, cx, y, W * 0.78, W * 0.074);
  if (p.themeTitle) {
    y += W * 0.01; ctx.fillStyle = "#c9a24a"; ctx.font = `italic 400 ${W * 0.029}px ${sf}`;
    ctx.fillText(`Theme: ${p.themeTitle}`, cx, y); y += W * 0.040;
    if (p.themeScripture) {
      ctx.fillStyle = "rgba(247,242,232,0.45)"; ctx.font = `400 ${W * 0.019}px sans-serif`;
      ctx.letterSpacing = "1px"; ctx.fillText(p.themeScripture, cx, y); ctx.letterSpacing = "0px"; y += W * 0.036;
    }
  }
  const dg = ctx.createLinearGradient(cx - W * 0.1, y, cx + W * 0.1, y);
  dg.addColorStop(0, "transparent"); dg.addColorStop(0.5, "rgba(201,162,74,0.55)"); dg.addColorStop(1, "transparent");
  ctx.strokeStyle = dg; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - W * 0.1, y); ctx.lineTo(cx + W * 0.1, y); ctx.stroke(); y += W * 0.048;
  ctx.fillStyle = "rgba(247,242,232,0.9)"; ctx.font = `400 ${W * 0.033}px ${sf}`;
  ctx.fillText(`${p.firstName} ${p.lastName}`, cx, y); y += W * 0.05;
  ctx.fillStyle = "rgba(247,242,232,0.5)"; ctx.font = `400 ${W * 0.021}px sans-serif`; ctx.fillText(p.shortDate, cx, y);
  ctx.fillStyle = "rgba(247,242,232,0.25)"; ctx.font = `300 ${W * 0.015}px sans-serif`;
  ctx.letterSpacing = "3px"; ctx.fillText("www.greenhousews.co.ke", cx, H - fi - W * 0.042); ctx.letterSpacing = "0px";
}

function drawVariant(ctx: CanvasRenderingContext2D, W: number, H: number, v: VariantId, p: BadgeProps, photo: HTMLImageElement | null) {
  if (v === 1) drawV1(ctx, W, H, p, photo);
  else if (v === 2) drawV2(ctx, W, H, p, photo);
  else if (v === 3) drawV3(ctx, W, H, p, photo);
  else              drawV4(ctx, W, H, p, photo);
}

// ─── BadgeCustomizer modal ───────────────────────────────────────────────────

interface ModalProps extends BadgeProps {
  open:     boolean;
  onClose:  () => void;
}

export function BadgeCustomizerModal({ open, onClose, ...props }: ModalProps) {
  const [variant,    setVariant]    = useState<VariantId>(1);
  const [photoEl,    setPhotoEl]    = useState<HTMLImageElement | null>(null);
  const [photoUrl,   setPhotoUrl]   = useState<string | null>(null);
  const [fileError,  setFileError]  = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [shared,     setShared]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const renderPreview = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 540; canvas.height = 540;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(0.5, 0.5);
    drawVariant(ctx, SIZE, SIZE, variant, props, photoEl);
    setPreviewUrl(canvas.toDataURL("image/jpeg", 0.92));
  }, [variant, photoEl, props]);

  useEffect(() => { if (open) renderPreview(); }, [open, renderPreview]);

  function handleFile(file: File) {
    setFileError(null);
    if (!file.type.startsWith("image/")) { setFileError("Please upload a JPG, PNG or WEBP image"); return; }
    if (file.size > MAX_BYTES) { setFileError(`Image must be under ${MAX_MB} MB`); return; }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    const img = new Image();
    img.onload = () => setPhotoEl(img);
    img.src = url;
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null); setPhotoEl(null);
  }

  async function buildCanvas(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;
    await document.fonts.ready;
    drawVariant(ctx, SIZE, SIZE, variant, props, photoEl);
    return canvas;
  }

  async function download() {
    setGenerating(true);
    try {
      const canvas = await buildCanvas();
      await new Promise<void>(res => {
        canvas.toBlob(blob => {
          if (!blob) { res(); return; }
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `badge-${props.firstName.toLowerCase()}-${props.lastName.toLowerCase()}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1500);
          res();
        }, "image/png");
      });
    } finally { setGenerating(false); }
  }

  async function share() {
    setGenerating(true);
    try {
      const canvas = await buildCanvas();
      canvas.toBlob(async blob => {
        if (!blob) { setGenerating(false); return; }
        const file = new File([blob], "badge.png", { type: "image/png" });
        if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `I'll be attending ${props.sessionLabel}`,
              text:  `Join me at ${props.siteName ?? "The Green House"} 🌿`,
            });
            setShared(true); setTimeout(() => setShared(false), 3000);
          } catch { /* user cancelled */ }
        } else {
          // fallback: download
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "badge.png"; a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1500);
        }
        setGenerating(false);
      }, "image/png");
    } catch { setGenerating(false); }
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-md bg-[#f7f2e8] rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[95dvh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1b3a2a]/10">
          <div>
            <h2 className="text-base font-semibold text-[#1b3a2a]">Customize your badge</h2>
            <p className="text-xs text-[#1b3a2a]/50 mt-0.5">Pick a style · add your photo · share</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#1b3a2a]/8 transition-colors">
            <X size={16} className="text-[#1b3a2a]/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Variant selector */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1b3a2a]/40 mb-3">Style</p>
            <div className="grid grid-cols-4 gap-2">
              {VARIANTS.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v.id)}
                  className={cn(
                    "relative rounded-2xl overflow-hidden aspect-square transition-all",
                    variant === v.id ? "ring-2 ring-[#c9a24a] ring-offset-2 ring-offset-[#f7f2e8]" : "opacity-70 hover:opacity-100"
                  )}
                  style={{ background: v.bg }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                    <span className="text-[8px] font-semibold leading-tight text-center" style={{ color: v.accent }}>{v.name}</span>
                  </div>
                  {variant === v.id && (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#c9a24a] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#1b3a2a]/35 mt-1.5">{VARIANTS.find(v => v.id === variant)?.desc}</p>
          </div>

          {/* Photo upload */}
          <div className="px-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1b3a2a]/40 mb-3">Your photo <span className="normal-case font-normal">· optional</span></p>
            {photoUrl ? (
              <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#1b3a2a]/10 px-3 py-2.5">
                <img src={photoUrl} alt="Your photo" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1b3a2a] truncate">Photo added</p>
                  <p className="text-[10px] text-[#1b3a2a]/40">Tap to change</p>
                </div>
                <button onClick={removePhoto} className="p-1.5 rounded-lg hover:bg-red-50 text-[#1b3a2a]/30 hover:text-red-500 transition-colors">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className={cn(
                  "w-full rounded-2xl border-2 border-dashed py-4 flex flex-col items-center gap-2 transition-all",
                  isDragging ? "border-[#c9a24a] bg-[#c9a24a]/8" : "border-[#1b3a2a]/15 hover:border-[#c9a24a]/50 hover:bg-[#c9a24a]/4"
                )}
              >
                <ImagePlus size={20} className="text-[#1b3a2a]/30" />
                <span className="text-xs text-[#1b3a2a]/50">Tap to add your photo</span>
                <span className="text-[10px] text-[#1b3a2a]/30">JPG, PNG or WEBP · max {MAX_MB} MB</span>
              </button>
            )}
            <input
              ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            {fileError && <p className="text-[11px] text-red-500 mt-1.5">{fileError}</p>}
          </div>

          {/* Preview */}
          <div className="px-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1b3a2a]/40 mb-3">Preview</p>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#1b3a2a]/8 relative">
              {previewUrl ? (
                <img src={previewUrl} alt="Badge preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#1b3a2a]/30" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-[#1b3a2a]/10 space-y-2">
          <button
            onClick={share}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1b3a2a] text-[#f7f2e8] text-sm font-semibold disabled:opacity-60 transition-opacity"
          >
            {generating ? <Loader2 size={15} className="animate-spin" /> : shared ? <Check size={15} className="text-green-400" /> : <Share2 size={15} />}
            {shared ? "Shared!" : "Share badge"}
          </button>
          <button
            onClick={download}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#1b3a2a]/20 text-[#1b3a2a] text-sm font-medium hover:bg-[#1b3a2a]/5 disabled:opacity-60 transition-all"
          >
            <Download size={14} />
            Save to photos
          </button>
          <p className="text-center text-[10px] text-[#1b3a2a]/30">
            Perfect for Instagram stories, WhatsApp statuses & Facebook posts
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Prompt dialog (shown on scroll / download click) ───────────────────────

interface PromptProps extends BadgeProps {
  open:          boolean;
  onClose:       () => void;
  onCustomize:   () => void;
}

export function BadgePromptDialog({ open, onClose, onCustomize }: PromptProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-sm mx-4 sm:mx-auto bg-[#1b3a2a] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Gold glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(201,162,74,0.2),transparent)" }} />
        <div className="relative px-6 pt-8 pb-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <X size={14} className="text-white/50" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#c9a24a]/15 border border-[#c9a24a]/25 flex items-center justify-center mb-4">
            <span className="text-2xl">🌿</span>
          </div>
          <h3 className="font-display text-xl font-semibold text-[#f7f2e8] mb-2 leading-snug">
            You have a digital badge
          </h3>
          <p className="text-sm text-[#f7f2e8]/60 leading-relaxed mb-6">
            Add your photo, pick a style, and share it on Instagram, WhatsApp or Facebook — invite your people to come along!
          </p>
          <button
            onClick={() => { onClose(); onCustomize(); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#c9a24a] text-[#1b3a2a] text-sm font-bold hover:bg-[#e4c97e] transition-colors"
          >
            Customize &amp; share my badge <ChevronRight size={15} />
          </button>
          <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-[#f7f2e8]/35 hover:text-[#f7f2e8]/60 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

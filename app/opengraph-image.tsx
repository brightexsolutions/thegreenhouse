import { ImageResponse } from "next/og";

export const runtime     = "edge";
export const alt         = "The Green House Worship Community — Nairobi, Kenya";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0d1a12 0%, #1b3a2a 45%, #0d2218 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
        position: "relative",
      }}
    >
      {/* Gold top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg, transparent, #c9a24a, transparent)",
      }} />

      {/* Label */}
      <div style={{
        color: "#c9a24a",
        fontSize: 13,
        letterSpacing: 8,
        textTransform: "uppercase",
        marginBottom: 28,
        fontFamily: "sans-serif",
        fontWeight: 600,
      }}>
        Nairobi, Kenya
      </div>

      {/* Headline */}
      <div style={{
        color: "#f7f2e8",
        fontSize: 64,
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 1.05,
        fontFamily: "serif",
        marginBottom: 24,
      }}>
        Greenhouse Worship Community
      </div>

      {/* Tagline */}
      <div style={{
        color: "rgba(247,242,232,0.45)",
        fontSize: 22,
        fontFamily: "sans-serif",
        letterSpacing: 3,
        textTransform: "uppercase",
      }}>
        Low pressure · Real connection
      </div>

      {/* Gold bottom accent line */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg, transparent, #c9a24a, transparent)",
      }} />

      {/* URL */}
      <div style={{
        position: "absolute", bottom: 28, right: 48,
        color: "rgba(201,162,74,0.4)",
        fontSize: 14,
        fontFamily: "sans-serif",
        letterSpacing: 1,
      }}>
        greenhousews.co.ke
      </div>
    </div>,
    { ...size }
  );
}

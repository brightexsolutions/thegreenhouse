import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const { token } = await params;

  const supabase = createAdminClient();
  const { data: ticket } = await supabase
    .from("registrations")
    .select("first_name, last_name, ticket_token, events(title, event_date, theme_title)")
    .eq("ticket_token", token)
    .is("deleted_at", null)
    .single();

  if (!ticket) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const t = ticket as unknown as {
    first_name:   string;
    last_name:    string;
    ticket_token: string;
    events: { title: string; event_date: string; theme_title: string | null };
  };

  const sessionLabel = t.events.title.replace(/^The Green House\s*[—–-]\s*/i, "");
  const shortDate    = new Date(t.events.event_date).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });
  const cleanUrl = SITE_URL.replace(/^https?:\/\//, "");

  // Load Cormorant Garamond (woff v1 — @vercel/og does not support woff2)
  // 4s timeout so a slow/blocked font CDN doesn't hang the request
  let cormorantData: ArrayBuffer | undefined;
  let cormorantBoldData: ArrayBuffer | undefined;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const [r1, r2] = await Promise.all([
      fetch("https://fonts.gstatic.com/s/cormorantgaramond/v22/co3WmX5slCNuHLi8bLeY9MK7whWMhyjQAllvuQ.woff", { signal: ctrl.signal }),
      fetch("https://fonts.gstatic.com/s/cormorantgaramond/v22/co3YmX5slCNuHLi8bLeY9MK7whWMhyjQblC9BNM.woff", { signal: ctrl.signal }),
    ]);
    clearTimeout(timer);
    cormorantData     = r1.ok ? await r1.arrayBuffer() : undefined;
    cormorantBoldData = r2.ok ? await r2.arrayBuffer() : undefined;
  } catch { /* use system serif fallback if fonts unavailable */ }

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[] = [];
  if (cormorantData)     fonts.push({ name: "Cormorant", data: cormorantData,     weight: 400, style: "normal" });
  if (cormorantBoldData) fonts.push({ name: "Cormorant", data: cormorantBoldData, weight: 700, style: "normal" });

  const GOLD   = "#c9a24a";
  const CREAM  = "#f7f2e8";
  const SIZE   = 1080;

  return new ImageResponse(
    (
      <div
        style={{
          width:          SIZE,
          height:         SIZE,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          background:     `linear-gradient(145deg, #163022 0%, #0d1f15 55%, #1b3a2a 100%)`,
          position:       "relative",
          overflow:       "hidden",
          fontFamily:     "sans-serif",
        }}
      >
        {/* Outer decorative ring (top-right) */}
        <div style={{
          position:    "absolute",
          top:         -SIZE * 0.28,
          right:       -SIZE * 0.28,
          width:       SIZE * 0.75,
          height:      SIZE * 0.75,
          borderRadius: "50%",
          border:      `1px solid rgba(201,162,74,0.09)`,
          display:     "flex",
        }} />
        <div style={{
          position:    "absolute",
          top:         -SIZE * 0.22,
          right:       -SIZE * 0.22,
          width:       SIZE * 0.62,
          height:      SIZE * 0.62,
          borderRadius: "50%",
          border:      `1px solid rgba(201,162,74,0.06)`,
          display:     "flex",
        }} />

        {/* Bottom-left ring */}
        <div style={{
          position:    "absolute",
          bottom:      -SIZE * 0.3,
          left:        -SIZE * 0.3,
          width:       SIZE * 0.7,
          height:      SIZE * 0.7,
          borderRadius: "50%",
          border:      `1px solid rgba(201,162,74,0.07)`,
          display:     "flex",
        }} />

        {/* Radial gold glow top */}
        <div style={{
          position:   "absolute",
          top:        0,
          left:       0,
          right:      0,
          height:     SIZE * 0.5,
          background: "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(201,162,74,0.18), transparent)",
          display:    "flex",
        }} />

        {/* Horizontal gold accent line */}
        <div style={{
          position:   "absolute",
          top:        "50%",
          left:       "50%",
          transform:  "translate(-50%, -50%)",
          width:      SIZE * 0.62,
          height:     1,
          background: "rgba(201,162,74,0.12)",
          display:    "flex",
          marginTop:  64,
        }} />

        {/* Content */}
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          textAlign:      "center",
          width:          SIZE * 0.72,
          gap:            0,
          position:       "relative",
          zIndex:         10,
        }}>
          {/* Brand label */}
          <div style={{
            display:       "flex",
            alignItems:    "center",
            gap:           12,
            marginBottom:  32,
          }}>
            {/* Small diamond accent */}
            <div style={{
              width:        6,
              height:       6,
              background:   GOLD,
              transform:    "rotate(45deg)",
              opacity:      0.5,
              display:      "flex",
            }} />
            <span style={{
              fontSize:      14,
              letterSpacing: 5,
              textTransform: "uppercase",
              color:         "rgba(201,162,74,0.65)",
              fontFamily:    "sans-serif",
            }}>
              {SITE_NAME}
            </span>
            <div style={{
              width:        6,
              height:       6,
              background:   GOLD,
              transform:    "rotate(45deg)",
              opacity:      0.5,
              display:      "flex",
            }} />
          </div>

          {/* "I'm attending" */}
          <span style={{
            fontSize:   34,
            color:      "rgba(247,242,232,0.6)",
            fontFamily: cormorantData ? "Cormorant" : "serif",
            fontWeight: 400,
            marginBottom: 4,
          }}>
            I&apos;m attending
          </span>

          {/* Event name — the hero */}
          <span style={{
            fontSize:      80,
            fontFamily:    cormorantBoldData ? "Cormorant" : "serif",
            fontWeight:    700,
            color:         GOLD,
            lineHeight:    1.1,
            marginBottom:  16,
          }}>
            {sessionLabel}
          </span>

          {/* Theme (if any) */}
          {t.events.theme_title && (
            <span style={{
              fontSize:    22,
              fontFamily:  cormorantData ? "Cormorant" : "serif",
              color:       "rgba(247,242,232,0.45)",
              fontStyle:   "italic",
              marginBottom: 32,
            }}>
              {t.events.theme_title}
            </span>
          )}

          {/* Divider */}
          <div style={{
            width:        80,
            height:       1.5,
            background:   `linear-gradient(90deg, transparent, ${GOLD}55, transparent)`,
            marginBottom: 28,
            marginTop:    t.events.theme_title ? 0 : 16,
            display:      "flex",
          }} />

          {/* Attendee name */}
          <span style={{
            fontSize:    32,
            fontFamily:  cormorantData ? "Cormorant" : "serif",
            color:       CREAM,
            fontWeight:  400,
            marginBottom: 12,
          }}>
            {t.first_name} {t.last_name}
          </span>

          {/* Date */}
          <span style={{
            fontSize:    20,
            color:       "rgba(247,242,232,0.38)",
            fontFamily:  "sans-serif",
          }}>
            {shortDate}
          </span>
        </div>

        {/* Bottom URL watermark */}
        <div style={{
          position:  "absolute",
          bottom:    32,
          display:   "flex",
          gap:       10,
          alignItems: "center",
        }}>
          <div style={{ width: 24, height: 1, background: "rgba(201,162,74,0.25)", display: "flex" }} />
          <span style={{
            fontSize:      12,
            letterSpacing: 2,
            color:         "rgba(247,242,232,0.2)",
            fontFamily:    "sans-serif",
          }}>
            {cleanUrl}
          </span>
          <div style={{ width: 24, height: 1, background: "rgba(201,162,74,0.25)", display: "flex" }} />
        </div>
      </div>
    ),
    {
      width:  SIZE,
      height: SIZE,
      fonts,
      headers: {
        "Content-Disposition": `attachment; filename="badge-${t.first_name.toLowerCase()}-${t.last_name.toLowerCase()}.png"`,
        "Cache-Control":       "no-store",
      },
    }
  );
}

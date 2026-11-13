"use client";

/** Last resort: the root layout itself failed, so this renders its own document. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b3a2a", color: "#f7f2e8", fontFamily: "system-ui, sans-serif", padding: 16 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>The site could not be loaded</h1>
          <p style={{ opacity: 0.8, lineHeight: 1.6, margin: "0 0 24px" }}>It is on our side, not yours. Try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "12px 24px", borderRadius: 4, border: 0, background: "#c9a24a", color: "#1b3a2a", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

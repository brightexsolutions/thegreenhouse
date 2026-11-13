import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest:       "#1b3a2a",
        "forest-dark":"#0d1a12",
        sage:         "#4e7a5e",
        "sage-light": "#7fa98a",
        moss:         "#2d5240",
        gold:         "#c9a24a",
        // Gold dark enough to read as text on cream and white (4.9:1 on cream).
        // Plain gold is 2.2:1 there: use it on forest, never on light surfaces.
        "gold-deep":  "#856417",
        "gold-light": "#e4c97e",
        "gold-pale":  "#f5edce",
        cream:        "#f7f2e8",
        "cream-dark": "#ede8d8",
        "off-white":  "#fdfcf8",
        charcoal:     "#1a1a18",
        bark:         "#5c4a35",
        mist:         "#e8ede9",
      },
      // Gold as TEXT follows the surface it sits on (see --gold-text in
      // globals.css): bright on forest, a deeper tone on cream and white where
      // bright gold is only 2.2:1. Backgrounds and borders keep plain gold.
      textColor: {
        gold: "rgb(var(--gold-text) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "cream-gradient":  "linear-gradient(160deg, #f7f2e8 0%, #ede8d8 55%, #f7f2e8 100%)",
        "forest-gradient": "linear-gradient(160deg, #1b3a2a 0%, #2d5240 100%)",
      },
      animation: {
        marquee:     "marquee 32s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-up":   "fade-up 0.5s ease-out forwards",
      },
      keyframes: {
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1",   transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.85)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        card:       "0 2px 16px 0 rgba(27,58,42,0.08), 0 1px 4px 0 rgba(27,58,42,0.04)",
        "card-hover":"0 8px 32px 0 rgba(27,58,42,0.14), 0 2px 8px 0 rgba(27,58,42,0.08)",
        gold:       "0 0 24px 0 rgba(201,162,74,0.22)",
      },
    },
  },
  plugins: [],
};

export default config;

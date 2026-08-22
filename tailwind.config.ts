import type { Config } from "tailwindcss";

/**
 * Tailwind v4 uses CSS-first `@theme` in `app/globals.css` as the active
 * token source. This config mirrors the same brand mappings for tooling
 * and brief parity — do not dual-load via `@config` (avoids hybrid theme).
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        foreground: "var(--fg)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
    },
  },
  plugins: [],
};

export default config;

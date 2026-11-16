import type { Config } from "tailwindcss";

/**
 * Datadive theme tokens (design §16).
 *
 * Colors are surfaced from the CSS custom properties declared in
 * src/app/globals.css so the dark theme is defined once and consumed as
 * Tailwind tokens here. Fonts come from next/font/google CSS variables wired
 * in src/app/layout.tsx.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        depth: "var(--color-depth)",
        brand: {
          DEFAULT: "var(--color-brand-500)",
          50: "var(--color-brand-50)",
          100: "var(--color-brand-100)",
          200: "var(--color-brand-200)",
          300: "var(--color-brand-300)",
          400: "var(--color-brand-400)",
          500: "var(--color-brand-500)",
          600: "var(--color-brand-600)",
          700: "var(--color-brand-700)",
          800: "var(--color-brand-800)",
          900: "var(--color-brand-900)",
        },
        // Accent roles — each with a dedicated job (design §16).
        accent: {
          amber: "var(--color-accent-amber)",
          red: "var(--color-accent-red)",
          green: "var(--color-accent-green)",
          blue: "var(--color-accent-blue)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      // Fixed type scale (design §16): display-1/2/3, h1–h4, body, small.
      fontSize: {
        "display-1": ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-2": ["clamp(2.25rem, 4.5vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-3": ["clamp(1.875rem, 3.5vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        h1: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        h2: ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h3: ["1.5rem", { lineHeight: "1.25" }],
        h4: ["1.25rem", { lineHeight: "1.3" }],
        body: ["1rem", { lineHeight: "1.6" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
      },
      // Slow decorative drift for GlowBlob (design §16). Disabled under
      // prefers-reduced-motion via the `motion-safe:` variant at the call site
      // and the globals.css reduced-motion guard.
      keyframes: {
        "glow-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(4%, -4%, 0) scale(1.08)" },
        },
      },
      animation: {
        "glow-drift": "glow-drift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

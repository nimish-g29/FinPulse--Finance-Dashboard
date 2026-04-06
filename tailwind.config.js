/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 24px rgb(0 0 0 / 0.06)",
        "card-dark":
          "0 1px 2px rgb(0 0 0 / 0.2), 0 4px 32px rgb(0 0 0 / 0.35)",
        glow: "0 0 0 1px rgb(var(--accent) / 0.12), 0 8px 40px rgb(var(--accent) / 0.15)",
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(at 40% 20%, rgb(99 102 241 / 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(16 185 129 / 0.06) 0px, transparent 45%), radial-gradient(at 0% 50%, rgb(244 63 94 / 0.05) 0px, transparent 40%)",
        "mesh-dark":
          "radial-gradient(at 40% 20%, rgb(99 102 241 / 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(16 185 129 / 0.1) 0px, transparent 45%), radial-gradient(at 0% 50%, rgb(244 63 94 / 0.08) 0px, transparent 40%)",
      },
    },
  },
  plugins: [],
};

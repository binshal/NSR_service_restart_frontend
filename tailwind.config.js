/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0B1220",
          panel: "#121A2B",
          panel2: "#0F1729",
          border: "#223049",
          border2: "#2C3D5C",
        },
        text: {
          primary: "#E7ECF5",
          secondary: "#94A3B8",
          muted: "#5B6B85",
        },
        api: {
          DEFAULT: "#38BDF8",
          bg: "rgba(56,189,248,0.10)",
        },
        script: {
          DEFAULT: "#A78BFA",
          bg: "rgba(167,139,250,0.10)",
        },
        state: {
          success: "#34D399",
          successBg: "rgba(52,211,153,0.10)",
          fail: "#F87171",
          failBg: "rgba(248,113,113,0.12)",
          running: "#FBBF24",
          runningBg: "rgba(251,191,36,0.10)",
          idle: "#5B6B85",
          idleBg: "rgba(91,107,133,0.10)",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.15), 0 0 24px rgba(56,189,248,0.08)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.5)", opacity: "0.6" },
        },
        railFlow: {
          "0%": { backgroundPosition: "0 -200%" },
          "100%": { backgroundPosition: "0 200%" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.2s ease-in-out infinite",
        railFlow: "railFlow 1.5s linear infinite",
      },
    },
  },
  plugins: [],
};

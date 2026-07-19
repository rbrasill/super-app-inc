import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base neutra (Gray Scale do kit — cool)
        bg: "#F5F7FA", // gray 50
        panel: "#FFFFFF",
        ink: "#1D2026", // gray 900
        inkDark: "#1D2026",
        inkMid: "#363B47", // gray 800
        inkSoft: "#6E7485", // gray 600
        inkLabel: "#8C94A3", // gray 500
        inkFaint: "#A1A5B3", // gray 400
        inkMute: "#B7BAC7", // gray 300
        line: "#E9EAF0", // gray 100
        line2: "#EEF0F5",
        line3: "#F5F7FA", // gray 50
        chip: "#F0F2F6",
        inputLine: "#CED1D9", // gray 200
        // Primary (laranja)
        primary: "#FF6636", // primary 500
        primaryDark: "#E85520",
        primaryText: "#993D20", // primary 700 (texto sobre laranja claro)
        accent: "#FF6636",
        softOrange: "#FFEEE8", // primary 100
        softOrangeLine: "#FFDDD1", // primary 200
        // Secondary (índigo)
        secondary: "#564FFD", // 500
        secondarySoft: "#EBEBFF", // 100
        // Success (verde)
        success: "#23BD33", // 500
        successSoft: "#E1F7E3", // 100
        successText: "#15711F", // 700
        // Warning (âmbar) — travas / atenção
        warning: "#FD8E1F", // 500
        warnBg: "#FFF2E6", // 100
        warnLine: "#FED2A5", // 200
        warnText: "#985613", // 700
        // Danger (vermelho)
        danger: "#E34444", // 500
        dangerSoft: "#FFF0F0", // 100
        dangerText: "#B63636", // 600
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "-apple-system", "sans-serif"],
        head: ["var(--font-montserrat)", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        cardSm: "12px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(29,32,38,.04),0 4px 14px rgba(29,32,38,.06)",
        card: "0 2px 8px rgba(29,32,38,.05)",
        cardHover: "0 8px 22px rgba(29,32,38,.12)",
        btn: "0 6px 16px rgba(255,102,54,.30)",
      },
    },
  },
  plugins: [],
};

export default config;

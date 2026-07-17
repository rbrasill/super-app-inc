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
        // Base "warm light" (design Meu INC App)
        bg: "#FCFAF6",
        panel: "#FFFFFF",
        ink: "#1A1A1A",
        inkDark: "#0B0B0B",
        inkSoft: "#6B6B6B",
        inkMid: "#4A4640",
        inkLabel: "#8A8377",
        inkFaint: "#9A948A",
        inkMute: "#B4ADA1",
        line: "#F0EAE0",
        line2: "#F4EEE4",
        line3: "#F7F1E7",
        chip: "#F5EFE4",
        inputLine: "#E7DFD1",
        // Marca (laranja INC)
        primary: "#FF6000",
        primaryDark: "#E05600",
        accent: "#FF6000",
        softOrange: "#FFF3EA",
        // Avisos / travas
        warnBg: "#FDF6EF",
        warnLine: "#F6DFC9",
        warnText: "#C2500A",
        // Verde de apoio (status/entregue e barras de seção)
        green: "#0FA47A",
        greenBright: "#10B981",
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
        soft: "0 1px 2px rgba(11,11,11,.03),0 4px 14px rgba(11,11,11,.05)",
        card: "0 2px 8px rgba(11,11,11,.04)",
        cardHover: "0 8px 22px rgba(11,11,11,.10)",
        btn: "0 6px 16px rgba(255,96,0,.32)",
      },
    },
  },
  plugins: [],
};

export default config;

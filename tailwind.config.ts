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
        bg: "#F7F4EF",
        panel: "#FFFFFF",
        ink: "#141821",
        inkSoft: "#55606C",
        inkFaint: "#96A0A9",
        line: "#EAE5DC",
        line2: "#F1ECE3",
        chip: "#F0EBE1",
        primary: "#0FA47A",
        accent: "#FF6000",
        // sidebar (tema escuro)
        sidebar: "#14181F",
        sidebarHead: "#FFFFFF",
        sidebarText: "#AEB8C4",
        sidebarFaint: "#6C7787",
        sidebarActiveBg: "#1F2732",
        sidebarActiveIcon: "#22C79A",
        sidebarHover: "#1B222B",
        sidebarLine: "#222A34",
        kpiDark: "#14181F",
        warnBg: "#FFEFE2",
        warnLine: "#FFD2B0",
        warnText: "#C2500A",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "-apple-system", "sans-serif"],
        head: ["var(--font-space-grotesk)", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        cardSm: "10px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,25,20,.05),0 4px 16px rgba(15,25,20,.06)",
        card: "0 1px 2px rgba(15,25,20,.04),0 4px 12px rgba(15,25,20,.06)",
        cardHover: "0 10px 26px rgba(15,25,20,.14)",
        btn: "0 4px 12px rgba(15,164,122,.3)",
      },
    },
  },
  plugins: [],
};

export default config;

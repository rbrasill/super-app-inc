/**
 * Tokens do tema (kit de marca INC — neutros frios + laranja).
 * Espelham o tailwind.config — use as classes Tailwind sempre que possível
 * e este objeto apenas onde a cor precisa ir em style inline (ex.: stroke de SVG).
 */
export const THEME = {
  bg: "#f6f6f6",
  panel: "#FFFFFF",
  ink: "#1D2026",
  inkDark: "#1D2026",
  inkMid: "#363B47",
  inkSoft: "#6E7485",
  inkLabel: "#8C94A3",
  inkFaint: "#A1A5B3",
  inkMute: "#B7BAC7",
  line: "#E9EAF0",
  line2: "#EEF0F5",
  chip: "#F0F2F6",
  primary: "#FF6636",
  accent: "#FF6636",
  softOrange: "#FFEEE8",
  secondary: "#564FFD",
  success: "#23BD33",
  warning: "#FD8E1F",
  warnBg: "#FFF2E6",
  warnLine: "#FED2A5",
  warnText: "#985613",
  danger: "#E34444",
} as const;

/** Paleta categórica (kit) para avatares por pessoa. */
const AVATAR_PALETTE = [
  "#FF6636", "#564FFD", "#23BD33", "#FD8E1F", "#E34444",
  "#6E7485", "#993D20", "#342F98", "#15711F", "#985613",
];

/** Cor de avatar derivada do nome (bg suave + texto forte). */
export function whoAvatar(who: string): { avBg: string; avColor: string } {
  if (!who || !who.trim()) return { avBg: "#F0F2F6", avColor: "#B7BAC7" };
  const c = AVATAR_PALETTE[who.charCodeAt(0) % AVATAR_PALETTE.length];
  return { avBg: c + "22", avColor: c };
}

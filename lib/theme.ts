/**
 * Tokens do tema "warm light" (paleta INC · laranja).
 * Espelham o tailwind.config — use as classes Tailwind sempre que possível
 * e este objeto apenas onde a cor precisa ir em style inline (ex.: stroke de SVG).
 */
export const THEME = {
  bg: "#FCFAF6",
  panel: "#FFFFFF",
  ink: "#1A1A1A",
  inkDark: "#0B0B0B",
  inkSoft: "#6B6B6B",
  inkFaint: "#9A948A",
  inkMute: "#B4ADA1",
  line: "#F0EAE0",
  line2: "#F4EEE4",
  chip: "#F5EFE4",
  primary: "#FF6000",
  accent: "#FF6000",
  softOrange: "#FFF3EA",
  warnBg: "#FDF6EF",
  warnLine: "#F6DFC9",
  warnText: "#C2500A",
} as const;

/** Cor de avatar derivada do nome (bg suave + texto forte). */
export function whoAvatar(who: string): { avBg: string; avColor: string } {
  const palette = [
    "#5B5BF5", "#3B82F6", "#8B5CF6", "#F97316", "#10B981",
    "#EC4899", "#CA9A00", "#64748B", "#0EA5E9", "#14B8A6",
  ];
  if (!who || !who.trim()) return { avBg: "#F5EFE4", avColor: "#B4ADA1" };
  const c = palette[who.charCodeAt(0) % palette.length];
  return { avBg: c + "22", avColor: c };
}

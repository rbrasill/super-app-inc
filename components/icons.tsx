import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BoardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.9" {...base} {...props}>
      <rect x="3" y="3" width="7" height="18" rx="1.5" />
      <rect x="14" y="3" width="7" height="11" rx="1.5" />
    </svg>
  );
}

export function DashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.9" {...base} {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function SponsorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.9" {...base} {...props}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
    </svg>
  );
}

export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.9" {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M18 20a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  );
}

export function BlocksIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.9" {...base} {...props}>
      <path d="M12 2.5 21 7l-9 4.5L3 7z" />
      <path d="M3 12l9 4.5L21 12" />
      <path d="M3 17l9 4.5L21 17" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" strokeWidth="2" fill="none" strokeLinecap="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

export function ExportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" strokeWidth="2" {...base} {...props}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" strokeWidth="2.4" {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" strokeWidth="2" fill="none" strokeLinecap="round" {...props}>
      <rect x="3" y="4.5" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

export function WarnIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" strokeWidth="2.2" {...base} {...props}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

/** Cabeça de boi em traço fino (3/4) — marca-d'água sutil ("o boi é o app"). */
export function OxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" width="200" height="200" strokeWidth="4" {...base} {...props}>
      {/* topete no alto da cabeça */}
      <path d="M92 40 C 96 30, 106 30, 108 40 C 112 32, 120 34, 118 44" />
      {/* varredura superior (dorso sumindo à direita) */}
      <path d="M112 42 C 142 32, 168 44, 182 66" />
      {/* orelha esquerda */}
      <path d="M84 62 C 60 52, 44 64, 48 84 C 51 100, 70 102, 82 92" />
      {/* orelha direita (atrás) */}
      <path d="M126 52 C 148 50, 164 62, 158 82 C 154 94, 140 94, 134 84" />
      {/* frente do rosto: testa -> cana longa do nariz */}
      <path d="M100 42 C 82 60, 74 86, 68 112 C 64 130, 60 144, 58 154" />
      {/* focinho alongado */}
      <path d="M58 154 C 56 168, 66 178, 84 178 C 102 178, 118 170, 122 158" />
      {/* narina */}
      <path d="M74 160 C 68 159, 66 165, 72 167 C 77 168, 79 162, 75 160" />
      {/* lábio de volta à bochecha */}
      <path d="M122 158 C 126 152, 126 144, 121 138" />
      {/* bochecha / mandíbula direita */}
      <path d="M150 84 C 156 116, 150 146, 130 162" />
      {/* olho */}
      <path d="M92 100 C 100 92, 118 92, 126 102 C 118 112, 100 112, 92 100" />
      {/* cílio */}
      <path d="M95 106 C 92 110, 91 114, 94 117" />
      {/* pescoço sumindo */}
      <path d="M122 158 C 140 172, 164 178, 190 174" />
    </svg>
  );
}

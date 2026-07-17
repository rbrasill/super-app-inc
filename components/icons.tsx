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

/** Cabeça de boi em traço fino — usado como marca-d'água sutil ("o boi é o app"). */
export function OxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" strokeWidth="2.4" {...base} {...props}>
      {/* chifres */}
      <path d="M21 21c-7-3-12-11-8-15 2 5 6 8 12 10" />
      <path d="M43 21c7-3 12-11 8-15-2 5-6 8-12 10" />
      {/* orelhas */}
      <path d="M20 24c-6-1-9 2-8 7" />
      <path d="M44 24c6-1 9 2 8 7" />
      {/* cabeça */}
      <path d="M21 21c-4 4-5 12 0 19 3 4 6 6 11 6s8-2 11-6c5-7 4-15 0-19" />
      {/* focinho + narinas */}
      <path d="M25 42c0 5 14 5 14 0" />
      <path d="M29 45h.02M35 45h.02" />
      {/* olhos */}
      <path d="M26 31h.02M38 31h.02" />
    </svg>
  );
}

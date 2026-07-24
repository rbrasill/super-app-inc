"use client";

import type { ComponentType, SVGProps } from "react";
import { BlocksIcon, BoardIcon, DashIcon, PeopleIcon, SponsorIcon } from "./icons";
import type { View } from "@/lib/types";

interface NavDef {
  view: View;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const PROJECT_NAV: NavDef[] = [
  { view: "board", label: "Quadro de execução", Icon: BoardIcon },
  { view: "blocks", label: "Blocos (bifes)", Icon: BlocksIcon },
  { view: "dash", label: "Dashboard geral", Icon: DashIcon },
  { view: "sponsor", label: "Visão do patrocinador", Icon: SponsorIcon },
];

const SUPPORT_NAV: NavDef[] = [{ view: "people", label: "Pessoas & papéis", Icon: PeopleIcon }];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavDef;
  active: boolean;
  onClick: () => void;
}) {
  const { Icon, label } = item;
  return (
    <a
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-[11px] rounded-cardSm cursor-pointer text-[13.5px] transition-colors ${
        active
          ? "bg-inkDark text-primary font-extrabold"
          : "bg-transparent text-inkMid font-semibold hover:bg-[#FAF6EF]"
      }`}
    >
      <span
        className={`absolute left-0 top-[9px] bottom-[9px] w-[3px] rounded-[3px] ${active ? "bg-primary" : "bg-transparent"}`}
      />
      <span className={`w-[18px] h-[18px] flex ${active ? "text-primary" : "text-inkMute"}`}>
        <Icon />
      </span>
      <span className="flex-1">{label}</span>
    </a>
  );
}

export default function Sidebar({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <aside className="w-[250px] flex-shrink-0 bg-panel border-r border-line flex flex-col px-4 py-[22px]">
      {/* Logo INC Empreendimentos */}
      <div className="px-2 pt-1 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/inc-logo.svg" alt="INC Empreendimentos" className="h-[42px] w-auto" />
        <div className="text-[11px] text-inkFaint font-medium mt-[10px]">Meu INC App · Painel do projeto</div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-col gap-[3px]">
        <div className="text-[10px] font-extrabold tracking-[1px] uppercase text-inkMute px-3 pt-[10px] pb-2">
          Projeto
        </div>
        {PROJECT_NAV.map((item) => (
          <NavLink key={item.view} item={item} active={view === item.view} onClick={() => setView(item.view)} />
        ))}

        <div className="text-[10px] font-extrabold tracking-[1px] uppercase text-inkMute px-3 pt-[18px] pb-2">
          Apoio
        </div>
        {SUPPORT_NAV.map((item) => (
          <NavLink key={item.view} item={item} active={view === item.view} onClick={() => setView(item.view)} />
        ))}
      </nav>

      {/* Usuário */}
      <div className="mt-auto pt-4 border-t border-line">
        <div className="flex items-center gap-[11px] p-2">
          <div className="w-9 h-9 rounded-[11px] bg-primary text-white font-extrabold text-[14px] flex items-center justify-center flex-shrink-0">
            G
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold leading-[1.15] text-inkDark">Gustavo</div>
            <div className="text-[10.5px] text-inkFaint font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              Product Owner
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

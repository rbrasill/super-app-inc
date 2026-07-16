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
      className={`flex items-center gap-3 px-3 py-[10px] rounded-cardSm cursor-pointer text-[13.5px] transition-colors hover:bg-sidebarHover ${
        active
          ? "bg-sidebarActiveBg text-white font-bold"
          : "bg-transparent text-sidebarText font-semibold"
      }`}
    >
      <span
        className={`w-[18px] h-[18px] flex ${
          active ? "text-sidebarActiveIcon" : "text-sidebarFaint"
        }`}
      >
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
    <aside className="w-[250px] flex-shrink-0 bg-sidebar border-r border-sidebarLine flex flex-col px-4 py-5">
      {/* Logo */}
      <div className="flex items-center gap-[11px] px-2 pt-[6px] pb-5">
        <div className="w-[38px] h-[38px] rounded-[11px] bg-primary flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 rounded-[5px] bg-accent rotate-45" />
        </div>
        <div>
          <div className="font-head text-[14.5px] font-extrabold leading-[1.1] text-white whitespace-nowrap">
            Meu INC App
          </div>
          <div className="text-[11px] text-sidebarFaint font-semibold mt-[2px]">Painel do projeto</div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-col gap-[3px] mt-[2px]">
        <div className="text-[10px] font-extrabold tracking-[0.9px] uppercase text-sidebarFaint px-3 pt-[14px] pb-[7px]">
          Projeto
        </div>
        {PROJECT_NAV.map((item) => (
          <NavLink key={item.view} item={item} active={view === item.view} onClick={() => setView(item.view)} />
        ))}

        <div className="text-[10px] font-extrabold tracking-[0.9px] uppercase text-sidebarFaint px-3 pt-4 pb-[7px]">
          Apoio
        </div>
        {SUPPORT_NAV.map((item) => (
          <NavLink key={item.view} item={item} active={view === item.view} onClick={() => setView(item.view)} />
        ))}
      </nav>

      {/* Usuário */}
      <div className="mt-auto pt-[14px] border-t border-sidebarLine">
        <div className="flex items-center gap-[11px] p-2">
          <div className="w-[34px] h-[34px] rounded-[11px] bg-primary text-white font-extrabold text-[13px] flex items-center justify-center flex-shrink-0">
            G
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold leading-[1.15] text-white">Gustavo</div>
            <div className="text-[10.5px] text-sidebarFaint font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              Product Owner · dono do quadro
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import BlockModal from "@/components/BlockModal";
import BlocosView from "@/components/BlocosView";
import BoardView, { BoardControls } from "@/components/board/BoardView";
import Dashboard from "@/components/Dashboard";
import PeopleGrid from "@/components/PeopleGrid";
import PersonModal from "@/components/PersonModal";
import Sidebar from "@/components/Sidebar";
import SponsorView from "@/components/SponsorView";
import TaskModal from "@/components/TaskModal";
import Topbar from "@/components/Topbar";
import { StoreProvider, useStore } from "@/lib/store";
import type { Sub, View } from "@/lib/types";

const TITLES: Record<View, [string, string]> = {
  board: ["Quadro de execução", "Acompanhe as entregas do projeto"],
  blocks: ["Blocos (bifes)", "O app fatiado em blocos temáticos com prazo próprio"],
  dash: ["Dashboard geral", "Visão consolidada do projeto para o time"],
  sponsor: ["Visão do patrocinador", "Resumo executivo · sem detalhe operacional"],
  people: ["Pessoas & papéis", "Quem faz o quê no projeto"],
};

function Loader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-inkFaint">
      <div className="w-8 h-8 rounded-full border-[3px] border-line border-t-primary animate-spin" />
      <div className="text-[12.5px] font-semibold">Carregando dados…</div>
    </div>
  );
}

function AppShell() {
  const { loading } = useStore();
  const [view, setView] = useState<View>("board");
  const [sub, setSub] = useState<Sub>("kanban");

  const [title, subtitle] = TITLES[view];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-ink">
      <Sidebar view={view} setView={setView} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} sub={subtitle} view={view} />

        {view === "board" && !loading && <BoardControls sub={sub} setSub={setSub} />}

        {loading ? (
          <Loader />
        ) : (
          <div key={view} className="sc-scroll view-anim flex-1 overflow-auto px-[34px] pt-[6px] pb-10">
            {view === "board" && <BoardView sub={sub} />}
            {view === "blocks" && <BlocosView />}
            {view === "dash" && <Dashboard />}
            {view === "sponsor" && <SponsorView />}
            {view === "people" && <PeopleGrid />}
          </div>
        )}
      </div>

      <TaskModal />
      <BlockModal />
      <PersonModal />
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}

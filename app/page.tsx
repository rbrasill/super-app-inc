"use client";

import { useState } from "react";
import BoardView, { BoardControls } from "@/components/board/BoardView";
import Dashboard from "@/components/Dashboard";
import PeopleGrid from "@/components/PeopleGrid";
import Sidebar from "@/components/Sidebar";
import SponsorView from "@/components/SponsorView";
import TaskModal from "@/components/TaskModal";
import Topbar from "@/components/Topbar";
import { StoreProvider } from "@/lib/store";
import type { Sub, View } from "@/lib/types";

const TITLES: Record<View, [string, string]> = {
  board: ["Quadro de execução", "Acompanhe as entregas do projeto"],
  dash: ["Dashboard geral", "Visão consolidada do projeto para o time"],
  sponsor: ["Visão do patrocinador", "Resumo executivo · sem detalhe operacional"],
  people: ["Pessoas & papéis", "Quem faz o quê no projeto"],
};

export default function Home() {
  const [view, setView] = useState<View>("board");
  const [sub, setSub] = useState<Sub>("kanban");

  const [title, subtitle] = TITLES[view];

  return (
    <StoreProvider>
      <div className="flex h-screen w-full overflow-hidden bg-bg text-ink">
        <Sidebar view={view} setView={setView} />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title={title} sub={subtitle} />

          {view === "board" && <BoardControls sub={sub} setSub={setSub} />}

          <div className="sc-scroll flex-1 overflow-auto px-[30px] pt-[6px] pb-10">
            {view === "board" && <BoardView sub={sub} />}
            {view === "dash" && <Dashboard />}
            {view === "sponsor" && <SponsorView />}
            {view === "people" && <PeopleGrid />}
          </div>
        </div>

        <TaskModal />
      </div>
    </StoreProvider>
  );
}

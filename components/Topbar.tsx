"use client";

import { exportTasksCsv } from "@/lib/exportCsv";
import { useStore } from "@/lib/store";
import type { View } from "@/lib/types";
import { ExportIcon, PlusIcon, SearchIcon } from "./icons";

export default function Topbar({ title, sub, view }: { title: string; sub: string; view: View }) {
  const { search, setSearch, tasks, filteredTasks, blocks, hasActiveFilters, openNew, openNewBlock, openNewPerson } =
    useStore();

  const handleExport = () => {
    exportTasksCsv(hasActiveFilters ? filteredTasks : tasks, blocks);
  };

  const isBoard = view === "board";
  const isBlocks = view === "blocks";
  const isPeople = view === "people";

  return (
    <div className="px-[34px] pt-6 pb-5 flex items-center gap-[18px] flex-wrap border-b border-line bg-bg">
      <div className="min-w-0">
        <div className="font-head text-[25px] font-extrabold tracking-[-0.03em] leading-[1.1] text-inkDark">
          {title}
        </div>
        <div className="text-[12.5px] text-inkSoft font-medium mt-[3px]">{sub}</div>
      </div>
      <div className="flex-1" />

      {isBoard && (
        <>
          {/* Busca */}
          <div className="flex items-center gap-2 bg-panel border border-line rounded-[12px] px-[13px] py-[9px] w-[230px] focus-within:border-primary transition-colors">
            <SearchIcon style={{ stroke: "#B4ADA1" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarefa…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-ink font-medium placeholder:text-inkMute placeholder:font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-inkMute hover:text-ink text-[15px] leading-none font-bold"
                aria-label="Limpar busca"
              >
                ×
              </button>
            )}
          </div>

          {/* Exportar */}
          <button
            onClick={handleExport}
            className="px-3 py-[10px] rounded-[12px] text-[13px] font-bold cursor-pointer border border-line bg-panel text-inkSoft inline-flex items-center gap-[7px] transition-colors hover:bg-chip hover:text-ink"
          >
            <ExportIcon />
            Exportar
          </button>

          {/* Nova tarefa */}
          <button
            onClick={openNew}
            className="px-[17px] py-[11px] rounded-[12px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-[1.06]"
          >
            <PlusIcon />
            Nova tarefa
          </button>
        </>
      )}

      {isBlocks && (
        <button
          onClick={openNewBlock}
          className="px-[17px] py-[11px] rounded-[12px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-[1.06]"
        >
          <PlusIcon />
          Adicionar bloco
        </button>
      )}

      {isPeople && (
        <button
          onClick={openNewPerson}
          className="px-[17px] py-[11px] rounded-[12px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-[1.06]"
        >
          <PlusIcon />
          Adicionar pessoa
        </button>
      )}
    </div>
  );
}

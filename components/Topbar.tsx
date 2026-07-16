"use client";

import { exportTasksCsv } from "@/lib/exportCsv";
import { useStore } from "@/lib/store";
import { ExportIcon, PlusIcon, SearchIcon } from "./icons";

export default function Topbar({ title, sub }: { title: string; sub: string }) {
  const { search, setSearch, tasks, filteredTasks, blocks, hasActiveFilters, openNew } = useStore();

  const handleExport = () => {
    exportTasksCsv(hasActiveFilters ? filteredTasks : tasks, blocks);
  };

  return (
    <div className="px-[30px] pt-[22px] flex items-center gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="font-head text-[23px] font-extrabold tracking-[-0.03em] leading-[1.1]">{title}</div>
        <div className="text-[12.5px] text-inkSoft font-medium mt-1">{sub}</div>
      </div>
      <div className="flex-1" />

      {/* Busca */}
      <div className="flex items-center gap-2 bg-panel border border-line rounded-cardSm px-[13px] py-2 shadow-soft min-w-[220px] focus-within:border-primary transition-colors">
        <SearchIcon style={{ stroke: "#96A0A9" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tarefa…"
          className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-ink font-medium placeholder:text-inkFaint placeholder:font-medium"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-inkFaint hover:text-ink text-[15px] leading-none font-bold"
            aria-label="Limpar busca"
          >
            ×
          </button>
        )}
      </div>

      {/* Exportar */}
      <button
        onClick={handleExport}
        className="px-3 py-[9px] rounded-cardSm text-[13px] font-bold cursor-pointer border border-transparent bg-transparent text-inkSoft inline-flex items-center gap-[7px] transition-colors hover:bg-chip hover:text-ink"
      >
        <ExportIcon />
        Exportar
      </button>

      {/* Nova tarefa */}
      <button
        onClick={openNew}
        className="px-4 py-[10px] rounded-cardSm text-[13px] font-bold cursor-pointer border border-primary bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-105"
      >
        <PlusIcon />
        Nova tarefa
      </button>
    </div>
  );
}

"use client";

import { STATUSES } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { AreaId, StatusId, Sub } from "@/lib/types";
import GroupedBoard from "./GroupedBoard";
import KanbanBoard from "./KanbanBoard";

const selectCls =
  "bg-transparent border-none outline-none text-[12.5px] font-bold text-inkMid cursor-pointer appearance-none pr-1 max-w-[160px]";

export function BoardControls({ sub, setSub }: { sub: Sub; setSub: (s: Sub) => void }) {
  const {
    areaFilter,
    setAreaFilter,
    blockFilter,
    setBlockFilter,
    whoFilter,
    setWhoFilter,
    statusFilter,
    setStatusFilter,
    blocks,
    people,
    areas,
    tasks,
    filteredTasks,
    hasActiveFilters,
    clearFilters,
  } = useStore();

  // Responsáveis para o filtro: pessoas cadastradas (menos "A definir") + quem
  // já está atribuído em alguma tarefa (ex.: "Jurídico"), sem repetir.
  const whoOptions = Array.from(
    new Set([
      ...people.map((p) => p.name).filter((n) => n.trim() && n !== "A definir"),
      ...tasks.map((t) => t.who).filter((w) => w.trim()),
    ])
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const segBtn = (active: boolean) =>
    `border-none px-4 py-[7px] rounded-[9px] text-[12.5px] font-extrabold cursor-pointer transition-colors ${
      active ? "bg-primary text-white" : "bg-transparent text-inkSoft"
    }`;

  return (
    <div className="px-[34px] pt-[18px] pb-[14px] flex items-center gap-3 flex-wrap">
      {/* Toggle Kanban / Por área */}
      <div className="flex bg-panel border border-line rounded-[12px] p-[3px]">
        <button className={segBtn(sub === "kanban")} onClick={() => setSub("kanban")}>
          Kanban
        </button>
        <button className={segBtn(sub === "grouped")} onClick={() => setSub("grouped")}>
          Por área
        </button>
      </div>

      {/* Filtro de Área */}
      <div className="flex items-center gap-2 bg-panel border border-line rounded-[12px] px-3 py-[7px]">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.6px] text-inkMute">Área</span>
        <select
          className={selectCls}
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value as AreaId | "all")}
        >
          <option value="all">Todas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de Bloco */}
      <div className="flex items-center gap-2 bg-panel border border-line rounded-[12px] px-3 py-[7px]">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.6px] text-inkMute">Bloco</span>
        <select className={selectCls} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
          <option value="all">Todos</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de Responsável */}
      <div className="flex items-center gap-2 bg-panel border border-line rounded-[12px] px-3 py-[7px]">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.6px] text-inkMute">Resp.</span>
        <select className={selectCls} value={whoFilter} onChange={(e) => setWhoFilter(e.target.value)}>
          <option value="all">Todos</option>
          {whoOptions.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de Status */}
      <div className="flex items-center gap-2 bg-panel border border-line rounded-[12px] px-3 py-[7px]">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.6px] text-inkMute">Status</span>
        <select
          className={selectCls}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusId | "all")}
        >
          <option value="all">Todos</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-[12px] font-bold text-primary hover:underline cursor-pointer"
        >
          Limpar filtros
        </button>
      )}

      <div className="flex-1" />
      <span className="text-[11.5px] text-inkMute font-semibold">
        {filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"}
        {hasActiveFilters ? " filtradas" : ""}
      </span>
    </div>
  );
}

export default function BoardView({ sub }: { sub: Sub }) {
  return <div>{sub === "kanban" ? <KanbanBoard /> : <GroupedBoard />}</div>;
}

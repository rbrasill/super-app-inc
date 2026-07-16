"use client";

import { AREAS } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { AreaId, Sub } from "@/lib/types";
import GroupedBoard from "./GroupedBoard";
import KanbanBoard from "./KanbanBoard";

const selectCls =
  "bg-transparent border-none outline-none text-[12.5px] font-bold text-ink cursor-pointer appearance-none pr-1";

export function BoardControls({ sub, setSub }: { sub: Sub; setSub: (s: Sub) => void }) {
  const { areaFilter, setAreaFilter, blockFilter, setBlockFilter, blocks, filteredTasks, hasActiveFilters, clearFilters } =
    useStore();

  const segBtn = (active: boolean) =>
    `border-none px-[15px] py-[7px] rounded-lg text-[12.5px] font-bold cursor-pointer transition-colors ${
      active ? "bg-ink text-white" : "bg-transparent text-inkSoft"
    }`;

  return (
    <div className="px-[30px] pt-4 pb-[14px] flex items-center gap-3 flex-wrap">
      {/* Toggle Kanban / Por área */}
      <div className="flex bg-panel border border-line rounded-cardSm p-[3px] shadow-soft">
        <button className={segBtn(sub === "kanban")} onClick={() => setSub("kanban")}>
          Kanban
        </button>
        <button className={segBtn(sub === "grouped")} onClick={() => setSub("grouped")}>
          Por área
        </button>
      </div>

      {/* Filtro de Área */}
      <div className="flex items-center gap-2 bg-panel border border-line rounded-cardSm px-3 py-[7px] shadow-soft">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.6px] text-inkFaint">Área</span>
        <select
          className={selectCls}
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value as AreaId | "all")}
        >
          <option value="all">Todas ▾</option>
          {AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de Bloco */}
      <div className="flex items-center gap-2 bg-panel border border-line rounded-cardSm px-3 py-[7px] shadow-soft">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.6px] text-inkFaint">Bloco</span>
        <select className={selectCls} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
          <option value="all">Todos ▾</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-[11.5px] font-bold text-primary hover:underline cursor-pointer"
        >
          Limpar filtros ({filteredTasks.length})
        </button>
      )}

      <div className="flex-1" />
      <span className="text-[11.5px] text-inkFaint font-semibold">Arraste os cartões entre as etapas</span>
    </div>
  );
}

export default function BoardView({ sub }: { sub: Sub }) {
  return <div>{sub === "kanban" ? <KanbanBoard /> : <GroupedBoard />}</div>;
}

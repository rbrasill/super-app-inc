"use client";

import { getGrouped } from "@/lib/derive";
import { useStore } from "@/lib/store";

export default function GroupedBoard() {
  const { filteredTasks, blocks, areas, openTask } = useStore();
  const grouped = getGrouped(filteredTasks, blocks, areas);
  return (
    <div className="flex flex-col gap-4 pt-2">
      {grouped.map((g) => (
        <div key={g.id} className="bg-panel border border-line rounded-2xl overflow-hidden">
          {/* Cabeçalho da área */}
          <div
            className="px-[18px] py-[14px] flex items-center gap-[10px] border-b border-line2"
            style={{ background: g.color + "10" }}
          >
            <span className="w-[10px] h-[10px] rounded-[3px]" style={{ background: g.color }} />
            <span className="font-head text-[14px] font-extrabold" style={{ color: g.color }}>
              {g.name}
            </span>
            <span
              className="text-[11px] font-extrabold px-[9px] py-[2px] rounded-[20px] bg-panel border border-line"
              style={{ color: g.color }}
            >
              {g.count}
            </span>
          </div>

          {/* Linhas */}
          {g.rows.map((r) => (
            <div
              key={r.id}
              onClick={() => openTask(r.id)}
              className="flex items-center gap-3 px-[18px] py-3 border-b border-line3 cursor-pointer transition-colors hover:bg-chip"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.statusColor }} />
              <span className="flex-1 text-[12.5px] font-medium text-ink min-w-0 truncate">{r.desc}</span>
              <span className="text-[10px] font-bold text-inkFaint w-[130px] flex-shrink-0 truncate">{r.blockName}</span>
              <span
                className="text-[10.5px] font-extrabold w-[120px] flex-shrink-0"
                style={{ color: r.statusColor }}
              >
                {r.statusName}
              </span>
              <span
                className="text-[9.5px] font-extrabold uppercase tracking-[0.3px] px-2 py-[3px] rounded-[20px] flex-shrink-0"
                style={{ background: r.prioBg, color: r.prioText }}
              >
                {r.prioLabel}
              </span>
              <span
                className="w-[23px] h-[23px] rounded-lg text-[10px] font-extrabold flex items-center justify-center flex-shrink-0"
                style={{ background: r.avBg, color: r.avColor }}
                title={r.whoLabel}
              >
                {r.initials || "—"}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

"use client";

import { getGrouped } from "@/lib/derive";
import { useStore } from "@/lib/store";

const thClass =
  "bg-chip text-left px-[14px] py-[9px] text-[10px] uppercase tracking-[0.5px] text-inkFaint font-extrabold";

export default function GroupedBoard() {
  const { filteredTasks, openTask } = useStore();
  const grouped = getGrouped(filteredTasks);
  return (
    <div className="flex flex-col gap-4 pt-2">
      {grouped.map((g) => (
        <div key={g.id} className="bg-panel border border-line rounded-[15px] shadow-soft overflow-hidden">
          {/* Cabeçalho da área */}
          <div
            className="px-[18px] py-[13px] flex items-center gap-[10px] border-b border-line2"
            style={{ borderLeft: `4px solid ${g.color}` }}
          >
            <span className="w-[11px] h-[11px] rounded-[3px]" style={{ background: g.color }} />
            <span className="font-extrabold text-[13.5px]">{g.name}</span>
            <span className="ml-auto text-[11px] text-inkFaint font-bold">{g.count} tarefa(s)</span>
          </div>

          {/* Tabela */}
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={`${thClass} pl-[18px]`}>Descrição</th>
                <th className={thClass}>Fase</th>
                <th className={thClass}>Resp.</th>
                <th className={thClass}>Prazo</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openTask(r.id)}
                  className="cursor-pointer transition-colors hover:bg-chip"
                >
                  <td className="px-[18px] py-[11px] border-b border-line2 font-semibold">{r.desc}</td>
                  <td className="px-[14px] py-[11px] border-b border-line2 font-semibold text-inkSoft whitespace-nowrap">
                    {r.phaseShort}
                  </td>
                  <td className="px-[14px] py-[11px] border-b border-line2 font-semibold">{r.whoLabel}</td>
                  <td className="px-[14px] py-[11px] border-b border-line2 font-semibold text-inkSoft whitespace-nowrap">
                    {r.dateLabel}
                  </td>
                  <td className="px-[14px] py-[11px] border-b border-line2">
                    <span
                      className="text-[10px] font-extrabold uppercase px-[10px] py-[3px] rounded-[20px] whitespace-nowrap"
                      style={{ background: r.statusSoft, color: r.statusColor }}
                    >
                      {r.statusName}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

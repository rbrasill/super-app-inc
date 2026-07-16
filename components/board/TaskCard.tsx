"use client";

import { useStore } from "@/lib/store";
import { CalendarIcon, WarnIcon } from "../icons";
import type { DecoratedTask } from "@/lib/types";

export default function TaskCard({ task }: { task: DecoratedTask }) {
  const { openTask } = useStore();
  return (
    <div
      onClick={() => openTask(task.id)}
      className="bg-panel border border-line2 rounded-[13px] px-[14px] py-[13px] cursor-grab shadow-card transition-[box-shadow,transform] hover:-translate-y-[3px] hover:shadow-cardHover"
      style={{ borderLeft: `4px solid ${task.color}` }}
    >
      {/* Descrição + prioridade */}
      <div className="flex items-start gap-2 mb-[11px]">
        <div className="font-semibold text-[13px] leading-[1.42] flex-1 text-ink">{task.desc}</div>
        <span
          className="text-[9.5px] font-extrabold uppercase tracking-[0.4px] px-2 py-[3px] rounded-[20px] whitespace-nowrap flex-shrink-0"
          style={{ background: task.prioBg, color: task.prioText }}
        >
          {task.prioLabel}
        </span>
      </div>

      {/* Área + responsável */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.3px]" style={{ color: task.color }}>
          {task.areaName}
        </span>
        {task.initials && (
          <span className="ml-auto w-[23px] h-[23px] rounded-lg bg-chip text-inkSoft text-[10px] font-extrabold flex items-center justify-center">
            {task.initials}
          </span>
        )}
      </div>

      {/* Prazo */}
      <div className="flex items-center gap-[5px] mt-[9px] text-[10.5px] text-inkSoft font-semibold">
        <CalendarIcon style={{ stroke: "#96A0A9" }} />
        {task.dateLabel}
      </div>

      {/* Dependência / trava */}
      {task.hasDep && (
        <div className="mt-[9px] text-[10px] font-bold text-warnText bg-warnBg border border-warnLine rounded-lg px-2 py-1 flex items-center gap-[5px]">
          <WarnIcon className="flex-shrink-0" style={{ stroke: "#C2500A" }} />
          {task.depText}
        </div>
      )}
    </div>
  );
}

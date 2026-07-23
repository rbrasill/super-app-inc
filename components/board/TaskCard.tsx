"use client";

import { useStore } from "@/lib/store";
import { CalendarIcon, WarnIcon } from "../icons";
import type { DecoratedTask } from "@/lib/types";

export default function TaskCard({ task }: { task: DecoratedTask }) {
  const { openTask } = useStore();
  return (
    <div
      onClick={() => openTask(task.id)}
      className="bg-panel border border-line2 rounded-[13px] px-[14px] py-[13px] cursor-grab shadow-card transition-[box-shadow,transform] hover:-translate-y-[2px] hover:shadow-cardHover"
      style={{ borderLeft: `4px solid ${task.color}` }}
    >
      {/* Descrição */}
      <div className="font-medium text-[13px] leading-[1.45] text-ink mb-[11px]">{task.desc}</div>

      {/* Dependência / trava */}
      {task.hasDep && (
        <div className="mb-[9px] text-[10.5px] font-semibold text-warnText bg-warnBg border border-warnLine rounded-lg px-2 py-[5px] flex items-center gap-[6px]">
          <WarnIcon className="flex-shrink-0" style={{ stroke: "#FD8E1F" }} />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{task.depText}</span>
        </div>
      )}

      {/* Área · responsável */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.3px]" style={{ color: task.color }}>
          {task.areaName}
        </span>
        <span
          className="ml-auto w-[23px] h-[23px] rounded-lg text-[10px] font-extrabold flex items-center justify-center flex-shrink-0"
          style={{ background: task.avBg, color: task.avColor }}
          title={task.whoLabel}
        >
          {task.initials || "—"}
        </span>
      </div>

      {/* Prazo */}
      <div className="flex items-center gap-[5px] mt-[9px] text-[10.5px] text-inkFaint font-medium">
        <CalendarIcon style={{ stroke: "#A1A5B3" }} />
        {task.dateLabel}
      </div>
    </div>
  );
}

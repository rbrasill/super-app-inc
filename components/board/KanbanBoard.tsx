"use client";

import { useState } from "react";
import { getBoard } from "@/lib/derive";
import { useStore } from "@/lib/store";
import type { StatusId } from "@/lib/types";
import TaskCard from "./TaskCard";

export default function KanbanBoard() {
  const { filteredTasks, blocks, areas, moveTask } = useStore();
  const board = getBoard(filteredTasks, blocks, areas);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<StatusId | null>(null);

  const onDrop = (status: StatusId) => {
    if (dragId) moveTask(dragId, status);
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className="flex gap-4 items-start pt-2">
      {board.map((col) => {
        const isOver = overCol === col.id;
        return (
          <div
            key={col.id}
            className="flex-[0_0_268px] flex flex-col"
            onDragOver={(e) => {
              e.preventDefault();
              if (overCol !== col.id) setOverCol(col.id);
            }}
            onDragLeave={(e) => {
              // só limpa se realmente saiu da coluna
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol((c) => (c === col.id ? null : c));
            }}
            onDrop={() => onDrop(col.id)}
          >
            {/* Cabeçalho da coluna */}
            <div className="rounded-[13px] px-[14px] py-3 mb-[10px]" style={{ background: col.soft }}>
              <div className="flex items-center gap-2">
                <span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: col.color }} />
                <span className="text-[13.5px] font-extrabold" style={{ color: col.color }}>
                  {col.name}
                </span>
                <span
                  className="ml-auto text-[11px] font-extrabold bg-panel px-[9px] py-px rounded-[20px]"
                  style={{ color: col.color }}
                >
                  {col.count}
                </span>
              </div>
              <div className="text-[10.5px] font-semibold mt-1 opacity-75" style={{ color: col.color }}>
                {col.sub}
              </div>
            </div>

            {/* Cartões */}
            <div
              className={`flex flex-col gap-[11px] rounded-[13px] transition-colors min-h-[60px] ${
                isOver ? "outline outline-2 outline-dashed outline-primary/50 outline-offset-4 bg-primary/[0.04]" : ""
              }`}
            >
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className={dragId === task.id ? "opacity-40" : ""}
                >
                  <TaskCard task={task} />
                </div>
              ))}
              {col.empty && (
                <div className="text-inkFaint text-[11px] text-center px-[6px] py-[14px] italic border-[1.5px] border-dashed border-line rounded-[11px]">
                  {isOver ? "Solte aqui" : "Vazio"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { AREAS, BLOCKS, PRIO, STATUSES } from "./data";
import type { Bloco, Task } from "./types";

const areaName = (id: string) => AREAS.find((a) => a.id === id)?.name ?? id;
const statusName = (id: string) => STATUSES.find((s) => s.id === id)?.name ?? id;

function escapeCell(value: string): string {
  const v = value ?? "";
  if (/[";\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** Gera um CSV (separador ; — compatível com Excel em pt-BR) e dispara o download. */
export function exportTasksCsv(
  tasks: Task[],
  blocks: Bloco[] = BLOCKS,
  filename = "meu-inc-app-tarefas.csv"
): void {
  const blockName = (id: string) => blocks.find((b) => b.id === id)?.name ?? "Sem bloco";
  const header = ["Descrição", "Área", "Bloco", "Responsável", "Prioridade", "Status", "Início", "Fim", "Dependência"];
  const rows = tasks.map((tk) => [
    tk.desc,
    areaName(tk.area),
    blockName(tk.blockId),
    tk.who || "—",
    PRIO[tk.prio]?.label ?? tk.prio,
    statusName(tk.status),
    tk.start,
    tk.end,
    tk.dep,
  ]);

  const csv = [header, ...rows].map((r) => r.map((c) => escapeCell(String(c))).join(";")).join("\r\n");
  // BOM para o Excel reconhecer a acentuação UTF-8
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

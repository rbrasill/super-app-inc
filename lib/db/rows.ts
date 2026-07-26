import type { Area, Bloco, Fase, Person, Task } from "../types";
import type { Row } from "./tables";

/**
 * Mapeadores banco <-> tipos do app. Puros, sem I/O — rodam nos dois lados.
 *
 * As colunas `date` chegam como string ISO (`"2026-07-16"`) porque a carga usa
 * `json_agg` no Postgres; datas não passam pelo parser do driver, então nunca
 * viram objeto `Date`.
 */

export interface TaskRow {
  id: string;
  description: string;
  area_id: string;
  block_id: string | null;
  who: string;
  priority_id: string;
  status_id: string;
  start_date: string | null;
  end_date: string | null;
  dependency: string;
}

export interface BlockRow {
  id: string;
  name: string;
  theme: string;
  start_date: string | null;
  end_date: string | null;
  color: string;
  phase_id: string | null;
  sort_order: number;
}

export interface PersonRow {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  area_id: string | null;
  sort_order: number;
}

export interface AreaRow {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface PhaseRow {
  id: string;
  name: string;
  short: string;
  sort_order: number;
}

export const taskFromRow = (r: TaskRow): Task => ({
  id: r.id,
  desc: r.description,
  area: r.area_id as Task["area"],
  blockId: r.block_id ?? "",
  who: r.who ?? "",
  prio: r.priority_id as Task["prio"],
  status: r.status_id as Task["status"],
  start: r.start_date ?? "",
  end: r.end_date ?? "",
  dep: r.dependency ?? "",
});

/** Task do app -> colunas do banco (sem o id, útil para insert/update). */
export const taskToRow = (t: Omit<Task, "id">): Row => ({
  description: t.desc,
  area_id: t.area,
  block_id: t.blockId || null,
  who: t.who ?? "",
  priority_id: t.prio,
  status_id: t.status,
  start_date: t.start || null,
  end_date: t.end || null,
  dependency: t.dep ?? "",
});

export const blockFromRow = (r: BlockRow): Bloco => ({
  id: r.id,
  name: r.name,
  theme: r.theme,
  start: r.start_date ?? "",
  end: r.end_date ?? "",
  color: r.color,
  phaseId: r.phase_id ?? "",
});

export const blockToRow = (b: Omit<Bloco, "id">, sortOrder?: number): Row => ({
  name: b.name,
  theme: b.theme,
  start_date: b.start || null,
  end_date: b.end || null,
  color: b.color,
  phase_id: b.phaseId || null,
  ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
});

export const personFromRow = (r: PersonRow): Person => ({
  id: r.id,
  name: r.name,
  role: r.role,
  resp: r.responsibility,
  area: r.area_id ?? "",
});

export const personToRow = (p: Omit<Person, "id">, sortOrder?: number): Row => ({
  name: p.name,
  role: p.role,
  responsibility: p.resp,
  area_id: p.area || null,
  ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
});

export const areaFromRow = (r: AreaRow): Area => ({
  id: r.id,
  name: r.name,
  color: r.color,
});

export const areaToRow = (a: Omit<Area, "id">, sortOrder?: number): Row => ({
  name: a.name,
  color: a.color,
  ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
});

export const phaseFromRow = (r: PhaseRow): Fase => ({
  id: r.id,
  name: r.name,
  short: r.short,
});

export const phaseToRow = (f: Omit<Fase, "id">, sortOrder?: number): Row => ({
  name: f.name,
  short: f.short,
  ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
});

/** Payload da carga inicial (GET /api/data). */
export interface Bootstrap {
  /** false = o servidor não tem as variáveis do banco; o app cai em modo demo. */
  configured: boolean;
  tasks: TaskRow[];
  blocks: BlockRow[];
  people: PersonRow[];
  areas: AreaRow[];
  phases: PhaseRow[];
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Bloco, Person, Task } from "./types";

/**
 * Cliente Supabase (browser). As chaves vêm de variáveis de ambiente públicas
 * (NEXT_PUBLIC_*). Se elas não estiverem configuradas, `supabase` é null e o
 * app cai no modo em memória (dados estáticos de lib/data.ts) — assim nada
 * quebra em ambientes sem as chaves (ex.: preview sem env).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export const isSupabaseEnabled = !!supabase;

// ---- Mapeadores banco <-> tipos do app ----

interface TaskRow {
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

interface BlockRowDb {
  id: string;
  name: string;
  theme: string;
  start_date: string | null;
  end_date: string | null;
  color: string;
  phase_id: string | null;
  sort_order: number;
}

interface PersonRowDb {
  id: string;
  name: string;
  role: string;
  responsibility: string;
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
export const taskToRow = (t: Omit<Task, "id">) => ({
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

export const blockFromRow = (r: BlockRowDb): Bloco => ({
  id: r.id,
  name: r.name,
  theme: r.theme,
  start: r.start_date ?? "",
  end: r.end_date ?? "",
  color: r.color,
  phaseId: r.phase_id ?? "",
});

export const blockToRow = (b: Omit<Bloco, "id">, sortOrder?: number) => ({
  name: b.name,
  theme: b.theme,
  start_date: b.start || null,
  end_date: b.end || null,
  color: b.color,
  phase_id: b.phaseId || null,
  ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
});

export const personFromRow = (r: PersonRowDb): Person => ({
  id: r.id,
  name: r.name,
  role: r.role,
  resp: r.responsibility,
});

export const personToRow = (p: Omit<Person, "id">, sortOrder?: number) => ({
  name: p.name,
  role: p.role,
  responsibility: p.resp,
  ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
});

/**
 * Contrato das tabelas expostas pela API interna (`/api/data`).
 *
 * Esta lista é a única fonte de identificadores SQL que a API aceita: nada que
 * venha do browser vira nome de tabela ou de coluna sem passar por aqui. Os
 * valores sempre vão parametrizados ($1, $2…), então o risco de injeção fica
 * restrito aos identificadores — e identificador só sai desta lista.
 *
 * - `columns` : colunas que podem ser lidas e gravadas.
 * - `filters` : colunas aceitas no `where` de update/delete.
 * - `orderBy` : ordenação usada na carga inicial.
 */
export const TABLES = {
  tasks: {
    columns: [
      "id",
      "description",
      "area_id",
      "block_id",
      "who",
      "priority_id",
      "status_id",
      "start_date",
      "end_date",
      "dependency",
    ],
    // block_id: ao excluir um bloco, as tarefas dele ficam sem bloco.
    // who:      ao renomear uma pessoa, as tarefas dela acompanham o nome.
    filters: ["id", "block_id", "who"],
    orderBy: "id",
  },
  blocks: {
    columns: ["id", "name", "theme", "start_date", "end_date", "color", "phase_id", "sort_order"],
    filters: ["id"],
    orderBy: "sort_order",
  },
  people: {
    columns: ["id", "name", "role", "responsibility", "area_id", "sort_order"],
    filters: ["id"],
    orderBy: "sort_order",
  },
  areas: {
    columns: ["id", "name", "color", "sort_order"],
    filters: ["id"],
    orderBy: "sort_order",
  },
  phases: {
    columns: ["id", "name", "short", "sort_order"],
    filters: ["id"],
    orderBy: "sort_order",
  },
} as const satisfies Record<string, { columns: readonly string[]; filters: readonly string[]; orderBy: string }>;

export type DbTable = keyof typeof TABLES;

export const DB_TABLES = Object.keys(TABLES) as DbTable[];

export const isDbTable = (v: unknown): v is DbTable =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(TABLES, v);

/** Valores que podem ir para o banco (o resto é rejeitado na validação). */
export type Primitive = string | number | boolean | null;

export type Row = Record<string, Primitive>;

export type DbOp =
  | { op: "insert"; table: DbTable; values: Row }
  | { op: "update"; table: DbTable; values: Row; where: { column: string; value: Primitive } }
  | { op: "delete"; table: DbTable; where: { column: string; value: Primitive } };

// ---- Helpers para montar operações (usados pelo store) ----

export const ins = (table: DbTable, values: Row): DbOp => ({ op: "insert", table, values });

export const upd = (table: DbTable, values: Row, column: string, value: Primitive): DbOp => ({
  op: "update",
  table,
  values,
  where: { column, value },
});

export const del = (table: DbTable, column: string, value: Primitive): DbOp => ({
  op: "delete",
  table,
  where: { column, value },
});

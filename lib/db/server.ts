import "server-only";
import { Pool, type PoolConfig } from "pg";
import { TABLES, isDbTable, type DbOp, type DbTable, type Primitive, type Row } from "./tables";
import type { Bootstrap } from "./rows";

/**
 * Acesso ao PostgreSQL — SÓ no servidor. As credenciais ficam em variáveis de
 * ambiente sem o prefixo `NEXT_PUBLIC_`, então nunca vão para o bundle do
 * browser; o front conversa com o banco apenas pela rota `/api/data`.
 *
 * Configuração (variáveis de ambiente):
 *   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD   (forma preferida)
 *   DATABASE_URL                                     (alternativa)
 *   PGSSLMODE   require (padrão) | disable | verify-ca | verify-full
 *   PGSCHEMA    schema das tabelas (padrão: meu_inc_app)
 *
 * Sem PGHOST e sem DATABASE_URL, `isDbConfigured()` é false e o app cai no
 * modo demo (dados estáticos de lib/data.ts).
 */

const DEFAULT_SCHEMA = "meu_inc_app";
const CONNECT_TIMEOUT_MS = 10_000;
const STATEMENT_TIMEOUT_MS = 15_000;

/** Identificador SQL seguro: só nome simples, sempre entre aspas duplas. */
const q = (ident: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) throw new Error(`identificador inválido: ${ident}`);
  return `"${ident}"`;
};

/**
 * TLS a partir de PGSSLMODE, seguindo a semântica do libpq/pgAdmin.
 *
 * Cuidado que custou depuração: o `pg-connection-string` trata
 * `?sslmode=require` numa URL como **verify-full**, ou seja, valida a cadeia
 * do certificado — e num Postgres self-hosted com certificado autoassinado
 * isso quebra a conexão com "self-signed certificate", parecendo credencial
 * errada. Por isso o `sslmode` da URL é removido (ver `stripSslParams`) e o
 * modo é decidido só aqui: `require` cifra a conexão sem validar o
 * certificado, que é o comportamento do libpq.
 */
function sslFrom(mode: string | undefined): PoolConfig["ssl"] {
  const m = (mode || "require").trim().toLowerCase();
  if (m === "disable" || m === "off" || m === "false") return false;
  if (m === "verify-ca" || m === "verify-full") return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

/** Tira sslmode/ssl da connection string — quem manda é PGSSLMODE. */
function stripSslParams(raw: string): string {
  try {
    const u = new URL(raw);
    for (const p of ["sslmode", "ssl", "uselibpqcompat"]) u.searchParams.delete(p);
    return u.toString();
  } catch {
    return raw;
  }
}

interface DbEnv {
  conn: PoolConfig;
  schema: string;
}

function readEnv(): DbEnv | null {
  const host = process.env.PGHOST?.trim();
  const url = process.env.DATABASE_URL?.trim();
  if (!host && !url) return null;

  const schema = process.env.PGSCHEMA?.trim() || DEFAULT_SCHEMA;
  q(schema); // valida cedo: schema entra no SQL como identificador

  const shared: PoolConfig = {
    ssl: sslFrom(process.env.PGSSLMODE),
    application_name: "meu-inc-app",
    // Serverless: poucas conexões por instância, liberadas rápido quando ociosas.
    max: Number(process.env.PGPOOL_MAX) || 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    statement_timeout: STATEMENT_TIMEOUT_MS,
    query_timeout: STATEMENT_TIMEOUT_MS,
  };

  // PG* discretas na frente da URL: evita problema de escape de senha na URL.
  const conn: PoolConfig = host
    ? {
        ...shared,
        host,
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE?.trim(),
        user: process.env.PGUSER?.trim(),
        password: process.env.PGPASSWORD,
      }
    : { ...shared, connectionString: stripSslParams(url as string) };

  return { conn, schema };
}

// O pool vive no globalThis para sobreviver ao hot-reload do `next dev` e ser
// reaproveitado entre invocações quentes da mesma instância serverless.
const g = globalThis as typeof globalThis & { __incDb?: { pool: Pool; schema: string } | null };

function getDb(): { pool: Pool; schema: string } | null {
  if (g.__incDb !== undefined) return g.__incDb;
  const env = readEnv();
  if (!env) {
    g.__incDb = null;
    return null;
  }
  const pool = new Pool(env.conn);
  // Sem este listener, um erro em cliente ocioso derruba o processo.
  pool.on("error", (err) => console.error("[db] pool", err.message));
  g.__incDb = { pool, schema: env.schema };
  return g.__incDb;
}

export const isDbConfigured = (): boolean => getDb() !== null;

/** Mensagem curta e útil a partir de um erro do driver. */
export function dbErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string; detail?: string };
  const code = e?.code;
  const msg = e?.message || String(err);
  if (code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "EHOSTUNREACH" || code === "ENOTFOUND")
    return `Banco inacessível (${code}). Confira host/porta e se a rede de saída libera a porta do Postgres.`;
  if (code === "28P01") return "Usuário ou senha inválidos no banco.";
  if (code === "3D000") return "Banco de dados não encontrado (PGDATABASE).";
  if (code === "42P01") return `Tabela não encontrada — o schema existe? (${msg})`;
  if (code === "42501") return "Sem permissão no banco para esta operação.";
  if (code === "23503") return "Violação de vínculo: o registro referenciado não existe (ou ainda tem dependentes).";
  if (code === "23505") return "Registro duplicado (chave já existe).";
  if (msg.includes("self-signed certificate") || msg.includes("certificate"))
    return `Falha de TLS: ${msg}. Use PGSSLMODE=require para cifrar sem validar o certificado.`;
  return code ? `${msg} (${code})` : msg;
}

// ------------------------------- Carga inicial -------------------------------

/**
 * Lê as 5 tabelas numa única ida ao banco. Cada tabela vira um array JSON
 * montado no servidor Postgres — uma consulta, uma conexão, e as datas chegam
 * como string ISO em vez de `Date`.
 */
export async function loadAll(): Promise<Bootstrap> {
  const db = getDb();
  if (!db) {
    return { configured: false, tasks: [], blocks: [], people: [], areas: [], phases: [] };
  }

  const sub = (table: DbTable): string => {
    const { columns, orderBy } = TABLES[table];
    const cols = columns.map(q).join(", ");
    const from = `${q(db.schema)}.${q(table)}`;
    return `(select coalesce(json_agg(x order by x.${q(orderBy)}), '[]'::json) from (select ${cols} from ${from}) x) as ${q(table)}`;
  };

  const sql = `select ${(Object.keys(TABLES) as DbTable[]).map(sub).join(", ")}`;
  const { rows } = await db.pool.query(sql);
  const r = rows[0] as Omit<Bootstrap, "configured">;
  return { configured: true, ...r };
}

// -------------------------------- Escritas ----------------------------------

/** Erro de payload — vira 400, não 500. */
export class BadRequest extends Error {}

const isPrimitive = (v: unknown): v is Primitive =>
  v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";

/** Valida um objeto de valores contra as colunas permitidas da tabela. */
function checkValues(table: DbTable, values: unknown): Row {
  if (!values || typeof values !== "object" || Array.isArray(values))
    throw new BadRequest("`values` deve ser um objeto");
  const allowed: readonly string[] = TABLES[table].columns;
  const out: Row = {};
  for (const [k, v] of Object.entries(values as Record<string, unknown>)) {
    if (!allowed.includes(k)) throw new BadRequest(`coluna não permitida em ${table}: ${k}`);
    if (!isPrimitive(v)) throw new BadRequest(`valor inválido em ${table}.${k}`);
    out[k] = v;
  }
  if (Object.keys(out).length === 0) throw new BadRequest("`values` está vazio");
  return out;
}

function checkWhere(table: DbTable, where: unknown): { column: string; value: Primitive } {
  if (!where || typeof where !== "object" || Array.isArray(where))
    throw new BadRequest("`where` deve ser um objeto");
  const { column, value } = where as { column?: unknown; value?: unknown };
  const allowed: readonly string[] = TABLES[table].filters;
  if (typeof column !== "string" || !allowed.includes(column))
    throw new BadRequest(`filtro não permitido em ${table}: ${String(column)}`);
  if (!isPrimitive(value)) throw new BadRequest(`valor de filtro inválido em ${table}.${column}`);
  return { column, value };
}

/** Valida o corpo da requisição de escrita e devolve as operações. */
export function parseOps(body: unknown): DbOp[] {
  const raw = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { ops?: unknown }).ops)
      ? ((body as { ops: unknown[] }).ops)
      : [body];

  if (raw.length === 0) throw new BadRequest("nenhuma operação enviada");
  if (raw.length > 50) throw new BadRequest("lote grande demais (máx. 50 operações)");

  return raw.map((item): DbOp => {
    if (!item || typeof item !== "object") throw new BadRequest("operação inválida");
    const { op, table } = item as { op?: unknown; table?: unknown };
    if (!isDbTable(table)) throw new BadRequest(`tabela não permitida: ${String(table)}`);
    const o = item as Record<string, unknown>;
    if (op === "insert") return { op, table, values: checkValues(table, o.values) };
    if (op === "update")
      return { op, table, values: checkValues(table, o.values), where: checkWhere(table, o.where) };
    if (op === "delete") return { op, table, where: checkWhere(table, o.where) };
    throw new BadRequest(`operação desconhecida: ${String(op)}`);
  });
}

function buildSql(schema: string, op: DbOp): { text: string; params: Primitive[] } {
  const target = `${q(schema)}.${q(op.table)}`;

  if (op.op === "insert") {
    const keys = Object.keys(op.values);
    const cols = keys.map(q).join(", ");
    const marks = keys.map((_, i) => `$${i + 1}`).join(", ");
    return { text: `insert into ${target} (${cols}) values (${marks})`, params: keys.map((k) => op.values[k]) };
  }

  if (op.op === "update") {
    const keys = Object.keys(op.values);
    const set = keys.map((k, i) => `${q(k)} = $${i + 1}`).join(", ");
    const params = keys.map((k) => op.values[k]);
    const { text: cond, params: condParams } = whereClause(op.where, params.length);
    return { text: `update ${target} set ${set} where ${cond}`, params: [...params, ...condParams] };
  }

  const { text: cond, params: condParams } = whereClause(op.where, 0);
  return { text: `delete from ${target} where ${cond}`, params: condParams };
}

function whereClause(
  where: { column: string; value: Primitive },
  offset: number
): { text: string; params: Primitive[] } {
  if (where.value === null) return { text: `${q(where.column)} is null`, params: [] };
  return { text: `${q(where.column)} = $${offset + 1}`, params: [where.value] };
}

/**
 * Executa as operações **na ordem recebida, dentro de uma transação**. A ordem
 * importa: apagar um bloco exige antes soltar as tarefas dele (`block_id` tem
 * chave estrangeira sem `on delete`), e num lote atômico as duas coisas nunca
 * chegam invertidas nem pela metade.
 */
export async function runOps(ops: DbOp[]): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Banco não configurado no servidor.");

  const client = await db.pool.connect();
  try {
    await client.query("begin");
    for (const op of ops) {
      const { text, params } = buildSql(db.schema, op);
      await client.query(text, params);
    }
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Diagnóstico da conexão (usado por GET /api/data?probe=1 e scripts). */
export async function probe(): Promise<{
  configured: boolean;
  schema?: string;
  database?: string;
  user?: string;
  version?: string;
  tables?: string[];
}> {
  const db = getDb();
  if (!db) return { configured: false };
  const info = await db.pool.query<{ database: string; user: string; version: string }>(
    "select current_database() as database, current_user as \"user\", version() as version"
  );
  const tables = await db.pool.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = $1 order by table_name",
    [db.schema]
  );
  return {
    configured: true,
    schema: db.schema,
    ...info.rows[0],
    tables: tables.rows.map((r) => r.table_name),
  };
}

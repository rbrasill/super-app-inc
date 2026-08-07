import type { Bootstrap } from "./rows";
import type { DbOp } from "./tables";

/**
 * Ponte do browser com o banco. O front NÃO fala PostgreSQL: manda tudo para
 * `/api/data`, que roda no servidor e é o único lugar com as credenciais.
 *
 * - `loadAll()` : carga inicial (GET). Lança em falha de rede/servidor.
 * - `mutate()`  : escritas (POST). Nunca lança — devolve `{ error }`.
 */

/** Timeout do lado do cliente. Maior que o do servidor (10s de conexão +
 *  15s de statement) para a mensagem de erro do banco chegar até a tela em
 *  vez de ser cortada por um abort genérico. */
const TIMEOUT_MS = 30_000;

const ENDPOINT = "/api/data";

export interface DbError {
  message: string;
}

function timeoutSignal(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS);
}

/** Extrai a mensagem de erro de uma resposta não-ok. */
async function errorFrom(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // corpo não era JSON — cai no texto genérico abaixo
  }
  return `${res.status} ${res.statusText || "erro na API"}`;
}

/** Carga inicial. Lança em falha — quem chama decide o fallback. */
export async function loadAll(): Promise<Bootstrap> {
  const res = await fetch(ENDPOINT, {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: timeoutSignal(),
  });
  if (!res.ok) throw new Error(await errorFrom(res));
  return (await res.json()) as Bootstrap;
}

/**
 * Envia escritas. Várias operações no mesmo `mutate` rodam **na ordem, dentro
 * de uma transação** — use isso quando a ordem importa (ex.: soltar as tarefas
 * de um bloco antes de apagar o bloco).
 */
export async function mutate(ops: DbOp[]): Promise<{ error: DbError | null }> {
  if (ops.length === 0) return { error: null };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ops }),
      signal: timeoutSignal(),
    });
    if (!res.ok) return { error: { message: await errorFrom(res) } };
    return { error: null };
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === "TimeoutError"
        ? "O banco não respondeu no tempo esperado."
        : err instanceof Error
          ? err.message
          : String(err);
    return { error: { message: msg } };
  }
}

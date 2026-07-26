import { NextResponse } from "next/server";
import { BadRequest, dbErrorMessage, loadAll, parseOps, probe, runOps } from "@/lib/db/server";

/**
 * API interna do painel — única porta de entrada do banco.
 *
 * GET  /api/data          carga inicial (tarefas, blocos, pessoas, áreas, fases)
 * GET  /api/data?probe=1  diagnóstico da conexão (banco, usuário, tabelas)
 * POST /api/data          escritas: { ops: [ {op,table,values?,where?}, … ] }
 *
 * Sobre exposição: o painel não tem login, como já não tinha no Supabase (as
 * policies eram `using(true)` para o papel anônimo). O que mudou para melhor é
 * que a credencial do banco agora fica só no servidor, e a rota só aceita as
 * tabelas/colunas declaradas em lib/db/tables.ts. Se um dia entrar
 * autenticação, é aqui que o gate deve ficar.
 */

// Precisa de Node (o driver `pg` usa sockets TCP) e nunca pode ser cacheado.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const wantsProbe = new URL(req.url).searchParams.get("probe") !== null;
  try {
    const body = wantsProbe ? await probe() : await loadAll();
    return NextResponse.json(body, { headers: noStore });
  } catch (err) {
    console.error("[api/data] GET", err);
    return NextResponse.json({ error: dbErrorMessage(err) }, { status: 503, headers: noStore });
  }
}

export async function POST(req: Request) {
  let ops;
  try {
    ops = parseOps(await req.json());
  } catch (err) {
    const msg = err instanceof BadRequest ? err.message : "corpo da requisição inválido";
    return NextResponse.json({ error: msg }, { status: 400, headers: noStore });
  }

  try {
    await runOps(ops);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (err) {
    console.error("[api/data] POST", err);
    return NextResponse.json({ error: dbErrorMessage(err) }, { status: 503, headers: noStore });
  }
}

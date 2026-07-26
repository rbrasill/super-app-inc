# CLAUDE.md — Meu INC App

Painel de projeto (SPA) da **INC Empreendimentos**, acompanhando a construção do
app "Meu INC App". Stack: **Next.js 15 (App Router) · React 19 · TypeScript ·
Tailwind CSS**. O app conecta a um **PostgreSQL** (banco ao vivo) quando as env
`PGHOST…`/`DATABASE_URL` estão configuradas no servidor; sem elas, cai em modo
demo com os dados estáticos de `lib/data.ts`. Detalhes em **`docs/POSTGRES.md`**.

O projeto segue a **estratégia de blocos ("bifes")** com hierarquia
**fase → bloco → tarefa**: fatiado em blocos temáticos com prazo próprio em
dias (soma fecha o período de 90 dias), e cada bloco se encaixa em uma fase do
roadmap (v1.0–v4.0). O controle de andamento é por entrega, via pipeline de
status de cada tarefa.

## Banco ao vivo do app — PostgreSQL `dpto_processo_superapp`

A aplicação lê/grava no banco **`dpto_processo_superapp`**, schema
**`meu_inc_app`**. O front **não** fala com o banco: quem conecta é o servidor
Next, pela rota interna `app/api/data/route.ts` (`lib/db/server.ts` → driver
`pg`). Ver **`docs/POSTGRES.md`** (env, TLS, estrutura da camada) e
`db/schema-pgadmin.sql` + `db/seed-pgadmin.sql` (DDL e carga de referência).

Credenciais só em variáveis de ambiente **sem** `NEXT_PUBLIC_` — com esse
prefixo elas iriam para o bundle do browser.

> ⚠️ Dois bancos diferentes usam o schema `meu_inc_app`. Não confunda:
> | Banco | Schema | O que é |
> |---|---|---|
> | `dpto_processo_superapp` | `meu_inc_app` | **Banco do app.** Só pelo servidor Next. |
> | `dpto_processos` | `meu_inc_app` | Espelho standalone, só via conector Pipedream (regra abaixo). |

O app **não usa mais o Supabase**. `docs/SUPABASE.md` e `db/supabase.sql` ficaram
como histórico; `db/schema.sql` e `db/seed.sql` descrevem o espelho
`dpto_processos`, não o banco do app.

## ⚠️ Conector Pipedream · PostgreSQL — REGRA CRÍTICA

Ao acessar o PostgreSQL **via conector Pipedream**, **use SEMPRE o banco
`dpto_processos`**, schema **`meu_inc_app`** (espelho standalone; **não** é o
banco do app, que é o `dpto_processo_superapp` acima).

- **NUNCA** opere em outro banco. O servidor hospeda vários bancos por
  departamento (`dpto_comercial`, `dpto_projeto_executivo`, `dpto_ti_*`, `n8n`,
  `coolify`, `postgres`), mas a conexão deste projeto (role `grp_processos`) só
  tem privilégio `CONNECT` em **`dpto_processos`** — os demais retornam
  `permission denied`.
- Antes de qualquer operação, confirme:
  `SELECT current_database();` → deve ser **`dpto_processos`**.
- Toda a estrutura do app vive no schema **`meu_inc_app`** (qualifique as
  tabelas: `meu_inc_app.tasks`, `meu_inc_app.blocks`, `meu_inc_app.v_tasks`, etc.).
- O conector Pipedream **não aceita scripts multi-statement** — execute um
  comando SQL por vez.

Fonte da verdade da estrutura deste espelho: **`db/schema.sql`** (DDL) e
**`db/seed.sql`** (carga inicial). Detalhamento completo: **`docs/DATABASE.md`**.

Nunca commite credenciais/hosts/senhas — use variáveis de ambiente fora do
repositório (`.env.local`, que está no `.gitignore`; modelo em `.env.example`).

## Estrutura do código

```
app/        layout.tsx (fontes+metadata) · page.tsx (shell, estado view/sub) · globals.css
            api/data/route.ts  (única porta do banco: GET carga · POST escritas)
lib/        data.ts (dados estáticos: BLOCKS, PROJECT, TASKS…) · types.ts
            derive.ts (derivações puras: blocos, board, kpis…)
            store.tsx (Context: estado+CRUD tarefas/blocos+filtros+modais)
            db/tables.ts (contrato tabelas/colunas) · db/rows.ts (mapeadores)
            db/server.ts (pool pg, server-only) · db/client.ts (fetch do browser)
            theme.ts · exportCsv.ts
components/  Sidebar · Topbar · Dashboard · SponsorView · PeopleGrid
             TaskModal · BlockModal · BlocosView · KpiCard · icons
             board/{BoardView,KanbanBoard,GroupedBoard,TaskCard}
db/         schema-pgadmin.sql · seed-pgadmin.sql   (banco do app)
            schema.sql · seed.sql                   (espelho dpto_processos)
docs/       POSTGRES.md (banco do app) · DATABASE.md (espelho) · SUPABASE.md (histórico)
```

Fluxo de dados: `api/data` → `store.tsx` (estado+filtros) → `derive.ts`
(transforma em dados de tela) → componentes (só renderizam). Sem banco
configurado, a origem é `data.ts` (modo demo). O schema `meu_inc_app` espelha
esse modelo (ver `docs/POSTGRES.md`).

## Comandos

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

# CLAUDE.md — Meu INC App

Painel de projeto (SPA) da **INC Empreendimentos**, acompanhando a construção do
app "Meu INC App". Stack: **Next.js 15 (App Router) · React 19 · TypeScript ·
Tailwind CSS**. O app conecta a um **Supabase** (banco ao vivo) quando as env
`NEXT_PUBLIC_SUPABASE_*` estão configuradas; sem elas, cai em modo demo com os
dados estáticos de `lib/data.ts`. Detalhes em **`docs/SUPABASE.md`**.

O projeto segue a **estratégia de blocos ("bifes")** com hierarquia
**fase → bloco → tarefa**: fatiado em blocos temáticos com prazo próprio em
dias (soma fecha o período de 90 dias), e cada bloco se encaixa em uma fase do
roadmap (v1.0–v4.0). O controle de andamento é por entrega, via pipeline de
status de cada tarefa.

## Banco ao vivo do app — Supabase

A aplicação lê/grava no **Supabase** (projeto "App INC", ref
`ntmjovdzzmpdvsvpacil`, schema `public`) via `lib/supabase.ts` + `lib/store.tsx`.
Ver **`docs/SUPABASE.md`** (env, RLS, estrutura) e `db/supabase.sql` (DDL).

## ⚠️ Conector Pipedream · PostgreSQL — REGRA CRÍTICA

Ao acessar o PostgreSQL **via conector Pipedream**, **use SEMPRE o banco
`dpto_processos`**, schema **`meu_inc_app`** (espelho standalone; não é o banco
do app, que é o Supabase acima).

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

Fonte da verdade da estrutura: **`db/schema.sql`** (DDL) e **`db/seed.sql`**
(carga inicial). Detalhamento completo: **`docs/DATABASE.md`**.

Nunca commite credenciais/hosts/senhas — use `DATABASE_URL` via variável de
ambiente, fora do repositório.

## Estrutura do código

```
app/        layout.tsx (fontes+metadata) · page.tsx (shell, estado view/sub) · globals.css
lib/        data.ts (dados estáticos: BLOCKS, PROJECT, TASKS…) · types.ts
            derive.ts (derivações puras: blocos, board, kpis…)
            store.tsx (Context: estado+CRUD tarefas/blocos+filtros+modais)
            theme.ts · exportCsv.ts
components/  Sidebar · Topbar · Dashboard · SponsorView · PeopleGrid
             TaskModal · BlockModal · BlocosView · KpiCard · icons
             board/{BoardView,KanbanBoard,GroupedBoard,TaskCard}
db/         schema.sql · seed.sql   (espelham lib/data.ts no PostgreSQL)
docs/       DATABASE.md
```

Fluxo de dados: `data.ts` → `store.tsx` (estado+filtros) → `derive.ts`
(transforma em dados de tela) → componentes (só renderizam). O schema
`meu_inc_app` espelha esse modelo (ver `docs/DATABASE.md`).

## Comandos

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

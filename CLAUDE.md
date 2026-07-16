# CLAUDE.md — Meu INC App

Painel de projeto (SPA) da **INC Empreendimentos**, acompanhando a construção do
app "Meu INC App". Stack: **Next.js 15 (App Router) · React 19 · TypeScript ·
Tailwind CSS**. Estado hoje é estático/em memória (`lib/data.ts` + `lib/store.tsx`).

## ⚠️ Banco de dados — REGRA CRÍTICA

Ao acessar PostgreSQL (via conector **Pipedream · PostgreSQL** ou qualquer
outra forma), **use SEMPRE o banco `dpto_processos`**, schema **`meu_inc_app`**.

- **NUNCA** opere em outro banco. O servidor hospeda vários bancos por
  departamento (`dpto_comercial`, `dpto_projeto_executivo`, `dpto_ti_*`, `n8n`,
  `coolify`, `postgres`), mas a conexão deste projeto (role `grp_processos`) só
  tem privilégio `CONNECT` em **`dpto_processos`** — os demais retornam
  `permission denied`.
- Antes de qualquer operação, confirme:
  `SELECT current_database();` → deve ser **`dpto_processos`**.
- Toda a estrutura do app vive no schema **`meu_inc_app`** (qualifique as
  tabelas: `meu_inc_app.tasks`, `meu_inc_app.v_tasks`, etc.).
- O conector Pipedream **não aceita scripts multi-statement** — execute um
  comando SQL por vez.

Fonte da verdade da estrutura: **`db/schema.sql`** (DDL) e **`db/seed.sql`**
(carga inicial). Detalhamento completo: **`docs/DATABASE.md`**.

Nunca commite credenciais/hosts/senhas — use `DATABASE_URL` via variável de
ambiente, fora do repositório.

## Estrutura do código

```
app/        layout.tsx (fontes+metadata) · page.tsx (shell, estado view/sub) · globals.css
lib/        data.ts (dados estáticos) · types.ts · derive.ts (derivações puras)
            store.tsx (Context: estado+CRUD+filtros+modal) · theme.ts · exportCsv.ts
components/  Sidebar · Topbar · Dashboard · SponsorView · PeopleGrid · TaskModal
             KpiCard · icons · board/{BoardView,KanbanBoard,GroupedBoard,TaskCard}
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

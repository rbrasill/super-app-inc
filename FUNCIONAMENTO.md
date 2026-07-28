# Meu INC App — Funcionamento da Plataforma

> **Para quem é este documento:** um agente de IA que vai ler, entender e alterar
> este código. É um manual operacional, não um README de marketing. Contém as
> assinaturas reais, os contratos entre camadas, os invariantes que não podem ser
> quebrados e as armadilhas que já custaram depuração.
>
> **Como usar:** leia as seções 1–4 antes de qualquer alteração. A seção 11
> (invariantes e armadilhas) e a 12 (receitas) são consulta pontual. Onde este
> documento e o código divergirem, **o código é a verdade** — mas trate a
> divergência como bug de um dos dois e reporte.

---

## Índice

1. [O que a plataforma é](#1-o-que-a-plataforma-é)
2. [Modelo de domínio](#2-modelo-de-domínio)
3. [Arquitetura em quatro camadas](#3-arquitetura-em-quatro-camadas)
4. [Regras de ouro](#4-regras-de-ouro)
5. [Camada de dados](#5-camada-de-dados-banco--api)
6. [Store: estado e mutações](#6-store-estado-e-mutações)
7. [derive.ts: toda a lógica de cálculo](#7-derivets-toda-a-lógica-de-cálculo)
8. [Telas e componentes](#8-telas-e-componentes)
9. [Banco de dados](#9-banco-de-dados)
10. [Configuração e execução](#10-configuração-e-execução)
11. [Invariantes e armadilhas](#11-invariantes-e-armadilhas)
12. [Receitas](#12-receitas-como-fazer-alterações-comuns)
13. [Como verificar seu trabalho](#13-como-verificar-seu-trabalho)
14. [O que NÃO está implementado](#14-o-que-não-está-implementado)

---

## 1. O que a plataforma é

Painel de acompanhamento (SPA) da **INC Empreendimentos** para gerenciar a
construção de um app chamado "Meu INC App".

**Ponto de confusão a evitar desde já:** este repositório **não é** o app do
cliente final. É a ferramenta interna de gestão do projeto que constrói esse app.
Quando o código fala em "tarefas", são tarefas do projeto de desenvolvimento, não
tarefas de um usuário do app.

Serve dois públicos com necessidades opostas:

| Público | Precisa de | Telas |
|---|---|---|
| Time de execução | Detalhe operacional, tarefa por tarefa | Quadro de execução, Blocos |
| Patrocinador (papel "Sponsor") | Resumo executivo: onde está, o que saiu, o que espera decisão dele | Visão do patrocinador |

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript 5.7 · Tailwind CSS 3.4
· PostgreSQL via driver `pg` 8.

**Idioma:** todo o código, comentários, identificadores de domínio e interface
estão em **português**. Mantenha assim. Termos do domínio que aparecem em
identificadores: `bloco`/`bife`, `fase`, `tarefa`, `area`, `patrocinador`.

---

## 2. Modelo de domínio

Hierarquia de três níveis:

```
Fase (v1.0 … v4.0)          camada de roadmap
  └── Bloco / "bife"        fatia temática, com data de início e fim próprias
        └── Tarefa          unidade de trabalho, com responsável e status
```

"Bife" é o apelido interno de bloco (a metáfora é fatiar o projeto em pedaços
digeríveis). Os dois termos aparecem no código e na interface como sinônimos.

### Tipos exatos (`lib/types.ts`)

```ts
export type StatusId =
  | "discovery" | "backlog" | "planejado" | "execucao"
  | "validacao" | "pronto" | "entregue";

export type AreaId = string;        // texto livre: áreas são editáveis (CRUD)
export type PriorityId = "alta" | "media" | "baixa";

export interface Status  { id: StatusId; name: string; sub: string;
                           color: string; soft: string; light?: boolean }
export interface Area    { id: AreaId; name: string; color: string }
export interface Fase    { id: string; name: string; short: string }
export interface Priority{ label: string; bg: string; text: string }

export interface Bloco {
  id: string;
  name: string;
  theme: string;      // "o que entra no bloco"
  start: string;      // ISO yyyy-mm-dd; "" = sem data
  end: string;        // ISO yyyy-mm-dd; "" = sem data
  color: string;
  phaseId: string;    // "" = sem fase
}

export interface Task {
  id: string;
  desc: string;
  area: AreaId;
  blockId: string;    // "" = sem bloco
  who: string;        // NOME da pessoa, não id — ver §11
  prio: PriorityId;
  status: StatusId;
  start: string;      // ISO; "" = sem data
  end: string;        // ISO; "" = sem data
  dep: string;        // dependência em texto livre; "" = sem trava
}

export interface Person {
  id: string; name: string; role: string; resp: string;
  area: string;       // id de área; "" = sem área
}

export type View = "board" | "blocks" | "dash" | "sponsor" | "people";
export type Sub  = "kanban" | "grouped";
```

`DecoratedTask extends Task` adiciona ~16 campos prontos para render
(`areaName`, `color`, `statusName`, `dateLabel`, `initials`, `avBg`…). Componentes
consomem `DecoratedTask`, nunca `Task` cru. Produzido por `decorate()`.

### Convenção de "vazio"

**String vazia `""`, nunca `null` nem `undefined`**, em todo o modelo do app. A
conversão para `NULL` do banco acontece só nos mapeadores (`lib/db/rows.ts`).
Se você introduzir `null` no tipo do app, vai quebrar comparações e renders que
assumem string.

### Pipeline de status

Ordem fixa, definida por `STATUSES` em `lib/data.ts` (a ordem do array **é** a
ordem das colunas do Kanban):

| # | id | Nome | Subtítulo |
|---|---|---|---|
| 1 | `discovery` | Discovery | Pesquisa / ideia |
| 2 | `backlog` | Backlog | No radar, sem prazo |
| 3 | `planejado` | Planejado | Na esteira |
| 4 | `execucao` | Em execução | Sendo feito |
| 5 | `validacao` | Em validação | Em conferência |
| 6 | `pronto` | Pronto p/ entrega | Aguardando |
| 7 | `entregue` | Entregue | No ar / oficializado |

Semânticas derivadas que você precisa conhecer:

- **Concluído** = `entregue` (e só ele). É a base do % de conclusão.
- **Em andamento** = `execucao` + `validacao` + `pronto`.
- **Travada** = qualquer status, com `dep` não vazio.
- **"Entregue recentemente"** (tela do patrocinador) = `entregue` **ou** `pronto`.
  Sim, a função se chama `getDelivered` e inclui `pronto` — ver §11.

### Papéis com significado para o código

O patrocinador **não** é identificado por nome, e sim por expressão regular no
campo `role`, porque as pessoas são editáveis:

```ts
function findSponsor(people: Person[]): Person | undefined {
  return (
    people.find((p) => /sponsor/i.test(p.role)) ??
    people.find((p) => /patrocinador/i.test(p.role) && !/t[eé]cnic/i.test(p.role))
  );
}
```

A exclusão de `t[eé]cnic` existe porque há duas pessoas com "patrocinador" no
papel: o sponsor de verdade (Edinho, "Patrocinador (Sponsor)") e o "Patrocinador
técnico" (Felipe, Diretor de TI). Sem essa exclusão a tela do patrocinador
mostraria as decisões da pessoa errada.

**Consequência:** renomear um papel muda o comportamento da tela do patrocinador.
Se você mexer nessa regex, verifique as duas pessoas.

---

## 3. Arquitetura em quatro camadas

```
┌─────────────────────────────────────────────────────────────┐
│ components/         só renderizam. Nada de cálculo nem I/O   │
└──────────────────────────┬──────────────────────────────────┘
                           │ consomem dados prontos
┌──────────────────────────▼──────────────────────────────────┐
│ lib/derive.ts       funções PURAS: estado → dados de tela    │
└──────────────────────────┬──────────────────────────────────┘
                           │ recebem listas do store
┌──────────────────────────▼──────────────────────────────────┐
│ lib/store.tsx       Context: estado, CRUD, filtros, modais   │
└──────────────────────────┬──────────────────────────────────┘
                           │ lib/db/client.ts (fetch)
┌──────────────────────────▼──────────────────────────────────┐
│ app/api/data/route.ts  →  lib/db/server.ts  ──pg──► Postgres │
└─────────────────────────────────────────────────────────────┘
```

### Mapa de arquivos

```
app/
  layout.tsx              fontes (Manrope corpo + Montserrat títulos), metadata, lang=pt-BR
  page.tsx                shell: StoreProvider, estado view/sub, Loader, DbErrorToast
  globals.css             reset, fundo #f6f6f6, scrollbar .sc-scroll, animações
  icon.svg                favicon
  api/data/route.ts       ÚNICA porta do banco

lib/
  data.ts                 dados estáticos: STATUSES, AREAS, PROJECT, PHASES, BLOCKS,
                          PRIO, TASKS, PEOPLE_RAW, PEOPLE, AV_PALETTE
  types.ts                tipos do domínio
  derive.ts               TODA a lógica de cálculo (568 linhas) — pura
  store.tsx               Context Provider + useStore()
  theme.ts                THEME (tokens em objeto) + whoAvatar()
  exportCsv.ts            exportTasksCsv()
  db/
    tables.ts             contrato tabelas/colunas + helpers ins/upd/del  (isomórfico)
    rows.ts               mapeadores banco ⇄ app + tipos de linha        (isomórfico)
    server.ts             pool, loadAll, runOps, validação, probe        (server-only)
    client.ts             loadAll(), mutate()                            (browser)

components/
  Sidebar.tsx             navegação, logo, rodapé de usuário
  Topbar.tsx              título, ConnBadge, busca, exportar, botões de criar
  KpiCard.tsx             cartão de KPI
  icons.tsx               ícones SVG inline
  Dashboard.tsx           tela "dash"
  SponsorView.tsx         tela "sponsor" (a mais complexa: anéis + timeline)
  BlocosView.tsx          tela "blocks" (lista + detalhe)
  PeopleGrid.tsx          tela "people" (pessoas + áreas + fases)
  TaskModal · BlockModal · PersonModal · AreaModal · PhaseModal
  board/
    BoardView.tsx         BoardControls (filtros) + escolha kanban/grouped
    KanbanBoard.tsx       7 colunas + drag-and-drop
    GroupedBoard.tsx      agrupado por área
    TaskCard.tsx          cartão da tarefa

db/
  schema-pgadmin.sql      DDL do banco do app (8 tabelas)
  seed-pgadmin.sql        carga mínima de referência
  schema.sql · seed.sql   OUTRO banco (espelho dpto_processos) — ver §9
  supabase.sql            HISTÓRICO, não usar

docs/
  POSTGRES.md             banco do app: env, TLS, camada
  DATABASE.md             espelho dpto_processos
  SUPABASE.md             HISTÓRICO
```

---

## 4. Regras de ouro

Violar qualquer uma delas quebra o projeto de forma não óbvia.

1. **`derive.ts` é puro.** Sem `fetch`, sem `useState`, sem `Date.now()` implícito
   (a data "hoje" **entra por parâmetro**), sem acesso ao store. Entram listas,
   saem dados de tela.
2. **Componentes não calculam.** Se você está escrevendo `filter`, `reduce`,
   `Math.round` ou formatação de data num `.tsx`, pare: isso vai para `derive.ts`.
3. **Cálculo novo vira função exportada em `derive.ts`**, com interface de retorno
   declarada. Não devolva objetos anônimos.
4. **Data: ISO `yyyy-mm-dd` no código, banco e formulários; `dd/mm/aaaa` na tela.**
   A conversão é exclusivamente `fmt()` em `derive.ts`. Nunca use
   `toLocaleDateString` — ele varia por ambiente.
5. **Coluna nova exige entrada em `lib/db/tables.ts`**, senão a API rejeita com
   400. Isso é proposital.
6. **Credenciais só em env sem `NEXT_PUBLIC_`.** Com o prefixo, o valor entra no
   bundle do browser.
7. **Nunca commite credenciais, hosts ou senhas.** `.env.local` é gitignored;
   `.env.example` só com placeholders.
8. **Comentário explica *por quê*, não *o quê*.** Em português. Se o comentário
   parafraseia o código, apague-o.

---

## 5. Camada de dados (banco → API)

### 5.1 Por que existe uma rota de API

O banco anterior era Supabase, acessado **direto do browser** via PostgREST.
Migramos para PostgreSQL puro, que fala protocolo binário sobre TCP — o navegador
não fala isso, e mandar credencial de banco para o cliente estaria fora de questão
de qualquer forma. Logo: **o front nunca toca no banco.**

### 5.2 `lib/db/tables.ts` — o contrato

Esta é a **única fonte de identificadores SQL** aceitos pela API. Valores sempre
vão parametrizados (`$1`, `$2`…), então o risco de injeção fica restrito aos
identificadores — e identificador só sai desta lista.

```ts
export const TABLES = {
  tasks: {
    columns: ["id","description","area_id","block_id","who",
              "priority_id","status_id","start_date","end_date","dependency"],
    filters: ["id","block_id","who"],   // colunas aceitas em WHERE
    orderBy: "id",
  },
  blocks: { columns: ["id","name","theme","start_date","end_date","color","phase_id","sort_order"],
            filters: ["id"], orderBy: "sort_order" },
  people: { columns: ["id","name","role","responsibility","area_id","sort_order"],
            filters: ["id"], orderBy: "sort_order" },
  areas:  { columns: ["id","name","color","sort_order"], filters: ["id"], orderBy: "sort_order" },
  phases: { columns: ["id","name","short","sort_order"], filters: ["id"], orderBy: "sort_order" },
} as const;

export type Primitive = string | number | boolean | null;
export type Row = Record<string, Primitive>;

export type DbOp =
  | { op: "insert"; table: DbTable; values: Row }
  | { op: "update"; table: DbTable; values: Row; where: { column: string; value: Primitive } }
  | { op: "delete"; table: DbTable; where: { column: string; value: Primitive } };

// Helpers usados pelo store:
export const ins = (table, values) => ({ op: "insert", table, values });
export const upd = (table, values, column, value) => ({ op: "update", table, values, where: { column, value } });
export const del = (table, column, value) => ({ op: "delete", table, where: { column, value } });
```

Por que `filters` é tão restrito: `tasks.block_id` existe porque excluir um bloco
solta as tarefas dele; `tasks.who` existe porque renomear uma pessoa atualiza as
tarefas dela. Nenhum outro filtro é necessário, então nenhum outro é permitido.

**As tabelas `statuses`, `priorities` e `project` não estão na lista** — são
somente leitura pela API, de propósito.

### 5.3 API: `app/api/data/route.ts`

```
GET  /api/data           carga inicial (tasks, blocks, people, areas, phases)
GET  /api/data?probe=1   diagnóstico: banco, usuário, versão, tabelas
POST /api/data           escritas: { ops: [ {op,table,values?,where?}, … ] }
```

Declarações obrigatórias no topo do arquivo:

```ts
export const runtime = "nodejs";        // pg usa sockets TCP; Edge não serve
export const dynamic = "force-dynamic"; // sem isso o Next cacheia o GET
```

Respostas:

| Situação | Código | Corpo |
|---|---|---|
| OK (GET) | 200 | `Bootstrap` (ver abaixo) |
| OK (POST) | 200 | `{"ok":true}` |
| Payload inválido | 400 | `{"error":"coluna não permitida em tasks: created_at"}` |
| Erro do banco | 503 | `{"error":"Banco inacessível (ETIMEDOUT). …"}` |

Distinção que importa: **400 = você mandou errado** (bug no cliente, corrija o
código). **503 = o banco recusou ou está inalcançável** (ambiente ou dados).

### 5.4 Carga: uma consulta, um round-trip

`loadAll()` em `lib/db/server.ts` monta **uma única** consulta que devolve as 5
tabelas como arrays JSON construídos no próprio Postgres:

```sql
select
  (select coalesce(json_agg(x order by x."id"), '[]'::json)
     from (select "id","description",… from "meu_inc_app"."tasks") x) as "tasks",
  (select coalesce(json_agg(x order by x."sort_order"), '[]'::json)
     from (select … from "meu_inc_app"."blocks") x) as "blocks",
  …
```

A lista de colunas vem de `TABLES[t].columns` — o contrato e a consulta não podem
divergir.

**Efeito colateral importante e desejado:** passando por `json_agg`, colunas
`date` chegam como **string ISO** (`"2026-08-01"`). Se fossem lidas pelo caminho
normal do driver, viriam como objeto `Date` do JavaScript e quebrariam os
mapeadores, que esperam string. Não troque essa consulta por 5 `SELECT`s simples
sem tratar isso.

```ts
export interface Bootstrap {
  configured: boolean;   // false = servidor sem PGHOST/DATABASE_URL → modo demo
  tasks: TaskRow[]; blocks: BlockRow[]; people: PersonRow[];
  areas: AreaRow[]; phases: PhaseRow[];
}
```

### 5.5 Escritas: lote ordenado, em transação

`runOps(ops)` executa **na ordem recebida, dentro de `begin`/`commit`**, com
`rollback` em qualquer falha.

Isso não é enfeite. `tasks.block_id` referencia `blocks(id)` **sem `on delete`**,
então apagar um bloco exige soltar as tarefas dele antes. Como duas requisições
HTTP separadas, a ordem não é garantida e o delete falha por chave estrangeira.
Por isso `deleteBlock` manda as duas operações num lote:

```ts
persist(upd("tasks", { block_id: null }, "block_id", id), del("blocks", "id", id));
```

Geração de SQL (`buildSql`), sempre com identificadores validados e valores
parametrizados:

| op | SQL |
|---|---|
| insert | `insert into "schema"."t" ("a","b") values ($1,$2)` |
| update | `update "schema"."t" set "a" = $1 where "c" = $2` |
| delete | `delete from "schema"."t" where "c" = $1` |

`where.value === null` gera `is null` em vez de `= $n`.

Validação (`parseOps`) rejeita, com 400: tabela fora da whitelist, coluna não
gravável, filtro não permitido, valor não primitivo, operação desconhecida, lote
vazio, `values` vazio, lote com mais de 50 operações.

### 5.6 Pool e TLS

```ts
// singleton no globalThis: sobrevive ao hot-reload do next dev e é reaproveitado
// entre invocações quentes da mesma instância serverless
const g = globalThis as typeof globalThis & { __incDb?: { pool: Pool; schema: string } | null };
```

Parâmetros: `max: 4` (configurável por `PGPOOL_MAX`), `idleTimeoutMillis: 10s`,
`connectionTimeoutMillis: 10s`, `statement_timeout: 15s`,
`application_name: "meu-inc-app"`. Há um listener `pool.on("error")` — sem ele,
um erro em cliente ocioso derruba o processo.

#### ⚠️ A armadilha do `sslmode` — leia antes de debugar conexão

O `pg` **não segue a semântica do libpq**. `?sslmode=require` numa connection
string é tratado como **`verify-full`**, isto é, ele valida a cadeia do
certificado. Num Postgres self-hosted com certificado autoassinado isso derruba a
conexão com:

```
error: self-signed certificate (DEPTH_ZERO_SELF_SIGNED_CERT)
```

…que **parece credencial errada, e não é**. Por isso `server.ts` remove `sslmode`
da connection string (`stripSslParams`) e decide o TLS **só** por `PGSSLMODE`:

| `PGSSLMODE` | `ssl` passado ao pg | Semântica |
|---|---|---|
| `require` (padrão) | `{ rejectUnauthorized: false }` | cifra, **não** valida certificado — igual ao libpq/pgAdmin |
| `verify-ca` / `verify-full` | `{ rejectUnauthorized: true }` | cifra e valida a cadeia |
| `disable` | `false` | sem TLS |

Não "conserte" isso passando o `sslmode` adiante. A remoção é a correção.

### 5.7 Mensagens de erro (`dbErrorMessage`)

Traduz códigos do driver/Postgres para português acionável:

| Código | Mensagem |
|---|---|
| `ETIMEDOUT`, `ECONNREFUSED`, `EHOSTUNREACH`, `ENOTFOUND` | Banco inacessível — confira host/porta e se a rede de saída libera a porta |
| `28P01` | Usuário ou senha inválidos |
| `3D000` | Banco de dados não encontrado |
| `42P01` | Tabela não encontrada — o schema existe? |
| `42501` | Sem permissão |
| `23503` | Violação de vínculo (FK) |
| `23505` | Registro duplicado |
| contém `certificate` | Falha de TLS + dica do `PGSSLMODE` |

Ao adicionar tratamento de erro novo, estenda esta função — não espalhe strings
pelos componentes.

### 5.8 Cliente do browser (`lib/db/client.ts`)

```ts
export async function loadAll(): Promise<Bootstrap>          // LANÇA em falha
export async function mutate(ops: DbOp[]): Promise<{ error: DbError | null }>  // NUNCA lança
```

Assimetria proposital: a carga lança para o store decidir o fallback; a escrita
devolve `{error}` porque a UI já foi atualizada de forma otimista e só precisa
registrar a falha. Timeout do cliente: 30s — maior que o do servidor (10s de
conexão + 15s de statement), para a mensagem do banco chegar à tela em vez de ser
cortada por um abort genérico.

### 5.9 Exposição / segurança

O painel **não tem login** — e também não tinha no Supabase, onde as policies eram
`using(true)` para o papel anônimo. O que melhorou na migração é que a credencial
saiu do browser e a superfície ficou restrita ao contrato de `tables.ts`.

**Se você for adicionar autenticação, o gate é `app/api/data/route.ts`.** Não
tente proteger no cliente.

---

## 6. Store: estado e mutações

`lib/store.tsx` — Context Provider único. Acesso por `useStore()`, que lança se
usado fora do `<StoreProvider>`.

### 6.1 Estado

```ts
tasks: Task[]  ·  blocks: Bloco[]  ·  people: Person[]
areas: Area[]  ·  phases: Fase[]
filteredTasks: Task[]        // memoizado; tasks + filtros aplicados
loading: boolean
dataSource: "loading" | "db" | "demo"
dbError: { kind: "load" | "save"; message: string } | null
search · areaFilter · blockFilter · whoFilter · statusFilter
hasActiveFilters: boolean  ·  clearFilters()
modal · blockModal · personModal · areaModal · phaseModal  (ModalState)
```

`ModalState = { mode: "new" } | { mode: "edit"; id: string } | null`.

### 6.2 Ciclo de vida da carga

```
monta → dataSource "loading", tudo vazio, loading true
        │
        ├─ loadAll() OK e configured:true  → popula, dataSource "db"
        ├─ loadAll() OK e configured:false → dados estáticos, "demo", SEM erro
        └─ loadAll() lança                 → dados estáticos, "demo", COM dbError{kind:"load"}
```

Os três estados são visíveis na interface: selo **Ao vivo** (verde) ou **Modo
demo** (âmbar) no `Topbar`, e um toast com o motivo quando há `dbError`.

O caso "configured:false" **não** mostra erro: rodar sem banco é um modo válido
(demo), não uma falha. Já a falha de carga mostra o motivo — modo demo silencioso
já custou horas de depuração neste projeto, então não volte a esconder.

### 6.3 Escritas otimistas

```ts
const canPersist = dataSource === "db";

const persist = (...ops: DbOp[]) => {
  if (!canPersist || ops.length === 0) return;
  mutate(ops).then(({ error }) => {
    if (error) { console.error("[db]", error.message);
                 setDbError({ kind: "save", message: error.message }); }
  });
};
```

Padrão de toda mutação: **atualiza o estado local primeiro, depois chama
`persist`**. A tela nunca espera a rede. Em modo demo, `persist` não faz nada —
gravar ali criaria estado misturado e avisos enganosos.

### 6.4 Tabela de mutações

| Função | Estado local | Persistência |
|---|---|---|
| `addTask(input)` | acrescenta com `makeId("t")` | `ins("tasks", {id, ...taskToRow})` |
| `updateTask(id, patch)` | substitui | `upd("tasks", taskToRow, "id", id)` |
| `deleteTask(id)` | remove + fecha modal | `del("tasks","id",id)` |
| `moveTask(id, status)` | troca status | `upd("tasks",{status_id},"id",id)` |
| `addBlock(input)` | acrescenta | `ins("blocks", …, sort_order = blocks.length)` |
| `updateBlock(id, patch)` | substitui | `upd("blocks", …, "id", id)` |
| `deleteBlock(id)` | tarefas ficam `blockId:""`, bloco sai, limpa filtro | **lote:** `upd(tasks, block_id=null, block_id=id)` **+** `del(blocks,id)` |
| `addPerson(input)` | acrescenta | `ins("people", …)` |
| `updatePerson(id, patch)` | substitui; se o nome mudou, renomeia `who` das tarefas e o filtro | `upd(people)` **+** `upd(tasks, who=novo, who=antigo)` se renomeou |
| `deletePerson(id)` | remove | `del("people","id",id)` |
| `addArea` / `updateArea` | análogos | análogos |
| `deleteArea(id)` | pessoas da área ficam `area:""`, área sai, limpa filtro | `del("areas","id",id)` — o banco cuida das pessoas via `on delete set null` |
| `addPhase` / `updatePhase` | análogos | análogos |
| `deletePhase(id)` | remove | `del("phases","id",id)` |

### 6.5 Geração de ids

```ts
function makeId(prefix: string): string {
  const rnd = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${rnd.replace(/-/g, "").slice(0, 12)}`;
}
```

Ids são gerados **no cliente**, não pelo banco (as colunas `id` são `text primary
key` sem default). Prefixos: `t_` tarefa, `b_` bloco, `p_` pessoa, `a_` área,
`f_` fase. Os dados de semente usam ids legíveis (`t1`, `b1`, `dev`, `v1.0`) — as
duas formas coexistem, e nada no código depende do formato do id.

### 6.6 ⚠️ Efeito colateral em updater de estado: não faça

Bug já corrigido, que volta fácil. Isto está **errado**:

```ts
// ERRADO — StrictMode invoca o updater duas vezes → dois inserts com o mesmo id
setBlocks((prev) => {
  persist(ins("blocks", { id, ...blockToRow(input, prev.length) }));
  return [...prev, { id, ...input }];
});
```

Correto — o `sort_order` sai do valor de render, e a escrita fica fora do updater:

```ts
setBlocks((prev) => [...prev, { id, ...input }]);
persist(ins("blocks", { id, ...blockToRow(input, blocks.length) }));
```

`reactStrictMode: true` está ligado em `next.config.mjs`, então o bug aparece em
desenvolvimento. Mesma correção vale para `setTasks` dentro de `setPeople`.

---

## 7. `derive.ts`: toda a lógica de cálculo

Todas as funções são **puras**. As que dependem de áreas/fases/projeto aceitam
esses parâmetros com default para os estáticos de `data.ts` — o default existe
para testes e chamadas legadas; **os componentes sempre passam os valores do
store**, porque áreas e fases são editáveis.

### 7.1 Utilitários internos (não exportados)

```ts
const fmt = (d: string): string      // "2026-08-01" → "01/08/2026"; "" → ""
function toTime(iso: string): number | null          // meia-noite local; null se vazio/inválido
function inclusiveDays(start, end): number           // 1 = mesmo dia; 0 se faltar ou invertido
const blockMapOf / areaMapOf                         // id → objeto
function chronological(blocks): Bloco[]              // por start, depois end; sem data ao fim
function blocksWindow(blocks, project): {start, spanDays}  // janela da timeline
function findSponsor(people) / decisionTasks(tasks, people)
```

`fmt` faz `split("-")` — depende de entrada `yyyy-mm-dd`. Não passe outro formato.

`inclusiveDays` é **inclusivo**: 16/07 a 19/08 = 35 dias, não 34. É assim que a
semente fecha 35 + 30 + 15 + 10 = 90.

### 7.2 API pública

| Função | Assinatura resumida | O que faz |
|---|---|---|
| `areaMapOf` | `(areas) → Record<id, Area>` | mapa para lookup |
| `decorate` | `(tk, blockMap, areaMap) → DecoratedTask` | enriquece uma tarefa para render |
| `getBoard` | `(tasks, blocks, areas?) → BoardColumn[]` | 7 colunas na ordem de `STATUSES`, com `count` e `empty` |
| `getGrouped` | `(tasks, blocks, areas?) → GroupedArea[]` | agrupa por área; **omite áreas sem tarefa** |
| `getKpis` | `(tasks, people?) → Kpis` | `{total, andamento, entregue, travadas, pct, decisions}` |
| `getAreaDist` | `(tasks, areas?) → AreaDistRow[]` | barra empilhada por área; rótulo só se o segmento > 9% |
| `getLegend` | `() → {name,color}[]` | legenda de status |
| `getBlocks` | `(tasks, blocks, areas?, phases?, project?) → BlockRow[]` | a função mais rica: semáforo, %, posição na timeline, distribuição por área |
| `getBlocksSummary` | `(blocks) → {totalDays, startDate, endDate}` | soma das durações + extremos |
| `getMilestones` | `(tasks, blocks, todayIso) → MilestoneLine` | linha do tempo de marcos |
| `getRisks` | `(tasks, areas?) → RiskRow[]` | tarefas com `dep` |
| `getDecisions` | `(tasks, people, areas?) → DecisionRow[]` | tarefas do sponsor ainda abertas, numeradas |
| `getDelivered` | `(tasks, areas?) → DeliveredRow[]` | `entregue` **ou** `pronto` |
| `getPeople` | `(people, areas?) → PersonRow[]` | pessoas com avatar e área resolvida |
| `getPeopleProgress` | `(tasks, people) → PersonProgress[]` | % concluído por pessoa |

### 7.3 `getBlocks` — semáforo e timeline

Semáforo, na ordem exata de avaliação (a última condição vence):

```ts
let lampColor = "#10B981", txt = "No ritmo";           // verde
if (blocked > 0 && pc < 50)      { lampColor = "#EF4444"; txt = "Em risco"; }   // vermelho
else if (blocked > 0 || pc < 40) { lampColor = "#F59E0B"; txt = "Atenção"; }    // âmbar
if (items.length === 0)          { lampColor = THEME.inkFaint; txt = "Sem tarefas"; }  // cinza
```

`pc` = % de tarefas `entregue` no bloco. Um bloco vazio é sempre cinza, mesmo que
as condições anteriores tenham disparado.

Posição na timeline: `offsetPct` e `widthPct` são calculados sobre a janela de
`blocksWindow`, com clamp para não estourar 0–100%. Blocos sem data recebem
`offset` 0 e `width` 0 — ficam com largura zero, invisíveis na barra. (Já houve
teste de UI quebrado por isso: um seletor de texto casou com o segmento de largura
zero em vez do card. Ao testar, ancore em `h3`, não em texto solto.)

`bife` é o índice 1-based **na ordem cronológica**, não a ordem de inserção.

### 7.4 `getMilestones` — a linha do patrocinador

Só considera blocos com **início e fim** preenchidos (`dated`). Sem nenhum,
devolve um objeto vazio com `segs: []` e todos os números em 0/null.

```ts
export interface MilestoneLine {
  segs: MilestoneSeg[];
  startLabel: string;      // dd/mm/aaaa do primeiro início
  endLabel: string;        // dd/mm/aaaa da entrega
  deliveryDate: string;    // ISO — fim do ÚLTIMO bife
  todayPct: number | null; // posição de hoje (null se fora da janela)
  daysLeft: number | null; // negativo = atrasado
  tasksBeyond: number;     // tarefas que terminam DEPOIS da entrega prevista
  totalDays: number;
  progressPct: number | null;
}
```

**Decisão de produto importante:** a data de entrega do projeto é o **fim do
último bife** — o plano é o compromisso. Não é a data da última tarefa. Tarefas
que passam desse limite não movem a data: são contadas em `tasksBeyond` e
sinalizadas, para o desalinhamento ficar visível em vez de ser escondido. Se
alguém pedir "a data deveria seguir a última tarefa", isso é uma mudança de
produto, não um bug.

`labelTop: i % 2 === 0` — as caixas alternam acima/abaixo da linha.

`delivered` de um segmento é `items.length > 0 && items.every(entregue)`: um bloco
**sem tarefas não conta como entregue**.

`tasksBeyond` compara strings ISO (`tk.end > deliveryDate`), o que é válido para
`yyyy-mm-dd` — ordem lexicográfica coincide com ordem cronológica. Não troque por
comparação de `Date` sem motivo.

### 7.5 `getPeopleProgress`

Casa tarefa e pessoa por **nome** (`tk.who.trim() === p.name.trim()`), filtra quem
tem `total > 0` e ordena por `pct` desc, desempatando por `total` desc.
Recalcula sozinho conforme tarefas entram e saem.

---

## 8. Telas e componentes

### 8.1 Shell (`app/page.tsx`)

Mantém `view` e `sub` em `useState` — **não há roteamento**, é uma SPA de página
única. `TITLES: Record<View, [string, string]>` guarda título e subtítulo de cada
tela. Enquanto `loading`, renderiza `<Loader/>` no lugar do conteúdo. Os 5 modais
e o `DbErrorToast` ficam sempre montados (cada um decide se aparece).

### 8.2 Quadro de execução (`board`)

`BoardControls` (exportado de `BoardView.tsx`) renderiza o toggle Kanban/Por área
e 4 filtros. Detalhe do filtro de responsável: as opções são a união de pessoas
cadastradas (menos "A definir") **e** nomes que já aparecem em `tk.who` — isso
preserva valores legados como "Jurídico", que não é uma pessoa cadastrada.

`KanbanBoard` implementa drag-and-drop com a API HTML5 nativa (`draggable`,
`onDragStart`, `onDragOver`, `onDrop`), estado local `dragId`/`overCol`, e chama
`moveTask(id, status)` no drop. `onDragLeave` só limpa o destaque se o ponteiro
realmente saiu da coluna (`!e.currentTarget.contains(e.relatedTarget)`).

> Testar drag-and-drop HTML5 headless é pouco confiável. Valide despachando
> `DragEvent`s manualmente com um `DataTransfer`, ou teste `moveTask` direto.

`TaskCard` mostra descrição, datas, dependência, área e avatar do responsável.
**Bloco e prioridade foram deliberadamente removidos do card** — seguem no
detalhe. Não os traga de volta sem pedido explícito.

### 8.3 Blocos (`blocks`)

`BlocosView` tem dois modos no mesmo componente, controlados por
`detailId: string | null`: lista de cards e detalhe de um bloco. Consome
`getBlocks` e `getBlocksSummary`. O rodapé mostra o **total de dias somado dos
blocos** — número dinâmico, não os 90 fixos.

### 8.4 Dashboard (`dash`)

4 `KpiCard` + `getAreaDist` (barra empilhada + legenda) + `getBlocks` (semáforo) +
`getPeopleProgress` (barras de conclusão por pessoa) + `getRisks` (travas).

A barra de progresso usa um truque de gradiente: o fundo é maior que o elemento e
`backgroundSize` é ajustado para que o gradiente inteiro corresponda a 100%,
mantendo a cor consistente em qualquer percentual.

```tsx
backgroundImage: "linear-gradient(90deg, #564FFD 0%, #8B5CF6 45%, #D11174 100%)",
backgroundSize: `${p > 0 ? 10000 / p : 100}% 100%`,
```

### 8.5 Visão do patrocinador (`sponsor`)

A tela mais complexa. Componentes internos: `MilestoneCard` (timeline com caixas
alternadas e rabicho rotacionado 45°), `RingCard` genérico, `CountdownRing`
(dias restantes) e `ConclusionRing` (% de conclusão). Os anéis usam
`stroke-dasharray`/`strokeDashoffset` em SVG.

**Detalhe de hidratação:** `todayIso` é preenchido num `useEffect`, não no render
inicial. Isso é intencional — calcular a data no render causaria divergência entre
servidor e cliente. Enquanto `todayIso` é `""`, `heroMilestone` é `null` e os
anéis não renderizam. Não "simplifique" movendo a data para o render.

Os dois anéis são **irmãos** do card de cabeçalho, num flex row — não filhos dele.
Já foram colocados dentro e o `overflow-hidden` do card cortava a legenda.

### 8.6 Pessoas & papéis (`people`)

Três seções num componente: tabela de pessoas, **Áreas** e **Fases do roadmap**
(estas duas com `SectionHead({title, onAdd, addLabel})`). Os pesos de fonte aqui
foram deliberadamente suavizados (semibold em vez de extrabold) — foi pedido
explicitamente. Não "reforce" a tipografia desta tela.

### 8.7 Modais

Padrão comum a todos os cinco: overlay `.modal-overlay` que fecha no clique,
painel `.modal-panel` com `stopPropagation`, `useEffect` sincronizando o
formulário quando o modal abre, e exclusão em dois passos (`confirmDelete`).

Regras de validação e de exclusão:

| Modal | Exige | Guarda de exclusão |
|---|---|---|
| `TaskModal` | `desc` não vazia | livre |
| `BlockModal` | `name` não vazio | livre; avisa que N tarefas ficam sem bloco |
| `PersonModal` | `name` não vazio | livre; avisa que N tarefas ficam sem responsável no seletor |
| `AreaModal` | `name` não vazio | **bloqueada** se a área tem tarefas; avisa que N pessoas ficam sem área |
| `PhaseModal` | `name` não vazio | **bloqueada** se a fase tem blocos |

As duas exclusões bloqueadas espelham chaves estrangeiras que o banco barraria
(`tasks.area_id` é `NOT NULL`; `blocks.phase_id` referencia `phases`). A UI evita
o erro em vez de deixar o banco recusar.

Comportamentos específicos:

- `TaskModal` — nova tarefa vem com `area = areas[0]?.id`, `status: "backlog"`,
  `prio: "media"`. Em modo edição, se a tarefa não existir mais, retorna `null`
  (fecha silenciosamente).
- `BlockModal` — o input de fim tem `min={form.start}` e mostra a duração
  calculada ao vivo. Se `end < start`, exibe aviso **e no submit corrige**
  `end := start` (não bloqueia o salvamento).
- `PhaseModal` — se `short` está vazio, deriva do nome: parte antes de `·`
  (`"v1.0 · Base sólida"` → `"v1.0"`).

### 8.8 Export CSV (`lib/exportCsv.ts`)

Separador **`;`** e **BOM UTF-8** — as duas coisas para o Excel em pt-BR abrir
corretamente com acentuação. Escapa células que contenham `"`, `;` ou `\n`.
Exporta datas em **ISO**, não em `dd/mm/aaaa` (é dado, não exibição). O `Topbar`
passa as tarefas filtradas quando há filtro ativo.

### 8.9 Tema e estilo

Duas fontes de verdade que precisam ficar em sincronia: `tailwind.config.ts`
(classes) e `lib/theme.ts` (objeto `THEME`, para cor em `style` inline — SVG
stroke, gradiente, etc.). Ao mudar uma cor de token, mude nos dois.

Fundo geral: `#f6f6f6` (em `tailwind.config.ts` como `bg` e `line3`, em
`THEME.bg`, e no `body` de `globals.css`). Primária laranja `#FF6636`.

`whoAvatar(name)` em `theme.ts` deriva cor de avatar de forma determinística:
`AVATAR_PALETTE[name.charCodeAt(0) % 10]`, devolvendo `{avBg, avColor}`. Nome
vazio recebe cinza.

---

## 9. Banco de dados

### ⚠️ Dois bancos diferentes usam o schema `meu_inc_app`

| Banco | Schema | O que é | Como acessar |
|---|---|---|---|
| `dpto_processo_superapp` | `meu_inc_app` | **Banco do app** | só pelo servidor Next (`/api/data`) |
| `dpto_processos` | `meu_inc_app` | Espelho standalone | só via conector Pipedream |

Regra crítica para o conector Pipedream: **use sempre `dpto_processos`**. A role
da conexão (`grp_processos`) só tem `CONNECT` nesse banco; os demais retornam
`permission denied`. Confirme com `SELECT current_database();` antes de operar. O
conector **não aceita scripts multi-statement** — um comando por vez.

Confundir os dois é o erro mais fácil de cometer neste repositório.

### 9.1 As 8 tabelas (`db/schema-pgadmin.sql`)

| Tabela | Colunas relevantes | Escrita pela API |
|---|---|---|
| `areas` | `id, name, color, sort_order` | sim |
| `statuses` | `id, name, sub, color, soft, light, sort_order` | **não** |
| `priorities` | `id, label, bg, text_color, sort_order` | **não** |
| `phases` | `id, name, short, sort_order` | sim |
| `blocks` | `id, name, theme, start_date, end_date, color, phase_id, sort_order` | sim |
| `project` | `id boolean pk check(id), start_date, total_days` | **não** |
| `people` | `id, name, role, responsibility, area_id, sort_order` | sim |
| `tasks` | `id, description, area_id, block_id, who, priority_id, status_id, start_date, end_date, dependency, created_at, updated_at` | sim |

Mais 3 índices (`tasks.area_id`, `tasks.status_id`, `tasks.block_id`) e o trigger
`trg_tasks_updated_at`, que chama `set_updated_at()` em cada `UPDATE`.

### 9.2 Chaves estrangeiras — o que cada uma implica

```
tasks.area_id     → areas(id)      NOT NULL, sem on delete
                    ⇒ sem nenhuma área cadastrada, é impossível criar tarefa
                    ⇒ excluir área com tarefas falha (a UI bloqueia antes)
tasks.status_id   → statuses(id)   NOT NULL
tasks.priority_id → priorities(id) NOT NULL, default 'media'
                    ⇒ statuses e priorities precisam estar populadas ou nada funciona
tasks.block_id    → blocks(id)     nullable, SEM on delete
                    ⇒ apagar bloco exige soltar as tarefas ANTES, no mesmo lote
blocks.phase_id   → phases(id)     nullable
                    ⇒ excluir fase com blocos falha (a UI bloqueia antes)
people.area_id    → areas(id)      ON DELETE SET NULL
                    ⇒ excluir área desvincula as pessoas automaticamente
```

### 9.3 Ordem de criação em banco novo

1. **`db/schema-pgadmin.sql`** — estrutura. Sem RLS nem policies (aquilo era
   específico do Supabase e daria erro em Postgres comum). A ordem das tabelas já
   respeita as FKs, roda de uma vez.
2. **`db/seed-pgadmin.sql`** — carga mínima:
   - `statuses` e `priorities` são **obrigatórias** (FK). Os ids têm de ser
     exatamente os do seed, porque o app lê nome e cor de `lib/data.ts` e casa
     pelo id.
   - `areas` e `phases` são recomendadas: sem área, a tela de nova tarefa não tem
     o que selecionar.
   - Pessoas, blocos e tarefas **não** entram — são conteúdo do projeto, criados
     pela interface.

No pgAdmin, antes de cada arquivo: `set search_path to meu_inc_app;`

### 9.4 Ordem FK-segura para apagar dados

```
tasks → blocks → phases → people → areas
```

Preserve `statuses` e `priorities` (são referência, não conteúdo).

### 9.5 As cores no banco não são usadas

`statuses.color`/`soft` e `priorities.bg`/`text_color` existem no banco, mas o app
lê essas cores de `lib/data.ts` (`STATUSES`, `PRIO`), casando apenas pelo `id`.
Os valores do banco e do código **já divergem** hoje. Não perca tempo
sincronizando: a fonte de verdade visual é `data.ts`.

---

## 10. Configuração e execução

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
```

### Variáveis de ambiente

Nenhuma tem prefixo `NEXT_PUBLIC_`, de propósito. Modelo em `.env.example`; para
rodar local, copie para `.env.local` (gitignored).

| Variável | Obrig. | Função |
|---|---|---|
| `PGHOST` | sim¹ | host |
| `PGPORT` | não | porta (padrão 5432) |
| `PGDATABASE` | sim¹ | banco |
| `PGUSER` | sim¹ | usuário |
| `PGPASSWORD` | sim¹ | senha |
| `DATABASE_URL` | sim¹ | alternativa às cinco acima |
| `PGSSLMODE` | não | `require` (padrão) · `verify-ca` · `verify-full` · `disable` |
| `PGSCHEMA` | não | schema (padrão `meu_inc_app`) |
| `PGPOOL_MAX` | não | conexões por instância (padrão 4) |

¹ Ou as `PG*` separadas, **ou** `DATABASE_URL`. Com `PGHOST` definido, ele tem
preferência — evita problema de escape de senha na URL.

Sem `PGHOST` e sem `DATABASE_URL`: modo demo.

### Diagnóstico

```bash
curl -s http://localhost:3000/api/data?probe=1
# {"configured":true,"schema":"meu_inc_app","database":"…","user":"…",
#  "version":"PostgreSQL 16…","tables":["areas","blocks",…]}
```

### Rede de saída

A porta do Postgres precisa estar liberada **de onde o servidor Next roda**
(Vercel, container, máquina local) — nunca do browser. Ambientes que só liberam
80/443 na saída não alcançam Postgres em 5432/7432; o sintoma é
`Banco inacessível (ETIMEDOUT)` **antes de qualquer handshake**, o que significa
que as credenciais nem foram avaliadas. Não confunda com credencial errada.

---

## 11. Invariantes e armadilhas

Lista de consulta. Cada item já causou ou pode causar bug real.

### Fragilidades do código atual

1. **`decorate()` não tem fallback para status desconhecido.**
   ```ts
   const st = statusMap[tk.status];   // undefined se o id não existir
   statusName: st.name,               // ⇒ TypeError
   ```
   Área tem fallback (`UNKNOWN_AREA`), bloco tem (`"Sem bloco"`), **status não**.
   O mesmo vale para `PRIO[tk.prio || "media"]`: o `|| "media"` cobre string
   vazia, não um valor inválido como `"urgente"`. Se você introduzir status ou
   prioridade nova, atualize `STATUSES`/`PRIO` em `lib/data.ts` **antes** de
   qualquer dado usá-la — senão a tela quebra em runtime, não em compilação
   (os ids vêm do banco como `string` e são convertidos com `as`).

2. **`tk.who` é o NOME da pessoa, não um id.** Não há FK. Renomear pessoa exige
   atualizar as tarefas em cascata (`updatePerson` faz isso). Excluir pessoa
   **não** limpa as tarefas — elas ficam com o nome órfão, e é assim de propósito
   (histórico preservado). Valores como `"Jurídico"` existem e não são pessoas
   cadastradas.

3. **Excluir bloco precisa das duas operações no mesmo lote, nessa ordem.** Fora
   de transação, dá erro `23503`.

4. **Nada de efeito colateral em updater de `setState`.** StrictMode duplica.

### Semânticas que enganam pelo nome

5. `getDelivered` inclui `pronto`, não só `entregue`.
6. `getKpis().andamento` = `execucao` + `validacao` + `pronto` (`pronto` conta nos
   dois lugares).
7. `getGrouped` **omite** áreas sem tarefas; `getAreaDist` também.
8. `getPeopleProgress` **omite** pessoas sem tarefas.
9. `inclusiveDays` é inclusivo: mesmo dia = 1.
10. `daysLeft` negativo = atrasado, não é erro.
11. Bloco sem tarefas nunca é `delivered` na timeline.
12. Bloco sem datas fica com `widthPct: "0%"` — presente no DOM, invisível.

### Regras de plataforma

13. **`export const runtime = "nodejs"`** e **`dynamic = "force-dynamic"`** na rota
    são obrigatórios. Sem o primeiro, `pg` não funciona; sem o segundo, o Next
    serve carga cacheada.
14. **`serverExternalPackages: ["pg"]`** em `next.config.mjs` — o `pg` carrega
    módulos dinamicamente (`pg-native`) e o empacotador tropeça.
15. **`import "server-only"`** no topo de `lib/db/server.ts`. Se algum código de
    cliente importar esse módulo, o build falha — e é isso que queremos.
16. **`sslmode` da URL é removido de propósito.** Ver §5.6.
17. **`todayIso` vem de `useEffect`**, nunca do render. Ver §8.5.

### Convenções

18. Datas: ISO no código/banco/inputs, `dd/mm/aaaa` na tela, só via `fmt()`.
19. Vazio é `""`, não `null`/`undefined`, no modelo do app.
20. Coluna nova exige entrada em `lib/db/tables.ts`.
21. `THEME` e `tailwind.config.ts` andam juntos.
22. Português em tudo, inclusive comentários.

---

## 12. Receitas (como fazer alterações comuns)

### Adicionar um campo a uma entidade existente

Exemplo: `tasks.estimativa` (número de horas).

1. **Banco:** `alter table meu_inc_app.tasks add column estimativa integer;` e
   registre em `db/schema-pgadmin.sql`.
2. **Contrato:** acrescente `"estimativa"` a `TABLES.tasks.columns` em
   `lib/db/tables.ts`. **Sem isso a API rejeita com 400.**
3. **Tipo de linha:** `estimativa: number | null` em `TaskRow` (`lib/db/rows.ts`).
4. **Tipo do app:** `estimativa: number` em `Task` (`lib/types.ts`) — use `0` como
   vazio, seguindo a convenção.
5. **Mapeadores:** `taskFromRow` (`r.estimativa ?? 0`) e `taskToRow`
   (`estimativa: t.estimativa || null`).
6. **Input:** acrescente a `NewTaskInput` em `lib/store.tsx` e ao `EMPTY`/`toInput`
   de `TaskModal.tsx`.
7. **Formulário:** campo no `TaskModal`.
8. **Exibição:** se for aparecer na tela, o cálculo/formatação vai para
   `derive.ts` (provavelmente `decorate`), nunca no componente.
9. **CSV:** se deve ser exportado, `lib/exportCsv.ts`.
10. Verifique com a sequência da §13.

Pular o passo 2 é o erro mais comum: a tela funciona (estado otimista) e a
gravação falha silenciosamente exceto pelo toast.

### Adicionar uma tabela nova

1. DDL em `db/schema-pgadmin.sql` (respeitando a ordem das FKs).
2. Entrada em `TABLES` com `columns`, `filters` e `orderBy`.
3. Tipo de linha + mapeadores em `lib/db/rows.ts`, e o campo em `Bootstrap`.
4. `loadAll` monta a consulta a partir de `Object.keys(TABLES)` — **não precisa
   mexer no SQL**, ele passa a incluir a tabela automaticamente.
5. Estado + CRUD no store, seguindo o padrão da §6.4.
6. Se for referência somente leitura, **não** coloque em `TABLES` — carregue por
   outro caminho e mantenha fora da superfície de escrita.

### Adicionar uma tela

1. Novo valor em `View` (`lib/types.ts`).
2. Entrada em `TITLES` (`app/page.tsx`) e no render condicional.
3. Item em `PROJECT_NAV` ou `SUPPORT_NAV` (`components/Sidebar.tsx`) com um ícone
   de `components/icons.tsx`.
4. Se o `Topbar` precisar de botão próprio, acrescente a flag lá.
5. A tela consome funções de `derive.ts`. Se o dado ainda não existe, crie a
   função **lá**, com interface de retorno declarada.

### Adicionar um cálculo/indicador

Só em `derive.ts`: função exportada, pura, com `interface` de retorno, recebendo
`areas`/`phases` por parâmetro se depender delas. Depois consuma no componente.

### Mexer no pipeline de status

`STATUSES` em `lib/data.ts` (a ordem do array é a ordem das colunas) **e** uma
linha em `statuses` no banco com o mesmo `id`. Reveja as funções que citam ids
literalmente: `getKpis` (`andamento`, `entregue`), `getDelivered`,
`decisionTasks`, `getBlocks` (`done`), `getPeopleProgress`. Um `grep -rn
'"entregue"\|"pronto"\|"execucao"' lib/` encontra os pontos.

### Wipe de dados preservando integridade

Ordem da §9.4, preservando `statuses` e `priorities`. Depois valide com um insert
que **deve** falhar por FK.

---

## 13. Como verificar seu trabalho

Sequência mínima, na ordem (cada uma pega uma classe distinta de erro):

```bash
npx tsc --noEmit     # tipos
npm run lint         # ESLint (next lint)
npm run build        # build de produção; pega erro de server/client boundary
```

Para mudanças na camada de dados, teste contra um Postgres real — o container
pode não alcançar o banco de produção, mas dá para subir um local:

```bash
# 1. cluster local (initdb precisa rodar como usuário postgres; socket em caminho
#    CURTO, porque o limite do socket unix é 107 bytes)
su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /caminho/pgdata -A trust -U postgres"
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /caminho/pgdata -l /caminho/pg.log \
  -o '-p 55432 -k /tmp/pgs -c listen_addresses=127.0.0.1' start -w"

# 2. schema + seed com os próprios scripts versionados
createdb -h 127.0.0.1 -p 55432 -U postgres dpto_processo_superapp
psql … -c "create schema meu_inc_app;" \
       -c "set search_path to meu_inc_app;" -f db/schema-pgadmin.sql
psql … -c "set search_path to meu_inc_app;" -f db/seed-pgadmin.sql

# 3. aponte .env.local para ele (PGSSLMODE=disable) e exercite a API
curl -s 'http://127.0.0.1:3000/api/data?probe=1'
curl -s -X POST http://127.0.0.1:3000/api/data -H 'content-type: application/json' \
  -d '{"ops":[{"op":"insert","table":"areas","values":{"id":"x","name":"X","color":"#000","sort_order":9}}]}'
```

O que vale checar explicitamente:

- **Persistência real:** crie pela interface e confirme com `SELECT`. Recarregue a
  página e veja se sobrevive.
- **Rollback:** um lote cuja 2ª operação falha não pode deixar a 1ª gravada.
- **Validação:** tabela fora da whitelist, coluna não gravável, filtro não
  permitido, valor não primitivo → todos `400`.
- **Injeção:** um valor como `O'Brien "x"; drop table tasks; --` deve gravar como
  texto literal.
- **Os 3 estados de conexão:** com banco → **Ao vivo**; sem env → **Modo demo**
  sem aviso; com env e banco inalcançável → **Modo demo** + aviso com o motivo.
  Em nenhum caso a tela pode ficar vazia.
- **Vazamento no bundle:** `grep -r "<senha>\|<host>" .next/static` não pode
  achar nada.

Para UI, Playwright com o Chromium pré-instalado:

```js
chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] })
```

Armadilhas de teste já encontradas: escope seletores a `.modal-panel` (os filtros
do quadro ficam atrás do overlay e casam primeiro); use `page.locator("h3", {
hasText })` em vez de `getByText().first()` (o segmento de timeline de largura
zero casa antes do card).

---

## 14. O que NÃO está implementado

Saiba disto antes de "consertar" algo que nunca existiu.

1. **Não há autenticação.** Qualquer um que abra a página pode escrever via
   `/api/data`. Era assim no Supabase também (policies `using(true)`).
2. **A tabela `project` é praticamente morta.** `PROJECT` em `lib/data.ts`
   (`startDate`, `totalDays: 90`) não é editável nem persistido, e o app não lê a
   tabela. Hoje pesa pouco, porque o período é derivado das datas dos blocos e
   `PROJECT` só serve de fallback em `blocksWindow` quando nenhum bloco tem data.
   Decisão pendente: tornar editável ou remover.
3. **Rodapé da sidebar é fixo** — "Gustavo · Product Owner" está no código, não
   vem de `people`.
4. **Não há roteamento.** `view` é `useState`; não há URL por tela, nem deep link,
   nem histórico do navegador.
5. **Não há testes automatizados no repositório.** Nenhum runner configurado. A
   verificação é a da §13, manual.
6. **`db/seed.sql` está defasado** — usa a coluna `blocks.days`, substituída por
   `start_date`/`end_date`. Esse arquivo descreve o espelho `dpto_processos`, não
   o banco do app.
7. **`docs/SUPABASE.md` e `db/supabase.sql` são histórico.** Não descrevem o
   comportamento atual. A documentação válida do banco é `docs/POSTGRES.md`.
8. **Não há paginação, nem virtualização, nem índice de busca.** Tudo é carregado
   e filtrado em memória. Adequado à escala atual (dezenas de tarefas); se o
   volume crescer para milhares, essa é a primeira coisa a repensar.

# Banco de dados — Meu INC App

> **Regra número 1:** este projeto usa **sempre** o banco **`dpto_processos`**,
> schema **`meu_inc_app`**. Nunca outro banco. Detalhe do porquê abaixo.

## Qual banco acessar (e por quê)

O servidor PostgreSQL hospeda **vários bancos**, um por departamento:

| Banco                         | Dono (owner)               | Esta conexão acessa? |
|-------------------------------|----------------------------|:--------------------:|
| **`dpto_processos`**          | `grp_processos`            | ✅ **SIM (este)**    |
| `dpto_comercial`              | `grp_comercial`            | ❌ não               |
| `dpto_contabilidade_serpro`   | `grp_contabilidade_serpro` | ❌ não               |
| `dpto_projeto_executivo`      | `grp_projeto_executivo`    | ❌ não               |
| `dpto_ti_igordemolinari`      | `grp_ti_igordemolinari`    | ❌ não               |
| `coolify`, `n8n`, `postgres`  | `pgvector`                 | ❌ não               |

A conexão do projeto (conector **Pipedream · PostgreSQL**) autentica como a role
**`grp_processos`**, que possui privilégio `CONNECT` **exclusivamente** em
`dpto_processos`. Os demais bancos existem no mesmo servidor, mas são isolados
por departamento — tentar acessá-los nesta conexão retorna
`permission denied` / `FATAL: ... connection`.

> Ou seja: a resposta para *"nessa mesma conexão pode ter outro banco?"* é —
> o **servidor** tem outros bancos, mas esta **conexão** só enxerga e só deve
> operar em `dpto_processos`. Toda a estrutura do app vive no schema
> `meu_inc_app` dentro dele.

### Como confirmar em runtime

```sql
SELECT current_database();   -- deve retornar: dpto_processos
SELECT current_user;         -- deve retornar: grp_processos
```

Se `current_database()` não for `dpto_processos`, **pare** — a conexão está
errada.

## Estrutura

Todo o conteúdo do projeto fica no schema **`meu_inc_app`**, alinhado à
**estratégia de blocos ("bifes")**: o projeto é fatiado em blocos temáticos
com prazo próprio em dias; a soma dos blocos fecha o período do projeto
(90 dias). Blocos substituem as antigas fases (v1.0–v4.0); o controle de fase
é por entrega, via pipeline de status de cada tarefa.

| Objeto                          | Tipo    | Papel                                                        |
|---------------------------------|---------|--------------------------------------------------------------|
| `areas`                         | tabela  | Áreas (dev, jurídico, cobrança, financeiro, parcerias)       |
| `statuses`                      | tabela  | 7 status do fluxo (discovery → entregue)                     |
| `priorities`                    | tabela  | Prioridades (alta, média, baixa)                             |
| `blocks`                        | tabela  | Blocos/"bifes" (nome, tema, dias, cor, ordem na timeline)    |
| `project`                       | tabela  | Período do projeto — linha única (início + total de dias)    |
| `people`                        | tabela  | Time & papéis                                                |
| `tasks`                         | tabela  | Tarefas do quadro (FKs para áreas/blocos/status/prioridades) |
| `v_tasks`                       | view    | Tarefa "decorada" (nomes já resolvidos por JOIN)             |
| `trg_tasks_updated_at`          | trigger | Mantém `tasks.updated_at` automaticamente no UPDATE          |

O mapeamento é 1:1 com os tipos de `lib/types.ts` e os dados de `lib/data.ts`:

- `Bloco`        → `blocks` (id, name, theme, days, color)
- `PROJECT`      → `project` (start_date, total_days)
- `Task.area`    → `tasks.area_id`   → `areas.id`
- `Task.blockId` → `tasks.block_id`  → `blocks.id` (`""` no app ↔ `NULL` no banco)
- `Task.prio`    → `tasks.priority_id` → `priorities.id`
- `Task.status`  → `tasks.status_id` → `statuses.id`
- `Task.who` / `Task.dep` → `tasks.who` / `tasks.dependency` (texto livre)

> `tasks.who` é texto livre e **não** é FK para `people` — nem todo responsável
> é uma pessoa cadastrada (ex.: `"Jurídico"`), espelhando o comportamento atual
> do app.

> **Histórico:** a primeira versão do schema tinha `phases` (v1.0–v4.0) e
> `tasks.phase_id`. Em 2026-07-16, após o merge da estratégia de blocos
> (PR #1), o banco foi migrado: criada `blocks` + `tasks.block_id`, tarefas
> re-mapeadas, view recriada, e `phases`/`phase_id` removidos.

## Como (re)criar a estrutura

```bash
# 1) estrutura (schema, tabelas, índices, trigger, view) — idempotente
psql "$DATABASE_URL" -f db/schema.sql

# 2) carga inicial (referência + blocos + projeto + demo) — idempotente
psql "$DATABASE_URL" -f db/seed.sql
```

Ou, via conector Pipedream, execute os statements de `db/schema.sql` e
`db/seed.sql` um a um (o conector não aceita scripts multi-statement).

Os arquivos `db/schema.sql` e `db/seed.sql` são a **fonte da verdade** da
estrutura e devem ser versionados junto com qualquer alteração de modelo.

## Ligar o app ao banco

Hoje o app lê dados **estáticos** de `lib/data.ts` com estado em memória
(`lib/store.tsx`). Para persistir de verdade, troque as constantes/handlers por
chamadas que leiam de `meu_inc_app.v_tasks` / `meu_inc_app.blocks` /
`meu_inc_app.project` e escrevam em `meu_inc_app.tasks` / `meu_inc_app.blocks`,
mantendo os tipos de `lib/types.ts`. Nenhuma credencial deve ser commitada —
use variáveis de ambiente (`DATABASE_URL`) fora do repositório.

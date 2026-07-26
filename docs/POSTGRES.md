# Banco do app — PostgreSQL

O painel lê e grava num **PostgreSQL comum**, no schema **`meu_inc_app`**.
Sem as variáveis de ambiente do banco, o app sobe em **modo demo** com os dados
estáticos de `lib/data.ts` (nada é salvo).

> Antes o banco do app era o Supabase (PostgREST direto do browser). Trocamos
> por Postgres puro — o que muda de arquitetura está em
> [Por que existe a rota /api/data](#por-que-existe-a-rota-apidata).
> `docs/SUPABASE.md` e `db/supabase.sql` ficaram como histórico.

---

## 1. Variáveis de ambiente

Nenhuma tem o prefixo `NEXT_PUBLIC_`, de propósito: **a credencial fica só no
servidor** e nunca entra no bundle do browser. Modelo completo em
`.env.example`; para rodar local, copie para `.env.local` (que está no
`.gitignore`).

| Variável | Obrigatória | Para que serve |
|---|---|---|
| `PGHOST` | sim¹ | Host do Postgres |
| `PGPORT` | não | Porta (padrão `5432`) |
| `PGDATABASE` | sim¹ | Nome do banco |
| `PGUSER` | sim¹ | Usuário |
| `PGPASSWORD` | sim¹ | Senha |
| `DATABASE_URL` | sim¹ | Alternativa às cinco acima, numa string só |
| `PGSSLMODE` | não | `require` (padrão), `verify-ca`, `verify-full`, `disable` |
| `PGSCHEMA` | não | Schema das tabelas (padrão `meu_inc_app`) |
| `PGPOOL_MAX` | não | Conexões por instância (padrão `4`) |

¹ Ou as variáveis `PG*` separadas, **ou** `DATABASE_URL`. Quando `PGHOST` está
definido, ele tem preferência — evita dor de cabeça com escape de senha na URL.

### Armadilha do `sslmode` — leia antes de debugar conexão

O `pg` (node-postgres) **não** segue a semântica do libpq: `?sslmode=require`
numa connection string é tratado como **`verify-full`**, isto é, ele valida a
cadeia do certificado. Num Postgres self-hosted com certificado autoassinado
isso derruba a conexão com:

```
error: self-signed certificate (DEPTH_ZERO_SELF_SIGNED_CERT)
```

…que parece credencial errada, mas não é. Por isso `lib/db/server.ts` **remove
`sslmode` da connection string** e decide o TLS só por `PGSSLMODE`:

| `PGSSLMODE` | Comportamento |
|---|---|
| `require` (padrão) | Cifra a conexão **sem** validar o certificado — igual ao libpq/pgAdmin. É o que funciona com certificado autoassinado. |
| `verify-ca` / `verify-full` | Cifra **e** valida a cadeia. Use quando houver CA de verdade. |
| `disable` | Sem TLS. |

## 2. Criar a estrutura num banco novo

Rode nesta ordem, no banco de destino (pgAdmin → Query Tool, ou `psql`):

1. **`db/schema-pgadmin.sql`** — as 8 tabelas, chaves, índices e o trigger de
   `updated_at`. Descomente as duas primeiras linhas se quiser que o próprio
   script crie o schema.
2. **`db/seed-pgadmin.sql`** — carga mínima de referência:
   - `statuses` e `priorities` são **obrigatórias**: `tasks.status_id` e
     `tasks.priority_id` têm chave estrangeira para elas, então sem essas
     linhas nenhuma tarefa pode ser criada. Os ids têm de ser exatamente os do
     seed, porque o app pega nome/cor de `lib/data.ts` e casa pelo id.
   - `areas` e `phases` são recomendadas: `tasks.area_id` é `NOT NULL` e aponta
     para `areas(id)`, então sem nenhuma área a tela de nova tarefa não tem o
     que selecionar. As duas são editáveis depois em "Pessoas & papéis".

   Pessoas, blocos e tarefas **não** entram no seed — são conteúdo do projeto e
   se criam pela interface.

No pgAdmin, defina o schema antes de rodar cada arquivo:

```sql
set search_path to meu_inc_app;
```

## 3. Conferir a conexão

Com o app rodando, há um endpoint de diagnóstico:

```bash
curl -s http://localhost:3000/api/data?probe=1
```

```json
{
  "configured": true,
  "schema": "meu_inc_app",
  "database": "dpto_processo_superapp",
  "user": "rafael.brasil",
  "version": "PostgreSQL 16.13 …",
  "tables": ["areas","blocks","people","phases","priorities","project","statuses","tasks"]
}
```

`"configured": false` significa que o servidor não tem `PGHOST` nem
`DATABASE_URL` — o app está em modo demo.

Na tela, o selo ao lado do título diz **Ao vivo** (verde) ou **Modo demo**
(âmbar). Se o banco estiver configurado mas inacessível, aparece um aviso com o
motivo — modo demo silencioso já custou tempo de depuração.

### Rede de saída

A porta do Postgres precisa estar liberada **de onde o servidor Next roda**
(Vercel, container, máquina local) — não do browser. Ambientes que só liberam
80/443 na saída não conseguem falar com Postgres em `5432`/`7432`; o sintoma é
`Banco inacessível (ETIMEDOUT)`.

## 4. Por que existe a rota `/api/data`

Postgres fala um protocolo binário sobre TCP; o browser não fala isso, e
mandar credencial de banco para o cliente estaria fora de questão de qualquer
forma. Então o front nunca toca no banco:

```
componentes → lib/store.tsx → lib/db/client.ts
                                    │ fetch
                                    ▼
                          app/api/data/route.ts        (servidor)
                                    │
                          lib/db/server.ts  ──pg──►  PostgreSQL
```

| Arquivo | Papel |
|---|---|
| `lib/db/tables.ts` | Contrato: tabelas, colunas graváveis e colunas de filtro. **Único** lugar de onde saem identificadores SQL. |
| `lib/db/rows.ts` | Mapeadores banco ⇄ tipos do app. Puros, rodam nos dois lados. |
| `lib/db/server.ts` | Pool, carga, escritas, validação. `server-only`. |
| `lib/db/client.ts` | `loadAll()` e `mutate()` por `fetch`. |
| `app/api/data/route.ts` | `GET` carga · `GET ?probe=1` diagnóstico · `POST` escritas. |

### Carga em uma ida só

`GET /api/data` traz as 5 tabelas numa única consulta, montando cada uma como
array JSON no próprio Postgres (`json_agg`). Uma conexão, um round-trip — e as
colunas `date` chegam como string ISO (`"2026-08-01"`) em vez de virar objeto
`Date` no driver, que era o formato que os mapeadores já esperavam.

### Escritas em lote, na ordem, em transação

`POST /api/data` recebe `{ ops: [...] }` e executa **na ordem, dentro de uma
transação**. Isso não é enfeite: apagar um bloco exige antes soltar as tarefas
dele, porque `tasks.block_id` referencia `blocks(id)` sem `on delete`. Como duas
requisições HTTP separadas, a ordem não é garantida e o delete falha por chave
estrangeira; no mesmo lote, ou as duas acontecem ou nenhuma.

```jsonc
{ "ops": [
  { "op": "update", "table": "tasks",  "values": { "block_id": null },
    "where": { "column": "block_id", "value": "b_x" } },
  { "op": "delete", "table": "blocks", "where": { "column": "id", "value": "b_x" } }
]}
```

Respostas: `200 {"ok":true}` · `400` payload inválido · `503` erro do banco.

### Exposição

O painel não tem login — e também não tinha no Supabase, onde as policies eram
`using(true)` para o papel anônimo. O que melhorou é que a credencial saiu do
browser e a rota só aceita as tabelas/colunas de `lib/db/tables.ts`, com todos
os **valores parametrizados** (`$1`, `$2`…). Tabelas de referência
(`statuses`, `priorities`, `project`) não estão na lista: são somente leitura
pela API. Se um dia entrar autenticação, o lugar do gate é
`app/api/data/route.ts`.

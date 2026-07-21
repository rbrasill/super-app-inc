# Supabase — banco ao vivo do app

O painel conecta a um projeto **Supabase** (Postgres) direto do navegador, via
`@supabase/supabase-js`. Este é o banco **de produção do app** (persiste as
alterações). O `dpto_processos` (conector Pipedream, ver `docs/DATABASE.md`)
foi o espelho inicial standalone — a aplicação em si agora usa o Supabase.

## Projeto

- **Nome:** App INC
- **Ref:** `ntmjovdzzmpdvsvpacil` · região `sa-east-1`
- **URL:** `https://ntmjovdzzmpdvsvpacil.supabase.co`
- **Schema:** `public` (a API PostgREST do Supabase expõe o `public`)

## Variáveis de ambiente

O cliente lê duas variáveis **públicas** (viram bundle do navegador — é o
esperado para a *publishable key*):

```
NEXT_PUBLIC_SUPABASE_URL=https://ntmjovdzzmpdvsvpacil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```

- Local: copie `.env.example` para `.env.local` e preencha (o `.env.local` é
  git-ignored — a chave **não** vai para o repositório, então quem clonar o
  repo precisa criar o próprio `.env.local`).
- **Vercel:** adicione as duas variáveis em *Project → Settings → Environment
  Variables* (para Production e Preview). Sem elas, o app funciona em modo
  demo (dados estáticos em memória) — não quebra, só não persiste.
- ⚠️ **Variáveis `NEXT_PUBLIC_*` são congeladas no *build*.** Se adicionar/alterar
  as env no Vercel, é preciso **refazer o deploy** para o novo valor entrar no
  bundle — atualizar a variável sem redeploy não tem efeito.

## Como saber se está conectado (modo ao vivo × demo)

O cabeçalho do app mostra um selo ao lado do título:

- 🟢 **Ao vivo** — conectado ao Supabase; criar/editar/excluir persiste no banco.
- 🟠 **Modo demo** — sem env (ou a carga falhou); dados só em memória, **nada é
  salvo** e as alterações somem ao recarregar.

Se uma gravação falhar, aparece um aviso "Falha ao salvar no banco" com a
mensagem do erro (também logado no console do navegador com o prefixo
`[supabase]`). Ou seja: se você criou um bloco/apagou uma tarefa e ao recarregar
voltou tudo, confira o selo — provavelmente está em **Modo demo** (faltam as env
no ambiente em que você está testando).

## Como o app usa

- `lib/supabase.ts` cria o cliente (ou `null` se faltar env) e faz o
  mapeamento banco ↔ tipos (`taskFromRow`/`taskToRow`, etc.).
- `lib/store.tsx`:
  - Na montagem, se o Supabase está configurado, carrega `tasks`, `blocks` e
    `people` do banco. Enquanto carrega, mostra "Carregando dados…".
  - Cada alteração (criar/editar/excluir/mover tarefa e bloco; CRUD de
    pessoas) atualiza a tela na hora e persiste no Supabase em segundo plano.
  - **Fallback:** se não houver env, ou a carga falhar/estourar 8s, o app cai
    nos dados estáticos de `lib/data.ts` (modo demo) — nunca fica travado.

## RLS (segurança)

RLS ligado em todas as tabelas:

- Referência (`areas`, `statuses`, `priorities`, `phases`): **só leitura** para
  `anon`/`authenticated` (o app não escreve nelas).
- Dados do projeto (`blocks`, `tasks`, `people`, `project`): **leitura +
  escrita** para `anon`/`authenticated`.

⚠️ Como não há login, qualquer pessoa com a publishable key (que é pública)
pode alterar os dados. Aceitável para um painel interno/demo. Para travar:
adicionar autenticação (Supabase Auth) e restringir as políticas ao usuário
logado, ou mover as escritas para rotas de servidor com a service key.

## Estrutura e carga

DDL + RLS versionados em `db/supabase.sql`. A carga inicial espelha
`lib/data.ts` (5 áreas, 7 status, 3 prioridades, 4 fases, 4 blocos, projeto de
90 dias, 10 pessoas, 24 tarefas). Ids em texto (`t*`, `b*`, `p*`); novas linhas
recebem id gerado no cliente.

# Meu INC App — Painel do projeto

Migração do protótipo `Meu INC App (Nocturne).html` para **Next.js (App Router) + TypeScript + Tailwind CSS**.

Painel de página única com 5 visões:

| Visão | Rota interna | Conteúdo |
|-------|--------------|----------|
| Quadro de execução | `board` | Kanban (7 status) ou tabela por área |
| Blocos (bifes) | `blocks` | Estratégia de blocos: timeline de encaixe nos 90 dias, checkpoints semanais, semáforo e distribuição por área de cada bloco |
| Dashboard geral | `dash` | KPIs, distribuição por área, andamento por bloco, travas |
| Visão do patrocinador | `sponsor` | Resumo executivo, semáforo por bloco, decisões, entregas |
| Pessoas & papéis | `people` | Tabela do time |

## Estratégia de blocos ("bifes")

O projeto é fatiado em **blocos temáticos** — o "boi" (o app) separado em "bifes".
Cada bloco entrega o pacote completo do seu tema (tela + back + regra + cadastro),
tem um prazo próprio em dias e a soma dos blocos fecha o período de 90 dias.

- **Blocos são editáveis em tempo de execução**: adicione quantos quiser, edite, reordene ou exclua (`components/BlockModal.tsx`).
- Ao **excluir um bloco**, suas tarefas não são apagadas — ficam "sem bloco".
- A **timeline de encaixe** posiciona cada bloco no período e marca as ~13 semanas de checkpoint.
- O **controle de fase é por entrega**: o estágio de cada tarefa (pipeline de status)
  alimenta o progresso e o semáforo de cada bloco.
- A semente inicial dos blocos e o período do projeto ficam em `lib/data.ts` (`BLOCKS`, `PROJECT`).

## Estrutura

```
app/
  layout.tsx      # fontes (Manrope + Space Grotesk) e metadata
  page.tsx        # shell + estado (view/sub) e composição das views
  globals.css     # Tailwind + reset + scrollbar
components/        # Sidebar, Topbar, Dashboard, SponsorView, PeopleGrid, board/*
lib/
  data.ts         # STATUSES, AREAS, BLOCKS, PROJECT, PRIO, TASKS, pessoas (estático)
  derive.ts       # lógica derivada (board, grouped, kpis, blocos, riscos...)
  theme.ts        # tokens de cor (para uso em style inline)
  types.ts        # tipos TypeScript
tailwind.config.ts # tokens do tema "Nocturne" (cores, fontes, sombras)
```

Os dados são **estáticos e tipados** em `lib/data.ts`. Para integrar com backend depois,
basta trocar as constantes por chamadas de fetch mantendo o formato dos tipos em `lib/types.ts`.

## Deploy no Vercel

1. Suba esta pasta (`meu-inc-app/`) para um repositório Git (GitHub/GitLab) **ou** use `vercel` CLI / o upload de pasta no dashboard do Vercel.
2. No Vercel, o framework é detectado automaticamente como **Next.js** — não precisa configurar build.
   - Build Command: `next build` (padrão)
   - Install Command: `npm install` (padrão)
   - Output: gerenciado pelo Next.js
3. Deploy. Pronto.

## Rodar localmente (opcional)

```bash
npm install
npm run dev      # http://localhost:3000
```

## Funcionalidades interativas

O estado das tarefas vive em memória (`lib/store.tsx`) e reinicia ao recarregar a página — ideal para simulação/demo.

- **Busca** — filtra por descrição, responsável e dependência.
- **Filtros de Área e Bloco** — no Quadro, com "Limpar filtros".
- **Blocos** — adicione/edite/reordene/exclua blocos na visão "Blocos (bifes)".
- **Nova tarefa** — modal com formulário completo (inclui o bloco).
- **Clicar no cartão / linha** — abre o modal de detalhes para **editar** ou **excluir** a tarefa.
- **Exportar** — baixa CSV (respeita filtros ativos).
- **Drag-and-drop** — arraste cartões entre colunas do Kanban para mudar o status.

Para persistir de verdade, ligue `addTask` / `updateTask` / `deleteTask` / `moveTask` e
`addBlock` / `updateBlock` / `deleteBlock` / `moveBlock` (em `lib/store.tsx`)
a uma API ou banco, mantendo o formato dos tipos em `lib/types.ts`.

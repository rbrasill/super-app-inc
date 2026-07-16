# Meu INC App — Painel do projeto

Migração do protótipo `Meu INC App (Nocturne).html` para **Next.js (App Router) + TypeScript + Tailwind CSS**.

Painel de página única com 4 visões:

| Visão | Rota interna | Conteúdo |
|-------|--------------|----------|
| Quadro de execução | `board` | Kanban (7 status) ou tabela por área |
| Dashboard geral | `dash` | KPIs, distribuição por área, fases, travas |
| Visão do patrocinador | `sponsor` | Resumo executivo, semáforo, decisões, entregas |
| Pessoas & papéis | `people` | Tabela do time |

## Estrutura

```
app/
  layout.tsx      # fontes (Manrope + Space Grotesk) e metadata
  page.tsx        # shell + estado (view/sub) e composição das views
  globals.css     # Tailwind + reset + scrollbar
components/        # Sidebar, Topbar, Dashboard, SponsorView, PeopleGrid, board/*
lib/
  data.ts         # STATUSES, AREAS, PHASES, PRIO, TASKS, pessoas (estático)
  derive.ts       # lógica derivada (board, grouped, kpis, fases, riscos...)
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
- **Filtros de Área e Fase** — no Quadro, com "Limpar filtros".
- **Nova tarefa** — modal com formulário completo.
- **Clicar no cartão / linha** — abre o modal de detalhes para **editar** ou **excluir** a tarefa.
- **Exportar** — baixa CSV (respeita filtros ativos).
- **Drag-and-drop** — arraste cartões entre colunas do Kanban para mudar o status.

Para persistir de verdade, ligue `addTask` / `updateTask` / `deleteTask` / `moveTask` (em `lib/store.tsx`)
a uma API ou banco, mantendo o formato dos tipos em `lib/types.ts`.

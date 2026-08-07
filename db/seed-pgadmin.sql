-- =============================================================================
--  Meu INC App — Carga mínima de referência (rode DEPOIS de db/schema-pgadmin.sql)
-- =============================================================================
--  O que entra aqui: só as tabelas de REFERÊNCIA, aquelas que o app não cria
--  pela tela mas precisa que existam.
--
--    statuses   / priorities  → obrigatórias. As colunas tasks.status_id e
--                               tasks.priority_id têm chave estrangeira para
--                               elas; sem estas linhas, nenhuma tarefa pode ser
--                               criada. Os ids têm de ser exatamente estes,
--                               porque o app lê nome/cor de lib/data.ts e casa
--                               pelo id.
--    areas      / phases      → recomendadas. tasks.area_id é NOT NULL e aponta
--                               para areas(id): sem nenhuma área, a tela de
--                               nova tarefa não tem o que selecionar. Ambas são
--                               editáveis depois em "Pessoas & papéis".
--
--  O que NÃO entra: pessoas, blocos e tarefas. Esse é o conteúdo do projeto e
--  deve ser criado pela interface.
--
--  Idempotente (ON CONFLICT DO NOTHING) — pode rodar mais de uma vez.
--
--  Usa o search_path da sessão. No pgAdmin, execute antes:
--      set search_path to meu_inc_app;
--  ou troque o Query Tool para o banco/schema de destino.
-- =============================================================================

-- ----------------------------------------------------------------------------
--  Status do pipeline — ids casam com STATUSES em lib/data.ts
-- ----------------------------------------------------------------------------
insert into statuses (id, name, sub, color, soft, light, sort_order) values
  ('discovery', 'Discovery',          'Pesquisa / ideia',     '#64748B', '#EEF1F5', true,  1),
  ('backlog',   'Backlog',            'No radar, sem prazo',  '#7C8598', '#F0F2F5', true,  2),
  ('planejado', 'Planejado',          'Na esteira',           '#6366F1', '#ECEDFE', false, 3),
  ('execucao',  'Em execução',        'Sendo feito',          '#F97316', '#FEF0E4', false, 4),
  ('validacao', 'Em validação',       'Em conferência',       '#A855F7', '#F5ECFE', false, 5),
  ('pronto',    'Pronto p/ entrega',  'Aguardando',           '#CA9A00', '#FBF3D6', false, 6),
  ('entregue',  'Entregue',           'No ar / oficializado', '#10B981', '#E3F7EF', false, 7)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  Prioridades — ids casam com PRIO em lib/data.ts ('media' é o default da coluna)
-- ----------------------------------------------------------------------------
insert into priorities (id, label, bg, text_color, sort_order) values
  ('alta',  'Alta',  '#FDE4DE', '#D14328', 1),
  ('media', 'Média', '#FEF0D8', '#B4700A', 2),
  ('baixa', 'Baixa', '#EBEEF2', '#5B6472', 3)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  Áreas — editáveis no app depois
-- ----------------------------------------------------------------------------
insert into areas (id, name, color, sort_order) values
  ('dev',        'Desenvolvimento', '#F97316', 1),
  ('juridico',   'Jurídico',        '#3B82F6', 2),
  ('cobranca',   'Cobrança',        '#8B5CF6', 3),
  ('financeiro', 'Financeiro',      '#10B981', 4),
  ('parcerias',  'Parcerias',       '#EC4899', 5)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  Fases do roadmap — editáveis no app depois
-- ----------------------------------------------------------------------------
insert into phases (id, name, short, sort_order) values
  ('v1.0', 'v1.0 · Base sólida',           'v1.0', 1),
  ('v2.0', 'v2.0 · Reter & renegociar',    'v2.0', 2),
  ('v3.0', 'v3.0 · Receita recorrente',    'v3.0', 3),
  ('v4.0', 'v4.0 · Plataforma financeira', 'v4.0', 4)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  Conferência
-- ----------------------------------------------------------------------------
-- select 'statuses' t, count(*) from statuses
-- union all select 'priorities', count(*) from priorities
-- union all select 'areas',      count(*) from areas
-- union all select 'phases',     count(*) from phases;

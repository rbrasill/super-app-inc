-- =============================================================================
--  Meu INC App — Estrutura do banco (SCHEMA ONLY) para PostgreSQL / pgAdmin
-- =============================================================================
--  Recria SÓ A ESTRUTURA (tabelas, chaves, índices e trigger) do banco do app
--  em qualquer PostgreSQL comum. NÃO insere dados.
--
--  Diferença para db/supabase.sql: aqui NÃO há RLS nem policies. Isso é
--  específico do Supabase (papéis "anon"/"authenticated") e num Postgres
--  comum daria erro. Se precisar de RLS, crie os papéis e políticas depois.
--
--  Como usar no pgAdmin: ver instruções no fim deste arquivo.
--
--  Objetos criados no schema atual (padrão: public). Para usar outro schema,
--  descomente as 2 linhas abaixo e troque o nome.
-- =============================================================================

-- create schema if not exists meu_inc_app;
-- set search_path to meu_inc_app;

-- Opcional: limpar antes de recriar (descomente para rodar de novo do zero).
-- drop table if exists tasks, people, project, blocks, phases, priorities, statuses, areas cascade;
-- drop function if exists set_updated_at() cascade;

-- =========================== Tabelas de referência ===========================

create table areas (
  id          text primary key,
  name        text not null,
  color       text not null,
  sort_order  smallint not null default 0
);

create table statuses (
  id          text primary key,
  name        text not null,
  sub         text not null default '',
  color       text not null,
  soft        text not null,
  light       boolean not null default false,
  sort_order  smallint not null default 0
);

create table priorities (
  id          text primary key,
  label       text not null,
  bg          text not null,
  text_color  text not null,
  sort_order  smallint not null default 0
);

create table phases (
  id          text primary key,
  name        text not null,
  short       text not null default '',
  sort_order  smallint not null default 0
);

-- ============================ Estrutura do projeto ===========================

create table blocks (
  id          text primary key,
  name        text not null,
  theme       text not null default '',
  start_date  date,
  end_date    date,
  color       text not null,
  phase_id    text references phases(id),
  sort_order  smallint not null default 0
);

-- Linha única de configuração do período (id sempre true).
create table project (
  id          boolean primary key default true check (id),
  start_date  date not null,
  total_days  integer not null
);

create table people (
  id             text primary key,
  name           text not null,
  role           text not null default '',
  responsibility text not null default '',
  -- Área da pessoa (NULL = sem área; ao excluir a área, fica NULL).
  area_id        text references areas(id) on delete set null,
  sort_order     smallint not null default 0
);

create table tasks (
  id           text primary key,
  description  text not null,
  area_id      text not null references areas(id),
  block_id     text references blocks(id),
  who          text not null default '',
  priority_id  text not null default 'media' references priorities(id),
  status_id    text not null references statuses(id),
  start_date   date,
  end_date     date,
  dependency   text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =============================== Índices =====================================

create index idx_tasks_area   on tasks(area_id);
create index idx_tasks_status on tasks(status_id);
create index idx_tasks_block  on tasks(block_id);

-- ================= Trigger: mantém tasks.updated_at atualizado ===============

create or replace function set_updated_at() returns trigger language plpgsql as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- =============================================================================
--  COMO RODAR NO pgAdmin
--  1. Abra o pgAdmin e conecte no servidor PostgreSQL de destino.
--  2. Crie (ou escolha) o banco: clique com o botão direito em "Databases" →
--     "Create" → "Database…" (dê um nome, ex.: meu_inc_app) → Save.
--  3. Com esse banco selecionado, abra o "Query Tool" (botão direito no banco
--     → "Query Tool", ou o ícone de raio).
--  4. Carregue este arquivo (ícone de pasta "Open File") OU cole todo o
--     conteúdo no editor.
--  5. Execute tudo com F5 (ou o botão ▶ "Execute/Refresh").
--  6. Confira: no painel esquerdo, expanda o banco → Schemas → public →
--     Tables. Devem aparecer 8 tabelas (areas, statuses, priorities, phases,
--     blocks, project, people, tasks).
--  Observação: este script cria SÓ a estrutura (sem dados). A ordem das
--  tabelas já respeita as chaves estrangeiras, então roda de uma vez só.
-- =============================================================================

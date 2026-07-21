-- =============================================================================
--  Meu INC App — Estrutura no Supabase (banco ao vivo do app)
-- =============================================================================
--  Projeto Supabase: "App INC"  ·  ref ntmjovdzzmpdvsvpacil  ·  região sa-east-1
--  Schema: public (exigido pela API PostgREST do Supabase)
--
--  O app conecta client-side com @supabase/supabase-js usando a publishable
--  key (NEXT_PUBLIC_SUPABASE_* — ver .env.example / docs/SUPABASE.md).
--  RLS ligado: tabelas de referência só-leitura para anon; blocks/tasks/
--  people/project com leitura+escrita para anon (painel sem login).
--
--  Este arquivo é o registro versionado do que foi aplicado via conector.
--  Fonte da verdade dos dados: lib/data.ts (mesma carga fictícia).
-- =============================================================================

-- ===== Referência =====
create table public.areas (
  id text primary key, name text not null, color text not null, sort_order smallint not null default 0
);
create table public.statuses (
  id text primary key, name text not null, sub text not null default '', color text not null,
  soft text not null, light boolean not null default false, sort_order smallint not null default 0
);
create table public.priorities (
  id text primary key, label text not null, bg text not null, text_color text not null, sort_order smallint not null default 0
);
create table public.phases (
  id text primary key, name text not null, short text not null default '', sort_order smallint not null default 0
);

-- ===== Estrutura do projeto =====
create table public.blocks (
  id text primary key, name text not null, theme text not null default '',
  start_date date, end_date date,
  color text not null, phase_id text references public.phases(id), sort_order smallint not null default 0
);
create table public.project (
  id boolean primary key default true check (id), start_date date not null, total_days integer not null
);
create table public.people (
  id text primary key, name text not null, role text not null default '', responsibility text not null default '',
  -- Área à qual a pessoa está ligada (NULL = sem área; se a área for excluída,
  -- a pessoa fica sem área automaticamente).
  area_id text references public.areas(id) on delete set null,
  sort_order smallint not null default 0
);
create table public.tasks (
  id text primary key,
  description text not null,
  area_id text not null references public.areas(id),
  block_id text references public.blocks(id),
  who text not null default '',
  priority_id text not null default 'media' references public.priorities(id),
  status_id text not null references public.statuses(id),
  start_date date,
  end_date date,
  dependency text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tasks_area on public.tasks(area_id);
create index idx_tasks_status on public.tasks(status_id);
create index idx_tasks_block on public.tasks(block_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $func$
begin new.updated_at = now(); return new; end;
$func$;
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

-- ===== RLS =====
alter table public.areas      enable row level security;
alter table public.statuses   enable row level security;
alter table public.priorities enable row level security;
alter table public.phases     enable row level security;
alter table public.blocks     enable row level security;
alter table public.project    enable row level security;
alter table public.people     enable row level security;
alter table public.tasks      enable row level security;

create policy "read statuses"   on public.statuses   for select to anon, authenticated using (true);
create policy "read priorities" on public.priorities for select to anon, authenticated using (true);
create policy "read phases"     on public.phases     for select to anon, authenticated using (true);

-- Áreas são gerenciáveis pelo painel (CRUD em Pessoas & papéis).
create policy "all areas"   on public.areas   for all to anon, authenticated using (true) with check (true);
create policy "all blocks"  on public.blocks  for all to anon, authenticated using (true) with check (true);
create policy "all project" on public.project for all to anon, authenticated using (true) with check (true);
create policy "all people"  on public.people  for all to anon, authenticated using (true) with check (true);
create policy "all tasks"   on public.tasks   for all to anon, authenticated using (true) with check (true);

-- A carga inicial (referência + 24 tarefas + 10 pessoas + 4 blocos) espelha
-- lib/data.ts e foi inserida logo após este schema. Veja lib/data.ts.

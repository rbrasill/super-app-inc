-- =============================================================================
--  Migração: áreas gerenciáveis (CRUD) + pessoa ligada a área
--  Alvo: Supabase "App INC" (ref ntmjovdzzmpdvsvpacil), schema public
--  Status: ⏳ pendente de aplicação (conector indisponível no momento do commit)
--  Como aplicar: conector Supabase (apply_migration) ou SQL Editor do painel.
-- =============================================================================

-- 1) Pessoa → área (NULL = sem área). Se a área for excluída, a pessoa fica
--    sem área automaticamente (ON DELETE SET NULL).
alter table public.people
  add column if not exists area_id text references public.areas(id) on delete set null;

-- 2) Backfill espelhando lib/data.ts (devs → dev; representantes → sua área).
update public.people set area_id = 'dev'        where id in ('p3','p4','p5','p6') and area_id is null;
update public.people set area_id = 'juridico'   where id = 'p8'  and area_id is null;
update public.people set area_id = 'cobranca'   where id = 'p9'  and area_id is null;
update public.people set area_id = 'financeiro' where id = 'p10' and area_id is null;

-- 3) RLS: áreas deixam de ser só-leitura (o painel gerencia as áreas em
--    Pessoas & papéis). Mesma postura das demais tabelas de dados do projeto.
drop policy if exists "read areas" on public.areas;
drop policy if exists "all areas" on public.areas;
create policy "all areas" on public.areas for all to anon, authenticated using (true) with check (true);

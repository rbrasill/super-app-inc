-- =============================================================================
--  Migração · 2026-07-21 · CRUD de fases do roadmap
-- =============================================================================
--  Projeto Supabase: "App INC" · ref ntmjovdzzmpdvsvpacil · schema public
--  Aplicar no SQL Editor do Supabase (ou via conector, um comando por vez).
--
--  O painel passa a gerenciar as fases do roadmap (criar/editar/excluir) na
--  tela Blocos (bifes). Para isso, a tabela `phases` deixa de ser só-leitura.
--  A exclusão de fase em uso é bloqueada pela UI (e pelo FK de blocks.phase_id,
--  que não tem ON DELETE — o banco rejeita excluir fase referenciada).
-- =============================================================================

-- RLS: fases deixam de ser só-leitura (mesma postura de areas/blocks/tasks).
drop policy if exists "read phases" on public.phases;
drop policy if exists "all phases" on public.phases;
create policy "all phases" on public.phases for all to anon, authenticated using (true) with check (true);

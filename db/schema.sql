-- =============================================================================
--  Meu INC App — Estrutura do banco de dados (PostgreSQL)
-- =============================================================================
--
--  BANCO CANÔNICO ........: dpto_processos   (NÃO usar nenhum outro)
--  SCHEMA ................: meu_inc_app
--  CONECTOR ..............: Pipedream · PostgreSQL (role grp_processos)
--
--  O servidor hospeda vários bancos por departamento (dpto_comercial,
--  dpto_projeto_executivo, etc.), mas a conexão deste projeto (role
--  grp_processos) só tem privilégio CONNECT em `dpto_processos`. Qualquer
--  tentativa de acessar outro banco nesta conexão retorna "permission denied".
--  Veja docs/DATABASE.md para o detalhamento.
--
--  Modelo alinhado à ESTRATÉGIA DE BLOCOS ("bifes") com hierarquia
--  FASE → BLOCO → TAREFA: o projeto é fatiado em blocos temáticos com prazo
--  próprio em dias (a soma fecha o período do projeto), e cada bloco se
--  encaixa em uma fase do roadmap (v1.0–v4.0).
--
--  Este arquivo é a fonte da verdade da estrutura: idempotente, seguro de
--  reexecutar. Para popular os dados de referência + demo, rode db/seed.sql.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS meu_inc_app;

-- ----------------------------------------------------------------------------
--  Tabelas de referência (valores fixos de domínio — espelham lib/data.ts)
-- ----------------------------------------------------------------------------

-- Áreas: dev, juridico, cobranca, financeiro, parcerias
CREATE TABLE IF NOT EXISTS meu_inc_app.areas (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  color      text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0
);

-- Status do fluxo: discovery -> backlog -> ... -> entregue
CREATE TABLE IF NOT EXISTS meu_inc_app.statuses (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  sub        text NOT NULL DEFAULT '',
  color      text NOT NULL,
  soft       text NOT NULL,
  light      boolean NOT NULL DEFAULT false,
  sort_order smallint NOT NULL DEFAULT 0
);

-- Prioridades: alta, media, baixa
CREATE TABLE IF NOT EXISTS meu_inc_app.priorities (
  id         text PRIMARY KEY,
  label      text NOT NULL,
  bg         text NOT NULL,
  text_color text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
--  Fases do roadmap (lib/types.ts::Fase) — camada acima dos blocos.
--  Cada bloco se encaixa em uma fase (blocks.phase_id).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meu_inc_app.phases (
  id         text PRIMARY KEY,               -- ex.: 'v1.0'
  name       text NOT NULL,                  -- ex.: 'v1.0 · Base sólida'
  short      text NOT NULL DEFAULT '',       -- rótulo curto (ex.: 'v1.0')
  sort_order smallint NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
--  Blocos ("bifes") — fatias temáticas do projeto (lib/types.ts::Bloco).
--  Editáveis pelo usuário (CRUD ilimitado no app); sort_order = posição na
--  timeline de encaixe.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meu_inc_app.blocks (
  id         text PRIMARY KEY,               -- ex.: 'b1'
  name       text NOT NULL,                  -- ex.: 'Primeiro Acesso'
  theme      text NOT NULL DEFAULT '',       -- tema / o que entra no bloco
  days       integer NOT NULL DEFAULT 0,     -- dias alocados
  color      text NOT NULL,
  phase_id   text REFERENCES meu_inc_app.phases(id),  -- NULL = sem fase
  sort_order smallint NOT NULL DEFAULT 0
);

-- Configuração do período do projeto (linha única — lib/data.ts::PROJECT).
-- A soma de blocks.days deve fechar project.total_days.
CREATE TABLE IF NOT EXISTS meu_inc_app.project (
  id         boolean PRIMARY KEY DEFAULT true CHECK (id),  -- garante 1 linha
  start_date date NOT NULL,
  total_days integer NOT NULL
);

-- ----------------------------------------------------------------------------
--  Tabelas principais
-- ----------------------------------------------------------------------------

-- Pessoas & papéis do projeto
CREATE TABLE IF NOT EXISTS meu_inc_app.people (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           text NOT NULL,
  role           text NOT NULL DEFAULT '',
  responsibility text NOT NULL DEFAULT '',
  sort_order     smallint NOT NULL DEFAULT 0
);

-- Tarefas do quadro de execução
CREATE TABLE IF NOT EXISTS meu_inc_app.tasks (
  id          text PRIMARY KEY,                -- mantém compat. com 't1'..'t24'
  description text NOT NULL,
  area_id     text NOT NULL REFERENCES meu_inc_app.areas(id),
  block_id    text REFERENCES meu_inc_app.blocks(id),  -- NULL = sem bloco
  who         text NOT NULL DEFAULT '',        -- nome livre (nem todo who é uma pessoa cadastrada)
  priority_id text NOT NULL DEFAULT 'media' REFERENCES meu_inc_app.priorities(id),
  status_id   text NOT NULL REFERENCES meu_inc_app.statuses(id),
  start_date  date,
  end_date    date,
  dependency  text NOT NULL DEFAULT '',        -- "trava" / dependência textual
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_area   ON meu_inc_app.tasks(area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON meu_inc_app.tasks(status_id);
CREATE INDEX IF NOT EXISTS idx_tasks_block  ON meu_inc_app.tasks(block_id);

-- ----------------------------------------------------------------------------
--  Manutenção automática de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION meu_inc_app.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE OR REPLACE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON meu_inc_app.tasks
  FOR EACH ROW EXECUTE FUNCTION meu_inc_app.set_updated_at();

-- ----------------------------------------------------------------------------
--  View de conveniência: tarefa "decorada" (espelha lib/derive.ts::decorate)
--  Já traz os nomes de área/bloco/status/prioridade resolvidos por JOIN.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW meu_inc_app.v_tasks AS
SELECT
  t.id,
  t.description,
  t.area_id,     a.name  AS area_name,     a.color AS area_color,
  t.block_id,    b.name  AS block_name,    b.color AS block_color,
  b.phase_id,    ph.name AS phase_name,
  t.who,
  t.priority_id, pr.label AS priority_label,
  t.status_id,   s.name  AS status_name,   s.color AS status_color, s.soft AS status_soft,
  t.start_date,
  t.end_date,
  t.dependency,
  t.created_at,
  t.updated_at
FROM meu_inc_app.tasks t
JOIN      meu_inc_app.areas      a  ON a.id  = t.area_id
LEFT JOIN meu_inc_app.blocks     b  ON b.id  = t.block_id
LEFT JOIN meu_inc_app.phases     ph ON ph.id = b.phase_id
JOIN      meu_inc_app.priorities pr ON pr.id = t.priority_id
JOIN      meu_inc_app.statuses   s  ON s.id  = t.status_id;

-- =============================================================================
--  HISTÓRICO DE MIGRAÇÕES (executadas no dpto_processos via conector Pipedream)
--
--  2026-07-16 · fases → blocos (estratégia de blocos, PR #1):
--    a primeira versão tinha `phases` ligada direto a `tasks.phase_id`;
--    foi substituída por `blocks` + `tasks.block_id` (tarefas re-mapeadas),
--    view recriada, e `phases`/`phase_id` de tasks removidos.
--
--  2026-07-16 · fases voltam como camada ACIMA dos blocos:
--    CREATE TABLE phases (v1.0–v4.0) + blocks.phase_id (b1,b2→v1.0;
--    b3,b4→v2.0) + v_tasks recriada expondo phase_id/phase_name do bloco.
--    Hierarquia final: fase → bloco → tarefa.
-- =============================================================================

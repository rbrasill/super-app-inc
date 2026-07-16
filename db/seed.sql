-- =============================================================================
--  Meu INC App — Carga inicial (seed) · PostgreSQL
-- =============================================================================
--  Banco canônico: dpto_processos  |  Schema: meu_inc_app
--
--  Rode DEPOIS de db/schema.sql. Idempotente para as tabelas de referência e
--  para tasks (ON CONFLICT DO NOTHING). A tabela people usa chave gerada e só
--  é populada se estiver vazia (guarda WHERE NOT EXISTS).
--
--  Espelha exatamente os dados estáticos de lib/data.ts.
-- =============================================================================

-- ----------------------------------------------------------------------------
--  Referência
-- ----------------------------------------------------------------------------
INSERT INTO meu_inc_app.areas (id, name, color, sort_order) VALUES
  ('dev',        'Desenvolvimento', '#F97316', 1),
  ('juridico',   'Jurídico',        '#3B82F6', 2),
  ('cobranca',   'Cobrança',        '#8B5CF6', 3),
  ('financeiro', 'Financeiro',      '#10B981', 4),
  ('parcerias',  'Parcerias',       '#EC4899', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO meu_inc_app.statuses (id, name, sub, color, soft, light, sort_order) VALUES
  ('discovery', 'Discovery',         'Pesquisa / ideia',    '#64748B', '#EEF1F5', true,  1),
  ('backlog',   'Backlog',           'No radar, sem prazo', '#7C8598', '#F0F2F5', true,  2),
  ('planejado', 'Planejado',         'Na esteira',          '#6366F1', '#ECEDFE', false, 3),
  ('execucao',  'Em execução',       'Sendo feito',         '#F97316', '#FEF0E4', false, 4),
  ('validacao', 'Em validação',      'Em conferência',      '#A855F7', '#F5ECFE', false, 5),
  ('pronto',    'Pronto p/ entrega', 'Aguardando',          '#CA9A00', '#FBF3D6', false, 6),
  ('entregue',  'Entregue',          'No ar / oficializado','#10B981', '#E3F7EF', false, 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO meu_inc_app.priorities (id, label, bg, text_color, sort_order) VALUES
  ('alta',  'Alta',  '#FDE4DE', '#D14328', 1),
  ('media', 'Média', '#FEF0D8', '#B4700A', 2),
  ('baixa', 'Baixa', '#EBEEF2', '#5B6472', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO meu_inc_app.phases (id, name, sort_order) VALUES
  ('v1.0', 'v1.0 · Base sólida',          1),
  ('v2.0', 'v2.0 · Reter & renegociar',   2),
  ('v3.0', 'v3.0 · Receita recorrente',   3),
  ('v4.0', 'v4.0 · Plataforma financeira',4)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
--  Pessoas & papéis (só insere se a tabela estiver vazia)
-- ----------------------------------------------------------------------------
INSERT INTO meu_inc_app.people (name, role, responsibility, sort_order)
SELECT * FROM (VALUES
  ('Gustavo',       'Product Owner · dono do quadro',        'Decide o quê e a prioridade; mantém as três camadas; monta o report do Edinho.', 1),
  ('Rafael Brasil', 'Planejamento & Estratégia',             'Cronograma, dependências, riscos e evolução da estratégia.',                     2),
  ('Diogo',         'Tech Lead',                             'Coordena tecnicamente os devs no dia a dia.',                                    3),
  ('Felipe Martins','Diretor de TI · Patrocinador técnico',  'Define tecnologia e estratégia técnica do app.',                                 4),
  ('Rafael Soares', 'Desenvolvedor',                         'Executa tarefas de desenvolvimento.',                                            5),
  ('Victor',        'Desenvolvedor',                         'Executa tarefas de desenvolvimento.',                                            6),
  ('Edinho',        'Patrocinador (Sponsor)',                'Presidente e investidor; recebe reporte e decisões-chave.',                      7),
  ('A definir',     'Representante · Jurídico',               'Ponto focal do jurídico no projeto.',                                            8),
  ('A definir',     'Representante · Cobrança',               'Ponto focal de cobrança no projeto.',                                            9),
  ('A definir',     'Representante · Financeiro',             'Ponto focal do financeiro no projeto.',                                          10)
) AS v(name, role, responsibility, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM meu_inc_app.people);

-- ----------------------------------------------------------------------------
--  Tarefas (24) — datas ausentes ficam NULL
-- ----------------------------------------------------------------------------
INSERT INTO meu_inc_app.tasks (id, description, area_id, phase_id, who, priority_id, status_id, start_date, end_date, dependency) VALUES
  ('t1', 'Desenvolver 2ª via de boleto e histórico de pagamentos',        'dev',        'v1.0', 'Rafael Soares', 'alta',  'execucao',  '2026-07-01', '2026-08-15', ''),
  ('t2', 'Criar acompanhamento de obra com fotos por etapa',              'dev',        'v1.0', 'Victor',        'media', 'validacao', '2026-07-05', '2026-08-10', ''),
  ('t3', 'Publicar central de documentos (contrato, comprovantes)',       'dev',        'v1.0', 'Rafael Soares', 'media', 'pronto',    '2026-06-20', '2026-07-30', ''),
  ('t4', 'Implantar login CPF + WhatsApp com consentimento LGPD',         'dev',        'v1.0', 'Victor',        'alta',  'entregue',  '2026-06-01', '2026-06-28', ''),
  ('t5', 'Emitir parecer sobre cobrança acolhedora (CDC art. 42)',        'juridico',   'v2.0', 'Jurídico',      'alta',  'planejado', '2026-08-01', '2026-08-20', ''),
  ('t6', 'Homologar régua de renegociação e mínimo existencial',          'cobranca',   'v2.0', '',              'media', 'backlog',   NULL,         NULL,         'depende de parecer jurídico'),
  ('t7', 'Estruturar FIDC próprio p/ recapturar spread do pró-soluto',    'financeiro', 'v3.0', '',              'alta',  'discovery', NULL,         NULL,         'validação jurídica + cota subordinada'),
  ('t8', 'Fechar parceiro emissor do cartão Meu INC (powered by)',        'parcerias',  'v3.0', '',              'alta',  'execucao',  '2026-09-01', '2026-11-30', 'depende de definição de BaaS'),
  ('t9', 'Pesquisar consórcio white label via administradora autorizada', 'parcerias',  'v4.0', '',              'baixa', 'discovery', NULL,         NULL,         ''),
  ('t10','Simular renegociação digital com proposta na hora',             'dev',        'v2.0', 'Victor',        'media', 'planejado', '2026-08-15', '2026-09-30', 'depende de homologação de régua'),
  ('t11','Implementar push de lembrete de vencimento de parcela',         'dev',        'v1.0', 'Rafael Soares', 'alta',  'execucao',  '2026-07-10', '2026-08-05', ''),
  ('t12','Publicar tela inicial com resumo do contrato do cliente',       'dev',        'v1.0', 'Victor',        'media', 'entregue',  '2026-05-20', '2026-06-15', ''),
  ('t13','Criar chat de atendimento in-app com histórico',                'dev',        'v2.0', '',              'media', 'backlog',   NULL,         NULL,         ''),
  ('t14','Integrar assinatura eletrônica de aditivos contratuais',        'dev',        'v2.0', 'Rafael Soares', 'alta',  'planejado', '2026-09-01', '2026-10-10', ''),
  ('t15','Revisar termos de uso e política de privacidade (LGPD)',        'juridico',   'v1.0', 'Jurídico',      'alta',  'entregue',  '2026-05-05', '2026-05-30', ''),
  ('t16','Analisar viabilidade regulatória do FIDC próprio',              'juridico',   'v3.0', 'Jurídico',      'media', 'discovery', NULL,         NULL,         'aguarda estruturação financeira'),
  ('t17','Implantar régua de comunicação amigável (D+5, D+15, D+30)',     'cobranca',   'v2.0', '',              'media', 'execucao',  '2026-08-01', '2026-09-15', ''),
  ('t18','Testar acordo parcelado self-service no app',                   'cobranca',   'v2.0', 'Victor',        'media', 'validacao', '2026-08-20', '2026-09-20', ''),
  ('t19','Automatizar conciliação de recebíveis com o banco',            'financeiro', 'v3.0', '',              'alta',  'planejado', '2026-10-01', '2026-11-30', 'depende de API do banco'),
  ('t20','Estudar antecipação de recebíveis para o cliente',             'financeiro', 'v4.0', '',              'baixa', 'discovery', NULL,         NULL,         ''),
  ('t21','Mapear parceiros de seguro residencial (bundle)',               'parcerias',  'v3.0', '',              'baixa', 'backlog',   NULL,         NULL,         ''),
  ('t22','Avaliar marketplace de serviços para o morador',                'parcerias',  'v4.0', '',              'baixa', 'discovery', NULL,         NULL,         ''),
  ('t23','Criar carteira digital Meu INC (saldo e extrato)',              'dev',        'v3.0', 'Victor',        'alta',  'planejado', '2026-10-15', '2026-12-20', 'depende de parceiro emissor'),
  ('t24','Disponibilizar segunda via de contrato em PDF',                 'dev',        'v1.0', 'Rafael Soares', 'media', 'pronto',    '2026-06-25', '2026-07-25', '')
ON CONFLICT (id) DO NOTHING;

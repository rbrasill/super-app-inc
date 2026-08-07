# Meu INC App — Como a Plataforma Funciona

> **Para quem é este documento:** um agente de IA que vai **operar** esta
> plataforma pelo banco de dados — criar, alterar e excluir tarefas, blocos,
> pessoas, áreas e fases. Você **não** vai mexer no código da aplicação.
>
> Por isso o documento tem duas metades:
>
> - **Parte 1 — Entenda como um usuário.** O que a plataforma é, o vocabulário do
>   projeto, o que cada tela mostra e de onde vem cada número. Leia primeiro:
>   sem esse modelo mental, você vai gravar dados sintaticamente válidos que
>   produzem telas erradas.
> - **Parte 2 — Como mexer nos dados.** Onde cada informação da tela mora no
>   banco, as regras de preenchimento, o SQL de cada operação e a lista do que
>   nunca fazer.
>
> **Aviso central:** você escreve **direto no banco**, sem passar pelas
> validações da aplicação. As proteções que existem na interface (não deixar
> excluir uma área com tarefas, não aceitar status inválido) **não vão te
> proteger**. A responsabilidade de gravar dados coerentes é sua. A Parte 2
> lista exatamente o que pode quebrar.

---

## Índice

**Parte 1 — Entenda como um usuário**
1. [O que é a plataforma](#1-o-que-é-a-plataforma)
2. [Vocabulário do projeto](#2-vocabulário-do-projeto)
3. [O ciclo de vida de uma tarefa](#3-o-ciclo-de-vida-de-uma-tarefa)
4. [As cinco telas](#4-as-cinco-telas)
5. [Como a plataforma calcula prazo, entrega e conclusão](#5-como-a-plataforma-calcula-prazo-entrega-e-conclusão)

**Parte 2 — Como mexer nos dados**
6. [Onde você vai trabalhar](#6-onde-você-vai-trabalhar-atenção)
7. [Da tela para a tabela](#7-da-tela-para-a-tabela)
8. [Regras de preenchimento](#8-regras-de-preenchimento)
9. [Receitas: criar, alterar, excluir](#9-receitas-criar-alterar-excluir)
10. [O que NUNCA fazer](#10-o-que-nunca-fazer)
11. [Como conferir que deu certo](#11-como-conferir-que-deu-certo)
12. [Referência rápida](#12-referência-rápida)

---

# Parte 1 — Entenda como um usuário

## 1. O que é a plataforma

É um **painel de acompanhamento de projeto** da INC Empreendimentos, uma
construtora. O projeto que ele acompanha é a construção de um aplicativo chamado
"Meu INC App", voltado aos clientes da construtora (boleto, documentos,
acompanhamento de obra, renegociação).

**Não confunda os dois:** este painel é a ferramenta interna de gestão. As
"tarefas" que você vai manipular são tarefas do time que constrói o app — coisas
como "Implantar login CPF + WhatsApp" ou "Emitir parecer sobre cobrança
acolhedora". Não são tarefas de um cliente usando o app.

Quem usa o painel:

| Quem | Para quê |
|---|---|
| **Gustavo** — Product Owner | Dono do quadro. Decide o quê e a prioridade. |
| **Rafael Brasil** — Planejamento | Cronograma, dependências, riscos. |
| **Diogo** — Tech Lead / **Rafael Soares, Victor** — Devs | Executam as tarefas. |
| **Felipe Martins** — Diretor de TI | Patrocinador **técnico**. |
| **Edinho** — Patrocinador (Sponsor) | Presidente e investidor. Vê só o resumo executivo e as decisões que dependem dele. |
| Representantes de Jurídico, Cobrança, Financeiro | Pontos focais das áreas. |

## 2. Vocabulário do projeto

Você precisa desses cinco termos para entender qualquer tela.

### Fase

Marco grande do roadmap do aplicativo. São quatro, e representam versões:

- **v1.0 · Base sólida** — o mínimo para o app existir
- **v2.0 · Reter & renegociar** — cobrança e renegociação
- **v3.0 · Receita recorrente**
- **v4.0 · Plataforma financeira**

### Bloco (também chamado de **"bife"**)

Este é o conceito mais característico do projeto, então entenda bem.

O projeto foi fatiado em pedaços temáticos, apelidados de **"bifes"** (a metáfora
é fatiar algo grande em porções digeríveis). Cada bife entrega um **pacote
completo** de uma funcionalidade — tela + back-end + regra de negócio + cadastro —
e tem **data de início e fim próprias**.

Os quatro bifes iniciais:

| Bife | Tema | Duração | Fase |
|---|---|---|---|
| Primeiro Acesso | Login, onboarding, consentimento LGPD | 35 dias | v1.0 |
| Cliente | Boleto, documentos, obra, chamados, notificações | 30 dias | v1.0 |
| Financeiro | Renegociação, cobrança, conciliação, carteira | 15 dias | v2.0 |
| Assistência Técnica / SAC | Chamados, aditivos, pós-venda | 10 dias | v2.0 |

Somados: 90 dias. **Mas esse total não é fixo no sistema** — ele é calculado
somando a duração de todos os bifes cadastrados. Se você criar um bife novo, o
total do projeto aumenta sozinho. Isso é intencional.

Cada bloco pertence a uma fase. Tarefas pertencem a blocos.

### Tarefa

A unidade de trabalho. Tem descrição, área, bloco, responsável, prioridade,
status, data de início, data de fim e — opcionalmente — uma **dependência**.

### Área

O departamento responsável. Cinco, cada uma com uma cor usada em todo o painel:
**Desenvolvimento** (laranja), **Jurídico** (azul), **Cobrança** (violeta),
**Financeiro** (verde), **Parcerias** (rosa).

Toda tarefa **precisa** de uma área. Pessoas podem estar ligadas a uma área.

### Trava (dependência)

Se o campo de dependência de uma tarefa tem texto, ela é considerada
**"travada"** — está esperando algo. Exemplos reais no projeto: *"depende de
parecer jurídico"*, *"depende de API do banco"*, *"validação jurídica + cota
subordinada"*.

Isso não é um status separado: uma tarefa pode estar em execução **e** travada ao
mesmo tempo. Travas aparecem num KPI próprio e numa lista dedicada, porque são o
que mais atrasa projeto.

## 3. O ciclo de vida de uma tarefa

Sete status, nesta ordem. Uma tarefa caminha da esquerda para a direita (mas pode
voltar).

| Status | Nome na tela | O que significa na prática |
|---|---|---|
| `discovery` | Discovery | Ainda é pesquisa ou ideia. Não há compromisso. |
| `backlog` | Backlog | Reconhecida, no radar, mas sem prazo. |
| `planejado` | Planejado | Entrou na esteira, tem prazo. |
| `execucao` | Em execução | Sendo feita agora. |
| `validacao` | Em validação | Feita, em conferência. |
| `pronto` | Pronto p/ entrega | Aprovada, aguardando publicação/oficialização. |
| `entregue` | Entregue | No ar / oficializado. **Acabou.** |

Três agrupamentos que a plataforma usa e que você precisa conhecer:

- **Concluído = apenas `entregue`.** Todo percentual de conclusão do projeto, de
  bloco e de pessoa conta só `entregue`. Uma tarefa em `pronto` **não** conta como
  concluída.
- **"Em andamento" = `execucao` + `validacao` + `pronto`.**
- **"Entregue recentemente"** (tela do patrocinador) mostra `entregue` **e**
  `pronto` — é a única lista onde `pronto` aparece junto dos entregues.

Repare que `pronto` é ambíguo por desenho: conta em "andamento" e aparece em
"entregue recentemente", mas **não** conta na conclusão. Se um número parecer
inconsistente, provavelmente é isso.

## 4. As cinco telas

O painel tem cinco telas no menu lateral. Entender o que cada uma mostra é o que
te permite prever o efeito de uma alteração no banco.

### Quadro de execução

A tela do dia a dia do time. Dois modos:

- **Kanban** — sete colunas, uma por status, com as tarefas em cartões. O usuário
  **arrasta** cartões entre colunas para mudar o status.
- **Por área** — as mesmas tarefas agrupadas por departamento.

Tem busca por texto (procura em descrição, responsável e dependência) e quatro
filtros: área, bloco, responsável e status. Também exporta CSV do que está na
tela.

Cada cartão mostra: descrição, período, dependência (se houver), área e a inicial
do responsável.

> Áreas sem nenhuma tarefa **não aparecem** no modo "Por área". Se você criar uma
> área e ela não aparecer, é porque ainda não tem tarefa.

### Blocos (bifes)

Lista dos bifes em **ordem cronológica** (por data de início). Cada card mostra
nome, fase, período no formato `dd/mm/aaaa`, quantidade de tarefas e um
**semáforo** de andamento. Clicando, abre o detalhe com o tema do bloco e suas
tarefas.

No rodapé, o total de dias somando todos os bifes.

O semáforo funciona assim:

| Cor | Texto | Quando |
|---|---|---|
| 🔴 vermelho | Em risco | tem trava **e** menos de 50% entregue |
| 🟠 âmbar | Atenção | tem trava **ou** menos de 40% entregue |
| 🟢 verde | No ritmo | nenhum dos casos acima |
| ⚪ cinza | Sem tarefas | o bloco não tem nenhuma tarefa |

Bloco sem tarefas é **sempre** cinza, independente das datas.

### Dashboard geral

Visão consolidada para o time:

- **Quatro KPIs:** total de tarefas · em andamento · entregues (com % de
  conclusão) · com trava/dependência.
- **Distribuição por área e status** — uma barra por área, dividida por status.
- **Andamento por bloco** — os semáforos.
- **Conclusão de tarefas por pessoa** — uma barra por pessoa, com o percentual das
  tarefas dela que estão entregues, ordenada do maior para o menor.
- **Travas & dependências abertas** — lista de todas as tarefas travadas.

> Pessoas sem nenhuma tarefa atribuída **não aparecem** na lista de conclusão por
> pessoa.

### Visão do patrocinador

Feita para o Edinho. Sem detalhe operacional.

- **Dois indicadores circulares:** quantos **dias faltam** para a entrega e o
  **percentual de conclusão** do projeto.
- **Marcos do projeto** — uma linha do tempo horizontal onde cada bife é um
  segmento e o fim de cada bife é um marco. As caixas com o nome dos bifes
  alternam acima e abaixo da linha. Tem um marcador de "hoje".
- **Semáforo por bloco.**
- **Decisões que dependem de você** — as tarefas atribuídas ao patrocinador que
  ainda não foram concluídas.
- **Entregue recentemente.**

> Um bife só aparece na linha do tempo se tiver **as duas datas** preenchidas
> (início **e** fim). Bife sem data fica invisível ali.

### Pessoas & papéis

Três seções: a tabela de pessoas (nome, papel, responsabilidade, área), a lista
de **áreas** e a lista de **fases do roadmap**. Tudo editável pela interface.

## 5. Como a plataforma calcula prazo, entrega e conclusão

Estes quatro cálculos são a alma do painel. Se você entender só isso da Parte 1,
já consegue trabalhar sem estragar nada.

### Duração de um bife

**Contagem inclusiva:** de 16/07 a 19/08 são **35 dias**, não 34. O primeiro e o
último dia contam.

### Duração total do projeto

Soma da duração de todos os bifes. **Não é um número fixo.** Crie um bife de 20
dias e o total do projeto passa de 90 para 110.

### Data de entrega do projeto

É o **fim do último bife** — o bife com a maior data de fim.

Isto é uma decisão de produto deliberada: o **plano é o compromisso**. A entrega
não é a data da última tarefa. Se existirem tarefas que terminam *depois* da
entrega prevista, elas **não empurram a data** — são contadas separadamente e
sinalizadas, para o desalinhamento ficar visível em vez de ser escondido.

Consequência prática: se você quiser mudar a data de entrega do projeto, mude a
data de fim do último bife. Mexer nas datas das tarefas não muda nada disso.

### Percentual de conclusão

Tarefas com status `entregue` ÷ total de tarefas. Nada mais entra na conta.

Vale para o projeto todo, para cada bloco e para cada pessoa. E **recalcula
sozinho** quando você insere ou exclui tarefas — não há nenhum total congelado
para manter.

### Um bife "cumprido" na linha do tempo

Um marco só é marcado como cumprido se o bife tiver **pelo menos uma tarefa** e
**todas** estiverem `entregue`. Bife vazio nunca conta como cumprido.

---

# Parte 2 — Como mexer nos dados

## 6. Onde você vai trabalhar (ATENÇÃO)

### ⚠️ Existem DOIS bancos com o mesmo nome de schema. Escrever no errado é o pior erro possível.

| Banco | Schema | O que é |
|---|---|---|
| **`dpto_processo_superapp`** | `meu_inc_app` | **O banco do app. É AQUI que você trabalha.** |
| `dpto_processos` | `meu_inc_app` | Espelho standalone, desatualizado. **Não é o app.** |

Os dois têm um schema chamado `meu_inc_app`, com tabelas de nomes iguais. Se você
gravar no espelho, **nada aparece no painel** e você vai concluir, erradamente,
que o banco está com problema.

Complicação adicional: existe uma instrução no repositório dizendo *"ao acessar
via conector Pipedream, use sempre `dpto_processos`"*. Essa regra existe porque a
credencial daquele conector só tem permissão nesse banco — **ela não se aplica ao
seu trabalho**. Você precisa do `dpto_processo_superapp`.

**Antes de qualquer operação, confirme onde você está:**

```sql
select current_database(), current_schema();
```

Deve responder `dpto_processo_superapp`. Se responder `dpto_processos`, **pare** —
você está no banco errado.

E defina o schema na sessão, para não precisar qualificar cada tabela:

```sql
set search_path to meu_inc_app;
```

(Todo o SQL deste documento assume que você fez isso. Se preferir, qualifique
tudo: `meu_inc_app.tasks`.)

### As alterações não aparecem sozinhas na tela

O painel carrega os dados **uma vez, ao abrir a página**. Não há atualização em
tempo real. Depois de mexer no banco, quem estiver com o painel aberto precisa
**recarregar a página** para ver a mudança. Se alguém disser "alterei e não
apareceu", essa é a primeira pergunta.

### Sem multi-statement em alguns conectores

Se a ferramenta que você usa não aceita vários comandos SQL de uma vez (é o caso
do conector Pipedream), **execute um comando por vez**. Todas as receitas deste
documento são um comando cada, de propósito.

## 7. Da tela para a tabela

Oito tabelas. Você mexe em cinco, não mexe em três.

### Tabelas que você edita

| Tabela | O que é na tela |
|---|---|
| `tasks` | As tarefas (cartões do quadro) |
| `blocks` | Os bifes |
| `phases` | As fases do roadmap |
| `areas` | As áreas / departamentos |
| `people` | As pessoas do time |

### Tabelas que você NÃO edita

| Tabela | Por que não |
|---|---|
| `statuses` | Os 7 status. Referência fixa; a aplicação usa nomes e cores do próprio código, não daqui. |
| `priorities` | Alta / Média / Baixa. Idem. |
| `project` | Legado. A aplicação **não lê** esta tabela. Alterar não tem efeito nenhum. |

> ### ⚠️ Confira antes de tudo: `statuses` e `priorities` precisam estar populadas
>
> Elas são **pré-requisito**: `tasks.status_id` e `tasks.priority_id` têm chave
> estrangeira para elas. Se estiverem vazias, **nenhuma tarefa pode ser criada** —
> todo `insert` falha com erro de chave estrangeira.
>
> ```sql
> select
>   (select count(*) from statuses)   as statuses,    -- esperado: 7
>   (select count(*) from priorities) as priorities;  -- esperado: 3
> ```
>
> Se vierem zeradas, o banco foi criado mas a carga de referência não foi
> aplicada. A correção é rodar o arquivo **`db/seed-pgadmin.sql`** do repositório
> (ele também popula `areas` e `phases`, e é idempotente — pode rodar de novo sem
> duplicar). Sem isso, não tente criar tarefas: você só vai coletar erros.

> Curiosidade útil: as colunas de cor em `statuses` e `priorities` existem, mas a
> aplicação ignora — as cores vêm do código. Não perca tempo ajustando cor ali.

### Mapa campo por campo

**`tasks`** — o que o usuário vê no cartão e no formulário de tarefa:

| Coluna | Na tela | Obrigatório | Observação |
|---|---|---|---|
| `id` | — | **sim** | Você define. Sem geração automática. |
| `description` | Descrição | **sim** | O texto do cartão. |
| `area_id` | Área | **sim** | Precisa existir em `areas`. |
| `block_id` | Bloco | não (`NULL`) | `NULL` = "Sem bloco". |
| `who` | Responsável | não (`''`) | **O NOME da pessoa, em texto.** Ver §8. |
| `priority_id` | Prioridade | **sim** (default `media`) | `alta` · `media` · `baixa`. |
| `status_id` | Coluna do Kanban | **sim** | Um dos 7. Ver §10. |
| `start_date` | Início | não (`NULL`) | Data. |
| `end_date` | Fim | não (`NULL`) | Data. |
| `dependency` | Dependência / trava | não (`''`) | Texto com conteúdo ⇒ tarefa "travada". |
| `created_at` / `updated_at` | — | automático | Não mexa; há um gatilho que atualiza `updated_at`. |

**`blocks`** — os bifes:

| Coluna | Na tela | Obrigatório | Observação |
|---|---|---|---|
| `id` | — | **sim** | Você define. |
| `name` | Nome do bife | **sim** | |
| `theme` | "O que entra no bloco" | não (`''`) | Aparece no detalhe do bloco. |
| `start_date` | Início | não (`NULL`) | **Sem as duas datas, o bife não aparece na linha do tempo do patrocinador.** |
| `end_date` | Fim | não (`NULL`) | A maior delas define a entrega do projeto. |
| `color` | Cor do bife | **sim** | Hex, ex. `#6366F1`. |
| `phase_id` | Fase do roadmap | não (`NULL`) | Precisa existir em `phases`. |
| `sort_order` | — | não (default 0) | A tela ordena por data, não por isto. |

**`people`**:

| Coluna | Na tela | Obrigatório | Observação |
|---|---|---|---|
| `id` | — | **sim** | Você define. |
| `name` | Pessoa | **sim** | É o valor que casa com `tasks.who`. |
| `role` | Papel | não (`''`) | **Define quem é o patrocinador.** Ver §8. |
| `responsibility` | Responsabilidade | não (`''`) | |
| `area_id` | Área | não (`NULL`) | Se a área for excluída, isto vira `NULL` automaticamente. |
| `sort_order` | Ordem na tabela | não (default 0) | Aqui a ordem **é** respeitada. |

**`areas`**: `id` (você define), `name`, `color` (hex) — todos obrigatórios —
e `sort_order`.

**`phases`**: `id`, `name` obrigatórios; `short` é o rótulo curto (ex.: `v1.0`) e
`sort_order` a ordem.

## 8. Regras de preenchimento

Seis regras. Todas já causaram problema real.

### 1. Datas: sempre `YYYY-MM-DD`

As colunas são do tipo `date`. Grave `'2026-08-01'`. A tela converte para
`dd/mm/aaaa` sozinha — **não grave no formato brasileiro**.

O ano é sempre exibido na interface porque o projeto atravessa a virada de 2026
para 2027, e `01/08` sem ano seria ambíguo.

### 2. Vazio: `NULL` para datas e vínculos, `''` para texto

Esta é a regra que mais confunde. As colunas de texto são `not null default ''`;
as de data e de vínculo aceitam `NULL`.

| Quer dizer "vazio" em… | Use | Nunca use |
|---|---|---|
| `start_date`, `end_date` | `NULL` | `''` (erro de tipo) |
| `block_id`, `phase_id`, `people.area_id` | `NULL` | `''` (viraria FK inválida) |
| `who`, `dependency`, `theme`, `short`, `role`, `responsibility` | `''` | `NULL` (viola `not null`) |

### 3. `who` é o NOME da pessoa, não o id

Não existe chave estrangeira entre `tasks` e `people`. O responsável é gravado
como **texto com o nome**:

```sql
-- CORRETO
update tasks set who = 'Victor' where id = 't10';

-- ERRADO: grava o id como se fosse nome; a tela mostra "p6" como responsável
update tasks set who = 'p6' where id = 't10';
```

O nome precisa casar **exatamente** com `people.name` (ignorando espaços nas
pontas) para que a pessoa apareça na "Conclusão de tarefas por pessoa". `'victor'`
minúsculo **não** casa com `'Victor'`.

Duas consequências desse desenho:

- **Renomear uma pessoa exige atualizar as tarefas dela.** Se você mudar
  `people.name` de `'Victor'` para `'Victor Silva'` e não atualizar `tasks.who`,
  as tarefas ficam órfãs: continuam mostrando "Victor", mas a pessoa desaparece
  do gráfico de conclusão. Ver a receita em §9.
- **Existem responsáveis que não são pessoas cadastradas.** Algumas tarefas têm
  `who = 'Jurídico'`, apontando um departamento. Isso é aceito e aparece no filtro
  de responsável. Não "conserte" isso.

### 4. O patrocinador é identificado pelo campo `role`

A tela do patrocinador não usa nome fixo. Ela procura, entre as pessoas:

1. alguém com **"sponsor"** no papel; se não achar,
2. alguém com **"patrocinador"** no papel que **não** contenha "técnico".

Hoje isso resolve para o **Edinho** (`Patrocinador (Sponsor)`). O Felipe é
`Diretor de TI · Patrocinador técnico` e é deliberadamente excluído.

**Se você editar papéis, cuidado:** apagar a palavra "Sponsor" do papel do Edinho
faz a seção "Decisões que dependem de você" esvaziar. Colocar "Sponsor" no papel
de outra pessoa transfere a seção para ela.

As "decisões" são as tarefas onde `who` = nome do patrocinador e o status **não**
é `pronto` nem `entregue`.

### 5. Ids são seus para definir

As colunas `id` são texto e **não têm geração automática**. Você precisa fornecer
um valor único.

Convenções que já existem no banco, ambas aceitas:

- Legíveis, dos dados iniciais: `t1`…`t24`, `b1`…`b4`, `dev`, `juridico`, `v1.0`
- Gerados pela interface: `t_a1b2c3d4e5f6`, `b_9f8e7d6c5b4a`

Sugestão para o seu trabalho: use prefixos legíveis e previsíveis (`t_`, `b_`,
`p_`, `a_`, `f_`) mais algo único. Nada no sistema depende do formato — só da
unicidade.

### 6. `sort_order` só importa em pessoas, áreas e fases

Nessas três, define a ordem de exibição. Em `blocks`, a tela ordena
**cronologicamente pela data de início**, então `sort_order` é praticamente
decorativo. Se não souber o que pôr, use `0`.

## 9. Receitas: criar, alterar, excluir

Um comando por receita. Assumem `set search_path to meu_inc_app;`.

### Criar uma tarefa

```sql
insert into tasks
  (id, description, area_id, block_id, who, priority_id, status_id,
   start_date, end_date, dependency)
values
  ('t_login_biometria',
   'Implementar login por biometria',
   'dev',                 -- precisa existir em areas
   'b1',                  -- ou NULL para "sem bloco"
   'Victor',              -- NOME da pessoa, ou '' para sem responsável
   'alta',                -- alta | media | baixa
   'planejado',           -- um dos 7 status
   '2026-08-10',          -- ou NULL
   '2026-08-28',          -- ou NULL
   '');                   -- '' = sem trava
```

Mínimo indispensável (o resto tem default):

```sql
insert into tasks (id, description, area_id, status_id)
values ('t_exemplo', 'Descrição da tarefa', 'dev', 'backlog');
```

### Criar um bife

```sql
insert into blocks (id, name, theme, start_date, end_date, color, phase_id, sort_order)
values
  ('b_notificacoes',
   'Notificações',
   'Push, e-mail e WhatsApp: lembretes de vencimento e avisos de obra.',
   '2026-10-14',
   '2026-11-02',          -- ATENÇÃO: se for a maior data de fim, muda a
                          -- data de entrega do PROJETO
   '#8B5CF6',
   'v2.0',
   5);
```

Efeitos colaterais desta inserção, todos automáticos:
- o total de dias do projeto aumenta em 20;
- o bife entra na linha do tempo do patrocinador (tem as duas datas);
- aparece como **cinza / "Sem tarefas"** até receber a primeira tarefa;
- se `2026-11-02` for a maior data de fim, a **entrega do projeto** passa a ser
  essa, e o contador de "dias restantes" muda.

### Criar uma pessoa

```sql
insert into people (id, name, role, responsibility, area_id, sort_order)
values ('p_ana', 'Ana Souza', 'Designer de produto',
        'Protótipos e design system do app.', 'dev', 11);
```

Ela só aparece no gráfico de conclusão depois de ter ao menos uma tarefa com
`who = 'Ana Souza'`.

### Criar uma área

```sql
insert into areas (id, name, color, sort_order)
values ('marketing', 'Marketing', '#0EA5E9', 6);
```

### Criar uma fase

```sql
insert into phases (id, name, short, sort_order)
values ('v5.0', 'v5.0 · Expansão regional', 'v5.0', 5);
```

### Mover uma tarefa de status

O equivalente a arrastar o cartão no Kanban:

```sql
update tasks set status_id = 'entregue' where id = 't_login_biometria';
```

### Trocar o responsável

```sql
update tasks set who = 'Rafael Soares' where id = 't_login_biometria';
```

Para deixar sem responsável, use `''` — **não** `NULL`.

### Marcar ou limpar uma trava

```sql
-- travar
update tasks set dependency = 'depende de contrato com o fornecedor'
where id = 't_login_biometria';

-- destravar
update tasks set dependency = '' where id = 't_login_biometria';
```

### Mudar as datas de um bife (e a entrega do projeto)

```sql
update blocks set start_date = '2026-10-20', end_date = '2026-11-14'
where id = 'b_notificacoes';
```

Garanta que `end_date >= start_date`. Datas invertidas produzem duração 0 e o bife
some da barra de tempo (fica com largura zero).

### Renomear uma pessoa — DUAS operações, nesta ordem

Não pule a segunda, ou as tarefas ficam órfãs (§8, regra 3).

```sql
-- 1) atualiza as tarefas primeiro, casando pelo nome ANTIGO
update tasks set who = 'Victor Almeida' where who = 'Victor';
```

```sql
-- 2) só então renomeia a pessoa
update people set name = 'Victor Almeida' where id = 'p6';
```

### Excluir uma tarefa

Sem consequências, nada depende dela:

```sql
delete from tasks where id = 't_login_biometria';
```

### Excluir um bife — DUAS operações, nesta ordem

As tarefas do bife **não** devem ser apagadas: elas ficam sem bloco. E a ordem
importa, porque existe um vínculo de `tasks` para `blocks`:

```sql
-- 1) solta as tarefas
update tasks set block_id = NULL where block_id = 'b_notificacoes';
```

```sql
-- 2) agora o bloco pode ser apagado
delete from blocks where id = 'b_notificacoes';
```

Se você tentar o `delete` primeiro, o banco recusa com erro de chave estrangeira
(`23503`). Não é bug — é a proteção funcionando.

### Excluir uma fase — mova os blocos antes

```sql
-- 1) tira os blocos da fase
update blocks set phase_id = NULL where phase_id = 'v5.0';
```

```sql
-- 2) apaga a fase
delete from phases where id = 'v5.0';
```

### Excluir uma área — mova as tarefas antes

`tasks.area_id` é **obrigatório**, então não existe "sem área" para tarefa: você
tem de realocá-las.

```sql
-- 1) realoca as tarefas para outra área existente
update tasks set area_id = 'dev' where area_id = 'marketing';
```

```sql
-- 2) apaga a área. As pessoas ligadas a ela ficam sem área automaticamente.
delete from areas where id = 'marketing';
```

### Excluir uma pessoa

```sql
delete from people where id = 'p_ana';
```

As tarefas dela **continuam** com o nome no campo `who` — de propósito, para
preservar o histórico. Se quiser limpar:

```sql
update tasks set who = '' where who = 'Ana Souza';
```

### Ordem geral para apagar muitos dados

Se precisar limpar o projeto, respeite esta ordem por causa dos vínculos:

```
tasks  →  blocks  →  phases  →  people  →  areas
```

E **preserve `statuses` e `priorities`** — são referência, não conteúdo. Sem elas
nenhuma tarefa pode ser criada depois.

## 10. O que NUNCA fazer

Lista curta e séria. Os três primeiros itens **quebram a tela**, não só deixam
dado feio.

### 1. Nunca invente um `status_id`

Somente estes sete: `discovery`, `backlog`, `planejado`, `execucao`, `validacao`,
`pronto`, `entregue`.

O banco vai aceitar qualquer valor que exista na tabela `statuses` — mas a
aplicação lê nome e cor dos status **do próprio código**, casando pelo id. Um id
que o código não conhece faz a tela do quadro **quebrar com erro de JavaScript**,
não apenas exibir estranho.

Ou seja: inserir uma linha nova em `statuses` e usá-la numa tarefa **derruba o
painel**. Criar status novo exige alteração de código — o que está fora do seu
escopo.

### 2. Nunca invente um `priority_id`

Somente `alta`, `media`, `baixa`. Mesmo motivo, mesmo efeito.

Repare que é `media` **sem acento**.

### 3. Nunca aponte `area_id` para uma área que não existe

O banco barra (é chave estrangeira), mas vale saber por quê: `area_id` é
obrigatório e a tela usa a cor da área em vários lugares.

### 4. Nunca grave data no formato brasileiro

`'01/08/2026'` não é um `date` válido. Use `'2026-08-01'`.

### 5. Nunca use `NULL` em coluna de texto

`who`, `dependency`, `theme`, `short`, `role`, `responsibility` são `not null`.
Para vazio, use `''`.

### 6. Nunca grave o id da pessoa em `tasks.who`

É o nome. Ver §8, regra 3.

### 7. Nunca trabalhe no banco `dpto_processos`

É o espelho errado. Confirme com `select current_database();`. Ver §6.

### 8. Não conte com validação da aplicação

Todas as proteções da interface — não deixar excluir área com tarefas, não aceitar
fim antes do início, exigir descrição — vivem **na tela**. Escrevendo direto no
banco você passa por cima delas. As únicas proteções que continuam valendo são as
do próprio banco: chaves estrangeiras, `not null` e tipos.

## 11. Como conferir que deu certo

### Confirmação básica de contexto

```sql
select current_database(), current_schema(), current_user;
```

### Panorama do projeto

```sql
select
  (select count(*) from tasks)  as tarefas,
  (select count(*) from blocks) as bifes,
  (select count(*) from people) as pessoas,
  (select count(*) from areas)  as areas,
  (select count(*) from phases) as fases;
```

### Os números que a tela vai mostrar

```sql
select
  count(*)                                              as total,
  count(*) filter (where status_id = 'entregue')        as entregues,
  count(*) filter (where status_id in ('execucao','validacao','pronto')) as andamento,
  count(*) filter (where dependency <> '')              as travadas,
  round(100.0 * count(*) filter (where status_id = 'entregue') / nullif(count(*),0)) as pct_conclusao
from tasks;
```

Compare com os quatro KPIs do Dashboard. Se divergir, você olhou o banco errado
ou a página não foi recarregada.

### Duração total e data de entrega do projeto

```sql
select
  sum(end_date - start_date + 1)  as total_dias,
  min(start_date)                 as inicio,
  max(end_date)                   as entrega_prevista,
  max(end_date) - current_date    as dias_restantes
from blocks
where start_date is not null and end_date is not null;
```

O `+ 1` é a contagem inclusiva (§5).

### Caça a problemas — todas estas consultas devem devolver ZERO linhas

```sql
-- status inválido (quebraria a tela)
select id, status_id from tasks
where status_id not in ('discovery','backlog','planejado','execucao','validacao','pronto','entregue');
```

```sql
-- prioridade inválida
select id, priority_id from tasks where priority_id not in ('alta','media','baixa');
```

```sql
-- responsável que não é pessoa cadastrada (pode ser intencional, ex.: 'Jurídico',
-- mas confira se não é erro de digitação ou id gravado como nome)
select distinct t.who from tasks t
where t.who <> '' and not exists (select 1 from people p where trim(p.name) = trim(t.who));
```

```sql
-- bife com datas invertidas ou incompletas (sai da linha do tempo)
select id, name, start_date, end_date from blocks
where (start_date is null) <> (end_date is null)
   or (start_date is not null and end_date < start_date);
```

```sql
-- tarefas que terminam depois da entrega prevista (aparecem como desalinhamento)
select id, description, end_date from tasks
where end_date > (select max(end_date) from blocks where end_date is not null);
```

```sql
-- há patrocinador identificável? deve devolver exatamente 1 linha
select id, name, role from people
where role ilike '%sponsor%'
   or (role ilike '%patrocinador%' and role not ilike '%técnic%' and role not ilike '%tecnic%');
```

### Por último: recarregue a página

Nenhuma alteração aparece sem recarregar. Se ainda não aparecer, verifique o selo
no topo do painel: **"Ao vivo"** (verde) significa que ele está lendo o banco;
**"Modo demo"** (âmbar) significa que ele **não** conseguiu conectar e está
mostrando dados fictícios de demonstração — nesse caso, nada que você grave vai
aparecer, e o problema é de configuração/rede, não seu.

## 12. Referência rápida

### Status (os 7 válidos)

| `status_id` | Nome | Conta como… |
|---|---|---|
| `discovery` | Discovery | — |
| `backlog` | Backlog | — |
| `planejado` | Planejado | — |
| `execucao` | Em execução | andamento |
| `validacao` | Em validação | andamento |
| `pronto` | Pronto p/ entrega | andamento + "entregue recentemente" |
| `entregue` | Entregue | **concluído** |

### Prioridades (as 3 válidas)

`alta` · `media` (sem acento) · `baixa`

### Áreas iniciais

| `id` | Nome | Cor |
|---|---|---|
| `dev` | Desenvolvimento | `#F97316` |
| `juridico` | Jurídico | `#3B82F6` |
| `cobranca` | Cobrança | `#8B5CF6` |
| `financeiro` | Financeiro | `#10B981` |
| `parcerias` | Parcerias | `#EC4899` |

### Fases iniciais

`v1.0` Base sólida · `v2.0` Reter & renegociar · `v3.0` Receita recorrente ·
`v4.0` Plataforma financeira

### Vazio: qual usar

| Coluna | Vazio é |
|---|---|
| `start_date`, `end_date` | `NULL` |
| `block_id`, `phase_id`, `people.area_id` | `NULL` |
| `who`, `dependency`, `theme`, `short`, `role`, `responsibility` | `''` |
| `tasks.area_id` | **não existe vazio** — é obrigatório |

### Operações que exigem dois comandos, na ordem

| Operação | 1º | 2º |
|---|---|---|
| Renomear pessoa | `update tasks set who = novo where who = antigo` | `update people set name = novo` |
| Excluir bife | `update tasks set block_id = NULL where block_id = X` | `delete from blocks where id = X` |
| Excluir fase | `update blocks set phase_id = NULL where phase_id = X` | `delete from phases where id = X` |
| Excluir área | `update tasks set area_id = outra where area_id = X` | `delete from areas where id = X` |

### Checklist antes de começar

1. `select current_database();` → **`dpto_processo_superapp`**
2. `set search_path to meu_inc_app;`
3. Um comando SQL por vez, se o conector exigir

### Checklist depois de terminar

1. Rodar as consultas de caça a problemas da §11 — todas com zero linhas
2. Conferir os números com o Dashboard
3. Recarregar a página do painel
4. Confirmar que o selo está em **"Ao vivo"**

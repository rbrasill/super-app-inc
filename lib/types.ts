export type StatusId =
  | "discovery"
  | "backlog"
  | "planejado"
  | "execucao"
  | "validacao"
  | "pronto"
  | "entregue";

export type AreaId = "dev" | "juridico" | "cobranca" | "financeiro" | "parcerias";

export type PriorityId = "alta" | "media" | "baixa";

export interface Status {
  id: StatusId;
  name: string;
  sub: string;
  color: string;
  soft: string;
  light?: boolean;
}

export interface Area {
  id: AreaId;
  name: string;
  color: string;
}

/**
 * Fase do roadmap (v1.0–v4.0). Camada acima dos blocos: cada bloco se
 * encaixa em uma fase; as tarefas pertencem aos blocos.
 */
export interface Fase {
  id: string;
  /** Nome completo (ex.: "v1.0 · Base sólida"). */
  name: string;
  /** Rótulo curto (ex.: "v1.0"). */
  short: string;
}

/**
 * Bloco ("bife") — fatia temática do projeto. Cada bloco agrupa tarefas
 * (o "pacote completo": tela + back + regra + cadastro) e recebe um prazo
 * próprio em dias; a soma dos blocos fecha o período do projeto.
 */
export interface Bloco {
  id: string;
  /** Nome do bloco (ex.: "Primeiro Acesso"). */
  name: string;
  /** Tema / o que entra no bloco. */
  theme: string;
  /** Dias alocados para o bloco. */
  days: number;
  /** Cor de destaque. */
  color: string;
  /** Fase do roadmap em que o bloco se encaixa ("" = sem fase). */
  phaseId: string;
}

export interface Priority {
  label: string;
  bg: string;
  text: string;
}

export interface Task {
  id: string;
  desc: string;
  area: AreaId;
  /** Bloco ao qual a tarefa pertence ("" = sem bloco). */
  blockId: string;
  who: string;
  prio: PriorityId;
  status: StatusId;
  start: string;
  end: string;
  dep: string;
}

export interface Person {
  name: string;
  role: string;
  resp: string;
}

/** Tarefa com campos derivados prontos para exibição. */
export interface DecoratedTask extends Task {
  areaName: string;
  color: string;
  prioLabel: string;
  prioBg: string;
  prioText: string;
  hasDates: boolean;
  dateLabel: string;
  initials: string;
  whoLabel: string;
  statusName: string;
  statusColor: string;
  statusSoft: string;
  blockName: string;
  blockColor: string;
  depText: string;
  hasDep: boolean;
}

export type View = "board" | "blocks" | "dash" | "sponsor" | "people";
export type Sub = "kanban" | "grouped";

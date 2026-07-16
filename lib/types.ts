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

export interface Priority {
  label: string;
  bg: string;
  text: string;
}

export interface Task {
  id: string;
  desc: string;
  area: AreaId;
  phase: string;
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
  phaseShort: string;
  depText: string;
  hasDep: boolean;
}

export type View = "board" | "dash" | "sponsor" | "people";
export type Sub = "kanban" | "grouped";

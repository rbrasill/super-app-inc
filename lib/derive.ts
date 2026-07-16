import { AREAS, AV_PALETTE, PEOPLE_RAW, PHASES, PROJECT, PRIO, STATUSES } from "./data";
import { THEME } from "./theme";
import type { Area, Bloco, DecoratedTask, Fase, Status, Task } from "./types";

const areaMap: Record<string, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a]));
const statusMap: Record<string, Status> = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
const phaseMap: Record<string, Fase> = Object.fromEntries(PHASES.map((p) => [p.id, p]));

const fmt = (d: string): string => {
  if (!d) return "";
  const p = d.split("-");
  return `${p[2]}/${p[1]}`;
};

/** Soma `n` dias a uma data ISO (yyyy-mm-dd) e devolve outra data ISO. */
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const blockMapOf = (blocks: Bloco[]): Record<string, Bloco> =>
  Object.fromEntries(blocks.map((b) => [b.id, b]));

export function decorate(tk: Task, blocks: Record<string, Bloco>): DecoratedTask {
  const a = areaMap[tk.area];
  const p = PRIO[tk.prio || "media"];
  const st = statusMap[tk.status];
  const bl = blocks[tk.blockId];
  const hasDates = !!(tk.start || tk.end);
  return {
    ...tk,
    areaName: a.name,
    color: a.color,
    prioLabel: p.label,
    prioBg: p.bg,
    prioText: p.text,
    hasDates,
    dateLabel: hasDates ? `${fmt(tk.start) || "—"} → ${fmt(tk.end) || "—"}` : "Sem prazo",
    initials: tk.who && tk.who.trim() ? tk.who.trim()[0].toUpperCase() : "",
    whoLabel: tk.who && tk.who.trim() ? tk.who : "—",
    statusName: st.name,
    statusColor: st.color,
    statusSoft: st.soft,
    blockName: bl ? bl.name : "Sem bloco",
    blockColor: bl ? bl.color : THEME.inkFaint,
    depText: tk.dep || "",
    hasDep: !!tk.dep,
  };
}

export interface BoardColumn extends Status {
  count: number;
  tasks: DecoratedTask[];
  empty: boolean;
}

export function getBoard(tasks: Task[], blocks: Bloco[]): BoardColumn[] {
  const bm = blockMapOf(blocks);
  return STATUSES.map((s) => {
    const items = tasks.filter((tk) => tk.status === s.id).map((tk) => decorate(tk, bm));
    return { ...s, count: items.length, tasks: items, empty: items.length === 0 };
  });
}

export interface GroupedArea {
  id: string;
  name: string;
  color: string;
  count: number;
  rows: DecoratedTask[];
}

export function getGrouped(tasks: Task[], blocks: Bloco[]): GroupedArea[] {
  const bm = blockMapOf(blocks);
  return AREAS.map((a) => {
    const rows = tasks.filter((tk) => tk.area === a.id).map((tk) => decorate(tk, bm));
    return { id: a.id, name: a.name, color: a.color, count: rows.length, rows };
  }).filter((g) => g.count > 0);
}

export interface Kpis {
  total: number;
  andamento: number;
  entregue: number;
  travadas: number;
  pct: number;
  decisions: number;
}

function decisionTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (tk) => (tk.area === "financeiro" || tk.area === "parcerias") && (tk.dep || tk.status === "discovery")
  );
}

export function getKpis(tasks: Task[]): Kpis {
  const total = tasks.length;
  const entregue = tasks.filter((tk) => tk.status === "entregue").length;
  const andamento = tasks.filter((tk) => ["execucao", "validacao", "pronto"].includes(tk.status)).length;
  const travadas = tasks.filter((tk) => tk.dep).length;
  const pct = total ? Math.round((entregue / total) * 100) : 0;
  return { total, andamento, entregue, travadas, pct, decisions: decisionTasks(tasks).length };
}

export interface AreaDistSeg {
  w: string;
  color: string;
  textColor: string;
  label: string;
}
export interface AreaDistRow {
  name: string;
  segs: AreaDistSeg[];
  total: number;
}

export function getAreaDist(tasks: Task[]): AreaDistRow[] {
  return AREAS.map((a) => {
    const items = tasks.filter((tk) => tk.area === a.id);
    const segs = STATUSES.map((s) => {
      const n = items.filter((tk) => tk.status === s.id).length;
      if (!n) return null;
      const w = (n / items.length) * 100;
      return {
        w: w.toFixed(2) + "%",
        color: s.color,
        textColor: s.light ? "#3A403D" : "#fff",
        label: w > 9 ? String(n) : "",
      };
    }).filter(Boolean) as AreaDistSeg[];
    return { name: a.name, segs, total: items.length };
  }).filter((r) => r.total > 0);
}

export function getLegend(): { name: string; color: string }[] {
  return STATUSES.map((s) => ({ name: s.name, color: s.color }));
}

/** Segmento da distribuição por área dentro de um bloco. */
export interface BlockAreaSeg {
  name: string;
  color: string;
  count: number;
  w: string;
}

export interface BlockRow {
  id: string;
  name: string;
  short: string;
  theme: string;
  color: string;
  /** Fase do roadmap em que o bloco se encaixa. */
  phaseId: string;
  phaseName: string;
  phaseShort: string;
  /** Número do "bife" (1-based, na ordem dos blocos). */
  bife: number;
  days: number;
  daysLabel: string;
  /** Posição na timeline do período (0–100%). */
  offsetPct: string;
  widthPct: string;
  /** Dia inicial/final dentro do período (1-based). */
  startDay: number;
  endDay: number;
  dateRange: string;
  weekRange: string;
  /** Progresso / semáforo. */
  count: number;
  done: number;
  blocked: number;
  lampColor: string;
  txt: string;
  pct: string;
  pctLabel: string;
  meta: string;
  sponsorMeta: string;
  /** Distribuição das tarefas do bloco entre as áreas. */
  areaSegs: BlockAreaSeg[];
  empty: boolean;
}

export interface BlocksSummary {
  totalDays: number;
  allocatedDays: number;
  /** Diferença entre o alocado e o período (0 = encaixe perfeito). */
  overflowDays: number;
  weeks: number;
  fitLabel: string;
  fitColor: string;
}

const projectStart = (project = PROJECT) => project.startDate;

export function getBlocks(tasks: Task[], blocks: Bloco[], project = PROJECT): BlockRow[] {
  let cursor = 0; // dias acumulados antes do bloco atual
  return blocks.map((b, i) => {
    const items = tasks.filter((tk) => tk.blockId === b.id);
    const done = items.filter((tk) => tk.status === "entregue").length;
    const blocked = items.filter((tk) => tk.dep).length;
    const pc = items.length ? Math.round((done / items.length) * 100) : 0;

    let lampColor = "#10B981";
    let txt = "No ritmo";
    if (blocked > 0 && pc < 50) {
      lampColor = "#EF4444";
      txt = "Em risco";
    } else if (blocked > 0 || pc < 40) {
      lampColor = "#F59E0B";
      txt = "Atenção";
    }
    if (items.length === 0) {
      lampColor = THEME.inkFaint;
      txt = "Sem tarefas";
    }

    const days = Math.max(0, b.days);
    const startDay = cursor + 1;
    const endDay = cursor + days;
    const startDate = addDays(projectStart(project), cursor);
    const endDate = addDays(projectStart(project), Math.max(cursor, endDay - 1));
    const weekStart = Math.floor(cursor / 7) + 1;
    const weekEnd = Math.max(weekStart, Math.ceil(endDay / 7));
    cursor = endDay;

    // Distribuição por área dentro do bloco.
    const areaSegs: BlockAreaSeg[] = AREAS.map((a) => {
      const n = items.filter((tk) => tk.area === a.id).length;
      if (!n) return null;
      return { name: a.name, color: a.color, count: n, w: ((n / items.length) * 100).toFixed(2) + "%" };
    }).filter(Boolean) as BlockAreaSeg[];

    const phase = phaseMap[b.phaseId];

    return {
      id: b.id,
      name: b.name,
      short: b.name,
      theme: b.theme,
      color: b.color,
      phaseId: b.phaseId,
      phaseName: phase?.name ?? "",
      phaseShort: phase?.short ?? "",
      bife: i + 1,
      days,
      daysLabel: `${days}d`,
      offsetPct: ((cursor - days) / project.totalDays) * 100 + "%",
      widthPct: (days / project.totalDays) * 100 + "%",
      startDay,
      endDay,
      dateRange: `${fmt(startDate)} → ${fmt(endDate)}`,
      weekRange: weekStart === weekEnd ? `Semana ${weekStart}` : `Semanas ${weekStart}–${weekEnd}`,
      count: items.length,
      done,
      blocked,
      lampColor,
      txt,
      pct: pc + "%",
      pctLabel: pc + "%",
      meta: `${items.length} tarefa(s) · ${done} entregue(s)` + (blocked ? ` · ${blocked} com trava` : ""),
      sponsorMeta: `${done} de ${items.length} entregue(s)`,
      areaSegs,
      empty: items.length === 0,
    };
  });
}

export function getBlocksSummary(blocks: Bloco[], project = PROJECT): BlocksSummary {
  const allocatedDays = blocks.reduce((s, b) => s + Math.max(0, b.days), 0);
  const overflowDays = allocatedDays - project.totalDays;
  let fitLabel = "Encaixe perfeito nos " + project.totalDays + " dias";
  let fitColor = "#10B981";
  if (overflowDays > 0) {
    fitLabel = `${overflowDays} dia(s) além do período`;
    fitColor = "#EF4444";
  } else if (overflowDays < 0) {
    fitLabel = `${Math.abs(overflowDays)} dia(s) livre(s) no período`;
    fitColor = "#F59E0B";
  }
  return {
    totalDays: project.totalDays,
    allocatedDays,
    overflowDays,
    weeks: Math.round(project.totalDays / 7),
    fitLabel,
    fitColor,
  };
}

export interface RiskRow {
  desc: string;
  sub: string;
}

export function getRisks(tasks: Task[]): RiskRow[] {
  return tasks
    .filter((tk) => tk.dep)
    .map((tk) => ({ desc: tk.desc, sub: `${areaMap[tk.area].name} · ${tk.dep}` }));
}

export interface DecisionRow {
  n: number;
  desc: string;
  sub: string;
}

export function getDecisions(tasks: Task[]): DecisionRow[] {
  return decisionTasks(tasks).map((tk, i) => ({
    n: i + 1,
    desc: tk.desc,
    sub: areaMap[tk.area].name + (tk.dep ? ` · ${tk.dep}` : ""),
  }));
}

export interface DeliveredRow {
  desc: string;
  sub: string;
}

export function getDelivered(tasks: Task[]): DeliveredRow[] {
  return tasks
    .filter((tk) => tk.status === "entregue" || tk.status === "pronto")
    .map((tk) => ({ desc: tk.desc, sub: `${areaMap[tk.area].name} · ${statusMap[tk.status].name}` }));
}

export interface PersonRow {
  name: string;
  role: string;
  resp: string;
  initials: string;
  avBg: string;
  avColor: string;
}

export function getPeople(): PersonRow[] {
  return PEOPLE_RAW.map((r, i) => {
    const undef = r[0] === "A definir";
    return {
      name: r[0],
      role: r[1],
      resp: r[2],
      initials: undef ? "?" : r[0][0].toUpperCase(),
      avBg: undef ? THEME.chip : AV_PALETTE[i % AV_PALETTE.length] + "22",
      avColor: undef ? THEME.inkFaint : AV_PALETTE[i % AV_PALETTE.length],
    };
  });
}

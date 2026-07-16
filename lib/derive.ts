import { AREAS, AV_PALETTE, PEOPLE_RAW, PHASES, PRIO, STATUSES } from "./data";
import { THEME } from "./theme";
import type { Area, DecoratedTask, Status, Task } from "./types";

const areaMap: Record<string, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a]));
const statusMap: Record<string, Status> = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

const fmt = (d: string): string => {
  if (!d) return "";
  const p = d.split("-");
  return `${p[2]}/${p[1]}`;
};

export function decorate(tk: Task): DecoratedTask {
  const a = areaMap[tk.area];
  const p = PRIO[tk.prio || "media"];
  const st = statusMap[tk.status];
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
    phaseShort: tk.phase ? tk.phase.split(" · ")[0] : "—",
    depText: tk.dep || "",
    hasDep: !!tk.dep,
  };
}

export interface BoardColumn extends Status {
  count: number;
  tasks: DecoratedTask[];
  empty: boolean;
}

export function getBoard(tasks: Task[]): BoardColumn[] {
  return STATUSES.map((s) => {
    const items = tasks.filter((tk) => tk.status === s.id).map(decorate);
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

export function getGrouped(tasks: Task[]): GroupedArea[] {
  return AREAS.map((a) => {
    const rows = tasks.filter((tk) => tk.area === a.id).map(decorate);
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

export interface PhaseRow {
  name: string;
  short: string;
  lampColor: string;
  txt: string;
  pct: string;
  pctLabel: string;
  meta: string;
  sponsorMeta: string;
}

export function getPhases(tasks: Task[]): PhaseRow[] {
  return PHASES.map((p) => {
    const items = tasks.filter((tk) => tk.phase === p);
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
    return {
      name: p,
      short: p.split(" · ")[0],
      lampColor,
      txt,
      pct: pc + "%",
      pctLabel: pc + "%",
      meta: `${items.length} tarefas · ${done} entregue(s)` + (blocked ? ` · ${blocked} com trava` : ""),
      sponsorMeta: `${done} de ${items.length} entregue(s)`,
    };
  });
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

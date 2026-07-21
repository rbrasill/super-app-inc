import { AREAS, PHASES, PROJECT, PRIO, STATUSES } from "./data";
import { THEME, whoAvatar } from "./theme";
import type { Area, Bloco, DecoratedTask, Fase, Person, Status, Task } from "./types";

const statusMap: Record<string, Status> = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

/** Fallback para tarefa cuja área não existe mais (ex.: recém-excluída). */
const UNKNOWN_AREA: Area = { id: "", name: "Sem área", color: THEME.inkFaint };
/** Mapa id→Área para lookup rápido. */
export const areaMapOf = (areas: Area[]): Record<string, Area> =>
  Object.fromEntries(areas.map((a) => [a.id, a]));
const areaOf = (am: Record<string, Area>, id: string): Area => am[id] ?? UNKNOWN_AREA;

/** Formata ISO (yyyy-mm-dd) como dd/mm/aaaa — padrão de data de todo o portal
 * (o projeto cruza a virada do ano, então o ano é sempre exibido). */
const fmt = (d: string): string => {
  if (!d) return "";
  const p = d.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
};

const DAY_MS = 86400000;

/** Converte data ISO em timestamp (meia-noite local); null se vazia/inválida. */
function toTime(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(iso + "T00:00:00").getTime();
  return Number.isNaN(t) ? null : t;
}

/** Dias inclusivos entre duas datas ISO (1 = mesmo dia; 0 se faltar/invertido). */
function inclusiveDays(start: string, end: string): number {
  const a = toTime(start);
  const b = toTime(end);
  if (a === null || b === null) return 0;
  const diff = Math.round((b - a) / DAY_MS);
  return diff >= 0 ? diff + 1 : 0;
}

const blockMapOf = (blocks: Bloco[]): Record<string, Bloco> =>
  Object.fromEntries(blocks.map((b) => [b.id, b]));

export function decorate(tk: Task, blocks: Record<string, Bloco>, areas: Record<string, Area>): DecoratedTask {
  const a = areas[tk.area] ?? UNKNOWN_AREA;
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
    ...whoAvatar(tk.who),
  };
}

export interface BoardColumn extends Status {
  count: number;
  tasks: DecoratedTask[];
  empty: boolean;
}

export function getBoard(tasks: Task[], blocks: Bloco[], areas: Area[] = AREAS): BoardColumn[] {
  const bm = blockMapOf(blocks);
  const am = areaMapOf(areas);
  return STATUSES.map((s) => {
    const items = tasks.filter((tk) => tk.status === s.id).map((tk) => decorate(tk, bm, am));
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

export function getGrouped(tasks: Task[], blocks: Bloco[], areas: Area[] = AREAS): GroupedArea[] {
  const bm = blockMapOf(blocks);
  const am = areaMapOf(areas);
  return areas
    .map((a) => {
      const rows = tasks.filter((tk) => tk.area === a.id).map((tk) => decorate(tk, bm, am));
      return { id: a.id, name: a.name, color: a.color, count: rows.length, rows };
    })
    .filter((g) => g.count > 0);
}

export interface Kpis {
  total: number;
  andamento: number;
  entregue: number;
  travadas: number;
  pct: number;
  decisions: number;
}

/**
 * Localiza o patrocinador entre as pessoas pelo papel: quem tem "sponsor" no
 * papel; senão, quem tem "patrocinador" que não seja o técnico. Assim não
 * dependemos de um nome fixo no código (as pessoas são editáveis).
 */
function findSponsor(people: Person[]): Person | undefined {
  return (
    people.find((p) => /sponsor/i.test(p.role)) ??
    people.find((p) => /patrocinador/i.test(p.role) && !/t[eé]cnic/i.test(p.role))
  );
}

/**
 * Decisões do patrocinador: tarefas cujo responsável é o sponsor e que ainda
 * não foram concluídas (fora de "pronto"/"entregue"). Sem sponsor definido
 * (ou sem nome), não há decisões.
 */
function decisionTasks(tasks: Task[], people: Person[]): Task[] {
  const sponsor = findSponsor(people);
  const name = sponsor?.name.trim();
  if (!name) return [];
  return tasks.filter((tk) => tk.who.trim() === name && tk.status !== "pronto" && tk.status !== "entregue");
}

export function getKpis(tasks: Task[], people: Person[] = []): Kpis {
  const total = tasks.length;
  const entregue = tasks.filter((tk) => tk.status === "entregue").length;
  const andamento = tasks.filter((tk) => ["execucao", "validacao", "pronto"].includes(tk.status)).length;
  const travadas = tasks.filter((tk) => tk.dep).length;
  const pct = total ? Math.round((entregue / total) * 100) : 0;
  return { total, andamento, entregue, travadas, pct, decisions: decisionTasks(tasks, people).length };
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

export function getAreaDist(tasks: Task[], areas: Area[] = AREAS): AreaDistRow[] {
  return areas.map((a) => {
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
  /** Faixa de datas do bife (dd/mm → dd/mm) ou "Sem datas". */
  dateRange: string;
  /** Datas ISO cruas do bife (para formatação livre no componente). */
  start: string;
  end: string;
  /** true quando início e fim estão definidos. */
  hasDates: boolean;
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
  /** Soma das durações (em dias) de todos os bifes. */
  totalDays: number;
  /** Menor data de início entre os bifes ("" se nenhum tem data). */
  startDate: string;
  /** Maior data de fim entre os bifes ("" se nenhum tem data). */
  endDate: string;
}

/** Ordena os bifes cronologicamente: por início, depois fim; sem data vai ao fim. */
function chronological(blocks: Bloco[]): Bloco[] {
  return [...blocks].sort((a, b) => {
    if (!a.start && !b.start) return 0;
    if (!a.start) return 1;
    if (!b.start) return -1;
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    return (a.end || "") < (b.end || "") ? -1 : (a.end || "") > (b.end || "") ? 1 : 0;
  });
}

/**
 * Janela da timeline: do primeiro início ao último fim entre os bifes. Sem
 * datas, cai no período do projeto (fallback). `spanDays` é inclusivo.
 */
function blocksWindow(blocks: Bloco[], project = PROJECT): { start: number; spanDays: number } {
  const times: number[] = [];
  for (const b of blocks) {
    const s = toTime(b.start);
    const e = toTime(b.end);
    if (s !== null) times.push(s);
    if (e !== null) times.push(e);
  }
  if (!times.length) return { start: toTime(project.startDate) ?? 0, spanDays: project.totalDays };
  const min = Math.min(...times);
  const max = Math.max(...times);
  return { start: min, spanDays: Math.max(1, Math.round((max - min) / DAY_MS) + 1) };
}

export function getBlocks(
  tasks: Task[],
  blocks: Bloco[],
  areas: Area[] = AREAS,
  phases: Fase[] = PHASES,
  project = PROJECT
): BlockRow[] {
  const phaseMap: Record<string, Fase> = Object.fromEntries(phases.map((p) => [p.id, p]));
  const win = blocksWindow(blocks, project);
  return chronological(blocks).map((b, i) => {
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

    // Duração e posição na timeline vêm das datas do próprio bife.
    const days = inclusiveDays(b.start, b.end);
    const hasDates = !!(b.start && b.end);
    const aTime = toTime(b.start);
    const offsetDays = aTime !== null ? Math.round((aTime - win.start) / DAY_MS) : 0;
    const offset = Math.max(0, Math.min(offsetDays, win.spanDays));
    const width = Math.max(0, Math.min(days, win.spanDays - offset));

    // Distribuição por área dentro do bloco.
    const areaSegs: BlockAreaSeg[] = areas.map((a) => {
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
      offsetPct: (offset / win.spanDays) * 100 + "%",
      widthPct: (width / win.spanDays) * 100 + "%",
      dateRange: hasDates ? `${fmt(b.start)} → ${fmt(b.end)}` : "Sem datas",
      start: b.start,
      end: b.end,
      hasDates,
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

export function getBlocksSummary(blocks: Bloco[]): BlocksSummary {
  const totalDays = blocks.reduce((s, b) => s + inclusiveDays(b.start, b.end), 0);
  const starts = blocks.map((b) => b.start).filter(Boolean).sort();
  const ends = blocks.map((b) => b.end).filter(Boolean).sort();
  return {
    totalDays,
    startDate: starts[0] ?? "",
    endDate: ends[ends.length - 1] ?? "",
  };
}

/** Um marco na linha do tempo: a entrega de um bife. */
export interface MilestoneSeg {
  id: string;
  name: string;
  color: string;
  /** Segmento do bife na linha (percentuais 0–100). */
  leftPct: number;
  widthPct: number;
  /** Posição do marco (fim do bife), 0–100. */
  endPct: number;
  /** Data do marco (dd/mm). */
  dateLabel: string;
  /** Todas as tarefas do bife entregues (marco cumprido). */
  delivered: boolean;
  /** Rótulo acima (true) ou abaixo (false) da linha — alternado. */
  labelTop: boolean;
}

export interface MilestoneLine {
  segs: MilestoneSeg[];
  /** Início e fim da janela do plano (dd/mm). */
  startLabel: string;
  endLabel: string;
  /** Data prevista de entrega (fim do último bife, ISO). */
  deliveryDate: string;
  /** Posição de hoje na linha (0–100) ou null se fora/indefinido. */
  todayPct: number | null;
  /** Dias até a entrega (negativo = atrasado); null sem datas. */
  daysLeft: number | null;
  /** Tarefas com fim DEPOIS da entrega prevista (desalinhamento do plano). */
  tasksBeyond: number;
  /** Duração total do plano em dias (do primeiro início ao fim da entrega). */
  totalDays: number;
  /** % do plano já decorrido até hoje (0–100, sem extrapolar); null sem "hoje". */
  progressPct: number | null;
}

/**
 * Linha de marcos do projeto: cada bife com datas vira um segmento e seu fim
 * é um marco de entrega. A entrega do projeto é o fim do último bife (o plano
 * é o compromisso; tarefas além dele são apontadas em `tasksBeyond`).
 */
export function getMilestones(tasks: Task[], blocks: Bloco[], todayIso: string): MilestoneLine {
  const dated = chronological(blocks).filter((b) => b.start && b.end);
  const empty: MilestoneLine = {
    segs: [],
    startLabel: "",
    endLabel: "",
    deliveryDate: "",
    todayPct: null,
    daysLeft: null,
    tasksBeyond: 0,
    totalDays: 0,
    progressPct: null,
  };
  if (!dated.length) return empty;

  const startT = Math.min(...dated.map((b) => toTime(b.start) as number));
  const endT = Math.max(...dated.map((b) => toTime(b.end) as number));
  const span = Math.max(1, endT - startT);
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - startT) / span) * 100));

  const segs: MilestoneSeg[] = dated.map((b, i) => {
    const items = tasks.filter((tk) => tk.blockId === b.id);
    const s = toTime(b.start) as number;
    const e = toTime(b.end) as number;
    return {
      id: b.id,
      name: b.name,
      color: b.color,
      leftPct: pct(s),
      widthPct: Math.max(0, pct(e) - pct(s)),
      endPct: pct(e),
      dateLabel: fmt(b.end),
      delivered: items.length > 0 && items.every((tk) => tk.status === "entregue"),
      labelTop: i % 2 === 0,
    };
  });

  const deliveryDate = dated.reduce((max, b) => (b.end > max ? b.end : max), dated[0].end);
  const todayT = toTime(todayIso);
  const daysLeft =
    todayT !== null ? Math.ceil(((toTime(deliveryDate) as number) - todayT) / DAY_MS) : null;

  return {
    segs,
    startLabel: fmt(dated[0].start),
    endLabel: fmt(deliveryDate),
    deliveryDate,
    todayPct: todayT !== null && todayT >= startT && todayT <= endT ? pct(todayT) : null,
    daysLeft,
    tasksBeyond: tasks.filter((tk) => tk.end && tk.end > deliveryDate).length,
    totalDays: Math.round(span / DAY_MS) + 1,
    progressPct: todayT !== null ? Math.max(0, Math.min(100, ((todayT - startT) / span) * 100)) : null,
  };
}

export interface RiskRow {
  desc: string;
  sub: string;
}

export function getRisks(tasks: Task[], areas: Area[] = AREAS): RiskRow[] {
  const am = areaMapOf(areas);
  return tasks
    .filter((tk) => tk.dep)
    .map((tk) => ({ desc: tk.desc, sub: `${areaOf(am, tk.area).name} · ${tk.dep}` }));
}

export interface DecisionRow {
  n: number;
  desc: string;
  sub: string;
}

export function getDecisions(tasks: Task[], people: Person[], areas: Area[] = AREAS): DecisionRow[] {
  const am = areaMapOf(areas);
  return decisionTasks(tasks, people).map((tk, i) => ({
    n: i + 1,
    desc: tk.desc,
    sub: areaOf(am, tk.area).name + (tk.dep ? ` · ${tk.dep}` : ""),
  }));
}

export interface DeliveredRow {
  desc: string;
  sub: string;
}

export function getDelivered(tasks: Task[], areas: Area[] = AREAS): DeliveredRow[] {
  const am = areaMapOf(areas);
  return tasks
    .filter((tk) => tk.status === "entregue" || tk.status === "pronto")
    .map((tk) => ({ desc: tk.desc, sub: `${areaOf(am, tk.area).name} · ${statusMap[tk.status].name}` }));
}

export interface PersonRow {
  id: string;
  name: string;
  role: string;
  resp: string;
  initials: string;
  avBg: string;
  avColor: string;
  /** Área ligada (nome/cor) ou vazio se não houver. */
  areaId: string;
  areaName: string;
  areaColor: string;
  hasArea: boolean;
}

export function getPeople(people: Person[], areas: Area[] = AREAS): PersonRow[] {
  const am = areaMapOf(areas);
  return people.map((p) => {
    const undef = !p.name.trim() || p.name === "A definir";
    const av = whoAvatar(p.name);
    const ar = p.area ? am[p.area] : undefined;
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      resp: p.resp,
      initials: undef ? "?" : p.name.trim()[0].toUpperCase(),
      avBg: undef ? THEME.chip : av.avBg,
      avColor: undef ? THEME.inkMute : av.avColor,
      areaId: ar?.id ?? "",
      areaName: ar?.name ?? "",
      areaColor: ar?.color ?? THEME.inkFaint,
      hasArea: !!ar,
    };
  });
}

export interface PersonProgress {
  id: string;
  name: string;
  initials: string;
  avBg: string;
  avColor: string;
  /** Tarefas atribuídas / entregues (recalcula ao criar/excluir tarefas). */
  total: number;
  done: number;
  pct: number;
}

/**
 * Conclusão de tarefas por pessoa: % de tarefas entregues sobre as atribuídas
 * (campo `who` = nome da pessoa). Só inclui quem tem ao menos uma tarefa;
 * ordena por % desc (desempate por volume). Recalcula sozinho conforme as
 * tarefas mudam.
 */
export function getPeopleProgress(tasks: Task[], people: Person[]): PersonProgress[] {
  return people
    .map((p) => {
      const name = p.name.trim();
      const mine = name ? tasks.filter((tk) => tk.who.trim() === name) : [];
      const total = mine.length;
      const done = mine.filter((tk) => tk.status === "entregue").length;
      const av = whoAvatar(p.name);
      return {
        id: p.id,
        name: p.name,
        initials: name ? name[0].toUpperCase() : "?",
        avBg: av.avBg,
        avColor: av.avColor,
        total,
        done,
        pct: total ? Math.round((done / total) * 100) : 0,
      };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.pct - a.pct || b.total - a.total);
}

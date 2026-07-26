"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AREAS, BLOCKS, PEOPLE, PHASES, TASKS } from "./data";
import { loadAll, mutate } from "./db/client";
import {
  areaFromRow,
  areaToRow,
  blockFromRow,
  blockToRow,
  personFromRow,
  personToRow,
  phaseFromRow,
  phaseToRow,
  taskFromRow,
  taskToRow,
} from "./db/rows";
import { del, ins, upd, type DbOp } from "./db/tables";
import type { Area, AreaId, Bloco, Fase, Person, StatusId, Task } from "./types";

export type AreaFilter = AreaId | "all";
export type BlockFilter = string | "all";
export type WhoFilter = string | "all";
export type StatusFilter = StatusId | "all";

export interface NewTaskInput {
  desc: string;
  area: AreaId;
  blockId: string;
  who: string;
  prio: Task["prio"];
  status: StatusId;
  start: string;
  end: string;
  dep: string;
}

export interface BlockInput {
  name: string;
  theme: string;
  start: string;
  end: string;
  color: string;
  phaseId: string;
}

export interface PersonInput {
  name: string;
  role: string;
  resp: string;
  area: string;
}

export interface AreaInput {
  name: string;
  color: string;
}

export interface PhaseInput {
  name: string;
  short: string;
}

export type ModalState = { mode: "new" } | { mode: "edit"; id: string } | null;

/**
 * De onde vêm/vão os dados:
 * - `loading` : ainda carregando na montagem.
 * - `db`      : conectado ao PostgreSQL ao vivo (persiste alterações).
 * - `demo`    : servidor sem as variáveis do banco, ou a carga falhou → dados
 *               estáticos em memória (nada é salvo). Serve para o app nunca
 *               ficar vazio.
 */
export type DataSource = "loading" | "db" | "demo";

/** Problema de banco a mostrar na tela — a carga ou uma gravação falhou. */
export interface DbIssue {
  kind: "load" | "save";
  message: string;
}

/** Gera um id único (usado em modo offline e como chave dos inserts). */
function makeId(prefix: string): string {
  const rnd = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${rnd.replace(/-/g, "").slice(0, 12)}`;
}

/** Extrai uma mensagem curta e legível de um erro qualquer. */
function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: string; detail?: string };
    return e.message || e.detail || "erro desconhecido";
  }
  return String(err);
}

interface StoreValue {
  tasks: Task[];
  filteredTasks: Task[];
  blocks: Bloco[];
  people: Person[];
  areas: Area[];
  phases: Fase[];
  loading: boolean;
  /** Origem dos dados: banco ao vivo (`db`) ou memória (`demo`). */
  dataSource: DataSource;
  /** Última falha de banco — carga ou gravação (null = tudo ok). */
  dbError: DbIssue | null;
  clearDbError: () => void;
  search: string;
  setSearch: (v: string) => void;
  areaFilter: AreaFilter;
  setAreaFilter: (v: AreaFilter) => void;
  blockFilter: BlockFilter;
  setBlockFilter: (v: BlockFilter) => void;
  whoFilter: WhoFilter;
  setWhoFilter: (v: WhoFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  addTask: (input: NewTaskInput) => void;
  updateTask: (id: string, patch: NewTaskInput) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: StatusId) => void;
  addBlock: (input: BlockInput) => void;
  updateBlock: (id: string, patch: BlockInput) => void;
  deleteBlock: (id: string) => void;
  addPerson: (input: PersonInput) => void;
  updatePerson: (id: string, patch: PersonInput) => void;
  deletePerson: (id: string) => void;
  addArea: (input: AreaInput) => void;
  updateArea: (id: string, patch: AreaInput) => void;
  deleteArea: (id: string) => void;
  addPhase: (input: PhaseInput) => void;
  updatePhase: (id: string, patch: PhaseInput) => void;
  deletePhase: (id: string) => void;
  modal: ModalState;
  openNew: () => void;
  openTask: (id: string) => void;
  closeModal: () => void;
  blockModal: ModalState;
  openNewBlock: () => void;
  openBlock: (id: string) => void;
  closeBlockModal: () => void;
  personModal: ModalState;
  openNewPerson: () => void;
  openPerson: (id: string) => void;
  closePersonModal: () => void;
  areaModal: ModalState;
  openNewArea: () => void;
  openArea: (id: string) => void;
  closeAreaModal: () => void;
  phaseModal: ModalState;
  openNewPhase: () => void;
  openPhase: (id: string) => void;
  closePhaseModal: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Começa vazio: só o servidor sabe se o banco está configurado, e a resposta
  // vem no primeiro fetch. Se não estiver (ou falhar), cai no modo demo.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<Bloco[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [phases, setPhases] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSource>("loading");
  const [dbError, setDbError] = useState<DbIssue | null>(null);
  const clearDbError = () => setDbError(null);

  // Em modo demo (banco não configurado OU fallback após falha de carga), não
  // tenta gravar: a tela mostra os dados estáticos, não os do banco — gravar
  // criaria estado misturado no banco e avisos de erro enganosos.
  const canPersist = dataSource === "db";

  /**
   * Envia escritas ao banco sem bloquear a UI (a tela já foi atualizada de
   * forma otimista); só registra falhas. Várias operações na mesma chamada vão
   * em transação, na ordem — use assim quando a ordem importa.
   */
  const persist = (...ops: DbOp[]) => {
    if (!canPersist || ops.length === 0) return;
    mutate(ops).then(({ error }) => {
      if (error) {
        console.error("[db]", error.message);
        setDbError({ kind: "save", message: error.message });
      }
    });
  };

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [blockFilter, setBlockFilter] = useState<BlockFilter>("all");
  const [whoFilter, setWhoFilter] = useState<WhoFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [blockModal, setBlockModal] = useState<ModalState>(null);
  const [personModal, setPersonModal] = useState<ModalState>(null);
  const [areaModal, setAreaModal] = useState<ModalState>(null);
  const [phaseModal, setPhaseModal] = useState<ModalState>(null);

  // Carga inicial: uma chamada a /api/data, que lê as 5 tabelas de uma vez.
  useEffect(() => {
    let alive = true;
    const fallback = () => {
      setTasks([...TASKS]);
      setBlocks(BLOCKS.map((x) => ({ ...x })));
      setPeople(PEOPLE.map((x) => ({ ...x })));
      setAreas(AREAS.map((x) => ({ ...x })));
      setPhases(PHASES.map((x) => ({ ...x })));
      setDataSource("demo");
    };
    (async () => {
      try {
        const boot = await loadAll();
        if (!alive) return;
        if (!boot.configured) {
          // Servidor sem PGHOST/DATABASE_URL: modo demo, sem erro na tela.
          fallback();
          return;
        }
        setTasks(boot.tasks.map(taskFromRow));
        setBlocks(boot.blocks.map(blockFromRow));
        setPeople(boot.people.map(personFromRow));
        setAreas(boot.areas.map(areaFromRow));
        setPhases(boot.phases.map(phaseFromRow));
        setDataSource("db");
      } catch (e) {
        if (!alive) return;
        // Rede/consulta falhou: cai nos dados estáticos para o app não ficar
        // vazio, mas mostra o motivo — modo demo silencioso já confundiu antes.
        console.error("[db] load", e);
        fallback();
        setDbError({ kind: "load", message: errText(e) });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((tk) => {
      if (areaFilter !== "all" && tk.area !== areaFilter) return false;
      if (blockFilter !== "all" && tk.blockId !== blockFilter) return false;
      if (whoFilter !== "all" && tk.who !== whoFilter) return false;
      if (statusFilter !== "all" && tk.status !== statusFilter) return false;
      if (q) {
        const hay = `${tk.desc} ${tk.who} ${tk.dep}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, search, areaFilter, blockFilter, whoFilter, statusFilter]);

  // ---- Tarefas ----
  const addTask = (input: NewTaskInput) => {
    const id = makeId("t");
    setTasks((prev) => [...prev, { id, ...input }]);
    persist(ins("tasks", { id, ...taskToRow(input) }));
  };

  const updateTask = (id: string, patch: NewTaskInput) => {
    setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, ...patch } : tk)));
    persist(upd("tasks", taskToRow(patch), "id", id));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((tk) => tk.id !== id));
    setModal(null);
    persist(del("tasks", "id", id));
  };

  const moveTask = (id: string, status: StatusId) => {
    setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, status } : tk)));
    persist(upd("tasks", { status_id: status }, "id", id));
  };

  // ---- Blocos ----
  // Nos `add*`: o sort_order sai do tamanho da lista atual (`blocks.length`), e
  // não de dentro do updater de estado — efeito colateral em updater roda duas
  // vezes no StrictMode e mandaria o insert duplicado.
  const addBlock = (input: BlockInput) => {
    const id = makeId("b");
    setBlocks((prev) => [...prev, { id, ...input }]);
    persist(ins("blocks", { id, ...blockToRow(input, blocks.length) }));
  };

  const updateBlock = (id: string, patch: BlockInput) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    persist(upd("blocks", blockToRow(patch), "id", id));
  };

  const deleteBlock = (id: string) => {
    // As tarefas do bloco não são apagadas — ficam sem bloco.
    setTasks((prev) => prev.map((tk) => (tk.blockId === id ? { ...tk, blockId: "" } : tk)));
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setBlockFilter((f) => (f === id ? "all" : f));
    setBlockModal(null);
    // Lote atômico e nesta ordem: tasks.block_id aponta para blocks(id), então
    // soltar as tarefas tem de acontecer antes do delete do bloco.
    persist(upd("tasks", { block_id: null }, "block_id", id), del("blocks", "id", id));
  };

  // ---- Pessoas ----
  const addPerson = (input: PersonInput) => {
    const id = makeId("p");
    setPeople((prev) => [...prev, { id, ...input }]);
    persist(ins("people", { id, ...personToRow(input, people.length) }));
  };

  const updatePerson = (id: string, patch: PersonInput) => {
    const old = people.find((p) => p.id === id);
    const renamed = !!old && old.name !== patch.name;
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (renamed) {
      // As tarefas guardam o nome da pessoa, não o id: renomear leva as tarefas.
      setTasks((ts) => ts.map((tk) => (tk.who === old.name ? { ...tk, who: patch.name } : tk)));
      setWhoFilter((f) => (f === old.name ? patch.name : f));
    }
    persist(
      upd("people", personToRow(patch), "id", id),
      ...(renamed ? [upd("tasks", { who: patch.name }, "who", old.name)] : [])
    );
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setPersonModal(null);
    persist(del("people", "id", id));
  };

  // ---- Áreas ----
  const addArea = (input: AreaInput) => {
    const id = makeId("a");
    setAreas((prev) => [...prev, { id, ...input }]);
    persist(ins("areas", { id, ...areaToRow(input, areas.length) }));
  };

  const updateArea = (id: string, patch: AreaInput) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    persist(upd("areas", areaToRow(patch), "id", id));
  };

  const deleteArea = (id: string) => {
    // A UI só permite excluir área sem tarefas. Pessoas ligadas são desvinculadas
    // (no banco, via ON DELETE SET NULL em people.area_id).
    setPeople((prev) => prev.map((p) => (p.area === id ? { ...p, area: "" } : p)));
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setAreaFilter((f) => (f === id ? "all" : f));
    setAreaModal(null);
    persist(del("areas", "id", id));
  };

  // ---- Fases ----
  const addPhase = (input: PhaseInput) => {
    const id = makeId("f");
    setPhases((prev) => [...prev, { id, ...input }]);
    persist(ins("phases", { id, ...phaseToRow(input, phases.length) }));
  };

  const updatePhase = (id: string, patch: PhaseInput) => {
    setPhases((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    persist(upd("phases", phaseToRow(patch), "id", id));
  };

  const deletePhase = (id: string) => {
    // A UI só permite excluir fase sem blocos (senão o FK do banco barraria).
    setPhases((prev) => prev.filter((f) => f.id !== id));
    setPhaseModal(null);
    persist(del("phases", "id", id));
  };

  const openNew = () => setModal({ mode: "new" });
  const openTask = (id: string) => setModal({ mode: "edit", id });
  const closeModal = () => setModal(null);

  const openNewBlock = () => setBlockModal({ mode: "new" });
  const openBlock = (id: string) => setBlockModal({ mode: "edit", id });
  const closeBlockModal = () => setBlockModal(null);

  const openNewPerson = () => setPersonModal({ mode: "new" });
  const openPerson = (id: string) => setPersonModal({ mode: "edit", id });
  const closePersonModal = () => setPersonModal(null);

  const openNewArea = () => setAreaModal({ mode: "new" });
  const openArea = (id: string) => setAreaModal({ mode: "edit", id });
  const closeAreaModal = () => setAreaModal(null);

  const openNewPhase = () => setPhaseModal({ mode: "new" });
  const openPhase = (id: string) => setPhaseModal({ mode: "edit", id });
  const closePhaseModal = () => setPhaseModal(null);

  const hasActiveFilters =
    search.trim() !== "" ||
    areaFilter !== "all" ||
    blockFilter !== "all" ||
    whoFilter !== "all" ||
    statusFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setAreaFilter("all");
    setBlockFilter("all");
    setWhoFilter("all");
    setStatusFilter("all");
  };

  const value: StoreValue = {
    tasks,
    filteredTasks,
    blocks,
    people,
    areas,
    phases,
    loading,
    dataSource,
    dbError,
    clearDbError,
    search,
    setSearch,
    areaFilter,
    setAreaFilter,
    blockFilter,
    setBlockFilter,
    whoFilter,
    setWhoFilter,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    clearFilters,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addBlock,
    updateBlock,
    deleteBlock,
    addPerson,
    updatePerson,
    deletePerson,
    addArea,
    updateArea,
    deleteArea,
    addPhase,
    updatePhase,
    deletePhase,
    modal,
    openNew,
    openTask,
    closeModal,
    blockModal,
    openNewBlock,
    openBlock,
    closeBlockModal,
    personModal,
    openNewPerson,
    openPerson,
    closePersonModal,
    areaModal,
    openNewArea,
    openArea,
    closeAreaModal,
    phaseModal,
    openNewPhase,
    openPhase,
    closePhaseModal,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}

"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { BLOCKS, PEOPLE, TASKS } from "./data";
import type { AreaId, Bloco, Person, StatusId, Task } from "./types";

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
  days: number;
  color: string;
  phaseId: string;
}

export interface PersonInput {
  name: string;
  role: string;
  resp: string;
}

export type ModalState = { mode: "new" } | { mode: "edit"; id: string } | null;

/** Gera um id único com o prefixo dado, sem colidir com os existentes. */
function makeId(prefix: string, existing: { id: string }[]): string {
  const ids = new Set(existing.map((e) => e.id));
  let n = existing.length + 1;
  while (ids.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

interface StoreValue {
  /** Todas as tarefas (sem filtro) — usado por Dashboard / Patrocinador / Blocos. */
  tasks: Task[];
  /** Tarefas após busca + filtros — usado no Quadro. */
  filteredTasks: Task[];
  /** Blocos ("bifes") do projeto. */
  blocks: Bloco[];
  /** Pessoas & papéis (time). */
  people: Person[];
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
  // Tarefas
  addTask: (input: NewTaskInput) => void;
  updateTask: (id: string, patch: NewTaskInput) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: StatusId) => void;
  // Blocos
  addBlock: (input: BlockInput) => void;
  updateBlock: (id: string, patch: BlockInput) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  // Pessoas
  addPerson: (input: PersonInput) => void;
  updatePerson: (id: string, patch: PersonInput) => void;
  deletePerson: (id: string) => void;
  /** Modal de criar/editar tarefa. */
  modal: ModalState;
  openNew: () => void;
  openTask: (id: string) => void;
  closeModal: () => void;
  /** Modal de criar/editar bloco. */
  blockModal: ModalState;
  openNewBlock: () => void;
  openBlock: (id: string) => void;
  closeBlockModal: () => void;
  /** Modal de criar/editar pessoa. */
  personModal: ModalState;
  openNewPerson: () => void;
  openPerson: (id: string) => void;
  closePersonModal: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => [...TASKS]);
  const [blocks, setBlocks] = useState<Bloco[]>(() => BLOCKS.map((b) => ({ ...b })));
  const [people, setPeople] = useState<Person[]>(() => PEOPLE.map((p) => ({ ...p })));
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [blockFilter, setBlockFilter] = useState<BlockFilter>("all");
  const [whoFilter, setWhoFilter] = useState<WhoFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [blockModal, setBlockModal] = useState<ModalState>(null);
  const [personModal, setPersonModal] = useState<ModalState>(null);

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
    setTasks((prev) => [...prev, { id: makeId("t", prev), ...input }]);
  };

  const updateTask = (id: string, patch: NewTaskInput) => {
    setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, ...patch } : tk)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((tk) => tk.id !== id));
    setModal(null);
  };

  const moveTask = (id: string, status: StatusId) => {
    setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, status } : tk)));
  };

  // ---- Blocos ----
  const addBlock = (input: BlockInput) => {
    setBlocks((prev) => [...prev, { id: makeId("b", prev), ...input }]);
  };

  const updateBlock = (id: string, patch: BlockInput) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const deleteBlock = (id: string) => {
    // As tarefas do bloco não são apagadas — ficam sem bloco.
    setTasks((prev) => prev.map((tk) => (tk.blockId === id ? { ...tk, blockId: "" } : tk)));
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setBlockFilter((f) => (f === id ? "all" : f));
    setBlockModal(null);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // ---- Pessoas ----
  const addPerson = (input: PersonInput) => {
    setPeople((prev) => [...prev, { id: makeId("p", prev), ...input }]);
  };

  const updatePerson = (id: string, patch: PersonInput) => {
    // Renomear a pessoa reflete nas tarefas cujo responsável era o nome antigo.
    setPeople((prev) => {
      const old = prev.find((p) => p.id === id);
      if (old && old.name !== patch.name) {
        setTasks((ts) => ts.map((tk) => (tk.who === old.name ? { ...tk, who: patch.name } : tk)));
        setWhoFilter((f) => (f === old.name ? patch.name : f));
      }
      return prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
    });
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setPersonModal(null);
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
    moveBlock,
    addPerson,
    updatePerson,
    deletePerson,
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}

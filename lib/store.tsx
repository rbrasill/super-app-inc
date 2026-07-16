"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { BLOCKS, TASKS } from "./data";
import type { AreaId, Bloco, StatusId, Task } from "./types";

export type AreaFilter = AreaId | "all";
export type BlockFilter = string | "all";

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
  /** Tarefas após busca + filtro de área/bloco — usado no Quadro. */
  filteredTasks: Task[];
  /** Blocos ("bifes") do projeto. */
  blocks: Bloco[];
  search: string;
  setSearch: (v: string) => void;
  areaFilter: AreaFilter;
  setAreaFilter: (v: AreaFilter) => void;
  blockFilter: BlockFilter;
  setBlockFilter: (v: BlockFilter) => void;
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
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => [...TASKS]);
  const [blocks, setBlocks] = useState<Bloco[]>(() => BLOCKS.map((b) => ({ ...b })));
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [blockFilter, setBlockFilter] = useState<BlockFilter>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [blockModal, setBlockModal] = useState<ModalState>(null);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((tk) => {
      if (areaFilter !== "all" && tk.area !== areaFilter) return false;
      if (blockFilter !== "all" && tk.blockId !== blockFilter) return false;
      if (q) {
        const hay = `${tk.desc} ${tk.who} ${tk.dep}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, search, areaFilter, blockFilter]);

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

  const openNew = () => setModal({ mode: "new" });
  const openTask = (id: string) => setModal({ mode: "edit", id });
  const closeModal = () => setModal(null);

  const openNewBlock = () => setBlockModal({ mode: "new" });
  const openBlock = (id: string) => setBlockModal({ mode: "edit", id });
  const closeBlockModal = () => setBlockModal(null);

  const hasActiveFilters = search.trim() !== "" || areaFilter !== "all" || blockFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setAreaFilter("all");
    setBlockFilter("all");
  };

  const value: StoreValue = {
    tasks,
    filteredTasks,
    blocks,
    search,
    setSearch,
    areaFilter,
    setAreaFilter,
    blockFilter,
    setBlockFilter,
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
    modal,
    openNew,
    openTask,
    closeModal,
    blockModal,
    openNewBlock,
    openBlock,
    closeBlockModal,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}

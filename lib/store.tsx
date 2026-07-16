"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { TASKS } from "./data";
import type { AreaId, StatusId, Task } from "./types";

export type AreaFilter = AreaId | "all";
export type PhaseFilter = string | "all";

export interface NewTaskInput {
  desc: string;
  area: AreaId;
  phase: string;
  who: string;
  prio: Task["prio"];
  status: StatusId;
  start: string;
  end: string;
  dep: string;
}

export type ModalState = { mode: "new" } | { mode: "edit"; id: string } | null;

interface StoreValue {
  /** Todas as tarefas (sem filtro) — usado por Dashboard / Patrocinador. */
  tasks: Task[];
  /** Tarefas após busca + filtro de área/fase — usado no Quadro. */
  filteredTasks: Task[];
  search: string;
  setSearch: (v: string) => void;
  areaFilter: AreaFilter;
  setAreaFilter: (v: AreaFilter) => void;
  phaseFilter: PhaseFilter;
  setPhaseFilter: (v: PhaseFilter) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  addTask: (input: NewTaskInput) => void;
  updateTask: (id: string, patch: NewTaskInput) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: StatusId) => void;
  /** Modal de criar/editar tarefa. */
  modal: ModalState;
  openNew: () => void;
  openTask: (id: string) => void;
  closeModal: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => [...TASKS]);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("all");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");
  const [modal, setModal] = useState<ModalState>(null);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((tk) => {
      if (areaFilter !== "all" && tk.area !== areaFilter) return false;
      if (phaseFilter !== "all" && tk.phase !== phaseFilter) return false;
      if (q) {
        const hay = `${tk.desc} ${tk.who} ${tk.dep}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, search, areaFilter, phaseFilter]);

  const addTask = (input: NewTaskInput) => {
    setTasks((prev) => {
      const nextId = `t${prev.length + 1}-${prev.length}`;
      return [...prev, { id: nextId, ...input }];
    });
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

  const openNew = () => setModal({ mode: "new" });
  const openTask = (id: string) => setModal({ mode: "edit", id });
  const closeModal = () => setModal(null);

  const hasActiveFilters = search.trim() !== "" || areaFilter !== "all" || phaseFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setAreaFilter("all");
    setPhaseFilter("all");
  };

  const value: StoreValue = {
    tasks,
    filteredTasks,
    search,
    setSearch,
    areaFilter,
    setAreaFilter,
    phaseFilter,
    setPhaseFilter,
    hasActiveFilters,
    clearFilters,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    modal,
    openNew,
    openTask,
    closeModal,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}

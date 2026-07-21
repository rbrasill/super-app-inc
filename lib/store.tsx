"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AREAS, BLOCKS, PEOPLE, TASKS } from "./data";
import {
  areaFromRow,
  areaToRow,
  blockToRow,
  blockFromRow,
  isSupabaseEnabled,
  personFromRow,
  personToRow,
  supabase,
  taskFromRow,
  taskToRow,
} from "./supabase";
import type { Area, AreaId, Bloco, Person, StatusId, Task } from "./types";

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

export type ModalState = { mode: "new" } | { mode: "edit"; id: string } | null;

/**
 * De onde vêm/vão os dados:
 * - `loading`  : ainda carregando do Supabase na montagem.
 * - `supabase` : conectado ao banco ao vivo (persiste alterações).
 * - `demo`     : sem env do Supabase, ou a carga falhou → dados estáticos em
 *                memória (nada é salvo). Serve para o app nunca ficar vazio.
 */
export type DataSource = "loading" | "supabase" | "demo";

/** Gera um id único (usado em modo offline e como chave dos inserts). */
function makeId(prefix: string): string {
  const rnd = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}_${rnd.replace(/-/g, "").slice(0, 12)}`;
}

/** Extrai uma mensagem curta e legível de um erro do supabase-js. */
function errText(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { message?: string; details?: string; hint?: string };
    return e.message || e.details || e.hint || "erro desconhecido";
  }
  return String(err);
}

interface StoreValue {
  tasks: Task[];
  filteredTasks: Task[];
  blocks: Bloco[];
  people: Person[];
  areas: Area[];
  loading: boolean;
  /** Origem dos dados: banco ao vivo (`supabase`) ou memória (`demo`). */
  dataSource: DataSource;
  /** Mensagem da última gravação que falhou (null = tudo ok). */
  saveError: string | null;
  clearSaveError: () => void;
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
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Sem Supabase: usa os dados estáticos (modo demo em memória).
  const [tasks, setTasks] = useState<Task[]>(() => (isSupabaseEnabled ? [] : [...TASKS]));
  const [blocks, setBlocks] = useState<Bloco[]>(() =>
    isSupabaseEnabled ? [] : BLOCKS.map((b) => ({ ...b }))
  );
  const [people, setPeople] = useState<Person[]>(() =>
    isSupabaseEnabled ? [] : PEOPLE.map((p) => ({ ...p }))
  );
  const [areas, setAreas] = useState<Area[]>(() =>
    isSupabaseEnabled ? [] : AREAS.map((a) => ({ ...a }))
  );
  const [loading, setLoading] = useState(isSupabaseEnabled);
  const [dataSource, setDataSource] = useState<DataSource>(
    isSupabaseEnabled ? "loading" : "demo"
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const clearSaveError = () => setSaveError(null);

  // Em modo demo (sem env OU fallback após falha de carga), não tenta gravar:
  // a tela mostra os dados estáticos, não os do banco — gravar criaria estado
  // misturado no banco e toasts de erro enganosos com a rede fora.
  const canPersist = dataSource === "supabase";

  /** Dispara uma escrita no Supabase sem bloquear a UI; registra falhas. */
  const persist = (p: PromiseLike<{ error: unknown }> | undefined) => {
    if (!p || !canPersist) return;
    Promise.resolve(p).then(
      ({ error }) => {
        if (error) {
          console.error("[supabase]", error);
          setSaveError(errText(error));
        }
      },
      (err) => {
        console.error("[supabase]", err);
        setSaveError(errText(err));
      }
    );
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

  // Carrega do Supabase (se configurado).
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const fallback = () => {
      setTasks([...TASKS]);
      setBlocks(BLOCKS.map((x) => ({ ...x })));
      setPeople(PEOPLE.map((x) => ({ ...x })));
      setAreas(AREAS.map((x) => ({ ...x })));
      setDataSource("demo");
    };
    const withTimeout = <T,>(pr: PromiseLike<T>, ms: number): Promise<T> =>
      Promise.race([
        Promise.resolve(pr),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
      ]);
    (async () => {
      try {
        const [t, b, p, a] = await withTimeout(
          Promise.all([
            supabase.from("tasks").select("*").order("id"),
            supabase.from("blocks").select("*").order("sort_order"),
            supabase.from("people").select("*").order("sort_order"),
            supabase.from("areas").select("*").order("sort_order"),
          ]),
          8000
        );
        if (!alive) return;
        if (t.error || b.error || p.error || a.error) throw t.error || b.error || p.error || a.error;
        setTasks((t.data ?? []).map((r) => taskFromRow(r as never)));
        setBlocks((b.data ?? []).map((r) => blockFromRow(r as never)));
        setPeople((p.data ?? []).map((r) => personFromRow(r as never)));
        setAreas((a.data ?? []).map((r) => areaFromRow(r as never)));
        setDataSource("supabase");
      } catch (e) {
        if (!alive) return;
        // Rede/consulta falhou: cai nos dados estáticos para o app não ficar vazio.
        console.error("[supabase] load", e);
        fallback();
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
    if (supabase) persist(supabase.from("tasks").insert({ id, ...taskToRow(input) }));
  };

  const updateTask = (id: string, patch: NewTaskInput) => {
    setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, ...patch } : tk)));
    if (supabase) persist(supabase.from("tasks").update(taskToRow(patch)).eq("id", id));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((tk) => tk.id !== id));
    setModal(null);
    if (supabase) persist(supabase.from("tasks").delete().eq("id", id));
  };

  const moveTask = (id: string, status: StatusId) => {
    setTasks((prev) => prev.map((tk) => (tk.id === id ? { ...tk, status } : tk)));
    if (supabase) persist(supabase.from("tasks").update({ status_id: status }).eq("id", id));
  };

  // ---- Blocos ----
  const addBlock = (input: BlockInput) => {
    const id = makeId("b");
    setBlocks((prev) => {
      const next = [...prev, { id, ...input }];
      if (supabase) persist(supabase.from("blocks").insert({ id, ...blockToRow(input, prev.length) }));
      return next;
    });
  };

  const updateBlock = (id: string, patch: BlockInput) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    if (supabase) persist(supabase.from("blocks").update(blockToRow(patch)).eq("id", id));
  };

  const deleteBlock = (id: string) => {
    // As tarefas do bloco não são apagadas — ficam sem bloco.
    setTasks((prev) => prev.map((tk) => (tk.blockId === id ? { ...tk, blockId: "" } : tk)));
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setBlockFilter((f) => (f === id ? "all" : f));
    setBlockModal(null);
    if (supabase) {
      persist(supabase.from("tasks").update({ block_id: null }).eq("block_id", id));
      persist(supabase.from("blocks").delete().eq("id", id));
    }
  };

  // ---- Pessoas ----
  const addPerson = (input: PersonInput) => {
    const id = makeId("p");
    setPeople((prev) => {
      if (supabase) persist(supabase.from("people").insert({ id, ...personToRow(input, prev.length) }));
      return [...prev, { id, ...input }];
    });
  };

  const updatePerson = (id: string, patch: PersonInput) => {
    setPeople((prev) => {
      const old = prev.find((p) => p.id === id);
      if (old && old.name !== patch.name) {
        setTasks((ts) => ts.map((tk) => (tk.who === old.name ? { ...tk, who: patch.name } : tk)));
        setWhoFilter((f) => (f === old.name ? patch.name : f));
        if (supabase) persist(supabase.from("tasks").update({ who: patch.name }).eq("who", old.name));
      }
      return prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
    });
    if (supabase) persist(supabase.from("people").update(personToRow(patch)).eq("id", id));
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setPersonModal(null);
    if (supabase) persist(supabase.from("people").delete().eq("id", id));
  };

  // ---- Áreas ----
  const addArea = (input: AreaInput) => {
    const id = makeId("a");
    setAreas((prev) => {
      if (supabase) persist(supabase.from("areas").insert({ id, ...areaToRow(input, prev.length) }));
      return [...prev, { id, ...input }];
    });
  };

  const updateArea = (id: string, patch: AreaInput) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    if (supabase) persist(supabase.from("areas").update(areaToRow(patch)).eq("id", id));
  };

  const deleteArea = (id: string) => {
    // A UI só permite excluir área sem tarefas. Pessoas ligadas são desvinculadas
    // (no banco, via ON DELETE SET NULL em people.area_id).
    setPeople((prev) => prev.map((p) => (p.area === id ? { ...p, area: "" } : p)));
    setAreas((prev) => prev.filter((a) => a.id !== id));
    setAreaFilter((f) => (f === id ? "all" : f));
    setAreaModal(null);
    if (supabase) persist(supabase.from("areas").delete().eq("id", id));
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
    loading,
    dataSource,
    saveError,
    clearSaveError,
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de <StoreProvider>");
  return ctx;
}

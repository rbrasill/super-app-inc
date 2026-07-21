"use client";

import { useEffect, useState } from "react";
import { STATUSES } from "@/lib/data";
import { useStore, type NewTaskInput } from "@/lib/store";
import type { AreaId, PriorityId, StatusId, Task } from "@/lib/types";
import { PlusIcon } from "./icons";

const EMPTY: NewTaskInput = {
  desc: "",
  area: "",
  blockId: "",
  who: "",
  prio: "media",
  status: "backlog",
  start: "",
  end: "",
  dep: "",
};

function toInput(t: Task): NewTaskInput {
  const { desc, area, blockId, who, prio, status, start, end, dep } = t;
  return { desc, area, blockId, who, prio, status, start, end, dep };
}

const labelCls = "text-[11px] font-extrabold uppercase tracking-[0.4px] text-inkLabel mb-[6px] block";
const fieldCls =
  "w-full bg-panel border border-inputLine rounded-[11px] px-[13px] py-[11px] text-[13px] text-ink font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";

export default function TaskModal() {
  const { modal, tasks, blocks, people, areas, addTask, updateTask, deleteTask, closeModal } = useStore();
  const [form, setForm] = useState<NewTaskInput>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Responsáveis disponíveis = pessoas cadastradas (menos "A definir").
  // Preserva um valor legado da tarefa (ex.: "Jurídico") que não esteja no time.
  const whoOptions = (() => {
    const names = Array.from(
      new Set(people.map((p) => p.name).filter((n) => n.trim() && n !== "A definir"))
    );
    if (form.who && !names.includes(form.who)) names.push(form.who);
    return names.sort((a, b) => a.localeCompare(b, "pt-BR"));
  })();

  const editing = modal?.mode === "edit" ? tasks.find((t) => t.id === modal.id) : undefined;
  const isEdit = modal?.mode === "edit";

  // Sincroniza o formulário quando o modal abre / muda de alvo.
  useEffect(() => {
    if (!modal) return;
    setConfirmDelete(false);
    // Nova tarefa: default para a primeira área disponível.
    const empty = { ...EMPTY, area: areas[0]?.id ?? "" };
    setForm(modal.mode === "edit" ? (editing ? toInput(editing) : empty) : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal]);

  if (!modal) return null;
  // Modo edição, mas a tarefa não existe mais (ex.: excluída): fecha.
  if (isEdit && !editing) return null;

  const set = <K extends keyof NewTaskInput>(k: K, v: NewTaskInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.desc.trim()) return;
    if (isEdit && editing) updateTask(editing.id, form);
    else addTask(form);
    closeModal();
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(29,32,38,.38)" }}
      onClick={closeModal}
    >
      <div
        className="modal-panel bg-panel rounded-[20px] w-full max-w-[540px] max-h-[90vh] overflow-auto"
        style={{ boxShadow: "0 30px 80px rgba(11,11,11,.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-5 pb-4 border-b border-line flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-softOrange text-primary flex items-center justify-center flex-shrink-0">
            <PlusIcon />
          </div>
          <div className="flex-1">
            <div className="font-head text-[16px] font-extrabold tracking-[-0.02em] text-inkDark">
              {isEdit ? "Detalhes da tarefa" : "Nova tarefa"}
            </div>
            <div className="text-[11.5px] font-medium text-inkFaint">
              {isEdit ? "Edite ou remova a entrega" : "Adicione uma entrega ao quadro"}
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg text-inkFaint hover:bg-chip hover:text-ink transition-colors flex items-center justify-center text-[18px] font-bold"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Descrição</label>
            <textarea
              className={`${fieldCls} resize-none h-[70px]`}
              placeholder="O que precisa ser feito?"
              value={form.desc}
              onChange={(e) => set("desc", e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Área</label>
              <select className={fieldCls} value={form.area} onChange={(e) => set("area", e.target.value as AreaId)}>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bloco</label>
              <select className={fieldCls} value={form.blockId} onChange={(e) => set("blockId", e.target.value)}>
                <option value="">Sem bloco</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Responsável</label>
              <select className={fieldCls} value={form.who} onChange={(e) => set("who", e.target.value)}>
                <option value="">Sem responsável</option>
                {whoOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prioridade</label>
              <select
                className={fieldCls}
                value={form.prio}
                onChange={(e) => set("prio", e.target.value as PriorityId)}
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Status</label>
            <select
              className={fieldCls}
              value={form.status}
              onChange={(e) => set("status", e.target.value as StatusId)}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Início</label>
              <input type="date" className={fieldCls} value={form.start} onChange={(e) => set("start", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Fim</label>
              <input type="date" className={fieldCls} value={form.end} onChange={(e) => set("end", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Dependência / trava</label>
            <input
              className={fieldCls}
              placeholder="Ex.: depende de parecer jurídico (opcional)"
              value={form.dep}
              onChange={(e) => set("dep", e.target.value)}
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-line flex items-center gap-[10px]">
          {isEdit && editing && (
            <div className="mr-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-inkSoft">Excluir?</span>
                  <button
                    onClick={() => deleteTask(editing.id)}
                    className="px-3 py-[7px] rounded-[11px] text-[12.5px] font-bold cursor-pointer border border-[#E34444] bg-[#E34444] text-white hover:brightness-105 transition-[filter]"
                  >
                    Sim, excluir
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-[12.5px] font-bold text-inkSoft hover:text-ink cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-[10px] rounded-[11px] text-[13px] font-bold cursor-pointer border border-inputLine bg-panel text-[#B63636] hover:bg-[#FFF0F0] transition-colors"
                >
                  Excluir
                </button>
              )}
            </div>
          )}
          <button
            onClick={closeModal}
            className="px-[18px] py-[10px] rounded-[11px] text-[13px] font-bold cursor-pointer border border-inputLine bg-panel text-inkSoft hover:bg-chip hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.desc.trim()}
            className="px-5 py-[10px] rounded-[11px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white shadow-btn hover:brightness-[1.06] transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? "Salvar alterações" : "Adicionar tarefa"}
          </button>
        </div>
      </div>
    </div>
  );
}

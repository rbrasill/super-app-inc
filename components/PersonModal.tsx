"use client";

import { useEffect, useState } from "react";
import { useStore, type PersonInput } from "@/lib/store";
import type { Person } from "@/lib/types";

const EMPTY: PersonInput = { name: "", role: "", resp: "", area: "" };

function toInput(p: Person): PersonInput {
  const { name, role, resp, area } = p;
  return { name, role, resp, area };
}

const labelCls = "text-[11px] font-extrabold uppercase tracking-[0.4px] text-inkLabel mb-[6px] block";
const fieldCls =
  "w-full bg-panel border border-inputLine rounded-[11px] px-[13px] py-[11px] text-[13px] text-ink font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";

export default function PersonModal() {
  const { personModal, people, tasks, areas, addPerson, updatePerson, deletePerson, closePersonModal } = useStore();
  const [form, setForm] = useState<PersonInput>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editing = personModal?.mode === "edit" ? people.find((p) => p.id === personModal.id) : undefined;
  const isEdit = personModal?.mode === "edit";
  const taskCount = editing ? tasks.filter((tk) => tk.who === editing.name).length : 0;

  useEffect(() => {
    if (!personModal) return;
    setConfirmDelete(false);
    setForm(personModal.mode === "edit" ? (editing ? toInput(editing) : EMPTY) : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personModal]);

  if (!personModal) return null;
  if (isEdit && !editing) return null;

  const set = <K extends keyof PersonInput>(k: K, v: PersonInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    const clean: PersonInput = {
      name: form.name.trim(),
      role: form.role.trim(),
      resp: form.resp.trim(),
      area: form.area,
    };
    if (isEdit && editing) updatePerson(editing.id, clean);
    else addPerson(clean);
    closePersonModal();
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(29,32,38,.38)" }}
      onClick={closePersonModal}
    >
      <div
        className="modal-panel bg-panel rounded-[20px] w-full max-w-[480px] max-h-[90vh] overflow-auto"
        style={{ boxShadow: "0 30px 80px rgba(11,11,11,.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-5 pb-4 border-b border-line flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-softOrange text-primary flex items-center justify-center flex-shrink-0 text-[16px] font-extrabold">
            {form.name.trim() ? form.name.trim()[0].toUpperCase() : "?"}
          </div>
          <div className="flex-1">
            <div className="font-head text-[16px] font-extrabold tracking-[-0.02em] text-inkDark">
              {isEdit ? "Editar pessoa" : "Nova pessoa"}
            </div>
            <div className="text-[11.5px] font-medium text-inkFaint">
              {isEdit ? "Edite ou remova do time" : "Cadastre alguém no time do projeto"}
            </div>
          </div>
          <button
            onClick={closePersonModal}
            className="w-8 h-8 rounded-lg text-inkFaint hover:bg-chip hover:text-ink transition-colors flex items-center justify-center text-[18px] font-bold"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nome</label>
            <input
              className={fieldCls}
              placeholder="Ex.: Maria Silva"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Papel</label>
            <input
              className={fieldCls}
              placeholder="Ex.: Desenvolvedora, Representante · Jurídico…"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Área</label>
            <select className={fieldCls} value={form.area} onChange={(e) => set("area", e.target.value)}>
              <option value="">Sem área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Responsabilidade</label>
            <textarea
              className={`${fieldCls} resize-none h-[70px]`}
              placeholder="O que essa pessoa faz no projeto (opcional)"
              value={form.resp}
              onChange={(e) => set("resp", e.target.value)}
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-line flex items-center gap-[10px]">
          {isEdit && editing && (
            <div className="mr-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-inkSoft">
                    Excluir?{taskCount > 0 ? ` ${taskCount} tarefa(s) ficam sem responsável no seletor.` : ""}
                  </span>
                  <button
                    onClick={() => deletePerson(editing.id)}
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
            onClick={closePersonModal}
            className="px-[18px] py-[10px] rounded-[11px] text-[13px] font-bold cursor-pointer border border-inputLine bg-panel text-inkSoft hover:bg-chip hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="px-5 py-[10px] rounded-[11px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white shadow-btn hover:brightness-[1.06] transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? "Salvar pessoa" : "Adicionar pessoa"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AV_PALETTE } from "@/lib/data";
import { useStore, type AreaInput } from "@/lib/store";
import type { Area } from "@/lib/types";

const EMPTY: AreaInput = { name: "", color: AV_PALETTE[0] };

function toInput(a: Area): AreaInput {
  const { name, color } = a;
  return { name, color };
}

const labelCls = "text-[11px] font-extrabold uppercase tracking-[0.4px] text-inkLabel mb-[6px] block";
const fieldCls =
  "w-full bg-panel border border-inputLine rounded-[11px] px-[13px] py-[11px] text-[13px] text-ink font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";

export default function AreaModal() {
  const { areaModal, areas, tasks, people, addArea, updateArea, deleteArea, closeAreaModal } = useStore();
  const [form, setForm] = useState<AreaInput>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editing = areaModal?.mode === "edit" ? areas.find((a) => a.id === areaModal.id) : undefined;
  const isEdit = areaModal?.mode === "edit";
  const taskCount = editing ? tasks.filter((tk) => tk.area === editing.id).length : 0;
  const peopleCount = editing ? people.filter((p) => p.area === editing.id).length : 0;

  useEffect(() => {
    if (!areaModal) return;
    setConfirmDelete(false);
    setForm(areaModal.mode === "edit" ? (editing ? toInput(editing) : EMPTY) : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaModal]);

  if (!areaModal) return null;
  if (isEdit && !editing) return null;

  const set = <K extends keyof AreaInput>(k: K, v: AreaInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    const clean: AreaInput = { name: form.name.trim(), color: form.color };
    if (isEdit && editing) updateArea(editing.id, clean);
    else addArea(clean);
    closeAreaModal();
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(29,32,38,.38)" }}
      onClick={closeAreaModal}
    >
      <div
        className="modal-panel bg-panel rounded-[20px] w-full max-w-[440px] max-h-[90vh] overflow-auto"
        style={{ boxShadow: "0 30px 80px rgba(11,11,11,.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-5 pb-4 border-b border-line flex items-center gap-3">
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: form.color + "22" }}
          >
            <span className="w-[14px] h-[14px] rounded-[5px]" style={{ background: form.color }} />
          </div>
          <div className="flex-1">
            <div className="font-head text-[16px] font-extrabold tracking-[-0.02em] text-inkDark">
              {isEdit ? "Editar área" : "Nova área"}
            </div>
            <div className="text-[11.5px] font-medium text-inkFaint">
              {isEdit ? "Edite ou remova a área" : "Crie uma área para tarefas e pessoas"}
            </div>
          </div>
          <button
            onClick={closeAreaModal}
            className="w-8 h-8 rounded-lg text-inkFaint hover:bg-chip hover:text-ink transition-colors flex items-center justify-center text-[18px] font-bold"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nome da área</label>
            <input
              className={fieldCls}
              placeholder="Ex.: Marketing"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Cor</label>
            <div className="flex flex-wrap gap-2 pt-[6px]">
              {AV_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  aria-label={`Cor ${c}`}
                  className={`w-[26px] h-[26px] rounded-lg transition-transform hover:scale-110 ${
                    form.color === c ? "ring-2 ring-offset-2 ring-ink" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {isEdit && (
            <div className="text-[11.5px] text-inkFaint font-medium">
              {taskCount} tarefa(s) e {peopleCount} pessoa(s) nesta área.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-line flex items-center gap-[10px]">
          {isEdit && editing && (
            <div className="mr-auto">
              {taskCount > 0 ? (
                <span className="text-[11.5px] font-semibold text-inkFaint max-w-[190px] inline-block leading-[1.4]">
                  Para excluir, mova antes as {taskCount} tarefa(s) para outra área.
                </span>
              ) : confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-inkSoft">
                    Excluir?{peopleCount > 0 ? ` ${peopleCount} pessoa(s) ficam sem área.` : ""}
                  </span>
                  <button
                    onClick={() => deleteArea(editing.id)}
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
            onClick={closeAreaModal}
            className="px-[18px] py-[10px] rounded-[11px] text-[13px] font-bold cursor-pointer border border-inputLine bg-panel text-inkSoft hover:bg-chip hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="px-5 py-[10px] rounded-[11px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white shadow-btn hover:brightness-[1.06] transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? "Salvar área" : "Adicionar área"}
          </button>
        </div>
      </div>
    </div>
  );
}

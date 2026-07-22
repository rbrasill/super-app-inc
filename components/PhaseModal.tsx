"use client";

import { useEffect, useState } from "react";
import { useStore, type PhaseInput } from "@/lib/store";
import type { Fase } from "@/lib/types";

const EMPTY: PhaseInput = { name: "", short: "" };

function toInput(f: Fase): PhaseInput {
  const { name, short } = f;
  return { name, short };
}

const labelCls = "text-[11px] font-extrabold uppercase tracking-[0.4px] text-inkLabel mb-[6px] block";
const fieldCls =
  "w-full bg-panel border border-inputLine rounded-[11px] px-[13px] py-[11px] text-[13px] text-ink font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";

export default function PhaseModal() {
  const { phaseModal, phases, blocks, addPhase, updatePhase, deletePhase, closePhaseModal } = useStore();
  const [form, setForm] = useState<PhaseInput>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editing = phaseModal?.mode === "edit" ? phases.find((f) => f.id === phaseModal.id) : undefined;
  const isEdit = phaseModal?.mode === "edit";
  const blockCount = editing ? blocks.filter((b) => b.phaseId === editing.id).length : 0;

  useEffect(() => {
    if (!phaseModal) return;
    setConfirmDelete(false);
    setForm(phaseModal.mode === "edit" ? (editing ? toInput(editing) : EMPTY) : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseModal]);

  if (!phaseModal) return null;
  if (isEdit && !editing) return null;

  const set = <K extends keyof PhaseInput>(k: K, v: PhaseInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    // Rótulo curto vazio: usa o trecho antes do "·" do nome (ou o nome inteiro).
    const short = form.short.trim() || form.name.split("·")[0].trim();
    const clean: PhaseInput = { name: form.name.trim(), short };
    if (isEdit && editing) updatePhase(editing.id, clean);
    else addPhase(clean);
    closePhaseModal();
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(29,32,38,.38)" }}
      onClick={closePhaseModal}
    >
      <div
        className="modal-panel bg-panel rounded-[20px] w-full max-w-[440px] max-h-[90vh] overflow-auto"
        style={{ boxShadow: "0 30px 80px rgba(11,11,11,.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-5 pb-4 border-b border-line flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-softOrange text-primary flex items-center justify-center flex-shrink-0 text-[13px] font-extrabold">
            {form.short.trim() || "v?"}
          </div>
          <div className="flex-1">
            <div className="font-head text-[16px] font-extrabold tracking-[-0.02em] text-inkDark">
              {isEdit ? "Editar fase" : "Nova fase"}
            </div>
            <div className="text-[11.5px] font-medium text-inkFaint">
              {isEdit ? "Edite ou remova a fase do roadmap" : "Crie uma fase do roadmap para os bifes"}
            </div>
          </div>
          <button
            onClick={closePhaseModal}
            className="w-8 h-8 rounded-lg text-inkFaint hover:bg-chip hover:text-ink transition-colors flex items-center justify-center text-[18px] font-bold"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nome da fase</label>
            <input
              className={fieldCls}
              placeholder="Ex.: v5.0 · Expansão"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Rótulo curto (chip)</label>
            <input
              className={fieldCls}
              placeholder="Ex.: v5.0 (se vazio, uso o começo do nome)"
              value={form.short}
              onChange={(e) => set("short", e.target.value)}
            />
          </div>

          {isEdit && (
            <div className="text-[11.5px] text-inkFaint font-medium">
              {blockCount} bloco(s) nesta fase.
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-line flex items-center gap-[10px]">
          {isEdit && editing && (
            <div className="mr-auto">
              {blockCount > 0 ? (
                <span className="text-[11.5px] font-semibold text-inkFaint max-w-[190px] inline-block leading-[1.4]">
                  Para excluir, mova antes os {blockCount} bloco(s) para outra fase.
                </span>
              ) : confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-inkSoft">Excluir esta fase?</span>
                  <button
                    onClick={() => deletePhase(editing.id)}
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
            onClick={closePhaseModal}
            className="px-[18px] py-[10px] rounded-[11px] text-[13px] font-bold cursor-pointer border border-inputLine bg-panel text-inkSoft hover:bg-chip hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="px-5 py-[10px] rounded-[11px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white shadow-btn hover:brightness-[1.06] transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? "Salvar fase" : "Adicionar fase"}
          </button>
        </div>
      </div>
    </div>
  );
}

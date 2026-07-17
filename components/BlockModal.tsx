"use client";

import { useEffect, useState } from "react";
import { AV_PALETTE, PHASES } from "@/lib/data";
import { useStore, type BlockInput } from "@/lib/store";
import type { Bloco } from "@/lib/types";

const EMPTY: BlockInput = {
  name: "",
  theme: "",
  days: 15,
  color: AV_PALETTE[0],
  phaseId: "",
};

function toInput(b: Bloco): BlockInput {
  const { name, theme, days, color, phaseId } = b;
  return { name, theme, days, color, phaseId };
}

const labelCls = "text-[11px] font-extrabold uppercase tracking-[0.4px] text-inkLabel mb-[6px] block";
const fieldCls =
  "w-full bg-panel border border-inputLine rounded-[11px] px-[13px] py-[11px] text-[13px] text-ink font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";

export default function BlockModal() {
  const { blockModal, blocks, tasks, addBlock, updateBlock, deleteBlock, closeBlockModal } = useStore();
  const [form, setForm] = useState<BlockInput>(EMPTY);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editing = blockModal?.mode === "edit" ? blocks.find((b) => b.id === blockModal.id) : undefined;
  const isEdit = blockModal?.mode === "edit";
  const taskCount = editing ? tasks.filter((tk) => tk.blockId === editing.id).length : 0;

  useEffect(() => {
    if (!blockModal) return;
    setConfirmDelete(false);
    setForm(blockModal.mode === "edit" ? (editing ? toInput(editing) : EMPTY) : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockModal]);

  if (!blockModal) return null;
  if (isEdit && !editing) return null;

  const set = <K extends keyof BlockInput>(k: K, v: BlockInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    const clean: BlockInput = { ...form, days: Math.max(0, Math.round(form.days) || 0) };
    if (isEdit && editing) updateBlock(editing.id, clean);
    else addBlock(clean);
    closeBlockModal();
  };

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(30,20,10,.32)" }}
      onClick={closeBlockModal}
    >
      <div
        className="modal-panel bg-panel rounded-[20px] w-full max-w-[520px] max-h-[90vh] overflow-auto"
        style={{ boxShadow: "0 30px 80px rgba(11,11,11,.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-5 pb-4 border-b border-line flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-softOrange flex items-center justify-center flex-shrink-0 text-[18px] leading-none">
            🥩
          </div>
          <div className="font-head text-[16px] font-extrabold tracking-[-0.02em] flex-1 text-inkDark">
            {isEdit ? "Editar bloco" : "Novo bloco"}
          </div>
          <button
            onClick={closeBlockModal}
            className="w-8 h-8 rounded-lg text-inkFaint hover:bg-chip hover:text-ink transition-colors flex items-center justify-center text-[18px] font-bold"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nome do bloco</label>
            <input
              className={fieldCls}
              placeholder="Ex.: Primeiro Acesso"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Tema · o que entra no bloco</label>
            <textarea
              className={`${fieldCls} resize-none h-[70px]`}
              placeholder="Pacote completo do tema: tela + back + regra + cadastro."
              value={form.theme}
              onChange={(e) => set("theme", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Fase do roadmap</label>
              <select className={fieldCls} value={form.phaseId} onChange={(e) => set("phaseId", e.target.value)}>
                <option value="">Sem fase</option>
                {PHASES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prazo (dias)</label>
              <input
                type="number"
                min={0}
                className={fieldCls}
                value={form.days}
                onChange={(e) => set("days", Number(e.target.value))}
              />
            </div>
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
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-line flex items-center gap-[10px]">
          {isEdit && editing && (
            <div className="mr-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-inkSoft">
                    Excluir?{taskCount > 0 ? ` ${taskCount} tarefa(s) ficam sem bloco.` : ""}
                  </span>
                  <button
                    onClick={() => deleteBlock(editing.id)}
                    className="px-3 py-[7px] rounded-[11px] text-[12.5px] font-bold cursor-pointer border border-[#EF4444] bg-[#EF4444] text-white hover:brightness-105 transition-[filter]"
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
                  className="px-3 py-[10px] rounded-[11px] text-[13px] font-bold cursor-pointer border border-inputLine bg-panel text-[#D14328] hover:bg-[#FDE4DE] transition-colors"
                >
                  Excluir
                </button>
              )}
            </div>
          )}
          <button
            onClick={closeBlockModal}
            className="px-[18px] py-[10px] rounded-[11px] text-[13px] font-bold cursor-pointer border border-inputLine bg-panel text-inkSoft hover:bg-chip hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="px-5 py-[10px] rounded-[11px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white shadow-btn hover:brightness-[1.06] transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? "Salvar bloco" : "Adicionar bloco"}
          </button>
        </div>
      </div>
    </div>
  );
}

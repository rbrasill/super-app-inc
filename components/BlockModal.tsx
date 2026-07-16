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

const labelCls = "text-[11px] font-extrabold uppercase tracking-[0.5px] text-inkFaint mb-[6px] block";
const fieldCls =
  "w-full bg-bg border border-line rounded-cardSm px-3 py-[9px] text-[13px] text-ink font-medium outline-none focus:border-primary transition-colors";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeBlockModal}>
      <div
        className="bg-panel rounded-2xl shadow-cardHover w-full max-w-[520px] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-5 pb-4 border-b border-line2 flex items-center gap-3">
          <span className="text-[20px] leading-none">🥩</span>
          <div className="font-head text-[18px] font-extrabold tracking-[-0.02em] flex-1">
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
        <div className="px-6 py-4 border-t border-line2 flex items-center gap-3">
          {isEdit && editing && (
            <div className="mr-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-inkSoft">
                    Excluir?{taskCount > 0 ? ` ${taskCount} tarefa(s) ficam sem bloco.` : ""}
                  </span>
                  <button
                    onClick={() => deleteBlock(editing.id)}
                    className="px-3 py-[7px] rounded-cardSm text-[12.5px] font-bold cursor-pointer border border-[#EF4444] bg-[#EF4444] text-white hover:brightness-105 transition-[filter]"
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
                  className="px-3 py-[9px] rounded-cardSm text-[13px] font-bold cursor-pointer border border-line bg-transparent text-[#D14328] hover:bg-[#FDE4DE] transition-colors"
                >
                  Excluir
                </button>
              )}
            </div>
          )}
          <button
            onClick={closeBlockModal}
            className="px-4 py-[9px] rounded-cardSm text-[13px] font-bold cursor-pointer border border-line bg-transparent text-inkSoft hover:bg-chip hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="px-5 py-[9px] rounded-cardSm text-[13px] font-bold cursor-pointer border border-primary bg-primary text-white shadow-btn hover:brightness-105 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? "Salvar bloco" : "Adicionar bloco"}
          </button>
        </div>
      </div>
    </div>
  );
}

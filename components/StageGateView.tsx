"use client";

import { useEffect, useState } from "react";
import { getStageGate, type StageGate, type StageStep } from "@/lib/derive";
import { useStore } from "@/lib/store";

/**
 * Fluxo Stage-Gate — o projeto visto como uma esteira sequencial.
 *
 * Cada estágio é um **bloco ("bife")**, em ordem cronológica, e entre dois
 * estágios há um portão de decisão cujo estado decorre do estágio anterior.
 * Toda a matemática vem de `getStageGate`; aqui só se desenha.
 */

const CARD = "bg-panel border border-line rounded-card shadow-card";

/** Título de seção com a barrinha colorida à esquerda (padrão do portal). */
function SectionTitle({ children, accent = "#FF6636" }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-[9px] mb-[14px]">
      <span className="w-[3px] h-[13px] rounded-[3px]" style={{ background: accent }} />
      <span className="text-[11px] font-extrabold uppercase tracking-[0.8px] text-inkMid">{children}</span>
    </div>
  );
}

/** Cartão de um estágio na esteira. */
function StageCard({
  stage,
  active,
  onSelect,
}: {
  stage: StageStep;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      title={`${stage.name}${stage.phaseLabel ? ` · ${stage.phaseLabel}` : ""} — ${stage.lampText}`}
      className={`flex-1 min-w-[210px] text-left rounded-[15px] px-[17px] py-[14px] transition-[box-shadow,border-color,background] cursor-pointer border-2 ${
        active
          ? "border-success bg-[#FBFAF6] shadow-card"
          : "border-line bg-panel hover:border-inkMute/60 hover:shadow-card"
      }`}
    >
      <div className="flex items-center gap-2 mb-[9px]">
        <span
          className="w-[19px] h-[19px] rounded-[6px] text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0"
          style={{ background: active ? "#1D8A4E" : stage.color }}
        >
          {stage.n}
        </span>
        <span className="font-head text-[14.5px] font-extrabold tracking-[-0.02em] text-inkDark truncate">
          {stage.name}
        </span>
        <span
          className="ml-auto w-[9px] h-[9px] rounded-full flex-shrink-0"
          style={{ background: stage.lampColor }}
          title={stage.lampText}
        />
      </div>

      <div className="text-[11.5px] font-semibold text-inkFaint truncate mb-[10px]">
        {stage.phaseLabel || "Sem fase"}
      </div>

      <div className="flex items-baseline gap-[7px]">
        <span className="font-head text-[23px] font-extrabold tracking-[-0.03em] text-inkDark leading-none">
          {stage.loadedPct}%
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.7px] text-inkMute">Carregado</span>
      </div>

      <div className="mt-[9px] h-[7px] rounded-[20px] bg-line2 overflow-hidden flex">
        <div style={{ width: stage.buffer.deliveredW, background: "#1D8A4E" }} />
        <div style={{ width: stage.buffer.inProgressW, background: "#F7C6A8" }} />
      </div>
    </button>
  );
}

/** Losango do portão de decisão entre dois estágios. */
function GateDiamond({ gate, onSelect }: { gate: StageGate; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      title={gate.hint}
      className="flex flex-col items-center justify-center gap-[6px] flex-shrink-0 px-1 cursor-pointer group"
    >
      <span
        className="w-[42px] h-[42px] rotate-45 rounded-[7px] border-2 bg-panel flex items-center justify-center transition-colors group-hover:bg-chip"
        style={{ borderColor: gate.color }}
      >
        <span className="-rotate-45 text-[11px] font-extrabold" style={{ color: gate.color }}>
          {gate.label}
        </span>
      </span>
      <span
        className="text-[9.5px] font-extrabold uppercase tracking-[0.7px]"
        style={{ color: gate.color }}
      >
        {gate.stateLabel}
      </span>
    </button>
  );
}

/** Barra empilhada genérica com legenda por fatia. */
function StackedBar({ parts }: { parts: { w: string; color: string; key: string }[] }) {
  return (
    <div className="h-[11px] rounded-[20px] bg-line2 overflow-hidden flex">
      {parts.map((p) => (
        <div key={p.key} style={{ width: p.w, background: p.color }} />
      ))}
    </div>
  );
}

export default function StageGateView() {
  const { tasks, blocks, phases } = useStore();
  const { stages, gates } = getStageGate(tasks, blocks, phases);

  const [selected, setSelected] = useState(0);
  // Se blocos forem criados/excluídos, o índice pode ficar fora da lista.
  useEffect(() => {
    if (selected > stages.length - 1) setSelected(0);
  }, [stages.length, selected]);

  if (!stages.length) {
    return (
      <div className={`${CARD} px-6 py-12 text-center`}>
        <div className="text-[14px] font-extrabold text-inkDark mb-[6px]">Nenhum estágio ainda</div>
        <div className="text-[12.5px] text-inkSoft font-medium">
          A esteira é formada pelos blocos (bifes) do projeto. Cadastre um bloco em “Blocos (bifes)”
          para ele aparecer aqui como estágio.
        </div>
      </div>
    );
  }

  const stage = stages[Math.min(selected, stages.length - 1)];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* ---------------- Esteira ---------------- */}
      <div className={`${CARD} px-[22px] py-[18px]`}>
        <div className="flex items-center gap-3 flex-wrap mb-[16px]">
          <SectionTitle>Esteira de estágios e portões de decisão</SectionTitle>
          <span className="ml-auto text-[11.5px] font-medium text-inkFaint mb-[14px]">
            Clique num estágio ou portão para ver o detalhe
          </span>
        </div>

        <div className="flex items-center gap-[10px] overflow-x-auto sc-scroll pb-1">
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-[10px] flex-1 min-w-0">
              <StageCard stage={s} active={i === selected} onSelect={() => setSelected(i)} />
              {gates[i] && (
                <GateDiamond
                  gate={gates[i]}
                  // O portão depende do estágio anterior: clicar nele leva a quem
                  // precisa concluir para o portão abrir.
                  onSelect={() => setSelected(gates[i].fromIndex)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Cabeçalho do estágio selecionado ---------------- */}
      <div className="flex items-center gap-[10px] flex-wrap px-1">
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.9px] text-success">
          Estágio {stage.n} de {stages.length}
        </span>
        <span className="font-head text-[17px] font-extrabold tracking-[-0.02em] text-inkDark">
          {stage.name}
        </span>
        {stage.phaseLabel && (
          <span className="text-[12px] font-semibold text-inkFaint">· {stage.phaseLabel}</span>
        )}
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.5px] px-[10px] py-[3px] rounded-[20px]"
          style={{ background: stage.lampColor + "1F", color: stage.lampColor }}
        >
          {stage.lampText}
        </span>
      </div>

      {/* ---------------- Detalhe: dois cards ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] items-start">
        {/* Buffer de carregamento */}
        <div className={`${CARD} px-[22px] py-[18px]`}>
          <SectionTitle>Buffer de carregamento</SectionTitle>

          <div className="flex items-baseline gap-[9px]">
            <span className="font-head text-[38px] font-extrabold tracking-[-0.04em] text-inkDark leading-none">
              {stage.loadedPct}%
            </span>
            <span className="text-[13px] font-bold text-inkSoft">carregado</span>
          </div>

          <div className="text-[12.5px] font-medium text-inkSoft mt-[10px]">
            {stage.buffer.total === 0 ? (
              "Este estágio ainda não tem tarefas."
            ) : stage.remainingPct === 0 ? (
              <>Estágio entregue por completo.</>
            ) : (
              <>
                Falta <span className="font-extrabold text-primary">{stage.remainingPct}%</span> para
                entregar o estágio
              </>
            )}
          </div>

          <div className="mt-[14px]">
            <StackedBar
              parts={[
                { key: "d", w: stage.buffer.deliveredW, color: "#1D8A4E" },
                { key: "p", w: stage.buffer.inProgressW, color: "#F7C6A8" },
              ]}
            />
          </div>

          <div className="flex items-center gap-[18px] flex-wrap mt-[13px] text-[11.5px] font-semibold text-inkSoft">
            <Legend color="#1D8A4E" label="Entregue" n={stage.buffer.delivered} total={stage.buffer.total} />
            <Legend color="#F7C6A8" label="Em curso" n={stage.buffer.inProgress} total={stage.buffer.total} />
            <Legend color="#E9EAF0" label="Não iniciado" n={stage.buffer.notStarted} total={stage.buffer.total} />
          </div>

          <div className="border-t border-line mt-[18px] pt-[15px] flex gap-10 flex-wrap">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.7px] text-inkMute mb-[5px]">
                Data do período
              </div>
              <div className="text-[13px] font-extrabold text-inkDark">{stage.dateRange}</div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.7px] text-inkMute mb-[5px]">
                Janela
              </div>
              <div className="text-[13px] font-extrabold text-inkDark">
                {stage.hasDates ? `${stage.days} dias` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Porcentagem por status */}
        <div className={`${CARD} px-[22px] py-[18px]`}>
          <SectionTitle>Porcentagem por status</SectionTitle>

          {stage.statusSlices.length === 0 ? (
            <div className="text-[12.5px] font-medium text-inkSoft py-2">
              Sem tarefas neste estágio para distribuir por status.
            </div>
          ) : (
            <>
              <StackedBar
                parts={stage.statusSlices.map((s) => ({ key: s.id, w: s.w, color: s.color }))}
              />
              <div className="mt-[16px] flex flex-col">
                {stage.statusSlices.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-[10px] py-[9px] border-b border-line2 last:border-b-0"
                  >
                    <span
                      className="w-[9px] h-[9px] rounded-[3px] flex-shrink-0"
                      style={{ background: s.color }}
                    />
                    <span className="text-[12.5px] font-bold text-inkMid">{s.name}</span>
                    <span className="ml-auto text-[11.5px] font-semibold text-inkFaint">
                      {s.count} {s.count === 1 ? "tarefa" : "tarefas"}
                    </span>
                    <span className="text-[12.5px] font-extrabold text-inkDark w-[42px] text-right">
                      {s.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, n, total }: { color: string; label: string; n: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-[6px]">
      <i className="w-[9px] h-[9px] rounded-[3px] inline-block" style={{ background: color }} />
      {label} <span className="text-inkMute font-bold">{n}/{total}</span>
    </span>
  );
}

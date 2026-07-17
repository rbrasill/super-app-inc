"use client";

import { useEffect, useState } from "react";
import { PROJECT, STATUSES } from "@/lib/data";
import { decorate, getBlocks, getBlocksSummary, type BlockRow } from "@/lib/derive";
import { useStore } from "@/lib/store";
import type { Bloco, DecoratedTask } from "@/lib/types";
import { CalendarIcon, PlusIcon, WarnIcon } from "./icons";

function InfoTile({ value, label, sub, subColor }: { value: string; label: string; sub?: string; subColor?: string }) {
  return (
    <div className="bg-panel border border-line rounded-2xl px-[18px] py-4">
      <div className="font-head text-[26px] font-extrabold tracking-[-0.04em] leading-none text-inkDark">{value}</div>
      <div className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-inkLabel mt-2">{label}</div>
      {sub && (
        <div className="text-[11px] font-bold mt-1" style={{ color: subColor }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/** Barra de encaixe: os blocos preenchendo o período de N dias, com checkpoints semanais. */
function Timeline({ rows, onPick }: { rows: BlockRow[]; onPick: (id: string) => void }) {
  const ticks = Array.from({ length: Math.floor(PROJECT.totalDays / 7) }, (_, i) => (i + 1) * 7).filter(
    (d) => d < PROJECT.totalDays
  );

  return (
    <div className="bg-panel border border-line rounded-2xl p-5">
      <div className="flex items-center gap-[9px] text-[12.5px] font-extrabold uppercase tracking-[0.5px] text-inkMid mb-4">
        <span className="w-[3px] h-[15px] rounded-sm bg-primary" />
        Encaixe nos {PROJECT.totalDays} dias
      </div>

      <div className="relative h-[46px] bg-chip rounded-xl overflow-hidden">
        {ticks.map((d) => (
          <div
            key={d}
            className="absolute top-0 bottom-0 w-px bg-panel/70"
            style={{ left: `${(d / PROJECT.totalDays) * 100}%` }}
          />
        ))}
        {rows.map((r) => (
          <button
            key={r.id}
            onClick={() => onPick(r.id)}
            className="absolute top-[3px] bottom-[3px] rounded-[9px] flex items-center justify-center overflow-hidden px-2 border-none cursor-pointer transition-[filter] hover:brightness-105"
            style={{ left: r.offsetPct, width: r.widthPct, background: r.color }}
            title={`${r.name} · ${r.daysLabel} · ${r.weekRange}`}
          >
            <span className="text-white text-[10.5px] font-extrabold truncate">
              🥩 {r.short} · {r.daysLabel}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-2 text-[10px] font-bold text-inkMute">
        <span>Semana 1</span>
        <span>Semana {Math.round(PROJECT.totalDays / 7)}</span>
      </div>
    </div>
  );
}

/** Card resumido do bife — sem a lista de tarefas; clique abre o detalhe. */
function BlockCard({ row, onOpen }: { row: BlockRow; onOpen: (id: string) => void }) {
  const { openBlock, moveBlock, blocks } = useStore();
  const idx = blocks.findIndex((b) => b.id === row.id);
  const isFirst = idx <= 0;
  const isLast = idx >= blocks.length - 1;
  const stop = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      onClick={() => onOpen(row.id)}
      className="bg-panel border border-line rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-[box-shadow,transform] hover:-translate-y-[2px] hover:shadow-cardHover"
      style={{ borderTop: `4px solid ${row.color}` }}
    >
      {/* Cabeçalho */}
      <div className="px-5 pt-4 pb-[14px] border-b border-line2">
        <div className="flex items-center gap-2 mb-[9px] flex-wrap">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.4px] px-[9px] py-[3px] rounded-[20px] text-white inline-flex items-center gap-[3px]"
            style={{ background: row.color }}
          >
            🥩 Bife {row.bife}
          </span>
          {row.phaseShort && (
            <span
              className="text-[10px] font-extrabold px-[9px] py-[3px] rounded-[20px] bg-chip text-inkMid"
              title={row.phaseName}
            >
              {row.phaseShort}
            </span>
          )}
          <span className="text-[11px] font-extrabold text-inkSoft">{row.daysLabel}</span>
          <span className="text-[11px] font-medium text-inkMute">· {row.weekRange}</span>
          {/* Ações */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={(e) => stop(e, () => moveBlock(row.id, -1))}
              disabled={isFirst}
              className="w-6 h-6 rounded-md text-inkMute hover:bg-chip hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[13px] font-bold"
              aria-label="Mover para cima"
            >
              ↑
            </button>
            <button
              onClick={(e) => stop(e, () => moveBlock(row.id, 1))}
              disabled={isLast}
              className="w-6 h-6 rounded-md text-inkMute hover:bg-chip hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[13px] font-bold"
              aria-label="Mover para baixo"
            >
              ↓
            </button>
            <button
              onClick={(e) => stop(e, () => openBlock(row.id))}
              className="px-2 h-6 rounded-md text-[11px] font-bold text-inkSoft hover:bg-chip hover:text-ink transition-colors"
            >
              Editar
            </button>
          </div>
        </div>
        <h3 className="font-head text-[16px] font-extrabold tracking-[-0.02em] text-inkDark">{row.name}</h3>
        <div className="text-[11.5px] text-inkSoft font-medium mt-1 leading-[1.45] line-clamp-2">{row.theme}</div>
      </div>

      {/* Progresso / semáforo */}
      <div className="px-5 py-[13px] border-b border-line2">
        <div className="flex items-center gap-[10px]">
          <span className="w-[11px] h-[11px] rounded-full flex-shrink-0" style={{ background: row.lampColor }} />
          <span className="text-[12px] font-extrabold text-ink">{row.txt}</span>
          <span className="ml-auto text-[11px] font-bold text-inkSoft">{row.meta}</span>
        </div>
        <div className="bg-chip rounded-[20px] h-[7px] overflow-hidden mt-[11px]">
          <div className="h-full" style={{ width: row.pct, background: row.color }} />
        </div>
        <div className="text-[10px] font-extrabold text-inkLabel text-right mt-[5px]">{row.pctLabel} entregue</div>
      </div>

      {/* Distribuição por área */}
      {row.areaSegs.length > 0 && (
        <div className="px-5 py-[13px] border-b border-line2">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.5px] text-inkMute mb-2">Por área</div>
          <div className="flex h-[18px] rounded-[20px] overflow-hidden bg-chip">
            {row.areaSegs.map((seg) => (
              <div
                key={seg.name}
                className="h-full flex items-center justify-center text-[9.5px] font-extrabold text-white"
                style={{ width: seg.w, background: seg.color }}
                title={`${seg.name}: ${seg.count}`}
              >
                {seg.count}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] font-bold text-inkSoft">
            {row.areaSegs.map((seg) => (
              <span key={seg.name} className="inline-flex items-center gap-[4px]">
                <i className="w-[8px] h-[8px] rounded-[2px] inline-block" style={{ background: seg.color }} />
                {seg.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé: chamada para o detalhe */}
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-inkFaint">
          {row.count === 0 ? "Sem tarefas ainda" : `${row.count} tarefa(s) neste bife`}
        </span>
        <span className="text-[12px] font-extrabold text-primary inline-flex items-center gap-1">
          Ver bife →
        </span>
      </div>
    </div>
  );
}

/** Detalhe do bife — inline (troca o conteúdo da própria tela, sem overlay). */
function BlockDetail({ row, onBack }: { row: BlockRow; onBack: () => void }) {
  const { tasks, blocks, openBlock, openTask } = useStore();

  // Ao abrir um bife, sobe a área de conteúdo para o topo (mostra o "Voltar").
  useEffect(() => {
    document.querySelector(".sc-scroll")?.scrollTo({ top: 0 });
  }, [row.id]);

  const blockMap: Record<string, Bloco> = Object.fromEntries(blocks.map((b) => [b.id, b]));
  const items: DecoratedTask[] = tasks.filter((tk) => tk.blockId === row.id).map((tk) => decorate(tk, blockMap));

  const kEntregue = items.filter((t) => t.status === "entregue").length;
  const kAndamento = items.filter((t) => ["execucao", "validacao", "pronto"].includes(t.status)).length;
  const kTravadas = items.filter((t) => t.hasDep).length;

  // Agrupa por etapa (só etapas com tarefas), na ordem do pipeline.
  const groups = STATUSES.map((s) => ({
    status: s,
    rows: items.filter((t) => t.status === s.id),
  })).filter((g) => g.rows.length > 0);

  const Kpi = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="bg-panel border border-line rounded-2xl px-[18px] py-[14px] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
      <div className="font-head text-[24px] font-extrabold tracking-[-0.04em] leading-none text-inkDark">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-[0.4px] text-inkLabel mt-[7px]">{label}</div>
    </div>
  );

  return (
    <div className="view-anim flex flex-col gap-[18px]">
      {/* Voltar */}
      <button
        onClick={onBack}
        className="self-start inline-flex items-center gap-[7px] text-[12.5px] font-bold text-inkSoft hover:text-primary transition-colors cursor-pointer"
      >
        <span className="text-[15px] leading-none">←</span> Voltar para os bifes
      </button>

      {/* Cabeçalho do bife */}
      <div className="bg-panel border border-line rounded-2xl px-6 py-5" style={{ borderTop: `4px solid ${row.color}` }}>
        <div className="flex items-center gap-[10px] flex-wrap">
          <span
            className="text-[11px] font-extrabold uppercase tracking-[0.4px] px-[10px] py-[4px] rounded-[20px] text-white"
            style={{ background: row.color }}
          >
            🥩 Bife {row.bife}
          </span>
          {row.phaseShort && (
            <span className="text-[11px] font-extrabold px-[10px] py-[4px] rounded-[20px] bg-chip text-inkMid" title={row.phaseName}>
              {row.phaseShort}
            </span>
          )}
          <span className="text-[12px] font-bold text-inkSoft">{row.daysLabel}</span>
          <span className="text-[12px] font-medium text-inkMute">· {row.weekRange}</span>
          <button
            onClick={() => openBlock(row.id)}
            className="ml-auto px-3 py-[8px] rounded-[10px] text-[12.5px] font-bold cursor-pointer border border-inputLine bg-panel text-inkSoft hover:bg-chip hover:text-ink transition-colors"
          >
            Editar bife
          </button>
        </div>
        <h2 className="font-head text-[22px] font-extrabold tracking-[-0.02em] text-inkDark mt-3">{row.name}</h2>
        <div className="text-[12.5px] text-inkSoft font-medium mt-1 leading-[1.5] max-w-[680px]">{row.theme}</div>
      </div>

      {/* KPIs do bife */}
      <div className="grid grid-cols-4 gap-[14px]">
        <Kpi value={row.count} label="Tarefas no bife" color={row.color} />
        <Kpi value={kEntregue} label="Entregues" color="#10B981" />
        <Kpi value={kAndamento} label="Em andamento" color="#F59E0B" />
        <Kpi value={kTravadas} label="Com trava" color="#FF6000" />
      </div>

      {/* Progresso + área */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 items-start">
        <div className="bg-panel border border-line rounded-2xl p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.5px] text-inkMute mb-3">Andamento</div>
          <div className="flex items-center gap-[10px]">
            <span className="w-[11px] h-[11px] rounded-full flex-shrink-0" style={{ background: row.lampColor }} />
            <span className="text-[13px] font-extrabold text-ink">{row.txt}</span>
            <span className="ml-auto text-[11px] font-bold text-inkSoft">{row.meta}</span>
          </div>
          <div className="bg-chip rounded-[20px] h-2 overflow-hidden mt-3">
            <div className="h-full" style={{ width: row.pct, background: row.color }} />
          </div>
          <div className="text-[10px] font-extrabold text-inkLabel text-right mt-[5px]">{row.pctLabel} entregue</div>
        </div>

        <div className="bg-panel border border-line rounded-2xl p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.5px] text-inkMute mb-3">Por área</div>
          {row.areaSegs.length > 0 ? (
            <>
              <div className="flex h-5 rounded-[20px] overflow-hidden bg-chip">
                {row.areaSegs.map((seg) => (
                  <div
                    key={seg.name}
                    className="h-full flex items-center justify-center text-[10px] font-extrabold text-white"
                    style={{ width: seg.w, background: seg.color }}
                    title={`${seg.name}: ${seg.count}`}
                  >
                    {seg.count}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10.5px] font-bold text-inkSoft">
                {row.areaSegs.map((seg) => (
                  <span key={seg.name} className="inline-flex items-center gap-[4px]">
                    <i className="w-[8px] h-[8px] rounded-[2px] inline-block" style={{ background: seg.color }} />
                    {seg.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="text-[12px] text-inkMute italic font-medium">Sem tarefas ainda.</div>
          )}
        </div>
      </div>

      {/* Tarefas por etapa */}
      <div className="flex flex-col gap-4">
        <div className="text-[12.5px] font-extrabold uppercase tracking-[0.5px] text-inkMid flex items-center gap-[9px]">
          <span className="w-[3px] h-[15px] rounded-sm bg-primary" /> Tarefas por etapa
        </div>
        {groups.length === 0 ? (
          <div className="bg-panel border border-dashed border-line rounded-2xl p-8 text-center text-[12.5px] text-inkMute font-medium">
            Este bife ainda não tem tarefas. Adicione tarefas a ele pelo Quadro de execução.
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.status.id} className="bg-panel border border-line rounded-2xl overflow-hidden">
              <div className="flex items-center gap-[9px] px-5 py-3 border-b border-line2" style={{ background: g.status.soft }}>
                <span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: g.status.color }} />
                <span className="text-[12.5px] font-extrabold" style={{ color: g.status.color }}>
                  {g.status.name}
                </span>
                <span
                  className="ml-auto text-[11px] font-extrabold bg-panel px-[9px] py-px rounded-[20px]"
                  style={{ color: g.status.color }}
                >
                  {g.rows.length}
                </span>
              </div>
              <div>
                {g.rows.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className="flex items-center gap-3 px-5 py-[11px] border-b border-line3 last:border-b-0 cursor-pointer transition-colors hover:bg-chip"
                  >
                    <span className="w-[3px] h-[30px] rounded-sm flex-shrink-0" style={{ background: t.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-ink truncate">{t.desc}</div>
                      <div className="flex items-center gap-2 mt-[3px]">
                        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.3px]" style={{ color: t.color }}>
                          {t.areaName}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#DDD5C7]" />
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-inkFaint">
                          <CalendarIcon style={{ stroke: "#B4ADA1" }} /> {t.dateLabel}
                        </span>
                      </div>
                    </div>
                    {t.hasDep && (
                      <span
                        className="hidden md:flex items-center gap-[5px] text-[10px] font-semibold text-warnText bg-softOrange border border-warnLine rounded-lg px-2 py-1 max-w-[220px]"
                        title={t.depText}
                      >
                        <WarnIcon className="flex-shrink-0" style={{ stroke: "#C2500A" }} />
                        <span className="truncate">{t.depText}</span>
                      </span>
                    )}
                    <span
                      className="text-[9.5px] font-extrabold uppercase tracking-[0.4px] px-2 py-[3px] rounded-[20px] whitespace-nowrap flex-shrink-0"
                      style={{ background: t.prioBg, color: t.prioText }}
                    >
                      {t.prioLabel}
                    </span>
                    <span
                      className="w-[23px] h-[23px] rounded-lg text-[10px] font-extrabold flex items-center justify-center flex-shrink-0"
                      style={{ background: t.avBg, color: t.avColor }}
                      title={t.whoLabel}
                    >
                      {t.initials || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function BlocosView() {
  const { tasks, blocks, openNewBlock } = useStore();
  const rows = getBlocks(tasks, blocks);
  const summary = getBlocksSummary(blocks);
  const orphanCount = tasks.filter((tk) => !blocks.some((b) => b.id === tk.blockId)).length;

  const [detailId, setDetailId] = useState<string | null>(null);
  const detailRow = rows.find((r) => r.id === detailId);

  // Detalhe inline: troca o conteúdo da própria tela (sem overlay).
  if (detailRow) {
    return (
      <div className="pt-[14px]">
        <BlockDetail row={detailRow} onBack={() => setDetailId(null)} />
      </div>
    );
  }

  return (
    <div className="pt-[14px] flex flex-col gap-[18px]">
      {/* Hero claro */}
      <div
        className="rounded-[18px] border border-warnLine px-7 py-6 relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, #FFF3EA 0%, #FFFBF6 60%)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 w-[180px] h-[180px] bg-primary opacity-[0.08] rounded-full" />
        <div className="text-[11px] font-extrabold tracking-[1px] uppercase text-primary">Estratégia de blocos</div>
        <h2 className="font-head text-[22px] font-extrabold text-inkDark mt-[7px] mb-[5px] tracking-[-0.02em]">
          O boi é o app · cada bife é um bloco 🥩
        </h2>
        <div className="text-[12.5px] font-medium text-inkSoft max-w-[640px] leading-[1.5]">
          Cada bloco entrega o pacote completo do seu tema (tela + back + regra + cadastro), com prazo próprio. A soma
          dos blocos fecha os {summary.totalDays} dias do período. Clique num bife para ver o corte completo.
        </div>
      </div>

      {/* Resumo do período */}
      <div className="grid grid-cols-4 gap-[14px]">
        <InfoTile value={`${summary.totalDays}d`} label="Período total" />
        <InfoTile value={String(blocks.length)} label="Blocos (bifes)" />
        <InfoTile
          value={`${summary.allocatedDays}d`}
          label="Dias alocados"
          sub={summary.fitLabel}
          subColor={summary.fitColor}
        />
        <InfoTile value={`${summary.weeks}`} label="Checkpoints semanais" />
      </div>

      {/* Timeline */}
      {blocks.length > 0 && <Timeline rows={rows} onPick={setDetailId} />}

      {/* Cards de blocos */}
      {blocks.length === 0 ? (
        <div className="bg-panel border border-dashed border-line rounded-2xl p-10 text-center">
          <div className="text-[40px] mb-2">🥩</div>
          <div className="font-head text-[16px] font-extrabold mb-1 text-inkDark">Nenhum bloco ainda</div>
          <div className="text-[12.5px] text-inkSoft font-medium mb-4">
            Comece fatiando o projeto em blocos temáticos. Adicione quantos quiser.
          </div>
          <button
            onClick={openNewBlock}
            className="px-[17px] py-[11px] rounded-[12px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-[1.06]"
          >
            <PlusIcon />
            Adicionar bloco
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 items-start">
          {rows.map((row) => (
            <BlockCard key={row.id} row={row} onOpen={setDetailId} />
          ))}
        </div>
      )}

      {orphanCount > 0 && (
        <div className="text-[11.5px] text-inkSoft font-semibold px-1">
          {orphanCount} tarefa(s) sem bloco — atribua um bloco a elas pelo Quadro de execução.
        </div>
      )}
    </div>
  );
}

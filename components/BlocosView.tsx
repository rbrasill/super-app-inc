"use client";

import { AREAS, PROJECT, STATUSES } from "@/lib/data";
import { getBlocks, getBlocksSummary, type BlockRow } from "@/lib/derive";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { PlusIcon } from "./icons";

const areaColor: Record<string, string> = Object.fromEntries(AREAS.map((a) => [a.id, a.color]));
const statusMap = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

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
function Timeline({ rows }: { rows: BlockRow[] }) {
  const ticks = Array.from({ length: Math.floor(PROJECT.totalDays / 7) }, (_, i) => (i + 1) * 7).filter(
    (d) => d < PROJECT.totalDays
  );

  return (
    <div className="bg-panel border border-line rounded-2xl p-5">
      <div className="flex items-center gap-[9px] text-[12.5px] font-extrabold uppercase tracking-[0.5px] text-inkMid mb-4">
        <span className="w-[3px] h-[15px] rounded-sm bg-primary" />
        Encaixe nos {PROJECT.totalDays} dias
      </div>

      {/* Barra */}
      <div className="relative h-[46px] bg-chip rounded-xl overflow-hidden">
        {/* Checkpoints semanais */}
        {ticks.map((d) => (
          <div
            key={d}
            className="absolute top-0 bottom-0 w-px bg-panel/70"
            style={{ left: `${(d / PROJECT.totalDays) * 100}%` }}
          />
        ))}
        {/* Blocos */}
        {rows.map((r) => (
          <div
            key={r.id}
            className="absolute top-[3px] bottom-[3px] rounded-[9px] flex items-center justify-center overflow-hidden px-2"
            style={{ left: r.offsetPct, width: r.widthPct, background: r.color }}
            title={`${r.name} · ${r.daysLabel} · ${r.weekRange}`}
          >
            <span className="text-white text-[10.5px] font-extrabold truncate">
              🥩 {r.short} · {r.daysLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Régua de semanas */}
      <div className="flex justify-between mt-2 text-[10px] font-bold text-inkMute">
        <span>Semana 1</span>
        <span>Semana {Math.round(PROJECT.totalDays / 7)}</span>
      </div>
    </div>
  );
}

function BlockCard({ row, tasks }: { row: BlockRow; tasks: Task[] }) {
  const { openBlock, moveBlock, blocks } = useStore();
  const idx = blocks.findIndex((b) => b.id === row.id);
  const isFirst = idx <= 0;
  const isLast = idx >= blocks.length - 1;
  const items = tasks.filter((tk) => tk.blockId === row.id);

  return (
    <div
      className="bg-panel border border-line rounded-2xl overflow-hidden flex flex-col"
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
              onClick={() => moveBlock(row.id, -1)}
              disabled={isFirst}
              className="w-6 h-6 rounded-md text-inkMute hover:bg-chip hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[13px] font-bold"
              aria-label="Mover para cima"
            >
              ↑
            </button>
            <button
              onClick={() => moveBlock(row.id, 1)}
              disabled={isLast}
              className="w-6 h-6 rounded-md text-inkMute hover:bg-chip hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[13px] font-bold"
              aria-label="Mover para baixo"
            >
              ↓
            </button>
            <button
              onClick={() => openBlock(row.id)}
              className="px-2 h-6 rounded-md text-[11px] font-bold text-inkSoft hover:bg-chip hover:text-ink transition-colors"
            >
              Editar
            </button>
          </div>
        </div>
        <h3 className="font-head text-[16px] font-extrabold tracking-[-0.02em] text-inkDark">{row.name}</h3>
        <div className="text-[11.5px] text-inkSoft font-medium mt-1 leading-[1.45]">{row.theme}</div>
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

      {/* Tarefas do bloco */}
      <div className="px-5 py-[13px] flex-1">
        {items.length === 0 ? (
          <div className="text-[11.5px] text-inkMute italic font-medium py-2">
            Sem tarefas ainda — adicione tarefas a este bloco pelo Quadro.
          </div>
        ) : (
          <div className="flex flex-col gap-[7px]">
            {items.map((tk) => {
              const st = statusMap[tk.status];
              return (
                <div key={tk.id} className="flex items-center gap-[9px] text-[11.5px]">
                  <span className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: st?.color }} />
                  <span className="font-medium truncate flex-1 text-ink">{tk.desc}</span>
                  <span
                    className="text-[9px] font-extrabold uppercase tracking-[0.3px] flex-shrink-0"
                    style={{ color: areaColor[tk.area] }}
                  >
                    {tk.dep ? "⚠ " : ""}
                    {st?.name}
                  </span>
                </div>
              );
            })}
          </div>
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
          dos blocos fecha os {summary.totalDays} dias do período.
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
      {blocks.length > 0 && <Timeline rows={rows} />}

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
            <BlockCard key={row.id} row={row} tasks={tasks} />
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

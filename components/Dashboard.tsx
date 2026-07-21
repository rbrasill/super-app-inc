"use client";

import { getAreaDist, getBlocks, getKpis, getLegend, getPeopleProgress, getRisks } from "@/lib/derive";
import { useStore } from "@/lib/store";
import { WarnIcon } from "./icons";
import KpiCard from "./KpiCard";

/** Fatia da barra de conclusão (gradiente índigo → violeta → magenta). */
function ProgressBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative h-[26px] rounded-full border-2 border-line bg-panel overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-[10px]"
        style={{
          width: `${p}%`,
          minWidth: "44px",
          backgroundImage: "linear-gradient(90deg, #564FFD 0%, #8B5CF6 45%, #D11174 100%)",
          // faz a fatia mostrar o trecho certo do gradiente (curto = índigo; cheio = magenta)
          backgroundSize: `${p > 0 ? 10000 / p : 100}% 100%`,
        }}
      >
        <span className="text-[11px] font-extrabold text-white leading-none">{p}%</span>
      </div>
    </div>
  );
}

function SectionTitle({
  accent,
  children,
  className = "",
}: {
  accent: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[12.5px] font-extrabold uppercase tracking-[0.5px] flex items-center gap-[9px] ${className}`}
    >
      <span className="w-[3px] h-[15px] rounded-sm" style={{ background: accent }} />
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { tasks, blocks, areas, people } = useStore();
  const kpis = getKpis(tasks);
  const areaDist = getAreaDist(tasks, areas);
  const legend = getLegend();
  const blockRows = getBlocks(tasks, blocks, areas);
  const risks = getRisks(tasks, areas);
  const peopleProgress = getPeopleProgress(tasks, people);

  return (
    <div className="pt-[14px]">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-[14px] mb-4">
        <KpiCard bar="#564FFD" value={String(kpis.total)} label="Tarefas no projeto" />
        <KpiCard bar="#FD8E1F" value={String(kpis.andamento)} label="Em andamento" />
        <KpiCard
          bar="#23BD33"
          value={
            <>
              {kpis.entregue}
              <span className="text-[18px] font-extrabold text-inkMute"> / {kpis.total}</span>
            </>
          }
          label="Entregues"
        />
        <KpiCard bar="#FD8E1F" value={String(kpis.travadas)} label="Com trava / dependência" tint />
      </div>

      {/* Distribuição + Blocos */}
      <div className="grid grid-cols-[1.35fr_1fr] gap-4 mb-4">
        {/* Distribuição por área e status */}
        <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
          <SectionTitle accent="#FF6636" className="mb-4">
            Distribuição por área e status
          </SectionTitle>
          <div>
            {areaDist.map((row) => (
              <div key={row.name} className="flex items-center gap-3 mb-[11px]">
                <div className="w-[110px] text-[12px] font-bold flex-shrink-0">{row.name}</div>
                <div className="flex-1 bg-chip rounded-[20px] h-[22px] overflow-hidden flex">
                  {row.segs.map((seg, i) => (
                    <div
                      key={i}
                      className="h-full flex items-center justify-center text-[10px] font-extrabold"
                      style={{ width: seg.w, background: seg.color, color: seg.textColor }}
                    >
                      {seg.label}
                    </div>
                  ))}
                </div>
                <div className="w-[26px] text-right text-[12px] font-extrabold text-inkSoft">{row.total}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-[14px] text-[11px] font-bold text-inkSoft">
            {legend.map((l) => (
              <span key={l.name} className="inline-flex items-center gap-[5px]">
                <i className="w-[10px] h-[10px] rounded-[3px] inline-block" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        </div>

        {/* Andamento por bloco */}
        <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
          <SectionTitle accent="#FF6636" className="mb-2">
            Andamento por bloco
          </SectionTitle>
          <div>
            {blockRows.map((b) => (
              <div key={b.id} className="flex items-center gap-[13px] py-3 border-b border-line2">
                <span className="w-[11px] h-[11px] rounded-full flex-shrink-0" style={{ background: b.lampColor }} />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[12.5px]">
                    🥩 {b.short} <span className="text-inkFaint font-bold">· {b.daysLabel}</span>
                  </div>
                  <div className="text-[11px] text-inkSoft font-semibold mt-[2px]">{b.meta}</div>
                </div>
                <div className="w-[88px] flex-shrink-0">
                  <div className="bg-chip rounded-[20px] h-[7px] overflow-hidden">
                    <div className="h-full" style={{ width: b.pct, background: b.color }} />
                  </div>
                  <div className="text-[10px] font-extrabold text-inkSoft text-right mt-1">
                    {b.txt} · {b.pctLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conclusão por pessoa */}
      {peopleProgress.length > 0 && (
        <div className="bg-panel border border-line rounded-2xl shadow-soft p-5 mb-4">
          <SectionTitle accent="#564FFD" className="mb-4">
            Conclusão de tarefas por pessoa
          </SectionTitle>
          <div className="flex flex-col gap-[14px]">
            {peopleProgress.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex items-center gap-[10px] w-[190px] flex-shrink-0 min-w-0">
                  <span
                    className="w-[30px] h-[30px] rounded-[9px] text-[12px] font-extrabold flex items-center justify-center flex-shrink-0"
                    style={{ background: p.avBg, color: p.avColor }}
                  >
                    {p.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-extrabold text-inkDark truncate" title={p.name}>
                      {p.name}
                    </div>
                    <div className="text-[10.5px] font-semibold text-inkSoft">
                      {p.done} de {p.total} {p.total === 1 ? "tarefa" : "tarefas"}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <ProgressBar pct={p.pct} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Travas & dependências */}
      <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
        <SectionTitle accent="#FD8E1F" className="mb-[14px]">
          Travas & dependências abertas
        </SectionTitle>
        <div className="grid grid-cols-2 gap-[11px]">
          {risks.map((rk, i) => (
            <div key={i} className="flex gap-3 px-[14px] py-3 border border-warnLine bg-warnBg rounded-xl">
              <div className="w-7 h-7 flex-shrink-0 rounded-[9px] bg-panel border border-warnLine flex items-center justify-center">
                <WarnIcon width={15} height={15} style={{ stroke: "#FD8E1F" }} />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-[12.5px] mb-[3px]">{rk.desc}</div>
                <div className="text-[11px] text-inkSoft font-semibold">{rk.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

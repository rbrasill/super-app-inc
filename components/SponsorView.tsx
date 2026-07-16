"use client";

import { getDecisions, getDelivered, getKpis, getPhases } from "@/lib/derive";
import { useStore } from "@/lib/store";
import KpiCard from "./KpiCard";

function SectionTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div className="text-[12.5px] font-extrabold uppercase tracking-[0.5px] mb-2 flex items-center gap-[9px]">
      <span className="w-[3px] h-[15px] rounded-sm" style={{ background: accent }} />
      {children}
    </div>
  );
}

export default function SponsorView() {
  const { tasks } = useStore();
  const kpis = getKpis(tasks);
  const phases = getPhases(tasks);
  const decisions = getDecisions(tasks);
  const delivered = getDelivered(tasks);

  return (
    <div className="pt-[14px]">
      {/* Hero */}
      <div className="bg-kpiDark text-white rounded-[18px] px-7 py-[26px] mb-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-[170px] h-[170px] bg-accent opacity-20 rounded-full" />
        <div className="text-[11px] font-extrabold tracking-[1px] uppercase text-accent">
          Resumo executivo · jul/26
        </div>
        <div className="font-head text-[24px] font-extrabold mt-[8px] mb-[6px]">
          Meu INC App · andamento geral
        </div>
        <div className="text-[13px] text-white/70 font-medium max-w-[580px] leading-[1.5]">
          Visão de uma página para o patrocinador: onde o projeto está, o que já saiu e o que aguarda decisão. Sem
          detalhe operacional — esse fica no quadro do time.
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-[14px] mb-4">
        <KpiCard
          bar="#0FA47A"
          value={
            <>
              {kpis.pct}
              <span className="text-[17px] text-inkFaint">%</span>
            </>
          }
          label="Concluído do previsto"
        />
        <KpiCard bar="#10B981" value={String(kpis.entregue)} label="Entregas no ar" />
        <KpiCard bar="#FF6000" value={String(kpis.decisions)} label="Aguardando sua decisão" dark />
      </div>

      {/* Semáforo + Decisões/Entregas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Semáforo por fase */}
        <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
          <SectionTitle accent="#0FA47A">Semáforo por fase</SectionTitle>
          {phases.map((p) => (
            <div key={p.name} className="flex items-center gap-[13px] py-3 border-b border-line2">
              <span className="w-[11px] h-[11px] rounded-full flex-shrink-0" style={{ background: p.lampColor }} />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[12.5px]">{p.short}</div>
                <div className="text-[11px] text-inkSoft font-semibold mt-[2px]">
                  {p.txt} · {p.sponsorMeta}
                </div>
              </div>
              <div className="w-[70px] flex-shrink-0">
                <div className="bg-chip rounded-[20px] h-[7px] overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: p.pct }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {/* Decisões que dependem de você */}
          <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
            <SectionTitle accent="#FF6000">Decisões que dependem de você</SectionTitle>
            {decisions.map((d) => (
              <div key={d.n} className="flex gap-3 items-start py-[11px] border-b border-line2">
                <div className="w-6 h-6 rounded-lg bg-kpiDark text-accent font-extrabold text-[12px] flex items-center justify-center flex-shrink-0">
                  {d.n}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[12.5px]">{d.desc}</div>
                  <div className="text-[11px] text-inkSoft font-semibold mt-[2px]">{d.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Entregue recentemente */}
          <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
            <SectionTitle accent="#10B981">Entregue recentemente</SectionTitle>
            {delivered.map((d, i) => (
              <div key={i} className="flex gap-3 items-start py-[11px] border-b border-line2">
                <div className="w-6 h-6 rounded-lg bg-[#10B981] text-white font-extrabold text-[13px] flex items-center justify-center flex-shrink-0">
                  ✓
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[12.5px]">{d.desc}</div>
                  <div className="text-[11px] text-inkSoft font-semibold mt-[2px]">{d.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getBlocks, getDecisions, getDelivered, getKpis, getMilestones } from "@/lib/derive";
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

/** Restringe o rótulo para não vazar das bordas da linha. */
const clampPct = (p: number) => Math.max(7, Math.min(93, p));

/** Linha de marcos do projeto (cada bife entregue é um marco). */
function MilestoneCard({ todayIso }: { todayIso: string }) {
  const { tasks, blocks } = useStore();
  const line = getMilestones(tasks, blocks, todayIso);
  if (!line.segs.length) return null;

  const countdown =
    line.daysLeft === null
      ? null
      : line.daysLeft > 0
        ? { txt: `Faltam ${line.daysLeft} ${line.daysLeft === 1 ? "dia" : "dias"}`, color: "#FF6636" }
        : line.daysLeft === 0
          ? { txt: "Entrega é hoje", color: "#FD8E1F" }
          : { txt: `Atrasado há ${-line.daysLeft} ${line.daysLeft === -1 ? "dia" : "dias"}`, color: "#E34444" };

  const Label = ({ seg }: { seg: (typeof line.segs)[number] }) => (
    <div
      className="absolute -translate-x-1/2 text-center w-[130px]"
      style={{ left: `${clampPct(seg.endPct)}%` }}
    >
      <div className="text-[11px] font-extrabold leading-[1.25] text-inkDark truncate" title={seg.name}>
        {seg.name}
      </div>
      <div className="text-[10px] font-bold text-inkFaint mt-[1px]">
        {seg.dateLabel}
        {seg.delivered ? " · entregue ✓" : ""}
      </div>
    </div>
  );

  return (
    <div className="bg-panel border border-line rounded-2xl shadow-soft p-5 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SectionTitle accent="#564FFD">Marcos do projeto</SectionTitle>
        <div className="flex-1" />
        {countdown && (
          <span
            className="text-[12px] font-extrabold px-3 py-[5px] rounded-[20px] -mt-2"
            style={{ background: countdown.color + "16", color: countdown.color }}
          >
            {countdown.txt} · entrega {line.endLabel}
          </span>
        )}
      </div>

      {/* Rótulos de cima */}
      <div className="relative h-[38px] mt-1">
        {line.segs.filter((s) => s.labelTop).map((s) => (
          <Label key={s.id} seg={s} />
        ))}
      </div>

      {/* A linha: segmentos coloridos + marcos (fim de cada bife) */}
      <div className="relative h-[16px] rounded-[10px] bg-chip">
        {line.segs.map((s) => (
          <div
            key={s.id}
            className="absolute top-0 bottom-0 first:rounded-l-[10px]"
            style={{ left: `${s.leftPct}%`, width: `${s.widthPct}%`, background: s.color }}
            title={`${s.name} · até ${s.dateLabel}`}
          />
        ))}
        {line.segs.map((s) => (
          <div
            key={s.id + "-dot"}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[26px] h-[26px] rounded-full flex items-center justify-center"
            style={{ left: `${s.endPct}%`, background: s.color, boxShadow: "0 0 0 3px #fff" }}
            title={`${s.name} · ${s.dateLabel}${s.delivered ? " · entregue" : ""}`}
          >
            {s.delivered ? (
              <span className="text-white text-[12px] font-extrabold leading-none">✓</span>
            ) : (
              <span className="w-[10px] h-[10px] rounded-full bg-white" />
            )}
          </div>
        ))}
        {/* Marcador de hoje */}
        {line.todayPct !== null && (
          <div
            className="absolute -top-[6px] -bottom-[6px] w-[2px] bg-inkDark/70 rounded"
            style={{ left: `${line.todayPct}%` }}
            title={`Hoje · ${todayIso.split("-").reverse().slice(0, 2).join("/")}`}
          />
        )}
      </div>

      {/* Rótulos de baixo */}
      <div className="relative h-[38px] mt-1">
        {line.segs.filter((s) => !s.labelTop).map((s) => (
          <Label key={s.id} seg={s} />
        ))}
        {line.todayPct !== null && (
          <div
            className="absolute -translate-x-1/2 text-[9.5px] font-extrabold uppercase tracking-[0.4px] text-inkDark/70"
            style={{ left: `${clampPct(line.todayPct)}%`, top: "26px" }}
          >
            hoje
          </div>
        )}
      </div>

      {/* Régua início → fim */}
      <div className="flex justify-between mt-1 text-[10px] font-bold text-inkMute">
        <span>Início · {line.startLabel}</span>
        <span>Entrega · {line.endLabel}</span>
      </div>

      {line.tasksBeyond > 0 && (
        <div className="mt-3 text-[11.5px] font-semibold text-warnText bg-warnBg border border-warnLine rounded-[10px] px-3 py-2 inline-block">
          ⚠️ {line.tasksBeyond} tarefa(s) com fim depois da entrega prevista — o plano dos bifes pode precisar de
          ajuste.
        </div>
      )}
    </div>
  );
}

/**
 * Indicador circular de contagem regressiva até a entrega do projeto (fim do
 * último bife). O anel mostra o % do plano já decorrido; as cores seguem um
 * degradê teal → azul → violeta (reaproveita tons já usados em AV_PALETTE).
 * Fundo claro para se integrar ao card de resumo executivo.
 */
function CountdownRing({ daysLeft, progressPct }: { daysLeft: number; progressPct: number }) {
  const late = daysLeft < 0;
  const n = Math.abs(daysLeft);
  const topLabel = late ? "ATRASO" : "FALTAM";
  const bottomLabel = n === 1 ? "DIA" : "DIAS";

  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, progressPct)) / 100);

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-[6px] rounded-2xl px-4 py-[14px] bg-white/70 border border-white shadow-[0_4px_18px_rgba(29,32,38,0.08)] backdrop-blur-sm"
      title={
        late
          ? `${n} ${bottomLabel.toLowerCase()} de atraso na entrega`
          : `${n} ${bottomLabel.toLowerCase()} para a entrega do app`
      }
    >
      <div className="relative w-[76px] h-[76px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="countdownGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="50%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(29,32,38,0.10)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="url(#countdownGrad)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1px]">
          <span className="text-[7px] font-extrabold uppercase tracking-[0.5px]" style={{ color: "#0D9488" }}>
            {topLabel}
          </span>
          <span className="text-[22px] font-black text-inkDark leading-none">{n}</span>
          <span className="text-[7px] font-extrabold uppercase tracking-[0.5px]" style={{ color: "#0D9488" }}>
            {bottomLabel}
          </span>
        </div>
      </div>
      <div className="text-[9px] font-semibold text-inkSoft text-center leading-[1.3] max-w-[92px]">
        {late ? "de atraso na entrega." : "para a entrega do app."}
      </div>
    </div>
  );
}

export default function SponsorView() {
  const { tasks, blocks, people, areas } = useStore();
  const kpis = getKpis(tasks, people);
  const blockRows = getBlocks(tasks, blocks, areas);
  const decisions = getDecisions(tasks, people, areas);
  const delivered = getDelivered(tasks, areas);

  // Data de hoje só no cliente (evita divergência com o HTML pré-renderizado).
  const [todayIso, setTodayIso] = useState("");
  useEffect(() => {
    const d = new Date();
    setTodayIso(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }, []);
  const heroMilestone = todayIso ? getMilestones(tasks, blocks, todayIso) : null;

  return (
    <div className="pt-[14px]">
      {/* Hero */}
      <div
        className="rounded-[18px] border border-softOrangeLine px-[30px] py-[26px] mb-4 relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, #FFEEE8 0%, #FFFFFF 65%)" }}
      >
        <div className="absolute -right-10 -top-10 w-[180px] h-[180px] bg-primary opacity-[0.10] rounded-full" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-[1px] uppercase text-primary">
              Resumo executivo · jul/26
            </div>
            <div className="font-head text-[24px] font-extrabold mt-2 text-inkDark tracking-[-0.02em]">
              Meu INC App · andamento geral
            </div>
          </div>
          {heroMilestone && heroMilestone.daysLeft !== null && (
            <CountdownRing daysLeft={heroMilestone.daysLeft} progressPct={heroMilestone.progressPct ?? 0} />
          )}
        </div>
      </div>

      {/* Marcos do projeto (linha do tempo) */}
      {todayIso && <MilestoneCard todayIso={todayIso} />}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-[14px] mb-4">
        <KpiCard
          bar="#564FFD"
          value={
            <>
              {kpis.pct}
              <span className="text-[18px] text-inkMute">%</span>
            </>
          }
          label="Concluído do previsto"
        />
        <KpiCard bar="#23BD33" value={String(kpis.entregue)} label="Entregas no ar" />
        <KpiCard bar="#FD8E1F" value={String(kpis.decisions)} label="Aguardando sua decisão" tint />
      </div>

      {/* Semáforo + Decisões/Entregas */}
      <div className="grid grid-cols-2 gap-4">
        {/* Semáforo por bloco */}
        <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
          <SectionTitle accent="#FF6636">Semáforo por bloco</SectionTitle>
          {blockRows.map((b) => (
            <div key={b.id} className="flex items-center gap-[13px] py-3 border-b border-line2">
              <span className="w-[11px] h-[11px] rounded-full flex-shrink-0" style={{ background: b.lampColor }} />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[12.5px]">🥩 {b.short}</div>
                <div className="text-[11px] text-inkSoft font-semibold mt-[2px]">
                  {b.txt} · {b.sponsorMeta}
                </div>
              </div>
              <div className="w-[70px] flex-shrink-0">
                <div className="bg-chip rounded-[20px] h-[7px] overflow-hidden">
                  <div className="h-full" style={{ width: b.pct, background: b.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {/* Decisões que dependem de você */}
          <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
            <SectionTitle accent="#FD8E1F">Decisões que dependem de você</SectionTitle>
            {decisions.length === 0 ? (
              <div className="text-[12px] text-inkMute font-medium py-2 leading-[1.5]">
                Nenhuma decisão pendente no seu nome. As tarefas cujo responsável é o patrocinador aparecem aqui —
                defina o responsável na edição da tarefa.
              </div>
            ) : (
              decisions.map((d) => (
                <div key={d.n} className="flex gap-3 items-start py-[11px] border-b border-line2">
                  <div className="w-6 h-6 rounded-lg bg-primary text-white font-extrabold text-[12px] flex items-center justify-center flex-shrink-0">
                    {d.n}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[12.5px]">{d.desc}</div>
                    <div className="text-[11px] text-inkSoft font-semibold mt-[2px]">{d.sub}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Entregue recentemente */}
          <div className="bg-panel border border-line rounded-2xl shadow-soft p-5">
            <SectionTitle accent="#23BD33">Entregue recentemente</SectionTitle>
            {delivered.map((d, i) => (
              <div key={i} className="flex gap-3 items-start py-[11px] border-b border-line2">
                <div className="w-6 h-6 rounded-lg bg-[#23BD33] text-white font-extrabold text-[13px] flex items-center justify-center flex-shrink-0">
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

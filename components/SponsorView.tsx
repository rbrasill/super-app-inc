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

  const lastColor = line.segs[line.segs.length - 1].color;

  // Caixa flutuante do marco (estilo "balão"): nome + data, com rabinho
  // apontando para a linha e conector pontilhado. `dir` alterna acima/abaixo.
  const MBox = ({ seg, dir }: { seg: (typeof line.segs)[number]; dir: "up" | "down" }) => {
    const tailStyle =
      dir === "up" ? { background: seg.color, bottom: "-4px" } : { background: seg.color, top: "-4px" };
    const box = (
      <div
        className="relative rounded-[10px] px-[11px] py-[7px] w-[150px] shadow-[0_3px_12px_rgba(29,32,38,0.14)]"
        style={{ background: seg.color }}
      >
        <div className="text-[11px] font-extrabold text-white leading-[1.2] truncate" title={seg.name}>
          {seg.name}
        </div>
        <div className="text-[10px] font-bold text-white/85 mt-[1px]">{seg.dateLabel}</div>
        <span className="absolute left-1/2 -translate-x-1/2 w-[11px] h-[11px] rotate-45" style={tailStyle} />
      </div>
    );
    const dotted = <div className="flex-1 w-0 border-l-2 border-dotted border-inkMute/50" />;
    return (
      <div
        className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center"
        style={{ left: `${clampPct(seg.endPct)}%` }}
      >
        {dir === "up" ? (
          <>
            {box}
            {dotted}
          </>
        ) : (
          <>
            {dotted}
            {box}
          </>
        )}
      </div>
    );
  };

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

      {/* Caixas acima da linha (marcos ímpares) */}
      <div className="relative h-[84px] mt-2">
        {line.segs.filter((s) => s.labelTop).map((s) => (
          <MBox key={s.id} seg={s} dir="up" />
        ))}
      </div>

      {/* A linha: segmentos finos + nós (fim de cada bife) + seta + hoje */}
      <div className="relative h-[22px]">
        {line.segs.map((s) => (
          <div
            key={s.id}
            className="absolute top-1/2 -translate-y-1/2 h-[5px]"
            style={{ left: `${s.leftPct}%`, width: `${s.widthPct}%`, background: s.color }}
            title={`${s.name} · até ${s.dateLabel}`}
          />
        ))}
        {/* Seta indicando continuidade do tempo */}
        <div
          className="absolute top-1/2 -translate-y-1/2 right-[-5px] w-0 h-0"
          style={{
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderLeft: `9px solid ${lastColor}`,
          }}
        />
        {/* Nós: entregue = preenchido com ✓; senão = círculo vazado */}
        {line.segs.map((s) => (
          <div
            key={s.id + "-node"}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full flex items-center justify-center"
            style={
              s.delivered
                ? { left: `${s.endPct}%`, background: s.color, boxShadow: "0 0 0 3px #fff" }
                : {
                    left: `${s.endPct}%`,
                    background: "#fff",
                    boxShadow: `0 0 0 3px #fff, inset 0 0 0 2px ${s.color}`,
                  }
            }
            title={`${s.name} · ${s.dateLabel}${s.delivered ? " · entregue" : ""}`}
          >
            {s.delivered && <span className="text-white text-[10px] font-extrabold leading-none">✓</span>}
          </div>
        ))}
        {/* Marcador de hoje */}
        {line.todayPct !== null && (
          <div
            className="absolute -top-[8px] -bottom-[8px] border-l-2 border-dashed border-inkDark/55"
            style={{ left: `${line.todayPct}%` }}
            title={`Hoje · ${todayIso.split("-").reverse().join("/")}`}
          />
        )}
      </div>

      {/* Caixas abaixo da linha (marcos pares) */}
      <div className="relative h-[84px]">
        {line.segs.filter((s) => !s.labelTop).map((s) => (
          <MBox key={s.id} seg={s} dir="down" />
        ))}
        {line.todayPct !== null && (
          <div
            className="absolute -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-[0.4px] text-inkDark/60"
            style={{ left: `${clampPct(line.todayPct)}%`, top: "2px" }}
          >
            hoje
          </div>
        )}
      </div>

      {/* Régua início → fim */}
      <div className="flex justify-between mt-2">
        <span className="inline-flex items-center gap-[6px] bg-chip rounded-[10px] px-[10px] py-[5px] text-[11.5px] font-extrabold text-inkDark">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.4px] text-inkSoft">Início</span>
          {line.startLabel}
        </span>
        <span className="inline-flex items-center gap-[6px] bg-chip rounded-[10px] px-[10px] py-[5px] text-[11.5px] font-extrabold text-inkDark">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.4px] text-inkSoft">Entrega</span>
          {line.endLabel}
        </span>
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
 * Paleta dos cards de indicação (PDF paleta_cores): rampa magenta → vinho
 * (#FF0084 · #D11174 · #A22365 · #743455) + cinzas #454545/#494B4D e fundo
 * #FAFAFA.
 */
const RING = {
  bg: "#FAFAFA",
  track: "rgba(69,69,69,0.10)",
  number: "#454545",
  caption: "#494B4D",
};

/**
 * Card de indicador circular genérico: anel de progresso em degradê com
 * rótulo em cima/embaixo do número e legenda abaixo do anel.
 */
function RingCard({
  gradId,
  topLabel,
  value,
  bottomLabel,
  caption,
  progressPct,
  from,
  to,
  accent,
  title,
}: {
  gradId: string;
  topLabel: string;
  value: string;
  bottomLabel: string;
  caption: string;
  progressPct: number;
  from: string;
  to: string;
  accent: string;
  title: string;
}) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, progressPct)) / 100);

  return (
    <div
      className="flex-shrink-0 w-[150px] flex flex-col items-center justify-center gap-[8px] rounded-[18px] px-4 py-[18px] border border-line shadow-soft"
      style={{ background: RING.bg }}
      title={title}
    >
      <div className="relative w-[76px] h-[76px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={r} fill="none" stroke={RING.track} strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1px]">
          <span className="text-[7px] font-extrabold uppercase tracking-[0.5px]" style={{ color: accent }}>
            {topLabel}
          </span>
          <span className="text-[21px] font-black leading-none" style={{ color: RING.number }}>
            {value}
          </span>
          <span className="text-[7px] font-extrabold uppercase tracking-[0.5px]" style={{ color: accent }}>
            {bottomLabel}
          </span>
        </div>
      </div>
      <div
        className="text-[9px] font-semibold text-center leading-[1.3] max-w-[100px]"
        style={{ color: RING.caption }}
      >
        {caption}
      </div>
    </div>
  );
}

/** Contagem regressiva até a entrega (fim do último bife). */
function CountdownRing({ daysLeft, progressPct }: { daysLeft: number; progressPct: number }) {
  const late = daysLeft < 0;
  const n = Math.abs(daysLeft);
  return (
    <RingCard
      gradId="ringDias"
      topLabel={late ? "ATRASO" : "FALTAM"}
      value={String(n)}
      bottomLabel={n === 1 ? "DIA" : "DIAS"}
      caption={late ? "de atraso na entrega." : "para a entrega do app."}
      progressPct={progressPct}
      from="#D11174"
      to="#FF0084"
      accent="#D11174"
      title={late ? `${n} dia(s) de atraso na entrega` : `${n} dia(s) para a entrega do app`}
    />
  );
}

/**
 * Conclusão do projeto: % de tarefas entregues sobre o total ATUAL do quadro —
 * recalcula sozinho quando tarefas são criadas ou excluídas.
 */
function ConclusionRing({ pct }: { pct: number }) {
  return (
    <RingCard
      gradId="ringPct"
      topLabel="PROJETO"
      value={`${pct}%`}
      bottomLabel="Concluído"
      caption="das tarefas do quadro entregues."
      progressPct={pct}
      from="#743455"
      to="#A22365"
      accent="#A22365"
      title={`${pct}% das tarefas atuais do projeto estão entregues`}
    />
  );
}

export default function SponsorView() {
  const { tasks, blocks, people, areas, phases } = useStore();
  const kpis = getKpis(tasks, people);
  const blockRows = getBlocks(tasks, blocks, areas, phases);
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

  // Rótulo "mês/ano" do resumo (ex.: jul/26) — dinâmico, a partir de hoje.
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const monthLabel = todayIso
    ? `${MESES[Number(todayIso.slice(5, 7)) - 1]}/${todayIso.slice(2, 4)}`
    : "";

  return (
    <div className="pt-[14px]">
      {/* Cabeçalho: card de resumo + indicador de contagem ao lado */}
      <div className="flex items-stretch gap-4 mb-4">
        {/* Hero */}
        <div
          className="flex-1 min-w-0 rounded-[18px] border border-softOrangeLine px-[30px] py-[26px] relative overflow-hidden"
          style={{ background: "linear-gradient(120deg, #FFEEE8 0%, #FFFFFF 65%)" }}
        >
          <div className="absolute -right-10 -top-10 w-[180px] h-[180px] bg-primary opacity-[0.10] rounded-full" />
          <div className="text-[11px] font-extrabold tracking-[1px] uppercase text-primary">
            Resumo executivo{monthLabel ? ` · ${monthLabel}` : ""}
          </div>
          <div className="font-head text-[24px] font-extrabold mt-2 text-inkDark tracking-[-0.02em]">
            Meu INC App · andamento geral
          </div>
        </div>

        {/* Indicadores ao lado do card: dias p/ entrega + % de conclusão */}
        {heroMilestone && heroMilestone.daysLeft !== null && (
          <CountdownRing daysLeft={heroMilestone.daysLeft} progressPct={heroMilestone.progressPct ?? 0} />
        )}
        <ConclusionRing pct={kpis.pct} />
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

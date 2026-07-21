"use client";

import { useEffect, useMemo, useState } from "react";
import { exportTasksCsv } from "@/lib/exportCsv";
import { getMilestones } from "@/lib/derive";
import { useStore } from "@/lib/store";
import type { View } from "@/lib/types";
import { ExportIcon, PlusIcon, SearchIcon } from "./icons";

export default function Topbar({ title, sub, view }: { title: string; sub: string; view: View }) {
  const {
    search,
    setSearch,
    tasks,
    filteredTasks,
    blocks,
    hasActiveFilters,
    openNew,
    openNewBlock,
    openNewPerson,
    dataSource,
    areas,
  } = useStore();

  const handleExport = () => {
    exportTasksCsv(hasActiveFilters ? filteredTasks : tasks, blocks, areas);
  };

  const isBoard = view === "board";
  const isBlocks = view === "blocks";
  const isPeople = view === "people";
  const isSponsor = view === "sponsor";

  // Data de hoje só no cliente (evita divergência com o HTML pré-renderizado).
  const [todayIso, setTodayIso] = useState("");
  useEffect(() => {
    const d = new Date();
    setTodayIso(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }, []);

  const milestone = useMemo(
    () => (isSponsor && todayIso ? getMilestones(tasks, blocks, todayIso) : null),
    [isSponsor, todayIso, tasks, blocks]
  );

  return (
    <div className="px-[34px] pt-6 pb-5 flex items-center gap-[18px] flex-wrap border-b border-line bg-bg">
      <div className="min-w-0">
        <div className="flex items-center gap-[10px]">
          <div className="font-head text-[25px] font-extrabold tracking-[-0.03em] leading-[1.1] text-inkDark">
            {title}
          </div>
          {dataSource !== "loading" && <ConnBadge live={dataSource === "supabase"} />}
        </div>
        <div className="text-[12.5px] text-inkSoft font-medium mt-[3px]">{sub}</div>
      </div>
      <div className="flex-1" />

      {isBoard && (
        <>
          {/* Busca */}
          <div className="flex items-center gap-2 bg-panel border border-line rounded-[12px] px-[13px] py-[9px] w-[230px] focus-within:border-primary transition-colors">
            <SearchIcon style={{ stroke: "#A1A5B3" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarefa…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-ink font-medium placeholder:text-inkMute placeholder:font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-inkMute hover:text-ink text-[15px] leading-none font-bold"
                aria-label="Limpar busca"
              >
                ×
              </button>
            )}
          </div>

          {/* Exportar */}
          <button
            onClick={handleExport}
            className="px-3 py-[10px] rounded-[12px] text-[13px] font-bold cursor-pointer border border-line bg-panel text-inkSoft inline-flex items-center gap-[7px] transition-colors hover:bg-chip hover:text-ink"
          >
            <ExportIcon />
            Exportar
          </button>

          {/* Nova tarefa */}
          <button
            onClick={openNew}
            className="px-[17px] py-[11px] rounded-[12px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-[1.06]"
          >
            <PlusIcon />
            Nova tarefa
          </button>
        </>
      )}

      {isBlocks && (
        <button
          onClick={openNewBlock}
          className="px-[17px] py-[11px] rounded-[12px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-[1.06]"
        >
          <PlusIcon />
          Adicionar bloco
        </button>
      )}

      {isPeople && (
        <button
          onClick={openNewPerson}
          className="px-[17px] py-[11px] rounded-[12px] text-[13px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[7px] shadow-btn transition-[filter] hover:brightness-[1.06]"
        >
          <PlusIcon />
          Adicionar pessoa
        </button>
      )}

      {isSponsor && milestone && milestone.daysLeft !== null && (
        <CountdownRing daysLeft={milestone.daysLeft} progressPct={milestone.progressPct ?? 0} />
      )}
    </div>
  );
}

/**
 * Indicador circular de contagem regressiva até a entrega do projeto (fim do
 * último bife). O anel mostra o % do plano já decorrido; as cores seguem um
 * degradê teal → azul → violeta (reaproveita tons já usados em AV_PALETTE).
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
      className="flex flex-col items-center gap-[6px] rounded-2xl px-4 py-[14px]"
      style={{ background: "#0B0E14" }}
      title={
        late ? `${n} ${bottomLabel.toLowerCase()} de atraso na entrega` : `${n} ${bottomLabel.toLowerCase()} para a entrega do app`
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
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="9" />
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
          <span className="text-[7px] font-extrabold uppercase tracking-[0.5px]" style={{ color: "#5EEAD4" }}>
            {topLabel}
          </span>
          <span className="text-[22px] font-black text-white leading-none">{n}</span>
          <span className="text-[7px] font-extrabold uppercase tracking-[0.5px]" style={{ color: "#5EEAD4" }}>
            {bottomLabel}
          </span>
        </div>
      </div>
      <div className="text-[9px] font-semibold text-white/60 text-center leading-[1.3] max-w-[92px]">
        {late ? "de atraso na entrega." : "para a entrega do app."}
      </div>
    </div>
  );
}

/** Selo de conexão: verde = banco ao vivo (Supabase); âmbar = modo demo. */
function ConnBadge({ live }: { live: boolean }) {
  return (
    <span
      title={
        live
          ? "Conectado ao Supabase — suas alterações são salvas no banco."
          : "Modo demo — dados em memória; nada é salvo. Configure as variáveis NEXT_PUBLIC_SUPABASE_* para persistir."
      }
      className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] text-[11px] font-bold border cursor-default select-none ${
        live
          ? "bg-success/10 text-success border-success/25"
          : "bg-warning/10 text-warning border-warning/30"
      }`}
    >
      <span
        className={`w-[7px] h-[7px] rounded-full ${live ? "bg-success animate-pulse" : "bg-warning"}`}
      />
      {live ? "Ao vivo" : "Modo demo"}
    </span>
  );
}

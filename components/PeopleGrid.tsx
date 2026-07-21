"use client";

import { getPeople } from "@/lib/derive";
import { useStore } from "@/lib/store";
import { PlusIcon } from "./icons";

const colCls = "grid grid-cols-[1.1fr_1fr_0.8fr_1.8fr_auto]";

export default function PeopleGrid() {
  const { people, areas, tasks, openPerson, openArea, openNewArea } = useStore();
  const rows = getPeople(people, areas);

  return (
    <div className="pt-[14px] flex flex-col gap-[22px]">
      {/* ===== Pessoas ===== */}
      <div className="bg-panel border border-line rounded-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div
          className={`${colCls} bg-line3 py-3 text-[10px] font-extrabold uppercase tracking-[0.5px] text-inkMute`}
        >
          <div className="px-5">Pessoa</div>
          <div className="px-[14px]">Papel</div>
          <div className="px-[14px]">Área</div>
          <div className="px-[14px]">Responsabilidade</div>
          <div className="px-5 text-right w-[80px]">Ação</div>
        </div>

        {/* Linhas */}
        {rows.map((p) => (
          <div
            key={p.id}
            onClick={() => openPerson(p.id)}
            className={`${colCls} border-b border-line3 items-center transition-colors hover:bg-chip cursor-pointer group`}
          >
            <div className="px-5 py-[13px] flex items-center gap-[11px]">
              <div
                className="w-[30px] h-[30px] rounded-[9px] font-extrabold text-[12px] flex items-center justify-center flex-shrink-0"
                style={{ background: p.avBg, color: p.avColor }}
              >
                {p.initials}
              </div>
              <span className="font-head text-[13px] font-extrabold text-inkDark">{p.name}</span>
            </div>
            <div className="px-[14px] py-[13px] text-[12px] font-semibold text-inkSoft">{p.role}</div>
            <div className="px-[14px] py-[13px]">
              {p.hasArea ? (
                <span
                  className="inline-flex items-center gap-[6px] text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-[20px]"
                  style={{ background: p.areaColor + "18", color: p.areaColor }}
                >
                  <i className="w-[7px] h-[7px] rounded-[2px]" style={{ background: p.areaColor }} />
                  {p.areaName}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-inkMute">—</span>
              )}
            </div>
            <div className="px-[14px] py-[13px] text-[12px] font-medium text-inkMid leading-[1.45]">{p.resp}</div>
            <div className="px-5 py-[13px] text-right w-[80px]">
              <span className="text-[11.5px] font-bold text-inkFaint group-hover:text-primary transition-colors">
                Editar
              </span>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="px-5 py-8 text-center text-[12.5px] text-inkMute font-medium">
            Nenhuma pessoa cadastrada. Use “Adicionar pessoa”.
          </div>
        )}
      </div>

      {/* ===== Áreas ===== */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[12.5px] font-extrabold uppercase tracking-[0.5px] text-inkMid flex items-center gap-[9px]">
            <span className="w-[3px] h-[15px] rounded-sm bg-primary" /> Áreas
          </div>
          <div className="flex-1" />
          <button
            onClick={openNewArea}
            className="px-[13px] py-[8px] rounded-[11px] text-[12px] font-extrabold cursor-pointer border-none bg-primary text-white inline-flex items-center gap-[6px] shadow-btn transition-[filter] hover:brightness-[1.06]"
          >
            <PlusIcon />
            Adicionar área
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {areas.map((a) => {
            const nTasks = tasks.filter((tk) => tk.area === a.id).length;
            const nPeople = people.filter((p) => p.area === a.id).length;
            return (
              <div
                key={a.id}
                onClick={() => openArea(a.id)}
                className="bg-panel border border-line rounded-2xl px-4 py-[14px] flex items-center gap-3 cursor-pointer transition-[box-shadow,transform] hover:-translate-y-[2px] hover:shadow-cardHover group"
                style={{ borderLeft: `4px solid ${a.color}` }}
              >
                <span
                  className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                  style={{ background: a.color + "1E" }}
                >
                  <i className="w-[12px] h-[12px] rounded-[4px]" style={{ background: a.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-head text-[13px] font-extrabold text-inkDark truncate">{a.name}</div>
                  <div className="text-[11px] font-semibold text-inkFaint mt-[1px]">
                    {nTasks} {nTasks === 1 ? "tarefa" : "tarefas"} · {nPeople} {nPeople === 1 ? "pessoa" : "pessoas"}
                  </div>
                </div>
                <span className="text-[11.5px] font-bold text-inkFaint group-hover:text-primary transition-colors">
                  Editar
                </span>
              </div>
            );
          })}
        </div>

        {areas.length === 0 && (
          <div className="bg-panel border border-dashed border-line rounded-2xl p-8 text-center text-[12.5px] text-inkMute font-medium">
            Nenhuma área cadastrada. Use “Adicionar área”.
          </div>
        )}
      </div>

      <div className="text-[11.5px] text-inkFaint font-medium leading-[1.5] max-w-[760px]">
        Cliente real do produto é o comprador do apê (usuário final), não o patrocinador. As pessoas cadastradas aqui
        aparecem no seletor de responsável das tarefas; as áreas organizam tarefas e pessoas (cor, filtros e gráficos).
      </div>
    </div>
  );
}

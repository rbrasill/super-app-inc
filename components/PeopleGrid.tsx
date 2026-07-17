import { getPeople } from "@/lib/derive";

const colCls = "grid grid-cols-[1.1fr_1.1fr_2fr]";

export default function PeopleGrid() {
  const people = getPeople();
  return (
    <div className="pt-[14px]">
      <div className="bg-panel border border-line rounded-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div
          className={`${colCls} bg-line3 py-3 text-[10px] font-extrabold uppercase tracking-[0.5px] text-inkMute`}
        >
          <div className="px-5">Pessoa</div>
          <div className="px-[14px]">Papel</div>
          <div className="px-[14px]">Responsabilidade</div>
        </div>

        {/* Linhas */}
        {people.map((p, i) => (
          <div key={i} className={`${colCls} border-b border-line3 items-center transition-colors hover:bg-chip`}>
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
            <div className="px-[14px] py-[13px] text-[12px] font-medium text-inkMid leading-[1.45]">{p.resp}</div>
          </div>
        ))}
      </div>
      <div className="text-[11.5px] text-inkFaint font-medium mt-4 leading-[1.5] max-w-[760px]">
        Cliente real do produto é o comprador do apê (usuário final), não o patrocinador. As áreas não-dev entregam sob
        demanda; cada uma tem um representante no quadro.
      </div>
    </div>
  );
}

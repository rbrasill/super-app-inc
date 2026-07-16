import { getPeople } from "@/lib/derive";

const thClass =
  "bg-chip text-left px-[14px] py-[11px] text-[10px] uppercase tracking-[0.5px] text-inkFaint font-extrabold";

export default function PeopleGrid() {
  const people = getPeople();
  return (
    <div className="pt-[14px]">
      <div className="bg-panel border border-line rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className={`${thClass} pl-5`}>Pessoa</th>
              <th className={thClass}>Papel</th>
              <th className={thClass}>Responsabilidade</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p, i) => (
              <tr key={i} className="transition-colors hover:bg-chip">
                <td className="px-5 py-3 border-b border-line2">
                  <div className="flex items-center gap-[10px]">
                    <div
                      className="w-7 h-7 rounded-[9px] font-extrabold text-[11px] flex items-center justify-center flex-shrink-0"
                      style={{ background: p.avBg, color: p.avColor }}
                    >
                      {p.initials}
                    </div>
                    <span className="font-extrabold">{p.name}</span>
                  </div>
                </td>
                <td className="px-[14px] py-3 border-b border-line2 text-inkSoft font-semibold">{p.role}</td>
                <td className="px-[14px] py-3 border-b border-line2 font-semibold">{p.resp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[11.5px] text-inkFaint font-semibold mt-[14px] leading-[1.5]">
        Cliente real do produto é o comprador do apê (usuário final), não o patrocinador. As áreas não-dev entregam sob
        demanda; cada uma tem um representante no quadro.
      </div>
    </div>
  );
}

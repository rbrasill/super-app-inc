/**
 * Card de KPI (design Meu INC): card claro com barra sólida no topo.
 * `tint` deixa o card em laranja suave (para o KPI de atenção — travas/decisões).
 */
export default function KpiCard({
  bar,
  value,
  label,
  tint,
}: {
  bar: string;
  value: React.ReactNode;
  label: string;
  tint?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-5 pt-[22px] pb-[18px] relative overflow-hidden border transition-shadow hover:shadow-card ${
        tint ? "bg-softOrange border-warnLine" : "bg-panel border-line"
      }`}
    >
      {/* Barra no topo */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: bar }} />
      <div
        className={`font-head text-[30px] font-extrabold tracking-[-0.04em] leading-none ${
          tint ? "text-warnText" : "text-inkDark"
        }`}
      >
        {value}
      </div>
      <div
        className={`text-[10.5px] font-bold uppercase tracking-[0.4px] mt-[9px] ${
          tint ? "text-warnText" : "text-inkLabel"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

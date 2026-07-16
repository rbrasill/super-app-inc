/**
 * Card de KPI no estilo da referência: barra de gradiente no topo (cantos
 * arredondados acompanham o card via overflow-hidden), borda fininha e visual clean.
 */
export default function KpiCard({
  bar,
  value,
  label,
  dark,
}: {
  bar: string;
  value: React.ReactNode;
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-5 pt-[22px] pb-[18px] shadow-soft relative overflow-hidden transition-shadow hover:shadow-card ${
        dark ? "bg-kpiDark" : "bg-panel border border-line"
      }`}
    >
      {/* Barra de gradiente no topo */}
      <div
        className="absolute top-0 left-0 right-0 h-[6px]"
        style={{ background: `linear-gradient(90deg, ${bar} 0%, ${bar}66 100%)` }}
      />
      <div
        className={`font-head text-[34px] font-extrabold tracking-[-0.04em] leading-none ${dark ? "text-white" : ""}`}
      >
        {value}
      </div>
      <div
        className={`text-[11px] font-bold uppercase tracking-[0.4px] mt-[9px] ${
          dark ? "text-white/70" : "text-inkSoft"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

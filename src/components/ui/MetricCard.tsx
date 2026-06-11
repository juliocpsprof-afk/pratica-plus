type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: string;
};

export function MetricCard({ label, value, helper, icon }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>

      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

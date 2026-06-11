type PortalStatProps = {
  value: string;
  label: string;
};

export function PortalStat({ value, label }: PortalStatProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-3xl font-black text-[#08213f]">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

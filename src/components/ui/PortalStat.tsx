type PortalStatProps = {
  value: string;
  label: string;
  helper?: string;
};

export function PortalStat({ value, label, helper }: PortalStatProps) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black tracking-tight text-[#08213f]">
        {value}
      </p>

      {helper && (
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
          {helper}
        </p>
      )}
    </article>
  );
}

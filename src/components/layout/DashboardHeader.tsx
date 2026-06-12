type DashboardHeaderProps = {
  area: string;
  title: string;
  description: string;
};

export function DashboardHeader({
  area,
  title,
  description,
}: DashboardHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 md:p-8 lg:p-10">
          <span className="app-badge">{area}</span>

          <h1 className="app-title mt-5 max-w-3xl text-3xl md:text-5xl">
            {title}
          </h1>

          <p className="app-subtitle mt-4 max-w-2xl text-sm md:text-base">
            {description}
          </p>
        </div>

        <div className="relative min-h-[220px] overflow-hidden bg-[#08213f] p-8 text-white">
          <div className="absolute right-[-5rem] top-[-5rem] h-52 w-52 rounded-full bg-blue-400/20" />
          <div className="absolute bottom-[-4rem] left-[-4rem] h-44 w-44 rounded-full bg-[#f7c600]/20" />

          <div className="relative flex h-full flex-col justify-end">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-100">
              Treine hoje
            </p>
            <p className="mt-2 max-w-sm text-2xl font-black leading-tight">
              Trabalhe preparado amanhã.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

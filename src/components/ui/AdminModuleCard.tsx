import Link from "next/link";

type AdminModuleCardProps = {
  icon: string;
  title: string;
  description: string;
  href?: string;
};

export function AdminModuleCard({
  icon,
  title,
  description,
  href,
}: AdminModuleCardProps) {
  const content = (
    <article className="group h-full rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f1fb] text-2xl">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-black leading-tight text-[#08213f]">
            {title}
          </h3>

          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          Módulo
        </span>

        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-blue-700 transition group-hover:bg-blue-50">
          Abrir
        </span>
      </div>
    </article>
  );

  if (!href) {
    return <div>{content}</div>;
  }

  return <Link href={href}>{content}</Link>;
}

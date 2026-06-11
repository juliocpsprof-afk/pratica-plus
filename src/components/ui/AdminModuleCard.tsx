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
    <article className="h-full rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black text-[#08213f]">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {description}
      </p>

      {href && (
        <p className="mt-5 text-sm font-black text-blue-700">
          Acessar →
        </p>
      )}
    </article>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

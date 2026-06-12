import Link from "next/link";

type CourseCardProps = {
  title: string;
  description: string;
  image: string;
  href: string;
  tag: string;
};

export function CourseCard({
  title,
  description,
  image,
  href,
  tag,
}: CourseCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
        <div className="relative h-44 overflow-hidden bg-slate-100">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />

          <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[#08213f] shadow-sm backdrop-blur">
            {tag}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-black tracking-tight text-[#08213f]">
            {title}
          </h3>

          <p className="mt-3 flex-1 text-sm font-medium leading-6 text-slate-600">
            {description}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Simulador
            </span>

            <span className="rounded-full bg-[#08213f] px-4 py-2 text-xs font-black text-white">
              Iniciar
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

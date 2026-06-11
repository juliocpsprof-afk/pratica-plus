import Link from "next/link";
import { ReactNode } from "react";

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  tone?: "blue" | "purple" | "emerald" | "amber" | "rose";
};

const tones = {
  blue: "from-blue-600 to-cyan-500",
  purple: "from-violet-600 to-fuchsia-500",
  emerald: "from-emerald-600 to-teal-500",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-600 to-pink-500",
};

export function FeatureCard({
  icon,
  title,
  description,
  href,
  badge,
  tone = "blue",
}: FeatureCardProps) {
  const content: ReactNode = (
    <article className="group h-full overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-2xl shadow-lg`}
        >
          {icon}
        </div>

        {badge && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {badge}
          </span>
        )}
      </div>

      <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

      {href && (
        <p className="mt-6 text-sm font-bold text-blue-700 transition group-hover:translate-x-1">
          Acessar módulo →
        </p>
      )}
    </article>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

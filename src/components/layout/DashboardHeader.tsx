import Link from "next/link";

type DashboardHeaderProps = {
  area: "Professor" | "Aluno";
  title: string;
  description: string;
};

export function DashboardHeader({ area, title, description }: DashboardHeaderProps) {
  return (
    <header className="rounded-[2rem] bg-[#08213f] p-7 text-white shadow-xl shadow-slate-300/50">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/" className="text-sm font-bold text-[#f7c600] hover:underline">
            ← Voltar para o início
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-blue-200">
            Área do {area}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            {title}
          </h1>

          <p className="mt-3 max-w-3xl text-blue-100">
            {description}
          </p>
        </div>

        <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
          <p className="text-sm font-bold text-blue-100">Status</p>
          <p className="mt-1 text-2xl font-black">Em construção</p>
        </div>
      </div>
    </header>
  );
}

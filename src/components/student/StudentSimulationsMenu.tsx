import Link from "next/link";

function SimulationCard({
  href,
  title,
  description,
  icon,
  label,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-3xl transition group-hover:bg-blue-100">
          {icon}
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {label}
        </span>
      </div>

      <h3 className="mt-5 text-xl font-black tracking-tight text-[#08213f]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-5 inline-flex rounded-xl bg-[#08213f] px-4 py-2 text-sm font-black text-white">
        Acessar prática
      </div>
    </Link>
  );
}

export function StudentSimulationsMenu() {
  return (
    <section className="grid gap-5 lg:grid-cols-3">
      <SimulationCard
        href="/aluno/simulacoes/telemarketing"
        title="Telemarketing"
        description="Treine atendimento telefônico, escuta ativa, triagem e abordagem profissional."
        icon="☎️"
        label="Individual"
      />

      <SimulationCard
        href="/aluno/simulacoes/vendas"
        title="Técnicas de Vendas"
        description="Pratique negociação, objeções, fechamento e postura consultiva."
        icon="🛒"
        label="Individual"
      />

      <SimulationCard
        href="/aluno/simulacoes/equipe"
        title="Simulação em Equipe"
        description="Atue em grupo, tome decisões e desenvolva colaboração profissional."
        icon="🤝"
        label="Equipe"
      />
    </section>
  );
}

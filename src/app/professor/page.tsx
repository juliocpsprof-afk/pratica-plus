import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { AppShell } from "@/components/layout/AppShell";
import { AdminModuleCard } from "@/components/ui/AdminModuleCard";
import { PortalStat } from "@/components/ui/PortalStat";

const modules = [
  {
    icon: "🎓",
    title: "Cursos",
    description: "Organize os cursos que serão usados nas turmas.",
    href: "/professor/cursos",
  },
  {
    icon: "🏫",
    title: "Turmas",
    description: "Crie turmas por curso, turno e período.",
    href: "/professor/turmas",
  },
  {
    icon: "👥",
    title: "Alunos",
    description: "Cadastre alunos com login e senha automáticos.",
    href: "/professor/alunos",
  },
  {
    icon: "📥",
    title: "Importação",
    description: "Importe listas por CSV ou Excel.",
    href: "/professor/importacao",
  },
  {
    icon: "✅",
    title: "Presença",
    description: "Marque presença antes das simulações em equipe.",
    href: "/professor/presenca",
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "Equipes",
    description: "Monte equipes manuais ou sorteadas.",
    href: "/professor/equipes",
  },
  {
    icon: "🧩",
    title: "Cenários",
    description: "Cadastre situações oficiais e personalizadas.",
    href: "/professor/cenarios",
  },
  {
    icon: "📊",
    title: "Dashboard",
    description: "Acompanhe resultados gerais das simulações.",
    href: "/professor/dashboard",
  },
  {
    icon: "📑",
    title: "Relatórios",
    description: "Consulte desempenho por turma.",
    href: "/professor/relatorios",
  },
  {
    icon: "🏆",
    title: "Ranking",
    description: "Veja a classificação geral dos alunos.",
    href: "/professor/ranking",
  },
];

export default function ProfessorPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <DashboardTopbar area="professor" />

        <DashboardHeader
          area="Professor"
          title="Painel de gestão"
          description="Controle turmas, alunos, presença, cenários e desempenho de forma simples e produtiva."
        />

        <section className="mt-6 grid gap-5 md:grid-cols-4">
          <PortalStat value="--" label="Alunos cadastrados" />
          <PortalStat value="--" label="Turmas criadas" />
          <PortalStat value="--" label="Cenários ativos" />
          <PortalStat value="--" label="Média geral" />
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Gestão
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Módulos do professor
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {modules.map((module) => (
              <AdminModuleCard
                key={module.title}
                icon={module.icon}
                title={module.title}
                description={module.description}
                href={module.href}
              />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

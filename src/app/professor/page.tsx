import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { AppShell } from "@/components/layout/AppShell";
import { AdminModuleCard } from "@/components/ui/AdminModuleCard";
import { PortalStat } from "@/components/ui/PortalStat";

const modules = [
  {
    icon: "🎓",
    title: "Cursos",
    description: "Organize os cursos usados nas turmas e simulações.",
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
    description: "Cadastre alunos e configure modo livre ou trilha.",
    href: "/professor/alunos",
  },
  {
    icon: "📥",
    title: "Importação",
    description: "Importe listas por CSV ou Excel com senha automática.",
    href: "/professor/importacao",
  },
  {
    icon: "✅",
    title: "Presença",
    description: "Marque presença antes das práticas em equipe.",
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
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <DashboardHeader
          area="Professor"
          title="Painel de gestão"
          description="Gerencie alunos, turmas, cenários, trilhas, simulações e desempenho em uma visão organizada."
        />

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <PortalStat
            value="--"
            label="Alunos"
            helper="Total cadastrado"
          />
          <PortalStat
            value="--"
            label="Turmas"
            helper="Turmas ativas"
          />
          <PortalStat
            value="--"
            label="Cenários"
            helper="Simulações disponíveis"
          />
          <PortalStat
            value="--"
            label="Média"
            helper="Desempenho geral"
          />
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm md:p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-eyebrow">Gestão</p>
              <h2 className="app-title mt-2 text-2xl md:text-3xl">
                Módulos do professor
              </h2>
              <p className="app-subtitle mt-2 text-sm">
                Acesse as áreas principais do sistema.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

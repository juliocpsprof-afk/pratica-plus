import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { TeamsManager } from "@/components/professor/TeamsManager";

export default function ProfessorTeamsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <DashboardTopbar area="professor" />

        <header className="mb-6 rounded-[1.75rem] bg-[#08213f] p-8 text-white">
          <Link href="/professor" className="text-sm font-black text-[#f7c600] hover:underline">
            ← Painel do professor
          </Link>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.18em] text-blue-200">
            Equipes
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Formação de equipes
          </h1>

          <p className="mt-4 max-w-3xl text-blue-100">
            Crie equipes com alunos presentes e distribua funções para simulações em grupo.
          </p>
        </header>

        <TeamsManager />
      </div>
    </AppShell>
  );
}

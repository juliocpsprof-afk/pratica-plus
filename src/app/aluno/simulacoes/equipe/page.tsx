import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { TeamSimulationRunner } from "@/components/student/TeamSimulationRunner";

export default function TeamSimulationPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <DashboardTopbar area="aluno" />

        <header className="mb-6 rounded-[1.75rem] bg-[#08213f] p-8 text-white">
          <Link href="/aluno/simulacoes" className="text-sm font-black text-[#f7c600] hover:underline">
            ← Simuladores
          </Link>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.18em] text-blue-200">
            Simulação em equipe
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Decisão em grupo
          </h1>

          <p className="mt-4 max-w-3xl text-blue-100">
            Pratique com sua equipe, registre pontuação e alimente o ranking.
          </p>
        </header>

        <TeamSimulationRunner />
      </div>
    </AppShell>
  );
}

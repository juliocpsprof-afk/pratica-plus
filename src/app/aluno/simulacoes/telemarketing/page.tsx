import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { StudentSimulationRunner } from "@/components/student/StudentSimulationRunner";

export default function TelemarketingSimulationPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <DashboardTopbar area="aluno" />

        <header className="mb-6 rounded-[1.75rem] bg-[#08213f] p-8 text-white">
          <Link href="/aluno/simulacoes" className="text-sm font-black text-[#f7c600] hover:underline">
            ← Simuladores
          </Link>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.18em] text-blue-200">
            Telemarketing
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Simulação real de atendimento
          </h1>

          <p className="mt-4 max-w-3xl text-blue-100">
            Responda cenários cadastrados pelo professor e salve seu desempenho no histórico.
          </p>
        </header>

        <StudentSimulationRunner moduleSlug="telemarketing" />
      </div>
    </AppShell>
  );
}

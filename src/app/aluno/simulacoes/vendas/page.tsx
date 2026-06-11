import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { StudentSimulationRunner } from "@/components/student/StudentSimulationRunner";

export default function SalesSimulationPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <DashboardTopbar area="aluno" />

        <header className="mb-6 rounded-[1.75rem] bg-[#08213f] p-8 text-white">
          <Link href="/aluno/simulacoes" className="text-sm font-black text-[#f7c600] hover:underline">
            ← Simuladores
          </Link>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.18em] text-blue-200">
            Técnicas de Vendas
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Simulação real de vendas
          </h1>

          <p className="mt-4 max-w-3xl text-blue-100">
            Resolva objeções, escolha respostas e registre sua pontuação no histórico.
          </p>
        </header>

        <StudentSimulationRunner moduleSlug="vendas" />
      </div>
    </AppShell>
  );
}

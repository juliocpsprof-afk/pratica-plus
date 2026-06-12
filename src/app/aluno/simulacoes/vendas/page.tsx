import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { StudentSimulationRunner } from "@/components/student/StudentSimulationRunner";

export default function SalesSimulationPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="aluno" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <Link
            href="/aluno/simulacoes"
            className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
          >
            ← Voltar para simulações
          </Link>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Prática individual
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
            Técnicas de Vendas
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Treine abordagem, negociação, contorno de objeções, fechamento e fidelização.
          </p>
        </header>

        <StudentSimulationRunner
          moduleSlug="vendas"
          moduleTitle="Técnicas de Vendas"
        />
      </div>
    </AppShell>
  );
}

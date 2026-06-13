import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { StudentDetailReportManager } from "@/components/professor/StudentDetailReportManager";

export default function ProfessorStudentReportPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/professor"
                  className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
                >
                  ← Voltar ao painel
                </Link>

                <Link
                  href="/professor/relatorios"
                  className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Relatório geral
                </Link>
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Relatório individual
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
                Desempenho por aluno
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Selecione um aluno para visualizar simulações, notas, respostas escolhidas e feedbacks técnicos.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase text-slate-400">
                Tela
              </p>
              <p className="mt-1 text-sm font-black text-[#08213f]">
                Relatório por aluno
              </p>
            </div>
          </div>
        </header>

        <StudentDetailReportManager />
      </div>
    </AppShell>
  );
}

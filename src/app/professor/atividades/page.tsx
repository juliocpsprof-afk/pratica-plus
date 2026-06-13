import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { AssignmentsManager } from "@/components/professor/AssignmentsManager";

export default function ProfessorAssignmentsPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/professor"
                className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
              >
                ← Voltar ao painel
              </Link>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Planejamento
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
                Atividades dos alunos
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Envie cenários para turmas ou alunos específicos e acompanhe as conclusões.
              </p>
            </div>

            <Link
              href="/professor/cenarios"
              className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Gerenciar cenários
            </Link>
          </div>
        </header>

        <AssignmentsManager />
      </div>
    </AppShell>
  );
}

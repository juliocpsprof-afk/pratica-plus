import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { ClassesManager } from "@/components/professor/ClassesManager";

export default function ProfessorClassesPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/professor"
                className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
              >
                ← Voltar ao painel
              </Link>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Configuração
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
                Turmas
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Crie turmas, vincule ao curso correto e mantenha a organização das práticas.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase text-slate-400">
                Tela
              </p>
              <p className="mt-1 text-sm font-black text-[#08213f]">
                Turmas
              </p>
            </div>
          </div>
        </header>

        <ClassesManager />
      </div>
    </AppShell>
  );
}

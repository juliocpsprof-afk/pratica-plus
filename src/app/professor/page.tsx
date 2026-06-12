import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { ProfessorHomePanel } from "@/components/professor/ProfessorHomePanel";

export default function ProfessorHomePage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <header className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="p-6 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Painel do professor
              </p>

              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#08213f] md:text-4xl">
                Gerencie suas práticas, alunos e resultados em um só lugar.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Configure cursos, turmas, alunos, presença, equipes, cenários e acompanhe o desempenho das simulações do Prática+.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/professor/alunos"
                  className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
                >
                  Gerenciar alunos
                </a>

                <a
                  href="/professor/cenarios"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Ver cenários
                </a>
              </div>
            </div>

            <div className="bg-[#08213f] p-6 text-white md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                Fluxo recomendado
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-sm font-black">1. Configure a base</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Cursos, turmas e alunos.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-sm font-black">2. Prepare a aula</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Presença, equipes e cenários.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-sm font-black">3. Acompanhe resultados</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Dashboard, relatórios e ranking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <ProfessorHomePanel />
      </div>
    </AppShell>
  );
}

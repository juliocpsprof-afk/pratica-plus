import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { ScenarioPreviewManager } from "@/components/professor/ScenarioPreviewManager";

export default function ProfessorScenarioPreviewPage() {
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
                  href="/professor/cenarios"
                  className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Gerenciar cenários
                </Link>
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Pré-visualização
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
                Testar cenário antes da aula
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Simule o atendimento como professor, confira falas, opções, feedbacks e pontuações antes de liberar para os alunos.
              </p>
            </div>

            <Link
              href="/professor/cenarios"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
            >
              Editar cenários
            </Link>
          </div>
        </header>

        <ScenarioPreviewManager />
      </div>
    </AppShell>
  );
}

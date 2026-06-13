import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { ScenariosManager } from "@/components/professor/ScenariosManager";

export default function ProfessorScenariosPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/professor"
                className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
              >
                ← Voltar ao painel
              </Link>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Simulações
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
                Cenários de prática
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Crie, edite e organize situações práticas de
                Telemarketing e Técnicas de Vendas.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/professor/cenarios/modelos"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Modelos e duplicação
              </Link>

              <Link
                href="/professor/cenarios/previsualizar"
                className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
              >
                Pré-visualizar cenário
              </Link>
            </div>
          </div>
        </header>

        <ScenariosManager />
      </div>
    </AppShell>
  );
}

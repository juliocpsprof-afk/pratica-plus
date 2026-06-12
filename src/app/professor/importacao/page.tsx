import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { ImportStudentsManager } from "@/components/professor/ImportStudentsManager";

export default function ProfessorImportPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <Link href="/professor" className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
            ← Voltar ao painel
          </Link>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">Cadastro em lote</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">Importação de alunos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Importe alunos por planilha e gere automaticamente usuário e senha.
          </p>
        </header>

        <ImportStudentsManager />
      </div>
    </AppShell>
  );
}

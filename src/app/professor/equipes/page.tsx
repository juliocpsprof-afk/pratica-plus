import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { TeamsManager } from "@/components/professor/TeamsManager";

export default function ProfessorTeamsPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="professor" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <Link href="/professor" className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
            ← Voltar ao painel
          </Link>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">Aula prática</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">Equipes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Forme equipes com alunos presentes, manualmente ou por sorteio automático.
          </p>
        </header>

        <TeamsManager />
      </div>
    </AppShell>
  );
}

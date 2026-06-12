import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { StudentHomeOverview } from "@/components/student/StudentHomeOverview";

export default function StudentHomePage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="aluno" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Área do aluno
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
            Bem-vindo ao Prática+
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Seu espaço para treinar atendimento, vendas, postura profissional e tomada de decisão.
          </p>
        </header>

        <StudentHomeOverview />
      </div>
    </AppShell>
  );
}

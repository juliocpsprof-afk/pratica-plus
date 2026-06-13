import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { StudentAssignments } from "@/components/student/StudentAssignments";

export default function StudentAssignmentsPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="aluno" />

        <header className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <Link
            href="/aluno"
            className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-100"
          >
            ← Voltar para minha área
          </Link>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Minha agenda
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08213f] md:text-3xl">
            Minhas atividades
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Consulte práticas enviadas pelo professor, prazos e resultados.
          </p>
        </header>

        <StudentAssignments />
      </div>
    </AppShell>
  );
}

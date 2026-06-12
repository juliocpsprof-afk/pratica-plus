import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { CourseCard } from "@/components/ui/CourseCard";

export default function StudentSimulationsPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="aluno" />

        <header className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <Link
            href="/aluno"
            className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
          >
            ← Área do aluno
          </Link>

          <p className="app-eyebrow mt-8">Simuladores</p>

          <h1 className="app-title mt-3 max-w-3xl text-3xl md:text-5xl">
            Escolha como deseja praticar.
          </h1>

          <p className="app-subtitle mt-4 max-w-3xl text-sm md:text-base">
            Treine individualmente ou em equipe com cenários cadastrados pelo professor.
          </p>
        </header>

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <CourseCard
            title="Telemarketing"
            description="Atenda clientes, compreenda dúvidas e escolha a melhor resposta."
            image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/telemarketing"
            tag="Individual"
          />

          <CourseCard
            title="Técnicas de Vendas"
            description="Resolva objeções, negocie e conduza o cliente ao fechamento."
            image="https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/vendas"
            tag="Individual"
          />

          <CourseCard
            title="Simulação em Equipe"
            description="Pratique em grupo, dividindo funções e tomando decisões em conjunto."
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/equipe"
            tag="Equipe"
          />
        </section>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { CourseCard } from "@/components/ui/CourseCard";

export default function StudentSimulationsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <DashboardTopbar area="aluno" />

        <header className="mb-6 rounded-[1.75rem] bg-[#08213f] p-8 text-white">
          <Link href="/aluno" className="text-sm font-black text-[#f7c600] hover:underline">
            ← Área do aluno
          </Link>

          <p className="mt-7 text-sm font-black uppercase tracking-[0.18em] text-blue-200">
            Simuladores
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            Escolha como deseja praticar.
          </h1>

          <p className="mt-4 max-w-3xl text-blue-100">
            Treine individualmente ou em equipe com cenários cadastrados pelo professor.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
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
            description="Pratique com sua equipe, dividindo funções e tomando decisões em grupo."
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/equipe"
            tag="Equipe"
          />
        </section>
      </div>
    </AppShell>
  );
}

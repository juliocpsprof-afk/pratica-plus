import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { CourseCard } from "@/components/ui/CourseCard";
import { PortalStat } from "@/components/ui/PortalStat";

export default function AlunoPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <DashboardTopbar area="aluno" />

        <section className="grid overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1fr_430px]">
          <div className="p-8 lg:p-10">
            <Link href="/" className="text-sm font-black text-blue-700 hover:underline">
              ← Voltar para o início
            </Link>

            <p className="mt-9 text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Área do aluno
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-[#08213f] md:text-5xl">
              Pratique para chegar mais seguro ao mercado.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Treine atendimento, vendas, escuta, comunicação e tomada de decisão em cenários profissionais.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/aluno/simulacoes"
                className="inline-flex rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800"
              >
                Começar simulação
              </Link>

              <Link
                href="/aluno/historico"
                className="inline-flex rounded-full bg-[#f7c600] px-7 py-4 text-sm font-black text-[#08213f] transition hover:bg-[#ffd72e]"
              >
                Ver histórico
              </Link>
            </div>
          </div>

          <div className="min-h-[380px]">
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80"
              alt="Alunos diversos em atividade de aprendizagem"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-4">
          <PortalStat value="0" label="Simulações feitas" />
          <PortalStat value="--" label="Melhor competência" />
          <PortalStat value="--" label="Ranking atual" />
          <PortalStat value="0" label="Histórico salvo" />
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <CourseCard
            title="Telemarketing"
            description="Atenda clientes, compreenda dúvidas, faça triagem e escolha a melhor resposta."
            image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/telemarketing"
            tag="Atendimento"
          />

          <CourseCard
            title="Técnicas de Vendas"
            description="Treine abordagem, objeções, negociação, fechamento e relacionamento."
            image="https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/vendas"
            tag="Vendas"
          />
        </section>
      </div>
    </AppShell>
  );
}

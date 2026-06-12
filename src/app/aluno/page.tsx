import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { CourseCard } from "@/components/ui/CourseCard";
import { PortalStat } from "@/components/ui/PortalStat";

export default function AlunoPage() {
  return (
    <AppShell>
      <div className="app-container">
        <DashboardTopbar area="aluno" />

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8 lg:p-10">
              <Link
                href="/"
                className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
              >
                ← Voltar para o início
              </Link>

              <p className="app-eyebrow mt-8">Área do aluno</p>

              <h1 className="app-title mt-4 max-w-3xl text-3xl md:text-5xl">
                Pratique em cenários profissionais.
              </h1>

              <p className="app-subtitle mt-4 max-w-2xl text-sm md:text-base">
                Treine atendimento, vendas, escuta, comunicação e tomada de decisão em conversas simuladas.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/aluno/simulacoes" className="app-button-primary">
                  Começar simulação
                </Link>

                <Link href="/aluno/historico" className="app-button-secondary">
                  Ver histórico
                </Link>
              </div>
            </div>

            <div className="relative min-h-[280px] bg-[#08213f]">
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1000&q=80"
                alt="Alunos em aprendizagem"
                className="h-full min-h-[280px] w-full object-cover opacity-90"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#08213f]/75 via-[#08213f]/10 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 rounded-[22px] bg-white/92 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-black text-[#08213f]">
                  Treinamento orientado
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Prática individual, em equipe, por dificuldade ou por trilha.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <PortalStat value="0" label="Práticas" helper="Simulações feitas" />
          <PortalStat value="--" label="Competência" helper="Maior destaque" />
          <PortalStat value="--" label="Ranking" helper="Posição atual" />
          <PortalStat value="0" label="Histórico" helper="Registros salvos" />
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm md:p-6">
          <div className="mb-6">
            <p className="app-eyebrow">Simuladores</p>
            <h2 className="app-title mt-2 text-2xl md:text-3xl">
              Escolha uma prática
            </h2>
            <p className="app-subtitle mt-2 text-sm">
              Use o modo individual, equipe ou trilha conforme liberação do professor.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <CourseCard
              title="Telemarketing"
              description="Atenda clientes, compreenda dúvidas, faça triagem e escolha respostas profissionais."
              image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
              href="/aluno/simulacoes/telemarketing"
              tag="Atendimento"
            />

            <CourseCard
              title="Técnicas de Vendas"
              description="Treine abordagem, objeções, negociação, fechamento e relacionamento com clientes."
              image="https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1000&q=80"
              href="/aluno/simulacoes/vendas"
              tag="Vendas"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

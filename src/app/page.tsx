import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { CourseCard } from "@/components/ui/CourseCard";
import { PortalStat } from "@/components/ui/PortalStat";

export default function HomePage() {
  return (
    <AppShell>
      <PublicNavbar />

      <section className="relative overflow-hidden bg-white">
        <div className="absolute right-0 top-0 hidden h-full w-[40%] bg-[#f7c600] lg:block" />

        <div className="relative mx-auto grid min-h-[620px] w-full max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1fr_500px]">
          <div>
            <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
              Portal educacional de simulação
            </p>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-[#08213f] md:text-5xl lg:text-6xl">
              Treine atendimento e vendas antes de encarar o mercado.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              O Prática+ prepara alunos com simulações guiadas, cenários reais, competências profissionais e acompanhamento do professor.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/aluno/simulacoes"
                className="rounded-full bg-[#08213f] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-blue-800"
              >
                Conhecer simuladores
              </Link>

              <Link
                href="/professor"
                className="rounded-full bg-[#f7c600] px-7 py-4 text-center text-sm font-black text-[#08213f] transition hover:bg-[#ffd72e]"
              >
                Área do professor
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 z-10 hidden rounded-3xl bg-white p-5 shadow-2xl lg:block">
              <p className="text-sm font-black text-[#08213f]">Pontuação</p>
              <p className="mt-1 text-3xl font-black text-blue-700">+87</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Comunicação
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1000&q=80"
                alt="Jovens diversos em ambiente educacional"
                className="h-[460px] w-full rounded-[1.5rem] object-cover"
              />
            </div>

            <div className="absolute -bottom-6 right-4 rounded-3xl bg-[#08213f] p-5 text-white shadow-2xl">
              <p className="text-sm font-bold text-blue-100">Simulação</p>
              <p className="mt-1 text-2xl font-black">Ao vivo</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-10 md:grid-cols-4">
        <PortalStat value="2" label="Módulos principais" />
        <PortalStat value="11" label="Competências avaliadas" />
        <PortalStat value="2" label="Perfis: aluno e professor" />
        <PortalStat value="100%" label="Cenários cadastrados" />
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Treinamentos
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f] md:text-4xl">
              Escolha um simulador
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-600">
            O aluno pratica escolhas e recebe avaliação por competência. O professor acompanha a evolução.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <CourseCard
            title="Simulador de Telemarketing"
            description="Treine atendimento, triagem, escuta ativa, empatia, resolução de problemas e pós-chamada."
            image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/telemarketing"
            tag="Atendimento"
          />

          <CourseCard
            title="Simulador de Vendas"
            description="Pratique abordagem, identificação de perfil, objeções, negociação, fechamento e fidelização."
            image="https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1000&q=80"
            href="/aluno/simulacoes/vendas"
            tag="Comercial"
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[390px_1fr]">
        <div className="overflow-hidden rounded-[1.75rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <img
            src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1000&q=80"
            alt="Professora orientando alunos"
            className="h-[380px] w-full rounded-[1.25rem] object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
            Para o professor
          </p>

          <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-[#08213f] md:text-4xl">
            Gestão de turmas, presença, equipes, cenários e desempenho.
          </h2>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            O professor poderá criar turmas, cadastrar alunos, importar planilhas, montar equipes, lançar presença, criar cenários personalizados e visualizar a evolução dos alunos.
          </p>

          <Link
            href="/professor"
            className="mt-7 w-fit rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Abrir painel do professor
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

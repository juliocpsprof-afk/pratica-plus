"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getProfessorDashboardData,
  ProfessorDashboardData,
} from "@/services/professor-dashboard.service";

type ModuleCardProps = {
  href: string;
  title: string;
  description: string;
  icon: string;
  tag: string;
};

function ModuleCard({
  href,
  title,
  description,
  icon,
  tag,
}: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl transition group-hover:bg-blue-100">
          {icon}
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {tag}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-black tracking-tight text-[#08213f]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-5 inline-flex rounded-xl bg-[#08213f] px-4 py-2 text-sm font-black text-white">
        Acessar
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black tracking-tight text-[#08213f]">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export function ProfessorHomePanel() {
  const [data, setData] = useState<ProfessorDashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const dashboardData = await getProfessorDashboardData();

      setData(dashboardData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os indicadores."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="space-y-8">
      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-sm">
          Carregando painel...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm font-bold text-amber-800">
          {error}
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Alunos"
            value={data.studentsTotal}
            helper={`${data.activeStudentsTotal} ativos cadastrados.`}
          />

          <StatCard
            label="Turmas"
            value={data.classesTotal}
            helper={`${data.coursesTotal} cursos vinculados.`}
          />

          <StatCard
            label="Cenários"
            value={data.scenariosTotal}
            helper={`${data.activeScenariosTotal} ativos para prática.`}
          />

          <StatCard
            label="Simulações"
            value={data.simulationsTotal}
            helper={`Média geral: ${data.averageScore}.`}
          />
        </div>
      ) : null}

      <section>
        <SectionTitle
          eyebrow="Configuração"
          title="Cadastros e estrutura"
          description="Configure a base do sistema antes das aulas práticas."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ModuleCard
            href="/professor/cursos"
            title="Cursos"
            description="Cadastre e organize os cursos usados no simulador."
            icon="📚"
            tag="Base"
          />

          <ModuleCard
            href="/professor/turmas"
            title="Turmas"
            description="Crie turmas e vincule cada uma ao curso correto."
            icon="🏫"
            tag="Base"
          />

          <ModuleCard
            href="/professor/alunos"
            title="Alunos"
            description="Cadastre acessos, configure modo livre ou trilha e acompanhe cada aluno."
            icon="👥"
            tag="Acessos"
          />

          <ModuleCard
            href="/professor/importacao"
            title="Importação"
            description="Importe alunos em lote por planilha."
            icon="📥"
            tag="Lote"
          />
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Aula prática"
          title="Preparação e simulações"
          description="Organize presença, equipes e cenários para as práticas em sala."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ModuleCard
            href="/professor/presenca"
            title="Presença"
            description="Marque os alunos presentes antes da atividade."
            icon="✅"
            tag="Aula"
          />

          <ModuleCard
            href="/professor/equipes"
            title="Equipes"
            description="Monte equipes manualmente ou por sorteio automático."
            icon="🤝"
            tag="Grupo"
          />

          <ModuleCard
            href="/professor/atividades"
            title="Atividades"
            description="Envie práticas para turmas ou alunos e acompanhe as conclusões."
            icon="🗓️"
            tag="Planejamento"
          />

          <ModuleCard
            href="/professor/cenarios"
            title="Cenários"
            description="Crie e gerencie situações de Telemarketing e Vendas."
            icon="💬"
            tag="Simulador"
          />

          <ModuleCard
            href="/aluno/simulacoes"
            title="Área do aluno"
            description="Acesse rapidamente a tela de práticas do aluno para conferência."
            icon="🎮"
            tag="Teste"
          />
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Acompanhamento"
          title="Resultados e desempenho"
          description="Visualize o desempenho dos alunos, relatórios e ranking."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <ModuleCard
            href="/professor/dashboard"
            title="Dashboard"
            description="Veja indicadores gerais, atividades recentes e médias."
            icon="📊"
            tag="Resumo"
          />

          <ModuleCard
            href="/professor/relatorios"
            title="Relatórios"
            description="Consulte resultados por turma, módulo, aluno e tipo de prática."
            icon="📋"
            tag="Dados"
          />

          <ModuleCard
            href="/professor/ranking"
            title="Ranking"
            description="Acompanhe os alunos com melhor desempenho nas simulações."
            icon="🏆"
            tag="Desempenho"
          />
        </div>
      </section>
    </section>
  );
}


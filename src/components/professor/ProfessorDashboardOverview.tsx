"use client";

import { useEffect, useState } from "react";
import {
  getProfessorDashboardData,
  ProfessorDashboardData,
} from "@/services/professor-dashboard.service";

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

function formatDate(value: string | null) {
  if (!value) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function moduleLabel(value: string) {
  if (value === "telemarketing") return "Telemarketing";
  if (value === "vendas") return "Vendas";
  return value;
}

export function ProfessorDashboardOverview() {
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
          : "Não foi possível carregar o dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
        Carregando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alunos"
          value={data.studentsTotal}
          helper={`${data.activeStudentsTotal} alunos ativos no sistema.`}
        />

        <StatCard
          label="Turmas"
          value={data.classesTotal}
          helper={`${data.coursesTotal} cursos cadastrados.`}
        />

        <StatCard
          label="Cenários"
          value={data.scenariosTotal}
          helper={`${data.activeScenariosTotal} cenários ativos.`}
        />

        <StatCard
          label="Média geral"
          value={data.averageScore}
          helper={`${data.simulationsTotal} simulações concluídas.`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
              Distribuição
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
              Simulações por tipo
            </h2>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            <div className="rounded-2xl bg-blue-50 p-5 text-blue-700 ring-1 ring-blue-100">
              <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">
                Individual
              </p>
              <p className="mt-2 text-3xl font-black">
                {data.individualSimulations}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-700 ring-1 ring-emerald-100">
              <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">
                Equipe
              </p>
              <p className="mt-2 text-3xl font-black">
                {data.teamSimulations}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 text-slate-700 ring-1 ring-slate-200">
              <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">
                Telemarketing
              </p>
              <p className="mt-2 text-3xl font-black">
                {data.telemarketingSimulations}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-5 text-amber-700 ring-1 ring-amber-100">
              <p className="text-xs font-black uppercase tracking-[0.12em] opacity-80">
                Vendas
              </p>
              <p className="mt-2 text-3xl font-black">
                {data.salesSimulations}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
              Últimos resultados
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
              Simulações recentes
            </h2>
          </div>

          <div className="p-5 md:p-6">
            {data.latestResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-[#08213f]">
                  Nenhuma simulação concluída.
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Quando os alunos praticarem, os resultados aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.latestResults.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_100px] md:items-center">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-[#08213f]">
                          {item.studentName}
                        </h3>

                        <p className="mt-1 truncate text-sm text-slate-600">
                          {item.scenarioTitle}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {moduleLabel(item.moduleSlug)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {item.mode === "equipe" ? "Equipe" : "Individual"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200">
                        <p className="text-[11px] font-black uppercase text-slate-400">
                          Nota
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#08213f]">
                          {item.totalScore}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

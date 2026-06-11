"use client";

import { useEffect, useState } from "react";
import {
  getProfessorDashboardStats,
  getRecentSimulations,
  ProfessorDashboardStats,
  RecentSimulationRow,
} from "@/services/dashboard.service";

const emptyStats: ProfessorDashboardStats = {
  studentsCount: 0,
  classesCount: 0,
  scenariosCount: 0,
  simulationsCount: 0,
  averageScore: 0,
};

export function ProfessorDashboard() {
  const [stats, setStats] = useState<ProfessorDashboardStats>(emptyStats);
  const [recentSimulations, setRecentSimulations] = useState<
    RecentSimulationRow[]
  >([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadDashboard() {
    try {
      setError("");
      setIsLoading(true);

      const [statsData, simulationsData] = await Promise.all([
        getProfessorDashboardStats(),
        getRecentSimulations(),
      ]);

      setStats(statsData);
      setRecentSimulations(simulationsData);
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
    loadDashboard();
  }, []);

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-5">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase text-blue-700">Alunos</p>
          <p className="mt-2 text-3xl font-black text-[#08213f]">
            {stats.studentsCount}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase text-blue-700">Turmas</p>
          <p className="mt-2 text-3xl font-black text-[#08213f]">
            {stats.classesCount}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase text-blue-700">Cenários</p>
          <p className="mt-2 text-3xl font-black text-[#08213f]">
            {stats.scenariosCount}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase text-blue-700">Práticas</p>
          <p className="mt-2 text-3xl font-black text-[#08213f]">
            {stats.simulationsCount}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-[#08213f] p-5 text-white shadow-sm">
          <p className="text-xs font-black uppercase text-blue-100">Média</p>
          <p className="mt-2 text-3xl font-black">{stats.averageScore}</p>
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Desempenho
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Simulações recentes
            </h2>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
          >
            Atualizar
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center text-sm font-black text-slate-500">
            Carregando dashboard...
          </div>
        ) : recentSimulations.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <p className="text-sm font-black text-slate-500">
              Nenhuma simulação realizada ainda.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {recentSimulations.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#08213f]">
                      {item.students?.profiles?.full_name ?? "Aluno"}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {item.scenarios?.title ?? "Simulação"} •{" "}
                      {item.scenarios?.modules?.name ?? "Módulo"}
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {new Date(item.started_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 px-5 py-4 text-center">
                    <p className="text-xs font-black uppercase text-blue-700">
                      Pontuação
                    </p>
                    <p className="mt-1 text-3xl font-black text-blue-900">
                      {item.total_score}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

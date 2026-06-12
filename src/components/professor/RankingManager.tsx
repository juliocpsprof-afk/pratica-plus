"use client";

import { useEffect, useMemo, useState } from "react";
import { getStudentRanking, RankingRow } from "@/services/ranking.service";

function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "blue" | "green" | "amber";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#08213f]">{value}</p>
    </div>
  );
}

export function RankingManager() {
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredRanking = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return ranking;

    return ranking.filter((item) => {
      const text = `${item.full_name} ${item.username} ${item.class_name}`.toLowerCase();
      return text.includes(term);
    });
  }, [ranking, search]);

  const generalAverage = ranking.length
    ? Math.round(ranking.reduce((sum, item) => sum + item.average_score, 0) / ranking.length)
    : 0;

  const totalSimulations = ranking.reduce((sum, item) => sum + item.simulations_count, 0);

  async function loadRanking() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getStudentRanking();
      setRanking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar ranking.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRanking();
  }, []);

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Desempenho</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">Ranking dos alunos</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar aluno..."
                className="app-input min-w-[260px] px-4 py-2.5 text-sm"
              />

              <button
                type="button"
                onClick={loadRanking}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="Alunos ranqueados" value={ranking.length} />
            <StatCard label="Simulações" value={totalSimulations} />
            <StatCard label="Média geral" value={generalAverage} />
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Classificação</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">Lista do ranking</h2>
        </div>

        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">Carregando ranking...</div>
          ) : filteredRanking.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">Nenhum resultado encontrado.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Quando os alunos fizerem simulações, o ranking aparecerá aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRanking.map((item, index) => {
                const position = index + 1;
                const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : `#${position}`;

                return (
                  <article
                    key={item.student_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="grid gap-4 xl:grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)] xl:items-center">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-xl font-black text-[#08213f] ring-1 ring-slate-200">
                        {medal}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-[#08213f]">{item.full_name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge tone="blue">@{item.username}</Badge>
                          <Badge>{item.class_name}</Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4">
                        <StatCard label="Média" value={item.average_score} />
                        <StatCard label="Melhor" value={item.best_score} />
                        <StatCard label="Total" value={item.total_score} />
                        <StatCard label="Práticas" value={item.simulations_count} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

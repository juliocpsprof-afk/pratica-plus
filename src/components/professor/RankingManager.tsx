"use client";

import { useEffect, useMemo, useState } from "react";
import { getStudentRanking, RankingStudent } from "@/services/ranking.service";

export function RankingManager() {
  const [ranking, setRanking] = useState<RankingStudent[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const podium = useMemo(() => ranking.slice(0, 3), [ranking]);

  async function loadRanking() {
    try {
      setError("");
      setIsLoading(true);

      const data = await getStudentRanking();
      setRanking(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o ranking."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRanking();
  }, []);

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-3">
        {podium.map((student, index) => (
          <article
            key={student.studentId}
            className={`rounded-[1.75rem] p-6 shadow-sm ring-1 ${
              index === 0
                ? "bg-[#08213f] text-white ring-[#08213f]"
                : "bg-white text-[#08213f] ring-slate-200"
            }`}
          >
            <p
              className={`text-sm font-black uppercase tracking-[0.18em] ${
                index === 0 ? "text-[#f7c600]" : "text-blue-700"
              }`}
            >
              {index + 1}º lugar
            </p>

            <h2 className="mt-3 text-2xl font-black">
              {student.fullName}
            </h2>

            <p
              className={`mt-2 text-sm font-bold ${
                index === 0 ? "text-blue-100" : "text-slate-500"
              }`}
            >
              {student.username}
            </p>

            <div
              className={`mt-5 rounded-2xl p-4 ${
                index === 0 ? "bg-white/10" : "bg-blue-50"
              }`}
            >
              <p className="text-xs font-black uppercase">Média</p>
              <p className="mt-1 text-4xl font-black">
                {student.averageScore}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Ranking geral
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Desempenho dos alunos
            </h2>
          </div>

          <button
            type="button"
            onClick={loadRanking}
            className="rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
          >
            Atualizar
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center text-sm font-black text-slate-500">
            Carregando ranking...
          </div>
        ) : ranking.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              🏆
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhum aluno no ranking.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              O ranking será preenchido após as primeiras simulações.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden grid-cols-[0.4fr_1.4fr_1fr_0.8fr_0.8fr_1fr] bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
              <div>#</div>
              <div>Aluno</div>
              <div>Usuário</div>
              <div>Média</div>
              <div>Práticas</div>
              <div>Competência forte</div>
            </div>

            <div className="divide-y divide-slate-200">
              {ranking.map((student, index) => (
                <div
                  key={student.studentId}
                  className="grid gap-3 px-5 py-5 text-sm md:grid-cols-[0.4fr_1.4fr_1fr_0.8fr_0.8fr_1fr]"
                >
                  <div className="font-black text-[#08213f]">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-black text-[#08213f]">
                      {student.fullName}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Melhor nota: {student.bestScore} • Total:{" "}
                      {student.totalScore}
                    </p>
                  </div>

                  <div className="font-black text-blue-700">
                    {student.username}
                  </div>

                  <div className="font-black text-emerald-700">
                    {student.averageScore}
                  </div>

                  <div className="font-black text-slate-700">
                    {student.totalSimulations}
                  </div>

                  <div className="font-black text-[#08213f]">
                    {student.mainCompetency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

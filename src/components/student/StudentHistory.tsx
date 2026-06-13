"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session/session.client";
import {
  getStudentByProfileId,
  getStudentSimulationHistory,
  StudentByProfile,
  StudentSimulationHistoryRow,
} from "@/services/simulation.service";

export function StudentHistory() {
  const [student, setStudent] = useState<StudentByProfile | null>(null);
  const [history, setHistory] = useState<StudentSimulationHistoryRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistory() {
    try {
      setError("");
      setIsLoading(true);

      const session = getSession();

      if (!session) {
        setError("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const studentData = await getStudentByProfileId(session.profileId);

      if (!studentData) {
        setError("Aluno não encontrado para esta sessão.");
        return;
      }

      setStudent(studentData);

      const historyData = await getStudentSimulationHistory(studentData.id);
      setHistory(historyData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o histórico."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const averageScore =
    history.length === 0
      ? 0
      : Math.round(
          history.reduce((sum, item) => sum + item.total_score, 0) /
            history.length
        );

  return (
    <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Histórico
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Sua evolução nas simulações.
        </h2>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase text-blue-700">
              Simulações
            </p>
            <p className="mt-1 text-3xl font-black text-blue-900">
              {history.length}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">
              Média
            </p>
            <p className="mt-1 text-3xl font-black text-emerald-900">
              {averageScore}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Registros
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Simulações realizadas
            </h2>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            className="rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
          >
            Atualizar
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center text-sm font-black text-slate-500">
            Carregando histórico...
          </div>
        ) : history.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              📚
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhuma simulação realizada.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Faça uma simulação para começar a registrar seu desempenho.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {history.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#08213f]">
                      {item.scenario_title ?? "Simulação"}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {item.module_name ?? "Módulo"} •{" "}
                      {item.scenario_difficulty ?? "nível"}
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "Data não informada"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f4f8fc] px-5 py-4 text-center">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Pontuação
                    </p>
                    <p className="mt-1 text-3xl font-black text-blue-700">
                      {item.total_score}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </section>
  );
}


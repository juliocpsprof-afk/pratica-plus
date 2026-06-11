"use client";

import { useEffect, useMemo, useState } from "react";
import { ClassRow, getClasses } from "@/services/classes.service";
import {
  ClassReportStudent,
  getClassReport,
} from "@/services/reports.service";

export function ClassReportManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [report, setReport] = useState<ClassReportStudent[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selectedClass = useMemo(() => {
    return classes.find((classItem) => classItem.id === selectedClassId);
  }, [classes, selectedClassId]);

  const classAverage = useMemo(() => {
    if (report.length === 0) {
      return 0;
    }

    return Math.round(
      report.reduce((sum, student) => sum + student.averageScore, 0) /
        report.length
    );
  }, [report]);

  const totalSimulations = useMemo(() => {
    return report.reduce((sum, student) => sum + student.totalSimulations, 0);
  }, [report]);

  async function loadClasses() {
    try {
      setError("");
      setIsLoading(true);

      const classesData = await getClasses();
      setClasses(classesData);

      if (!selectedClassId && classesData[0]) {
        setSelectedClassId(classesData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar turmas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadReport(classId = selectedClassId) {
    if (!classId) {
      setReport([]);
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const data = await getClassReport(classId);
      setReport(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar relatório."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadReport(selectedClassId);
    }
  }, [selectedClassId]);

  return (
    <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Relatórios
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Desempenho por turma.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Veja quantidade de práticas, média, melhor nota e última simulação de cada aluno.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-black text-slate-700">
            Turma
          </label>
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => loadReport()}
          className="mt-5 w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800"
        >
          Atualizar relatório
        </button>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase text-blue-700">
              Alunos
            </p>
            <p className="mt-1 text-3xl font-black text-blue-900">
              {report.length}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">
              Média da turma
            </p>
            <p className="mt-1 text-3xl font-black text-emerald-900">
              {classAverage}
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs font-black uppercase text-amber-700">
              Simulações
            </p>
            <p className="mt-1 text-3xl font-black text-amber-900">
              {totalSimulations}
            </p>
          </div>
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 pb-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
            Turma
          </p>

          <h2 className="mt-2 text-3xl font-black text-[#08213f]">
            {selectedClass?.name ?? "Selecione uma turma"}
          </h2>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center text-sm font-black text-slate-500">
            Carregando relatório...
          </div>
        ) : report.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              📊
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhum aluno encontrado.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Cadastre alunos nesta turma para gerar o relatório.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_1fr] bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
              <div>Aluno</div>
              <div>Usuário</div>
              <div>Práticas</div>
              <div>Média</div>
              <div>Melhor nota</div>
            </div>

            <div className="divide-y divide-slate-200">
              {report.map((student) => (
                <div
                  key={student.studentId}
                  className="grid gap-3 px-5 py-5 text-sm md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]"
                >
                  <div>
                    <p className="font-black text-[#08213f]">
                      {student.fullName}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Última prática:{" "}
                      {student.lastSimulationAt
                        ? new Date(student.lastSimulationAt).toLocaleString("pt-BR")
                        : "nenhuma"}
                    </p>
                  </div>

                  <div className="font-black text-blue-700">
                    {student.username}
                  </div>

                  <div className="font-black text-slate-700">
                    {student.totalSimulations}
                  </div>

                  <div className="font-black text-emerald-700">
                    {student.averageScore}
                  </div>

                  <div className="font-black text-[#08213f]">
                    {student.bestScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </section>
  );
}

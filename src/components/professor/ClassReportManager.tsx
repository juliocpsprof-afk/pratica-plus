"use client";

import { useEffect, useMemo, useState } from "react";
import { getClasses } from "@/services/classes.service";
import {
  getSimulationReports,
  ReportRow,
  ReportSummary,
} from "@/services/reports.service";

type ClassOption = {
  id: string;
  name: string;
};

type BadgeTone = "slate" | "blue" | "green" | "amber" | "red";

const emptySummary: ReportSummary = {
  total: 0,
  averageScore: 0,
  bestScore: 0,
  individualTotal: 0,
  teamTotal: 0,
};

function formatDate(value: string | null) {
  if (!value) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";

  return value || "Não informada";
}

function difficultyTone(value: string): BadgeTone {
  if (value === "facil") return "green";
  if (value === "medio") return "amber";
  if (value === "dificil") return "red";

  return "slate";
}

function moduleLabel(value: string) {
  if (value === "telemarketing") return "Telemarketing";
  if (value === "vendas") return "Técnicas de Vendas";

  return value || "Módulo não informado";
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-[#08213f]">
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}

function scoreTone(score: number) {
  if (score >= 80) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-100";
  }

  if (score >= 60) {
    return "bg-amber-50 text-amber-800 ring-amber-100";
  }

  return "bg-red-50 text-red-800 ring-red-100";
}

export function ClassReportManager() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("todos");

  const [moduleSlug, setModuleSlug] = useState("todos");
  const [mode, setMode] = useState("todos");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] =
    useState<ReportSummary>(emptySummary);

  const [error, setError] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      const searchableText = [
        row.studentName,
        row.username,
        row.className,
        row.scenarioTitle,
        row.moduleName,
        row.teamName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [rows, search]);

  const uniqueStudents = useMemo(() => {
    return new Set(
      rows.map((row) => `${row.studentName}-${row.username}`)
    ).size;
  }, [rows]);

  async function loadOptions() {
    try {
      setIsLoadingOptions(true);
      setError("");

      const classData = await getClasses();

      const normalizedClasses: ClassOption[] = classData.map(
        (classItem) => ({
          id: classItem.id,
          name: classItem.name,
        })
      );

      setClasses(normalizedClasses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as turmas."
      );
    } finally {
      setIsLoadingOptions(false);
    }
  }

  async function loadReport() {
    try {
      setIsLoadingReport(true);
      setError("");

      const reportData = await getSimulationReports({
        classId: selectedClassId,
        moduleSlug,
        mode,
      });

      setRows(reportData.rows);
      setSummary(reportData.summary);
    } catch (err) {
      setRows([]);
      setSummary(emptySummary);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o relatório da turma."
      );
    } finally {
      setIsLoadingReport(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Relatório por turma
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Desempenho coletivo
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Consulte resultados, médias e atividades realizadas
                pelos alunos de cada turma.
              </p>
            </div>

            <button
              type="button"
              onClick={loadReport}
              disabled={isLoadingReport}
              className="inline-flex w-fit items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingReport
                ? "Atualizando..."
                : "Atualizar relatório"}
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px_210px]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Turma
              </span>

              <select
                value={selectedClassId}
                onChange={(event) =>
                  setSelectedClassId(event.target.value)
                }
                disabled={isLoadingOptions}
                className="app-input"
              >
                <option value="todos">
                  Todas as turmas
                </option>

                {classes.map((classItem) => (
                  <option
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classItem.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Módulo
              </span>

              <select
                value={moduleSlug}
                onChange={(event) =>
                  setModuleSlug(event.target.value)
                }
                className="app-input"
              >
                <option value="todos">Todos</option>
                <option value="telemarketing">
                  Telemarketing
                </option>
                <option value="vendas">
                  Técnicas de Vendas
                </option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Modalidade
              </span>

              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="app-input"
              >
                <option value="todos">Todas</option>
                <option value="individual">Individual</option>
                <option value="equipe">Equipe</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={loadReport}
              disabled={isLoadingReport}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-60"
            >
              Aplicar filtros
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Alunos"
              value={uniqueStudents}
              helper="Com atividades registradas"
            />

            <StatCard
              label="Simulações"
              value={summary.total}
              helper="Registros encontrados"
            />

            <StatCard
              label="Média"
              value={summary.averageScore}
              helper="Desempenho da seleção"
            />

            <StatCard
              label="Melhor nota"
              value={summary.bestScore}
              helper="Maior resultado"
            />

            <StatCard
              label="Em equipe"
              value={summary.teamTotal}
              helper={`${summary.individualTotal} individuais`}
            />
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Resultados
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Simulações da turma
              </h2>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar aluno ou cenário..."
              className="app-input w-full px-4 py-2.5 text-sm lg:w-[320px]"
            />
          </div>
        </div>

        <div className="p-5 md:p-6">
          {isLoadingReport ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
              Carregando relatório...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">
                Nenhum resultado encontrado.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Selecione outra turma ou aguarde a conclusão das
                simulações.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)_120px] xl:items-center">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#08213f]">
                        {row.studentName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        @{row.username} • {row.className}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="blue">
                          {moduleLabel(row.moduleSlug)}
                        </Badge>

                        <Badge
                          tone={
                            row.mode === "equipe"
                              ? "green"
                              : "slate"
                          }
                        >
                          {row.mode === "equipe"
                            ? "Equipe"
                            : "Individual"}
                        </Badge>

                        <Badge
                          tone={difficultyTone(row.difficulty)}
                        >
                          {difficultyLabel(row.difficulty)}
                        </Badge>

                        {row.teamName && (
                          <Badge tone="green">
                            {row.teamName}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#08213f]">
                        {row.scenarioTitle}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {formatDate(row.createdAt)}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3 text-center ring-1 ${scoreTone(
                        row.totalScore
                      )}`}
                    >
                      <p className="text-[11px] font-black uppercase opacity-70">
                        Nota
                      </p>

                      <p className="mt-1 text-3xl font-black">
                        {row.totalScore}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

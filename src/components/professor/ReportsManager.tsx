"use client";

import { useEffect, useMemo, useState } from "react";
import { ClassRow, getClasses } from "@/services/classes.service";
import {
  getSimulationReports,
  ReportRow,
  ReportSummary,
} from "@/services/reports.service";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[#08213f]">
        {value}
      </p>
    </div>
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ExportButton({
  children,
  onClick,
  disabled = false,
}: {
  children: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";
  return value;
}

function difficultyTone(value: string) {
  if (value === "facil") return "green";
  if (value === "medio") return "amber";
  if (value === "dificil") return "red";
  return "slate";
}

function moduleLabel(value: string) {
  if (value === "telemarketing") return "Telemarketing";
  if (value === "vendas") return "Vendas";
  return value;
}

function formatDate(value: string | null) {
  if (!value) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTodayFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function htmlCell(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function buildReportRows(rows: ReportRow[]) {
  return rows.map((row) => ({
    Aluno: row.studentName,
    Usuario: row.username,
    Turma: row.className,
    Modulo: moduleLabel(row.moduleSlug),
    Tipo: row.mode === "equipe" ? "Equipe" : "Individual",
    Equipe: row.teamName ?? "",
    Cenario: row.scenarioTitle,
    Dificuldade: difficultyLabel(row.difficulty),
    Nota: row.totalScore,
    Data: formatDate(row.createdAt),
  }));
}

export function ReportsManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({
    total: 0,
    averageScore: 0,
    bestScore: 0,
    individualTotal: 0,
    teamTotal: 0,
  });
  const [classId, setClassId] = useState("todos");
  const [moduleSlug, setModuleSlug] = useState("todos");
  const [mode, setMode] = useState("todos");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((row) => {
      const text = `${row.studentName} ${row.username} ${row.className} ${row.scenarioTitle}`.toLowerCase();
      return text.includes(term);
    });
  }, [rows, search]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [classesData, reportsData] = await Promise.all([
        getClasses(),
        getSimulationReports({
          classId,
          moduleSlug,
          mode,
        }),
      ]);

      setClasses(classesData);
      setRows(reportsData.rows);
      setSummary(reportsData.summary);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os relatórios."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function applyFilters() {
    await loadData();
  }

  function exportCsv() {
    const exportRows = buildReportRows(filteredRows);
    const headers = [
      "Aluno",
      "Usuario",
      "Turma",
      "Modulo",
      "Tipo",
      "Equipe",
      "Cenario",
      "Dificuldade",
      "Nota",
      "Data",
    ];

    const csv = [
      headers.map(csvCell).join(";"),
      ...exportRows.map((row) =>
        headers
          .map((header) => csvCell(row[header as keyof typeof row]))
          .join(";")
      ),
    ].join("\n");

    downloadFile(
      `\uFEFF${csv}`,
      `relatorio-pratica-plus-${getTodayFileDate()}.csv`,
      "text/csv;charset=utf-8"
    );
  }

  function exportExcel() {
    const exportRows = buildReportRows(filteredRows);
    const headers = [
      "Aluno",
      "Usuario",
      "Turma",
      "Modulo",
      "Tipo",
      "Equipe",
      "Cenario",
      "Dificuldade",
      "Nota",
      "Data",
    ];

    const tableRows = exportRows
      .map(
        (row) =>
          `<tr>${headers
            .map((header) => `<td>${htmlCell(row[header as keyof typeof row])}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>${headers.map((header) => `<th>${htmlCell(header)}</th>`).join("")}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    downloadFile(
      html,
      `relatorio-pratica-plus-${getTodayFileDate()}.xls`,
      "application/vnd.ms-excel;charset=utf-8"
    );
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Filtros
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
            Relatórios de desempenho
          </h2>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_190px_190px]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Turma
              </span>
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="app-input"
              >
                <option value="todos">Todas as turmas</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
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
                onChange={(event) => setModuleSlug(event.target.value)}
                className="app-input"
              >
                <option value="todos">Todos</option>
                <option value="telemarketing">Telemarketing</option>
                <option value="vendas">Vendas</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Tipo
              </span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                className="app-input"
              >
                <option value="todos">Todos</option>
                <option value="individual">Individual</option>
                <option value="equipe">Equipe</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Aplicar filtros
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <StatCard label="Registros" value={summary.total} />
            <StatCard label="Média" value={summary.averageScore} />
            <StatCard label="Melhor nota" value={summary.bestScore} />
            <StatCard label="Individual" value={summary.individualTotal} />
            <StatCard label="Equipe" value={summary.teamTotal} />
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
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Resultados
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Lista de simulações
              </h2>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar aluno, turma ou cenário..."
                className="app-input w-full lg:w-[320px] px-4 py-2.5 text-sm"
              />

              <ExportButton
                onClick={exportCsv}
                disabled={filteredRows.length === 0}
              >
                Exportar CSV
              </ExportButton>

              <ExportButton
                onClick={exportExcel}
                disabled={filteredRows.length === 0}
              >
                Exportar Excel
              </ExportButton>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando relatórios...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">
                Nenhum resultado encontrado.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ajuste os filtros ou aguarde os alunos concluírem simulações.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px] xl:items-center">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#08213f]">
                        {row.studentName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        @{row.username} • {row.className}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="blue">{moduleLabel(row.moduleSlug)}</Badge>
                        <Badge tone={row.mode === "equipe" ? "green" : "slate"}>
                          {row.mode === "equipe" ? "Equipe" : "Individual"}
                        </Badge>
                        <Badge tone={difficultyTone(row.difficulty)}>
                          {difficultyLabel(row.difficulty)}
                        </Badge>
                        {row.teamName && <Badge tone="green">{row.teamName}</Badge>}
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

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200">
                      <p className="text-[11px] font-black uppercase text-slate-400">
                        Nota
                      </p>

                      <p className="mt-1 text-3xl font-black text-[#08213f]">
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

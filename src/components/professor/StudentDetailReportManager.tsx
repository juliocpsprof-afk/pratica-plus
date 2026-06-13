"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getStudentIndividualReport,
  getStudentsForIndividualReport,
  StudentReportData,
  StudentReportListItem,
  StudentReportSession,
} from "@/services/student-report.service";

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
  children: ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ExportButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
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
  return value;
}

function difficultyTone(value: string) {
  if (value === "facil") return "green";
  if (value === "medio") return "amber";
  if (value === "dificil") return "red";
  return "slate";
}

function modeLabel(value: string) {
  return value === "equipe" ? "Equipe" : "Individual";
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

function normalizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function buildExportRows(report: StudentReportData) {
  const rows: Record<string, string | number>[] = [];

  for (const session of report.sessions) {
    if (session.answers.length === 0) {
      rows.push({
        Aluno: report.student.full_name,
        Usuario: report.student.username,
        Turma: report.student.class_name,
        Curso: report.student.course_name,
        Data: formatDate(session.created_at),
        Modulo: session.module_name,
        Tipo: modeLabel(session.mode),
        Equipe: session.team_name ?? "",
        Cenario: session.scenario_title,
        Dificuldade: difficultyLabel(session.scenario_difficulty),
        NotaFinal: session.total_score,
        Etapa: "",
        MensagemCliente: "",
        RespostaAluno: "",
        PontosResposta: "",
        MelhorOpcao: "",
        Feedback: "",
      });

      continue;
    }

    for (const answer of session.answers) {
      rows.push({
        Aluno: report.student.full_name,
        Usuario: report.student.username,
        Turma: report.student.class_name,
        Curso: report.student.course_name,
        Data: formatDate(session.created_at),
        Modulo: session.module_name,
        Tipo: modeLabel(session.mode),
        Equipe: session.team_name ?? "",
        Cenario: session.scenario_title,
        Dificuldade: difficultyLabel(session.scenario_difficulty),
        NotaFinal: session.total_score,
        Etapa: answer.step_order ?? "",
        MensagemCliente: answer.customer_message,
        RespostaAluno: answer.option_text,
        PontosResposta: answer.score,
        MelhorOpcao:
          answer.is_best_option === null
            ? "Não informado"
            : answer.is_best_option
              ? "Sim"
              : "Não",
        Feedback: answer.feedback,
      });
    }
  }

  return rows;
}

export function StudentDetailReportManager() {
  const [students, setStudents] = useState<StudentReportListItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [report, setReport] = useState<StudentReportData | null>(null);
  const [search, setSearch] = useState("");
  const [expandedSessionId, setExpandedSessionId] = useState("");
  const [error, setError] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return students;
    }

    return students.filter((student) => {
      const text = `${student.full_name} ${student.username} ${student.class_name} ${student.course_name}`.toLowerCase();
      return text.includes(term);
    });
  }, [students, search]);

  async function loadStudents() {
    try {
      setIsLoadingStudents(true);
      setError("");

      const data = await getStudentsForIndividualReport();

      setStudents(data);

      if (!selectedStudentId && data[0]) {
        setSelectedStudentId(data[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os alunos."
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }

  async function loadReport(studentId = selectedStudentId) {
    try {
      setIsLoadingReport(true);
      setError("");
      setExpandedSessionId("");

      if (!studentId) {
        setReport(null);
        return;
      }

      const data = await getStudentIndividualReport(studentId);

      setReport(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o relatório do aluno."
      );
    } finally {
      setIsLoadingReport(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadReport(selectedStudentId);
    }
  }, [selectedStudentId]);

  function exportCsv() {
    if (!report) return;

    const rows = buildExportRows(report);
    const headers = [
      "Aluno",
      "Usuario",
      "Turma",
      "Curso",
      "Data",
      "Modulo",
      "Tipo",
      "Equipe",
      "Cenario",
      "Dificuldade",
      "NotaFinal",
      "Etapa",
      "MensagemCliente",
      "RespostaAluno",
      "PontosResposta",
      "MelhorOpcao",
      "Feedback",
    ];

    const csv = [
      headers.map(csvCell).join(";"),
      ...rows.map((row) =>
        headers.map((header) => csvCell(row[header])).join(";")
      ),
    ].join("\n");

    const filename = normalizeFilename(report.student.full_name);

    downloadFile(
      `\uFEFF${csv}`,
      `relatorio-aluno-${filename}-${getTodayFileDate()}.csv`,
      "text/csv;charset=utf-8"
    );
  }

  function exportExcel() {
    if (!report) return;

    const rows = buildExportRows(report);
    const headers = [
      "Aluno",
      "Usuario",
      "Turma",
      "Curso",
      "Data",
      "Modulo",
      "Tipo",
      "Equipe",
      "Cenario",
      "Dificuldade",
      "NotaFinal",
      "Etapa",
      "MensagemCliente",
      "RespostaAluno",
      "PontosResposta",
      "MelhorOpcao",
      "Feedback",
    ];

    const tableRows = rows
      .map(
        (row) =>
          `<tr>${headers
            .map((header) => `<td>${htmlCell(row[header])}</td>`)
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

    const filename = normalizeFilename(report.student.full_name);

    downloadFile(
      html,
      `relatorio-aluno-${filename}-${getTodayFileDate()}.xls`,
      "application/vnd.ms-excel;charset=utf-8"
    );
  }

  function toggleExpanded(sessionId: string) {
    setExpandedSessionId((current) => (current === sessionId ? "" : sessionId));
  }

  function renderSession(session: StudentReportSession) {
    const expanded = expandedSessionId === session.id;

    return (
      <article
        key={session.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_150px_150px] xl:items-center">
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-[#08213f]">
              {session.scenario_title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {formatDate(session.created_at)}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="blue">{session.module_name}</Badge>
              <Badge tone={session.mode === "equipe" ? "green" : "slate"}>
                {modeLabel(session.mode)}
              </Badge>
              <Badge tone={difficultyTone(session.scenario_difficulty)}>
                {difficultyLabel(session.scenario_difficulty)}
              </Badge>
              {session.team_name && <Badge tone="green">{session.team_name}</Badge>}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200">
            <p className="text-[11px] font-black uppercase text-slate-400">
              Nota
            </p>
            <p className="mt-1 text-3xl font-black text-[#08213f]">
              {session.total_score}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleExpanded(session.id)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            {expanded ? "Ocultar respostas" : "Ver respostas"}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            {session.answers.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-600">
                Esta simulação ainda não possui respostas detalhadas registradas.
              </div>
            ) : (
              session.answers.map((answer, index) => (
                <div
                  key={`${session.id}-${answer.step_id}-${answer.option_id}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-black text-[#08213f]">
                      Etapa {answer.step_order ?? index + 1}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{answer.score} pontos</Badge>
                      {answer.is_best_option !== null && (
                        <Badge tone={answer.is_best_option ? "green" : "amber"}>
                          {answer.is_best_option ? "Melhor opção" : "Opção alternativa"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                        Cliente
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                        {answer.customer_message}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                        Resposta escolhida
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                        {answer.option_text}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-blue-700">
                      Feedback técnico
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-blue-950">
                      {answer.feedback}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Alunos
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
            Selecionar aluno
          </h2>
        </div>

        <div className="p-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno..."
            className="app-input px-4 py-2.5 text-sm"
          />

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {isLoadingStudents ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                Carregando alunos...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-bold text-slate-600">
                  Nenhum aluno encontrado.
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const selected = selectedStudentId === student.id;

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 ${
                      selected
                        ? "border-blue-600 bg-blue-50 focus:ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-200 focus:ring-slate-200"
                    }`}
                  >
                    <p className="truncate text-sm font-black text-[#08213f]">
                      {student.full_name}
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-500">
                      @{student.username}
                    </p>

                    <p className="mt-2 truncate text-xs font-semibold text-slate-500">
                      {student.class_name}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>

      <main className="space-y-6">
        {isLoadingReport ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
            Carregando relatório do aluno...
          </div>
        ) : !report ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-black text-[#08213f]">
              Selecione um aluno.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              O relatório individual aparecerá aqui.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4 md:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                      Relatório individual
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black tracking-tight text-[#08213f]">
                      {report.student.full_name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      @{report.student.username} • {report.student.class_name} • {report.student.course_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <ExportButton
                      onClick={exportCsv}
                      disabled={report.sessions.length === 0}
                    >
                      Exportar CSV
                    </ExportButton>

                    <ExportButton
                      onClick={exportExcel}
                      disabled={report.sessions.length === 0}
                    >
                      Exportar Excel
                    </ExportButton>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-5 md:p-6">
                <StatCard label="Práticas" value={report.summary.total_sessions} />
                <StatCard label="Média" value={report.summary.average_score} />
                <StatCard label="Melhor nota" value={report.summary.best_score} />
                <StatCard label="Individual" value={report.summary.individual_total} />
                <StatCard label="Equipe" value={report.summary.team_total} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4 md:px-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                  Histórico detalhado
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                  Simulações e respostas
                </h2>
              </div>

              <div className="p-5 md:p-6">
                {report.sessions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                    <h3 className="text-lg font-black text-[#08213f]">
                      Nenhuma simulação encontrada.
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Quando este aluno concluir uma prática, os detalhes aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.sessions.map(renderSession)}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </section>
  );
}


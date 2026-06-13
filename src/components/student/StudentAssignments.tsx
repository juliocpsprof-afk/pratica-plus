"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session/session.client";
import {
  getStudentByProfileId,
  StudentByProfile,
} from "@/services/simulation.service";
import {
  getStudentAssignments,
  StudentAssignmentRow,
} from "@/services/assignments.service";

function formatDate(value: string | null) {
  if (!value) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatus(assignment: StudentAssignmentRow) {
  const now = Date.now();
  const startsAt = new Date(assignment.starts_at).getTime();
  const dueAt = assignment.due_at
    ? new Date(assignment.due_at).getTime()
    : null;

  const approved =
    assignment.student_best_score !== null &&
    assignment.student_best_score >= assignment.min_score;

  if (approved) {
    return {
      label: "Aprovada",
      tone: "bg-emerald-50 text-emerald-700",
      available: true,
    };
  }

  if (assignment.student_completed) {
    return {
      label: "Refazer",
      tone: "bg-amber-50 text-amber-700",
      available: true,
    };
  }

  if (startsAt > now) {
    return {
      label: "Agendada",
      tone: "bg-blue-50 text-blue-700",
      available: false,
    };
  }

  if (dueAt && dueAt < now) {
    return {
      label: "Atrasada",
      tone: "bg-red-50 text-red-700",
      available: true,
    };
  }

  return {
    label: "Pendente",
    tone: "bg-slate-100 text-slate-700",
    available: true,
  };
}

export function StudentAssignments() {
  const [student, setStudent] = useState<StudentByProfile | null>(null);
  const [assignments, setAssignments] = useState<
    StudentAssignmentRow[]
  >([]);

  const [filter, setFilter] = useState("todas");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const filteredAssignments = useMemo(() => {
    if (filter === "todas") {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const status = getStatus(assignment);

      if (filter === "pendentes") {
        return ["Pendente", "Refazer", "Atrasada"].includes(
          status.label
        );
      }

      if (filter === "concluidas") {
        return assignment.student_completed;
      }

      if (filter === "aprovadas") {
        return status.label === "Aprovada";
      }

      return true;
    });
  }, [assignments, filter]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const session = getSession() as any;
      const profileId = session?.profileId ?? session?.id;

      if (!profileId) {
        setError("Sessão do aluno não encontrada.");
        return;
      }

      const studentData = await getStudentByProfileId(profileId);

      if (!studentData) {
        setError("Cadastro do aluno não encontrado.");
        return;
      }

      const assignmentData = await getStudentAssignments(
        studentData.id,
        studentData.class_id
      );

      setStudent(studentData);
      setAssignments(assignmentData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as atividades."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const pendingCount = assignments.filter((assignment) => {
    const status = getStatus(assignment);

    return ["Pendente", "Refazer", "Atrasada"].includes(status.label);
  }).length;

  const approvedCount = assignments.filter(
    (assignment) => getStatus(assignment).label === "Aprovada"
  ).length;

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Minha agenda
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Atividades direcionadas
              </h2>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-black uppercase text-slate-400">
                Total
              </p>
              <p className="mt-1 text-2xl font-black text-[#08213f]">
                {assignments.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-black uppercase text-amber-700">
                Pendentes
              </p>
              <p className="mt-1 text-2xl font-black text-amber-900">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3">
              <p className="text-[11px] font-black uppercase text-emerald-700">
                Aprovadas
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-900">
                {approvedCount}
              </p>
            </div>
          </div>

          <div className="mt-5 max-w-[230px]">
            <label>
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Exibir
              </span>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="app-input"
              >
                <option value="todas">Todas</option>
                <option value="pendentes">Pendentes</option>
                <option value="concluidas">Concluídas</option>
                <option value="aprovadas">Aprovadas</option>
              </select>
            </label>
          </div>

          {student?.pedagogical_notes && (
            <div className="mt-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950 ring-1 ring-blue-100">
              <strong>Orientação do professor:</strong>{" "}
              {student.pedagogical_notes}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
            Lista
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
            Atividades disponíveis
          </h2>
        </div>

        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">
              Carregando atividades...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">
                Nenhuma atividade encontrada.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                As atividades enviadas pelo professor aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => {
                const status = getStatus(assignment);
                const moduleSlug =
                  assignment.scenario?.modules?.slug === "vendas"
                    ? "vendas"
                    : "telemarketing";

                const simulationUrl =
                  `/aluno/simulacoes/${moduleSlug}` +
                  `?scenario=${encodeURIComponent(assignment.scenario_id)}` +
                  `&assignment=${encodeURIComponent(assignment.id)}`;

                return (
                  <article
                    key={assignment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px_170px] xl:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-[#08213f]">
                            {assignment.title}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${status.tone}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {assignment.description ||
                            "Realize a simulação indicada pelo professor."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                            {assignment.scenario?.modules?.name ??
                              "Módulo"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            {assignment.scenario?.title ?? "Cenário"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            Nota mínima: {assignment.min_score}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-[11px] font-black uppercase text-slate-400">
                            Prazo
                          </p>
                          <p className="mt-1 text-sm font-black text-[#08213f]">
                            {formatDate(assignment.due_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-[11px] font-black uppercase text-slate-400">
                            Melhor nota
                          </p>
                          <p className="mt-1 text-sm font-black text-[#08213f]">
                            {assignment.student_best_score ?? "--"}
                          </p>
                        </div>
                      </div>

                      {status.available ? (
                        <Link
                          href={simulationUrl}
                          className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
                        >
                          {assignment.student_completed
                            ? "Refazer prática"
                            : "Iniciar prática"}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500"
                        >
                          Ainda não liberada
                        </button>
                      )}
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

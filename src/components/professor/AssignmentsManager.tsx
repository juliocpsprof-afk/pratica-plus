"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AssignmentFormOptions,
  AssignmentRow,
  AssignmentTargetType,
  deleteAssignment,
  getAssignmentFormOptions,
  getAssignments,
  saveAssignment,
  updateAssignmentStatus,
} from "@/services/assignments.service";

type FormState = {
  id: string;
  title: string;
  description: string;
  scenarioId: string;
  targetType: AssignmentTargetType;
  classId: string;
  studentId: string;
  startsAt: string;
  dueAt: string;
  minScore: number;
  isActive: boolean;
};

function dateToInput(value?: string | null) {
  const date = value ? new Date(value) : new Date();

  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localTime.toISOString().slice(0, 16);
}

function initialForm(): FormState {
  return {
    id: "",
    title: "",
    description: "",
    scenarioId: "",
    targetType: "turma",
    classId: "",
    studentId: "",
    startsAt: dateToInput(),
    dueAt: "",
    minScore: 70,
    isActive: true,
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function difficultyLabel(value?: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";

  return value ?? "Não informada";
}

function activityStatus(assignment: AssignmentRow) {
  const now = Date.now();
  const startsAt = new Date(assignment.starts_at).getTime();
  const dueAt = assignment.due_at
    ? new Date(assignment.due_at).getTime()
    : null;

  if (!assignment.is_active) {
    return {
      label: "Inativa",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (startsAt > now) {
    return {
      label: "Agendada",
      className: "bg-blue-50 text-blue-700",
    };
  }

  if (dueAt && dueAt < now) {
    return {
      label: "Prazo encerrado",
      className: "bg-red-50 text-red-700",
    };
  }

  return {
    label: "Disponível",
    className: "bg-emerald-50 text-emerald-700",
  };
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
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-[#08213f]">
        {value}
      </p>
    </div>
  );
}

export function AssignmentsManager() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [options, setOptions] = useState<AssignmentFormOptions>({
    scenarios: [],
    classes: [],
    students: [],
  });

  const [form, setForm] = useState<FormState>(initialForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const status = activityStatus(assignment);

      const searchable = [
        assignment.title,
        assignment.description ?? "",
        assignment.target_name,
        assignment.scenario?.title ?? "",
        assignment.scenario?.modules?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      const matchesTarget =
        targetFilter === "todos" ||
        assignment.target_type === targetFilter;

      const matchesStatus =
        statusFilter === "todos" ||
        status.label.toLowerCase() === statusFilter;

      return matchesSearch && matchesTarget && matchesStatus;
    });
  }, [assignments, search, targetFilter, statusFilter]);

  const activeCount = assignments.filter(
    (assignment) => assignment.is_active
  ).length;

  const classCount = assignments.filter(
    (assignment) => assignment.target_type === "turma"
  ).length;

  const individualCount = assignments.filter(
    (assignment) => assignment.target_type === "aluno"
  ).length;

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [assignmentData, optionData] = await Promise.all([
        getAssignments(),
        getAssignmentFormOptions(),
      ]);

      setAssignments(assignmentData);
      setOptions(optionData);
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

  function openNewModal() {
    const nextForm = initialForm();

    nextForm.scenarioId = options.scenarios[0]?.id ?? "";
    nextForm.classId = options.classes[0]?.id ?? "";
    nextForm.studentId = options.students[0]?.id ?? "";

    setForm(nextForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function openEditModal(assignment: AssignmentRow) {
    setForm({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description ?? "",
      scenarioId: assignment.scenario_id,
      targetType: assignment.target_type,
      classId: assignment.class_id ?? options.classes[0]?.id ?? "",
      studentId:
        assignment.student_id ?? options.students[0]?.id ?? "",
      startsAt: dateToInput(assignment.starts_at),
      dueAt: assignment.due_at
        ? dateToInput(assignment.due_at)
        : "",
      minScore: assignment.min_score,
      isActive: assignment.is_active,
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setForm(initialForm());
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await saveAssignment(form);

      setSuccess(
        form.id
          ? "Atividade atualizada com sucesso."
          : "Atividade criada com sucesso."
      );

      await loadData();

      window.setTimeout(() => {
        setIsModalOpen(false);
        setForm(initialForm());
        setSuccess("");
      }, 650);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a atividade."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(assignment: AssignmentRow) {
    try {
      setError("");
      setSuccess("");

      await updateAssignmentStatus(
        assignment.id,
        !assignment.is_active
      );

      setSuccess(
        assignment.is_active
          ? "Atividade inativada."
          : "Atividade ativada."
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status."
      );
    }
  }

  async function handleDelete(assignment: AssignmentRow) {
    const confirmed = window.confirm(
      `Deseja excluir a atividade "${assignment.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteAssignment(assignment.id);

      setSuccess("Atividade excluída com sucesso.");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir a atividade."
      );
    }
  }

  return (
    <>
      <section className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                  Planejamento
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                  Atividades direcionadas
                </h2>
              </div>

              <button
                type="button"
                onClick={openNewModal}
                className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Criar atividade
              </button>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid gap-3 md:grid-cols-4">
              <StatCard label="Total" value={assignments.length} />
              <StatCard label="Ativas" value={activeCount} />
              <StatCard label="Para turmas" value={classCount} />
              <StatCard label="Individuais" value={individualCount} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_220px]">
              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Buscar
                </span>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Atividade, cenário, aluno ou turma..."
                  className="app-input"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Destino
                </span>

                <select
                  value={targetFilter}
                  onChange={(event) =>
                    setTargetFilter(event.target.value)
                  }
                  className="app-input"
                >
                  <option value="todos">Todos</option>
                  <option value="turma">Turmas</option>
                  <option value="aluno">Alunos</option>
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Status
                </span>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="app-input"
                >
                  <option value="todos">Todos</option>
                  <option value="disponível">Disponível</option>
                  <option value="agendada">Agendada</option>
                  <option value="inativa">Inativa</option>
                  <option value="prazo encerrado">
                    Prazo encerrado
                  </option>
                </select>
              </label>
            </div>

            {error && !isModalOpen && (
              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {success && !isModalOpen && (
              <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {success}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                  Atividades
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                  Lista de atividades
                </h2>
              </div>

              <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                {filteredAssignments.length} resultados
              </span>
            </div>
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
                  Crie uma atividade ou ajuste os filtros.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => {
                  const status = activityStatus(assignment);

                  return (
                    <article
                      key={assignment.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px_auto] xl:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-[#08213f]">
                              {assignment.title}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {assignment.description ||
                              "Sem instruções adicionais."}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              {assignment.scenario?.modules?.name ??
                                "Módulo não informado"}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {assignment.scenario?.title ??
                                "Cenário não informado"}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {assignment.target_type === "turma"
                                ? "Turma"
                                : "Aluno"}
                              : {assignment.target_name}
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
                              Conclusões
                            </p>

                            <p className="mt-1 text-sm font-black text-[#08213f]">
                              {assignment.completion_count}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <button
                            type="button"
                            onClick={() => openEditModal(assignment)}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(assignment)
                            }
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                          >
                            {assignment.is_active
                              ? "Inativar"
                              : "Ativar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(assignment)}
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-50"
                          >
                            Excluir
                          </button>
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

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    {form.id ? "Editar" : "Nova atividade"}
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                    {form.id
                      ? "Atualizar atividade"
                      : "Criar atividade"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-600 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Título
                  </span>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Ex.: Prática de atendimento da semana"
                    className="app-input"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Instruções
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Orientações para o aluno..."
                    className="app-input min-h-[90px]"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Cenário
                  </span>

                  <select
                    value={form.scenarioId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        scenarioId: event.target.value,
                      }))
                    }
                    className="app-input"
                  >
                    <option value="">Selecione</option>

                    {options.scenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.module_name} • {scenario.title} •{" "}
                        {difficultyLabel(scenario.difficulty)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Destino
                  </span>

                  <select
                    value={form.targetType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        targetType:
                          event.target.value as AssignmentTargetType,
                      }))
                    }
                    className="app-input"
                  >
                    <option value="turma">Turma</option>
                    <option value="aluno">Aluno específico</option>
                  </select>
                </label>

                {form.targetType === "turma" ? (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                      Turma
                    </span>

                    <select
                      value={form.classId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          classId: event.target.value,
                        }))
                      }
                      className="app-input"
                    >
                      <option value="">Selecione</option>

                      {options.classes.map((classItem) => (
                        <option
                          key={classItem.id}
                          value={classItem.id}
                        >
                          {classItem.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                      Aluno
                    </span>

                    <select
                      value={form.studentId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          studentId: event.target.value,
                        }))
                      }
                      className="app-input"
                    >
                      <option value="">Selecione</option>

                      {options.students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.full_name} • {student.class_name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Início
                  </span>

                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startsAt: event.target.value,
                      }))
                    }
                    className="app-input"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Prazo
                  </span>

                  <input
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dueAt: event.target.value,
                      }))
                    }
                    className="app-input"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Nota mínima
                  </span>

                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.minScore}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minScore: Number(event.target.value),
                      }))
                    }
                    className="app-input"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm font-black text-slate-700">
                    Atividade ativa
                  </span>
                </label>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {success}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Salvando..."
                    : form.id
                      ? "Salvar alterações"
                      : "Criar atividade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClassRow,
  createClass,
  deleteClass,
  getClasses,
  updateClassStatus,
} from "@/services/classes.service";
import { CourseRow, getCourses } from "@/services/courses.service";

const shiftOptions = ["Manhã", "Tarde", "Noite", "Integral", "Sábado"];

function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "green" | "blue";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function ActionButton({
  children,
  tone = "secondary",
  onClick,
}: {
  children: string;
  tone?: "primary" | "secondary" | "danger";
  onClick: () => void;
}) {
  const tones = {
    primary:
      "bg-[#08213f] text-white hover:bg-blue-800 focus:ring-blue-100",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[#08213f]">
        {value}
      </p>
    </div>
  );
}

export function ClassesManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [shift, setShift] = useState("Manhã");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeCount = classes.filter((item) => item.is_active).length;

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return classes;
    }

    return classes.filter((item) => {
      const text = `${item.name} ${item.shift ?? ""} ${
        item.courses?.name ?? ""
      }`.toLowerCase();

      return text.includes(term);
    });
  }, [classes, search]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [coursesData, classesData] = await Promise.all([
        getCourses(),
        getClasses(),
      ]);

      setCourses(coursesData);
      setClasses(classesData);

      if (!courseId && coursesData[0]) {
        setCourseId(coursesData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as turmas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateClass() {
    try {
      setError("");
      setMessage("");

      if (!name.trim()) {
        setError("Informe o nome da turma.");
        return;
      }

      if (!courseId) {
        setError("Selecione um curso para a turma.");
        return;
      }

      setIsSaving(true);

      await createClass({
        name,
        courseId,
        shift,
      });

      setName("");
      setShift("Manhã");
      setMessage("Turma cadastrada com sucesso.");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar a turma."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(classItem: ClassRow) {
    try {
      setError("");
      setMessage("");

      await updateClassStatus(classItem.id, !classItem.is_active);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status da turma."
      );
    }
  }

  async function handleDeleteClass(classId: string) {
    try {
      setError("");
      setMessage("");

      await deleteClass(classId);

      setMessage("Turma removida.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Se esta turma já possui alunos vinculados, ela não poderá ser removida.`
          : "Não foi possível remover a turma."
      );
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Configuração
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Nova turma
              </h2>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              Total: {classes.length} • Ativas: {activeCount}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Nome da turma
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                placeholder="Ex: Turma 01"
                className="app-input"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Curso
              </span>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="app-input"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Turno
              </span>
              <select
                value={shift}
                onChange={(event) => setShift(event.target.value)}
                className="app-input"
              >
                {shiftOptions.map((shiftOption) => (
                  <option key={shiftOption} value={shiftOption}>
                    {shiftOption}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {message}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setName("");
                setShift("Manhã");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={handleCreateClass}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Cadastrar turma"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Turmas cadastradas
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Lista de turmas
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar turma..."
                className="app-input min-w-[240px] px-4 py-2.5 text-sm"
              />

              <ActionButton onClick={loadData}>Atualizar</ActionButton>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando turmas...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">
                Nenhuma turma encontrada.
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cadastre uma turma ou ajuste a busca.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((classItem) => (
                <article
                  key={classItem.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <h3 className="truncate text-base font-black text-[#08213f]">
                          {classItem.name}
                        </h3>

                        <Badge tone={classItem.is_active ? "green" : "slate"}>
                          {classItem.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Turma vinculada ao curso{" "}
                        <strong>{classItem.courses?.name ?? "não informado"}</strong>.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <SummaryItem
                        label="Curso"
                        value={classItem.courses?.name ?? "Sem curso"}
                      />

                      <SummaryItem
                        label="Turno"
                        value={classItem.shift ?? "Não informado"}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <ActionButton
                        onClick={() => handleToggleStatus(classItem)}
                      >
                        {classItem.is_active ? "Desativar" : "Ativar"}
                      </ActionButton>

                      <ActionButton
                        tone="danger"
                        onClick={() => handleDeleteClass(classItem.id)}
                      >
                        Remover
                      </ActionButton>
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

"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CourseRow,
  createCourse,
  deleteCourse,
  getCourses,
  updateCourseStatus,
} from "@/services/courses.service";

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "red" | "blue";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
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
  children: ReactNode;
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

export function CoursesManager() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeCount = courses.filter((course) => course.is_active).length;

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return courses;
    }

    return courses.filter((course) => {
      const text = `${course.name} ${course.description ?? ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [courses, search]);

  async function loadCourses() {
    try {
      setIsLoading(true);
      setError("");

      const data = await getCourses();

      setCourses(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os cursos."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleCreateCourse() {
    try {
      setError("");
      setMessage("");

      if (!name.trim()) {
        setError("Informe o nome do curso.");
        return;
      }

      setIsSaving(true);

      await createCourse({
        name,
        description,
      });

      setName("");
      setDescription("");
      setMessage("Curso cadastrado com sucesso.");

      await loadCourses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o curso."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(course: CourseRow) {
    try {
      setError("");
      setMessage("");

      await updateCourseStatus(course.id, !course.is_active);

      await loadCourses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status do curso."
      );
    }
  }

  async function handleDeleteCourse(courseId: string) {
    try {
      setError("");
      setMessage("");

      await deleteCourse(courseId);

      setMessage("Curso removido.");
      await loadCourses();
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} Se este curso já possui turmas ou alunos vinculados, ele não poderá ser removido.`
          : "Não foi possível remover o curso."
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
                Novo curso
              </h2>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              Total: {courses.length} • Ativos: {activeCount}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Nome do curso
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                placeholder="Ex: Telemarketing"
                className="app-input"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Descrição
              </span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                type="text"
                placeholder="Resumo curto para identificação do curso"
                className="app-input"
              />
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
                setDescription("");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={handleCreateCourse}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Cadastrar curso"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Cursos cadastrados
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Lista de cursos
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar curso..."
                className="app-input min-w-[240px] px-4 py-2.5 text-sm"
              />

              <ActionButton onClick={loadCourses}>Atualizar</ActionButton>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando cursos...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">
                Nenhum curso encontrado.
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cadastre um curso ou ajuste a busca.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <h3 className="truncate text-base font-black text-[#08213f]">
                          {course.name}
                        </h3>

                        <Badge tone={course.is_active ? "green" : "slate"}>
                          {course.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {course.description || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <ActionButton
                        onClick={() => handleToggleStatus(course)}
                      >
                        {course.is_active ? "Desativar" : "Ativar"}
                      </ActionButton>

                      <ActionButton
                        tone="danger"
                        onClick={() => handleDeleteCourse(course.id)}
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


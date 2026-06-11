"use client";

import { useEffect, useState } from "react";
import {
  CourseRow,
  createCourse,
  deleteCourse,
  getCourses,
  updateCourseStatus,
} from "@/services/courses.service";
import { getModules, ModuleRow } from "@/services/modules.service";

export function CoursesManager() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [name, setName] = useState("");
  const [moduleId, setModuleId] = useState<string>("");
  const [workload, setWorkload] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [modulesData, coursesData] = await Promise.all([
        getModules(),
        getCourses(),
      ]);

      setModules(modulesData);
      setCourses(coursesData);

      if (!moduleId && modulesData[0]) {
        setModuleId(modulesData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateCourse() {
    try {
      setError("");

      if (!name.trim()) {
        setError("Informe o nome do curso.");
        return;
      }

      if (!workload.trim()) {
        setError("Informe a carga horária ou duração.");
        return;
      }

      setIsSaving(true);

      const newCourse = await createCourse({
        name: name.trim(),
        moduleId: moduleId || null,
        workload: workload.trim(),
      });

      setCourses((currentCourses) => [newCourse, ...currentCourses]);
      setName("");
      setWorkload("");
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
      const nextStatus = course.status === "ativo" ? "inativo" : "ativo";

      await updateCourseStatus(course.id, nextStatus);

      setCourses((currentCourses) =>
        currentCourses.map((item) =>
          item.id === course.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status."
      );
    }
  }

  async function handleDeleteCourse(courseId: string) {
    try {
      await deleteCourse(courseId);

      setCourses((currentCourses) =>
        currentCourses.filter((course) => course.id !== courseId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o curso."
      );
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Novo curso
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Organize os cursos da plataforma.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Agora os cursos são salvos diretamente no Supabase.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Nome do curso
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
              placeholder="Ex: Telemarketing Profissional"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Módulo principal
            </label>
            <select
              value={moduleId}
              onChange={(event) => setModuleId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {modules.map((moduleItem) => (
                <option key={moduleItem.id} value={moduleItem.id}>
                  {moduleItem.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Carga horária ou duração
            </label>
            <input
              value={workload}
              onChange={(event) => setWorkload(event.target.value)}
              type="text"
              placeholder="Ex: 40 horas"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateCourse}
            disabled={isSaving}
            className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Cadastrar curso"}
          </button>
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Cursos cadastrados
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Grade de cursos
            </h2>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
          >
            Atualizar
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center text-sm font-black text-slate-500">
            Carregando cursos...
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              🎓
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhum curso cadastrado.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Cadastre o primeiro curso para começar a organizar o ambiente.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#08213f]">
                        {course.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          course.status === "ativo"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {course.modules?.name ?? "Sem módulo"} •{" "}
                      {course.workload ?? "Sem carga horária"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(course)}
                      className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      Alterar status
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                    >
                      Remover
                    </button>
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

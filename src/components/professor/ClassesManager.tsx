"use client";

import { useEffect, useState } from "react";
import {
  ClassRow,
  createClass,
  deleteClass,
  getClasses,
  updateClassStatus,
} from "@/services/classes.service";
import { CourseRow, getCourses } from "@/services/courses.service";

const shiftOptions = ["Manhã", "Tarde", "Noite", "Sábado"];

export function ClassesManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [shift, setShift] = useState(shiftOptions[0]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
          : "Não foi possível carregar os dados."
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

      if (!name.trim()) {
        setError("Informe o nome da turma.");
        return;
      }

      if (!courseId) {
        setError("Cadastre ou selecione um curso antes de criar a turma.");
        return;
      }

      setIsSaving(true);

      const newClass = await createClass({
        name: name.trim(),
        courseId,
        shift,
      });

      setClasses((currentClasses) => [newClass, ...currentClasses]);
      setName("");
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
      const nextStatus = classItem.status === "ativa" ? "encerrada" : "ativa";

      await updateClassStatus(classItem.id, nextStatus);

      setClasses((currentClasses) =>
        currentClasses.map((item) =>
          item.id === classItem.id ? { ...item, status: nextStatus } : item
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

  async function handleDeleteClass(classId: string) {
    try {
      await deleteClass(classId);

      setClasses((currentClasses) =>
        currentClasses.filter((classItem) => classItem.id !== classId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível remover a turma."
      );
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Nova turma
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Crie turmas para organizar os alunos.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Agora as turmas são salvas diretamente no Supabase.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Nome da turma
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
              placeholder="Ex: Telemarketing Manhã"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Curso
            </label>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Turno
            </label>
            <select
              value={shift}
              onChange={(event) => setShift(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {shiftOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateClass}
            disabled={isSaving}
            className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Cadastrar turma"}
          </button>
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Turmas cadastradas
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Lista de turmas
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
            Carregando turmas...
          </div>
        ) : classes.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              🏫
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhuma turma criada.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Crie a primeira turma para organizar os alunos.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {classes.map((classItem) => (
              <article
                key={classItem.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#08213f]">
                        {classItem.name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          classItem.status === "ativa"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {classItem.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {classItem.courses?.name ?? "Sem curso"} • {classItem.shift}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(classItem)}
                      className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      Alterar status
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClass(classItem.id)}
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

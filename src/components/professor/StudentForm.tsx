"use client";

import { useEffect, useMemo, useState } from "react";
import { generateStudentAccess } from "@/services/auth.service";
import { ClassRow, getClasses } from "@/services/classes.service";
import { CourseRow, getCourses } from "@/services/courses.service";
import {
  createStudent,
  deleteStudent,
  getStudents,
  resetStudentPassword,
  StudentRow,
  updateStudentStatus,
} from "@/services/students.service";

export function StudentForm() {
  const [fullName, setFullName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [lastPasswordPreview, setLastPasswordPreview] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const preview = useMemo(() => {
    if (fullName.trim().split(/\s+/).length < 2) {
      return null;
    }

    try {
      return generateStudentAccess(fullName);
    } catch {
      return null;
    }
  }, [fullName]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError("");

      const [coursesData, classesData, studentsData] = await Promise.all([
        getCourses(),
        getClasses(),
        getStudents(),
      ]);

      setCourses(coursesData);
      setClasses(classesData);
      setStudents(studentsData);

      if (!courseId && coursesData[0]) {
        setCourseId(coursesData[0].id);
      }

      if (!classId && classesData[0]) {
        setClassId(classesData[0].id);
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

  async function handleSubmit() {
    try {
      setError("");
      setResetMessage("");
      setLastPasswordPreview("");

      if (fullName.trim().split(/\s+/).length < 2) {
        setError("Informe o nome completo do aluno.");
        return;
      }

      if (!courseId) {
        setError("Selecione um curso antes de cadastrar o aluno.");
        return;
      }

      if (!classId) {
        setError("Selecione uma turma antes de cadastrar o aluno.");
        return;
      }

      const access = generateStudentAccess(fullName);

      setIsSaving(true);

      await createStudent({
        fullName: access.fullName.trim(),
        username: access.username,
        password: access.password,
        courseId,
        classId,
      });

      setLastPasswordPreview(access.password);
      setFullName("");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o aluno."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(student: StudentRow) {
    try {
      const nextStatus =
        student.enrollment_status === "ativo" ? "inativo" : "ativo";

      await updateStudentStatus(student.id, nextStatus);

      setStudents((currentStudents) =>
        currentStudents.map((item) =>
          item.id === student.id
            ? { ...item, enrollment_status: nextStatus }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status do aluno."
      );
    }
  }

  async function handleResetPassword(student: StudentRow) {
    try {
      setError("");
      setResetMessage("");

      const result = await resetStudentPassword(student);

      setResetMessage(
        `Senha redefinida. Usuário: ${result.username} • Nova senha: ${result.newPassword}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível redefinir a senha."
      );
    }
  }

  async function handleDeleteStudent(studentId: string) {
    try {
      await deleteStudent(studentId);

      setStudents((currentStudents) =>
        currentStudents.filter((student) => student.id !== studentId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o aluno."
      );
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Novo aluno
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Cadastre e gere o acesso automaticamente.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          O aluno será salvo no Supabase. A senha fica protegida no banco com hash.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Nome completo
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              type="text"
              placeholder="Ex: João da Silva Santos"
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
              Turma
            </label>
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
              {resetMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Cadastrar aluno"}
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[#f4f8fc] p-5">
          <p className="text-sm font-black text-[#08213f]">
            Prévia do acesso
          </p>

          {preview ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  Usuário
                </p>
                <p className="mt-1 text-xl font-black text-blue-700">
                  {preview.username}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  Senha inicial
                </p>
                <p className="mt-1 text-xl font-black text-[#08213f]">
                  {preview.password}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Digite nome e sobrenome para visualizar usuário e senha.
            </p>
          )}

          {lastPasswordPreview && (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-800">
                Última senha gerada: {lastPasswordPreview}
              </p>
            </div>
          )}
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Alunos cadastrados
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Lista da turma
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
            Carregando alunos...
          </div>
        ) : students.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              👥
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhum aluno cadastrado ainda.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Cadastre o primeiro aluno para visualizar as credenciais.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.8fr_1.4fr] bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
              <div>Aluno</div>
              <div>Curso</div>
              <div>Turma</div>
              <div>Usuário</div>
              <div>Ações</div>
            </div>

            <div className="divide-y divide-slate-200">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="grid gap-3 px-5 py-5 text-sm md:grid-cols-[1.2fr_1fr_1fr_0.8fr_1.4fr]"
                >
                  <div>
                    <p className="font-black text-[#08213f]">
                      {student.profiles?.full_name ?? "Aluno sem nome"}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Status: {student.enrollment_status}
                    </p>
                  </div>

                  <div className="font-semibold text-slate-600">
                    {student.courses?.name ?? "Sem curso"}
                  </div>

                  <div className="font-semibold text-slate-600">
                    {student.classes?.name ?? "Sem turma"}
                  </div>

                  <div className="font-black text-blue-700">
                    {student.profiles?.username ?? "--"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetPassword(student)}
                      className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                    >
                      Reset senha
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student)}
                      className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      Status
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(student.id)}
                      className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                    >
                      Remover
                    </button>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { ClassRow, getClasses } from "@/services/classes.service";
import {
  AttendanceStudentRow,
  getStudentsForAttendance,
  saveAttendance,
} from "@/services/attendance.service";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(getTodayDate());
  const [students, setStudents] = useState<AttendanceStudentRow[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = useMemo(() => {
    return classes.find((classItem) => classItem.id === selectedClassId);
  }, [classes, selectedClassId]);

  const presentCount = students.filter((student) => student.is_present).length;
  const absentCount = students.length - presentCount;

  async function loadClasses() {
    try {
      setError("");
      setIsLoadingClasses(true);

      const classesData = await getClasses();
      const activeClasses = classesData.filter(
        (classItem) => classItem.status === "ativa"
      );

      setClasses(activeClasses);

      if (!selectedClassId && activeClasses[0]) {
        setSelectedClassId(activeClasses[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as turmas."
      );
    } finally {
      setIsLoadingClasses(false);
    }
  }

  async function loadStudents(classId = selectedClassId, date = attendanceDate) {
    if (!classId) {
      setStudents([]);
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setIsLoadingStudents(true);

      const studentsData = await getStudentsForAttendance(classId, date);
      setStudents(studentsData);
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

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate]);

  function toggleStudentPresence(studentId: string) {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.student_id === studentId
          ? { ...student, is_present: !student.is_present }
          : student
      )
    );
  }

  function markAllAsPresent() {
    setStudents((currentStudents) =>
      currentStudents.map((student) => ({ ...student, is_present: true }))
    );
  }

  function markAllAsAbsent() {
    setStudents((currentStudents) =>
      currentStudents.map((student) => ({ ...student, is_present: false }))
    );
  }

  async function handleSaveAttendance() {
    try {
      setError("");
      setSuccessMessage("");

      if (!selectedClassId) {
        setError("Selecione uma turma.");
        return;
      }

      setIsSaving(true);

      await saveAttendance({
        classId: selectedClassId,
        attendanceDate,
        students: students.map((student) => ({
          studentId: student.student_id,
          isPresent: student.is_present,
        })),
      });

      setSuccessMessage("Presença salva com sucesso.");
      await loadStudents(selectedClassId, attendanceDate);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a presença."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Chamada
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Marque a presença antes da prática.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Os alunos presentes poderão ser usados depois para sorteio de equipes
          e simulações em grupo.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Data da presença
            </label>
            <input
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
              type="date"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Turma
            </label>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          {isLoadingClasses && (
            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
              Carregando turmas...
            </div>
          )}

          {classes.length === 0 && !isLoadingClasses && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
              Nenhuma turma ativa encontrada. Crie uma turma antes de lançar presença.
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {successMessage}
            </div>
          )}

          <div className="grid gap-3">
            <button
              type="button"
              onClick={markAllAsPresent}
              disabled={students.length === 0}
              className="w-full rounded-full bg-emerald-600 px-7 py-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Marcar todos presentes
            </button>

            <button
              type="button"
              onClick={markAllAsAbsent}
              disabled={students.length === 0}
              className="w-full rounded-full bg-slate-100 px-7 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Marcar todos ausentes
            </button>

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={isSaving || students.length === 0}
              className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar presença"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">
              Presentes
            </p>
            <p className="mt-1 text-3xl font-black text-emerald-800">
              {presentCount}
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 p-4">
            <p className="text-xs font-black uppercase text-red-700">
              Ausentes
            </p>
            <p className="mt-1 text-3xl font-black text-red-800">
              {absentCount}
            </p>
          </div>
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Lista de presença
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              {selectedClass?.name ?? "Selecione uma turma"}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Data: {attendanceDate}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadStudents()}
            disabled={!selectedClassId}
            className="rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Atualizar
          </button>
        </div>

        {isLoadingStudents ? (
          <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center text-sm font-black text-slate-500">
            Carregando alunos...
          </div>
        ) : students.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              ✅
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhum aluno encontrado nesta turma.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Cadastre alunos e vincule-os a esta turma para lançar presença.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {students.map((student) => (
              <article
                key={student.student_id}
                className={`flex flex-col gap-4 rounded-[1.25rem] border p-5 transition md:flex-row md:items-center md:justify-between ${
                  student.is_present
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <p className="text-lg font-black text-[#08213f]">
                    {student.full_name}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Usuário: {student.username}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {student.course_name ?? "Sem curso"} •{" "}
                    {student.class_name ?? "Sem turma"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStudentPresence(student.student_id)}
                  className={`rounded-full px-5 py-3 text-sm font-black transition ${
                    student.is_present
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {student.is_present ? "Presente" : "Ausente"}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </section>
  );
}

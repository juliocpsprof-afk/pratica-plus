"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AttendanceStudentRow,
  getStudentsForAttendance,
  saveAttendance,
} from "@/services/attendance.service";
import { ClassRow, getClasses } from "@/services/classes.service";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "blue" | "green" | "red" | "amber";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "blue" | "green" | "red";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className={`rounded-2xl border border-slate-200 px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  tone = "secondary",
  onClick,
  disabled = false,
}: {
  children: string;
  tone?: "primary" | "secondary" | "danger" | "success";
  onClick: () => void;
  disabled?: boolean;
}) {
  const tones = {
    primary:
      "bg-[#08213f] text-white hover:bg-blue-800 focus:ring-blue-100",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function FormLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-xs font-bold text-slate-600">
      {children}
    </span>
  );
}

export function AttendanceManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(getTodayDate());
  const [students, setStudents] = useState<AttendanceStudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null;

  const presentCount = students.filter((student) => student.is_present).length;
  const absentCount = students.length - presentCount;

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return students;
    }

    return students.filter((student) => {
      const text = `${student.full_name} ${student.username}`.toLowerCase();
      return text.includes(term);
    });
  }, [students, search]);

  async function loadClasses() {
    try {
      setIsLoadingClasses(true);
      setError("");

      const data = await getClasses();

      setClasses(data);

      if (!selectedClassId && data[0]) {
        setSelectedClassId(data[0].id);
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
    try {
      setIsLoadingStudents(true);
      setError("");
      setMessage("");

      if (!classId) {
        setStudents([]);
        return;
      }

      const data = await getStudentsForAttendance(classId, date);

      setStudents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os alunos da turma."
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

  function toggleStudent(studentId: string) {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.student_id === studentId
          ? { ...student, is_present: !student.is_present }
          : student
      )
    );
  }

  function markAllPresent() {
    setStudents((currentStudents) =>
      currentStudents.map((student) => ({
        ...student,
        is_present: true,
      }))
    );
  }

  function markAllAbsent() {
    setStudents((currentStudents) =>
      currentStudents.map((student) => ({
        ...student,
        is_present: false,
      }))
    );
  }

  async function handleSaveAttendance() {
    try {
      setError("");
      setMessage("");

      if (!selectedClassId) {
        setError("Selecione uma turma antes de salvar a presença.");
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

      setMessage("Presença salva com sucesso.");
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
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Chamada
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Controle de presença
              </h2>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {selectedClass ? selectedClass.name : "Selecione uma turma"}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="block">
              <FormLabel>Turma</FormLabel>
              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="app-input"
                disabled={isLoadingClasses}
              >
                {classes.length === 0 ? (
                  <option value="">Nenhuma turma cadastrada</option>
                ) : (
                  classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} • {classItem.courses?.name ?? "Curso não informado"}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block">
              <FormLabel>Data da presença</FormLabel>
              <input
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                type="date"
                className="app-input"
              />
            </label>

            <label className="block">
              <FormLabel>Buscar aluno</FormLabel>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="text"
                placeholder="Nome ou usuário"
                className="app-input"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatCard label="Total" value={students.length} tone="blue" />
            <StatCard label="Presentes" value={presentCount} tone="green" />
            <StatCard label="Ausentes" value={absentCount} tone="red" />
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
            <ActionButton
              onClick={markAllPresent}
              tone="success"
              disabled={students.length === 0}
            >
              Marcar todos presentes
            </ActionButton>

            <ActionButton
              onClick={markAllAbsent}
              tone="secondary"
              disabled={students.length === 0}
            >
              Limpar presença
            </ActionButton>

            <ActionButton
              onClick={handleSaveAttendance}
              tone="primary"
              disabled={isSaving || students.length === 0}
            >
              {isSaving ? "Salvando..." : "Salvar presença"}
            </ActionButton>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Alunos da turma
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Lista de chamada
              </h2>
            </div>

            <ActionButton
              onClick={() => loadStudents(selectedClassId, attendanceDate)}
              tone="secondary"
              disabled={!selectedClassId || isLoadingStudents}
            >
              Atualizar lista
            </ActionButton>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {isLoadingStudents ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando alunos...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">
                Nenhum aluno encontrado.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Verifique a turma selecionada ou ajuste a busca.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <article
                  key={student.student_id}
                  className={`rounded-2xl border p-4 shadow-sm transition ${
                    student.is_present
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#08213f]">
                        {student.full_name}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone="blue">@{student.username}</Badge>

                        <Badge
                          tone={
                            student.enrollment_status === "ativo"
                              ? "green"
                              : "slate"
                          }
                        >
                          {student.enrollment_status}
                        </Badge>

                        <Badge tone={student.is_present ? "green" : "red"}>
                          {student.is_present ? "Presente" : "Ausente"}
                        </Badge>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStudent(student.student_id)}
                      className={`inline-flex min-w-[150px] items-center justify-center rounded-xl px-5 py-3 text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 ${
                        student.is_present
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-100"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200"
                      }`}
                    >
                      {student.is_present ? "Confirmado" : "Marcar presença"}
                    </button>
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

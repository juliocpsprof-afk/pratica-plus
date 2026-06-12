"use client";

import { useEffect, useMemo, useState } from "react";
import { StudentLearningSettings } from "@/components/professor/StudentLearningSettings";
import { generateStudentAccess } from "@/services/auth.service";
import { ClassRow, getClasses } from "@/services/classes.service";
import { CourseRow, getCourses } from "@/services/courses.service";
import {
  createStudent,
  deleteStudent,
  getStudents,
  resetStudentPassword,
  StudentAccessMode,
  StudentRow,
  updateStudentStatus,
} from "@/services/students.service";

const difficultyOptions = [
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
];

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

function ActionButton({
  children,
  tone = "secondary",
  onClick,
}: {
  children: string;
  tone?: "primary" | "secondary" | "warning" | "danger";
  onClick: () => void;
}) {
  const tones = {
    primary:
      "bg-[#08213f] text-white hover:bg-blue-800 focus:ring-blue-100",
    secondary:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    warning:
      "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-100",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-xs font-black shadow-sm transition focus:outline-none focus:ring-4 ${tones[tone]}`}
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

export function StudentForm() {
  const [fullName, setFullName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [simulationAccessMode, setSimulationAccessMode] =
    useState<StudentAccessMode>("livre");
  const [freeAllowedDifficulties, setFreeAllowedDifficulties] = useState<
    string[]
  >(["facil", "medio", "dificil"]);
  const [trailMinScoreToAdvance, setTrailMinScoreToAdvance] = useState(70);
  const [pedagogicalNotes, setPedagogicalNotes] = useState("");
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

  function toggleNewStudentDifficulty(value: string) {
    setFreeAllowedDifficulties((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length === 0 ? current : next;
      }

      return [...current, value];
    });
  }

  function resetForm() {
    setFullName("");
    setSimulationAccessMode("livre");
    setFreeAllowedDifficulties(["facil", "medio", "dificil"]);
    setTrailMinScoreToAdvance(70);
    setPedagogicalNotes("");
  }

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
        simulationAccessMode,
        freeAllowedDifficulties,
        trailMinScoreToAdvance,
        pedagogicalNotes,
      });

      setLastPasswordPreview(access.password);
      resetForm();

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
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Cadastro
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Novo aluno
              </h2>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              Login e senha são gerados automaticamente
            </div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="block md:col-span-2 xl:col-span-1">
                <FormLabel>Nome completo</FormLabel>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  type="text"
                  placeholder="Ex: João da Silva Santos"
                  className="app-input"
                />
              </label>

              <label className="block">
                <FormLabel>Curso</FormLabel>
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
                <FormLabel>Turma</FormLabel>
                <select
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className="app-input"
                >
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-[#08213f]">
                  Forma de acesso
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSimulationAccessMode("livre")}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      simulationAccessMode === "livre"
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#08213f]">
                        Livre
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          simulationAccessMode === "livre"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {simulationAccessMode === "livre" ? "Ativo" : "Selecionar"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Escolhe dificuldade e cenário.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimulationAccessMode("trilha")}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                      simulationAccessMode === "trilha"
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#08213f]">
                        Trilha
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          simulationAccessMode === "trilha"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {simulationAccessMode === "trilha" ? "Ativo" : "Selecionar"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Evolui por desempenho.
                    </p>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {simulationAccessMode === "livre" ? (
                  <>
                    <p className="text-sm font-black text-[#08213f]">
                      Dificuldades liberadas
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {difficultyOptions.map((difficulty) => {
                        const active = freeAllowedDifficulties.includes(
                          difficulty.value
                        );

                        return (
                          <button
                            key={difficulty.value}
                            type="button"
                            onClick={() =>
                              toggleNewStudentDifficulty(difficulty.value)
                            }
                            className={`rounded-xl border px-3 py-3 text-sm font-black shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                              active
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                            }`}
                          >
                            {difficulty.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <label className="block">
                    <FormLabel>Média mínima para avançar</FormLabel>
                    <input
                      value={trailMinScoreToAdvance}
                      onChange={(event) =>
                        setTrailMinScoreToAdvance(Number(event.target.value))
                      }
                      type="number"
                      min={0}
                      max={100}
                      className="app-input"
                    />
                    <p className="mt-2 text-xs leading-5 text-emerald-800">
                      Use 70 como padrão para liberar o próximo nível.
                    </p>
                  </label>
                )}
              </div>
            </div>

            <label className="mt-5 block">
              <FormLabel>Observação pedagógica</FormLabel>
              <textarea
                value={pedagogicalNotes}
                onChange={(event) => setPedagogicalNotes(event.target.value)}
                rows={3}
                placeholder="Ex: reforçar escuta ativa, postura e fechamento."
                className="app-input resize-none"
              />
            </label>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {resetMessage && (
              <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                {resetMessage}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Cadastrando..." : "Cadastrar aluno"}
              </button>
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 md:p-6 xl:border-l xl:border-t-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Prévia de acesso
            </p>

            {preview ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-blue-700">
                    Usuário
                  </p>
                  <p className="mt-1 break-all text-lg font-black text-[#08213f]">
                    {preview.username}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Senha inicial
                  </p>
                  <p className="mt-1 break-all text-lg font-black text-[#08213f]">
                    {preview.password}
                  </p>
                </div>

                <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                  A senha segue o padrão primeiro nome + 123, tudo minúsculo e sem acento.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                <p className="text-sm font-bold leading-6 text-slate-500">
                  Digite nome e sobrenome para gerar usuário e senha.
                </p>
              </div>
            )}

            {lastPasswordPreview && (
              <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                Última senha gerada: {lastPasswordPreview}
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Alunos cadastrados
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Lista de acesso e configurações
              </h2>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Atualizar lista
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando alunos...
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                👥
              </div>

              <h3 className="mt-4 text-lg font-black text-[#08213f]">
                Nenhum aluno cadastrado.
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Use o formulário acima para criar o primeiro acesso.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const isActive = student.enrollment_status === "ativo";
                const isTrail = student.simulation_access_mode === "trilha";

                return (
                  <article
                    key={student.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] xl:items-center">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-[#08213f]">
                          {student.profiles?.full_name ?? "Aluno sem nome"}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge tone="blue">
                            @{student.profiles?.username ?? "--"}
                          </Badge>

                          <Badge tone={isActive ? "green" : "slate"}>
                            {student.enrollment_status}
                          </Badge>

                          <Badge tone={isTrail ? "green" : "blue"}>
                            {isTrail ? "Trilha" : "Livre"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                        <SummaryItem
                          label="Curso"
                          value={student.courses?.name ?? "Sem curso"}
                        />

                        <SummaryItem
                          label="Turma"
                          value={student.classes?.name ?? "Sem turma"}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <StudentLearningSettings
                          student={student}
                          onSaved={loadData}
                        />

                        <ActionButton
                          tone="warning"
                          onClick={() => handleResetPassword(student)}
                        >
                          Reset senha
                        </ActionButton>

                        <ActionButton
                          tone="secondary"
                          onClick={() => handleToggleStatus(student)}
                        >
                          Status
                        </ActionButton>

                        <ActionButton
                          tone="danger"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          Remover
                        </ActionButton>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
                      <SummaryItem
                        label="Dificuldades"
                        value={(student.free_allowed_difficulties ?? []).join(", ")}
                      />

                      <SummaryItem
                        label="Trilha"
                        value={`Nível ${student.trail_current_level} / ${student.trail_unlocked_level}`}
                      />

                      <SummaryItem
                        label="Média"
                        value={student.trail_min_score_to_advance}
                      />
                    </div>

                    {student.pedagogical_notes && (
                      <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-amber-700">
                          Observação pedagógica
                        </p>
                        <p className="mt-1 break-words text-sm leading-6 text-amber-950">
                          {student.pedagogical_notes}
                        </p>
                      </div>
                    )}
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

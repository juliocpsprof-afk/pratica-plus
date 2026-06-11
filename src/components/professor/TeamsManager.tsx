"use client";

import { useEffect, useMemo, useState } from "react";
import { ClassRow, getClasses } from "@/services/classes.service";
import {
  createTeamWithMembers,
  deleteTeam,
  getPresentStudentsByClassAndDate,
  getTeamsByClass,
  PresentStudentRow,
  TeamWithMembers,
} from "@/services/teams.service";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

const roleOptions = ["Recepção", "Vendas", "Suporte", "Supervisor"];

function shuffleArray<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function TeamsManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(getTodayDate());
  const [presentStudents, setPresentStudents] = useState<PresentStudentRow[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [teamName, setTeamName] = useState("");
  const [automaticTeamSize, setAutomaticTeamSize] = useState("4");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = useMemo(() => {
    return classes.find((classItem) => classItem.id === selectedClassId);
  }, [classes, selectedClassId]);

  async function loadClasses() {
    try {
      setError("");
      setIsLoading(true);

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
      setIsLoading(false);
    }
  }

  async function loadPresentStudentsAndTeams(
    classId = selectedClassId,
    date = attendanceDate
  ) {
    if (!classId) {
      setPresentStudents([]);
      setTeams([]);
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const [studentsData, teamsData] = await Promise.all([
        getPresentStudentsByClassAndDate({
          classId,
          attendanceDate: date,
        }),
        getTeamsByClass(classId),
      ]);

      setPresentStudents(studentsData);
      setTeams(teamsData);
      setSelectedStudentIds([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar alunos presentes e equipes."
      );
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadPresentStudentsAndTeams(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate]);

  function toggleSelectedStudent(studentId: string) {
    setSelectedStudentIds((currentIds) =>
      currentIds.includes(studentId)
        ? currentIds.filter((id) => id !== studentId)
        : [...currentIds, studentId]
    );
  }

  async function handleCreateManualTeam() {
    try {
      setError("");
      setSuccessMessage("");

      if (!selectedClassId) {
        setError("Selecione uma turma.");
        return;
      }

      if (!teamName.trim()) {
        setError("Informe o nome da equipe.");
        return;
      }

      if (selectedStudentIds.length === 0) {
        setError("Selecione pelo menos um aluno presente.");
        return;
      }

      setIsSaving(true);

      await createTeamWithMembers({
        classId: selectedClassId,
        name: teamName.trim(),
        creationMode: "manual",
        members: selectedStudentIds.map((studentId, index) => ({
          studentId,
          roleName: roleOptions[index % roleOptions.length],
        })),
      });

      setTeamName("");
      setSelectedStudentIds([]);
      setSuccessMessage("Equipe criada com sucesso.");
      await loadPresentStudentsAndTeams();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar a equipe."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateAutomaticTeams() {
    try {
      setError("");
      setSuccessMessage("");

      if (!selectedClassId) {
        setError("Selecione uma turma.");
        return;
      }

      if (presentStudents.length === 0) {
        setError("Não há alunos presentes para sortear.");
        return;
      }

      const size = Number(automaticTeamSize);

      if (!size || size < 2) {
        setError("O tamanho mínimo da equipe é 2 alunos.");
        return;
      }

      setIsSaving(true);

      const shuffledStudents = shuffleArray(presentStudents);
      const groups: PresentStudentRow[][] = [];

      for (let index = 0; index < shuffledStudents.length; index += size) {
        groups.push(shuffledStudents.slice(index, index + size));
      }

      for (let index = 0; index < groups.length; index++) {
        const group = groups[index];

        await createTeamWithMembers({
          classId: selectedClassId,
          name: `Equipe ${index + 1}`,
          creationMode: "automatico",
          members: group.map((student, memberIndex) => ({
            studentId: student.student_id,
            roleName: roleOptions[memberIndex % roleOptions.length],
          })),
        });
      }

      setSuccessMessage("Equipes sorteadas com sucesso.");
      await loadPresentStudentsAndTeams();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível sortear equipes."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    try {
      setError("");
      setSuccessMessage("");

      await deleteTeam(teamId);
      setSuccessMessage("Equipe removida com sucesso.");
      await loadPresentStudentsAndTeams();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível remover a equipe."
      );
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Formação de equipes
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Monte grupos com alunos presentes.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a presença do dia para criar equipes manuais ou sorteadas para a prática.
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

          {isLoading && (
            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
              Carregando turmas...
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

          <div className="rounded-[1.5rem] bg-[#f4f8fc] p-5">
            <p className="text-sm font-black text-[#08213f]">
              Equipe manual
            </p>

            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              type="text"
              placeholder="Ex: Equipe Alpha"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={handleCreateManualTeam}
              disabled={isSaving}
              className="mt-4 w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Criar equipe manual"}
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-amber-50 p-5">
            <p className="text-sm font-black text-amber-900">
              Sorteio automático
            </p>

            <label className="mt-4 block text-sm font-black text-amber-900">
              Alunos por equipe
            </label>

            <input
              value={automaticTeamSize}
              onChange={(event) => setAutomaticTeamSize(event.target.value)}
              type="number"
              min="2"
              className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-5 py-4 text-sm font-bold outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />

            <button
              type="button"
              onClick={handleCreateAutomaticTeams}
              disabled={isSaving}
              className="mt-4 w-full rounded-full bg-[#f7c600] px-7 py-4 text-sm font-black text-[#08213f] transition hover:bg-[#ffd72e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Sorteando..." : "Sortear equipes"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">
              Presentes
            </p>
            <p className="mt-1 text-3xl font-black text-emerald-800">
              {presentStudents.length}
            </p>
          </div>

          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase text-blue-700">
              Equipes
            </p>
            <p className="mt-1 text-3xl font-black text-blue-800">
              {teams.length}
            </p>
          </div>
        </div>
      </aside>

      <main className="space-y-6">
        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
                Alunos presentes
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#08213f]">
                {selectedClass?.name ?? "Selecione uma turma"}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Selecione alunos para montar uma equipe manual.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadPresentStudentsAndTeams()}
              className="rounded-full bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100"
            >
              Atualizar
            </button>
          </div>

          {presentStudents.length === 0 ? (
            <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
                🧑‍🤝‍🧑
              </div>

              <h3 className="mt-5 text-2xl font-black text-[#08213f]">
                Nenhum aluno presente encontrado.
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Marque presença da turma antes de criar equipes.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {presentStudents.map((student) => {
                const selected = selectedStudentIds.includes(student.student_id);

                return (
                  <button
                    key={student.student_id}
                    type="button"
                    onClick={() => toggleSelectedStudent(student.student_id)}
                    className={`rounded-[1.25rem] border p-5 text-left transition ${
                      selected
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-lg font-black text-[#08213f]">
                      {student.full_name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {student.username}
                    </p>
                    <p className="mt-3 text-xs font-black uppercase text-blue-700">
                      {selected ? "Selecionado" : "Clique para selecionar"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
              Equipes criadas
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#08213f]">
              Grupos da turma
            </h2>
          </div>

          {teams.length === 0 ? (
            <div className="mt-8 rounded-[1.5rem] bg-[#f4f8fc] p-8 text-center">
              <p className="text-sm font-black text-slate-500">
                Nenhuma equipe criada para esta turma.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {teams.map((team) => (
                <article
                  key={team.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-[#08213f]">
                        {team.name}
                      </h3>
                      <p className="mt-1 text-xs font-black uppercase text-slate-400">
                        {team.creation_mode}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <p className="font-black text-[#08213f]">
                          {member.students?.profiles?.full_name ?? "Aluno"}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {member.role_name ?? "Sem função"} •{" "}
                          {member.students?.profiles?.username ?? "--"}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </section>
  );
}

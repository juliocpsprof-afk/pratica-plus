"use client";

import { useEffect, useMemo, useState } from "react";
import { ClassRow, getClasses } from "@/services/classes.service";
import {
  createManualTeam,
  createRandomTeams,
  deleteTeam,
  getPresentStudentsForTeams,
  getTeamsByClass,
  PresentStudentForTeam,
  TeamRow,
} from "@/services/teams.service";

const roles = ["Recepção", "Vendas", "Suporte", "Supervisor"];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}>
      {children}
    </span>
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
    primary: "bg-[#08213f] text-white hover:bg-blue-800 focus:ring-blue-100",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-100",
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
  return <span className="mb-1.5 block text-xs font-bold text-slate-600">{children}</span>;
}

export function TeamsManager() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(getTodayDate());
  const [presentStudents, setPresentStudents] = useState<PresentStudentForTeam[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamSize, setTeamSize] = useState(4);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null;

  const filteredTeams = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return teams;

    return teams.filter((team) => {
      const text = `${team.name} ${team.members.map((item) => item.full_name).join(" ")}`.toLowerCase();
      return text.includes(term);
    });
  }, [teams, search]);

  async function loadInitialData() {
    try {
      setIsLoading(true);
      setError("");

      const classData = await getClasses();
      setClasses(classData);

      const firstClassId = selectedClassId || classData[0]?.id || "";
      setSelectedClassId(firstClassId);

      if (firstClassId) {
        const [presentData, teamsData] = await Promise.all([
          getPresentStudentsForTeams(firstClassId, attendanceDate),
          getTeamsByClass(firstClassId),
        ]);

        setPresentStudents(presentData);
        setTeams(teamsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar equipes.");
    } finally {
      setIsLoading(false);
    }
  }

  async function reloadClassData(classId = selectedClassId, date = attendanceDate) {
    try {
      setError("");
      setMessage("");

      if (!classId) {
        setPresentStudents([]);
        setTeams([]);
        return;
      }

      const [presentData, teamsData] = await Promise.all([
        getPresentStudentsForTeams(classId, date),
        getTeamsByClass(classId),
      ]);

      setPresentStudents(presentData);
      setTeams(teamsData);
      setSelectedStudents([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar os dados.");
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      reloadClassData(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate]);

  function toggleStudent(studentId: string) {
    setSelectedStudents((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  }

  async function handleCreateManualTeam() {
    try {
      setError("");
      setMessage("");

      if (!selectedClassId) {
        setError("Selecione uma turma.");
        return;
      }

      if (!teamName.trim()) {
        setError("Informe o nome da equipe.");
        return;
      }

      if (selectedStudents.length === 0) {
        setError("Selecione pelo menos um aluno.");
        return;
      }

      setIsSaving(true);

      await createManualTeam({
        classId: selectedClassId,
        name: teamName,
        members: selectedStudents.map((studentId, index) => ({
          studentId,
          role: roles[index % roles.length],
        })),
      });

      setTeamName("");
      setSelectedStudents([]);
      setMessage("Equipe criada com sucesso.");
      await reloadClassData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a equipe.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateRandomTeams() {
    try {
      setError("");
      setMessage("");

      if (!selectedClassId) {
        setError("Selecione uma turma.");
        return;
      }

      setIsSaving(true);

      await createRandomTeams({
        classId: selectedClassId,
        attendanceDate,
        teamSize,
      });

      setMessage("Equipes sorteadas com sucesso.");
      await reloadClassData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível sortear as equipes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    try {
      setError("");
      setMessage("");

      await deleteTeam(teamId);

      setMessage("Equipe removida.");
      await reloadClassData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover a equipe.");
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Formação</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">Equipes de prática</h2>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {selectedClass ? selectedClass.name : "Selecione uma turma"}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="block">
              <FormLabel>Turma</FormLabel>
              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="app-input"
              >
                {classes.length === 0 ? (
                  <option value="">Nenhuma turma cadastrada</option>
                ) : (
                  classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} • {item.courses?.name ?? "Curso não informado"}
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
              <FormLabel>Tamanho da equipe</FormLabel>
              <input
                value={teamSize}
                onChange={(event) => setTeamSize(Number(event.target.value))}
                type="number"
                min={2}
                max={8}
                className="app-input"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <label className="block">
              <FormLabel>Nome da equipe manual</FormLabel>
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                type="text"
                placeholder="Ex: Equipe Atendimento 01"
                className="app-input"
              />
            </label>

            <div className="flex items-end gap-3">
              <ActionButton
                onClick={handleCreateManualTeam}
                tone="primary"
                disabled={isSaving || selectedStudents.length === 0}
              >
                Criar equipe
              </ActionButton>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-blue-50 px-4 py-3 text-blue-700">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">Presentes</p>
              <p className="mt-1 text-2xl font-black">{presentStudents.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">Selecionados</p>
              <p className="mt-1 text-2xl font-black">{selectedStudents.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">Equipes criadas</p>
              <p className="mt-1 text-2xl font-black">{teams.length}</p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <ActionButton
              onClick={() => reloadClassData()}
              disabled={!selectedClassId}
            >
              Atualizar
            </ActionButton>

            <ActionButton
              onClick={handleCreateRandomTeams}
              tone="success"
              disabled={isSaving || presentStudents.length === 0}
            >
              Sortear equipes
            </ActionButton>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Alunos presentes</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">Selecionar integrantes</h2>
          </div>

          <div className="p-5 md:p-6">
            {isLoading ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">Carregando...</div>
            ) : presentStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-[#08213f]">Nenhum aluno presente.</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Marque presença antes de criar equipes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presentStudents.map((student) => {
                  const selected = selectedStudents.includes(student.student_id);

                  return (
                    <button
                      key={student.student_id}
                      type="button"
                      onClick={() => toggleStudent(student.student_id)}
                      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-4 ${
                        selected
                          ? "border-blue-600 bg-blue-50 focus:ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-200 focus:ring-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#08213f]">{student.full_name}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">@{student.username}</p>
                        </div>

                        <Badge tone={selected ? "blue" : "slate"}>
                          {selected ? "Selecionado" : "Selecionar"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Equipes criadas</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">Lista de equipes</h2>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar equipe..."
                className="app-input w-full md:w-[260px] px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="p-5 md:p-6">
            {filteredTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-[#08213f]">Nenhuma equipe criada.</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Crie manualmente ou use o sorteio automático.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeams.map((team) => (
                  <article
                    key={team.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-base font-black text-[#08213f]">{team.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{team.class_name}</p>
                      </div>

                      <ActionButton tone="danger" onClick={() => handleDeleteTeam(team.id)}>
                        Remover
                      </ActionButton>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="truncate text-sm font-black text-[#08213f]">{member.full_name}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="blue">@{member.username}</Badge>
                            <Badge tone="green">{member.role ?? "Integrante"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </section>
  );
}

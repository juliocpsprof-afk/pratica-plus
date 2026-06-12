"use client";

import { useEffect, useState } from "react";
import {
  StudentAccessMode,
  StudentRow,
  updateStudentLearningSettings,
} from "@/services/students.service";

type StudentLearningSettingsProps = {
  student: StudentRow;
  onSaved: () => Promise<void> | void;
};

const difficultyItems = [
  {
    value: "facil",
    label: "Fácil",
    helper: "Acolhimento, clareza e triagem inicial.",
  },
  {
    value: "medio",
    label: "Médio",
    helper: "Objeções, escuta ativa e condução.",
  },
  {
    value: "dificil",
    label: "Difícil",
    helper: "Negociação, ética e fechamento.",
  },
];

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-xs font-bold text-slate-600">
      {children}
    </span>
  );
}

export function StudentLearningSettings({
  student,
  onSaved,
}: StudentLearningSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<StudentAccessMode>(
    student.simulation_access_mode ?? "livre"
  );
  const [allowedDifficulties, setAllowedDifficulties] = useState<string[]>(
    student.free_allowed_difficulties?.length
      ? student.free_allowed_difficulties
      : ["facil", "medio", "dificil"]
  );
  const [trailCurrentLevel, setTrailCurrentLevel] = useState(
    student.trail_current_level ?? 1
  );
  const [trailUnlockedLevel, setTrailUnlockedLevel] = useState(
    student.trail_unlocked_level ?? 1
  );
  const [minScore, setMinScore] = useState(
    student.trail_min_score_to_advance ?? 70
  );
  const [notes, setNotes] = useState(student.pedagogical_notes ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openModal() {
    setMode(student.simulation_access_mode ?? "livre");
    setAllowedDifficulties(
      student.free_allowed_difficulties?.length
        ? student.free_allowed_difficulties
        : ["facil", "medio", "dificil"]
    );
    setTrailCurrentLevel(student.trail_current_level ?? 1);
    setTrailUnlockedLevel(student.trail_unlocked_level ?? 1);
    setMinScore(student.trail_min_score_to_advance ?? 70);
    setNotes(student.pedagogical_notes ?? "");
    setError("");
    setIsOpen(true);
  }

  function toggleDifficulty(value: string) {
    setAllowedDifficulties((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length === 0 ? current : next;
      }

      return [...current, value];
    });
  }

  async function handleSave() {
    try {
      setError("");
      setIsSaving(true);

      await updateStudentLearningSettings({
        studentId: student.id,
        simulationAccessMode: mode,
        freeAllowedDifficulties: allowedDifficulties,
        trailCurrentLevel,
        trailUnlockedLevel,
        trailMinScoreToAdvance: minScore,
        pedagogicalNotes: notes,
      });

      await onSaved();
      setIsOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar as configurações."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#08213f] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
      >
        <span>Configurar</span>
        <span className="text-white/70">↗</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="border-b border-slate-200 bg-white px-5 py-4 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                    Configuração do simulador
                  </p>

                  <h2 className="mt-1 truncate text-xl font-black tracking-tight text-[#08213f]">
                    {student.profiles?.full_name ?? "Aluno"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Defina como este aluno acessará as práticas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-xl font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
              <div className="grid gap-5">
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-[#08213f]">
                    Forma de acesso
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Escolha se o aluno terá liberdade para escolher cenários ou seguirá uma trilha progressiva.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode("livre")}
                      className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 ${
                        mode === "livre"
                          ? "border-blue-600 bg-blue-50 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 focus:ring-blue-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-black text-[#08213f]">
                          Modo Livre
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            mode === "livre"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {mode === "livre" ? "Selecionado" : "Escolher"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        O aluno escolhe o cenário e a dificuldade liberada pelo professor.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("trilha")}
                      className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 ${
                        mode === "trilha"
                          ? "border-emerald-600 bg-emerald-50 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 focus:ring-emerald-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-black text-[#08213f]">
                          Modo Trilha
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            mode === "trilha"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {mode === "trilha" ? "Selecionado" : "Escolher"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        O aluno começa por cenários simples e avança conforme desempenho.
                      </p>
                    </button>
                  </div>
                </section>

                {mode === "livre" && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-black text-[#08213f]">
                      Dificuldades liberadas
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Marque quais níveis o aluno pode acessar no modo livre.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {difficultyItems.map((item) => {
                        const active = allowedDifficulties.includes(item.value);

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => toggleDifficulty(item.value)}
                            className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                              active
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-black text-[#08213f]">
                                {item.label}
                              </p>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {active ? "Ativo" : "Off"}
                              </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-600">
                              {item.helper}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {mode === "trilha" && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-black text-[#08213f]">
                      Regras da trilha
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Controle o nível atual, o nível liberado e a nota mínima para avançar.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <label className="block">
                        <FieldLabel>Nível atual</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={trailCurrentLevel}
                          onChange={(event) =>
                            setTrailCurrentLevel(Number(event.target.value))
                          }
                          className="app-input"
                        />
                      </label>

                      <label className="block">
                        <FieldLabel>Nível liberado</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={trailUnlockedLevel}
                          onChange={(event) =>
                            setTrailUnlockedLevel(Number(event.target.value))
                          }
                          className="app-input"
                        />
                      </label>

                      <label className="block">
                        <FieldLabel>Média para avançar</FieldLabel>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={minScore}
                          onChange={(event) =>
                            setMinScore(Number(event.target.value))
                          }
                          className="app-input"
                        />
                      </label>
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="block">
                    <FieldLabel>Observações pedagógicas</FieldLabel>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={4}
                      placeholder="Ex: reforçar escuta ativa, postura, controle de objeções e fechamento."
                      className="app-input resize-none"
                    />
                  </label>
                </section>

                {error && (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Salvando..." : "Salvar configurações"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

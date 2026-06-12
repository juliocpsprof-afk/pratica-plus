"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/session/session.client";
import { getTechnicalFeedback } from "@/lib/feedback/technicalFeedback";
import {
  advanceStudentTrailIfNeeded,
  getAvailableScenariosForStudent,
  getSimulationScenarioDetails,
  getStudentByProfileId,
  saveSimulationResult,
  SimulationAnswerInput,
  SimulationScenario,
  SimulationScenarioDetails,
  StudentByProfile,
} from "@/services/simulation.service";

type StudentSimulationRunnerProps = {
  moduleSlug: "telemarketing" | "vendas";
  moduleTitle: string;
};

type ChatMessage = {
  id: string;
  author: "cliente" | "aluno" | "sistema";
  text: string;
  score?: number;
};

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";
  return value;
}

function difficultyTone(value: string) {
  if (value === "facil") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (value === "medio") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-red-50 text-red-700 ring-red-100";
}

function Badge({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {children}
    </span>
  );
}

export function StudentSimulationRunner({
  moduleSlug,
  moduleTitle,
}: StudentSimulationRunnerProps) {
  const [student, setStudent] = useState<StudentByProfile | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarioDetails, setScenarioDetails] =
    useState<SimulationScenarioDetails | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState("todos");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<SimulationAnswerInput[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [trailAdvanced, setTrailAdvanced] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentStep = scenarioDetails?.steps[currentStepIndex] ?? null;

  const averageScore = useMemo(() => {
    if (answers.length === 0) return 0;
    return Math.round(totalScore / answers.length);
  }, [answers.length, totalScore]);

  async function loadStudentAndScenarios(filter = difficultyFilter) {
    try {
      setIsLoading(true);
      setError("");

      const session = getSession() as any;
      const profileId = session?.profileId ?? session?.id;

      if (!profileId) {
        setError("Sessão do aluno não encontrada. Faça login novamente.");
        return;
      }

      const studentData = await getStudentByProfileId(profileId);

      if (!studentData) {
        setError("Cadastro de aluno não encontrado para este usuário.");
        return;
      }

      const scenariosData = await getAvailableScenariosForStudent(
        moduleSlug,
        studentData,
        filter
      );

      setStudent(studentData);
      setScenarios(scenariosData);

      if (!selectedScenarioId && scenariosData[0]) {
        setSelectedScenarioId(scenariosData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as simulações."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStudentAndScenarios();
  }, []);

  async function handleDifficultyChange(value: string) {
    setDifficultyFilter(value);
    setSelectedScenarioId("");
    setScenarioDetails(null);
    setMessages([]);
    setAnswers([]);
    setTotalScore(0);
    setIsFinished(false);
    await loadStudentAndScenarios(value);
  }

  async function startScenario() {
    try {
      setError("");
      setIsStarting(true);
      setIsFinished(false);
      setTrailAdvanced(false);
      setAnswers([]);
      setTotalScore(0);
      setCurrentStepIndex(0);

      if (!selectedScenarioId) {
        setError("Escolha um cenário para iniciar.");
        return;
      }

      const details = await getSimulationScenarioDetails(selectedScenarioId);

      if (details.steps.length === 0) {
        setError("Este cenário ainda não possui etapas cadastradas.");
        return;
      }

      setScenarioDetails(details);

      setMessages([
        {
          id: `cliente-${details.steps[0].id}`,
          author: "cliente",
          text: details.steps[0].customer_message,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a simulação."
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSelectOption(optionId: string) {
    if (!scenarioDetails || !currentStep || !student || isSaving) {
      return;
    }

    const selectedOption = currentStep.options.find((option) => option.id === optionId);

    if (!selectedOption) {
      return;
    }

    const technicalFeedback = getTechnicalFeedback({
      moduleSlug,
      score: selectedOption.score,
      technicalFocus: scenarioDetails.technical_focus,
      learningObjective: scenarioDetails.learning_objective,
      sourceLesson: scenarioDetails.source_lesson,
    });

    const finalFeedback = selectedOption.feedback
      ? `${selectedOption.feedback}\n\n${technicalFeedback}`
      : technicalFeedback;

    const nextAnswer: SimulationAnswerInput = {
      stepId: currentStep.id,
      optionId: selectedOption.id,
      score: selectedOption.score,
      feedback: finalFeedback,
    };

    const nextAnswers = [...answers, nextAnswer];
    const nextTotalScore = totalScore + selectedOption.score;

    setAnswers(nextAnswers);
    setTotalScore(nextTotalScore);

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `aluno-${selectedOption.id}`,
        author: "aluno",
        text: selectedOption.option_text,
      },
      {
        id: `sistema-${selectedOption.id}`,
        author: "sistema",
        text: finalFeedback,
        score: selectedOption.score,
      },
    ]);

    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex < scenarioDetails.steps.length) {
      const nextStep = scenarioDetails.steps[nextStepIndex];

      setCurrentStepIndex(nextStepIndex);

      setTimeout(() => {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `cliente-${nextStep.id}`,
            author: "cliente",
            text: nextStep.customer_message,
          },
        ]);
      }, 450);

      return;
    }

    try {
      setIsSaving(true);

      const finalAverage = Math.round(nextTotalScore / nextAnswers.length);

      await saveSimulationResult({
        scenarioId: scenarioDetails.id,
        studentId: student.id,
        classId: student.class_id,
        moduleSlug,
        mode: "individual",
        totalScore: finalAverage,
        answers: nextAnswers,
      });

      const advanced = await advanceStudentTrailIfNeeded(student, finalAverage);

      setTrailAdvanced(advanced);
      setIsFinished(true);

      await loadStudentAndScenarios(difficultyFilter);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o resultado."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function restart() {
    setScenarioDetails(null);
    setMessages([]);
    setAnswers([]);
    setTotalScore(0);
    setCurrentStepIndex(0);
    setIsFinished(false);
    setTrailAdvanced(false);
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Simulador individual
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                {moduleTitle}
              </h2>
            </div>

            {student && (
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">
                  {student.simulation_access_mode === "trilha" ? "Modo Trilha" : "Modo Livre"}
                </Badge>

                {student.simulation_access_mode === "trilha" && (
                  <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-100">
                    Nível liberado {student.trail_unlocked_level}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 md:p-6">
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando simulações...
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
              {student?.simulation_access_mode === "livre" ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    Dificuldade
                  </span>
                  <select
                    value={difficultyFilter}
                    onChange={(event) => handleDifficultyChange(event.target.value)}
                    className="app-input"
                    disabled={Boolean(scenarioDetails)}
                  >
                    <option value="todos">Todas liberadas</option>
                    {(student.free_allowed_difficulties ?? []).map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficultyLabel(difficulty)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-emerald-700">
                    Trilha
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-900">
                    Nível {student?.trail_unlocked_level ?? 1} liberado
                  </p>
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Cenário
                </span>
                <select
                  value={selectedScenarioId}
                  onChange={(event) => setSelectedScenarioId(event.target.value)}
                  className="app-input"
                  disabled={Boolean(scenarioDetails)}
                >
                  {scenarios.length === 0 ? (
                    <option value="">Nenhum cenário disponível</option>
                  ) : (
                    scenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.title}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <div className="flex items-end gap-3">
                {!scenarioDetails ? (
                  <button
                    type="button"
                    onClick={startScenario}
                    disabled={isStarting || scenarios.length === 0}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isStarting ? "Iniciando..." : "Iniciar prática"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    Escolher outro
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {scenarioDetails && (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4 md:px-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black text-[#08213f]">
                    {scenarioDetails.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {scenarioDetails.description || "Prática profissional orientada."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={difficultyTone(scenarioDetails.difficulty)}>
                    {difficultyLabel(scenarioDetails.difficulty)}
                  </Badge>

                  <Badge className="bg-slate-100 text-slate-700 ring-slate-200">
                    Etapa {Math.min(currentStepIndex + 1, scenarioDetails.steps.length)} de {scenarioDetails.steps.length}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="h-[520px] overflow-y-auto bg-slate-50 p-5 md:p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.author === "aluno" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.author === "cliente"
                          ? "bg-white text-slate-800 ring-1 ring-slate-200"
                          : message.author === "aluno"
                            ? "bg-[#08213f] text-white"
                            : "bg-blue-50 text-blue-950 ring-1 ring-blue-100"
                      }`}
                    >
                      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.1em] opacity-70">
                        {message.author === "cliente"
                          ? scenarioDetails.customer_name || "Cliente"
                          : message.author === "aluno"
                            ? "Sua resposta"
                            : "Feedback técnico"}
                      </p>

                      <p className="whitespace-pre-line text-sm leading-6">
                        {message.text}
                      </p>

                      {typeof message.score === "number" && (
                        <p className="mt-2 text-xs font-black">
                          Pontuação da resposta: {message.score}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!isFinished && currentStep && (
              <div className="border-t border-slate-200 bg-white p-5 md:p-6">
                <p className="mb-4 text-sm font-black text-[#08213f]">
                  Escolha sua resposta:
                </p>

                <div className="grid gap-3">
                  {currentStep.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(option.id)}
                      disabled={isSaving}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold leading-6 text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {option.option_text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isFinished && (
              <div className="border-t border-slate-200 bg-white p-5 md:p-6">
                <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
                  <p className="text-lg font-black text-emerald-900">
                    Simulação finalizada
                  </p>

                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Sua média foi <strong>{averageScore}</strong> pontos.
                  </p>

                  {trailAdvanced && (
                    <p className="mt-2 text-sm font-bold text-emerald-800">
                      Parabéns. Você liberou o próximo nível da trilha.
                    </p>
                  )}

                  {!trailAdvanced && student?.simulation_access_mode === "trilha" && (
                    <p className="mt-2 text-sm font-bold text-emerald-800">
                      Continue praticando para avançar na trilha.
                    </p>
                  )}
                </div>
              </div>
            )}
          </main>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Resumo técnico
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Cliente
                  </p>
                  <p className="mt-1 text-sm font-black text-[#08213f]">
                    {scenarioDetails.customer_name || "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Perfil
                  </p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#08213f]">
                    {scenarioDetails.customer_profile || "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Foco técnico
                  </p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#08213f]">
                    {scenarioDetails.technical_focus || "Atendimento profissional"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                    Média atual
                  </p>
                  <p className="mt-1 text-2xl font-black text-[#08213f]">
                    {averageScore}
                  </p>
                </div>
              </div>
            </section>

            {student?.pedagogical_notes && (
              <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                  Orientação do professor
                </p>

                <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">
                  {student.pedagogical_notes}
                </p>
              </section>
            )}
          </aside>
        </section>
      )}
    </section>
  );
}

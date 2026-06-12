"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "@/lib/session/session.client";
import { getTechnicalFeedback } from "@/lib/feedback/technicalFeedback";
import {
  getAvailableScenariosForStudent,
  getSimulationScenarioDetails,
  getStudentByProfileId,
  getStudentTeams,
  saveSimulationResult,
  SimulationAnswerInput,
  SimulationScenario,
  SimulationScenarioDetails,
  StudentByProfile,
  StudentTeam,
} from "@/services/simulation.service";

type ChatMessage = {
  id: string;
  author: "cliente" | "equipe" | "sistema";
  text: string;
  score?: number;
};

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";
  return value;
}

function difficultyClass(value: string) {
  if (value === "facil") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (value === "medio") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-red-50 text-red-700 ring-red-100";
}

function Badge({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "blue" | "green";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function MessageBubble({
  message,
  customerName,
  teamName,
}: {
  message: ChatMessage;
  customerName: string;
  teamName: string;
}) {
  if (message.author === "sistema") {
    return (
      <div className="mx-auto max-w-[88%] rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-950">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-blue-700">
            Feedback técnico
          </p>

          {typeof message.score === "number" && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-100">
              {message.score} pts
            </span>
          )}
        </div>

        <p className="whitespace-pre-line text-sm leading-6">
          {message.text}
        </p>
      </div>
    );
  }

  const isTeam = message.author === "equipe";

  return (
    <div className={`flex ${isTeam ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] ${isTeam ? "text-right" : "text-left"}`}>
        <p className={`mb-1 px-1 text-[11px] font-black uppercase tracking-[0.1em] ${
          isTeam ? "text-blue-700" : "text-slate-500"
        }`}>
          {isTeam ? teamName : customerName}
        </p>

        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isTeam
              ? "rounded-br-md bg-[#08213f] text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          }`}
        >
          <p className="whitespace-pre-line text-sm leading-6">
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TeamSimulationRunner() {
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  const [student, setStudent] = useState<StudentByProfile | null>(null);
  const [teams, setTeams] = useState<StudentTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [moduleSlug, setModuleSlug] = useState<"telemarketing" | "vendas">(
    "telemarketing"
  );
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarioDetails, setScenarioDetails] =
    useState<SimulationScenarioDetails | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<SimulationAnswerInput[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTeam =
    teams.find((team) => team.id === selectedTeamId) ?? null;

  const currentStep = scenarioDetails?.steps[currentStepIndex] ?? null;

  const averageScore = useMemo(() => {
    if (answers.length === 0) return 0;
    return Math.round(totalScore / answers.length);
  }, [answers.length, totalScore]);

  function scrollChatToBottom() {
    const box = chatBoxRef.current;

    if (!box) {
      return;
    }

    box.scrollTop = box.scrollHeight;
  }

  useEffect(() => {
    const timer = window.setTimeout(scrollChatToBottom, 80);

    return () => window.clearTimeout(timer);
  }, [messages, isFinished]);

  async function loadBaseData(currentModule = moduleSlug) {
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

      const [teamsData, scenariosData] = await Promise.all([
        getStudentTeams(studentData.id),
        getAvailableScenariosForStudent(currentModule, studentData, "todos"),
      ]);

      setStudent(studentData);
      setTeams(teamsData);
      setScenarios(scenariosData);

      if (!selectedTeamId && teamsData[0]) {
        setSelectedTeamId(teamsData[0].id);
      }

      if (!selectedScenarioId && scenariosData[0]) {
        setSelectedScenarioId(scenariosData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar a simulação em equipe."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBaseData();
  }, []);

  async function handleModuleChange(value: "telemarketing" | "vendas") {
    setModuleSlug(value);
    setSelectedScenarioId("");
    setScenarioDetails(null);
    setMessages([]);
    setAnswers([]);
    setTotalScore(0);
    setIsFinished(false);
    await loadBaseData(value);
  }

  async function startScenario() {
    try {
      setError("");
      setIsStarting(true);
      setIsFinished(false);
      setAnswers([]);
      setTotalScore(0);
      setCurrentStepIndex(0);

      if (!selectedTeamId) {
        setError("Selecione uma equipe para iniciar.");
        return;
      }

      if (!selectedScenarioId) {
        setError("Selecione um cenário para iniciar.");
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
    if (!scenarioDetails || !currentStep || !student || !selectedTeam || isSaving || isFinished) {
      return;
    }

    const selectedOption = currentStep.options.find(
      (option) => option.id === optionId
    );

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
        id: `equipe-${selectedOption.id}`,
        author: "equipe",
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

      window.setTimeout(() => {
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
        classId: selectedTeam.class_id ?? student.class_id,
        teamId: selectedTeam.id,
        moduleSlug,
        mode: "equipe",
        totalScore: finalAverage,
        answers: nextAnswers,
      });

      setIsFinished(true);
      await loadBaseData(moduleSlug);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o resultado da equipe."
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
  }

  const customerName = scenarioDetails?.customer_name || "Cliente";
  const teamName = selectedTeam?.name || "Equipe";

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Simulação em equipe
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Atendimento colaborativo
              </h2>
            </div>

            {selectedTeam && (
              <div className="flex flex-wrap gap-2">
                <Badge tone="blue">{selectedTeam.name}</Badge>
                {selectedTeam.role && <Badge tone="green">{selectedTeam.role}</Badge>}
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Carregando dados da equipe...
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_180px]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Equipe
                </span>
                <select
                  value={selectedTeamId}
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                  className="app-input px-4 py-2.5 text-sm"
                  disabled={Boolean(scenarioDetails)}
                >
                  {teams.length === 0 ? (
                    <option value="">Nenhuma equipe encontrada</option>
                  ) : (
                    teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} • {team.class_name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Módulo
                </span>
                <select
                  value={moduleSlug}
                  onChange={(event) =>
                    handleModuleChange(event.target.value as "telemarketing" | "vendas")
                  }
                  className="app-input px-4 py-2.5 text-sm"
                  disabled={Boolean(scenarioDetails)}
                >
                  <option value="telemarketing">Telemarketing</option>
                  <option value="vendas">Vendas</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  Cenário
                </span>
                <select
                  value={selectedScenarioId}
                  onChange={(event) => setSelectedScenarioId(event.target.value)}
                  className="app-input px-4 py-2.5 text-sm"
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

              <div className="flex items-end">
                {!scenarioDetails ? (
                  <button
                    type="button"
                    onClick={startScenario}
                    disabled={isStarting || teams.length === 0 || scenarios.length === 0}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#08213f] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isStarting ? "Iniciando..." : "Iniciar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                  >
                    Trocar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {scenarioDetails && (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#08213f] px-5 py-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {customerName}
                </p>
                <p className="truncate text-xs font-semibold text-blue-100">
                  Atendimento com {teamName}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${difficultyClass(scenarioDetails.difficulty)}`}>
                  {difficultyLabel(scenarioDetails.difficulty)}
                </span>

                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">
                  {Math.min(currentStepIndex + 1, scenarioDetails.steps.length)}/{scenarioDetails.steps.length}
                </span>
              </div>
            </header>

            <div
              ref={chatBoxRef}
              className="h-[430px] overflow-y-auto bg-slate-100 px-5 py-4"
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    customerName={customerName}
                    teamName={teamName}
                  />
                ))}

                {isSaving && (
                  <div className="mx-auto w-fit rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-sm ring-1 ring-slate-200">
                    Salvando...
                  </div>
                )}
              </div>
            </div>

            {isFinished && (
              <div className="border-t border-slate-200 bg-white p-4">
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
                  <p className="text-sm font-black text-emerald-900">
                    Atendimento finalizado. Média: {averageScore}
                  </p>
                </div>
              </div>
            )}
          </main>

          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Respostas rápidas
              </p>
              <h3 className="mt-1 text-base font-black text-[#08213f]">
                Decisão da equipe
              </h3>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4">
              {!isFinished && currentStep ? (
                <div className="space-y-3">
                  {currentStep.options.map((option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(option.id)}
                      disabled={isSaving}
                      className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600 group-hover:bg-blue-600 group-hover:text-white">
                          {index + 1}
                        </span>

                        <span className="text-sm font-semibold leading-6 text-slate-700">
                          {option.option_text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-center">
                  <p className="text-sm font-bold leading-6 text-slate-600">
                    A prática foi concluída. Use “Trocar” para escolher outro cenário.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Média
                  </p>
                  <p className="mt-1 text-xl font-black text-[#08213f]">
                    {averageScore}
                  </p>
                </div>

                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Etapa
                  </p>
                  <p className="mt-1 text-xl font-black text-[#08213f]">
                    {Math.min(currentStepIndex + 1, scenarioDetails.steps.length)}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      )}
    </section>
  );
}

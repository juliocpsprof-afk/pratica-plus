"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getScenarioDetails,
  getScenarios,
  ScenarioDetails,
  ScenarioOptionRow,
  ScenarioRow,
} from "@/services/scenarios.service";

type PreviewMessage = {
  id: string;
  author: "cliente" | "professor" | "sistema";
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
  children: ReactNode;
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

function PreviewMessageBubble({
  message,
  customerName,
}: {
  message: PreviewMessage;
  customerName: string;
}) {
  if (message.author === "sistema") {
    return (
      <div className="mx-auto max-w-[88%] rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-950">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-blue-700">
            Feedback da opção
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

  const isProfessor = message.author === "professor";

  return (
    <div className={`flex ${isProfessor ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] ${isProfessor ? "text-right" : "text-left"}`}>
        <p className={`mb-1 px-1 text-[11px] font-black uppercase tracking-[0.1em] ${
          isProfessor ? "text-blue-700" : "text-slate-500"
        }`}>
          {isProfessor ? "Resposta escolhida" : customerName}
        </p>

        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isProfessor
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

export function ScenarioPreviewManager() {
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarioDetails, setScenarioDetails] = useState<ScenarioDetails | null>(null);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [answersCount, setAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("todos");
  const [difficultyFilter, setDifficultyFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const currentStep = scenarioDetails?.steps[currentStepIndex] ?? null;

  const averageScore = useMemo(() => {
    if (answersCount === 0) return 0;
    return Math.round(totalScore / answersCount);
  }, [answersCount, totalScore]);

  const filteredScenarios = useMemo(() => {
    const term = search.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      const matchesSearch =
        !term ||
        `${scenario.title} ${scenario.customer_name} ${scenario.customer_profile} ${scenario.modules?.name ?? ""}`
          .toLowerCase()
          .includes(term);

      const matchesModule =
        moduleFilter === "todos" || scenario.module_id === moduleFilter;

      const matchesDifficulty =
        difficultyFilter === "todos" || scenario.difficulty === difficultyFilter;

      return matchesSearch && matchesModule && matchesDifficulty;
    });
  }, [scenarios, search, moduleFilter, difficultyFilter]);

  const modules = useMemo(() => {
    const map = new Map<string, string>();

    scenarios.forEach((scenario) => {
      if (scenario.modules?.id && scenario.modules?.name) {
        map.set(scenario.modules.id, scenario.modules.name);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [scenarios]);

  function scrollChatToBottom() {
    const box = chatBoxRef.current;

    if (!box) return;

    box.scrollTop = box.scrollHeight;
  }

  useEffect(() => {
    const timer = window.setTimeout(scrollChatToBottom, 80);

    return () => window.clearTimeout(timer);
  }, [messages, isFinished]);

  async function loadScenarios() {
    try {
      setIsLoadingScenarios(true);
      setError("");

      const data = await getScenarios();

      setScenarios(data);

      if (!selectedScenarioId && data[0]) {
        setSelectedScenarioId(data[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os cenários."
      );
    } finally {
      setIsLoadingScenarios(false);
    }
  }

  useEffect(() => {
    loadScenarios();
  }, []);

  async function startPreview() {
    try {
      setIsLoadingPreview(true);
      setError("");
      setMessages([]);
      setCurrentStepIndex(0);
      setTotalScore(0);
      setAnswersCount(0);
      setIsFinished(false);

      if (!selectedScenarioId) {
        setError("Selecione um cenário para pré-visualizar.");
        return;
      }

      const details = await getScenarioDetails(selectedScenarioId);

      if (details.steps.length === 0) {
        setScenarioDetails(details);
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
          : "Não foi possível abrir a pré-visualização."
      );
    } finally {
      setIsLoadingPreview(false);
    }
  }

  function resetPreview() {
    setScenarioDetails(null);
    setMessages([]);
    setCurrentStepIndex(0);
    setTotalScore(0);
    setAnswersCount(0);
    setIsFinished(false);
    setError("");
  }

  function chooseOption(option: ScenarioOptionRow) {
    if (!scenarioDetails || !currentStep || isFinished) {
      return;
    }

    const feedback = option.feedback?.trim()
      ? option.feedback
      : option.is_best_option
        ? "Esta foi marcada como a melhor opção para esta etapa."
        : "Esta é uma opção alternativa. Revise se ela está alinhada ao objetivo pedagógico.";

    const nextTotalScore = totalScore + Number(option.score ?? 0);
    const nextAnswersCount = answersCount + 1;
    const nextStepIndex = currentStepIndex + 1;

    setTotalScore(nextTotalScore);
    setAnswersCount(nextAnswersCount);

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `professor-${option.id}`,
        author: "professor",
        text: option.option_text,
      },
      {
        id: `sistema-${option.id}`,
        author: "sistema",
        text: feedback,
        score: Number(option.score ?? 0),
      },
    ]);

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
      }, 350);

      return;
    }

    setIsFinished(true);
  }

  const customerName = scenarioDetails?.customer_name || "Cliente";

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Teste do professor
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">
                Pré-visualizar cenário
              </h2>
            </div>

            {scenarioDetails && (
              <div className="flex flex-wrap gap-2">
                <Badge tone={scenarioDetails.is_active ? "green" : "red"}>
                  {scenarioDetails.is_active ? "Ativo" : "Inativo"}
                </Badge>
                <Badge tone={difficultyLabel(scenarioDetails.difficulty) === "Fácil" ? "green" : difficultyLabel(scenarioDetails.difficulty) === "Médio" ? "amber" : "red"}>
                  {difficultyLabel(scenarioDetails.difficulty)}
                </Badge>
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_180px_180px]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Cenário
              </span>
              <select
                value={selectedScenarioId}
                onChange={(event) => {
                  setSelectedScenarioId(event.target.value);
                  resetPreview();
                }}
                className="app-input"
                disabled={isLoadingScenarios}
              >
                {isLoadingScenarios ? (
                  <option value="">Carregando...</option>
                ) : filteredScenarios.length === 0 ? (
                  <option value="">Nenhum cenário encontrado</option>
                ) : (
                  filteredScenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title}
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
                value={moduleFilter}
                onChange={(event) => {
                  setModuleFilter(event.target.value);
                  resetPreview();
                }}
                className="app-input"
              >
                <option value="todos">Todos</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Dificuldade
              </span>
              <select
                value={difficultyFilter}
                onChange={(event) => {
                  setDifficultyFilter(event.target.value);
                  resetPreview();
                }}
                className="app-input"
              >
                <option value="todos">Todas</option>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </label>

            <div className="flex items-end">
              {!scenarioDetails ? (
                <button
                  type="button"
                  onClick={startPreview}
                  disabled={isLoadingPreview || !selectedScenarioId}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#08213f] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingPreview ? "Abrindo..." : "Pré-visualizar"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetPreview}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  Trocar cenário
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPreview();
              }}
              placeholder="Buscar cenário por título, cliente, perfil ou módulo..."
              className="app-input px-4 py-2.5 text-sm"
            />
          </div>
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
                  {scenarioDetails.customer_profile || scenarioDetails.title}
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
                  <PreviewMessageBubble
                    key={message.id}
                    message={message}
                    customerName={customerName}
                  />
                ))}

                {isFinished && (
                  <div className="mx-auto max-w-[88%] rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100">
                    <p className="text-sm font-black text-emerald-900">
                      Pré-visualização finalizada. Média simulada: {averageScore}
                    </p>
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      Este resultado não foi salvo no histórico de nenhum aluno.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>

          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Opções da etapa
              </p>
              <h3 className="mt-1 text-base font-black text-[#08213f]">
                Testar resposta
              </h3>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4">
              {!isFinished && currentStep ? (
                <div className="space-y-3">
                  {currentStep.options.map((option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => chooseOption(option)}
                      className={`group w-full rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-4 ${
                        option.is_best_option
                          ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300 focus:ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 focus:ring-blue-100"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                          option.is_best_option
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white"
                        }`}>
                          {index + 1}
                        </span>

                        <span className="text-sm font-semibold leading-6 text-slate-700">
                          {option.option_text}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 pl-10">
                        <Badge tone="blue">{Number(option.score ?? 0)} pontos</Badge>
                        {option.is_best_option && (
                          <Badge tone="green">Melhor opção</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-center">
                  <p className="text-sm font-bold leading-6 text-slate-600">
                    Pré-visualização concluída. Use “Trocar cenário” para testar outro.
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


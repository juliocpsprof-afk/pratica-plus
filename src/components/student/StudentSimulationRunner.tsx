"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "@/lib/session/session.client";
import {
  getActiveScenariosByModuleSlug,
  getSimulationScenarioDetails,
  getStudentByProfileId,
  saveSimulationResult,
  SimulationOption,
  SimulationScenario,
  SimulationScenarioDetails,
  StudentByProfile,
} from "@/services/simulation.service";
import { TypingDots } from "@/components/student/TypingDots";

type StudentSimulationRunnerProps = {
  moduleSlug: "telemarketing" | "vendas";
};

type ChatMessage = {
  id: string;
  sender: "system" | "customer" | "student" | "feedback";
  text: string;
  time: string;
  score?: number;
  isBest?: boolean;
};

function getCurrentTime() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function StudentSimulationRunner({
  moduleSlug,
}: StudentSimulationRunnerProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [student, setStudent] = useState<StudentByProfile | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [scenarioDetails, setScenarioDetails] =
    useState<SimulationScenarioDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedOption, setSelectedOption] = useState<SimulationOption | null>(
    null
  );
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [isFeedbackTyping, setIsFeedbackTyping] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const moduleLabel =
    moduleSlug === "telemarketing" ? "Telemarketing" : "Técnicas de Vendas";

  const visual = useMemo(() => {
    if (moduleSlug === "telemarketing") {
      return {
        badge: "Atendimento",
        customerAvatar: "C",
        agentLabel: "Atendente",
        status: "Cliente em atendimento",
        headerGradient: "from-emerald-600 to-blue-700",
      };
    }

    return {
      badge: "Comercial",
      customerAvatar: "V",
      agentLabel: "Consultor",
      status: "Cliente negociando",
      headerGradient: "from-blue-700 to-[#08213f]",
    };
  }, [moduleSlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCustomerTyping, isFeedbackTyping]);

  async function loadInitialData() {
    try {
      setError("");
      setIsLoading(true);

      const session = getSession();

      if (!session) {
        setError("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const [studentData, scenariosData] = await Promise.all([
        getStudentByProfileId(session.profileId),
        getActiveScenariosByModuleSlug(moduleSlug),
      ]);

      setStudent(studentData);
      setScenarios(scenariosData);

      if (scenariosData[0]) {
        setSelectedScenarioId(scenariosData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o simulador."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function startChat(details: SimulationScenarioDetails | null) {
    setMessages([]);
    setSelectedOption(null);
    setSuccessMessage("");

    if (!details) {
      return;
    }

    const introMessage =
      moduleSlug === "telemarketing"
        ? "Nova chamada recebida. Atenda o cliente com atenção e escolha a melhor resposta."
        : "Novo atendimento comercial iniciado. Conduza a conversa com postura profissional.";

    setMessages([
      {
        id: crypto.randomUUID(),
        sender: "system",
        text: introMessage,
        time: getCurrentTime(),
      },
    ]);

    await wait(700);
    setIsCustomerTyping(true);

    await wait(1200);
    setIsCustomerTyping(false);

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        sender: "customer",
        text: details.step?.customer_message ?? "Olá, preciso de ajuda.",
        time: getCurrentTime(),
      },
    ]);
  }

  async function loadScenarioDetails(scenarioId: string) {
    try {
      setError("");
      setSuccessMessage("");
      setSelectedOption(null);

      if (!scenarioId) {
        setScenarioDetails(null);
        setMessages([]);
        return;
      }

      const details = await getSimulationScenarioDetails(scenarioId);
      setScenarioDetails(details);
      await startChat(details);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar o cenário."
      );
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedScenarioId) {
      loadScenarioDetails(selectedScenarioId);
    }
  }, [selectedScenarioId]);

  async function handleChooseOption(option: SimulationOption) {
    try {
      setError("");
      setSuccessMessage("");
      setSelectedOption(option);

      if (!student) {
        setError("Aluno não encontrado para esta sessão.");
        return;
      }

      if (!scenarioDetails?.step) {
        setError("O cenário não possui etapa válida.");
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: "student",
          text: option.option_text,
          time: getCurrentTime(),
        },
      ]);

      setIsSaving(true);

      await saveSimulationResult({
        scenarioId: scenarioDetails.id,
        studentId: student.id,
        classId: student.class_id,
        mode: "individual",
        stepId: scenarioDetails.step.id,
        optionId: option.id,
        score: option.score,
        moduleSlug,
      });

      await wait(700);
      setIsFeedbackTyping(true);

      await wait(1100);
      setIsFeedbackTyping(false);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: "feedback",
          text:
            option.feedback ??
            "Resposta registrada. Continue treinando para melhorar sua condução.",
          time: getCurrentTime(),
          score: option.score,
          isBest: option.is_best_option,
        },
      ]);

      setSuccessMessage("Simulação salva no histórico e nas competências.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a simulação."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function restartScenario() {
    if (scenarioDetails) {
      startChat(scenarioDetails);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Simulador
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Atendimento em formato de conversa.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          A interação agora aparece como um chat real, com cliente digitando e respostas em bolhas.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Módulo
            </label>

            <div className="rounded-2xl bg-[#f4f8fc] px-5 py-4 text-sm font-black text-[#08213f]">
              {moduleLabel}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Cenário
            </label>
            <select
              value={selectedScenarioId}
              onChange={(event) => setSelectedScenarioId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>
          </div>

          {scenarioDetails && (
            <div className="rounded-[1.5rem] bg-[#f4f8fc] p-5">
              <p className="text-xs font-black uppercase text-slate-400">
                Cliente
              </p>
              <h3 className="mt-2 text-xl font-black text-[#08213f]">
                {scenarioDetails.customer_name ?? "Cliente"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {scenarioDetails.customer_profile ?? "Sem perfil informado."}
              </p>
              <span className="mt-4 inline-flex rounded-full bg-white px-3 py-2 text-xs font-black text-blue-700">
                Dificuldade: {scenarioDetails.difficulty}
              </span>
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
              Carregando simulador...
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

          <button
            type="button"
            onClick={restartScenario}
            disabled={!scenarioDetails}
            className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reiniciar conversa
          </button>
        </div>
      </aside>

      <main className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200">
        <header className={`bg-gradient-to-r ${visual.headerGradient} px-5 py-4 text-white`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-black ring-2 ring-white/30">
              {visual.customerAvatar}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black">
                {scenarioDetails?.customer_name ?? "Cliente"}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {isCustomerTyping ? "digitando..." : visual.status}
              </div>
            </div>

            <div className="hidden rounded-full bg-white/15 px-4 py-2 text-xs font-black md:block">
              {visual.badge}
            </div>
          </div>
        </header>

        <section className="min-h-[620px] bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_28%),linear-gradient(180deg,#f8fafc,#eef4f8)]">
          <div className="mx-auto flex min-h-[620px] max-w-4xl flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
              {messages.map((message) => {
                if (message.sender === "system") {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div className="max-w-md rounded-full bg-white/80 px-4 py-2 text-center text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                        {message.text}
                      </div>
                    </div>
                  );
                }

                if (message.sender === "student") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[78%] rounded-3xl rounded-br-md bg-[#dcf8c6] px-5 py-4 shadow-sm">
                        <p className="text-sm font-bold leading-6 text-[#123524]">
                          {message.text}
                        </p>
                        <p className="mt-2 text-right text-[11px] font-bold text-emerald-800/60">
                          {message.time} ✓✓
                        </p>
                      </div>
                    </div>
                  );
                }

                if (message.sender === "feedback") {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div
                        className={`max-w-xl rounded-[1.5rem] p-5 shadow-sm ring-1 ${
                          message.isBest
                            ? "bg-emerald-50 ring-emerald-200"
                            : "bg-amber-50 ring-amber-200"
                        }`}
                      >
                        <p
                          className={`text-xs font-black uppercase tracking-[0.18em] ${
                            message.isBest ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          Feedback do sistema
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-[#08213f]">
                          Pontuação: {message.score}
                        </h3>

                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                          {message.text}
                        </p>

                        <p className="mt-3 text-right text-[11px] font-bold text-slate-400">
                          {message.time}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[78%] rounded-3xl rounded-bl-md bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
                      <p className="mb-1 text-xs font-black text-blue-700">
                        {scenarioDetails?.customer_name ?? "Cliente"}
                      </p>
                      <p className="text-sm font-semibold leading-6 text-slate-700">
                        {message.text}
                      </p>
                      <p className="mt-2 text-right text-[11px] font-bold text-slate-400">
                        {message.time}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isCustomerTyping && (
                <div className="flex justify-start">
                  <div className="rounded-3xl rounded-bl-md bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
                    <TypingDots />
                  </div>
                </div>
              )}

              {isFeedbackTyping && (
                <div className="flex justify-center">
                  <div className="rounded-full bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="border-t border-slate-200 bg-white/90 p-5 backdrop-blur">
              {!scenarioDetails ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">
                  Nenhum cenário disponível.
                </div>
              ) : selectedOption ? (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-bold text-slate-600">
                    Atendimento finalizado. Você pode reiniciar ou escolher outro cenário.
                  </p>

                  <button
                    type="button"
                    onClick={restartScenario}
                    className="rounded-full bg-[#08213f] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                  >
                    Nova tentativa
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Respostas rápidas do {visual.agentLabel}
                  </p>

                  <div className="grid gap-3">
                    {scenarioDetails.options.map((option, index) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleChooseOption(option)}
                        disabled={isSaving}
                        className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#08213f] text-xs font-black text-white">
                          {index + 1}
                        </span>

                        <span className="text-sm font-bold leading-6 text-slate-700 group-hover:text-[#08213f]">
                          {option.option_text}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </section>
  );
}

"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSession } from "@/lib/session/session.client";
import { getTechnicalFeedback } from "@/lib/feedback/technicalFeedback";
import {
  advanceStudentTrailIfNeeded,
  getAvailableScenariosForStudent,
  getStudentByProfileId,
  getStudentTeams,
  saveSimulationResult,
  SimulationAnswerInput,
  SimulationScenario,
  StudentByProfile,
  StudentTeam,
} from "@/services/simulation.service";
import {
  getSalesRichScenarioDetails,
  SalesMessageType,
  SalesRichMessage,
  SalesRichOption,
  SalesRichScenarioDetails,
} from "@/services/sales-chat.service";
import styles from "./SalesMessengerSimulator.module.css";

type SalesMessengerSimulatorProps = {
  mode: "individual" | "equipe";
};

type Phase =
  | "setup"
  | "waiting"
  | "active"
  | "feedback"
  | "completed";

type ChatMessage = {
  id: string;
  author: "cliente" | "vendedor";
  messageType: SalesMessageType;
  text: string | null;
  mediaUrl: string | null;
  mediaName: string | null;
  mediaMimeType: string | null;
  mediaSizeLabel: string | null;
  caption: string | null;
  emoji: string | null;
  time: string;
};

type FeedbackData = {
  title: string;
  status: "good" | "medium" | "bad";
  statusLabel: string;
  score: number;
  competency: string;
  impact: string;
  nextAction: string;
  technicalText: string;
};

type SalesResult = {
  title: string;
  description: string;
  conversion: string;
  probability: number;
  nextStep: string;
  customerMood: string;
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function randomBetween(min: number, max: number) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function currentTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function initials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CL"
  );
}

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";

  return value;
}

function temperatureLabel(value: string) {
  if (value === "frio") return "Lead frio";
  if (value === "quente") return "Lead quente";

  return "Lead morno";
}

function stageLabel(value: string) {
  const labels: Record<string, string> = {
    prospeccao: "Prospecção",
    descoberta: "Descoberta",
    proposta: "Proposta",
    negociacao: "Negociação",
    fechamento: "Fechamento",
    pos_venda: "Pós-venda",
  };

  return labels[value] ?? value;
}

function stageByProgress(index: number, total: number) {
  if (total <= 1) return "fechamento";

  const ratio = index / Math.max(total - 1, 1);

  if (ratio < 0.18) return "prospeccao";
  if (ratio < 0.4) return "descoberta";
  if (ratio < 0.6) return "proposta";
  if (ratio < 0.82) return "negociacao";

  return "fechamento";
}

function competencyByProgress(
  index: number,
  total: number,
  technicalFocus?: string | null
) {
  if (technicalFocus?.trim()) {
    return technicalFocus;
  }

  const stage = stageByProgress(index, total);

  const competencies: Record<string, string> = {
    prospeccao: "Abordagem e criação de conexão",
    descoberta: "Escuta ativa e descoberta da necessidade",
    proposta: "Apresentação de valor e benefícios",
    negociacao: "Objeções e negociação colaborativa",
    fechamento: "Fechamento e próximo passo",
  };

  return competencies[stage];
}

function feedbackQuality(
  score: number,
  maximum: number
) {
  const ratio = maximum > 0
    ? score / maximum
    : 0;

  if (ratio >= 0.8) {
    return {
      status: "good" as const,
      statusLabel: "Excelente decisão comercial",
      title: "Sua resposta fez a negociação avançar",
      impact:
        "O cliente percebeu segurança, atenção e valor na sua abordagem.",
      nextAction:
        "Continue conduzindo a conversa sem pressionar e confirme o próximo passo.",
    };
  }

  if (ratio >= 0.45) {
    return {
      status: "medium" as const,
      statusLabel: "Abordagem parcialmente adequada",
      title: "A conversa avançou, mas perdeu força",
      impact:
        "O cliente recebeu alguma orientação, porém ainda pode estar inseguro ou sem perceber valor suficiente.",
      nextAction:
        "Faça perguntas mais precisas, conecte a solução à necessidade e evite respostas genéricas.",
    };
  }

  return {
    status: "bad" as const,
    statusLabel: "Decisão comercial inadequada",
    title: "A resposta aumentou a resistência",
    impact:
      "O cliente pode sentir pressão, falta de escuta ou pouca conexão entre a oferta e a necessidade.",
    nextAction:
      "Retome a descoberta, reconheça a objeção e apresente benefícios relevantes.",
  };
}

function buildResult(
  performance: number
): SalesResult {
  if (performance >= 88) {
    return {
      title: "Venda concluída",
      description:
        "O cliente percebeu valor, teve suas objeções tratadas e aceitou avançar com a compra.",
      conversion: "Convertido",
      probability: Math.min(99, performance + 4),
      nextStep: "Confirmar pedido e iniciar o pós-venda",
      customerMood: "Encantado",
    };
  }

  if (performance >= 70) {
    return {
      title: "Oportunidade avançada",
      description:
        "A negociação evoluiu e o cliente demonstrou intenção real, mas ainda precisa confirmar detalhes.",
      conversion: "Proposta aceita",
      probability: performance,
      nextStep: "Agendar confirmação e reforçar os benefícios",
      customerMood: "Interessado",
    };
  }

  if (performance >= 48) {
    return {
      title: "Follow-up necessário",
      description:
        "O cliente manteve algum interesse, porém a proposta ainda não ficou suficientemente clara ou convincente.",
      conversion: "Em análise",
      probability: performance,
      nextStep: "Retomar a necessidade e enviar uma proposta ajustada",
      customerMood: "Indeciso",
    };
  }

  return {
    title: "Oportunidade perdida",
    description:
      "A abordagem não conseguiu gerar confiança ou responder adequadamente às necessidades do cliente.",
    conversion: "Não convertido",
    probability: performance,
    nextStep: "Revisar a abordagem antes de um novo contato",
    customerMood: "Resistente",
  };
}

function normalizeIncomingMessage(
  message: SalesRichMessage
): ChatMessage {
  return {
    id: message.id,
    author: "cliente",
    messageType: message.message_type,
    text: message.content,
    mediaUrl: message.media_url,
    mediaName: message.media_name,
    mediaMimeType: message.media_mime_type,
    mediaSizeLabel: message.media_size_label,
    caption: message.caption,
    emoji: message.emoji,
    time: currentTime(),
  };
}

function normalizeSellerMessage(
  option: SalesRichOption
): ChatMessage {
  const emojiPrefix =
    option.response_emoji?.trim()
      ? `${option.response_emoji} `
      : "";

  return {
    id: `seller-${option.id}-${Date.now()}`,
    author: "vendedor",
    messageType:
      option.response_message_type ?? "text",
    text: `${emojiPrefix}${option.option_text}`,
    mediaUrl: option.response_media_url,
    mediaName: option.response_media_name,
    mediaMimeType:
      option.response_media_mime_type,
    mediaSizeLabel:
      option.response_media_size_label,
    caption: option.response_caption,
    emoji: option.response_emoji,
    time: currentTime(),
  };
}

export function SalesMessengerSimulator({
  mode,
}: SalesMessengerSimulatorProps) {
  const messagesRef = useRef<HTMLDivElement | null>(
    null
  );

  const sequenceTokenRef = useRef(0);

  /*
   * Cenário imediatamente disponível para o motor,
   * sem aguardar a atualização visual do React.
   */
  const scenarioRef =
    useRef<SalesRichScenarioDetails | null>(null);
  /*
   * Impede mensagens duplicadas e registra quais etapas
   * já foram entregues ao aluno.
   */
  const deliveredStepsRef =
    useRef<Set<string>>(new Set());

  const runningStepRef =
    useRef<string | null>(null);

  const answersRef =
    useRef<SimulationAnswerInput[]>([]);
  const scoreRef = useRef(0);
  const maximumRef = useRef(0);

  const [student, setStudent] =
    useState<StudentByProfile | null>(null);

  const [teams, setTeams] = useState<StudentTeam[]>(
    []
  );

  const [selectedTeamId, setSelectedTeamId] =
    useState("");

  const [scenarios, setScenarios] = useState<
    SimulationScenario[]
  >([]);

  const [selectedScenarioId, setSelectedScenarioId] =
    useState("");

  const [scenario, setScenario] =
    useState<SalesRichScenarioDetails | null>(
      null
    );

  const [difficultyFilter, setDifficultyFilter] =
    useState("todos");

  const [phase, setPhase] =
    useState<Phase>("setup");

  const [currentStepIndex, setCurrentStepIndex] =
    useState(0);

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([]);

  const [answers, setAnswers] = useState<
    SimulationAnswerInput[]
  >([]);

  const [score, setScore] = useState(0);
  const [maximumScore, setMaximumScore] =
    useState(0);

  const [customerTyping, setCustomerTyping] =
    useState(false);

  const [responsesAvailable, setResponsesAvailable] =
    useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackData | null>(null);

  const [result, setResult] =
    useState<SalesResult | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [assignmentId, setAssignmentId] =
    useState<string | null>(null);

  const [requestedScenarioId, setRequestedScenarioId] =
    useState<string | null>(null);

  const [trailAdvanced, setTrailAdvanced] =
    useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(true);

  const [isPreparing, setIsPreparing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const selectedTeam = useMemo(
    () =>
      teams.find(
        (team) => team.id === selectedTeamId
      ) ?? null,
    [teams, selectedTeamId]
  );

  const currentStep =
    scenario?.steps[currentStepIndex] ?? null;

  const customerName =
    scenario?.customer_name ?? "Cliente";

  const progress = scenario
    ? Math.round(
        ((currentStepIndex + 1) /
          scenario.steps.length) *
          100
      )
    : 0;

  const performance = maximumScore > 0
    ? Math.round(
        (score / maximumScore) * 100
      )
    : 0;

  const currentStage = scenario
    ? stageByProgress(
        currentStepIndex,
        scenario.steps.length
      )
    : "descoberta";

  async function loadBaseData(
    filter = difficultyFilter
  ) {
    try {
      setIsLoading(true);
      setError("");

      const session = getSession() as any;
      const profileId =
        session?.profileId ?? session?.id;

      if (!profileId) {
        setError(
          "Sessão do aluno não encontrada."
        );
        return;
      }

      const studentData =
        await getStudentByProfileId(profileId);

      if (!studentData) {
        setError(
          "Cadastro do aluno não encontrado."
        );
        return;
      }

      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(
              window.location.search
            )
          : null;

      const scenarioFromUrl =
        params?.get("scenario") ?? null;

      const assignmentFromUrl =
        params?.get("assignment") ?? null;

      const scenarioData =
        await getAvailableScenariosForStudent(
          "vendas",
          studentData,
          filter
        );

      setStudent(studentData);
      setScenarios(scenarioData);
      setRequestedScenarioId(scenarioFromUrl);
      setAssignmentId(assignmentFromUrl);

      setSelectedScenarioId(
        scenarioFromUrl ||
          selectedScenarioId ||
          scenarioData[0]?.id ||
          ""
      );

      if (mode === "equipe") {
        const teamData =
          await getStudentTeams(studentData.id);

        setTeams(teamData);

        if (!selectedTeamId && teamData[0]) {
          setSelectedTeamId(teamData[0].id);
        }
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível carregar o simulador."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBaseData();

    return () => {
      sequenceTokenRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const container = messagesRef.current;

    if (!container) {
      return;
    }

    const timer = window.setTimeout(() => {
      container.scrollTop =
        container.scrollHeight;
    }, 70);

    return () => window.clearTimeout(timer);
  }, [messages, customerTyping]);

  /*
   * MONITOR AUTOMATICO DA CONVERSA
   *
   * Caso a tela esteja ativa, mas nenhuma rotina esteja
   * enviando a etapa atual, o monitor inicia a entrega.
   */
  useEffect(() => {
    if (
      phase !== "active" ||
      !scenario ||
      customerTyping ||
      responsesAvailable
    ) {
      return;
    }

    const step =
      scenario.steps[currentStepIndex];

    if (
      !step ||
      deliveredStepsRef.current.has(
        step.id
      ) ||
      runningStepRef.current === step.id
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void playCustomerMessages(
        currentStepIndex,
        scenario
      );
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    phase,
    scenario,
    currentStepIndex,
    customerTyping,
    responsesAvailable,
  ]);

  async function handleDifficultyChange(
    value: string
  ) {
    setDifficultyFilter(value);
    setSelectedScenarioId("");
    resetConversation();
    await loadBaseData(value);
  }

  function resetConversation() {
    sequenceTokenRef.current += 1;
    scenarioRef.current = null;
    deliveredStepsRef.current = new Set();
    runningStepRef.current = null;

    answersRef.current = [];
    scoreRef.current = 0;
    maximumRef.current = 0;

    setScenario(null);
    setPhase("setup");
    setCurrentStepIndex(0);
    setMessages([]);
    setAnswers([]);
    setScore(0);
    setMaximumScore(0);
    setCustomerTyping(false);
    setResponsesAvailable(false);
    setFeedback(null);
    setResult(null);
    setTrailAdvanced(false);
    setError("");
  }

  async function playCustomerMessages(
    stepIndex: number,
    activeScenario?: SalesRichScenarioDetails | null
  ) {
    const scenarioForSequence =
      activeScenario ?? scenarioRef.current;

    if (!scenarioForSequence) {
      setCustomerTyping(false);
      setResponsesAvailable(false);

      setError(
        "O cenário não ficou disponível para iniciar a conversa."
      );

      return;
    }

    const step =
      scenarioForSequence.steps[stepIndex];

    if (!step) {
      setCustomerTyping(false);
      setResponsesAvailable(false);

      setError(
        "A etapa atual da conversa não foi encontrada."
      );

      return;
    }

    /*
     * Não executa a mesma etapa duas vezes.
     */
    if (
      deliveredStepsRef.current.has(step.id)
    ) {
      setCustomerTyping(false);
      setResponsesAvailable(
        step.options.length > 0
      );

      return;
    }

    /*
     * Evita duas rotinas simultâneas para a mesma etapa.
     */
    if (runningStepRef.current === step.id) {
      return;
    }

    runningStepRef.current = step.id;

    const token = ++sequenceTokenRef.current;

    setError("");
    setResponsesAvailable(false);

    /*
     * Fallback obrigatório.
     * Mesmo que scenario_step_messages esteja vazio,
     * customer_message será exibida no chat.
     */
    const sourceMessages =
      step.messages &&
      step.messages.length > 0
        ? step.messages
        : [
            {
              id: `fallback-${step.id}`,
              step_id: step.id,
              sender: "cliente",
              message_type: "text" as const,
              content:
                step.customer_message ||
                "Olá! Gostaria de receber mais informações.",
              media_url: null,
              media_name: null,
              media_mime_type: null,
              media_size_label: null,
              caption: null,
              emoji: null,
              message_order: 1,
              delay_ms: 900,
              metadata: {},
            },
          ];

    try {
      for (
        let index = 0;
        index < sourceMessages.length;
        index += 1
      ) {
        const item = sourceMessages[index];

        const messageContent =
          item.content ??
          item.caption ??
          item.emoji ??
          item.media_name ??
          "";

        /*
         * O tempo cresce conforme o tamanho do texto,
         * dando impressão de uma pessoa digitando.
         */
        const naturalDelay = Math.min(
          3400,
          Math.max(
            650,
            Number(item.delay_ms ?? 900) +
              messageContent.length * 9
          )
        );

        setCustomerTyping(true);

        await wait(naturalDelay);

        if (
          token !== sequenceTokenRef.current
        ) {
          setCustomerTyping(false);
          return;
        }

        setCustomerTyping(false);

        const normalizedMessage =
          normalizeIncomingMessage(item);

        setMessages((current) => {
          const alreadyExists =
            current.some(
              (message) =>
                message.id ===
                normalizedMessage.id
            );

          if (alreadyExists) {
            return current;
          }

          return [
            ...current,
            normalizedMessage,
          ];
        });

        if (
          index <
          sourceMessages.length - 1
        ) {
          await wait(
            randomBetween(400, 900)
          );
        }
      }

      if (
        token === sequenceTokenRef.current
      ) {
        deliveredStepsRef.current.add(
          step.id
        );

        setCustomerTyping(false);
        setResponsesAvailable(
          step.options.length > 0
        );
      }
    } catch (caughtError) {
      setCustomerTyping(false);
      setResponsesAvailable(false);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível exibir as mensagens do cliente."
      );
    } finally {
      if (
        runningStepRef.current === step.id
      ) {
        runningStepRef.current = null;
      }
    }
  }

  async function startConversation() {
    try {
      setIsPreparing(true);
      setError("");

      if (
        mode === "equipe" &&
        !selectedTeamId
      ) {
        setError(
          "Selecione uma equipe para iniciar."
        );
        return;
      }

      const scenarioId =
        requestedScenarioId ||
        selectedScenarioId ||
        scenarios[0]?.id;

      if (!scenarioId) {
        setError(
          "Nenhum cenário de Vendas está disponível."
        );
        return;
      }

      const details =
        await getSalesRichScenarioDetails(
          scenarioId
        );

      if (
        !details.steps ||
        details.steps.length === 0
      ) {
        setError(
          "Este cenário não possui etapas cadastradas."
        );
        return;
      }

      sequenceTokenRef.current += 1;
      scenarioRef.current = details;

      deliveredStepsRef.current =
        new Set();

      runningStepRef.current = null;

      answersRef.current = [];
      scoreRef.current = 0;
      maximumRef.current = 0;

      setScenario(details);
      setMessages([]);
      setAnswers([]);
      setScore(0);
      setMaximumScore(0);
      setCurrentStepIndex(0);
      setFeedback(null);
      setResult(null);
      setResponsesAvailable(false);
      setCustomerTyping(false);
      setTrailAdvanced(false);

      setPhase("waiting");

      await wait(
        randomBetween(700, 1500)
      );

      /*
       * Primeiro exibe o ambiente de conversa.
       */
      setPhase("active");

      /*
       * Aguarda uma fração de segundo para o painel
       * ficar visível e inicia o cliente digitando.
       */
      await wait(250);

      await playCustomerMessages(
        0,
        details
      );
    } catch (caughtError) {
      setCustomerTyping(false);
      setResponsesAvailable(false);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível iniciar a conversa."
      );

      setPhase("setup");
    } finally {
      setIsPreparing(false);
    }
  }

  function chooseResponse(
    option: SalesRichOption
  ) {
    if (
      !currentStep ||
      !scenario ||
      phase !== "active" ||
      !responsesAvailable
    ) {
      return;
    }

    setResponsesAvailable(false);

    const sellerMessage =
      normalizeSellerMessage(option);

    setMessages((current) => [
      ...current,
      sellerMessage,
    ]);

    const stepMaximum = Math.max(
      ...currentStep.options.map((item) =>
        Number(item.score ?? 0)
      ),
      1
    );

    const optionScore = Number(
      option.score ?? 0
    );

    const technicalFeedback =
      getTechnicalFeedback({
        moduleSlug: "vendas",
        score: optionScore,
        technicalFocus:
          scenario.technical_focus,
        learningObjective:
          scenario.learning_objective,
        sourceLesson:
          scenario.source_lesson,
      });

    const finalFeedback = option.feedback
      ? `${option.feedback}\n\n${technicalFeedback}`
      : technicalFeedback;

    const answer: SimulationAnswerInput = {
      stepId: currentStep.id,
      optionId: option.id,
      score: optionScore,
      feedback: finalFeedback,
    };

    const nextAnswers = [
      ...answersRef.current,
      answer,
    ];

    const nextScore =
      scoreRef.current + optionScore;

    const nextMaximum =
      maximumRef.current + stepMaximum;

    answersRef.current = nextAnswers;
    scoreRef.current = nextScore;
    maximumRef.current = nextMaximum;

    setAnswers(nextAnswers);
    setScore(nextScore);
    setMaximumScore(nextMaximum);

    const quality = feedbackQuality(
      optionScore,
      stepMaximum
    );

    setFeedback({
      ...quality,
      score: optionScore,
      technicalText: finalFeedback,
      competency: competencyByProgress(
        currentStepIndex,
        scenario.steps.length,
        scenario.technical_focus
      ),
    });

    setPhase("feedback");
  }

  async function finishConversation() {
    if (
      !scenario ||
      !student ||
      answersRef.current.length === 0
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const finalPerformance =
        maximumRef.current > 0
          ? Math.round(
              (scoreRef.current /
                maximumRef.current) *
                100
            )
          : 0;

      await saveSimulationResult({
        scenarioId: scenario.id,
        studentId: student.id,
        classId:
          mode === "equipe"
            ? selectedTeam?.class_id ??
              student.class_id
            : student.class_id,
        teamId:
          mode === "equipe"
            ? selectedTeam?.id
            : undefined,
        moduleSlug: "vendas",
        mode,
        assignmentId,
        totalScore: finalPerformance,
        answers: answersRef.current,
      });

      if (mode === "individual") {
        const advanced =
          await advanceStudentTrailIfNeeded(
            student,
            finalPerformance
          );

        setTrailAdvanced(advanced);
      }

      setResult(
        buildResult(finalPerformance)
      );

      setPhase("completed");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível salvar o resultado."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function continueAfterFeedback() {
    setFeedback(null);

    if (
      !scenario ||
      currentStepIndex + 1 >=
        scenario.steps.length
    ) {
      await finishConversation();
      return;
    }

    const nextIndex =
      currentStepIndex + 1;

    setCurrentStepIndex(nextIndex);
    setPhase("active");

    window.setTimeout(() => {
      void playCustomerMessages(
        nextIndex,
        scenarioRef.current ?? scenario
      );
    }, randomBetween(350, 750));
  }

  function renderMessage(
    message: ChatMessage
  ) {
    const seller =
      message.author === "vendedor";

    const content = (
      <div
        className={`${styles.bubble} ${
          seller
            ? styles.sellerBubble
            : styles.customerBubble
        }`}
      >
        {message.messageType === "emoji" ? (
          <div className={styles.emojiMessage}>
            {message.emoji ||
              message.text ||
              "😊"}
          </div>
        ) : message.messageType === "image" ? (
          <>
            <button
              type="button"
              className={styles.imageAttachment}
              onClick={() =>
                message.mediaUrl &&
                setImagePreview(
                  message.mediaUrl
                )
              }
            >
              <img
                src={
                  message.mediaUrl ||
                  "/sales-media/produto-demo.svg"
                }
                alt={
                  message.caption ||
                  "Imagem enviada na conversa"
                }
              />

              <div
                className={
                  styles.attachmentCaption
                }
              >
                {message.caption ||
                  message.text ||
                  "Imagem enviada"}
              </div>
            </button>

            {message.text && (
              <p className={styles.messageText}>
                {message.text}
              </p>
            )}
          </>
        ) : message.messageType ===
          "document" ? (
          <>
            {message.mediaUrl ? (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className={
                  styles.documentAttachment
                }
              >
                <span
                  className={
                    styles.documentIcon
                  }
                >
                  DOC
                </span>

                <span
                  className={
                    styles.documentInfo
                  }
                >
                  <span
                    className={
                      styles.documentName
                    }
                  >
                    {message.mediaName ||
                      "Documento"}
                  </span>

                  <span
                    className={
                      styles.documentMeta
                    }
                  >
                    {message.mediaSizeLabel ||
                      "Arquivo enviado"}
                  </span>
                </span>
              </a>
            ) : (
              <div
                className={
                  styles.documentAttachment
                }
              >
                <span
                  className={
                    styles.documentIcon
                  }
                >
                  DOC
                </span>

                <span
                  className={
                    styles.documentInfo
                  }
                >
                  <span
                    className={
                      styles.documentName
                    }
                  >
                    {message.mediaName ||
                      "Documento"}
                  </span>
                </span>
              </div>
            )}

            {message.text && (
              <p
                className={styles.messageText}
                style={{ marginTop: 8 }}
              >
                {message.text}
              </p>
            )}
          </>
        ) : (
          <p className={styles.messageText}>
            {message.text}
          </p>
        )}

        <div className={styles.messageMeta}>
          <span>{message.time}</span>

          {seller && (
            <span
              className={styles.readReceipt}
            >
              ✓✓
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div
        key={message.id}
        className={`${styles.messageRow} ${
          seller
            ? styles.sellerRow
            : styles.customerRow
        }`}
      >
        <div className={styles.messageWrap}>
          {content}
        </div>
      </div>
    );
  }

  function renderSetup() {
    return (
      <div className={styles.setup}>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            💬
          </div>

          <p className={styles.heroEyebrow}>
            Atendimento comercial digital
          </p>

          <h1 className={styles.heroTitle}>
            Converse, descubra e transforme interesse em venda.
          </h1>

          <p className={styles.heroText}>
            O cliente poderá enviar mensagens,
            emojis, fotos e documentos. Analise
            cada detalhe, identifique o perfil e
            conduza a negociação com naturalidade.
          </p>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.heroActions}>
            <button
              type="button"
              onClick={startConversation}
              disabled={
                isLoading ||
                isPreparing ||
                scenarios.length === 0
              }
              className={styles.primaryButton}
            >
              {isLoading
                ? "Carregando carteira..."
                : isPreparing
                  ? "Abrindo conversa..."
                  : "Iniciar atendimento"}
            </button>

            <Link
              href="/aluno/simulacoes"
              className={styles.secondaryButton}
            >
              Voltar ao portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function renderWaiting() {
    return (
      <div className={styles.waiting}>
        <div className={styles.waitingCard}>
          <div className={styles.waitingAvatar}>
            {initials(customerName)}
          </div>

          <h2 className={styles.waitingTitle}>
            Nova mensagem recebida
          </h2>

          <p className={styles.waitingText}>
            {customerName} iniciou uma conversa
            sobre{" "}
            {scenario?.sales_product_name ||
              scenario?.title ||
              "uma oportunidade comercial"}.
          </p>
        </div>
      </div>
    );
  }

  function renderCompleted() {
    if (!result) {
      return null;
    }

    return (
      <div className={styles.completed}>
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <p className={styles.resultEyebrow}>
              Resultado comercial
            </p>

            <h2 className={styles.resultTitle}>
              {result.title}
            </h2>

            <p className={styles.resultText}>
              {result.description}
            </p>
          </div>

          <div className={styles.resultBody}>
            <div className={styles.resultGrid}>
              <div
                className={styles.resultMetric}
              >
                <p
                  className={
                    styles.resultMetricLabel
                  }
                >
                  Situação
                </p>

                <p
                  className={
                    styles.resultMetricValue
                  }
                >
                  {result.conversion}
                </p>
              </div>

              <div
                className={styles.resultMetric}
              >
                <p
                  className={
                    styles.resultMetricLabel
                  }
                >
                  Conversão
                </p>

                <p
                  className={
                    styles.resultMetricValue
                  }
                >
                  {result.probability}%
                </p>
              </div>

              <div
                className={styles.resultMetric}
              >
                <p
                  className={
                    styles.resultMetricLabel
                  }
                >
                  Cliente
                </p>

                <p
                  className={
                    styles.resultMetricValue
                  }
                >
                  {result.customerMood}
                </p>
              </div>

              <div
                className={styles.resultMetric}
              >
                <p
                  className={
                    styles.resultMetricLabel
                  }
                >
                  Pontos
                </p>

                <p
                  className={
                    styles.resultMetricValue
                  }
                >
                  {score}
                </p>
              </div>
            </div>

            <div
              className={styles.feedbackCallout}
            >
              <strong>Próximo passo</strong>
              <p>{result.nextStep}</p>
            </div>

            {trailAdvanced && (
              <div
                className={styles.feedbackCallout}
              >
                <strong>
                  Evolução liberada
                </strong>
                <p>
                  Um novo nível da trilha foi
                  desbloqueado.
                </p>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.resultActions}>
              {assignmentId ? (
                <Link
                  href="/aluno/atividades"
                  className={styles.primaryButton}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  Voltar às atividades
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={resetConversation}
                  className={styles.primaryButton}
                >
                  Atender outro cliente
                </button>
              )}

              <Link
                href="/aluno/simulacoes"
                className={styles.secondaryButton}
              >
                Encerrar atendimento
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderChat() {
    return (
      <>
        <header className={styles.chatHeader}>
          <div className={styles.chatIdentity}>
            <div className={styles.headerAvatar}>
              {initials(customerName)}
            </div>

            <div>
              <p className={styles.chatName}>
                {customerName}
              </p>

              <p className={styles.chatStatus}>
                {customerTyping
                  ? "digitando..."
                  : "online"}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerButton}
              aria-label="Pesquisar"
            >
              🔍
            </button>

            <button
              type="button"
              className={styles.headerButton}
              aria-label="Mais opções"
            >
              ⋮
            </button>
          </div>
        </header>

        <div
          ref={messagesRef}
          className={styles.messages}
        >
          <div className={styles.messagesInner}>
            <div className={styles.dayLabel}>
              Atendimento de hoje
            </div>

            {messages.map(renderMessage)}

            {customerTyping && (
              <div
                className={`${styles.messageRow} ${styles.customerRow}`}
              >
                <div
                  className={styles.messageWrap}
                >
                  <div className={styles.typing}>
                    <div
                      className={
                        styles.typingDots
                      }
                    >
                      <span />
                      <span />
                      <span />
                    </div>

                    <span
                      className={
                        styles.typingText
                      }
                    >
                      {customerName} está digitando
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className={styles.composer}>
          <button
            type="button"
            className={styles.composerIcon}
            aria-label="Emojis"
          >
            😊
          </button>

          <button
            type="button"
            className={styles.composerIcon}
            aria-label="Anexar"
          >
            📎
          </button>

          <div className={styles.composerField}>
            Escolha uma resposta comercial no
            painel lateral...
          </div>

          <button
            type="button"
            className={styles.sendButton}
            aria-label="Enviar"
          >
            ➤
          </button>
        </footer>

        {phase === "feedback" &&
          feedback && (
            <div
              className={
                styles.feedbackOverlay
              }
            >
              <div
                className={styles.feedbackCard}
              >
                <div
                  className={
                    styles.feedbackHeader
                  }
                >
                  <div>
                    <p
                      className={
                        styles.feedbackEyebrow
                      }
                    >
                      Feedback da sua resposta
                    </p>

                    <h2
                      className={
                        styles.feedbackTitle
                      }
                    >
                      {feedback.title}
                    </h2>
                  </div>

                  <div
                    className={
                      styles.feedbackScore
                    }
                  >
                    <strong>
                      +{feedback.score}
                    </strong>
                    <span>
                      nesta resposta
                    </span>
                  </div>
                </div>

                <div
                  className={styles.feedbackBody}
                >
                  <span
                    className={`${styles.feedbackStatus} ${
                      feedback.status === "good"
                        ? styles.feedbackGood
                        : feedback.status ===
                            "medium"
                          ? styles.feedbackMedium
                          : styles.feedbackBad
                    }`}
                  >
                    {feedback.statusLabel}
                  </span>

                  <p
                    className={
                      styles.feedbackText
                    }
                  >
                    {feedback.technicalText}
                  </p>

                  <div
                    className={
                      styles.feedbackSummary
                    }
                  >
                    <div
                      className={
                        styles.feedbackMetric
                      }
                    >
                      <p
                        className={
                          styles.feedbackMetricLabel
                        }
                      >
                        Competência
                      </p>

                      <p
                        className={
                          styles.feedbackMetricValue
                        }
                      >
                        {feedback.competency}
                      </p>
                    </div>

                    <div
                      className={
                        styles.feedbackMetric
                      }
                    >
                      <p
                        className={
                          styles.feedbackMetricLabel
                        }
                      >
                        Pontuação
                      </p>

                      <p
                        className={
                          styles.feedbackMetricValue
                        }
                      >
                        {score} pontos
                      </p>
                    </div>

                    <div
                      className={
                        styles.feedbackMetric
                      }
                    >
                      <p
                        className={
                          styles.feedbackMetricLabel
                        }
                      >
                        Desempenho
                      </p>

                      <p
                        className={
                          styles.feedbackMetricValue
                        }
                      >
                        {performance}%
                      </p>
                    </div>
                  </div>

                  <div
                    className={
                      styles.feedbackCallout
                    }
                  >
                    <strong>
                      Impacto no cliente
                    </strong>
                    <p>{feedback.impact}</p>
                  </div>

                  <div
                    className={
                      styles.feedbackCallout
                    }
                  >
                    <strong>
                      Como melhorar
                    </strong>
                    <p>
                      {feedback.nextAction}
                    </p>
                  </div>

                  <div
                    className={
                      styles.feedbackActions
                    }
                  >
                    <button
                      type="button"
                      onClick={
                        continueAfterFeedback
                      }
                      disabled={isSaving}
                      className={
                        styles.primaryButton
                      }
                    >
                      {isSaving
                        ? "Salvando..."
                        : currentStepIndex + 1 >=
                            (scenario?.steps
                              .length ?? 0)
                          ? "Ver resultado da negociação"
                          : "Continuar conversa"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </>
    );
  }

  function renderMain() {
    if (phase === "setup") {
      return renderSetup();
    }

    if (phase === "waiting") {
      return renderWaiting();
    }

    if (phase === "completed") {
      return renderCompleted();
    }

    return renderChat();
  }

  return (
    <main className={styles.shell}>
      <section className={styles.frame}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              💬
            </div>

            <div>
              <p className={styles.brandTitle}>
                SalesFlow Messenger
              </p>

              <p className={styles.brandSubtitle}>
                Simulador de vendas digital
              </p>
            </div>
          </div>

          <div className={styles.topMetrics}>
            <div className={styles.metric}>
              <span className={styles.onlineDot} />

              <div>
                <div
                  className={styles.metricLabel}
                >
                  Status
                </div>

                <div
                  className={styles.metricValue}
                >
                  Online
                </div>
              </div>
            </div>

            <div className={styles.metric}>
              <div>
                <div
                  className={styles.metricLabel}
                >
                  Modo
                </div>

                <div
                  className={styles.metricValue}
                >
                  {mode === "equipe"
                    ? "Equipe"
                    : "Individual"}
                </div>
              </div>
            </div>

            <div className={styles.metric}>
              <div>
                <div
                  className={styles.metricLabel}
                >
                  Pontuação
                </div>

                <div
                  className={styles.metricValue}
                >
                  {score} pts
                </div>
              </div>
            </div>

            <div className={styles.metric}>
              <div>
                <div
                  className={styles.metricLabel}
                >
                  Conversão
                </div>

                <div
                  className={styles.metricValue}
                >
                  {performance}%
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.contacts}>
            <div
              className={styles.contactsHeader}
            >
              <p
                className={styles.contactsTitle}
              >
                Carteira de oportunidades
              </p>

              <p
                className={
                  styles.contactsSubtitle
                }
              >
                Leads disponíveis para atendimento.
              </p>

              <input
                className={styles.searchBox}
                placeholder="Buscar conversa..."
              />
            </div>

            <div className={styles.contactList}>
              {scenario && (
                <button
                  type="button"
                  className={`${styles.contactCard} ${styles.contactCardActive}`}
                >
                  <span className={styles.avatar}>
                    {initials(customerName)}
                  </span>

                  <span
                    className={
                      styles.contactInfo
                    }
                  >
                    <span
                      className={
                        styles.contactName
                      }
                    >
                      {customerName}
                    </span>

                    <span
                      className={
                        styles.contactPreview
                      }
                    >
                      {customerTyping
                        ? "digitando..."
                        : scenario.title}
                    </span>
                  </span>

                  <span className={styles.unread}>
                    1
                  </span>
                </button>
              )}

              {scenarios
                .filter(
                  (item) =>
                    item.id !== scenario?.id
                )
                .slice(0, 5)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      styles.contactCard
                    }
                    disabled={phase !== "setup"}
                    onClick={() =>
                      setSelectedScenarioId(
                        item.id
                      )
                    }
                  >
                    <span
                      className={styles.avatar}
                    >
                      {initials(item.title)}
                    </span>

                    <span
                      className={
                        styles.contactInfo
                      }
                    >
                      <span
                        className={
                          styles.contactName
                        }
                      >
                        {item.title}
                      </span>

                      <span
                        className={
                          styles.contactPreview
                        }
                      >
                        Nova oportunidade
                      </span>
                    </span>
                  </button>
                ))}
            </div>

            <div className={styles.leftControls}>
              {mode === "equipe" && (
                <div className={styles.field}>
                  <label
                    className={
                      styles.controlLabel
                    }
                  >
                    Equipe
                  </label>

                  <select
                    value={selectedTeamId}
                    onChange={(event) =>
                      setSelectedTeamId(
                        event.target.value
                      )
                    }
                    disabled={phase !== "setup"}
                    className={styles.control}
                  >
                    {teams.length === 0 ? (
                      <option value="">
                        Nenhuma equipe
                      </option>
                    ) : (
                      teams.map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                        >
                          {team.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {student?.simulation_access_mode ===
                "livre" && (
                <div className={styles.field}>
                  <label
                    className={
                      styles.controlLabel
                    }
                  >
                    Dificuldade
                  </label>

                  <select
                    value={difficultyFilter}
                    onChange={(event) =>
                      handleDifficultyChange(
                        event.target.value
                      )
                    }
                    disabled={phase !== "setup"}
                    className={styles.control}
                  >
                    <option value="todos">
                      Todas liberadas
                    </option>

                    {(
                      student.free_allowed_difficulties ??
                      []
                    ).map((difficulty) => (
                      <option
                        key={difficulty}
                        value={difficulty}
                      >
                        {difficultyLabel(
                          difficulty
                        )}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.field}>
                <label
                  className={
                    styles.controlLabel
                  }
                >
                  Cenário
                </label>

                <select
                  value={selectedScenarioId}
                  onChange={(event) =>
                    setSelectedScenarioId(
                      event.target.value
                    )
                  }
                  disabled={
                    phase !== "setup" ||
                    Boolean(
                      requestedScenarioId
                    )
                  }
                  className={styles.control}
                >
                  {requestedScenarioId &&
                    !scenarios.some(
                      (item) =>
                        item.id ===
                        requestedScenarioId
                    ) && (
                      <option
                        value={
                          requestedScenarioId
                        }
                      >
                        Atividade direcionada
                      </option>
                    )}

                  {scenarios.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          <section className={styles.main}>
            {renderMain()}
          </section>

          <aside className={styles.rightPanel}>
            <section className={styles.crm}>
              <p className={styles.crmEyebrow}>
                CRM da oportunidade
              </p>

              <h2 className={styles.crmTitle}>
                Contexto comercial
              </h2>

              <div className={styles.crmGrid}>
                <div className={styles.crmCard}>
                  <p className={styles.crmLabel}>
                    Temperatura
                  </p>

                  <span
                    className={`${styles.temperature} ${
                      scenario
                        ?.sales_lead_temperature ===
                      "frio"
                        ? styles.temperatureCold
                        : scenario
                              ?.sales_lead_temperature ===
                            "quente"
                          ? styles.temperatureHot
                          : styles.temperatureWarm
                    }`}
                  >
                    {temperatureLabel(
                      scenario
                        ?.sales_lead_temperature ??
                        "morno"
                    )}
                  </span>
                </div>

                <div className={styles.crmCard}>
                  <p className={styles.crmLabel}>
                    Funil
                  </p>

                  <p className={styles.crmValue}>
                    {stageLabel(currentStage)}
                  </p>
                </div>

                <div className={styles.crmCard}>
                  <p className={styles.crmLabel}>
                    Produto
                  </p>

                  <p className={styles.crmValue}>
                    {scenario
                      ?.sales_product_name ||
                      "Não informado"}
                  </p>
                </div>

                <div className={styles.crmCard}>
                  <p className={styles.crmLabel}>
                    Canal
                  </p>

                  <p className={styles.crmValue}>
                    {scenario
                      ?.sales_contact_channel ||
                      "Messenger"}
                  </p>
                </div>
              </div>

              <div className={styles.funnel}>
                <div
                  className={
                    styles.funnelTrack
                  }
                >
                  <div
                    className={
                      styles.funnelProgress
                    }
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div
                  className={
                    styles.funnelLabels
                  }
                >
                  <span>Contato</span>
                  <span>Negociação</span>
                  <span>Fechamento</span>
                </div>
              </div>
            </section>

            <div className={styles.optionsHeader}>
              <p
                className={styles.optionsTitle}
              >
                Respostas do vendedor
              </p>

              <p
                className={
                  styles.optionsSubtitle
                }
              >
                Escolha a alternativa mais adequada
                ao perfil e à necessidade do cliente.
              </p>
            </div>

            <div className={styles.options}>
              {phase === "active" &&
              currentStep &&
              responsesAvailable &&
              !customerTyping ? (
                currentStep.options.map(
                  (option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        chooseResponse(option)
                      }
                      className={
                        styles.optionButton
                      }
                    >
                      <span
                        className={
                          styles.optionNumber
                        }
                      >
                        {index + 1}
                      </span>

                      <span
                        className={
                          styles.optionText
                        }
                      >
                        {option.response_emoji
                          ? `${option.response_emoji} `
                          : ""}
                        {option.option_text}
                      </span>
                    </button>
                  )
                )
              ) : (
                <div
                  className={
                    styles.placeholder
                  }
                >
                  <p
                    className={
                      styles.placeholderTitle
                    }
                  >
                    {phase === "feedback"
                      ? "Leia o feedback antes de continuar"
                      : customerTyping
                        ? "O cliente está digitando"
                        : phase === "waiting"
                          ? "Nova conversa chegando"
                          : phase === "completed"
                            ? "Atendimento finalizado"
                            : "Inicie o atendimento"}
                  </p>

                  <p
                    className={
                      styles.placeholderText
                    }
                  >
                    As opções aparecerão após o
                    cliente concluir as mensagens.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {imagePreview && (
        <div className={styles.imageModal}>
          <button
            type="button"
            className={styles.closePreview}
            onClick={() =>
              setImagePreview(null)
            }
          >
            ×
          </button>

          <img
            src={imagePreview}
            alt="Visualização do anexo"
          />
        </div>
      )}
    </main>
  );
}


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
import styles from "./TelemarketingCommandCenter.module.css";

type TelemarketingCommandCenterProps = {
  mode: "individual" | "equipe";
};

type CallPhase =
  | "setup"
  | "waiting"
  | "ringing"
  | "active"
  | "feedback"
  | "completed";

type TranscriptMessage = {
  id: string;
  author: "cliente" | "operador";
  text: string;
  time: string;
};

type FeedbackState = {
  title: string;
  status: "excellent" | "partial" | "weak";
  statusLabel: string;
  text: string;
  score: number;
  impact: string;
  nextAction: string;
};

type CustomerEvaluation = {
  stars: number;
  percentage: number;
  satisfaction: string;
  outcome: string;
  comment: string;
};

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function currentTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CL";
}

function avatarBackground(value: string) {
  const palettes = [
    "linear-gradient(145deg, #92400e, #c2410c)",
    "linear-gradient(145deg, #713f12, #a16207)",
    "linear-gradient(145deg, #78350f, #b45309)",
    "linear-gradient(145deg, #7c2d12, #c2410c)",
    "linear-gradient(145deg, #1e3a8a, #0369a1)",
    "linear-gradient(145deg, #134e4a, #0f766e)",
  ];

  const hash = Array.from(value).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return palettes[hash % palettes.length];
}

function difficultyLabel(value: string) {
  if (value === "facil") return "Fácil";
  if (value === "medio") return "Médio";
  if (value === "dificil") return "Difícil";

  return value;
}

function feedbackQuality(score: number, maximum: number) {
  const ratio = maximum > 0 ? score / maximum : 0;

  if (ratio >= 0.8) {
    return {
      status: "excellent" as const,
      statusLabel: "Excelente abordagem",
      title: "Você fortaleceu o atendimento",
      impact:
        "Sua resposta aumentou a confiança do cliente e manteve o atendimento no caminho da resolução.",
      nextAction:
        "Mantenha a escuta ativa e avance para a próxima necessidade apresentada.",
    };
  }

  if (ratio >= 0.45) {
    return {
      status: "partial" as const,
      statusLabel: "Resposta parcialmente adequada",
      title: "Há uma boa intenção, mas falta precisão",
      impact:
        "O cliente percebeu atenção, porém ainda pode permanecer com dúvidas ou insegurança.",
      nextAction:
        "Seja mais claro, confirme o entendimento e apresente uma orientação objetiva.",
    };
  }

  return {
    status: "weak" as const,
    statusLabel: "Abordagem precisa melhorar",
    title: "Sua resposta pode aumentar a resistência",
    impact:
      "O cliente pode sentir falta de acolhimento, clareza ou solução para o motivo da ligação.",
    nextAction:
      "Retome a necessidade do cliente, evite respostas defensivas e conduza a conversa com calma.",
  };
}

function buildCustomerEvaluation(
  percentage: number
): CustomerEvaluation {
  if (percentage >= 90) {
    return {
      stars: 5,
      percentage,
      satisfaction: "Cliente encantado",
      outcome: "Resolvido com excelência",
      comment:
        "“Fui atendido com atenção, segurança e clareza. A solução foi apresentada de forma profissional.”",
    };
  }

  if (percentage >= 75) {
    return {
      stars: 4,
      percentage,
      satisfaction: "Cliente satisfeito",
      outcome: "Problema resolvido",
      comment:
        "“O atendimento foi bom e consegui entender a solução. Alguns detalhes poderiam ser mais objetivos.”",
    };
  }

  if (percentage >= 55) {
    return {
      stars: 3,
      percentage,
      satisfaction: "Cliente neutro",
      outcome: "Resolução parcial",
      comment:
        "“Recebi orientação, mas ainda fiquei com algumas dúvidas durante o atendimento.”",
    };
  }

  if (percentage >= 35) {
    return {
      stars: 2,
      percentage,
      satisfaction: "Cliente insatisfeito",
      outcome: "Problema pouco resolvido",
      comment:
        "“O atendimento não esclareceu completamente minha necessidade e faltou uma condução mais segura.”",
    };
  }

  return {
    stars: 1,
    percentage,
    satisfaction: "Cliente muito insatisfeito",
    outcome: "Problema não resolvido",
    comment:
      "“Não senti que minha necessidade foi compreendida. Eu precisaria entrar em contato novamente.”",
  };
}

export function TelemarketingCommandCenter({
  mode,
}: TelemarketingCommandCenterProps) {
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const ringIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  /*
   * Referências usadas para garantir que o salvamento final
   * sempre receba os valores mais recentes.
   */
  const answersRef = useRef<SimulationAnswerInput[]>([]);
  const totalScoreRef = useRef(0);
  const maximumScoreRef = useRef(0);

  const [student, setStudent] =
    useState<StudentByProfile | null>(null);

  const [teams, setTeams] = useState<StudentTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [scenarios, setScenarios] =
    useState<SimulationScenario[]>([]);

  const [selectedScenarioId, setSelectedScenarioId] =
    useState("");

  const [scenarioDetails, setScenarioDetails] =
    useState<SimulationScenarioDetails | null>(null);

  const [difficultyFilter, setDifficultyFilter] =
    useState("todos");

  const [phase, setPhase] = useState<CallPhase>("setup");
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] =
    useState<TranscriptMessage[]>([]);

  const [answers, setAnswers] =
    useState<SimulationAnswerInput[]>([]);

  const [totalScore, setTotalScore] = useState(0);
  const [maximumScore, setMaximumScore] = useState(0);

  const [feedback, setFeedback] =
    useState<FeedbackState | null>(null);

  const [evaluation, setEvaluation] =
    useState<CustomerEvaluation | null>(null);

  const [isCustomerSpeaking, setIsCustomerSpeaking] =
    useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [trailAdvanced, setTrailAdvanced] = useState(false);

  const [assignmentId, setAssignmentId] =
    useState<string | null>(null);

  const [requestedScenarioId, setRequestedScenarioId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTeam = useMemo(
    () =>
      teams.find((team) => team.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  const currentStep =
    scenarioDetails?.steps[currentStepIndex] ?? null;

  const customerName =
    scenarioDetails?.customer_name || "Cliente";


  const performancePercentage =
    maximumScore > 0
      ? Math.round((totalScore / maximumScore) * 100)
      : 0;

  const modeLabel =
    mode === "equipe"
      ? selectedTeam?.name || "Atendimento em equipe"
      : "Operação individual";

  async function ensureAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  async function playRingPulse() {
    if (!soundEnabled) {
      return;
    }

    const context = await ensureAudioContext();

    if (!context) {
      return;
    }

    const playTone = (
      frequency: number,
      startOffset: number
    ) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = context.currentTime + startOffset;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        frequency,
        startAt
      );

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(
        0.12,
        startAt + 0.025
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + 0.25
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + 0.27);
    };

    playTone(620, 0);
    playTone(760, 0.34);
  }

  function clearMessageTimer() {
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
  }

  function scheduleCustomerMessage(
    text: string,
    delay: number
  ) {
    clearMessageTimer();
    setIsCustomerSpeaking(true);

    messageTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `cliente-${Date.now()}`,
          author: "cliente",
          text,
          time: currentTime(),
        },
      ]);

      setIsCustomerSpeaking(false);
      messageTimerRef.current = null;
    }, delay);
  }

  async function loadBaseData(
    filter = difficultyFilter
  ) {
    try {
      setIsLoading(true);
      setError("");

      const session = getSession() as any;
      const profileId = session?.profileId ?? session?.id;

      if (!profileId) {
        setError(
          "Sessão do aluno não encontrada. Faça login novamente."
        );
        return;
      }

      const studentData =
        await getStudentByProfileId(profileId);

      if (!studentData) {
        setError(
          "Cadastro de aluno não encontrado para este usuário."
        );
        return;
      }

      const query =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;

      const scenarioFromUrl = query?.get("scenario") ?? null;
      const assignmentFromUrl =
        query?.get("assignment") ?? null;

      const scenarioData =
        await getAvailableScenariosForStudent(
          "telemarketing",
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
          : "Não foi possível carregar a central."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBaseData();

    return () => {
      clearMessageTimer();

      if (ringIntervalRef.current !== null) {
        window.clearInterval(ringIntervalRef.current);
      }

      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (phase !== "waiting") {
      return;
    }

    if (queueSeconds <= 0) {
      setPhase("ringing");
      return;
    }

    const timer = window.setTimeout(() => {
      setQueueSeconds((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phase, queueSeconds]);

  useEffect(() => {
    if (phase !== "ringing" || !soundEnabled) {
      if (ringIntervalRef.current !== null) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }

      return;
    }

    playRingPulse();

    ringIntervalRef.current = window.setInterval(
      playRingPulse,
      1900
    );

    return () => {
      if (ringIntervalRef.current !== null) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [phase, soundEnabled]);

  useEffect(() => {
    if (phase !== "active" && phase !== "feedback") {
      return;
    }

    const timer = window.setInterval(() => {
      setCallSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const transcript = transcriptRef.current;

    if (!transcript) {
      return;
    }

    const timer = window.setTimeout(() => {
      transcript.scrollTop = transcript.scrollHeight;
    }, 60);

    return () => window.clearTimeout(timer);
  }, [messages, isCustomerSpeaking]);

  async function handleDifficultyChange(value: string) {
    setDifficultyFilter(value);
    setSelectedScenarioId("");
    setPhase("setup");
    setScenarioDetails(null);

    await loadBaseData(value);
  }

  function chooseQueueScenario() {
    if (requestedScenarioId) {
      return requestedScenarioId;
    }

    if (selectedScenarioId) {
      return selectedScenarioId;
    }

    if (scenarios.length === 0) {
      return "";
    }

    return scenarios[
      randomBetween(0, scenarios.length - 1)
    ].id;
  }

  async function prepareCall(
    preferredScenarioId?: string
  ) {
    try {
      setIsPreparing(true);
      setError("");
      setTrailAdvanced(false);

      if (mode === "equipe" && !selectedTeamId) {
        setError(
          "Selecione uma equipe antes de iniciar o turno."
        );
        return;
      }

      const scenarioId =
        preferredScenarioId || chooseQueueScenario();

      if (!scenarioId) {
        setError(
          "Nenhum cenário de Telemarketing está disponível."
        );
        return;
      }

      await ensureAudioContext();

      const details =
        await getSimulationScenarioDetails(scenarioId);

      if (details.steps.length === 0) {
        setError(
          "Este cenário ainda não possui etapas cadastradas."
        );
        return;
      }

      clearMessageTimer();

      setSelectedScenarioId(scenarioId);
      setScenarioDetails(details);
      setMessages([]);

      answersRef.current = [];
      totalScoreRef.current = 0;
      maximumScoreRef.current = 0;

      setAnswers([]);
      setTotalScore(0);
      setMaximumScore(0);
      setCurrentStepIndex(0);
      setCallSeconds(0);
      setFeedback(null);
      setEvaluation(null);
      setIsCustomerSpeaking(false);

      setQueueSeconds(
        assignmentId
          ? randomBetween(2, 5)
          : randomBetween(5, 14)
      );

      setPhase("waiting");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível preparar a chamada."
      );
    } finally {
      setIsPreparing(false);
    }
  }

  function answerCall() {
    if (!scenarioDetails?.steps[0]) {
      return;
    }

    if (ringIntervalRef.current !== null) {
      window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }

    setPhase("active");
    setCallSeconds(0);

    scheduleCustomerMessage(
      scenarioDetails.steps[0].customer_message,
      randomBetween(850, 1900)
    );
  }

  function handleSelectOption(optionId: string) {
    if (
      phase !== "active" ||
      !currentStep ||
      !scenarioDetails ||
      isCustomerSpeaking
    ) {
      return;
    }

    const option = currentStep.options.find(
      (item) => item.id === optionId
    );

    if (!option) {
      return;
    }

    const stepMaximum = Math.max(
      ...currentStep.options.map((item) =>
        Number(item.score ?? 0)
      ),
      1
    );

    const score = Number(option.score ?? 0);

    const technicalFeedback = getTechnicalFeedback({
      moduleSlug: "telemarketing",
      score,
      technicalFocus: scenarioDetails.technical_focus,
      learningObjective:
        scenarioDetails.learning_objective,
      sourceLesson: scenarioDetails.source_lesson,
    });

    const feedbackText = option.feedback
      ? `${option.feedback}\n\n${technicalFeedback}`
      : technicalFeedback;

    const quality = feedbackQuality(score, stepMaximum);

    const answer: SimulationAnswerInput = {
      stepId: currentStep.id,
      optionId: option.id,
      score,
      feedback: feedbackText,
    };

    setMessages((current) => [
      ...current,
      {
        id: `operador-${option.id}-${Date.now()}`,
        author: "operador",
        text: option.option_text,
        time: currentTime(),
      },
    ]);

    const nextAnswers = [
      ...answersRef.current,
      answer,
    ];

    const nextTotalScore =
      totalScoreRef.current + score;

    const nextMaximumScore =
      maximumScoreRef.current + stepMaximum;

    answersRef.current = nextAnswers;
    totalScoreRef.current = nextTotalScore;
    maximumScoreRef.current = nextMaximumScore;

    setAnswers(nextAnswers);
    setTotalScore(nextTotalScore);
    setMaximumScore(nextMaximumScore);

    setFeedback({
      ...quality,
      text: feedbackText,
      score,
    });

    setPhase("feedback");
  }

  async function finishCall() {
    if (
      !scenarioDetails ||
      !student ||
      answersRef.current.length === 0
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      /*
       * O banco recebe a nota normalizada em percentual.
       * O painel mostra os pontos acumulados em tempo real.
       */
      const finalPercentage =
        maximumScoreRef.current > 0
          ? Math.round(
              (totalScoreRef.current /
                maximumScoreRef.current) *
                100
            )
          : 0;

      await saveSimulationResult({
        scenarioId: scenarioDetails.id,
        studentId: student.id,
        classId:
          mode === "equipe"
            ? selectedTeam?.class_id ?? student.class_id
            : student.class_id,
        teamId:
          mode === "equipe"
            ? selectedTeam?.id
            : undefined,
        moduleSlug: "telemarketing",
        mode,
        assignmentId,
        totalScore: finalPercentage,
        answers: answersRef.current,
      });

      if (mode === "individual") {
        const advanced =
          await advanceStudentTrailIfNeeded(
            student,
            finalPercentage
          );

        setTrailAdvanced(advanced);
      }

      const percentage =
        maximumScoreRef.current > 0
          ? Math.round(
              (totalScoreRef.current /
                maximumScoreRef.current) *
                100
            )
          : 0;

      setEvaluation(
        buildCustomerEvaluation(percentage)
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

  function continueAfterFeedback() {
    setFeedback(null);

    if (
      !scenarioDetails ||
      currentStepIndex + 1 >=
        scenarioDetails.steps.length
    ) {
      finishCall();
      return;
    }

    const nextIndex = currentStepIndex + 1;
    const nextStep = scenarioDetails.steps[nextIndex];

    setCurrentStepIndex(nextIndex);
    setPhase("active");

    scheduleCustomerMessage(
      nextStep.customer_message,
      randomBetween(1000, 2400)
    );
  }

  async function prepareNextRandomCall() {
    if (scenarios.length === 0) {
      setPhase("setup");
      return;
    }

    const alternatives = scenarios.filter(
      (scenario) =>
        scenario.id !== scenarioDetails?.id
    );

    const source =
      alternatives.length > 0
        ? alternatives
        : scenarios;

    const nextScenario =
      source[randomBetween(0, source.length - 1)];

    await prepareCall(nextScenario.id);
  }

  function endShift() {
    clearMessageTimer();

    setPhase("setup");
    setScenarioDetails(null);
    setMessages([]);

    answersRef.current = [];
    totalScoreRef.current = 0;
    maximumScoreRef.current = 0;

    setAnswers([]);
    setTotalScore(0);
    setMaximumScore(0);
    setCurrentStepIndex(0);
    setCallSeconds(0);
    setFeedback(null);
    setEvaluation(null);
    setIsCustomerSpeaking(false);
    setError("");
  }

  function renderSetup() {
    return (
      <div className={styles.setupScreen}>
        <div className={styles.heroCard}>
          <div className={styles.heroIcon}>
            <svg
              width="45"
              height="45"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 13V11a8 8 0 0 1 16 0v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M5 12h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2v-4a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M19 12h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a2 2 0 0 0 2-2v-4a1 1 0 0 0-1-1Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M16 19c-.7 1-1.9 1.5-3.5 1.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className={styles.waitingLabel}>
            Central de atendimento
          </p>

          <h1 className={styles.heroTitle}>
            Prepare-se para atender clientes reais.
          </h1>

          <p className={styles.heroText}>
            Ao iniciar o turno, as chamadas chegarão
            em intervalos diferentes. Ouça o cliente,
            analise a necessidade e conduza o atendimento
            até uma solução.
          </p>

          {error && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}

          <div className={styles.heroActions}>
            <button
              type="button"
              onClick={() => prepareCall()}
              disabled={
                isLoading ||
                isPreparing ||
                scenarios.length === 0
              }
              className={styles.primaryButton}
            >
              {isLoading
                ? "Carregando central..."
                : isPreparing
                  ? "Preparando fila..."
                  : "Iniciar turno"}
            </button>

            <Link
              href="/aluno/simulacoes"
              className={styles.secondaryButton}
              style={{
                width: "auto",
                minHeight: 46,
                padding: "0 20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
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
      <div className={styles.waitingScreen}>
        <div>
          <div className={styles.waitingOrb}>
            <span className={styles.countdown}>
              {queueSeconds}
            </span>
          </div>

          <p className={styles.waitingLabel}>
            Aguardando nova chamada
          </p>

          <p className={styles.waitingText}>
            Você está disponível na fila de atendimento.
          </p>
        </div>
      </div>
    );
  }

  function renderRinging() {
    return (
      <div className={styles.ringingScreen}>
        <div className={styles.incomingCard}>
          <span className={styles.incomingBadge}>
            Chamada recebida
          </span>

          <div
            className={styles.callerAvatar}
            style={{
              background:
                avatarBackground(customerName),
            }}
          >
            {getInitials(customerName)}
          </div>

          <h2 className={styles.callerName}>
            {customerName}
          </h2>

          <p className={styles.callerReason}>
            {scenarioDetails?.title ||
              "Cliente aguardando atendimento"}
          </p>

          <div className={styles.callActions}>
            <button
              type="button"
              onClick={answerCall}
              className={styles.answerButton}
            >
              Atender chamada
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderCall() {
    return (
      <div className={styles.centerStage}>
        <header className={styles.callHeader}>
          <div className={styles.customerIdentity}>
            <div
              className={styles.smallAvatar}
              style={{
                background:
                  avatarBackground(customerName),
              }}
            >
              {getInitials(customerName)}
            </div>

            <div>
              <p className={styles.customerName}>
                {customerName}
              </p>

              <p className={styles.customerProfile}>
                {scenarioDetails?.customer_profile ||
                  "Cliente em atendimento"}
              </p>
            </div>
          </div>

          <div className={styles.callHeaderMetrics}>
            <span className={styles.callBadge}>
              Ligação ativa
            </span>

            <span className={styles.callBadge}>
              {formatClock(callSeconds)}
            </span>

            <span className={styles.callBadge}>
              Etapa {currentStepIndex + 1}/
              {scenarioDetails?.steps.length ?? 0}
            </span>
          </div>
        </header>

        <div
          ref={transcriptRef}
          className={styles.transcript}
        >
          <div className={styles.transcriptInner}>
            <div className={styles.transcriptDate}>
              Transcrição da chamada
            </div>

            {messages.map((message) => {
              const operator =
                message.author === "operador";

              return (
                <div
                  key={message.id}
                  className={`${styles.messageRow} ${
                    operator
                      ? styles.messageRowOperator
                      : styles.messageRowCustomer
                  }`}
                >
                  <div className={styles.messageBlock}>
                    <p
                      className={`${styles.messageAuthor} ${
                        operator
                          ? styles.messageAuthorOperator
                          : ""
                      }`}
                    >
                      {operator
                        ? mode === "equipe"
                          ? selectedTeam?.name || "Equipe"
                          : "Você"
                        : customerName}
                    </p>

                    <div
                      className={`${styles.messageBubble} ${
                        operator
                          ? styles.operatorBubble
                          : styles.customerBubble
                      }`}
                    >
                      {message.text}
                    </div>

                    <p
                      className={`${styles.messageTime} ${
                        operator
                          ? styles.messageTimeOperator
                          : ""
                      }`}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
              );
            })}

            {isCustomerSpeaking && (
              <div className={styles.speakingIndicator}>
                <div className={styles.voiceBars}>
                  <span />
                  <span />
                  <span />
                </div>

                {customerName} está falando...
              </div>
            )}
          </div>
        </div>

        <footer className={styles.callFooter}>
          <span className={styles.callFooterText}>
            Linha protegida • atendimento em andamento
          </span>

          <span className={styles.callFooterText}>
            Pontuação acumulada: {totalScore} pts
          </span>
        </footer>

        {phase === "feedback" && feedback && (
          <div className={styles.feedbackOverlay}>
            <div className={styles.feedbackCard}>
              <div className={styles.feedbackHeader}>
                <div>
                  <p className={styles.feedbackEyebrow}>
                    Pausa pedagógica
                  </p>

                  <h2 className={styles.feedbackTitle}>
                    {feedback.title}
                  </h2>
                </div>

                <div className={styles.feedbackScore}>
                  <strong>+{feedback.score}</strong>
                  <span>nesta resposta</span>
                </div>
              </div>

              <div className={styles.feedbackBody}>
                <span
                  className={`${styles.feedbackStatus} ${
                    feedback.status === "excellent"
                      ? styles.feedbackExcellent
                      : feedback.status === "partial"
                        ? styles.feedbackPartial
                        : styles.feedbackWeak
                  }`}
                >
                  {feedback.statusLabel}
                </span>

                <p className={styles.feedbackText}>
                  {feedback.text}
                </p>

                <div className={styles.scoreSummary}>
                  <div>
                    <span>Pontuação acumulada</span>
                    <strong>{totalScore} pontos</strong>
                  </div>

                  <div>
                    <span>Desempenho atual</span>
                    <strong>
                      {maximumScore > 0
                        ? Math.round(
                            (totalScore / maximumScore) *
                              100
                          )
                        : 0}
                      %
                    </strong>
                  </div>
                </div>

                <div className={styles.feedbackGrid}>
                  <div className={styles.feedbackInsight}>
                    <p
                      className={
                        styles.feedbackInsightLabel
                      }
                    >
                      Impacto no cliente
                    </p>

                    <p
                      className={
                        styles.feedbackInsightText
                      }
                    >
                      {feedback.impact}
                    </p>
                  </div>

                  <div className={styles.feedbackInsight}>
                    <p
                      className={
                        styles.feedbackInsightLabel
                      }
                    >
                      Próxima conduta
                    </p>

                    <p
                      className={
                        styles.feedbackInsightText
                      }
                    >
                      {feedback.nextAction}
                    </p>
                  </div>
                </div>

                <div className={styles.feedbackActions}>
                  <button
                    type="button"
                    onClick={continueAfterFeedback}
                    disabled={isSaving}
                    className={styles.primaryButton}
                  >
                    {isSaving
                      ? "Salvando atendimento..."
                      : currentStepIndex + 1 >=
                          (scenarioDetails?.steps.length ??
                            0)
                        ? "Finalizar atendimento"
                        : "Continuar atendimento"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderCompleted() {
    if (!evaluation) {
      return null;
    }

    return (
      <div className={styles.completedScreen}>
        <div className={styles.evaluationCard}>
          <div className={styles.evaluationHeader}>
            <div>
              <p className={styles.feedbackEyebrow}>
                Pesquisa pós-atendimento
              </p>

              <h2 className={styles.evaluationTitle}>
                Avaliação do cliente
              </h2>

              <p className={styles.evaluationSubtitle}>
                Resultado percebido após o encerramento
                da chamada.
              </p>
            </div>

            <div className={styles.stars}>
              {"★".repeat(evaluation.stars)}
              {"☆".repeat(5 - evaluation.stars)}
            </div>
          </div>

          <div className={styles.evaluationBody}>
            <div className={styles.customerComment}>
              {evaluation.comment}
            </div>

            <div className={styles.evaluationGrid}>
              <div className={styles.evaluationMetric}>
                <p
                  className={
                    styles.evaluationMetricLabel
                  }
                >
                  Satisfação
                </p>

                <p
                  className={
                    styles.evaluationMetricValue
                  }
                >
                  {evaluation.satisfaction}
                </p>
              </div>

              <div className={styles.evaluationMetric}>
                <p
                  className={
                    styles.evaluationMetricLabel
                  }
                >
                  Resolução
                </p>

                <p
                  className={
                    styles.evaluationMetricValue
                  }
                >
                  {evaluation.outcome}
                </p>
              </div>

              <div className={styles.evaluationMetric}>
                <p
                  className={
                    styles.evaluationMetricLabel
                  }
                >
                  Desempenho
                </p>

                <p
                  className={
                    styles.evaluationMetricValue
                  }
                >
                  {evaluation.percentage}%
                </p>
              </div>

              <div className={styles.evaluationMetric}>
                <p
                  className={
                    styles.evaluationMetricLabel
                  }
                >
                  Duração
                </p>

                <p
                  className={
                    styles.evaluationMetricValue
                  }
                >
                  {formatClock(callSeconds)}
                </p>
              </div>
            </div>

            {trailAdvanced && (
              <div className={styles.errorBox}>
                Novo nível da trilha liberado. Excelente
                evolução!
              </div>
            )}

            {error && (
              <div className={styles.errorBox}>
                {error}
              </div>
            )}

            <div className={styles.evaluationActions}>
              {assignmentId ? (
                <Link
                  href="/aluno/atividades"
                  className={styles.primaryButton}
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Voltar às atividades
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={prepareNextRandomCall}
                  className={styles.primaryButton}
                >
                  Aguardar próxima chamada
                </button>
              )}

              <button
                type="button"
                onClick={endShift}
                className={styles.secondaryButton}
                style={{
                  width: "auto",
                  padding: "0 18px",
                }}
              >
                Encerrar turno
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderMain() {
    if (phase === "setup") return renderSetup();
    if (phase === "waiting") return renderWaiting();
    if (phase === "ringing") return renderRinging();
    if (phase === "completed") return renderCompleted();

    return renderCall();
  }

  return (
    <main className={styles.shell}>
      <section className={styles.frame}>
        <header className={styles.topbar}>
          <div className={styles.brandArea}>
            <div className={styles.brandMark}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8.5 4.5 10 8l-2 1.5a13 13 0 0 0 6.5 6.5L16 14l3.5 1.5v3c0 .8-.7 1.5-1.5 1.5C10.3 20 4 13.7 4 6c0-.8.7-1.5 1.5-1.5h3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <p className={styles.brandTitle}>
                Prática+ Command Center
              </p>

              <p className={styles.brandSubtitle}>
                Operação de Telemarketing
              </p>
            </div>
          </div>

          <div className={styles.topMetrics}>
            <div className={styles.metricPill}>
              <span className={styles.liveDot} />
              <div>
                <div className={styles.metricLabel}>
                  Operação
                </div>
                <div className={styles.metricValue}>
                  Online
                </div>
              </div>
            </div>

            <div className={styles.metricPill}>
              <div>
                <div className={styles.metricLabel}>
                  Modalidade
                </div>
                <div className={styles.metricValue}>
                  {mode === "equipe"
                    ? "Equipe"
                    : "Individual"}
                </div>
              </div>
            </div>

            <div className={styles.metricPill}>
              <div>
                <div className={styles.metricLabel}>
                  Pontuação
                </div>
                <div className={styles.metricValue}>
                  {totalScore} pts
                </div>
              </div>
            </div>

            <div className={styles.metricPill}>
              <div>
                <div className={styles.metricLabel}>
                  Chamada
                </div>
                <div className={styles.metricValue}>
                  {formatClock(callSeconds)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.leftPanel}>
            <section className={styles.panelSection}>
              <div className={styles.operatorCard}>
                <div className={styles.operatorAvatar}>
                  {mode === "equipe" ? "EQ" : "OP"}
                </div>

                <div>
                  <p className={styles.operatorName}>
                    {modeLabel}
                  </p>

                  <p className={styles.operatorStatus}>
                    ● Disponível para atendimento
                  </p>
                </div>
              </div>
            </section>

            {mode === "equipe" && (
              <section className={styles.panelSection}>
                <p className={styles.sectionEyebrow}>
                  Célula de atendimento
                </p>

                <div className={styles.fieldGroup}>
                  <label className={styles.controlLabel}>
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
                        Nenhuma equipe encontrada
                      </option>
                    ) : (
                      teams.map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                        >
                          {team.name} • {team.role || "Integrante"}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </section>
            )}

            <section className={styles.panelSection}>
              <p className={styles.sectionEyebrow}>
                Configuração da fila
              </p>

              {student?.simulation_access_mode ===
              "livre" ? (
                <div className={styles.fieldGroup}>
                  <label className={styles.controlLabel}>
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
                        {difficultyLabel(difficulty)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className={styles.queueMetric}>
                  <div className={styles.miniMetric}>
                    <p
                      className={
                        styles.miniMetricLabel
                      }
                    >
                      Trilha
                    </p>

                    <p
                      className={
                        styles.miniMetricValue
                      }
                    >
                      Nível{" "}
                      {student?.trail_unlocked_level ??
                        1}
                    </p>
                  </div>

                  <div className={styles.miniMetric}>
                    <p
                      className={
                        styles.miniMetricLabel
                      }
                    >
                      Cenários
                    </p>

                    <p
                      className={
                        styles.miniMetricValue
                      }
                    >
                      {scenarios.length}
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.controlLabel}>
                  Cenário preferencial
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
                    Boolean(requestedScenarioId)
                  }
                  className={styles.control}
                >
                  {requestedScenarioId &&
                    !scenarios.some(
                      (scenario) =>
                        scenario.id ===
                        requestedScenarioId
                    ) && (
                      <option
                        value={requestedScenarioId}
                      >
                        Atividade direcionada
                      </option>
                    )}

                  {scenarios.map((scenario) => (
                    <option
                      key={scenario.id}
                      value={scenario.id}
                    >
                      {scenario.title}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className={styles.panelSection}>
              <p className={styles.sectionEyebrow}>
                Áudio e operação
              </p>

              <div className={styles.fieldGroup}>
                <button
                  type="button"
                  onClick={() =>
                    setSoundEnabled((current) => !current)
                  }
                  className={styles.soundButton}
                >
                  {soundEnabled
                    ? "🔊 Toque ativado"
                    : "🔇 Toque desativado"}
                </button>
              </div>

              <div className={styles.fieldGroup}>
                <button
                  type="button"
                  onClick={endShift}
                  className={styles.dangerButton}
                >
                  Encerrar turno
                </button>
              </div>
            </section>
          </aside>

          <section className={styles.mainPanel}>
            {renderMain()}
          </section>

          <aside className={styles.rightPanel}>
            <div className={styles.rightHeader}>
              <p className={styles.rightTitle}>
                Respostas do operador
              </p>

              <p className={styles.rightSubtitle}>
                Analise a fala do cliente antes de
                escolher sua próxima abordagem.
              </p>
            </div>

            <div className={styles.optionsArea}>
              {phase === "active" &&
              currentStep &&
              !isCustomerSpeaking ? (
                currentStep.options.map(
                  (option, index) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleSelectOption(option.id)
                      }
                      className={styles.optionButton}
                    >
                      <span
                        className={styles.optionNumber}
                      >
                        {index + 1}
                      </span>

                      <span
                        className={styles.optionText}
                      >
                        {option.option_text}
                      </span>
                    </button>
                  )
                )
              ) : (
                <div className={styles.placeholderBox}>
                  <p className={styles.placeholderTitle}>
                    {phase === "feedback"
                      ? "Leia o feedback antes de continuar"
                      : phase === "ringing"
                        ? "Atenda a chamada"
                        : phase === "waiting"
                          ? "Aguardando cliente"
                          : isCustomerSpeaking
                            ? "Cliente está falando"
                            : "Inicie seu turno"}
                  </p>

                  <p className={styles.placeholderText}>
                    As opções de resposta aparecerão
                    aqui no momento correto.
                  </p>
                </div>
              )}
            </div>

            <div className={styles.intelligence}>
              <p className={styles.sectionEyebrow}>
                Inteligência da chamada
              </p>

              <div className={styles.infoRow}>
                <p className={styles.infoLabel}>
                  Motivo do contato
                </p>

                <p className={styles.infoValue}>
                  {scenarioDetails?.title ||
                    "Aguardando chamada"}
                </p>
              </div>

              <div className={styles.infoRow}>
                <p className={styles.infoLabel}>
                  Perfil do cliente
                </p>

                <p className={styles.infoValue}>
                  {scenarioDetails?.customer_profile ||
                    "Será exibido quando a ligação chegar."}
                </p>
              </div>

              <div className={styles.infoRow}>
                <p className={styles.infoLabel}>
                  Foco técnico
                </p>

                <p className={styles.infoValue}>
                  {scenarioDetails?.technical_focus ||
                    "Escuta ativa, clareza e resolução."}
                </p>
              </div>

              <div className={styles.infoRow}>
                <p className={styles.infoLabel}>
                  Dificuldade
                </p>

                <p className={styles.infoValue}>
                  {scenarioDetails
                    ? difficultyLabel(
                        scenarioDetails.difficulty
                      )
                    : "Não definida"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}


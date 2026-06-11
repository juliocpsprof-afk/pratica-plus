import { supabase } from "@/lib/supabase/client";
import { saveCompetencyScores } from "@/services/competencies.service";

export type StudentByProfile = {
  id: string;
  profile_id: string;
  course_id: string | null;
  class_id: string | null;
};

export type SimulationScenario = {
  id: string;
  title: string;
  description: string;
  difficulty: "facil" | "medio" | "dificil";
  customer_name: string | null;
  customer_profile: string | null;
  modules?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type SimulationStep = {
  id: string;
  scenario_id: string;
  step_order: number;
  customer_message: string;
  context_note: string | null;
};

export type SimulationOption = {
  id: string;
  step_id: string;
  option_text: string;
  is_best_option: boolean;
  score: number;
  feedback: string | null;
};

export type SimulationScenarioDetails = SimulationScenario & {
  step: SimulationStep | null;
  options: SimulationOption[];
};

export type StudentTeam = {
  team_id: string;
  team_name: string;
  class_id: string | null;
  role_name: string | null;
};

export type SaveSimulationResultInput = {
  scenarioId: string;
  studentId: string;
  classId: string | null;
  teamId?: string | null;
  mode: "individual" | "equipe";
  stepId: string;
  optionId: string;
  score: number;
  moduleSlug: "telemarketing" | "vendas";
};

export type StudentSimulationHistoryRow = {
  id: string;
  scenario_id: string | null;
  student_id: string | null;
  team_id: string | null;
  class_id: string | null;
  mode: string;
  status: string;
  total_score: number;
  started_at: string;
  finished_at: string | null;
  scenarios?: {
    title: string;
    difficulty: string;
    modules?: {
      name: string;
      slug: string;
    } | null;
  } | null;
  teams?: {
    name: string;
  } | null;
};

export async function getStudentByProfileId(
  profileId: string
): Promise<StudentByProfile | null> {
  const { data, error } = await supabase
    .from("students")
    .select("id, profile_id, course_id, class_id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getStudentTeams(studentId: string): Promise<StudentTeam[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(`
      team_id,
      role_name,
      teams (
        id,
        name,
        class_id
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    team_id: item.team_id,
    team_name: item.teams?.name ?? "Equipe",
    class_id: item.teams?.class_id ?? null,
    role_name: item.role_name ?? null,
  }));
}

export async function getActiveScenariosByModuleSlug(
  moduleSlug: "telemarketing" | "vendas"
): Promise<SimulationScenario[]> {
  const { data, error } = await supabase
    .from("scenarios")
    .select(`
      id,
      title,
      description,
      difficulty,
      customer_name,
      customer_profile,
      modules!inner (
        id,
        name,
        slug
      )
    `)
    .eq("is_active", true)
    .eq("modules.slug", moduleSlug)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SimulationScenario[];
}

export async function getSimulationScenarioDetails(
  scenarioId: string
): Promise<SimulationScenarioDetails | null> {
  const { data: scenarioData, error: scenarioError } = await supabase
    .from("scenarios")
    .select(`
      id,
      title,
      description,
      difficulty,
      customer_name,
      customer_profile,
      modules (
        id,
        name,
        slug
      )
    `)
    .eq("id", scenarioId)
    .single();

  if (scenarioError) {
    throw new Error(scenarioError.message);
  }

  const { data: stepsData, error: stepsError } = await supabase
    .from("scenario_steps")
    .select("id, scenario_id, step_order, customer_message, context_note")
    .eq("scenario_id", scenarioId)
    .order("step_order", { ascending: true })
    .limit(1);

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  const step = (stepsData?.[0] ?? null) as SimulationStep | null;

  if (!step) {
    return {
      ...(scenarioData as SimulationScenario),
      step: null,
      options: [],
    };
  }

  const { data: optionsData, error: optionsError } = await supabase
    .from("scenario_options")
    .select("id, step_id, option_text, is_best_option, score, feedback")
    .eq("step_id", step.id)
    .order("score", { ascending: false });

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  return {
    ...(scenarioData as SimulationScenario),
    step,
    options: (optionsData ?? []) as SimulationOption[],
  };
}

export async function saveSimulationResult(
  input: SaveSimulationResultInput
): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase
    .from("simulation_sessions")
    .insert({
      scenario_id: input.scenarioId,
      student_id: input.studentId,
      team_id: input.teamId ?? null,
      class_id: input.classId,
      mode: input.mode,
      status: "finalizada",
      total_score: input.score,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const { error: answerError } = await supabase
    .from("simulation_answers")
    .insert({
      session_id: sessionData.id,
      step_id: input.stepId,
      option_id: input.optionId,
      student_id: input.studentId,
      score: input.score,
    });

  if (answerError) {
    throw new Error(answerError.message);
  }

  await saveCompetencyScores({
    studentId: input.studentId,
    simulationSessionId: sessionData.id,
    moduleSlug: input.moduleSlug,
    baseScore: input.score,
  });

  return sessionData.id;
}

export async function getStudentSimulationHistory(
  studentId: string
): Promise<StudentSimulationHistoryRow[]> {
  const { data, error } = await supabase
    .from("simulation_sessions")
    .select(`
      id,
      scenario_id,
      student_id,
      team_id,
      class_id,
      mode,
      status,
      total_score,
      started_at,
      finished_at,
      scenarios (
        title,
        difficulty,
        modules (
          name,
          slug
        )
      ),
      teams (
        name
      )
    `)
    .eq("student_id", studentId)
    .order("started_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StudentSimulationHistoryRow[];
}

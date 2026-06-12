import { supabase } from "@/lib/supabase/client";

export type StudentAccessMode = "livre" | "trilha";

export type StudentByProfile = {
  id: string;
  profile_id: string;
  course_id: string | null;
  class_id: string | null;
  enrollment_status: string;
  simulation_access_mode: StudentAccessMode;
  free_allowed_difficulties: string[];
  trail_current_level: number;
  trail_unlocked_level: number;
  trail_min_score_to_advance: number;
  pedagogical_notes: string | null;
};

export type SimulationModule = {
  id: string;
  name: string;
  slug: string;
};

export type SimulationScenario = {
  id: string;
  title: string;
  description: string | null;
  module_id: string;
  difficulty: "facil" | "medio" | "dificil";
  customer_name: string | null;
  customer_profile: string | null;
  is_active: boolean;
  track_level: number;
  track_order: number;
  learning_objective: string | null;
  technical_focus: string | null;
  source_lesson: string | null;
  modules?: SimulationModule | null;
};

export type SimulationOption = {
  id: string;
  step_id: string;
  option_text: string;
  is_best_option: boolean;
  score: number;
  feedback: string | null;
};

export type SimulationStep = {
  id: string;
  scenario_id: string;
  step_order: number;
  customer_message: string;
  context_note: string | null;
  options: SimulationOption[];
};

export type SimulationScenarioDetails = SimulationScenario & {
  steps: SimulationStep[];
};

export type SimulationAnswerInput = {
  stepId: string;
  optionId: string;
  score: number;
  feedback: string;
};

export type SaveSimulationResultInput = {
  scenarioId: string;
  studentId: string;
  classId: string | null;
  teamId?: string | null;
  moduleSlug: string;
  mode: "individual" | "equipe";
  totalScore: number;
  answers: SimulationAnswerInput[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function getStudentByProfileId(
  profileId: string
): Promise<StudentByProfile | null> {
  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      profile_id,
      course_id,
      class_id,
      enrollment_status,
      simulation_access_mode,
      free_allowed_difficulties,
      trail_current_level,
      trail_unlocked_level,
      trail_min_score_to_advance,
      pedagogical_notes
    `)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    simulation_access_mode: data.simulation_access_mode ?? "livre",
    free_allowed_difficulties: data.free_allowed_difficulties?.length
      ? data.free_allowed_difficulties
      : ["facil", "medio", "dificil"],
    trail_current_level: data.trail_current_level ?? 1,
    trail_unlocked_level: data.trail_unlocked_level ?? 1,
    trail_min_score_to_advance: data.trail_min_score_to_advance ?? 70,
  } as StudentByProfile;
}

export async function getModuleBySlug(
  moduleSlug: string
): Promise<SimulationModule | null> {
  const { data, error } = await supabase
    .from("modules")
    .select("id, name, slug")
    .eq("slug", moduleSlug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as SimulationModule | null;
}

export async function getAvailableScenariosForStudent(
  moduleSlug: string,
  student: StudentByProfile,
  difficultyFilter: string
): Promise<SimulationScenario[]> {
  const moduleData = await getModuleBySlug(moduleSlug);

  if (!moduleData) {
    return [];
  }

  let query = supabase
    .from("scenarios")
    .select(`
      id,
      title,
      description,
      module_id,
      difficulty,
      customer_name,
      customer_profile,
      is_active,
      track_level,
      track_order,
      learning_objective,
      technical_focus,
      source_lesson,
      modules (
        id,
        name,
        slug
      )
    `)
    .eq("module_id", moduleData.id)
    .eq("is_active", true);

  if (student.simulation_access_mode === "trilha") {
    query = query.lte("track_level", student.trail_unlocked_level);
  } else {
    const allowed = student.free_allowed_difficulties?.length
      ? student.free_allowed_difficulties
      : ["facil", "medio", "dificil"];

    query = query.in("difficulty", allowed);

    if (difficultyFilter !== "todos" && allowed.includes(difficultyFilter)) {
      query = query.eq("difficulty", difficultyFilter);
    }
  }

  const { data, error } = await query
    .order("track_level", { ascending: true })
    .order("track_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows.map((row) => ({
    ...row,
    track_level: row.track_level ?? 1,
    track_order: row.track_order ?? 1,
    modules: one(row.modules),
  })) as SimulationScenario[];
}

export async function getSimulationScenarioDetails(
  scenarioId: string
): Promise<SimulationScenarioDetails> {
  const { data: scenarioData, error: scenarioError } = await supabase
    .from("scenarios")
    .select(`
      id,
      title,
      description,
      module_id,
      difficulty,
      customer_name,
      customer_profile,
      is_active,
      track_level,
      track_order,
      learning_objective,
      technical_focus,
      source_lesson,
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
    .select(`
      id,
      scenario_id,
      step_order,
      customer_message,
      context_note
    `)
    .eq("scenario_id", scenarioId)
    .order("step_order", { ascending: true });

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  const stepIds = (stepsData ?? []).map((step) => step.id);

  let optionsByStep = new Map<string, SimulationOption[]>();

  if (stepIds.length > 0) {
    const { data: optionsData, error: optionsError } = await supabase
      .from("scenario_options")
      .select(`
        id,
        step_id,
        option_text,
        is_best_option,
        score,
        feedback
      `)
      .in("step_id", stepIds);

    if (optionsError) {
      throw new Error(optionsError.message);
    }

    for (const option of (optionsData ?? []) as SimulationOption[]) {
      const current = optionsByStep.get(option.step_id) ?? [];
      current.push(option);
      optionsByStep.set(option.step_id, current);
    }
  }

  const steps = ((stepsData ?? []) as any[]).map((step) => ({
    ...step,
    options: shuffle(optionsByStep.get(step.id) ?? []),
  })) as SimulationStep[];

  return {
    ...(scenarioData as any),
    track_level: scenarioData.track_level ?? 1,
    track_order: scenarioData.track_order ?? 1,
    modules: one((scenarioData as any).modules),
    steps,
  } as SimulationScenarioDetails;
}

export async function saveSimulationResult(
  input: SaveSimulationResultInput
): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase
    .from("simulation_sessions")
    .insert({
      scenario_id: input.scenarioId,
      student_id: input.studentId,
      class_id: input.classId,
      team_id: input.teamId ?? null,
      module_slug: input.moduleSlug,
      mode: input.mode,
      total_score: input.totalScore,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const answersPayload = input.answers.map((answer) => ({
    session_id: sessionData.id,
    step_id: answer.stepId,
    option_id: answer.optionId,
    score: answer.score,
    feedback: answer.feedback,
    created_at: new Date().toISOString(),
  }));

  if (answersPayload.length > 0) {
    const { error: answersError } = await supabase
      .from("simulation_answers")
      .insert(answersPayload);

    if (answersError) {
      throw new Error(answersError.message);
    }
  }
}

export async function advanceStudentTrailIfNeeded(
  student: StudentByProfile,
  totalScore: number
): Promise<boolean> {
  if (student.simulation_access_mode !== "trilha") {
    return false;
  }

  if (totalScore < student.trail_min_score_to_advance) {
    return false;
  }

  const nextLevel = Math.min((student.trail_unlocked_level ?? 1) + 1, 10);

  if (nextLevel <= student.trail_unlocked_level) {
    return false;
  }

  const { error } = await supabase
    .from("students")
    .update({
      trail_current_level: nextLevel,
      trail_unlocked_level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    .eq("id", student.id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export type StudentTeam = {
  id: string;
  name: string;
  class_id: string | null;
  class_name: string;
  role: string | null;
};

export type StudentSimulationHistoryRow = {
  id: string;
  scenario_id: string | null;
  team_id: string | null;
  module_slug: string | null;
  mode: string;
  total_score: number;
  created_at: string | null;
  scenario_title: string;
  scenario_difficulty: string;
  module_name: string;
  team_name: string | null;
};

function oneSimulationRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getStudentTeams(
  studentId: string
): Promise<StudentTeam[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(`
      id,
      role,
      teams (
        id,
        name,
        class_id,
        classes (
          name
        )
      )
    `)
    .eq("student_id", studentId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows
    .map((row) => {
      const team = oneSimulationRelation(row.teams);
      const classData = oneSimulationRelation(team?.classes);

      return {
        id: team?.id ?? "",
        name: team?.name ?? "Equipe sem nome",
        class_id: team?.class_id ?? null,
        class_name: classData?.name ?? "Turma não informada",
        role: row.role ?? null,
      };
    })
    .filter((team) => Boolean(team.id));
}

export async function getStudentSimulationHistory(
  studentId: string
): Promise<StudentSimulationHistoryRow[]> {
  const { data, error } = await supabase
    .from("simulation_sessions")
    .select(`
      id,
      scenario_id,
      team_id,
      module_slug,
      mode,
      total_score,
      created_at,
      scenarios (
        title,
        difficulty,
        modules (
          name
        )
      ),
      teams (
        name
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows.map((row) => {
    const scenario = oneSimulationRelation(row.scenarios);
    const moduleData = oneSimulationRelation(scenario?.modules);
    const team = oneSimulationRelation(row.teams);

    return {
      id: row.id,
      scenario_id: row.scenario_id,
      team_id: row.team_id,
      module_slug: row.module_slug,
      mode: row.mode ?? "individual",
      total_score: Number(row.total_score ?? 0),
      created_at: row.created_at ?? null,
      scenario_title: scenario?.title ?? "Cenário não informado",
      scenario_difficulty: scenario?.difficulty ?? "não informado",
      module_name: moduleData?.name ?? row.module_slug ?? "Módulo não informado",
      team_name: team?.name ?? null,
    };
  });
}

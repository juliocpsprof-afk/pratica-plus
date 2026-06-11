import { supabase } from "@/lib/supabase/client";

export type ScenarioDifficulty = "facil" | "medio" | "dificil";
export type ScenarioType = "oficial" | "personalizado";

export type ScenarioRow = {
  id: string;
  title: string;
  description: string;
  module_id: string | null;
  scenario_type: ScenarioType;
  difficulty: ScenarioDifficulty;
  customer_name: string | null;
  customer_profile: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  modules?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type ScenarioStepRow = {
  id: string;
  scenario_id: string;
  step_order: number;
  customer_message: string;
  context_note: string | null;
  created_at: string;
};

export type ScenarioOptionRow = {
  id: string;
  step_id: string;
  option_text: string;
  is_best_option: boolean;
  score: number;
  feedback: string | null;
  created_at: string;
};

export type ScenarioDetails = ScenarioRow & {
  steps: Array<
    ScenarioStepRow & {
      options: ScenarioOptionRow[];
    }
  >;
};

export type CreateScenarioInput = {
  title: string;
  description: string;
  moduleId: string;
  difficulty: ScenarioDifficulty;
  customerName: string;
  customerProfile: string;
  customerMessage: string;
  contextNote: string;
  options: Array<{
    optionText: string;
    isBestOption: boolean;
    score: number;
    feedback: string;
  }>;
};

export async function getScenarios(): Promise<ScenarioRow[]> {
  const { data, error } = await supabase
    .from("scenarios")
    .select(`
      id,
      title,
      description,
      module_id,
      scenario_type,
      difficulty,
      customer_name,
      customer_profile,
      is_active,
      created_by,
      created_at,
      updated_at,
      modules (
        id,
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ScenarioRow[];
}

export async function createScenario(
  input: CreateScenarioInput
): Promise<void> {
  const { data: scenarioData, error: scenarioError } = await supabase
    .from("scenarios")
    .insert({
      title: input.title,
      description: input.description,
      module_id: input.moduleId,
      scenario_type: "personalizado",
      difficulty: input.difficulty,
      customer_name: input.customerName,
      customer_profile: input.customerProfile,
      is_active: true,
    })
    .select("id")
    .single();

  if (scenarioError) {
    throw new Error(scenarioError.message);
  }

  const { data: stepData, error: stepError } = await supabase
    .from("scenario_steps")
    .insert({
      scenario_id: scenarioData.id,
      step_order: 1,
      customer_message: input.customerMessage,
      context_note: input.contextNote,
    })
    .select("id")
    .single();

  if (stepError) {
    throw new Error(stepError.message);
  }

  const optionRows = input.options.map((option) => ({
    step_id: stepData.id,
    option_text: option.optionText,
    is_best_option: option.isBestOption,
    score: option.score,
    feedback: option.feedback,
  }));

  const { error: optionsError } = await supabase
    .from("scenario_options")
    .insert(optionRows);

  if (optionsError) {
    throw new Error(optionsError.message);
  }
}

export async function updateScenarioStatus(
  scenarioId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("scenarios")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scenarioId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteScenario(scenarioId: string): Promise<void> {
  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("id", scenarioId)
    .eq("scenario_type", "personalizado");

  if (error) {
    throw new Error(error.message);
  }
}

export async function getScenarioDetails(
  scenarioId: string
): Promise<ScenarioDetails | null> {
  const { data: scenarioData, error: scenarioError } = await supabase
    .from("scenarios")
    .select(`
      id,
      title,
      description,
      module_id,
      scenario_type,
      difficulty,
      customer_name,
      customer_profile,
      is_active,
      created_by,
      created_at,
      updated_at,
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
    .select("id, scenario_id, step_order, customer_message, context_note, created_at")
    .eq("scenario_id", scenarioId)
    .order("step_order", { ascending: true });

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  const steps = (stepsData ?? []) as ScenarioStepRow[];

  if (steps.length === 0) {
    return {
      ...(scenarioData as ScenarioRow),
      steps: [],
    };
  }

  const stepIds = steps.map((step) => step.id);

  const { data: optionsData, error: optionsError } = await supabase
    .from("scenario_options")
    .select("id, step_id, option_text, is_best_option, score, feedback, created_at")
    .in("step_id", stepIds);

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  const options = (optionsData ?? []) as ScenarioOptionRow[];

  return {
    ...(scenarioData as ScenarioRow),
    steps: steps.map((step) => ({
      ...step,
      options: options.filter((option) => option.step_id === step.id),
    })),
  };
}

import { supabase } from "@/lib/supabase/client";

export type ScenarioDifficulty = "facil" | "medio" | "dificil";
export type ScenarioType = "oficial" | "personalizado";

export type ScenarioOptionInput = {
  option_text: string;
  is_best_option: boolean;
  score: number;
  feedback: string;
};

export type ScenarioStepInput = {
  customer_message: string;
  context_note: string;
  options: ScenarioOptionInput[];
};

export type CreateScenarioInput = {
  module_id: string;
  title: string;
  description: string;
  difficulty: ScenarioDifficulty;
  customer_name: string;
  customer_profile: string;
  scenario_type: ScenarioType;
  track_level: number;
  track_order: number;
  learning_objective: string;
  technical_focus: string;
  source_lesson: string;
  steps: ScenarioStepInput[];
};

export type UpdateScenarioInput = CreateScenarioInput & {
  id: string;
  is_active: boolean;
};

export type ScenarioOptionRow = {
  id: string;
  step_id: string;
  option_text: string;
  is_best_option: boolean;
  score: number;
  feedback: string | null;
};

export type ScenarioStepRow = {
  id: string;
  scenario_id: string;
  step_order: number;
  customer_message: string;
  context_note: string | null;
  options: ScenarioOptionRow[];
};

export type ScenarioRow = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  difficulty: ScenarioDifficulty;
  customer_name: string | null;
  customer_profile: string | null;
  scenario_type: ScenarioType;
  is_active: boolean;
  track_level: number;
  track_order: number;
  learning_objective: string | null;
  technical_focus: string | null;
  source_lesson: string | null;
  created_at: string | null;
  modules?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type ScenarioDetails = ScenarioRow & {
  steps: ScenarioStepRow[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function normalizeScenario(row: any): ScenarioRow {
  return {
    id: row.id,
    module_id: row.module_id,
    title: row.title,
    description: row.description ?? null,
    difficulty: row.difficulty ?? "facil",
    customer_name: row.customer_name ?? null,
    customer_profile: row.customer_profile ?? null,
    scenario_type: row.scenario_type ?? "personalizado",
    is_active: Boolean(row.is_active),
    track_level: row.track_level ?? 1,
    track_order: row.track_order ?? 1,
    learning_objective: row.learning_objective ?? null,
    technical_focus: row.technical_focus ?? null,
    source_lesson: row.source_lesson ?? null,
    created_at: row.created_at ?? null,
    modules: one(row.modules),
  };
}

function validateScenario(input: CreateScenarioInput) {
  if (!input.module_id) {
    throw new Error("Selecione o módulo do cenário.");
  }

  if (!input.title.trim()) {
    throw new Error("Informe o título do cenário.");
  }

  if (!input.customer_name.trim()) {
    throw new Error("Informe o nome do cliente/personagem.");
  }

  if (!input.customer_profile.trim()) {
    throw new Error("Informe o perfil do cliente/personagem.");
  }

  if (!input.steps.length) {
    throw new Error("Cadastre pelo menos uma etapa.");
  }

  input.steps.forEach((step, stepIndex) => {
    if (!step.customer_message.trim()) {
      throw new Error(`Informe a mensagem do cliente na etapa ${stepIndex + 1}.`);
    }

    if (step.options.length < 2) {
      throw new Error(`A etapa ${stepIndex + 1} precisa ter pelo menos 2 opções.`);
    }

    const hasBestOption = step.options.some((option) => option.is_best_option);

    if (!hasBestOption) {
      throw new Error(`Marque a melhor opção da etapa ${stepIndex + 1}.`);
    }

    step.options.forEach((option, optionIndex) => {
      if (!option.option_text.trim()) {
        throw new Error(
          `Informe o texto da opção ${optionIndex + 1} na etapa ${stepIndex + 1}.`
        );
      }

      if (Number.isNaN(Number(option.score))) {
        throw new Error(
          `Informe uma pontuação válida na opção ${optionIndex + 1} da etapa ${stepIndex + 1}.`
        );
      }
    });
  });
}

async function recreateScenarioSteps(
  scenarioId: string,
  steps: ScenarioStepInput[]
) {
  const { data: currentSteps, error: currentStepsError } = await supabase
    .from("scenario_steps")
    .select("id")
    .eq("scenario_id", scenarioId);

  if (currentStepsError) {
    throw new Error(currentStepsError.message);
  }

  const currentStepIds = (currentSteps ?? []).map((step) => step.id);

  if (currentStepIds.length > 0) {
    const { error: deleteOptionsError } = await supabase
      .from("scenario_options")
      .delete()
      .in("step_id", currentStepIds);

    if (deleteOptionsError) {
      throw new Error(deleteOptionsError.message);
    }

    const { error: deleteStepsError } = await supabase
      .from("scenario_steps")
      .delete()
      .eq("scenario_id", scenarioId);

    if (deleteStepsError) {
      throw new Error(deleteStepsError.message);
    }
  }

  const stepsPayload = steps.map((step, index) => ({
    scenario_id: scenarioId,
    step_order: index + 1,
    customer_message: step.customer_message.trim(),
    context_note: step.context_note.trim() || null,
  }));

  const { data: insertedSteps, error: stepsError } = await supabase
    .from("scenario_steps")
    .insert(stepsPayload)
    .select("id, step_order");

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  const optionsPayload = [];

  for (const insertedStep of insertedSteps ?? []) {
    const sourceStep = steps[Number(insertedStep.step_order) - 1];

    for (const option of sourceStep.options) {
      optionsPayload.push({
        step_id: insertedStep.id,
        option_text: option.option_text.trim(),
        is_best_option: Boolean(option.is_best_option),
        score: Number(option.score),
        feedback: option.feedback.trim() || null,
      });
    }
  }

  if (optionsPayload.length > 0) {
    const { error: optionsError } = await supabase
      .from("scenario_options")
      .insert(optionsPayload);

    if (optionsError) {
      throw new Error(optionsError.message);
    }
  }
}

export async function getScenarios(): Promise<ScenarioRow[]> {
  const { data, error } = await supabase
    .from("scenarios")
    .select(`
      id,
      module_id,
      title,
      description,
      difficulty,
      customer_name,
      customer_profile,
      scenario_type,
      is_active,
      track_level,
      track_order,
      learning_objective,
      technical_focus,
      source_lesson,
      created_at,
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

  return ((data ?? []) as any[]).map(normalizeScenario);
}

export async function getScenarioDetails(
  scenarioId: string
): Promise<ScenarioDetails> {
  const { data: scenarioData, error: scenarioError } = await supabase
    .from("scenarios")
    .select(`
      id,
      module_id,
      title,
      description,
      difficulty,
      customer_name,
      customer_profile,
      scenario_type,
      is_active,
      track_level,
      track_order,
      learning_objective,
      technical_focus,
      source_lesson,
      created_at,
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
  const optionsByStep = new Map<string, ScenarioOptionRow[]>();

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

    for (const option of (optionsData ?? []) as ScenarioOptionRow[]) {
      const current = optionsByStep.get(option.step_id) ?? [];
      current.push(option);
      optionsByStep.set(option.step_id, current);
    }
  }

  const steps = ((stepsData ?? []) as any[]).map((step) => ({
    id: step.id,
    scenario_id: step.scenario_id,
    step_order: step.step_order,
    customer_message: step.customer_message,
    context_note: step.context_note,
    options: optionsByStep.get(step.id) ?? [],
  }));

  return {
    ...normalizeScenario(scenarioData),
    steps,
  };
}

export async function createScenario(input: CreateScenarioInput): Promise<void> {
  validateScenario(input);

  const { data: scenarioData, error: scenarioError } = await supabase
    .from("scenarios")
    .insert({
      module_id: input.module_id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      difficulty: input.difficulty,
      customer_name: input.customer_name.trim(),
      customer_profile: input.customer_profile.trim(),
      scenario_type: input.scenario_type,
      is_active: true,
      track_level: Number(input.track_level) || 1,
      track_order: Number(input.track_order) || 1,
      learning_objective: input.learning_objective.trim() || null,
      technical_focus: input.technical_focus.trim() || null,
      source_lesson: input.source_lesson.trim() || null,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scenarioError) {
    throw new Error(scenarioError.message);
  }

  await recreateScenarioSteps(scenarioData.id, input.steps);
}

export async function updateScenario(input: UpdateScenarioInput): Promise<void> {
  validateScenario(input);

  const { error: scenarioError } = await supabase
    .from("scenarios")
    .update({
      module_id: input.module_id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      difficulty: input.difficulty,
      customer_name: input.customer_name.trim(),
      customer_profile: input.customer_profile.trim(),
      scenario_type: input.scenario_type,
      is_active: input.is_active,
      track_level: Number(input.track_level) || 1,
      track_order: Number(input.track_order) || 1,
      learning_objective: input.learning_objective.trim() || null,
      technical_focus: input.technical_focus.trim() || null,
      source_lesson: input.source_lesson.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (scenarioError) {
    throw new Error(scenarioError.message);
  }

  await recreateScenarioSteps(input.id, input.steps);
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
  const { data: scenario, error: scenarioError } = await supabase
    .from("scenarios")
    .select("id, scenario_type")
    .eq("id", scenarioId)
    .single();

  if (scenarioError) {
    throw new Error(scenarioError.message);
  }

  if (scenario.scenario_type !== "personalizado") {
    throw new Error("Cenários oficiais não podem ser excluídos.");
  }

  const { data: steps, error: stepsError } = await supabase
    .from("scenario_steps")
    .select("id")
    .eq("scenario_id", scenarioId);

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  const stepIds = (steps ?? []).map((step) => step.id);

  if (stepIds.length > 0) {
    const { error: optionsError } = await supabase
      .from("scenario_options")
      .delete()
      .in("step_id", stepIds);

    if (optionsError) {
      throw new Error(optionsError.message);
    }

    const { error: deleteStepsError } = await supabase
      .from("scenario_steps")
      .delete()
      .eq("scenario_id", scenarioId);

    if (deleteStepsError) {
      throw new Error(deleteStepsError.message);
    }
  }

  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("id", scenarioId);

  if (error) {
    throw new Error(error.message);
  }
}

export type DuplicateScenarioInput = {
  sourceScenarioId: string;
  title: string;
  isActive: boolean;
};

export async function duplicateScenario(
  input: DuplicateScenarioInput
): Promise<string> {
  const duplicatedTitle = input.title.trim();

  if (!input.sourceScenarioId) {
    throw new Error("Selecione o cenário que será usado como modelo.");
  }

  if (!duplicatedTitle) {
    throw new Error("Informe o título do novo cenário.");
  }

  const sourceScenario = await getScenarioDetails(input.sourceScenarioId);

  const { data: newScenario, error: scenarioError } = await supabase
    .from("scenarios")
    .insert({
      module_id: sourceScenario.module_id,
      title: duplicatedTitle,
      description: sourceScenario.description,
      difficulty: sourceScenario.difficulty,
      customer_name: sourceScenario.customer_name,
      customer_profile: sourceScenario.customer_profile,
      scenario_type: "personalizado",
      is_active: input.isActive,
      track_level: sourceScenario.track_level ?? 1,
      track_order: sourceScenario.track_order ?? 1,
      learning_objective: sourceScenario.learning_objective,
      technical_focus: sourceScenario.technical_focus,
      source_lesson: sourceScenario.source_lesson,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scenarioError) {
    throw new Error(scenarioError.message);
  }

  if (sourceScenario.steps.length === 0) {
    return newScenario.id;
  }

  const stepsPayload = sourceScenario.steps.map((step, index) => ({
    scenario_id: newScenario.id,
    step_order: index + 1,
    customer_message: step.customer_message,
    context_note: step.context_note,
  }));

  const { data: insertedSteps, error: stepsError } = await supabase
    .from("scenario_steps")
    .insert(stepsPayload)
    .select("id, step_order");

  if (stepsError) {
    await supabase.from("scenarios").delete().eq("id", newScenario.id);
    throw new Error(stepsError.message);
  }

  const optionsPayload: {
    step_id: string;
    option_text: string;
    is_best_option: boolean;
    score: number;
    feedback: string | null;
  }[] = [];

  for (const insertedStep of insertedSteps ?? []) {
    const sourceStep =
      sourceScenario.steps[Number(insertedStep.step_order) - 1];

    if (!sourceStep) {
      continue;
    }

    for (const option of sourceStep.options) {
      optionsPayload.push({
        step_id: insertedStep.id,
        option_text: option.option_text,
        is_best_option: Boolean(option.is_best_option),
        score: Number(option.score ?? 0),
        feedback: option.feedback ?? null,
      });
    }
  }

  if (optionsPayload.length > 0) {
    const { error: optionsError } = await supabase
      .from("scenario_options")
      .insert(optionsPayload);

    if (optionsError) {
      const insertedStepIds = (insertedSteps ?? []).map((step) => step.id);

      if (insertedStepIds.length > 0) {
        await supabase
          .from("scenario_options")
          .delete()
          .in("step_id", insertedStepIds);

        await supabase
          .from("scenario_steps")
          .delete()
          .eq("scenario_id", newScenario.id);
      }

      await supabase.from("scenarios").delete().eq("id", newScenario.id);

      throw new Error(optionsError.message);
    }
  }

  return newScenario.id;
}

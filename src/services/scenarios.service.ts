import { supabase } from "@/lib/supabase/client";

export type ScenarioDifficulty = "facil" | "medio" | "dificil";
export type ScenarioType = "oficial" | "personalizado";

export type ScenarioRow = {
  id: string;
  title: string;
  description: string | null;
  module_id: string;
  scenario_type: ScenarioType;
  difficulty: ScenarioDifficulty;
  customer_name: string | null;
  customer_profile: string | null;
  is_active: boolean;
  track_level: number | null;
  track_order: number | null;
  learning_objective: string | null;
  technical_focus: string | null;
  source_lesson: string | null;
  created_at: string;
  updated_at: string | null;
  modules?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  scenario_steps?: {
    id: string;
  }[];
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
  optionA: string;
  optionB: string;
  optionC: string;
  bestOption: "a" | "b" | "c";
  feedbackA: string;
  feedbackB: string;
  feedbackC: string;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function getScore(option: "a" | "b" | "c", bestOption: "a" | "b" | "c") {
  return option === bestOption ? 10 : 4;
}

function getLearningObjective(difficulty: ScenarioDifficulty) {
  if (difficulty === "facil") {
    return "Praticar acolhimento, clareza, escuta inicial e triagem do cliente.";
  }

  if (difficulty === "medio") {
    return "Praticar condução consultiva, análise de objeções e escolha da melhor resposta.";
  }

  return "Praticar negociação, tomada de decisão, ética e fechamento profissional.";
}

function getTechnicalFocus(difficulty: ScenarioDifficulty) {
  if (difficulty === "facil") {
    return "Acolhimento, clareza, escuta ativa e triagem.";
  }

  if (difficulty === "medio") {
    return "Objeções, tipo de cliente, benefícios e postura profissional.";
  }

  return "Negociação, fechamento, ética, pressão e fidelização.";
}

function getTrackLevel(difficulty: ScenarioDifficulty) {
  if (difficulty === "facil") return 1;
  if (difficulty === "medio") return 2;
  return 3;
}

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
      track_level,
      track_order,
      learning_objective,
      technical_focus,
      source_lesson,
      created_at,
      updated_at,
      modules (
        id,
        name,
        slug
      ),
      scenario_steps (
        id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows.map((row) => ({
    ...row,
    modules: one(row.modules),
    scenario_steps: row.scenario_steps ?? [],
  })) as ScenarioRow[];
}

export async function createScenario(input: CreateScenarioInput): Promise<void> {
  const { data: scenarioData, error: scenarioError } = await supabase
    .from("scenarios")
    .insert({
      title: input.title.trim(),
      description: input.description.trim() || null,
      module_id: input.moduleId,
      scenario_type: "personalizado",
      difficulty: input.difficulty,
      customer_name: input.customerName.trim() || null,
      customer_profile: input.customerProfile.trim() || null,
      is_active: true,
      track_level: getTrackLevel(input.difficulty),
      track_order: getTrackLevel(input.difficulty),
      learning_objective: getLearningObjective(input.difficulty),
      technical_focus: getTechnicalFocus(input.difficulty),
      source_lesson: "Cenário personalizado criado pelo professor.",
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
      customer_message: input.customerMessage.trim(),
      context_note: input.contextNote.trim() || null,
    })
    .select("id")
    .single();

  if (stepError) {
    throw new Error(stepError.message);
  }

  const options = [
    {
      step_id: stepData.id,
      option_text: input.optionA.trim(),
      is_best_option: input.bestOption === "a",
      score: getScore("a", input.bestOption),
      feedback: input.feedbackA.trim() || "Analise melhor a postura profissional nesta resposta.",
    },
    {
      step_id: stepData.id,
      option_text: input.optionB.trim(),
      is_best_option: input.bestOption === "b",
      score: getScore("b", input.bestOption),
      feedback: input.feedbackB.trim() || "Analise melhor a postura profissional nesta resposta.",
    },
    {
      step_id: stepData.id,
      option_text: input.optionC.trim(),
      is_best_option: input.bestOption === "c",
      score: getScore("c", input.bestOption),
      feedback: input.feedbackC.trim() || "Analise melhor a postura profissional nesta resposta.",
    },
  ];

  const { error: optionsError } = await supabase
    .from("scenario_options")
    .insert(options);

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

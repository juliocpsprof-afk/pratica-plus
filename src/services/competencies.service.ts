import { supabase } from "@/lib/supabase/client";

export type CompetencyRow = {
  id: string;
  name: string;
  description: string | null;
};

export async function getCompetencies(): Promise<CompetencyRow[]> {
  const { data, error } = await supabase
    .from("competencies")
    .select("id, name, description")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function saveCompetencyScores(input: {
  studentId: string;
  simulationSessionId: string;
  moduleSlug: "telemarketing" | "vendas";
  baseScore: number;
}): Promise<void> {
  const competencies = await getCompetencies();

  const namesByModule =
    input.moduleSlug === "telemarketing"
      ? ["Comunicação", "Escuta Ativa", "Empatia", "Triagem", "Pós-Chamada"]
      : ["Comunicação", "Negociação", "Fechamento", "Fidelização", "Ética"];

  const selectedCompetencies = competencies.filter((competency) =>
    namesByModule.includes(competency.name)
  );

  if (selectedCompetencies.length === 0) {
    return;
  }

  const rows = selectedCompetencies.map((competency) => ({
    student_id: input.studentId,
    competency_id: competency.id,
    simulation_session_id: input.simulationSessionId,
    score: input.baseScore,
  }));

  const { error } = await supabase.from("student_competencies").insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

import { supabase } from "@/lib/supabase/client";

export type ReportFilters = {
  classId: string;
  moduleSlug: string;
  mode: string;
};

export type ReportRow = {
  id: string;
  studentName: string;
  username: string;
  className: string;
  scenarioTitle: string;
  difficulty: string;
  moduleName: string;
  moduleSlug: string;
  mode: string;
  totalScore: number;
  createdAt: string | null;
  teamName: string | null;
};

export type ReportSummary = {
  total: number;
  averageScore: number;
  bestScore: number;
  individualTotal: number;
  teamTotal: number;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getSimulationReports(
  filters: ReportFilters
): Promise<{
  rows: ReportRow[];
  summary: ReportSummary;
}> {
  let query = supabase
    .from("simulation_sessions")
    .select(`
      id,
      total_score,
      mode,
      module_slug,
      created_at,
      students (
        id,
        profiles (
          full_name,
          username
        ),
        classes (
          id,
          name
        )
      ),
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
    .order("created_at", { ascending: false });

  if (filters.mode !== "todos") {
    query = query.eq("mode", filters.mode);
  }

  if (filters.moduleSlug !== "todos") {
    query = query.eq("module_slug", filters.moduleSlug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const mappedRows = ((data ?? []) as any[]).map((row) => {
    const student = one(row.students);
    const profile = one(student?.profiles);
    const classData = one(student?.classes);
    const scenario = one(row.scenarios);
    const moduleData = one(scenario?.modules);
    const team = one(row.teams);

    return {
      id: row.id,
      studentName: profile?.full_name ?? "Aluno não informado",
      username: profile?.username ?? "--",
      className: classData?.name ?? "Turma não informada",
      scenarioTitle: scenario?.title ?? "Cenário não informado",
      difficulty: scenario?.difficulty ?? "não informado",
      moduleName: moduleData?.name ?? row.module_slug ?? "Módulo não informado",
      moduleSlug: row.module_slug ?? moduleData?.slug ?? "não informado",
      mode: row.mode ?? "individual",
      totalScore: Number(row.total_score ?? 0),
      createdAt: row.created_at ?? null,
      teamName: team?.name ?? null,
      classId: classData?.id ?? "",
    };
  });

  const rows =
    filters.classId === "todos"
      ? mappedRows
      : mappedRows.filter((row: any) => row.classId === filters.classId);

  const scores = rows.map((row) => row.totalScore);
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  const bestScore = scores.length ? Math.max(...scores) : 0;

  return {
    rows,
    summary: {
      total: rows.length,
      averageScore,
      bestScore,
      individualTotal: rows.filter((row) => row.mode === "individual").length,
      teamTotal: rows.filter((row) => row.mode === "equipe").length,
    },
  };
}

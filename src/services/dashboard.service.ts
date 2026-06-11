import { supabase } from "@/lib/supabase/client";

export type ProfessorDashboardStats = {
  studentsCount: number;
  classesCount: number;
  scenariosCount: number;
  simulationsCount: number;
  averageScore: number;
};

export type RecentSimulationRow = {
  id: string;
  total_score: number;
  started_at: string;
  finished_at: string | null;
  scenarios?: {
    title: string;
    modules?: {
      name: string;
    } | null;
  } | null;
  students?: {
    profiles?: {
      full_name: string;
      username: string;
    } | null;
  } | null;
};

export async function getProfessorDashboardStats(): Promise<ProfessorDashboardStats> {
  const [
    studentsResult,
    classesResult,
    scenariosResult,
    simulationsResult,
    averageResult,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("scenarios").select("id", { count: "exact", head: true }),
    supabase
      .from("simulation_sessions")
      .select("id", { count: "exact", head: true }),
    supabase.from("simulation_sessions").select("total_score"),
  ]);

  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (classesResult.error) throw new Error(classesResult.error.message);
  if (scenariosResult.error) throw new Error(scenariosResult.error.message);
  if (simulationsResult.error) throw new Error(simulationsResult.error.message);
  if (averageResult.error) throw new Error(averageResult.error.message);

  const scores = averageResult.data ?? [];
  const averageScore =
    scores.length === 0
      ? 0
      : Math.round(
          scores.reduce((sum, item) => sum + Number(item.total_score ?? 0), 0) /
            scores.length
        );

  return {
    studentsCount: studentsResult.count ?? 0,
    classesCount: classesResult.count ?? 0,
    scenariosCount: scenariosResult.count ?? 0,
    simulationsCount: simulationsResult.count ?? 0,
    averageScore,
  };
}

export async function getRecentSimulations(): Promise<RecentSimulationRow[]> {
  const { data, error } = await supabase
    .from("simulation_sessions")
    .select(`
      id,
      total_score,
      started_at,
      finished_at,
      scenarios (
        title,
        modules (
          name
        )
      ),
      students (
        profiles (
          full_name,
          username
        )
      )
    `)
    .order("started_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RecentSimulationRow[];
}

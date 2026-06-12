import { supabase } from "@/lib/supabase/client";

export type ProfessorDashboardData = {
  coursesTotal: number;
  classesTotal: number;
  studentsTotal: number;
  activeStudentsTotal: number;
  scenariosTotal: number;
  activeScenariosTotal: number;
  simulationsTotal: number;
  averageScore: number;
  individualSimulations: number;
  teamSimulations: number;
  telemarketingSimulations: number;
  salesSimulations: number;
  latestResults: {
    id: string;
    studentName: string;
    className: string;
    scenarioTitle: string;
    moduleSlug: string;
    mode: string;
    totalScore: number;
    createdAt: string | null;
  }[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getProfessorDashboardData(): Promise<ProfessorDashboardData> {
  const [
    coursesResponse,
    classesResponse,
    studentsResponse,
    scenariosResponse,
    sessionsResponse,
    latestResponse,
  ] = await Promise.all([
    supabase.from("courses").select("id"),
    supabase.from("classes").select("id"),
    supabase.from("students").select("id, enrollment_status"),
    supabase.from("scenarios").select("id, is_active"),
    supabase.from("simulation_sessions").select("id, total_score, mode, module_slug"),
    supabase
      .from("simulation_sessions")
      .select(`
        id,
        total_score,
        mode,
        module_slug,
        created_at,
        students (
          profiles (
            full_name
          ),
          classes (
            name
          )
        ),
        scenarios (
          title
        )
      `)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (coursesResponse.error) throw new Error(coursesResponse.error.message);
  if (classesResponse.error) throw new Error(classesResponse.error.message);
  if (studentsResponse.error) throw new Error(studentsResponse.error.message);
  if (scenariosResponse.error) throw new Error(scenariosResponse.error.message);
  if (sessionsResponse.error) throw new Error(sessionsResponse.error.message);
  if (latestResponse.error) throw new Error(latestResponse.error.message);

  const students = studentsResponse.data ?? [];
  const scenarios = scenariosResponse.data ?? [];
  const sessions = sessionsResponse.data ?? [];

  const scores = sessions.map((item) => Number(item.total_score ?? 0));
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  const latestResults = ((latestResponse.data ?? []) as any[]).map((row) => {
    const student = one(row.students);
    const profile = one(student?.profiles);
    const classData = one(student?.classes);
    const scenario = one(row.scenarios);

    return {
      id: row.id,
      studentName: profile?.full_name ?? "Aluno não informado",
      className: classData?.name ?? "Turma não informada",
      scenarioTitle: scenario?.title ?? "Cenário não informado",
      moduleSlug: row.module_slug ?? "não informado",
      mode: row.mode ?? "individual",
      totalScore: Number(row.total_score ?? 0),
      createdAt: row.created_at ?? null,
    };
  });

  return {
    coursesTotal: coursesResponse.data?.length ?? 0,
    classesTotal: classesResponse.data?.length ?? 0,
    studentsTotal: students.length,
    activeStudentsTotal: students.filter((student) => student.enrollment_status === "ativo").length,
    scenariosTotal: scenarios.length,
    activeScenariosTotal: scenarios.filter((scenario) => scenario.is_active).length,
    simulationsTotal: sessions.length,
    averageScore,
    individualSimulations: sessions.filter((session) => session.mode === "individual").length,
    teamSimulations: sessions.filter((session) => session.mode === "equipe").length,
    telemarketingSimulations: sessions.filter((session) => session.module_slug === "telemarketing").length,
    salesSimulations: sessions.filter((session) => session.module_slug === "vendas").length,
    latestResults,
  };
}

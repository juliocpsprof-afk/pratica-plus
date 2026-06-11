import { supabase } from "@/lib/supabase/client";

export type ClassReportStudent = {
  studentId: string;
  fullName: string;
  username: string;
  totalSimulations: number;
  averageScore: number;
  bestScore: number;
  lastSimulationAt: string | null;
};

export async function getClassReport(
  classId: string
): Promise<ClassReportStudent[]> {
  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select(`
      id,
      profiles (
        full_name,
        username
      )
    `)
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  const students = studentsData ?? [];

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((student) => student.id);

  const { data: simulationsData, error: simulationsError } = await supabase
    .from("simulation_sessions")
    .select("id, student_id, total_score, started_at")
    .in("student_id", studentIds)
    .order("started_at", { ascending: false });

  if (simulationsError) {
    throw new Error(simulationsError.message);
  }

  return students.map((student) => {
    const simulations = (simulationsData ?? []).filter(
      (simulation) => simulation.student_id === student.id
    );

    const total = simulations.length;
    const scores = simulations.map((simulation) =>
      Number(simulation.total_score ?? 0)
    );

    const average =
      scores.length === 0
        ? 0
        : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    const best = scores.length === 0 ? 0 : Math.max(...scores);

    return {
      studentId: student.id,
      fullName: student.profiles?.full_name ?? "Aluno",
      username: student.profiles?.username ?? "--",
      totalSimulations: total,
      averageScore: average,
      bestScore: best,
      lastSimulationAt: simulations[0]?.started_at ?? null,
    };
  });
}

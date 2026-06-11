import { supabase } from "@/lib/supabase/client";

export type RankingStudent = {
  studentId: string;
  fullName: string;
  username: string;
  totalSimulations: number;
  averageScore: number;
  bestScore: number;
  totalScore: number;
  mainCompetency: string;
};

export async function getStudentRanking(): Promise<RankingStudent[]> {
  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select(`
      id,
      profiles (
        full_name,
        username
      )
    `);

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  const students = studentsData ?? [];

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((student) => student.id);

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("simulation_sessions")
    .select("student_id, total_score")
    .in("student_id", studentIds);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const { data: competencyData, error: competencyError } = await supabase
    .from("student_competencies")
    .select(`
      student_id,
      score,
      competencies (
        name
      )
    `)
    .in("student_id", studentIds);

  if (competencyError) {
    throw new Error(competencyError.message);
  }

  const ranking = students.map((student) => {
    const sessions = (sessionsData ?? []).filter(
      (session) => session.student_id === student.id
    );

    const scores = sessions.map((session) => Number(session.total_score ?? 0));
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore =
      scores.length === 0 ? 0 : Math.round(totalScore / scores.length);
    const bestScore = scores.length === 0 ? 0 : Math.max(...scores);

    const competencyRows = (competencyData ?? []).filter(
      (item) => item.student_id === student.id
    );

    const competencyMap = new Map<string, { total: number; count: number }>();

    for (const row of competencyRows) {
      const name = row.competencies?.name ?? "Competência";
      const current = competencyMap.get(name) ?? { total: 0, count: 0 };

      competencyMap.set(name, {
        total: current.total + Number(row.score ?? 0),
        count: current.count + 1,
      });
    }

    let mainCompetency = "--";
    let bestAverage = -1;

    competencyMap.forEach((value, key) => {
      const average = value.count === 0 ? 0 : value.total / value.count;

      if (average > bestAverage) {
        bestAverage = average;
        mainCompetency = key;
      }
    });

    return {
      studentId: student.id,
      fullName: student.profiles?.full_name ?? "Aluno",
      username: student.profiles?.username ?? "--",
      totalSimulations: sessions.length,
      averageScore,
      bestScore,
      totalScore,
      mainCompetency,
    };
  });

  return ranking.sort((a, b) => {
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }

    return b.totalScore - a.totalScore;
  });
}

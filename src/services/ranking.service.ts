import { supabase } from "@/lib/supabase/client";

export type RankingRow = {
  student_id: string;
  full_name: string;
  username: string;
  class_name: string;
  simulations_count: number;
  total_score: number;
  average_score: number;
  best_score: number;
  last_simulation_at: string | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getStudentRanking(): Promise<RankingRow[]> {
  const { data, error } = await supabase
    .from("simulation_sessions")
    .select(`
      id,
      student_id,
      total_score,
      created_at,
      students (
        id,
        profiles (
          full_name,
          username
        ),
        classes (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];
  const map = new Map<string, RankingRow>();

  for (const row of rows) {
    const student = one(row.students);
    const profile = one(student?.profiles);
    const classData = one(student?.classes);
    const score = Number(row.total_score ?? 0);

    const current = map.get(row.student_id);

    if (!current) {
      map.set(row.student_id, {
        student_id: row.student_id,
        full_name: profile?.full_name ?? "Aluno sem nome",
        username: profile?.username ?? "--",
        class_name: classData?.name ?? "Turma não informada",
        simulations_count: 1,
        total_score: score,
        average_score: score,
        best_score: score,
        last_simulation_at: row.created_at ?? null,
      });

      continue;
    }

    current.simulations_count += 1;
    current.total_score += score;
    current.best_score = Math.max(current.best_score, score);
    current.average_score = Math.round(current.total_score / current.simulations_count);

    if (
      row.created_at &&
      (!current.last_simulation_at || row.created_at > current.last_simulation_at)
    ) {
      current.last_simulation_at = row.created_at;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.average_score !== a.average_score) {
      return b.average_score - a.average_score;
    }

    return b.simulations_count - a.simulations_count;
  });
}

import { supabase } from "@/lib/supabase/client";

export type StudentReportListItem = {
  id: string;
  full_name: string;
  username: string;
  enrollment_status: string;
  class_name: string;
  course_name: string;
};

export type StudentReportAnswer = {
  session_id: string;
  step_id: string | null;
  option_id: string | null;
  step_order: number | null;
  customer_message: string;
  option_text: string;
  is_best_option: boolean | null;
  score: number;
  feedback: string;
};

export type StudentReportSession = {
  id: string;
  scenario_id: string | null;
  team_id: string | null;
  module_slug: string | null;
  mode: string;
  total_score: number;
  created_at: string | null;
  scenario_title: string;
  scenario_difficulty: string;
  module_name: string;
  team_name: string | null;
  answers: StudentReportAnswer[];
};

export type StudentReportData = {
  student: StudentReportListItem;
  sessions: StudentReportSession[];
  summary: {
    total_sessions: number;
    average_score: number;
    best_score: number;
    individual_total: number;
    team_total: number;
  };
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function getStudentsForIndividualReport(): Promise<StudentReportListItem[]> {
  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      enrollment_status,
      profiles (
        full_name,
        username
      ),
      classes (
        name
      ),
      courses (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows
    .map((row) => {
      const profile = one(row.profiles);
      const classData = one(row.classes);
      const courseData = one(row.courses);

      return {
        id: row.id,
        full_name: profile?.full_name ?? "Aluno sem nome",
        username: profile?.username ?? "--",
        enrollment_status: row.enrollment_status ?? "ativo",
        class_name: classData?.name ?? "Turma não informada",
        course_name: courseData?.name ?? "Curso não informado",
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
}

export async function getStudentIndividualReport(
  studentId: string
): Promise<StudentReportData | null> {
  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select(`
      id,
      enrollment_status,
      profiles (
        full_name,
        username
      ),
      classes (
        name
      ),
      courses (
        name
      )
    `)
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!studentData) {
    return null;
  }

  const profile = one((studentData as any).profiles);
  const classData = one((studentData as any).classes);
  const courseData = one((studentData as any).courses);

  const student: StudentReportListItem = {
    id: (studentData as any).id,
    full_name: profile?.full_name ?? "Aluno sem nome",
    username: profile?.username ?? "--",
    enrollment_status: (studentData as any).enrollment_status ?? "ativo",
    class_name: classData?.name ?? "Turma não informada",
    course_name: courseData?.name ?? "Curso não informado",
  };

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("simulation_sessions")
    .select(`
      id,
      scenario_id,
      team_id,
      module_slug,
      mode,
      total_score,
      created_at,
      scenarios (
        title,
        difficulty,
        modules (
          name
        )
      ),
      teams (
        name
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const sessionRows = (sessionsData ?? []) as any[];
  const sessionIds = sessionRows.map((session) => session.id);

  const answersBySession = new Map<string, StudentReportAnswer[]>();

  if (sessionIds.length > 0) {
    const { data: answersData, error: answersError } = await supabase
      .from("simulation_answers")
      .select(`
        session_id,
        step_id,
        option_id,
        score,
        feedback
      `)
      .in("session_id", sessionIds);

    if (answersError) {
      throw new Error(answersError.message);
    }

    const answerRows = (answersData ?? []) as any[];

    const stepIds = Array.from(
      new Set(
        answerRows
          .map((answer) => answer.step_id)
          .filter(Boolean)
      )
    );

    const optionIds = Array.from(
      new Set(
        answerRows
          .map((answer) => answer.option_id)
          .filter(Boolean)
      )
    );

    const stepsMap = new Map<string, any>();
    const optionsMap = new Map<string, any>();

    if (stepIds.length > 0) {
      const { data: stepsData, error: stepsError } = await supabase
        .from("scenario_steps")
        .select("id, step_order, customer_message, context_note")
        .in("id", stepIds);

      if (stepsError) {
        throw new Error(stepsError.message);
      }

      for (const step of stepsData ?? []) {
        stepsMap.set(step.id, step);
      }
    }

    if (optionIds.length > 0) {
      const { data: optionsData, error: optionsError } = await supabase
        .from("scenario_options")
        .select("id, option_text, is_best_option")
        .in("id", optionIds);

      if (optionsError) {
        throw new Error(optionsError.message);
      }

      for (const option of optionsData ?? []) {
        optionsMap.set(option.id, option);
      }
    }

    for (const answer of answerRows) {
      const step = answer.step_id ? stepsMap.get(answer.step_id) : null;
      const option = answer.option_id ? optionsMap.get(answer.option_id) : null;

      const normalizedAnswer: StudentReportAnswer = {
        session_id: answer.session_id,
        step_id: answer.step_id ?? null,
        option_id: answer.option_id ?? null,
        step_order: step?.step_order ?? null,
        customer_message: step?.customer_message ?? "Mensagem do cliente não registrada.",
        option_text: option?.option_text ?? "Resposta não registrada.",
        is_best_option:
          typeof option?.is_best_option === "boolean"
            ? option.is_best_option
            : null,
        score: Number(answer.score ?? 0),
        feedback: answer.feedback ?? "Feedback não registrado.",
      };

      const current = answersBySession.get(answer.session_id) ?? [];
      current.push(normalizedAnswer);
      answersBySession.set(answer.session_id, current);
    }

    for (const [sessionId, answers] of answersBySession.entries()) {
      answers.sort((a, b) => Number(a.step_order ?? 0) - Number(b.step_order ?? 0));
      answersBySession.set(sessionId, answers);
    }
  }

  const sessions: StudentReportSession[] = sessionRows.map((row) => {
    const scenario = one(row.scenarios);
    const moduleData = one(scenario?.modules);
    const team = one(row.teams);

    return {
      id: row.id,
      scenario_id: row.scenario_id ?? null,
      team_id: row.team_id ?? null,
      module_slug: row.module_slug ?? null,
      mode: row.mode ?? "individual",
      total_score: Number(row.total_score ?? 0),
      created_at: row.created_at ?? null,
      scenario_title: scenario?.title ?? "Cenário não informado",
      scenario_difficulty: scenario?.difficulty ?? "não informado",
      module_name: moduleData?.name ?? row.module_slug ?? "Módulo não informado",
      team_name: team?.name ?? null,
      answers: answersBySession.get(row.id) ?? [],
    };
  });

  const scores = sessions.map((session) => session.total_score);

  return {
    student,
    sessions,
    summary: {
      total_sessions: sessions.length,
      average_score: average(scores),
      best_score: scores.length ? Math.max(...scores) : 0,
      individual_total: sessions.filter((session) => session.mode === "individual").length,
      team_total: sessions.filter((session) => session.mode === "equipe").length,
    },
  };
}

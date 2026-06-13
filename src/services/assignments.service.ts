import { supabase } from "@/lib/supabase/client";

export type AssignmentTargetType = "turma" | "aluno";

export type AssignmentScenario = {
  id: string;
  title: string;
  difficulty: string;
  module_id: string;
  modules: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  scenario_id: string;
  class_id: string | null;
  student_id: string | null;
  starts_at: string;
  due_at: string | null;
  min_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;

  scenario: AssignmentScenario | null;

  target_type: AssignmentTargetType;
  target_name: string;

  completion_count: number;
  best_score: number | null;
};

export type StudentAssignmentRow = AssignmentRow & {
  student_completed: boolean;
  student_best_score: number | null;
  student_last_score: number | null;
  student_last_completion_at: string | null;
};

export type AssignmentFormOptions = {
  scenarios: {
    id: string;
    title: string;
    difficulty: string;
    module_name: string;
    module_slug: string;
  }[];

  classes: {
    id: string;
    name: string;
  }[];

  students: {
    id: string;
    full_name: string;
    username: string;
    class_name: string;
  }[];
};

export type SaveAssignmentInput = {
  id?: string;
  title: string;
  description: string;
  scenarioId: string;
  targetType: AssignmentTargetType;
  classId: string;
  studentId: string;
  startsAt: string;
  dueAt: string;
  minScore: number;
  isActive: boolean;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function toIsoDate(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Informe uma data válida.");
  }

  return date.toISOString();
}

function normalizeAssignment(row: any): AssignmentRow {
  const scenario = one(row.scenarios);
  const moduleData = one(scenario?.modules);
  const classData = one(row.classes);
  const studentData = one(row.students);
  const profileData = one(studentData?.profiles);

  const targetType: AssignmentTargetType = row.student_id
    ? "aluno"
    : "turma";

  const targetName =
    targetType === "aluno"
      ? profileData?.full_name ?? "Aluno não informado"
      : classData?.name ?? "Turma não informada";

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    scenario_id: row.scenario_id,
    class_id: row.class_id ?? null,
    student_id: row.student_id ?? null,
    starts_at: row.starts_at,
    due_at: row.due_at ?? null,
    min_score: Number(row.min_score ?? 70),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,

    scenario: scenario
      ? {
          id: scenario.id,
          title: scenario.title,
          difficulty: scenario.difficulty,
          module_id: scenario.module_id,
          modules: moduleData
            ? {
                id: moduleData.id,
                name: moduleData.name,
                slug: moduleData.slug,
              }
            : null,
        }
      : null,

    target_type: targetType,
    target_name: targetName,

    completion_count: 0,
    best_score: null,
  };
}

const assignmentSelect = `
  id,
  title,
  description,
  scenario_id,
  class_id,
  student_id,
  starts_at,
  due_at,
  min_score,
  is_active,
  created_at,
  updated_at,
  scenarios (
    id,
    title,
    difficulty,
    module_id,
    modules (
      id,
      name,
      slug
    )
  ),
  classes (
    id,
    name
  ),
  students (
    id,
    profiles (
      full_name,
      username
    )
  )
`;

export async function getAssignmentFormOptions(): Promise<AssignmentFormOptions> {
  const [scenariosResponse, classesResponse, studentsResponse] =
    await Promise.all([
      supabase
        .from("scenarios")
        .select(`
          id,
          title,
          difficulty,
          modules (
            name,
            slug
          )
        `)
        .eq("is_active", true)
        .order("title", { ascending: true }),

      supabase
        .from("classes")
        .select("id, name")
        .order("name", { ascending: true }),

      supabase
        .from("students")
        .select(`
          id,
          profiles (
            full_name,
            username
          ),
          classes (
            name
          )
        `)
        .order("created_at", { ascending: false }),
    ]);

  if (scenariosResponse.error) {
    throw new Error(scenariosResponse.error.message);
  }

  if (classesResponse.error) {
    throw new Error(classesResponse.error.message);
  }

  if (studentsResponse.error) {
    throw new Error(studentsResponse.error.message);
  }

  const scenarios = ((scenariosResponse.data ?? []) as any[]).map(
    (row) => {
      const moduleData = one(row.modules);

      return {
        id: row.id,
        title: row.title,
        difficulty: row.difficulty ?? "facil",
        module_name: moduleData?.name ?? "Módulo não informado",
        module_slug: moduleData?.slug ?? "",
      };
    }
  );

  const classes = (classesResponse.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));

  const students = ((studentsResponse.data ?? []) as any[])
    .map((row) => {
      const profile = one(row.profiles);
      const classData = one(row.classes);

      return {
        id: row.id,
        full_name: profile?.full_name ?? "Aluno sem nome",
        username: profile?.username ?? "--",
        class_name: classData?.name ?? "Turma não informada",
      };
    })
    .sort((a, b) =>
      a.full_name.localeCompare(b.full_name, "pt-BR")
    );

  return {
    scenarios,
    classes,
    students,
  };
}

export async function getAssignments(): Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from("scenario_assignments")
    .select(assignmentSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const assignments = ((data ?? []) as any[]).map(normalizeAssignment);
  const assignmentIds = assignments.map((assignment) => assignment.id);

  if (assignmentIds.length === 0) {
    return assignments;
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from("simulation_sessions")
    .select("id, assignment_id, total_score")
    .in("assignment_id", assignmentIds);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const sessionsByAssignment = new Map<
    string,
    { count: number; bestScore: number | null }
  >();

  for (const session of sessionData ?? []) {
    if (!session.assignment_id) {
      continue;
    }

    const current = sessionsByAssignment.get(session.assignment_id) ?? {
      count: 0,
      bestScore: null,
    };

    const score = Number(session.total_score ?? 0);

    current.count += 1;
    current.bestScore =
      current.bestScore === null
        ? score
        : Math.max(current.bestScore, score);

    sessionsByAssignment.set(session.assignment_id, current);
  }

  return assignments.map((assignment) => {
    const completion = sessionsByAssignment.get(assignment.id);

    return {
      ...assignment,
      completion_count: completion?.count ?? 0,
      best_score: completion?.bestScore ?? null,
    };
  });
}

export async function getStudentAssignments(
  studentId: string,
  classId: string | null
): Promise<StudentAssignmentRow[]> {
  const requests = [
    supabase
      .from("scenario_assignments")
      .select(assignmentSelect)
      .eq("student_id", studentId)
      .eq("is_active", true),
  ];

  if (classId) {
    requests.push(
      supabase
        .from("scenario_assignments")
        .select(assignmentSelect)
        .eq("class_id", classId)
        .eq("is_active", true)
    );
  }

  const responses = await Promise.all(requests);
  const combinedRows: any[] = [];

  for (const response of responses) {
    if (response.error) {
      throw new Error(response.error.message);
    }

    combinedRows.push(...(response.data ?? []));
  }

  const uniqueAssignments = new Map<string, AssignmentRow>();

  for (const row of combinedRows) {
    const assignment = normalizeAssignment(row);
    uniqueAssignments.set(assignment.id, assignment);
  }

  const assignments = Array.from(uniqueAssignments.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  const assignmentIds = assignments.map((assignment) => assignment.id);

  if (assignmentIds.length === 0) {
    return [];
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("simulation_sessions")
    .select(`
      id,
      assignment_id,
      total_score,
      created_at
    `)
    .eq("student_id", studentId)
    .in("assignment_id", assignmentIds)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const sessionsByAssignment = new Map<
    string,
    {
      count: number;
      bestScore: number;
      lastScore: number;
      lastCompletionAt: string;
    }
  >();

  for (const session of sessions ?? []) {
    if (!session.assignment_id) {
      continue;
    }

    const score = Number(session.total_score ?? 0);
    const current = sessionsByAssignment.get(session.assignment_id);

    if (!current) {
      sessionsByAssignment.set(session.assignment_id, {
        count: 1,
        bestScore: score,
        lastScore: score,
        lastCompletionAt: session.created_at,
      });

      continue;
    }

    current.count += 1;
    current.bestScore = Math.max(current.bestScore, score);
  }

  return assignments.map((assignment) => {
    const completion = sessionsByAssignment.get(assignment.id);

    return {
      ...assignment,
      completion_count: completion?.count ?? 0,
      best_score: completion?.bestScore ?? null,
      student_completed: Boolean(completion),
      student_best_score: completion?.bestScore ?? null,
      student_last_score: completion?.lastScore ?? null,
      student_last_completion_at:
        completion?.lastCompletionAt ?? null,
    };
  });
}

export async function saveAssignment(
  input: SaveAssignmentInput
): Promise<void> {
  if (!input.title.trim()) {
    throw new Error("Informe o título da atividade.");
  }

  if (!input.scenarioId) {
    throw new Error("Selecione um cenário.");
  }

  if (input.targetType === "turma" && !input.classId) {
    throw new Error("Selecione a turma.");
  }

  if (input.targetType === "aluno" && !input.studentId) {
    throw new Error("Selecione o aluno.");
  }

  const startsAt = toIsoDate(input.startsAt);

  if (!startsAt) {
    throw new Error("Informe a data de início.");
  }

  const dueAt = toIsoDate(input.dueAt);

  if (dueAt && new Date(dueAt).getTime() < new Date(startsAt).getTime()) {
    throw new Error("O prazo não pode ser anterior à data de início.");
  }

  const payload = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    scenario_id: input.scenarioId,

    class_id:
      input.targetType === "turma"
        ? input.classId
        : null,

    student_id:
      input.targetType === "aluno"
        ? input.studentId
        : null,

    starts_at: startsAt,
    due_at: dueAt,
    min_score: Math.min(100, Math.max(0, Number(input.minScore))),
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("scenario_assignments")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase
    .from("scenario_assignments")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("scenario_assignments")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAssignment(
  assignmentId: string
): Promise<void> {
  const { error } = await supabase
    .from("scenario_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }
}

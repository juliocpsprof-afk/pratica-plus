import { supabase } from "@/lib/supabase/client";

export type PresentStudentForTeam = {
  student_id: string;
  full_name: string;
  username: string;
  is_present: boolean;
};

export type TeamMemberRow = {
  id: string;
  team_id: string;
  student_id: string;
  role: string | null;
  full_name: string;
  username: string;
};

export type TeamRow = {
  id: string;
  name: string;
  class_id: string;
  created_at: string;
  class_name: string;
  members: TeamMemberRow[];
};

export type CreateManualTeamInput = {
  classId: string;
  name: string;
  members: {
    studentId: string;
    role: string;
  }[];
};

export type CreateRandomTeamsInput = {
  classId: string;
  attendanceDate: string;
  teamSize: number;
};

const roles = ["Recepção", "Vendas", "Suporte", "Supervisor"];

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function getPresentStudentsForTeams(
  classId: string,
  attendanceDate: string
): Promise<PresentStudentForTeam[]> {
  if (!classId) {
    return [];
  }

  const { data, error } = await supabase
    .from("attendance_students")
    .select(`
      student_id,
      is_present,
      students (
        id,
        profiles (
          full_name,
          username
        )
      )
    `)
    .eq("class_id", classId)
    .eq("attendance_date", attendanceDate)
    .eq("is_present", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows
    .map((row) => {
      const student = one(row.students);
      const profile = one(student?.profiles);

      return {
        student_id: row.student_id,
        full_name: profile?.full_name ?? "Aluno sem nome",
        username: profile?.username ?? "--",
        is_present: Boolean(row.is_present),
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
}

export async function getTeamsByClass(classId: string): Promise<TeamRow[]> {
  if (!classId) {
    return [];
  }

  const { data, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      class_id,
      created_at,
      classes (
        name
      ),
      team_members (
        id,
        team_id,
        student_id,
        role,
        students (
          id,
          profiles (
            full_name,
            username
          )
        )
      )
    `)
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows.map((row) => {
    const classData = one(row.classes);
    const members = (row.team_members ?? []).map((member: any) => {
      const student = one(member.students);
      const profile = one(student?.profiles);

      return {
        id: member.id,
        team_id: member.team_id,
        student_id: member.student_id,
        role: member.role,
        full_name: profile?.full_name ?? "Aluno sem nome",
        username: profile?.username ?? "--",
      };
    });

    return {
      id: row.id,
      name: row.name,
      class_id: row.class_id,
      created_at: row.created_at,
      class_name: classData?.name ?? "Turma não informada",
      members,
    };
  });
}

export async function createManualTeam(
  input: CreateManualTeamInput
): Promise<void> {
  if (input.members.length === 0) {
    throw new Error("Selecione pelo menos um aluno para a equipe.");
  }

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .insert({
      class_id: input.classId,
      name: input.name.trim(),
    })
    .select("id")
    .single();

  if (teamError) {
    throw new Error(teamError.message);
  }

  const payload = input.members.map((member) => ({
    team_id: teamData.id,
    student_id: member.studentId,
    role: member.role,
  }));

  const { error: membersError } = await supabase
    .from("team_members")
    .insert(payload);

  if (membersError) {
    throw new Error(membersError.message);
  }
}

export async function createRandomTeams(
  input: CreateRandomTeamsInput
): Promise<void> {
  const students = await getPresentStudentsForTeams(
    input.classId,
    input.attendanceDate
  );

  if (students.length === 0) {
    throw new Error("Não há alunos presentes para sortear equipes.");
  }

  if (input.teamSize < 2) {
    throw new Error("O tamanho mínimo da equipe deve ser 2 alunos.");
  }

  const shuffledStudents = shuffle(students);
  const chunks: PresentStudentForTeam[][] = [];

  for (let index = 0; index < shuffledStudents.length; index += input.teamSize) {
    chunks.push(shuffledStudents.slice(index, index + input.teamSize));
  }

  for (let index = 0; index < chunks.length; index++) {
    const teamName = `Equipe ${String(index + 1).padStart(2, "0")}`;

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        class_id: input.classId,
        name: teamName,
      })
      .select("id")
      .single();

    if (teamError) {
      throw new Error(teamError.message);
    }

    const payload = chunks[index].map((student, memberIndex) => ({
      team_id: teamData.id,
      student_id: student.student_id,
      role: roles[memberIndex % roles.length],
    }));

    const { error: membersError } = await supabase
      .from("team_members")
      .insert(payload);

    if (membersError) {
      throw new Error(membersError.message);
    }
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    throw new Error(error.message);
  }
}

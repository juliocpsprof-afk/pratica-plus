import { supabase } from "@/lib/supabase/client";

export type PresentStudentRow = {
  student_id: string;
  full_name: string;
  username: string;
};

export type TeamRow = {
  id: string;
  class_id: string | null;
  name: string;
  creation_mode: "manual" | "automatico";
  created_at: string;
};

export type TeamMemberRow = {
  id: string;
  team_id: string;
  student_id: string;
  role_name: string | null;
  created_at: string;
  students?: {
    id: string;
    profiles?: {
      full_name: string;
      username: string;
    } | null;
  } | null;
};

export type TeamWithMembers = TeamRow & {
  members: TeamMemberRow[];
};

export async function getPresentStudentsByClassAndDate(input: {
  classId: string;
  attendanceDate: string;
}): Promise<PresentStudentRow[]> {
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
    .eq("class_id", input.classId)
    .eq("attendance_date", input.attendanceDate)
    .eq("is_present", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    student_id: item.student_id,
    full_name: item.students?.profiles?.full_name ?? "Aluno sem nome",
    username: item.students?.profiles?.username ?? "--",
  }));
}

export async function createTeamWithMembers(input: {
  classId: string;
  name: string;
  creationMode: "manual" | "automatico";
  members: Array<{
    studentId: string;
    roleName?: string;
  }>;
}): Promise<void> {
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .insert({
      class_id: input.classId,
      name: input.name,
      creation_mode: input.creationMode,
    })
    .select("id")
    .single();

  if (teamError) {
    throw new Error(teamError.message);
  }

  if (input.members.length === 0) {
    return;
  }

  const rows = input.members.map((member) => ({
    team_id: teamData.id,
    student_id: member.studentId,
    role_name: member.roleName ?? null,
  }));

  const { error: membersError } = await supabase
    .from("team_members")
    .insert(rows);

  if (membersError) {
    throw new Error(membersError.message);
  }
}

export async function getTeamsByClass(classId: string): Promise<TeamWithMembers[]> {
  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, class_id, name, creation_mode, created_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (teamsError) {
    throw new Error(teamsError.message);
  }

  const teams = (teamsData ?? []) as TeamRow[];

  if (teams.length === 0) {
    return [];
  }

  const teamIds = teams.map((team) => team.id);

  const { data: membersData, error: membersError } = await supabase
    .from("team_members")
    .select(`
      id,
      team_id,
      student_id,
      role_name,
      created_at,
      students (
        id,
        profiles (
          full_name,
          username
        )
      )
    `)
    .in("team_id", teamIds);

  if (membersError) {
    throw new Error(membersError.message);
  }

  return teams.map((team) => ({
    ...team,
    members: ((membersData ?? []) as TeamMemberRow[]).filter(
      (member) => member.team_id === team.id
    ),
  }));
}

export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (error) {
    throw new Error(error.message);
  }
}

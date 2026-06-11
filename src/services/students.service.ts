import { supabase } from "@/lib/supabase/client";
import { generateStudentAccess } from "@/services/auth.service";

export type StudentStatus = "ativo" | "inativo" | "concluido";

export type StudentRow = {
  id: string;
  profile_id: string;
  course_id: string | null;
  class_id: string | null;
  enrollment_status: StudentStatus;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    role: string;
    is_active: boolean;
  } | null;
  courses?: {
    id: string;
    name: string;
  } | null;
  classes?: {
    id: string;
    name: string;
    shift: string;
  } | null;
};

export type CreateStudentInput = {
  fullName: string;
  username: string;
  password: string;
  courseId: string | null;
  classId: string | null;
};

export type ResetStudentPasswordResult = {
  username: string;
  newPassword: string;
};

export async function getStudents(): Promise<StudentRow[]> {
  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      profile_id,
      course_id,
      class_id,
      enrollment_status,
      created_at,
      updated_at,
      profiles (
        id,
        full_name,
        username,
        role,
        is_active
      ),
      courses (
        id,
        name
      ),
      classes (
        id,
        name,
        shift
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StudentRow[];
}

export async function createStudent(
  input: CreateStudentInput
): Promise<void> {
  const { error } = await supabase.rpc("create_student_with_profile", {
    p_full_name: input.fullName,
    p_username: input.username,
    p_plain_password: input.password,
    p_course_id: input.courseId,
    p_class_id: input.classId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateStudentStatus(
  studentId: string,
  status: StudentStatus
): Promise<void> {
  const { error } = await supabase
    .from("students")
    .update({
      enrollment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetStudentPassword(
  student: StudentRow
): Promise<ResetStudentPasswordResult> {
  const fullName = student.profiles?.full_name;

  if (!fullName) {
    throw new Error("Nome do aluno não encontrado.");
  }

  const access = generateStudentAccess(fullName);

  const { error } = await supabase.rpc("update_profile_password", {
    p_profile_id: student.profile_id,
    p_plain_password: access.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    username: student.profiles?.username ?? access.username,
    newPassword: access.password,
  };
}

export async function deleteStudent(studentId: string): Promise<void> {
  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("profile_id")
    .eq("id", studentId)
    .single();

  if (studentError) {
    throw new Error(studentError.message);
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", studentData.profile_id);

  if (error) {
    throw new Error(error.message);
  }
}

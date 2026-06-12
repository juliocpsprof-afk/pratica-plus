import { supabase } from "@/lib/supabase/client";

export type AttendanceStudentRow = {
  student_id: string;
  profile_id: string;
  full_name: string;
  username: string;
  enrollment_status: string;
  is_present: boolean;
};

export type SaveAttendanceInput = {
  classId: string;
  attendanceDate: string;
  students: {
    studentId: string;
    isPresent: boolean;
  }[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getStudentsForAttendance(
  classId: string,
  attendanceDate: string
): Promise<AttendanceStudentRow[]> {
  if (!classId) {
    return [];
  }

  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select(`
      id,
      profile_id,
      enrollment_status,
      profiles (
        id,
        full_name,
        username
      )
    `)
    .eq("class_id", classId)
    .order("created_at", { ascending: true });

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  const { data: attendanceData, error: attendanceError } = await supabase
    .from("attendance_students")
    .select("student_id, is_present")
    .eq("class_id", classId)
    .eq("attendance_date", attendanceDate);

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  const attendanceMap = new Map<string, boolean>();

  for (const item of attendanceData ?? []) {
    attendanceMap.set(item.student_id, Boolean(item.is_present));
  }

  const rows = (studentsData ?? []) as any[];

  return rows
    .map((row) => {
      const profile = one(row.profiles);

      return {
        student_id: row.id,
        profile_id: row.profile_id,
        full_name: profile?.full_name ?? "Aluno sem nome",
        username: profile?.username ?? "--",
        enrollment_status: row.enrollment_status ?? "ativo",
        is_present: attendanceMap.get(row.id) ?? false,
      };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
}

export async function saveAttendance(
  input: SaveAttendanceInput
): Promise<void> {
  const payload = input.students.map((student) => ({
    class_id: input.classId,
    student_id: student.studentId,
    attendance_date: input.attendanceDate,
    is_present: student.isPresent,
    updated_at: new Date().toISOString(),
  }));

  if (payload.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("attendance_students")
    .upsert(payload, {
      onConflict: "class_id,student_id,attendance_date",
    });

  if (error) {
    throw new Error(error.message);
  }
}

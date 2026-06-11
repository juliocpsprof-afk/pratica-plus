import { supabase } from "@/lib/supabase/client";

export type AttendanceStudentRow = {
  student_id: string;
  profile_id: string;
  full_name: string;
  username: string;
  course_name: string | null;
  class_name: string | null;
  is_present: boolean;
};

export type AttendanceRecordRow = {
  id: string;
  class_id: string;
  student_id: string;
  attendance_date: string;
  is_present: boolean;
  created_at: string;
};

export async function getStudentsForAttendance(
  classId: string,
  attendanceDate: string
): Promise<AttendanceStudentRow[]> {
  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select(`
      id,
      profile_id,
      course_id,
      class_id,
      profiles (
        id,
        full_name,
        username
      ),
      courses (
        id,
        name
      ),
      classes (
        id,
        name
      )
    `)
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  const studentIds = (studentsData ?? []).map((student) => student.id);

  if (studentIds.length === 0) {
    return [];
  }

  const { data: attendanceData, error: attendanceError } = await supabase
    .from("attendance_students")
    .select("student_id, is_present")
    .eq("class_id", classId)
    .eq("attendance_date", attendanceDate)
    .in("student_id", studentIds);

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  const attendanceMap = new Map<string, boolean>();

  for (const attendance of attendanceData ?? []) {
    attendanceMap.set(attendance.student_id, attendance.is_present);
  }

  return (studentsData ?? []).map((student) => ({
    student_id: student.id,
    profile_id: student.profile_id,
    full_name: student.profiles?.full_name ?? "Aluno sem nome",
    username: student.profiles?.username ?? "--",
    course_name: student.courses?.name ?? null,
    class_name: student.classes?.name ?? null,
    is_present: attendanceMap.get(student.id) ?? false,
  }));
}

export async function saveAttendance(input: {
  classId: string;
  attendanceDate: string;
  students: Array<{
    studentId: string;
    isPresent: boolean;
  }>;
}): Promise<void> {
  if (input.students.length === 0) {
    return;
  }

  const rows = input.students.map((student) => ({
    class_id: input.classId,
    student_id: student.studentId,
    attendance_date: input.attendanceDate,
    is_present: student.isPresent,
  }));

  const { error } = await supabase
    .from("attendance_students")
    .upsert(rows, {
      onConflict: "class_id,student_id,attendance_date",
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAttendanceRecordsByClass(
  classId: string,
  attendanceDate: string
): Promise<AttendanceRecordRow[]> {
  const { data, error } = await supabase
    .from("attendance_students")
    .select("id, class_id, student_id, attendance_date, is_present, created_at")
    .eq("class_id", classId)
    .eq("attendance_date", attendanceDate);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

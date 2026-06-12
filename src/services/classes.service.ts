import { supabase } from "@/lib/supabase/client";

export type ClassRow = {
  id: string;
  course_id: string;
  name: string;
  shift: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  courses?: {
    id: string;
    name: string;
  } | null;
};

export type CreateClassInput = {
  name: string;
  courseId: string;
  shift: string;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      courses (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  return rows.map((row) => ({
    ...row,
    courses: one(row.courses),
  })) as ClassRow[];
}

export async function createClass(input: CreateClassInput): Promise<void> {
  const { error } = await supabase.from("classes").insert({
    name: input.name.trim(),
    course_id: input.courseId,
    shift: input.shift,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateClassStatus(
  classId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("classes")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await supabase.from("classes").delete().eq("id", classId);

  if (error) {
    throw new Error(error.message);
  }
}

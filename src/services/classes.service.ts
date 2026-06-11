import { supabase } from "@/lib/supabase/client";

export type ClassStatus = "ativa" | "encerrada";

export type ClassRow = {
  id: string;
  name: string;
  course_id: string | null;
  shift: string;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
  courses?: {
    id: string;
    name: string;
  } | null;
};

export type CreateClassInput = {
  name: string;
  courseId: string | null;
  shift: string;
};

export async function getClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      course_id,
      shift,
      status,
      created_at,
      updated_at,
      courses (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClassRow[];
}

export async function createClass(input: CreateClassInput): Promise<ClassRow> {
  const { data, error } = await supabase
    .from("classes")
    .insert({
      name: input.name,
      course_id: input.courseId,
      shift: input.shift,
      status: "ativa",
    })
    .select(`
      id,
      name,
      course_id,
      shift,
      status,
      created_at,
      updated_at,
      courses (
        id,
        name
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClassRow;
}

export async function updateClassStatus(
  classId: string,
  status: ClassStatus
): Promise<void> {
  const { error } = await supabase
    .from("classes")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId);

  if (error) {
    throw new Error(error.message);
  }
}

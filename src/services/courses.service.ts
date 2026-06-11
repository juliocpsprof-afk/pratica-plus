import { supabase } from "@/lib/supabase/client";

export type CourseStatus = "ativo" | "inativo";

export type CourseRow = {
  id: string;
  name: string;
  module_id: string | null;
  workload: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  modules?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type CreateCourseInput = {
  name: string;
  moduleId: string | null;
  workload: string;
};

export async function getCourses(): Promise<CourseRow[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      module_id,
      workload,
      status,
      created_at,
      updated_at,
      modules (
        id,
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseRow[];
}

export async function createCourse(input: CreateCourseInput): Promise<CourseRow> {
  const { data, error } = await supabase
    .from("courses")
    .insert({
      name: input.name,
      module_id: input.moduleId,
      workload: input.workload,
      status: "ativo",
    })
    .select(`
      id,
      name,
      module_id,
      workload,
      status,
      created_at,
      updated_at,
      modules (
        id,
        name,
        slug
      )
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CourseRow;
}

export async function updateCourseStatus(
  courseId: string,
  status: CourseStatus
): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }
}

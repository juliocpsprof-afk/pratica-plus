import { supabase } from "@/lib/supabase/client";

export type CourseRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type CreateCourseInput = {
  name: string;
  description?: string;
};

export async function getCourses(): Promise<CourseRow[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseRow[];
}

export async function createCourse(input: CreateCourseInput): Promise<void> {
  const { error } = await supabase.from("courses").insert({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCourseStatus(
  courseId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) {
    throw new Error(error.message);
  }
}

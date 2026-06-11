import { supabase } from "@/lib/supabase/client";

export type ModuleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
};

export async function getModules(): Promise<ModuleRow[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("id, name, slug, description, created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

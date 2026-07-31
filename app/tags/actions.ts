"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";

const TAG_COLORS = [
  "#4C7A7C", // teal
  "#C08A2E", // gold
  "#7C9A6E", // sage
  "#8B5E7A", // plum
  "#B85C42", // rust
  "#1A1A1A", // ink
];

export async function createTag(name: string, color?: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace || !name.trim()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({
      workspace_id: workspace.id,
      name: name.trim(),
      color: color ?? TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
    })
    .select()
    .single();

  if (error) return null;

  revalidatePath("/tags");
  revalidatePath("/clients");
  return data;
}

export async function updateTag(tagId: string, data: { name?: string; color?: string }) {
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name.trim();
  if (data.color !== undefined) update.color = data.color;
  await supabase.from("tags").update(update).eq("id", tagId);

  revalidatePath("/tags");
  revalidatePath("/clients");
}

export async function deleteTag(tagId: string) {
  const supabase = await createClient();
  await supabase.from("tags").delete().eq("id", tagId);

  revalidatePath("/tags");
  revalidatePath("/clients");
}

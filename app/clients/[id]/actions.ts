"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";
import type { ContentPhase } from "@/lib/types";

export async function createContentItem(clientId: string, phase: ContentPhase) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("content_items").insert({
    workspace_id: workspace.id,
    client_id: clientId,
    title: "New content",
    phase,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function updateContentPhase(
  clientId: string,
  itemId: string,
  phase: ContentPhase
) {
  const supabase = await createClient();
  await supabase
    .from("content_items")
    .update({ phase, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  revalidatePath(`/clients/${clientId}`);
}

export async function updateContentTitle(
  clientId: string,
  itemId: string,
  title: string
) {
  const supabase = await createClient();
  await supabase
    .from("content_items")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  revalidatePath(`/clients/${clientId}`);
}

export async function addActivityNote(clientId: string, body: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace || !body.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("client_activity").insert({
    client_id: clientId,
    workspace_id: workspace.id,
    activity_type: "note",
    body,
    actor_label: user?.user_metadata?.full_name ?? null,
  });

  revalidatePath(`/clients/${clientId}`);
}

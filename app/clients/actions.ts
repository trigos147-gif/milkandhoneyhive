"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";

const PALETTE = ["#4C7A7C", "#C08A2E", "#7C9A6E", "#8B5E7A", "#B85C42"];

export async function addClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

  await supabase.from("clients").insert({
    workspace_id: workspace.id,
    name,
    color,
    status: "active",
  });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

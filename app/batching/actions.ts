"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";
import {
  DEFAULT_BATCH_SCHEDULE,
  PRODUCTION_STAGE_LABELS,
  type ProductionStage,
} from "@/lib/types";

const BATCHABLE_STAGES: ProductionStage[] = [
  "research",
  "ideation",
  "writing",
  "filming",
  "designing",
];

export async function updateProductionStageGlobal(itemId: string, stage: ProductionStage) {
  const supabase = await createClient();
  await supabase
    .from("content_items")
    .update({ production_stage: stage, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  revalidatePath("/batching");
  revalidatePath("/");
}

export async function updateBatchSchedule(schedule: Record<string, number>) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("workspaces").update({ batch_schedule: schedule }).eq("id", workspace.id);

  revalidatePath("/batching");
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Given a target weekday (1=Mon..5=Fri) and a "today", find the next date
// on/after today that falls on that weekday.
function nextWeekdayOnOrAfter(today: Date, targetWeekday: number): Date {
  // JS getDay(): 0=Sun..6=Sat. Our schedule uses 1=Mon..5=Fri.
  let d = new Date(today);
  for (let i = 0; i < 8; i++) {
    if (d.getDay() === targetWeekday) return d;
    d = addDays(d, 1);
  }
  return today;
}

export async function generateBatchPlan(scope: "week" | "month") {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return { created: 0, summary: "No workspace found." };

  const supabase = await createClient();
  const schedule = { ...DEFAULT_BATCH_SCHEDULE, ...(workspace.batch_schedule ?? {}) } as Record<
    ProductionStage,
    number
  >;

  const today = new Date(new Date().toDateString());
  const rangeEnd = scope === "week" ? addDays(today, 6) : addDays(today, 29);

  const { data: items } = await supabase
    .from("content_items")
    .select("id, client_id, title, production_stage, format, phase")
    .eq("workspace_id", workspace.id)
    .neq("phase", "closed")
    .in("production_stage", BATCHABLE_STAGES);

  if (!items || items.length === 0) {
    return { created: 0, summary: "Nothing sitting in a batchable stage right now." };
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("workspace_id", workspace.id);
  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  // Don't double-book a post that already has an open (unchecked) batch task
  // for its current stage.
  const itemIds = items.map((i) => i.id);
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("content_item_id, task_type, checked_off")
    .in("content_item_id", itemIds);

  const alreadyScheduled = new Set(
    (existingTasks ?? [])
      .filter((t) => !t.checked_off)
      .map((t) => `${t.content_item_id}:${t.task_type}`)
  );

  const rows: {
    workspace_id: string;
    client_id: string;
    title: string;
    task_type: string;
    due_date: string;
    content_item_id: string;
    phase: string;
  }[] = [];

  for (const item of items) {
    const stage = item.production_stage as ProductionStage;
    const key = `${item.id}:${stage}`;
    if (alreadyScheduled.has(key)) continue;

    const weekday = schedule[stage] ?? DEFAULT_BATCH_SCHEDULE[stage];
    const day = nextWeekdayOnOrAfter(today, weekday);
    if (day > rangeEnd) continue;

    rows.push({
      workspace_id: workspace.id,
      client_id: item.client_id,
      title: `${clientNameById.get(item.client_id) ?? "Client"} — ${PRODUCTION_STAGE_LABELS[stage]}: ${item.title}`,
      task_type: stage,
      due_date: toISODate(day),
      content_item_id: item.id,
      phase: "idea",
    });
  }

  if (rows.length === 0) {
    return {
      created: 0,
      summary: "Everything already has a batch day scheduled this " + scope + ".",
    };
  }

  await supabase.from("tasks").insert(rows);

  revalidatePath("/batching");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return {
    created: rows.length,
    summary: `Scheduled ${rows.length} batch task(s) onto their stage days this ${scope}.`,
  };
}

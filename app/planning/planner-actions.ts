"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";

const MAX_TASKS_PER_DAY = 3;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isWeekday(d: Date) {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

export async function generatePlan(scope: "week" | "month") {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return { created: 0, summary: "No workspace found." };

  const supabase = await createClient();

  const today = new Date(new Date().toDateString());
  const rangeEnd = scope === "week" ? addDays(today, 6) : addDays(today, 29);

  const { data: contracts } = await supabase
    .from("client_contracts")
    .select("id, client_id, status")
    .eq("workspace_id", workspace.id)
    .eq("status", "active");

  if (!contracts || contracts.length === 0) {
    return { created: 0, summary: "No active contracts yet — add one on a client page first." };
  }

  const contractIds = contracts.map((c) => c.id);
  const { data: deliverables } = await supabase
    .from("contract_deliverables")
    .select("*")
    .in("contract_id", contractIds);

  if (!deliverables || deliverables.length === 0) {
    return { created: 0, summary: "No deliverables set on any active contract yet." };
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("workspace_id", workspace.id);
  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const clientIdByContract = new Map(contracts.map((c) => [c.id, c.client_id]));

  // Figure out how many units of each deliverable are still needed in range,
  // accounting for tasks already scheduled against it in that window.
  const needed: {
    clientId: string;
    clientName: string;
    deliverableId: string;
    deliverableType: string;
    remaining: number;
  }[] = [];

  for (const d of deliverables) {
    let target = 0;
    if (d.frequency === "weekly") {
      target = scope === "week" ? d.quantity : d.quantity * 4;
    } else if (d.frequency === "monthly") {
      target = scope === "week" ? Math.ceil(d.quantity / 4) : d.quantity;
    } else {
      target = d.quantity;
    }

    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("deliverable_id", d.id)
      .gte("due_date", toISODate(today))
      .lte("due_date", toISODate(rangeEnd));

    const remaining = Math.max(0, target - (count ?? 0));
    if (remaining > 0) {
      const clientId = clientIdByContract.get(d.contract_id) as string;
      needed.push({
        clientId,
        clientName: clientNameById.get(clientId) ?? "Client",
        deliverableId: d.id,
        deliverableType: d.deliverable_type,
        remaining,
      });
    }
  }

  if (needed.length === 0) {
    return {
      created: 0,
      summary: "Everything owed in this window is already scheduled. Nothing new to add.",
    };
  }

  // Build the flat list of individual units to place, then round-robin across
  // weekdays so no single day gets overloaded.
  const units: { clientId: string; clientName: string; deliverableId: string; deliverableType: string }[] =
    [];
  for (const n of needed) {
    for (let i = 0; i < n.remaining; i++) {
      units.push({
        clientId: n.clientId,
        clientName: n.clientName,
        deliverableId: n.deliverableId,
        deliverableType: n.deliverableType,
      });
    }
  }

  const days: Date[] = [];
  for (let d = new Date(today); d <= rangeEnd; d = addDays(d, 1)) {
    if (isWeekday(d)) days.push(new Date(d));
  }
  if (days.length === 0) days.push(today);

  const dayLoad = new Map<string, number>();
  const rows: {
    workspace_id: string;
    client_id: string;
    title: string;
    task_type: string;
    due_date: string;
    deliverable_id: string;
  }[] = [];

  let dayIndex = 0;
  let attempts = 0;
  for (const unit of units) {
    // find next day under capacity
    while (
      (dayLoad.get(toISODate(days[dayIndex % days.length])) ?? 0) >= MAX_TASKS_PER_DAY &&
      attempts < days.length * MAX_TASKS_PER_DAY + units.length
    ) {
      dayIndex++;
      attempts++;
    }
    const day = days[dayIndex % days.length];
    const key = toISODate(day);
    dayLoad.set(key, (dayLoad.get(key) ?? 0) + 1);
    rows.push({
      workspace_id: workspace.id,
      client_id: unit.clientId,
      title: `${unit.clientName} — ${unit.deliverableType}`,
      task_type: unit.deliverableType,
      due_date: key,
      deliverable_id: unit.deliverableId,
    });
    dayIndex++;
  }

  const { data: planRun } = await supabase
    .from("plan_runs")
    .insert({
      workspace_id: workspace.id,
      scope,
      range_start: toISODate(today),
      range_end: toISODate(rangeEnd),
      summary: `Scheduled ${rows.length} task(s) across ${days.length} working day(s).`,
    })
    .select()
    .single();

  await supabase.from("tasks").insert(
    rows.map((r) => ({ ...r, plan_run_id: planRun?.id ?? null, phase: "idea" }))
  );

  revalidatePath("/planning");
  revalidatePath("/dashboard");

  return {
    created: rows.length,
    summary: `Scheduled ${rows.length} task(s) across ${days.length} working day(s) to cover everyone's owed deliverables this ${scope}.`,
  };
}

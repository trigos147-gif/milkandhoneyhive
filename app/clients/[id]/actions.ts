"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";
import type { BillingType, ContentPhase, DeliverableFrequency, ProductionStage } from "@/lib/types";
import { nextProductionStage } from "@/lib/types";

const STAGE_TASK_TYPES = new Set([
  "research",
  "ideation",
  "writing",
  "filming",
  "designing",
]);

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
  revalidatePath("/");
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
  revalidatePath("/");
}

export async function toggleContentPosted(clientId: string, itemId: string, checked: boolean) {
  const supabase = await createClient();
  await supabase
    .from("content_items")
    .update({
      checked_off: checked,
      checked_off_at: checked ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
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
  revalidatePath("/");
}

export async function createContract(
  clientId: string,
  data: {
    billingType: BillingType;
    rateAmount: number | null;
    contractStart: string | null;
    contractEnd: string | null;
    notes: string | null;
  }
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return null;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("client_contracts")
    .insert({
      workspace_id: workspace.id,
      client_id: clientId,
      billing_type: data.billingType,
      rate_amount: data.rateAmount,
      contract_start: data.contractStart,
      contract_end: data.contractEnd,
      notes: data.notes,
    })
    .select()
    .single();

  revalidatePath(`/clients/${clientId}`);
  return row ?? null;
}

export async function attachContractFile(
  clientId: string,
  contractId: string,
  filePath: string,
  fileName: string
) {
  const supabase = await createClient();
  await supabase
    .from("client_contracts")
    .update({ file_path: filePath, file_name: fileName, updated_at: new Date().toISOString() })
    .eq("id", contractId);

  revalidatePath(`/clients/${clientId}`);
}

export async function removeContractFile(clientId: string, contractId: string) {
  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("client_contracts")
    .select("file_path")
    .eq("id", contractId)
    .single();

  if (contract?.file_path) {
    await supabase.storage.from("contract-files").remove([contract.file_path]);
  }

  await supabase
    .from("client_contracts")
    .update({ file_path: null, file_name: null, updated_at: new Date().toISOString() })
    .eq("id", contractId);

  revalidatePath(`/clients/${clientId}`);
}

export async function getContractFileUrl(filePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("contract-files")
    .createSignedUrl(filePath, 60 * 5);

  return data?.signedUrl ?? null;
}

export async function updateContractStatus(
  clientId: string,
  contractId: string,
  status: string
) {
  const supabase = await createClient();
  await supabase
    .from("client_contracts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", contractId);

  revalidatePath(`/clients/${clientId}`);
}

export async function addDeliverable(
  clientId: string,
  contractId: string,
  data: {
    deliverableType: string;
    quantity: number;
    frequency: DeliverableFrequency;
  }
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("contract_deliverables").insert({
    workspace_id: workspace.id,
    contract_id: contractId,
    deliverable_type: data.deliverableType,
    quantity: data.quantity,
    frequency: data.frequency,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteDeliverable(clientId: string, deliverableId: string) {
  const supabase = await createClient();
  await supabase.from("contract_deliverables").delete().eq("id", deliverableId);
  revalidatePath(`/clients/${clientId}`);
}

export async function addPayment(
  clientId: string,
  data: {
    contractId: string | null;
    amount: number;
    periodLabel: string | null;
    dueDate: string | null;
  }
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("payments").insert({
    workspace_id: workspace.id,
    client_id: clientId,
    contract_id: data.contractId,
    amount: data.amount,
    period_label: data.periodLabel,
    due_date: data.dueDate,
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/payments");
}

export async function deleteContract(clientId: string, contractId: string) {
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("client_contracts")
    .select("file_path")
    .eq("id", contractId)
    .single();

  if (contract?.file_path) {
    await supabase.storage.from("contract-files").remove([contract.file_path]);
  }

  await supabase.from("client_contracts").delete().eq("id", contractId);

  revalidatePath(`/clients/${clientId}`);
}

export async function createTask(
  clientId: string,
  data: { title: string; dueDate: string; taskType: string | null }
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("tasks").insert({
    workspace_id: workspace.id,
    client_id: clientId,
    title: data.title,
    task_type: data.taskType,
    due_date: data.dueDate,
    phase: "idea",
  });

  revalidatePath(`/clients/${clientId}`);
}

const TASK_TYPE_TO_FORMAT: Record<string, string> = {
  Reel: "Reel",
  Reels: "Reel",
  Post: "Post",
  Posts: "Post",
  Story: "Story",
  Stories: "Story",
  Carousel: "Carousel",
  Carousels: "Carousel",
  Video: "Video",
  Videos: "Video",
};

// Called when a To Do task (usually auto-scheduled from a contract deliverable) is
// clicked. If it's already tied to a content item, hand that back. Otherwise spin up
// a new content item on the fly — pre-filled from the task — and link the two so
// future clicks (and the Board/Media tabs) land on the same piece of content.
export async function openTaskAsContent(clientId: string, taskId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return null;

  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) return null;

  if (task.content_item_id) {
    const { data: existing } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", task.content_item_id)
      .single();
    if (existing) return existing;
  }

  const format = (task.task_type && TASK_TYPE_TO_FORMAT[task.task_type]) || "Post";

  const { data: newItem, error } = await supabase
    .from("content_items")
    .insert({
      workspace_id: workspace.id,
      client_id: clientId,
      title: task.title,
      format,
      phase: "idea",
      scheduled_date: task.due_date,
    })
    .select()
    .single();

  if (error || !newItem) return null;

  await supabase.from("tasks").update({ content_item_id: newItem.id }).eq("id", taskId);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  revalidatePath("/planning");

  return newItem;
}

export async function toggleTaskChecked(clientId: string, taskId: string, checked: boolean) {
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, task_type, content_item_id")
    .eq("id", taskId)
    .maybeSingle();

  await supabase
    .from("tasks")
    .update({
      checked_off: checked,
      checked_off_at: checked ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  // If this was a batch stage task (research/writing/filming/etc.) being
  // checked off, auto-advance the linked post to the next stage.
  if (
    checked &&
    task?.content_item_id &&
    task.task_type &&
    STAGE_TASK_TYPES.has(task.task_type)
  ) {
    const { data: item } = await supabase
      .from("content_items")
      .select("id, format, production_stage")
      .eq("id", task.content_item_id)
      .maybeSingle();

    if (item && item.production_stage === task.task_type) {
      const next = nextProductionStage(item.production_stage as ProductionStage, item.format);
      if (next) {
        await supabase
          .from("content_items")
          .update({ production_stage: next, updated_at: new Date().toISOString() })
          .eq("id", item.id);
      }
    }
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  revalidatePath("/batching");
}

export async function deleteTask(clientId: string, taskId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath(`/clients/${clientId}`);
}

export async function rescheduleTask(clientId: string, taskId: string, dueDate: string) {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ due_date: dueDate, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteContentItem(clientId: string, itemId: string) {
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("content_files")
    .select("file_path")
    .eq("content_item_id", itemId);

  if (files && files.length > 0) {
    await supabase.storage.from("content-media").remove(files.map((f) => f.file_path));
  }

  await supabase.from("content_items").delete().eq("id", itemId);
  revalidatePath(`/clients/${clientId}`);
}

export async function updateContentItem(
  clientId: string,
  itemId: string,
  data: {
    title?: string;
    format?: string;
    pillarId?: string | null;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    platforms?: string[];
    caption?: string | null;
    hashtags?: string | null;
    productionStage?: ProductionStage;
  }
) {
  const supabase = await createClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) update.title = data.title;
  if (data.format !== undefined) update.format = data.format;
  if (data.pillarId !== undefined) update.pillar_id = data.pillarId;
  if (data.scheduledDate !== undefined) update.scheduled_date = data.scheduledDate;
  if (data.scheduledTime !== undefined) update.scheduled_time = data.scheduledTime;
  if (data.platforms !== undefined) update.platforms = data.platforms;
  if (data.caption !== undefined) update.caption = data.caption;
  if (data.hashtags !== undefined) update.hashtags = data.hashtags;
  if (data.productionStage !== undefined) update.production_stage = data.productionStage;

  await supabase.from("content_items").update(update).eq("id", itemId);
  revalidatePath(`/clients/${clientId}`);
}

export async function createContentSubtask(clientId: string, contentItemId: string, title: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("tasks").insert({
    workspace_id: workspace.id,
    client_id: clientId,
    content_item_id: contentItemId,
    title,
    phase: "idea",
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function attachContentFile(
  clientId: string,
  contentItemId: string,
  filePath: string,
  fileName: string,
  fileType: string | null
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("content_files").insert({
    workspace_id: workspace.id,
    content_item_id: contentItemId,
    file_path: filePath,
    file_name: fileName,
    file_type: fileType,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function removeContentFile(clientId: string, fileId: string, filePath: string) {
  const supabase = await createClient();
  await supabase.storage.from("content-media").remove([filePath]);
  await supabase.from("content_files").delete().eq("id", fileId);
  revalidatePath(`/clients/${clientId}`);
}

export async function getContentFileUrl(filePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("content-media")
    .createSignedUrl(filePath, 60 * 30);
  return data?.signedUrl ?? null;
}

export async function getContentItemFiles(contentItemId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_files")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("created_at", { ascending: true });
  return data ?? [];
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
  revalidatePath("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";
import type { BillingType, ContentPhase, DeliverableFrequency } from "@/lib/types";

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

export async function toggleTaskChecked(clientId: string, taskId: string, checked: boolean) {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ checked_off: checked, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  revalidatePath(`/clients/${clientId}`);
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

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { getCurrentWorkspace } from "@/lib/queries";
import type { PaymentStatus } from "@/lib/types";

export async function addStandalonePayment(data: {
  clientId: string;
  amount: number;
  periodLabel: string | null;
  dueDate: string | null;
}) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return;

  const supabase = await createClient();
  await supabase.from("payments").insert({
    workspace_id: workspace.id,
    client_id: data.clientId,
    amount: data.amount,
    period_label: data.periodLabel,
    due_date: data.dueDate,
  });

  revalidatePath("/payments");
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus) {
  const supabase = await createClient();
  await supabase
    .from("payments")
    .update({
      status,
      paid_date: status === "paid" ? new Date().toISOString().slice(0, 10) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  revalidatePath("/payments");
}

export async function deletePayment(paymentId: string) {
  const supabase = await createClient();
  await supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath("/payments");
}

import { createClient } from "./supabase-server";
import type {
  BusinessEvent,
  Cadence,
  Client,
  ClientActivity,
  ClientContract,
  ContentFile,
  ContentItem,
  ContentPillar,
  ContractDeliverable,
  Payment,
  PlanningNote,
  Tag,
  Task,
  Workspace,
} from "./types";

export async function getCurrentWorkspace(): Promise<Workspace | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  return workspace ?? null;
}

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getClient(clientId: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  return data ?? null;
}

export async function getContentItems(clientId?: string): Promise<ContentItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("content_items")
    .select("*")
    .order("updated_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data } = await query;
  return data ?? [];
}

export async function getTasks(clientId?: string): Promise<Task[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*")
    .order("updated_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data } = await query;
  return data ?? [];
}

export async function getContentPillars(): Promise<ContentPillar[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_pillars")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("*").order("name", { ascending: true });
  return data ?? [];
}

// Returns a map of content_item_id -> array of tag_ids, for every content
// item in the workspace (or just one client's, if clientId is given).
export async function getContentItemTagMap(clientId?: string): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  let query = supabase
    .from("content_item_tags")
    .select("tag_id, content_item_id, content_items!inner(client_id)");
  if (clientId) query = query.eq("content_items.client_id", clientId);
  const { data } = await query;

  const map: Record<string, string[]> = {};
  for (const row of (data ?? []) as unknown as { tag_id: string; content_item_id: string }[]) {
    if (!map[row.content_item_id]) map[row.content_item_id] = [];
    map[row.content_item_id].push(row.tag_id);
  }
  return map;
}

export async function getCadences(): Promise<Cadence[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("cadences").select("*");
  return data ?? [];
}

export async function getPlanningNotes(clientId?: string): Promise<PlanningNote[]> {
  const supabase = await createClient();
  let query = supabase
    .from("planning_notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data } = await query;
  return data ?? [];
}

export async function getBusinessEvents(): Promise<BusinessEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("business_events").select("*");
  return data ?? [];
}

export async function getClientActivity(clientId: string): Promise<ClientActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_activity")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getRecentActivity(limit = 10): Promise<ClientActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getClientContracts(clientId?: string): Promise<ClientContract[]> {
  const supabase = await createClient();
  let query = supabase
    .from("client_contracts")
    .select("*")
    .order("created_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data } = await query;
  return data ?? [];
}

export async function getContractDeliverables(
  contractIds?: string[]
): Promise<ContractDeliverable[]> {
  const supabase = await createClient();
  let query = supabase.from("contract_deliverables").select("*");
  if (contractIds) {
    if (contractIds.length === 0) return [];
    query = query.in("contract_id", contractIds);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getPayments(clientId?: string): Promise<Payment[]> {
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data } = await query;
  return data ?? [];
}

export async function getClientMediaFiles(clientId: string): Promise<
  (ContentFile & { content_item_title: string; content_item_phase: string; signed_url: string | null })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_files")
    .select("*, content_items!inner(client_id, title, phase)")
    .eq("content_items.client_id", clientId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as (ContentFile & {
    content_items: { title: string; phase: string };
  })[];

  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("content-media")
        .createSignedUrl(row.file_path, 60 * 30);
      return {
        ...row,
        content_item_title: row.content_items.title,
        content_item_phase: row.content_items.phase,
        signed_url: signed?.signedUrl ?? null,
      };
    })
  );

  return withUrls;
}

export async function getContentFiles(contentItemId: string): Promise<ContentFile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_files")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: (user.user_metadata?.full_name as string) ?? "",
  };
}

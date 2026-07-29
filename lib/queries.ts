import { createClient } from "./supabase-server";
import type {
  BusinessEvent,
  Cadence,
  Client,
  ClientActivity,
  ContentItem,
  ContentPillar,
  PlanningNote,
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

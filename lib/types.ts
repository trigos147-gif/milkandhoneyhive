export type ContentPhase = "idea" | "in_progress" | "pending" | "approved" | "closed";

export type ClientStatus = "lead" | "onboarding" | "active" | "paused" | "archived";

export type BillingType = "retainer" | "per_deliverable" | "one_time" | "as_needed";

export type PaymentStatus = "pending" | "invoiced" | "paid" | "overdue";

export type DeliverableFrequency = "weekly" | "monthly" | "one_time";

export interface Workspace {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  status: ClientStatus;
  cadence_id: string | null;
  client_type: string | null;
  offer_summary: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tags: string[];
  created_at: string;
  archived_at: string | null;
}

export interface ContentPillar {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface Cadence {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
}

export interface ContentItem {
  id: string;
  workspace_id: string;
  client_id: string;
  title: string;
  format: string;
  pillar_id: string | null;
  phase: ContentPhase;
  scheduled_date: string | null;
  caption: string | null;
  notes: string | null;
  asset_url: string | null;
  checked_off: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  client_id: string;
  title: string;
  task_type: string | null;
  phase: ContentPhase;
  due_date: string | null;
  checked_off: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanningNote {
  id: string;
  workspace_id: string;
  client_id: string;
  cycle_label: string | null;
  idea: string;
  pillar_id: string | null;
  promoted_to_content_id: string | null;
  created_at: string;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  workspace_id: string;
  actor_label: string | null;
  activity_type: string;
  body: string | null;
  created_at: string;
}

export interface BusinessEvent {
  id: string;
  workspace_id: string;
  client_id: string;
  title: string;
  event_date: string;
  notes: string | null;
  created_at: string;
}

export interface ClientContract {
  id: string;
  workspace_id: string;
  client_id: string;
  billing_type: BillingType;
  rate_amount: number | null;
  currency: string;
  contract_start: string | null;
  contract_end: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractDeliverable {
  id: string;
  workspace_id: string;
  contract_id: string;
  deliverable_type: string;
  quantity: number;
  frequency: DeliverableFrequency;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  workspace_id: string;
  client_id: string;
  contract_id: string | null;
  amount: number;
  currency: string;
  period_label: string | null;
  status: PaymentStatus;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanRun {
  id: string;
  workspace_id: string;
  scope: string;
  range_start: string;
  range_end: string;
  summary: string | null;
  created_at: string;
}

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  retainer: "Retainer",
  per_deliverable: "Per deliverable",
  one_time: "One-time",
  as_needed: "As needed",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  invoiced: "Invoiced",
  paid: "Paid",
  overdue: "Overdue",
};

export const PHASE_LABELS: Record<ContentPhase, string> = {
  idea: "Idea",
  in_progress: "In Progress",
  pending: "Pending",
  approved: "Approved",
  closed: "Closed",
};

export const PHASE_ORDER: ContentPhase[] = [
  "idea",
  "in_progress",
  "pending",
  "approved",
  "closed",
];

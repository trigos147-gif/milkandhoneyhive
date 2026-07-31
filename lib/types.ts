export type ContentPhase = "idea" | "in_progress" | "pending" | "approved" | "closed";

export type ProductionStage =
  | "research"
  | "ideation"
  | "writing"
  | "filming"
  | "designing"
  | "scheduled";

export type ClientStatus = "lead" | "onboarding" | "active" | "paused" | "archived";

export type BillingType = "retainer" | "per_deliverable" | "one_time" | "as_needed";

export type PaymentStatus = "pending" | "invoiced" | "paid" | "overdue";

export type DeliverableFrequency = "weekly" | "monthly" | "one_time";

export interface Workspace {
  id: string;
  name: string;
  plan: string;
  created_at: string;
  batch_schedule: Record<string, number>;
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
  production_stage: ProductionStage;
  scheduled_date: string | null;
  scheduled_time: string | null;
  platforms: string[];
  caption: string | null;
  hashtags: string | null;
  notes: string | null;
  asset_url: string | null;
  checked_off: boolean;
  checked_off_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentFile {
  id: string;
  workspace_id: string;
  content_item_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  created_at: string;
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
  checked_off_at: string | null;
  content_item_id: string | null;
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
  file_path: string | null;
  file_name: string | null;
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
  in_progress: "Drafting",
  pending: "Pending",
  approved: "Approved",
  closed: "Posted",
};

export const PHASE_ORDER: ContentPhase[] = [
  "idea",
  "in_progress",
  "pending",
  "approved",
  "closed",
];

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  research: "Research",
  ideation: "Ideation / Planning",
  writing: "Writing",
  filming: "Filming & Editing",
  designing: "Designing & Editing",
  scheduled: "Scheduled",
};

export const PRODUCTION_STAGE_SHORT_LABELS: Record<ProductionStage, string> = {
  research: "Research",
  ideation: "Ideation",
  writing: "Writing",
  filming: "Filming",
  designing: "Designing",
  scheduled: "Scheduled",
};

export const PRODUCTION_STAGE_COLORS: Record<ProductionStage, string> = {
  research: "var(--teal)",
  ideation: "var(--sage)",
  writing: "var(--gold)",
  filming: "var(--rust)",
  designing: "var(--rust)",
  scheduled: "var(--plum)",
};

// Formats that go down the "filming" branch vs. the "designing" branch
// after Writing. Everything else defaults to designing.
const FILMING_FORMATS = new Set(["Reel", "Video"]);

export function isFilmedFormat(formatValue: string | null | undefined): boolean {
  return !!formatValue && FILMING_FORMATS.has(formatValue);
}

// The full stage pipeline for a given content format — used to build the
// starting-stage picker and to figure out "what's next" after a stage.
export function stagePipelineForFormat(formatValue: string | null | undefined): ProductionStage[] {
  const branch: ProductionStage = isFilmedFormat(formatValue) ? "filming" : "designing";
  return ["research", "ideation", "writing", branch, "scheduled"];
}

export function nextProductionStage(
  current: ProductionStage,
  formatValue: string | null | undefined
): ProductionStage | null {
  const pipeline = stagePipelineForFormat(formatValue);
  const idx = pipeline.indexOf(current);
  if (idx === -1 || idx === pipeline.length - 1) return null;
  return pipeline[idx + 1];
}

export const DEFAULT_BATCH_SCHEDULE: Record<ProductionStage, number> = {
  research: 1,
  ideation: 2,
  writing: 3,
  filming: 4,
  designing: 4,
  scheduled: 5,
};

export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

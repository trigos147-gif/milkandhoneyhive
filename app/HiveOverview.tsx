import Link from "next/link";
import { format, isPast, isToday, parseISO } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import type {
  Client,
  ClientActivity,
  ContentItem,
  ContentPhase,
  Task,
} from "@/lib/types";
import { PHASE_LABELS, PHASE_ORDER } from "@/lib/types";

const PHASE_COLOR: Record<ContentPhase, string> = {
  idea: "var(--rust)",
  in_progress: "var(--gold)",
  pending: "var(--plum)",
  approved: "var(--sage)",
  closed: "var(--ink-soft)",
};

function Card({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="border-b border-[var(--ink)]/8 px-6 py-4">
        <p className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
          {eyebrow}
        </p>
        <h2 className="font-display text-lg font-medium">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function StatTiles({
  activeClients,
  totalContent,
  scheduledThisWeek,
  openTasks,
}: {
  activeClients: number;
  totalContent: number;
  scheduledThisWeek: number;
  openTasks: number;
}) {
  const tiles = [
    { label: "Active clients", value: activeClients },
    { label: "Content items", value: totalContent },
    { label: "Scheduled this week", value: scheduledThisWeek },
    { label: "Open tasks", value: openTasks },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-2xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] px-5 py-4"
        >
          <p className="font-display text-3xl font-medium">{t.value}</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

export function UpcomingItems({
  clients,
  items,
  tasks,
}: {
  clients: Client[];
  items: ContentItem[];
  tasks: Task[];
}) {
  const clientById = new Map(clients.map((c) => [c.id, c]));

  type Row = {
    id: string;
    kind: "content" | "task";
    title: string;
    clientId: string;
    date: string;
  };

  const rows: Row[] = [
    ...items
      .filter((i) => i.scheduled_date)
      .map((i) => ({
        id: i.id,
        kind: "content" as const,
        title: i.title,
        clientId: i.client_id,
        date: i.scheduled_date!,
      })),
    ...tasks
      .filter((t) => t.due_date && !t.checked_off)
      .map((t) => ({
        id: t.id,
        kind: "task" as const,
        title: t.title,
        clientId: t.client_id,
        date: t.due_date!,
      })),
  ]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 8);

  return (
    <Card eyebrow="Upcoming" title="Scheduled content and tasks">
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-[var(--ink-soft)]">
          Nothing coming up.
        </p>
      ) : (
        <div className="divide-y divide-[var(--ink)]/6">
          {rows.map((r) => {
            const client = clientById.get(r.clientId);
            const date = parseISO(r.date);
            const overdue = isPast(date) && !isToday(date);
            return (
              <Link
                key={`${r.kind}-${r.id}`}
                href={`/clients/${r.clientId}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-[var(--paper)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: client?.color ?? "#999" }}
                  />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {client?.name ?? "Unknown client"} ·{" "}
                      {r.kind === "task" ? "Task" : "Content"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs ${
                    overdue ? "font-medium text-[var(--rust)]" : "text-[var(--ink-soft)]"
                  }`}
                >
                  {format(date, "MMM d")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function RecentActivity({
  clients,
  activity,
}: {
  clients: Client[];
  activity: ClientActivity[];
}) {
  const clientById = new Map(clients.map((c) => [c.id, c]));

  return (
    <Card eyebrow="Recently updated" title="Recent activity">
      {activity.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-[var(--ink-soft)]">
          No activity yet.
        </p>
      ) : (
        <div className="divide-y divide-[var(--ink)]/6">
          {activity.map((a) => {
            const client = clientById.get(a.client_id);
            return (
              <Link
                key={a.id}
                href={`/clients/${a.client_id}`}
                className="block px-6 py-3 hover:bg-[var(--paper)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: client?.color ?? "#999" }}
                  />
                  <p className="text-xs font-medium text-[var(--ink-soft)]">
                    {client?.name ?? "Unknown client"}
                  </p>
                </div>
                <p className="mt-1 text-sm">{a.body}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  {a.actor_label ?? "Someone"} ·{" "}
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function ContentByClient({
  clients,
  items,
}: {
  clients: Client[];
  items: ContentItem[];
}) {
  const counts = new Map<string, number>();
  for (const i of items) {
    counts.set(i.client_id, (counts.get(i.client_id) ?? 0) + 1);
  }
  const ranked = clients
    .map((c) => ({ client: c, count: counts.get(c.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...ranked.map((r) => r.count));

  return (
    <Card eyebrow="Content count per client" title="Content by client">
      {ranked.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-[var(--ink-soft)]">
          No clients yet.
        </p>
      ) : (
        <div className="space-y-3 px-6 py-4">
          {ranked.map(({ client, count }) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="block"
            >
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{client.name}</span>
                <span className="text-[var(--ink-soft)]">{count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ink)]/6">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / max) * 100}%`,
                    backgroundColor: client.color,
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ContentByStatus({ items }: { items: ContentItem[] }) {
  const counts = new Map<ContentPhase, number>();
  for (const i of items) {
    counts.set(i.phase, (counts.get(i.phase) ?? 0) + 1);
  }

  return (
    <Card eyebrow="Content counts by phase" title="Content by status">
      <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-5">
        {PHASE_ORDER.map((phase) => (
          <div
            key={phase}
            className="rounded-xl border border-[var(--ink)]/8 px-3 py-3"
            style={{ borderLeft: `3px solid ${PHASE_COLOR[phase]}` }}
          >
            <p className="text-xs text-[var(--ink-soft)]">{PHASE_LABELS[phase]}</p>
            <p className="mt-1 font-display text-2xl font-medium">
              {counts.get(phase) ?? 0}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

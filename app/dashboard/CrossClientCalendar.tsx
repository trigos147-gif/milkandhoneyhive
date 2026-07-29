import Link from "next/link";
import type { Client, ContentItem } from "@/lib/types";
import { format, parseISO } from "date-fns";

export default function CrossClientCalendar({
  clients,
  items,
}: {
  clients: Client[];
  items: ContentItem[];
}) {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const upcoming = items
    .filter((i) => i.scheduled_date)
    .sort((a, b) => (a.scheduled_date! < b.scheduled_date! ? -1 : 1))
    .slice(0, 8);

  if (upcoming.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-[var(--ink)]/8 bg-[var(--paper-raised)]">
      <div className="border-b border-[var(--ink)]/8 px-6 py-4">
        <p className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
          Upcoming
        </p>
        <h2 className="font-display text-lg font-medium">Scheduled content</h2>
      </div>
      <div className="divide-y divide-[var(--ink)]/6">
        {upcoming.map((item) => {
          const client = clientById.get(item.client_id);
          return (
            <Link
              key={item.id}
              href={`/clients/${item.client_id}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-[var(--paper)]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: client?.color ?? "#999" }}
                />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{client?.name}</p>
                </div>
              </div>
              <span className="text-xs text-[var(--ink-soft)]">
                {item.scheduled_date
                  ? format(parseISO(item.scheduled_date), "MMM d")
                  : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

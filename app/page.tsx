import AppShell from "@/components/AppShell";
import {
  StatTiles,
  UpcomingItems,
  RecentActivity,
  ContentByClient,
  ContentByStatus,
} from "./HiveOverview";
import {
  getClients,
  getContentItems,
  getCurrentWorkspace,
  getRecentActivity,
  getTasks,
} from "@/lib/queries";
import { addDays } from "date-fns";

export default async function HivePage() {
  const [workspace, clients, items, tasks, activity] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getContentItems(),
    getTasks(),
    getRecentActivity(10),
  ]);

  const activeClients = clients.filter((c) => c.status === "active");

  const weekOut = addDays(new Date(), 7).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const scheduledThisWeek = items.filter(
    (i) => i.scheduled_date && i.scheduled_date >= today && i.scheduled_date <= weekOut
  ).length;
  const openTasks = tasks.filter((t) => !t.checked_off).length;

  return (
    <AppShell
      activePath="/"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        Overview
      </p>
      <h1 className="font-display text-3xl font-medium">The Hive</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        The full picture — every client, every post, in one place.
      </p>

      {clients.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--ink)]/8 bg-[var(--paper-raised)] p-10 text-center">
          <p className="font-display text-lg">No clients yet</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Add your first client to start seeing the hive come to life.
          </p>
          <a
            href="/clients"
            className="mt-4 inline-block rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)]"
          >
            Go to Clients
          </a>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <StatTiles
            activeClients={activeClients.length}
            totalContent={items.length}
            scheduledThisWeek={scheduledThisWeek}
            openTasks={openTasks}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <UpcomingItems clients={clients} items={items} tasks={tasks} />
            <RecentActivity clients={clients} activity={activity} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ContentByClient clients={clients} items={items} />
            <ContentByStatus items={items} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

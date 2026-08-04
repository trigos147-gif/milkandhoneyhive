import AppShell from "@/components/AppShell";
import GlobalCalendar from "./GlobalCalendar";
import {
  getClients,
  getContentItemTagMap,
  getContentItems,
  getContentPillars,
  getCurrentWorkspace,
  getTags,
  getTasks,
} from "@/lib/queries";

export default async function DashboardPage() {
  const [workspace, clients, items, tasks, pillars, tags, tagMap] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getContentItems(),
    getTasks(),
    getContentPillars(),
    getTags(),
    getContentItemTagMap(),
  ]);

  const activeClients = clients.filter((c) => c.status === "active");

  return (
    <AppShell
      activePath="/dashboard"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <div className="-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-2 border-x border-b border-[var(--ink)]/12 bg-[var(--paper-raised)] px-4 py-3 lg:-mx-8 lg:-mt-8">
        <div>
          <p className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
            Overview
          </p>
          <h1 className="font-display text-xl font-medium">Everything, one board.</h1>
        </div>
        <span className="text-xs text-[var(--ink-soft)]">
          {activeClients.length} active client{activeClients.length === 1 ? "" : "s"}
        </span>
      </div>

      {clients.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] p-10 text-center">
          <p className="font-display text-lg">No clients yet</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Add your first client to start seeing their content here.
          </p>
          <a
            href="/clients"
            className="mt-4 inline-block rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)]"
          >
            Go to Clients
          </a>
        </div>
      ) : (
        <div className="mt-0">
          <GlobalCalendar clients={clients} items={items} tasks={tasks} pillars={pillars} tags={tags} tagMap={tagMap} />
        </div>
      )}
    </AppShell>
  );
}

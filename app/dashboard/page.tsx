import AppShell from "@/components/AppShell";
import CrossClientCalendar from "./CrossClientCalendar";
import { getClients, getContentItems, getCurrentWorkspace } from "@/lib/queries";

export default async function DashboardPage() {
  const [workspace, clients, items] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getContentItems(),
  ]);

  const activeClients = clients.filter((c) => c.status === "active");

  return (
    <AppShell
      activePath="/dashboard"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        Overview
      </p>
      <h1 className="font-display text-3xl font-medium">Everything, one board.</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Every client&apos;s content and key dates, in one place — no toggling between
        spaces.
      </p>

      {clients.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--ink)]/8 bg-[var(--paper-raised)] p-10 text-center">
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
        <CrossClientCalendar clients={clients} items={items} />
      )}

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-[var(--ink-soft)]">{activeClients.length} active clients</span>
        <a href="/clients" className="text-[var(--teal)]">
          View all clients →
        </a>
      </div>
    </AppShell>
  );
}

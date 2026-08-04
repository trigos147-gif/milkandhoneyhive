import AppShell from "@/components/AppShell";
import BatchPlannerPanel from "./BatchPlannerPanel";
import BatchBoard from "./BatchBoard";
import { getClients, getContentItems, getCurrentWorkspace } from "@/lib/queries";

export default async function BatchingPage() {
  const [workspace, clients, items] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getContentItems(),
  ]);

  const openItems = items.filter((i) => i.phase !== "closed");

  return (
    <AppShell
      activePath="/batching"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        Batching
      </p>
      <h1 className="font-display text-3xl font-medium">Same step, every client, same day.</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Every post moves through the same pipeline — research, plan, write, then film or
        design. Batch each stage across all clients on its own day instead of
        client-hopping.
      </p>

      <div className="mt-6">
        <BatchPlannerPanel batchSchedule={workspace?.batch_schedule ?? {}} />
      </div>

      {openItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] p-10 text-center">
          <p className="text-sm text-[var(--ink-soft)]">
            Nothing to batch yet — add content from a client&apos;s board first.
          </p>
        </div>
      ) : (
        <BatchBoard items={openItems} clients={clients} />
      )}
    </AppShell>
  );
}

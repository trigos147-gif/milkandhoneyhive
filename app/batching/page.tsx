import AppShell from "@/components/AppShell";
import { getClients, getContentItems, getCurrentWorkspace } from "@/lib/queries";

export default async function BatchingPage() {
  const [workspace, clients, items] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getContentItems(),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const byFormat = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.format || "post";
    if (!byFormat.has(key)) byFormat.set(key, []);
    byFormat.get(key)!.push(item);
  }

  return (
    <AppShell
      activePath="/batching"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        Batching
      </p>
      <h1 className="font-display text-3xl font-medium">Group by task, not client.</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Batch similar work across every client — write captions together, shoot the
        same day, etc.
      </p>

      {byFormat.size === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--ink)]/8 bg-[var(--paper-raised)] p-10 text-center">
          <p className="text-sm text-[var(--ink-soft)]">
            Nothing to batch yet — add content from a client&apos;s board first.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {[...byFormat.entries()].map(([format, formatItems]) => (
            <div
              key={format}
              className="rounded-xl border border-[var(--ink)]/10 bg-[var(--paper-raised)]"
            >
              <div className="border-b border-[var(--ink)]/8 px-5 py-3">
                <h2 className="font-medium capitalize">{format}</h2>
              </div>
              <div className="divide-y divide-[var(--ink)]/6">
                {formatItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: clientById.get(item.client_id)?.color ?? "#999",
                      }}
                    />
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {clientById.get(item.client_id)?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

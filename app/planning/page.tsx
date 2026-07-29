import AppShell from "@/components/AppShell";
import { getClients, getCurrentWorkspace, getPlanningNotes } from "@/lib/queries";

export default async function PlanningPage() {
  const [workspace, clients, notes] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getPlanningNotes(),
  ]);

  const notesByClient = new Map<string, typeof notes>();
  for (const note of notes) {
    if (!notesByClient.has(note.client_id)) notesByClient.set(note.client_id, []);
    notesByClient.get(note.client_id)!.push(note);
  }

  return (
    <AppShell
      activePath="/planning"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        Planning
      </p>
      <h1 className="font-display text-3xl font-medium">Loose ideas, per client.</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Nothing here is committed — promote an idea into the pipeline when it&apos;s
        ready.
      </p>

      {clients.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--ink-soft)]">
          Add a client first to start planning for them.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: client.color }}
                />
                <span className="text-sm font-medium">{client.name}</span>
              </div>
              <div className="space-y-2">
                {(notesByClient.get(client.id) ?? []).map((note) => (
                  <p
                    key={note.id}
                    className="rounded-lg bg-[var(--paper)] p-2 text-sm text-[var(--ink-soft)]"
                  >
                    {note.idea}
                  </p>
                ))}
              </div>
              <a
                href={`/clients/${client.id}`}
                className="mt-2 inline-block text-xs font-medium text-[var(--teal)] hover:underline"
              >
                + View board
              </a>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

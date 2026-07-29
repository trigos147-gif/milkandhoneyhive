import AppShell from "@/components/AppShell";
import ClientsTable from "./ClientsTable";
import AddClientForm from "./AddClientForm";
import { getClients, getCurrentWorkspace } from "@/lib/queries";

export default async function ClientsPage() {
  const [workspace, clients] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
  ]);

  return (
    <AppShell
      activePath="/clients"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
            Clients
          </p>
          <h1 className="font-display text-3xl font-medium">Every client, one list.</h1>
        </div>
        <AddClientForm />
      </div>

      <ClientsTable clients={clients} />
    </AppShell>
  );
}

import AppShell from "@/components/AppShell";
import PaymentsBoard from "./PaymentsBoard";
import { getClients, getCurrentWorkspace, getPayments } from "@/lib/queries";

export default async function PaymentsPage() {
  const [workspace, clients, payments] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getPayments(),
  ]);

  return (
    <AppShell
      activePath="/payments"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        Payments
      </p>
      <h1 className="font-display text-3xl font-medium">Who owes you, and when.</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Track retainers, one-off jobs, and everything in between across every client.
      </p>

      <div className="mt-6">
        <PaymentsBoard clients={clients} payments={payments} />
      </div>
    </AppShell>
  );
}

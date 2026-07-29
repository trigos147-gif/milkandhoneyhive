import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import Board from "./Board";
import ActivityPanel from "./ActivityPanel";
import {
  getClient,
  getClientActivity,
  getClients,
  getContentItems,
  getContentPillars,
  getCurrentWorkspace,
} from "@/lib/queries";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [workspace, clients, client, items, pillars, activity] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getClient(id),
    getContentItems(id),
    getContentPillars(),
    getClientActivity(id),
  ]);

  if (!client) notFound();

  return (
    <AppShell
      activePath={`/clients/${id}`}
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: client.color }}
        />
        <h1 className="font-display text-3xl font-medium">{client.name}</h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Board clientId={id} items={items} pillars={pillars} />
        <ActivityPanel clientId={id} activity={activity} />
      </div>
    </AppShell>
  );
}

import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import Board from "./Board";
import ActivityPanel from "./ActivityPanel";
import ContractPanel from "./ContractPanel";
import {
  getClient,
  getClientActivity,
  getClientContracts,
  getClients,
  getContentItems,
  getContentPillars,
  getContractDeliverables,
  getCurrentWorkspace,
} from "@/lib/queries";
import type { ContractDeliverable } from "@/lib/types";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [workspace, clients, client, items, pillars, activity, contracts] =
    await Promise.all([
      getCurrentWorkspace(),
      getClients(),
      getClient(id),
      getContentItems(id),
      getContentPillars(),
      getClientActivity(id),
      getClientContracts(id),
    ]);

  if (!client) notFound();

  const deliverables = await getContractDeliverables(contracts.map((c) => c.id));
  const deliverablesByContract = new Map<string, ContractDeliverable[]>();
  for (const d of deliverables) {
    if (!deliverablesByContract.has(d.contract_id))
      deliverablesByContract.set(d.contract_id, []);
    deliverablesByContract.get(d.contract_id)!.push(d);
  }

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

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Board clientId={id} items={items} pillars={pillars} />
        <ActivityPanel clientId={id} activity={activity} />
      </div>

      <div className="mt-6">
        <ContractPanel
          clientId={id}
          contracts={contracts}
          deliverablesByContract={deliverablesByContract}
        />
      </div>
    </AppShell>
  );
}

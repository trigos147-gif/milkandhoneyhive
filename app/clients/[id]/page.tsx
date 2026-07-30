import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import Board from "./Board";
import ActivityPanel from "./ActivityPanel";
import ContractPanel from "./ContractPanel";
import ClientTabs from "./ClientTabs";
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
      <div className="flex items-center gap-2.5 border border-[var(--ink)]/12 bg-[var(--paper-raised)] px-4 py-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: client.color }}
        />
        <h1 className="font-display text-xl font-medium">{client.name}</h1>
      </div>

      <div className="mt-0">
        <ClientTabs
          board={<Board clientId={id} items={items} pillars={pillars} />}
          contract={
            <ContractPanel
              clientId={id}
              contracts={contracts}
              deliverablesByContract={deliverablesByContract}
            />
          }
          activity={<ActivityPanel clientId={id} activity={activity} />}
        />
      </div>
    </AppShell>
  );
}

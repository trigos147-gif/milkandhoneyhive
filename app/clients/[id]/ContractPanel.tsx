"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  addDeliverable,
  createContract,
  deleteDeliverable,
  updateContractStatus,
} from "./actions";
import {
  BILLING_TYPE_LABELS,
  type BillingType,
  type ClientContract,
  type ContractDeliverable,
  type DeliverableFrequency,
} from "@/lib/types";

const BILLING_TYPES: BillingType[] = [
  "retainer",
  "per_deliverable",
  "one_time",
  "as_needed",
];

const FREQUENCIES: DeliverableFrequency[] = ["weekly", "monthly", "one_time"];

export default function ContractPanel({
  clientId,
  contracts,
  deliverablesByContract,
}: {
  clientId: string;
  contracts: ClientContract[];
  deliverablesByContract: Map<string, ContractDeliverable[]>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [showNewContract, setShowNewContract] = useState(contracts.length === 0);

  return (
    <div className="rounded-xl border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
          Contract & deliverables
        </p>
        <button
          onClick={() => setShowNewContract((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-[var(--teal)] hover:underline"
        >
          <Plus size={12} /> New contract
        </button>
      </div>

      {showNewContract && (
        <form
          ref={formRef}
          action={async (formData) => {
            const billingType = String(formData.get("billingType")) as BillingType;
            const rateAmount = formData.get("rateAmount")
              ? Number(formData.get("rateAmount"))
              : null;
            const contractStart = String(formData.get("contractStart") || "") || null;
            const contractEnd = String(formData.get("contractEnd") || "") || null;
            const notes = String(formData.get("notes") || "") || null;
            formRef.current?.reset();
            setShowNewContract(false);
            await createContract(clientId, {
              billingType,
              rateAmount,
              contractStart,
              contractEnd,
              notes,
            });
            router.refresh();
          }}
          className="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-[var(--paper)] p-4 sm:grid-cols-4"
        >
          <select
            name="billingType"
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
          >
            {BILLING_TYPES.map((t) => (
              <option key={t} value={t}>
                {BILLING_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            name="rateAmount"
            type="number"
            step="0.01"
            placeholder="Rate ($)"
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
          />
          <input
            name="contractStart"
            type="date"
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
          />
          <input
            name="contractEnd"
            type="date"
            placeholder="Open-ended if blank"
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
          />
          <textarea
            name="notes"
            placeholder="Scope notes…"
            className="col-span-2 h-16 resize-none rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none sm:col-span-3"
          />
          <button
            type="submit"
            className="h-fit self-end rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-medium text-[var(--paper)]"
          >
            Save contract
          </button>
        </form>
      )}

      {contracts.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)]">No contract on file yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="rounded-lg border border-[var(--ink)]/8 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">
                    {BILLING_TYPE_LABELS[contract.billing_type]}
                  </span>
                  {contract.rate_amount != null && (
                    <span className="ml-2 text-sm text-[var(--ink-soft)]">
                      ${contract.rate_amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <select
                  value={contract.status}
                  onChange={async (e) => {
                    await updateContractStatus(clientId, contract.id, e.target.value);
                    router.refresh();
                  }}
                  className="rounded-md border border-[var(--ink)]/10 bg-[var(--paper)] px-2 py-1 text-xs outline-none"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
              {(contract.contract_start || contract.contract_end) && (
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  {contract.contract_start ?? "—"} to {contract.contract_end ?? "open-ended"}
                </p>
              )}
              {contract.notes && (
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{contract.notes}</p>
              )}

              <div className="mt-3 space-y-1.5">
                {(deliverablesByContract.get(contract.id) ?? []).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-md bg-[var(--paper)] px-2 py-1.5 text-xs"
                  >
                    <span>
                      {d.quantity}× {d.deliverable_type} / {d.frequency.replace("_", " ")}
                    </span>
                    <button
                      onClick={async () => {
                        await deleteDeliverable(clientId, d.id);
                        router.refresh();
                      }}
                      className="text-[var(--ink-soft)] hover:text-[var(--rust)]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <DeliverableForm clientId={clientId} contractId={contract.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeliverableForm({
  clientId,
  contractId,
}: {
  clientId: string;
  contractId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const deliverableType = String(formData.get("deliverableType") || "");
        if (!deliverableType.trim()) return;
        const quantity = Number(formData.get("quantity") || 1);
        const frequency = String(formData.get("frequency")) as DeliverableFrequency;
        formRef.current?.reset();
        await addDeliverable(clientId, contractId, {
          deliverableType,
          quantity,
          frequency,
        });
        router.refresh();
      }}
      className="mt-3 flex items-center gap-1.5"
    >
      <input
        name="quantity"
        type="number"
        min={1}
        defaultValue={1}
        className="w-12 rounded-md border border-[var(--ink)]/10 bg-[var(--paper)] px-1.5 py-1 text-xs outline-none"
      />
      <input
        name="deliverableType"
        placeholder="e.g. Reels, Posts"
        className="flex-1 rounded-md border border-[var(--ink)]/10 bg-[var(--paper)] px-2 py-1 text-xs outline-none"
      />
      <select
        name="frequency"
        className="rounded-md border border-[var(--ink)]/10 bg-[var(--paper)] px-1.5 py-1 text-xs outline-none"
      >
        {FREQUENCIES.map((f) => (
          <option key={f} value={f}>
            {f.replace("_", " ")}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md bg-[var(--ink)] px-2 py-1 text-xs font-medium text-[var(--paper)]"
      >
        Add
      </button>
    </form>
  );
}

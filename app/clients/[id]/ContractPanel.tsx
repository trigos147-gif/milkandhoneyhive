"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Paperclip, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import {
  addDeliverable,
  attachContractFile,
  createContract,
  deleteContract,
  deleteDeliverable,
  getContractFileUrl,
  removeContractFile,
  updateContractStatus,
} from "./actions";
import { createClient } from "@/lib/supabase-browser";
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

type PendingDeliverable = {
  type: string;
  quantity: number;
  frequency: DeliverableFrequency;
};

async function uploadContractFile(clientId: string, contractId: string, file: File) {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${clientId}/${contractId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("contract-files").upload(path, file, {
    contentType: file.type || "application/pdf",
  });
  if (error) {
    alert(`Couldn't upload file: ${error.message}`);
    return;
  }
  await attachContractFile(clientId, contractId, path, file.name);
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const [showNewContract, setShowNewContract] = useState(contracts.length === 0);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [billingType, setBillingType] = useState<BillingType>("retainer");
  const [rateAmount, setRateAmount] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingDeliverables, setPendingDeliverables] = useState<PendingDeliverable[]>([]);

  function resetForm() {
    formRef.current?.reset();
    setPendingFile(null);
    setBillingType("retainer");
    setRateAmount("");
    setContractStart("");
    setContractEnd("");
    setNotes("");
    setPendingDeliverables([]);
    setParseError(null);
  }

  async function handleFileSelected(file: File) {
    setPendingFile(file);
    setParseError(null);
    setParsing(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/parse-contract", { method: "POST", body });
      const parsed = await res.json();

      if (!res.ok) {
        setParseError(parsed.error ?? "Couldn't read that contract automatically.");
        return;
      }

      if (parsed.billingType && BILLING_TYPES.includes(parsed.billingType)) {
        setBillingType(parsed.billingType);
      }
      if (typeof parsed.rateAmount === "number") setRateAmount(String(parsed.rateAmount));
      if (parsed.contractStart) setContractStart(parsed.contractStart);
      if (parsed.contractEnd) setContractEnd(parsed.contractEnd);
      if (parsed.notes) setNotes(parsed.notes);
      if (Array.isArray(parsed.deliverables)) {
        setPendingDeliverables(
          parsed.deliverables
            .filter((d: PendingDeliverable) => d?.type)
            .map((d: PendingDeliverable) => ({
              type: d.type,
              quantity: d.quantity && d.quantity > 0 ? d.quantity : 1,
              frequency: FREQUENCIES.includes(d.frequency) ? d.frequency : "monthly",
            }))
        );
      }
    } catch {
      setParseError("Couldn't reach the auto-fill service. You can still fill this in by hand.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] p-5">
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
          action={async () => {
            if (submittingRef.current) return;
            submittingRef.current = true;
            setSaving(true);
            const contract = await createContract(clientId, {
              billingType,
              rateAmount: rateAmount ? Number(rateAmount) : null,
              contractStart: contractStart || null,
              contractEnd: contractEnd || null,
              notes: notes || null,
            });

            if (contract) {
              if (pendingFile) {
                await uploadContractFile(clientId, contract.id, pendingFile);
              }
              for (const d of pendingDeliverables) {
                await addDeliverable(clientId, contract.id, {
                  deliverableType: d.type,
                  quantity: d.quantity,
                  frequency: d.frequency,
                });
              }
            }

            resetForm();
            setShowNewContract(false);
            setSaving(false);
            submittingRef.current = false;
            router.refresh();
          }}
          className="mb-5 space-y-3 rounded-lg bg-[var(--paper)] p-4"
        >
          <label
            className={`flex h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-xs transition-colors ${
              pendingFile
                ? "border-[var(--teal)]/50 bg-[var(--teal)]/5 text-[var(--teal)]"
                : "border-[var(--ink)]/20 bg-[var(--paper-raised)] text-[var(--ink-soft)] hover:border-[var(--ink)]/40"
            }`}
          >
            {parsing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Reading contract and filling in the fields…
              </>
            ) : pendingFile ? (
              <>
                <Sparkles size={14} />
                {pendingFile.name} — auto-filled below, review before saving
              </>
            ) : (
              <>
                <Upload size={14} />
                Upload a contract PDF to auto-fill everything below
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
          </label>
          {parseError && (
            <p className="text-xs text-[var(--rust)]">{parseError}</p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value as BillingType)}
              className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
            >
              {BILLING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BILLING_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              value={rateAmount}
              onChange={(e) => setRateAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Rate ($)"
              className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
            />
            <input
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
              type="date"
              className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
            />
            <input
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
              type="date"
              placeholder="Open-ended if blank"
              className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
            />
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Scope notes…"
            className="h-16 w-full resize-none rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2 text-sm outline-none"
          />

          {pendingDeliverables.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                Deliverables found
              </p>
              {pendingDeliverables.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-[var(--paper-raised)] px-2 py-1.5 text-xs"
                >
                  <span>
                    {d.quantity}× {d.type} / {d.frequency.replace("_", " ")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingDeliverables((list) => list.filter((_, idx) => idx !== i))
                    }
                    className="text-[var(--ink-soft)] hover:text-[var(--rust)]"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || parsing}
            className="rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-medium text-[var(--paper)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save contract"}
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
                <div className="flex items-center gap-1.5">
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
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          "Delete this contract? Its deliverables will be deleted too. Payment history stays."
                        )
                      ) {
                        return;
                      }
                      await deleteContract(clientId, contract.id);
                      router.refresh();
                    }}
                    className="text-[var(--ink-soft)] hover:text-[var(--rust)]"
                    title="Delete contract"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {contract.notes && (
                <p className="mt-1 text-xs text-[var(--ink-soft)]">{contract.notes}</p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 border-y border-[var(--ink)]/8 py-2.5 text-xs">
                <div>
                  <p className="font-mono-data text-[9px] uppercase tracking-wide text-[var(--ink-soft)]">
                    Start date
                  </p>
                  <p className="mt-0.5">{contract.contract_start ?? "Not set"}</p>
                </div>
                <div>
                  <p className="font-mono-data text-[9px] uppercase tracking-wide text-[var(--ink-soft)]">
                    End date
                  </p>
                  <p className="mt-0.5">{contract.contract_end ?? "Open-ended"}</p>
                </div>
                <div>
                  <p className="font-mono-data text-[9px] uppercase tracking-wide text-[var(--ink-soft)]">
                    Deliverables
                  </p>
                  <p className="mt-0.5">{(deliverablesByContract.get(contract.id) ?? []).length}</p>
                </div>
                <div>
                  <p className="font-mono-data text-[9px] uppercase tracking-wide text-[var(--ink-soft)]">
                    Added
                  </p>
                  <p className="mt-0.5">
                    {new Date(contract.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <ContractFile clientId={clientId} contract={contract} />

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

              <p className="mt-3 font-mono-data text-[9px] uppercase tracking-wide text-[var(--ink-soft)]">
                Add a deliverable
              </p>
              <DeliverableForm clientId={clientId} contractId={contract.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContractFile({
  clientId,
  contract,
}: {
  clientId: string;
  contract: ClientContract;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (contract.file_path) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-md bg-[var(--paper)] px-2 py-1.5 text-xs">
        <button
          onClick={async () => {
            const url = await getContractFileUrl(contract.file_path!);
            if (url) window.open(url, "_blank");
          }}
          className="flex items-center gap-1.5 truncate text-[var(--teal)] hover:underline"
        >
          <FileText size={12} className="shrink-0" />
          <span className="truncate">{contract.file_name ?? "Contract file"}</span>
        </button>
        <button
          onClick={async () => {
            setBusy(true);
            await removeContractFile(clientId, contract.id);
            setBusy(false);
            router.refresh();
          }}
          disabled={busy}
          className="ml-2 shrink-0 text-[var(--ink-soft)] hover:text-[var(--rust)]"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          await uploadContractFile(clientId, contract.id, file);
          setBusy(false);
          router.refresh();
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-50"
      >
        <Paperclip size={12} />
        {busy ? "Uploading…" : "Attach contract PDF"}
      </button>
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

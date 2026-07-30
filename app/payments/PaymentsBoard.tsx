"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { addStandalonePayment, deletePayment, updatePaymentStatus } from "./actions";
import { PAYMENT_STATUS_LABELS, type Client, type Payment, type PaymentStatus } from "@/lib/types";

function isOverdue(p: Payment) {
  if (p.status === "paid") return false;
  if (!p.due_date) return false;
  return new Date(p.due_date) < new Date(new Date().toDateString());
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function PaymentsBoard({
  clients,
  payments,
}: {
  clients: Client[];
  payments: Payment[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterClient, setFilterClient] = useState<string>("all");

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const totals = useMemo(() => {
    const owed = payments
      .filter((p) => p.status !== "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const overdue = payments.filter(isOverdue).reduce((sum, p) => sum + Number(p.amount), 0);
    const now = new Date();
    const paidThisMonth = payments
      .filter(
        (p) =>
          p.status === "paid" &&
          p.paid_date &&
          new Date(p.paid_date).getMonth() === now.getMonth() &&
          new Date(p.paid_date).getFullYear() === now.getFullYear()
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { owed, overdue, paidThisMonth };
  }, [payments]);

  const filtered = useMemo(
    () =>
      filterClient === "all" ? payments : payments.filter((p) => p.client_id === filterClient),
    [payments, filterClient]
  );

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total owed" value={fmt(totals.owed)} accent="var(--gold)" />
        <SummaryCard label="Overdue" value={fmt(totals.overdue)} accent="var(--rust)" />
        <SummaryCard label="Paid this month" value={fmt(totals.paidThisMonth)} accent="var(--sage)" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] px-3 py-1.5 text-sm outline-none"
        >
          <option value="all">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-[var(--paper)]"
        >
          <Plus size={12} /> Add payment
        </button>
      </div>

      {showForm && (
        <form
          ref={formRef}
          action={async (formData) => {
            const clientId = String(formData.get("clientId") || "");
            const amount = Number(formData.get("amount") || 0);
            if (!clientId || !amount) return;
            const periodLabel = String(formData.get("periodLabel") || "") || null;
            const dueDate = String(formData.get("dueDate") || "") || null;
            formRef.current?.reset();
            setShowForm(false);
            await addStandalonePayment({ clientId, amount, periodLabel, dueDate });
            router.refresh();
          }}
          className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-3 sm:grid-cols-4"
        >
          <select
            name="clientId"
            required
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
          >
            <option value="">Client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount ($)"
            required
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
          />
          <input
            name="periodLabel"
            placeholder="e.g. October retainer"
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
          />
          <input
            name="dueDate"
            type="date"
            className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="col-span-2 rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-[var(--paper)] sm:col-span-4"
          >
            Save
          </button>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No payments recorded yet.</p>
        ) : (
          filtered.map((p) => {
            const client = clientById.get(p.client_id);
            const overdue = isOverdue(p);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: client?.color ?? "#999" }}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {client?.name ?? "Unknown client"} — {fmt(Number(p.amount))}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {p.period_label ?? "—"}
                      {p.due_date ? ` · due ${p.due_date}` : ""}
                      {overdue ? " · overdue" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={p.status}
                    onChange={async (e) => {
                      await updatePaymentStatus(p.id, e.target.value as PaymentStatus);
                      router.refresh();
                    }}
                    className={`rounded-md border px-2 py-1 text-xs outline-none ${
                      overdue
                        ? "border-[var(--rust)] text-[var(--rust)]"
                        : "border-[var(--ink)]/10"
                    }`}
                  >
                    {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      await deletePayment(p.id);
                      router.refresh();
                    }}
                    className="text-[var(--ink-soft)] hover:text-[var(--rust)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-4">
      <p className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-medium" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

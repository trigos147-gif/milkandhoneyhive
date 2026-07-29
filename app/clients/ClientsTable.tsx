import Link from "next/link";
import type { Client } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  lead: "bg-[#B85C42]/10 text-[#B85C42]",
  onboarding: "bg-[#C08A2E]/10 text-[#C08A2E]",
  active: "bg-[#7C9A6E]/10 text-[#7C9A6E]",
  paused: "bg-black/8 text-[var(--ink-soft)]",
  archived: "bg-black/5 text-[var(--ink-soft)]",
};

export default function ClientsTable({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-[var(--ink)]/8 bg-[var(--paper-raised)] p-10 text-center">
        <p className="font-display text-lg">No clients yet</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Add your first client above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--ink)]/8 bg-[var(--paper-raised)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--ink)]/8 text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
            <th className="px-6 py-3 font-medium">Client</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ink)]/6">
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-[var(--paper)]">
              <td className="px-6 py-3">
                <Link href={`/clients/${c.id}`} className="flex items-center gap-2 font-medium">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </Link>
              </td>
              <td className="px-6 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    STATUS_STYLE[c.status] ?? ""
                  }`}
                >
                  {c.status}
                </span>
              </td>
              <td className="px-6 py-3 text-[var(--ink-soft)]">
                {c.client_type ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { addActivityNote } from "./actions";
import type { ClientActivity } from "@/lib/types";

export default function ActivityPanel({
  clientId,
  activity,
}: {
  clientId: string;
  activity: ClientActivity[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <div className="max-w-xl rounded-xl border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-4">
      <form
        ref={formRef}
        action={async (formData) => {
          const body = String(formData.get("note") ?? "");
          formRef.current?.reset();
          await addActivityNote(clientId, body);
          router.refresh();
        }}
        className="mb-4"
      >
        <textarea
          name="note"
          required
          placeholder="Log a note…"
          className="h-20 w-full resize-none rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none focus:border-[var(--ink)]/30"
        />
        <button
          type="submit"
          className="mt-2 rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-[var(--paper)]"
        >
          Add note
        </button>
      </form>

      <div className="space-y-3">
        {activity.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">No activity yet.</p>
        ) : (
          activity.map((a) => (
            <div key={a.id} className="border-t border-[var(--ink)]/6 pt-3 first:border-0 first:pt-0">
              <p className="text-sm">{a.body}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {a.actor_label ?? "Someone"} ·{" "}
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { generatePlan } from "./planner-actions";

export default function PlannerPanel() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [runningScope, setRunningScope] = useState<"week" | "month" | null>(null);

  const run = (scope: "week" | "month") => {
    setRunningScope(scope);
    startTransition(async () => {
      const res = await generatePlan(scope);
      setResult(res.summary);
      setRunningScope(null);
      router.refresh();
    });
  };

  return (
    <div className="mb-6 rounded-xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-[var(--gold)]" />
        <p className="text-sm font-medium">Auto-schedule owed work</p>
      </div>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">
        Looks at every active contract&apos;s deliverables, sees what&apos;s already on the
        calendar, and fills in tasks across your working days so nothing owed gets missed.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => run("week")}
          disabled={isPending}
          className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-[var(--paper)] disabled:opacity-50"
        >
          {isPending && runningScope === "week" ? "Planning…" : "Plan this week"}
        </button>
        <button
          onClick={() => run("month")}
          disabled={isPending}
          className="rounded-lg border border-[var(--ink)]/15 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {isPending && runningScope === "month" ? "Planning…" : "Plan this month"}
        </button>
      </div>
      {result && <p className="mt-3 text-xs text-[var(--teal)]">{result}</p>}
    </div>
  );
}

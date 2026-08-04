"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { generateBatchPlan, updateBatchSchedule } from "./actions";
import {
  DEFAULT_BATCH_SCHEDULE,
  PRODUCTION_STAGE_SHORT_LABELS,
  WEEKDAY_LABELS,
  type ProductionStage,
} from "@/lib/types";

const BATCHABLE_STAGES: ProductionStage[] = [
  "research",
  "ideation",
  "writing",
  "filming",
  "designing",
];

export default function BatchPlannerPanel({
  batchSchedule,
}: {
  batchSchedule: Record<string, number>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [runningScope, setRunningScope] = useState<"week" | "month" | null>(null);
  const [schedule, setSchedule] = useState<Record<string, number>>({
    ...DEFAULT_BATCH_SCHEDULE,
    ...batchSchedule,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  const run = (scope: "week" | "month") => {
    setRunningScope(scope);
    startTransition(async () => {
      const res = await generateBatchPlan(scope);
      setResult(res.summary);
      setRunningScope(null);
      router.refresh();
    });
  };

  function handleDayChange(stage: ProductionStage, weekday: number) {
    const next = { ...schedule, [stage]: weekday };
    setSchedule(next);
    setSavingSchedule(true);
    startTransition(async () => {
      await updateBatchSchedule(next);
      setSavingSchedule(false);
      router.refresh();
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-[var(--gold)]" />
        <p className="text-sm font-medium">Batch day schedule</p>
      </div>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">
        Set which weekday each stage gets batched on — every client&apos;s posts sitting
        in that stage get worked on the same day.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {BATCHABLE_STAGES.map((stage) => (
          <div key={stage}>
            <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
              {PRODUCTION_STAGE_SHORT_LABELS[stage]}
            </label>
            <select
              value={schedule[stage] ?? DEFAULT_BATCH_SCHEDULE[stage]}
              onChange={(e) => handleDayChange(stage, Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-1.5 text-xs outline-none"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {WEEKDAY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {savingSchedule && <p className="mt-2 text-xs text-[var(--ink-soft)]">Saving…</p>}

      <div className="mt-4 flex items-center gap-2 border-t border-[var(--ink)]/8 pt-4">
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

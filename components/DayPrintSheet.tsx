"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Client, ContentItem, Task } from "@/lib/types";

function CheckBox({ done }: { done: boolean }) {
  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center border border-black text-[11px] leading-none"
      aria-hidden
    >
      {done ? "✓" : ""}
    </span>
  );
}

function TaskLine({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-black/15 py-1.5">
      <CheckBox done={task.checked_off} />
      <span className="text-[13px] text-black">
        {task.title}
        {task.task_type ? ` — ${task.task_type}` : ""}
      </span>
    </div>
  );
}

function ContentLine({ item }: { item: ContentItem }) {
  return (
    <div className="flex items-center justify-between gap-2.5 border-b border-black/15 py-1.5">
      <div className="flex items-center gap-2.5">
        <CheckBox done={item.checked_off} />
        <span className="text-[13px] text-black">{item.title}</span>
      </div>
      {item.scheduled_time && <span className="text-[11px] text-black/70">{item.scheduled_time}</span>}
    </div>
  );
}

// Renders only under @media print (see app/globals.css) — the rest of the app
// is hidden and this sheet is expanded to fill the printed page.
export default function DayPrintSheet({
  date,
  scopeLabel,
  tasksForDay,
  itemsForDay,
  clientById,
}: {
  date: Date;
  scopeLabel: string;
  tasksForDay: Task[];
  itemsForDay: ContentItem[];
  clientById?: Map<string, Client>;
}) {
  const groupByClient = <T extends { client_id: string }>(rows: T[]) => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      if (!map.has(row.client_id)) map.set(row.client_id, []);
      map.get(row.client_id)!.push(row);
    }
    return map;
  };

  const taskGroups = clientById ? groupByClient(tasksForDay) : null;
  const itemGroups = clientById ? groupByClient(itemsForDay) : null;

  const [printedAt, setPrintedAt] = useState<Date | null>(null);
  useEffect(() => {
    function handleBeforePrint() {
      setPrintedAt(new Date());
    }
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, []);

  return (
    <div id="day-print-sheet" className="hidden bg-white p-8 text-black print:block">
      <div className="mb-6 flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-black/60">The Hive — Daily Sheet</p>
          <h1 className="font-display text-2xl font-bold">{format(date, "EEEE, MMMM d, yyyy")}</h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <img src="/logo.png" alt="Milk & Honey Hive" className="h-10 w-auto" />
          <p className="text-sm font-medium">{scopeLabel}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase tracking-wide">To Do</h2>
        {tasksForDay.length === 0 ? (
          <p className="py-2 text-[13px] text-black/60">Nothing on the work list for this day.</p>
        ) : taskGroups ? (
          [...taskGroups.entries()].map(([clientId, rows]) => (
            <div key={clientId} className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-black/70">
                {clientById?.get(clientId)?.name ?? "Unknown client"}
              </p>
              {rows.map((t) => (
                <TaskLine key={t.id} task={t} />
              ))}
            </div>
          ))
        ) : (
          tasksForDay.map((t) => <TaskLine key={t.id} task={t} />)
        )}
      </div>

      <div>
        <h2 className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase tracking-wide">Going Live</h2>
        {itemsForDay.length === 0 ? (
          <p className="py-2 text-[13px] text-black/60">Nothing scheduled to post this day.</p>
        ) : itemGroups ? (
          [...itemGroups.entries()].map(([clientId, rows]) => (
            <div key={clientId} className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-black/70">
                {clientById?.get(clientId)?.name ?? "Unknown client"}
              </p>
              {rows.map((i) => (
                <ContentLine key={i.id} item={i} />
              ))}
            </div>
          ))
        ) : (
          itemsForDay.map((i) => <ContentLine key={i.id} item={i} />)
        )}
      </div>

      <div className="mt-10 border-t border-black/20 pt-2 text-right text-[10px] text-black/50">
        {printedAt ? `Printed ${format(printedAt, "MMM d, yyyy 'at' h:mm a")}` : ""}
      </div>
    </div>
  );
}

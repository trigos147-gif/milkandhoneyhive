"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Client, ContentItem, Task } from "@/lib/types";

function CheckBox({ done }: { done: boolean }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center border-[2.5px] border-black text-[14px] font-bold leading-none"
      style={{ borderColor: "#000000" }}
      aria-hidden
    >
      {done ? "✓" : ""}
    </span>
  );
}

function TaskLine({ task }: { task: Task }) {
  return (
    <div
      className="flex items-center gap-3 border-b-2 py-2.5"
      style={{ borderColor: "#000000" }}
    >
      <CheckBox done={task.checked_off} />
      <span className="text-[15px] font-medium text-black">
        {task.title}
        {task.task_type ? ` — ${task.task_type}` : ""}
      </span>
    </div>
  );
}

function ContentLine({ item }: { item: ContentItem }) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b-2 py-2.5"
      style={{ borderColor: "#000000" }}
    >
      <div className="flex items-center gap-3">
        <CheckBox done={item.checked_off} />
        <span className="text-[15px] font-medium text-black">{item.title}</span>
      </div>
      {item.scheduled_time && <span className="text-[12px] font-medium text-black">{item.scheduled_time}</span>}
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
      <div className="mb-6 flex items-start justify-between border-b-[3px] border-black pb-3" style={{ borderColor: "#000000" }}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-black">The Hive — Daily Sheet</p>
          <h1 className="font-display text-[26px] font-bold text-black">{format(date, "EEEE, MMMM d, yyyy")}</h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <img src="/logo.png" alt="Milk & Honey Hive" className="h-10 w-auto" />
          <p className="text-sm font-bold text-black">{scopeLabel}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2
          className="mb-2.5 border-b-[3px] pb-1.5 text-base font-bold uppercase tracking-wide text-black"
          style={{ borderColor: "#000000" }}
        >
          To Do
        </h2>
        {tasksForDay.length === 0 ? (
          <p className="py-2 text-[14px] font-medium text-black">Nothing on the work list for this day.</p>
        ) : taskGroups ? (
          [...taskGroups.entries()].map(([clientId, rows]) => (
            <div key={clientId} className="mb-3">
              <p className="mb-1 text-[12px] font-bold uppercase tracking-wide text-black">
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
        <h2
          className="mb-2.5 border-b-[3px] pb-1.5 text-base font-bold uppercase tracking-wide text-black"
          style={{ borderColor: "#000000" }}
        >
          Going Live
        </h2>
        {itemsForDay.length === 0 ? (
          <p className="py-2 text-[14px] font-medium text-black">Nothing scheduled to post this day.</p>
        ) : itemGroups ? (
          [...itemGroups.entries()].map(([clientId, rows]) => (
            <div key={clientId} className="mb-3">
              <p className="mb-1 text-[12px] font-bold uppercase tracking-wide text-black">
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

      <div
        className="mt-10 border-t-2 pt-2 text-right text-[11px] font-semibold text-black"
        style={{ borderColor: "#000000" }}
      >
        {printedAt ? `Printed ${format(printedAt, "MMM d, yyyy 'at' h:mm a")}` : ""}
      </div>
    </div>
  );
}

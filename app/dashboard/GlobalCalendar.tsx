"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentDrawer from "../clients/[id]/ContentDrawer";
import { PHASE_LABELS } from "@/lib/types";
import type { Client, ContentItem, ContentPhase, ContentPillar, Task } from "@/lib/types";

type View = "day" | "week" | "month";
type Mode = "production" | "publish";

type CalendarEntry =
  | { kind: "content"; id: string; clientId: string; data: ContentItem }
  | { kind: "task"; id: string; clientId: string; data: Task };

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function GlobalCalendar({
  clients,
  items,
  tasks,
  pillars,
}: {
  clients: Client[];
  items: ContentItem[];
  tasks: Task[];
  pillars: ContentPillar[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("publish");
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(new Date(new Date().toDateString()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const openItem = openItemId ? items.find((i) => i.id === openItemId) ?? null : null;

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    if (mode === "publish") {
      for (const item of items) {
        if (!item.scheduled_date) continue;
        const key = item.scheduled_date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ kind: "content", id: item.id, clientId: item.client_id, data: item });
      }
    } else {
      for (const task of tasks) {
        if (!task.due_date) continue;
        const key = task.due_date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ kind: "task", id: task.id, clientId: task.client_id, data: task });
      }
    }
    return map;
  }, [items, tasks, mode]);

  function goPrev() {
    setAnchor((a) => (view === "month" ? addMonths(a, -1) : view === "week" ? addWeeks(a, -1) : addDays(a, -1)));
  }
  function goNext() {
    setAnchor((a) => (view === "month" ? addMonths(a, 1) : view === "week" ? addWeeks(a, 1) : addDays(a, 1)));
  }
  function goToday() {
    const t = new Date(new Date().toDateString());
    setAnchor(t);
    setSelectedDay(t);
  }

  const headerLabel =
    view === "month"
      ? format(anchor, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(anchor), "MMM d")} – ${format(endOfWeek(anchor), "MMM d, yyyy")}`
        : format(anchor, "EEEE, MMM d yyyy");

  return (
    <div className="-mx-8 flex min-h-[calc(100vh-260px)] flex-col border-y border-[var(--ink)]/10 bg-[var(--paper-raised)] py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink)]/8 px-8 pb-4">
        <div className="flex items-center gap-0.5 rounded-md border border-[var(--ink)]/10 p-0.5">
          {(
            [
              { key: "production" as Mode, label: "Production" },
              { key: "publish" as Mode, label: "Publish" },
            ]
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m.key
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--ink-soft)] hover:bg-black/5"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--ink-soft)]">
          {mode === "production"
            ? "When work needs to get done, across every client"
            : "When each client's posts actually go live"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="rounded-md border border-[var(--ink)]/10 p-1 text-[var(--ink-soft)] hover:bg-black/5"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={goNext}
            className="rounded-md border border-[var(--ink)]/10 p-1 text-[var(--ink-soft)] hover:bg-black/5"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={goToday}
            className="rounded-md border border-[var(--ink)]/10 px-2 py-1 text-xs text-[var(--ink-soft)] hover:bg-black/5"
          >
            Today
          </button>
          <p className="ml-1 font-display text-base font-medium">{headerLabel}</p>
        </div>

        <div className="flex items-center gap-0.5 rounded-md border border-[var(--ink)]/10 p-0.5">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                view === v
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--ink-soft)] hover:bg-black/5"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1">
        {view === "month" && (
          <MonthGrid
            anchor={anchor}
            entriesByDate={entriesByDate}
            clientById={clientById}
            onSelectDay={(d) => {
              setSelectedDay(d);
              setAnchor(d);
              setView("day");
            }}
            onOpenItem={setOpenItemId}
          />
        )}
        {view === "week" && (
          <div className="px-8">
            <WeekGrid
              anchor={anchor}
              entriesByDate={entriesByDate}
              clientById={clientById}
              onSelectDay={(d) => {
                setAnchor(d);
                setView("day");
              }}
              onOpenItem={setOpenItemId}
            />
          </div>
        )}
        {view === "day" && (
          <div className="px-8">
            <DayAgenda
              mode={mode}
              entries={entriesByDate.get(dateKey(selectedDay ?? anchor)) ?? []}
              clientById={clientById}
              onOpenItem={setOpenItemId}
            />
          </div>
        )}
      </div>

      {openItem && (
        <ContentDrawer
          clientId={openItem.client_id}
          item={openItem}
          pillars={pillars}
          subtasks={tasks.filter((t) => t.content_item_id === openItem.id)}
          onClose={() => {
            setOpenItemId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Chip({
  entry,
  clientById,
  onOpenItem,
}: {
  entry: CalendarEntry;
  clientById: Map<string, Client>;
  onOpenItem: (id: string) => void;
}) {
  const client = clientById.get(entry.clientId);
  const label = entry.data.title;
  const clickable = entry.kind === "content";
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={(e) => {
        e.stopPropagation();
        if (clickable) onOpenItem(entry.id);
      }}
      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] ${
        clickable ? "cursor-pointer hover:underline" : "cursor-default"
      }`}
      style={{ backgroundColor: `${client?.color ?? "#999"}22`, color: client?.color ?? "#666" }}
      title={`${client?.name ?? "Unknown"} — ${label}`}
    >
      {label}
    </button>
  );
}

function MonthGrid({
  anchor,
  entriesByDate,
  clientById,
  onSelectDay,
  onOpenItem,
}: {
  anchor: Date;
  entriesByDate: Map<string, CalendarEntry[]>;
  clientById: Map<string, Client>;
  onSelectDay: (d: Date) => void;
  onOpenItem: (id: string) => void;
}) {
  const start = startOfWeek(startOfMonth(anchor));
  const end = endOfWeek(endOfMonth(anchor));
  const days = eachDayOfInterval({ start, end });
  const weekRows = days.length / 7;

  return (
    <div
      className="grid h-full grid-cols-7 gap-px overflow-hidden border-t border-[var(--ink)]/10 bg-[var(--ink)]/10"
      style={{ gridTemplateRows: `auto repeat(${weekRows}, 1fr)` }}
    >
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div
          key={d}
          className="bg-[var(--paper)] px-2 py-2.5 text-center font-mono-data text-xs font-bold uppercase tracking-wide text-[var(--ink)]"
        >
          {d}
        </div>
      ))}
      {days.map((day) => {
        const key = dateKey(day);
        const entries = entriesByDate.get(key) ?? [];
        const inMonth = isSameMonth(day, anchor);
        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => onSelectDay(day)}
            onKeyDown={(e) => e.key === "Enter" && onSelectDay(day)}
            className={`h-full min-h-[100px] cursor-pointer bg-[var(--paper-raised)] p-1.5 text-left align-top hover:bg-black/[0.02] ${
              !inMonth ? "opacity-40" : ""
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                isToday(day) ? "bg-[var(--ink)] text-[var(--paper)]" : "text-[var(--ink-soft)]"
              }`}
            >
              {format(day, "d")}
            </span>
            <div className="mt-1 space-y-0.5">
              {entries.slice(0, 3).map((e) => (
                <Chip key={`${e.kind}-${e.id}`} entry={e} clientById={clientById} onOpenItem={onOpenItem} />
              ))}
              {entries.length > 3 && (
                <p className="text-[10px] text-[var(--ink-soft)]">+{entries.length - 3} more</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekGrid({
  anchor,
  entriesByDate,
  clientById,
  onSelectDay,
  onOpenItem,
}: {
  anchor: Date;
  entriesByDate: Map<string, CalendarEntry[]>;
  clientById: Map<string, Client>;
  onSelectDay: (d: Date) => void;
  onOpenItem: (id: string) => void;
}) {
  const days = eachDayOfInterval({ start: startOfWeek(anchor), end: endOfWeek(anchor) });

  return (
    <div className="grid h-full grid-cols-7 gap-2">
      {days.map((day) => {
        const key = dateKey(day);
        const entries = entriesByDate.get(key) ?? [];
        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => onSelectDay(day)}
            onKeyDown={(e) => e.key === "Enter" && onSelectDay(day)}
            className="h-full min-h-[220px] cursor-pointer rounded-lg border border-[var(--ink)]/10 p-2 text-left hover:bg-black/[0.02]"
          >
            <p className="font-mono-data text-[9px] uppercase tracking-wide text-[var(--ink-soft)]">
              {format(day, "EEE")}
            </p>
            <span
              className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                isToday(day) ? "bg-[var(--ink)] text-[var(--paper)]" : ""
              }`}
            >
              {format(day, "d")}
            </span>
            <div className="mt-2 space-y-1">
              {entries.map((e) => (
                <Chip key={`${e.kind}-${e.id}`} entry={e} clientById={clientById} onOpenItem={onOpenItem} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayAgenda({
  mode,
  entries,
  clientById,
  onOpenItem,
}: {
  mode: Mode;
  entries: CalendarEntry[];
  clientById: Map<string, Client>;
  onOpenItem: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--ink-soft)]">
        {mode === "production" ? "No work scheduled for this day." : "Nothing going live this day."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const client = clientById.get(entry.clientId);
        const isTask = entry.kind === "task";

        const inner = (
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: client?.color ?? "#999" }}
            />
            <div>
              <p className="text-sm">{entry.data.title}</p>
              <p className="text-xs text-[var(--ink-soft)]">
                {client?.name ?? "Unknown client"}
                {!isTask &&
                  ` · ${PHASE_LABELS[(entry.data as ContentItem).phase as ContentPhase] ?? ""}`}
                {isTask && (entry.data as Task).task_type ? ` · ${(entry.data as Task).task_type}` : ""}
              </p>
            </div>
          </div>
        );

        if (isTask) {
          return (
            <Link
              key={`${entry.kind}-${entry.id}`}
              href={`/clients/${entry.clientId}`}
              className="flex items-center justify-between rounded-lg border border-[var(--ink)]/8 px-3 py-2 hover:bg-black/[0.015]"
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={`${entry.kind}-${entry.id}`}
            onClick={() => onOpenItem(entry.id)}
            className="flex w-full items-center justify-between rounded-lg border border-[var(--ink)]/8 px-3 py-2 text-left hover:bg-black/[0.015]"
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ChevronLeft, ChevronRight, Loader2, Printer, Trash2 } from "lucide-react";
import {
  deleteTask,
  openTaskAsContent,
  rescheduleTask,
  toggleContentPosted,
  toggleTaskChecked,
} from "../clients/[id]/actions";
import ContentDrawer from "../clients/[id]/ContentDrawer";
import DayPrintSheet from "@/components/DayPrintSheet";
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
  const [view, setView] = useState<View>("day");
  const [anchor, setAnchor] = useState(new Date(new Date().toDateString()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [taskOpenedItem, setTaskOpenedItem] = useState<ContentItem | null>(null);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const openItem =
    (openItemId ? items.find((i) => i.id === openItemId) ?? null : null) ?? taskOpenedItem;

  async function handleOpenTask(task: Task) {
    const contentItem = await openTaskAsContent(task.client_id, task.id);
    if (contentItem) setTaskOpenedItem(contentItem as ContentItem);
    router.refresh();
  }

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

  const dayKey = dateKey(selectedDay ?? anchor);
  const tasksForDay = tasks.filter((t) => t.due_date === dayKey);
  const itemsForDay = items.filter((i) => i.scheduled_date === dayKey);

  return (
    <div className="-mx-8 flex min-h-[calc(100vh-260px)] flex-col border-y border-[var(--ink)]/10 bg-[var(--paper-raised)] py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink)]/8 px-8 pb-4">
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:opacity-90"
          >
            <Printer size={12} /> Print day
          </button>
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
            <DayWorkspace
              tasksForDay={tasksForDay}
              itemsForDay={itemsForDay}
              clientById={clientById}
              onChange={() => router.refresh()}
              onOpenItem={setOpenItemId}
              onOpenTask={handleOpenTask}
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
            setTaskOpenedItem(null);
            router.refresh();
          }}
        />
      )}

      <DayPrintSheet
        date={selectedDay ?? anchor}
        scopeLabel="All Clients"
        tasksForDay={tasksForDay}
        itemsForDay={itemsForDay}
        clientById={clientById}
      />
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
      } ${entry.data.checked_off ? "line-through opacity-50" : ""}`}
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

function DayWorkspace({
  tasksForDay,
  itemsForDay,
  clientById,
  onChange,
  onOpenItem,
  onOpenTask,
}: {
  tasksForDay: Task[];
  itemsForDay: ContentItem[];
  clientById: Map<string, Client>;
  onChange: () => void;
  onOpenItem: (id: string) => void;
  onOpenTask: (task: Task) => Promise<void>;
}) {
  const doneCount = tasksForDay.filter((t) => t.checked_off).length;

  const tasksByClient = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasksForDay) {
      if (!map.has(t.client_id)) map.set(t.client_id, []);
      map.get(t.client_id)!.push(t);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksForDay]);

  const itemsByClient = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const i of itemsForDay) {
      if (!map.has(i.client_id)) map.set(i.client_id, []);
      map.get(i.client_id)!.push(i);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsForDay]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between border-b-2 border-[var(--ink)] pb-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">To Do</h2>
          {tasksForDay.length > 0 && (
            <p className="text-xs font-bold text-[var(--ink-soft)]">
              {doneCount} of {tasksForDay.length} done
            </p>
          )}
        </div>

        {tasksForDay.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">Nothing on the work list for this day.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {[...tasksByClient.entries()].map(([clientId, clientTasks]) => {
              const client = clientById.get(clientId);
              return (
                <div key={clientId}>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: client?.color ?? "#999" }}
                    />
                    <p className="text-xs font-medium text-[var(--ink-soft)]">
                      {client?.name ?? "Unknown client"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {clientTasks.map((task) => (
                      <TaskRow key={task.id} task={task} onChange={onChange} onOpenTask={onOpenTask} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="border-b-2 border-[var(--ink)] pb-2 font-display text-lg font-bold uppercase tracking-wide">
          Going Live
        </h2>
        {itemsForDay.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">Nothing scheduled to post this day.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {[...itemsByClient.entries()].map(([clientId, clientItems]) => {
              const client = clientById.get(clientId);
              return (
                <div key={clientId}>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: client?.color ?? "#999" }}
                    />
                    <p className="text-xs font-medium text-[var(--ink-soft)]">
                      {client?.name ?? "Unknown client"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {clientItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--ink)]/8 px-3 py-2"
                      >
                        <label
                          className="flex shrink-0 items-center"
                          title="Mark as posted"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked_off}
                            onChange={async (e) => {
                              await toggleContentPosted(item.client_id, item.id, e.target.checked);
                              onChange();
                            }}
                            className="h-4 w-4 accent-[var(--sage)]"
                          />
                        </label>
                        <button
                          onClick={() => onOpenItem(item.id)}
                          className="flex flex-1 items-center justify-between gap-2 text-left hover:opacity-80"
                        >
                          <span className={`text-sm ${item.checked_off ? "text-[var(--ink-soft)] line-through" : ""}`}>
                            {item.title}
                          </span>
                          <span className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                            {item.checked_off && item.checked_off_at && (
                              <span className="text-[10px]">
                                ✓ Posted {format(new Date(item.checked_off_at), "MMM d, h:mm a")}
                              </span>
                            )}
                            {PHASE_LABELS[item.phase as ContentPhase] ?? ""}
                            {item.scheduled_time ? ` · ${item.scheduled_time}` : ""}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onChange,
  onOpenTask,
}: {
  task: Task;
  onChange: () => void;
  onOpenTask: (task: Task) => Promise<void>;
}) {
  const [opening, setOpening] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--ink)]/8 px-3 py-2">
      <div className="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          checked={task.checked_off}
          onClick={(e) => e.stopPropagation()}
          onChange={async (e) => {
            await toggleTaskChecked(task.client_id, task.id, e.target.checked);
            onChange();
          }}
          className="h-4 w-4 shrink-0 accent-[var(--teal)]"
        />
        <button
          type="button"
          disabled={opening}
          onClick={async () => {
            setOpening(true);
            await onOpenTask(task);
            setOpening(false);
          }}
          className="flex flex-1 items-center gap-1.5 text-left text-sm hover:underline disabled:opacity-60"
        >
          <span className={task.checked_off ? "text-[var(--ink-soft)] line-through" : ""}>{task.title}</span>
          {task.task_type && <span className="text-xs text-[var(--ink-soft)]">· {task.task_type}</span>}
          {task.checked_off && task.checked_off_at && (
            <span className="text-[10px] text-[var(--ink-soft)]">
              · ✓ {format(new Date(task.checked_off_at), "MMM d, h:mm a")}
            </span>
          )}
          {opening && <Loader2 size={11} className="animate-spin text-[var(--ink-soft)]" />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            const tomorrow = dateKey(addDays(new Date(task.due_date ?? new Date()), 1));
            await rescheduleTask(task.client_id, task.id, tomorrow);
            onChange();
          }}
          className="text-[10px] font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline"
        >
          Push to tomorrow
        </button>
        <button
          onClick={async () => {
            await deleteTask(task.client_id, task.id);
            onChange();
          }}
          className="text-[var(--ink-soft)] hover:text-[var(--rust)]"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

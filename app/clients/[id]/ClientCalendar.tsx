"use client";

import { useMemo, useRef, useState } from "react";
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
import { ChevronLeft, ChevronRight, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import {
  createTask,
  deleteTask,
  openTaskAsContent,
  rescheduleTask,
  toggleTaskChecked,
} from "./actions";
import ContentDrawer from "./ContentDrawer";
import { PHASE_STYLE } from "./Board";
import { PHASE_LABELS } from "@/lib/types";
import type { ContentItem, ContentPillar, Task } from "@/lib/types";

type View = "day" | "week" | "month";
type Mode = "production" | "publish";

type CalendarEntry =
  | { kind: "content"; id: string; date: string; data: ContentItem }
  | { kind: "task"; id: string; date: string; data: Task };

const TASK_TYPE_COLOR: Record<string, string> = {
  Reels: "var(--plum)",
  Posts: "var(--teal)",
  Post: "var(--teal)",
  Stories: "var(--gold)",
  Carousels: "var(--sage)",
  Carousel: "var(--sage)",
  Videos: "var(--rust)",
};

function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function ClientCalendar({
  clientId,
  items,
  tasks,
  pillars,
}: {
  clientId: string;
  items: ContentItem[];
  tasks: Task[];
  pillars: ContentPillar[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("publish");
  const [view, setView] = useState<View>("day");
  const [anchor, setAnchor] = useState(new Date(new Date().toDateString()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [openItem, setOpenItem] = useState<ContentItem | null>(null);

  const pillarById = useMemo(() => new Map(pillars.map((p) => [p.id, p])), [pillars]);

  async function handleOpenTask(task: Task) {
    const contentItem = await openTaskAsContent(clientId, task.id);
    if (contentItem) setOpenItem(contentItem as ContentItem);
    router.refresh();
  }

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    if (mode === "publish") {
      for (const item of items) {
        if (!item.scheduled_date) continue;
        const key = item.scheduled_date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ kind: "content", id: item.id, date: key, data: item });
      }
    } else {
      for (const task of tasks) {
        if (!task.due_date) continue;
        const key = task.due_date;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ kind: "task", id: task.id, date: key, data: task });
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
  function startMyDay() {
    goToday();
    setView("day");
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
            onClick={startMyDay}
            className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:opacity-90"
          >
            <Sparkles size={12} /> Start my day
          </button>
        </div>
        <p className="text-xs text-[var(--ink-soft)]">
          {mode === "production"
            ? "When work needs to get done"
            : "When each post actually goes live"}
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
            pillarById={pillarById}
            onSelectDay={(d) => {
              setSelectedDay(d);
              setAnchor(d);
              setView("day");
            }}
          />
        )}
        {view === "week" && (
          <div className="px-8">
            <WeekGrid
              anchor={anchor}
              entriesByDate={entriesByDate}
              pillarById={pillarById}
              onSelectDay={(d) => {
                setAnchor(d);
                setView("day");
              }}
            />
          </div>
        )}
        {view === "day" && (
          <div className="px-8">
            <DayWorkspace
              clientId={clientId}
              date={selectedDay ?? anchor}
              tasksForDay={tasks.filter((t) => t.due_date === dateKey(selectedDay ?? anchor))}
              itemsForDay={items.filter((i) => i.scheduled_date === dateKey(selectedDay ?? anchor))}
              pillarById={pillarById}
              onChange={() => router.refresh()}
              onOpenItem={setOpenItem}
              onOpenTask={handleOpenTask}
            />
          </div>
        )}
      </div>

      {openItem && (
        <ContentDrawer
          clientId={clientId}
          item={openItem}
          pillars={pillars}
          subtasks={tasks.filter((t) => t.content_item_id === openItem.id)}
          onClose={() => {
            setOpenItem(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Chip({
  entry,
  pillarById,
}: {
  entry: CalendarEntry;
  pillarById: Map<string, ContentPillar>;
}) {
  if (entry.kind === "content") {
    const pillar = entry.data.pillar_id ? pillarById.get(entry.data.pillar_id) : null;
    const style = PHASE_STYLE[entry.data.phase];
    return (
      <div
        className="truncate rounded px-1.5 py-0.5 text-[11px]"
        style={{ backgroundColor: pillar?.color ? `${pillar.color}22` : style.bg, color: pillar?.color ?? style.text }}
        title={entry.data.title}
      >
        {entry.data.title}
      </div>
    );
  }
  const color = (entry.data.task_type && TASK_TYPE_COLOR[entry.data.task_type]) || "var(--ink-soft)";
  return (
    <div
      className={`truncate rounded px-1.5 py-0.5 text-[11px] ${entry.data.checked_off ? "line-through opacity-50" : ""}`}
      style={{ backgroundColor: `${color}22`, color }}
      title={entry.data.title}
    >
      {entry.data.title}
    </div>
  );
}

function MonthGrid({
  anchor,
  entriesByDate,
  pillarById,
  onSelectDay,
}: {
  anchor: Date;
  entriesByDate: Map<string, CalendarEntry[]>;
  pillarById: Map<string, ContentPillar>;
  onSelectDay: (d: Date) => void;
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
          <button
            key={key}
            onClick={() => onSelectDay(day)}
            className={`h-full min-h-[100px] bg-[var(--paper-raised)] p-1.5 text-left align-top hover:bg-black/[0.02] ${
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
                <Chip key={`${e.kind}-${e.id}`} entry={e} pillarById={pillarById} />
              ))}
              {entries.length > 3 && (
                <p className="text-[10px] text-[var(--ink-soft)]">+{entries.length - 3} more</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WeekGrid({
  anchor,
  entriesByDate,
  pillarById,
  onSelectDay,
}: {
  anchor: Date;
  entriesByDate: Map<string, CalendarEntry[]>;
  pillarById: Map<string, ContentPillar>;
  onSelectDay: (d: Date) => void;
}) {
  const days = eachDayOfInterval({ start: startOfWeek(anchor), end: endOfWeek(anchor) });

  return (
    <div className="grid h-full grid-cols-7 gap-2">
      {days.map((day) => {
        const key = dateKey(day);
        const entries = entriesByDate.get(key) ?? [];
        return (
          <button
            key={key}
            onClick={() => onSelectDay(day)}
            className="h-full min-h-[220px] rounded-lg border border-[var(--ink)]/10 p-2 text-left hover:bg-black/[0.02]"
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
                <Chip key={`${e.kind}-${e.id}`} entry={e} pillarById={pillarById} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayWorkspace({
  clientId,
  date,
  tasksForDay,
  itemsForDay,
  pillarById,
  onChange,
  onOpenItem,
  onOpenTask,
}: {
  clientId: string;
  date: Date;
  tasksForDay: Task[];
  itemsForDay: ContentItem[];
  pillarById: Map<string, ContentPillar>;
  onChange: () => void;
  onOpenItem: (item: ContentItem) => void;
  onOpenTask: (task: Task) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [adding, setAdding] = useState(false);
  const doneCount = tasksForDay.filter((t) => t.checked_off).length;

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
          <div className="mt-3 space-y-2">
            {tasksForDay.map((task) => (
              <TaskRow key={task.id} clientId={clientId} task={task} onChange={onChange} onOpenTask={onOpenTask} />
            ))}
          </div>
        )}

        {adding ? (
          <form
            ref={formRef}
            action={async (formData) => {
              const title = String(formData.get("title") || "");
              if (!title.trim()) return;
              const taskType = String(formData.get("taskType") || "") || null;
              formRef.current?.reset();
              setAdding(false);
              await createTask(clientId, { title, dueDate: dateKey(date), taskType });
              onChange();
            }}
            className="mt-2 flex items-center gap-1.5"
          >
            <input
              name="title"
              autoFocus
              placeholder="Task title…"
              className="flex-1 rounded-md border border-[var(--ink)]/10 bg-[var(--paper)] px-2 py-1.5 text-sm outline-none"
            />
            <input
              name="taskType"
              placeholder="Type (optional)"
              className="w-32 rounded-md border border-[var(--ink)]/10 bg-[var(--paper)] px-2 py-1.5 text-sm outline-none"
            />
            <button type="submit" className="rounded-md bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-[var(--paper)]">
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-[var(--ink-soft)]">
              <X size={16} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--teal)] hover:underline"
          >
            <Plus size={12} /> Add a task for this day
          </button>
        )}
      </div>

      <div>
        <h2 className="border-b-2 border-[var(--ink)] pb-2 font-display text-lg font-bold uppercase tracking-wide">
          Going Live
        </h2>
        {itemsForDay.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-soft)]">Nothing scheduled to post this day.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {itemsForDay.map((item) => {
              const pillar = item.pillar_id ? pillarById.get(item.pillar_id) : null;
              const style = PHASE_STYLE[item.phase];
              return (
                <button
                  key={item.id}
                  onClick={() => onOpenItem(item)}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--ink)]/8 px-3 py-2 text-left hover:bg-black/[0.015]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {PHASE_LABELS[item.phase]}
                    </span>
                    <span className="text-sm">{item.title}</span>
                    {pillar && <span className="text-xs text-[var(--ink-soft)]">· {pillar.name}</span>}
                  </div>
                  {item.scheduled_time && (
                    <span className="text-xs text-[var(--ink-soft)]">{item.scheduled_time}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  clientId,
  task,
  onChange,
  onOpenTask,
}: {
  clientId: string;
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
            await toggleTaskChecked(clientId, task.id, e.target.checked);
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
          {opening && <Loader2 size={11} className="animate-spin text-[var(--ink-soft)]" />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            const tomorrow = dateKey(addDays(new Date(task.due_date ?? new Date()), 1));
            await rescheduleTask(clientId, task.id, tomorrow);
            onChange();
          }}
          className="text-[10px] font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline"
        >
          Push to tomorrow
        </button>
        <button
          onClick={async () => {
            await deleteTask(clientId, task.id);
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

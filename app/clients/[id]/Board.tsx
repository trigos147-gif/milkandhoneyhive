"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { createContentItem, updateContentPhase, updateContentTitle } from "./actions";
import { PHASE_LABELS, PHASE_ORDER } from "@/lib/types";
import type { ContentItem, ContentPhase, ContentPillar } from "@/lib/types";

export const PHASE_STYLE: Record<ContentPhase, { bg: string; text: string }> = {
  idea: { bg: "#1A1A1A", text: "#F4F2EE" },
  in_progress: { bg: "#5B5FEF", text: "#FFFFFF" },
  pending: { bg: "#E0524B", text: "#FFFFFF" },
  approved: { bg: "#3FA772", text: "#FFFFFF" },
  closed: { bg: "#2E8FA3", text: "#FFFFFF" },
};

export default function Board({
  clientId,
  items,
  pillars,
}: {
  clientId: string;
  items: ContentItem[];
  pillars: ContentPillar[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<ContentPhase | null>(null);

  const pillarById = new Map(pillars.map((p) => [p.id, p]));

  function itemsFor(phase: ContentPhase) {
    return items.filter((i) => i.phase === phase);
  }

  function handleDrop(phase: ContentPhase) {
    setDragOverPhase(null);
    if (!dragItemId) return;
    const item = items.find((i) => i.id === dragItemId);
    if (!item || item.phase === phase) return;
    startTransition(() => {
      updateContentPhase(clientId, dragItemId, phase).then(() => router.refresh());
    });
  }

  return (
    <div className="grid grid-cols-5 gap-3">
      {PHASE_ORDER.map((phase) => {
        const style = PHASE_STYLE[phase];
        const phaseItems = itemsFor(phase);
        const isOver = dragOverPhase === phase;

        return (
          <div
            key={phase}
            className={`min-w-0 rounded-xl border transition-colors ${
              isOver
                ? "border-[var(--ink)]/40 bg-black/[0.03]"
                : "border-[var(--ink)]/10 bg-black/[0.015]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverPhase(phase);
            }}
            onDragLeave={() => setDragOverPhase(null)}
            onDrop={() => handleDrop(phase)}
          >
            <div className="flex items-center justify-between px-2.5 py-3">
              <span
                className="truncate rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {PHASE_LABELS[phase]}
              </span>
              <span className="shrink-0 pl-1 text-xs font-medium text-[var(--ink-soft)]">
                {phaseItems.length}
              </span>
            </div>

            <div className="space-y-2 px-2.5 pb-2">
              {phaseItems.map((item) => {
                const pillar = item.pillar_id ? pillarById.get(item.pillar_id) : null;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragItemId(item.id)}
                    onDragEnd={() => setDragItemId(null)}
                    className={`cursor-grab rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2.5 shadow-sm active:cursor-grabbing ${
                      dragItemId === item.id ? "opacity-40" : ""
                    }`}
                  >
                    <ContentCardTitle
                      clientId={clientId}
                      item={item}
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                      {pillar && (
                        <span className="flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: pillar.color }}
                          />
                          <span className="truncate">{pillar.name}</span>
                        </span>
                      )}
                      {item.format && (
                        <span className="flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5 capitalize">
                          <Tag size={11} className="shrink-0" />
                          {item.format}
                        </span>
                      )}
                      {item.scheduled_date && (
                        <span className="flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5">
                          <Calendar size={11} className="shrink-0" />
                          {format(parseISO(item.scheduled_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                startTransition(() => {
                  createContentItem(clientId, phase).then(() => router.refresh());
                });
              }}
              className="flex w-full items-center justify-center gap-1 rounded-b-xl px-2 py-3 text-xs font-medium text-[var(--ink-soft)] hover:bg-black/[0.03] hover:text-[var(--ink)]"
            >
              <Plus size={14} />
              Create
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ContentCardTitle({
  clientId,
  item,
}: {
  clientId: string;
  item: ContentItem;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.title);
  const router = useRouter();

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (value.trim() && value !== item.title) {
            updateContentTitle(clientId, item.id, value.trim()).then(() =>
              router.refresh()
            );
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-full rounded border border-[var(--ink)]/20 px-1.5 py-1 text-sm font-medium outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="block w-full text-left text-sm font-medium leading-snug"
    >
      {item.title}
    </button>
  );
}

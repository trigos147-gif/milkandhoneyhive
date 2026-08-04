"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { createContentItem, updateContentPhase } from "./actions";
import ContentDrawer from "./ContentDrawer";
import {
  PHASE_LABELS,
  PHASE_ORDER,
  PRODUCTION_STAGE_COLORS,
  PRODUCTION_STAGE_SHORT_LABELS,
} from "@/lib/types";
import type { ContentItem, ContentPhase, ContentPillar, Tag as TagRecord, Task } from "@/lib/types";

export const PHASE_STYLE: Record<ContentPhase, { bg: string; text: string }> = {
  idea: { bg: "#1A1A1A", text: "#F4F2EE" },
  in_progress: { bg: "var(--rust)", text: "#FFFFFF" },
  pending: { bg: "var(--gold)", text: "#1A1A1A" },
  approved: { bg: "#3FA772", text: "#FFFFFF" },
  closed: { bg: "var(--plum)", text: "#FFFFFF" },
};

export default function Board({
  clientId,
  items,
  pillars,
  tasks,
  tags,
  tagMap,
}: {
  clientId: string;
  items: ContentItem[];
  pillars: ContentPillar[];
  tasks: Task[];
  tags: TagRecord[];
  tagMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<ContentPhase | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const pillarById = new Map(pillars.map((p) => [p.id, p]));
  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) ?? null : null;

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
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
      {PHASE_ORDER.map((phase) => {
        const style = PHASE_STYLE[phase];
        const phaseItems = itemsFor(phase);
        const isOver = dragOverPhase === phase;

        return (
          <div
            key={phase}
            className={`min-w-[78vw] shrink-0 rounded-xl border transition-colors sm:min-w-[280px] lg:min-w-0 lg:shrink ${
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
            <div
              className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
              style={{ backgroundColor: style.bg, color: style.text }}
            >
              <span className="w-5" />
              <span className="flex-1 text-center text-sm font-bold uppercase tracking-wide">
                {PHASE_LABELS[phase]}
              </span>
              <span className="w-5 text-right text-xs font-medium opacity-80">
                {phaseItems.length}
              </span>
            </div>

            <div className="space-y-2 px-2.5 pb-2 pt-2.5">
              {phaseItems.map((item) => {
                const pillar = item.pillar_id ? pillarById.get(item.pillar_id) : null;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragItemId(item.id)}
                    onDragEnd={() => setDragItemId(null)}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`cursor-pointer rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2.5 shadow-sm active:cursor-grabbing ${
                      dragItemId === item.id ? "opacity-40" : ""
                    }`}
                  >
                    <p className="text-sm font-medium leading-snug">{item.title}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                      {item.production_stage && item.production_stage !== "scheduled" && (
                        <span
                          className="flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-white"
                          style={{ backgroundColor: PRODUCTION_STAGE_COLORS[item.production_stage] }}
                        >
                          {PRODUCTION_STAGE_SHORT_LABELS[item.production_stage]}
                        </span>
                      )}
                      {(tagMap[item.id] ?? []).map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <span
                            key={tagId}
                            className="rounded-full px-1.5 py-0.5 font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        );
                      })}
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

      {selectedItem && (
        <ContentDrawer
          clientId={clientId}
          item={selectedItem}
          pillars={pillars}
          subtasks={tasks.filter((t) => t.content_item_id === selectedItem.id)}
          allTags={tags}
          itemTagIds={tagMap[selectedItem.id] ?? []}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
}

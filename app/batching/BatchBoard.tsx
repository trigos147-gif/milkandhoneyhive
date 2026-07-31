"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { updateProductionStageGlobal } from "./actions";
import {
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_STAGE_COLORS,
} from "@/lib/types";
import type { Client, ContentItem, ProductionStage } from "@/lib/types";

const COLUMNS: { stage: ProductionStage; label: string }[] = [
  { stage: "research", label: PRODUCTION_STAGE_LABELS.research },
  { stage: "ideation", label: PRODUCTION_STAGE_LABELS.ideation },
  { stage: "writing", label: PRODUCTION_STAGE_LABELS.writing },
  { stage: "filming", label: PRODUCTION_STAGE_LABELS.filming },
  { stage: "designing", label: PRODUCTION_STAGE_LABELS.designing },
  { stage: "scheduled", label: PRODUCTION_STAGE_LABELS.scheduled },
];

export default function BatchBoard({
  items,
  clients,
}: {
  items: ContentItem[];
  clients: Client[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ProductionStage | null>(null);

  const clientById = new Map(clients.map((c) => [c.id, c]));

  function itemsFor(stage: ProductionStage) {
    return items.filter((i) => i.production_stage === stage);
  }

  function handleDrop(stage: ProductionStage) {
    setDragOverStage(null);
    if (!dragItemId) return;
    const item = items.find((i) => i.id === dragItemId);
    if (!item || item.production_stage === stage) return;
    startTransition(() => {
      updateProductionStageGlobal(dragItemId, stage).then(() => router.refresh());
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {COLUMNS.map(({ stage, label }) => {
        const color = PRODUCTION_STAGE_COLORS[stage];
        const stageItems = itemsFor(stage);
        const isOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            className={`min-w-0 rounded-xl border transition-colors ${
              isOver
                ? "border-[var(--ink)]/40 bg-black/[0.03]"
                : "border-[var(--ink)]/10 bg-black/[0.015]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={() => handleDrop(stage)}
          >
            <div
              className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
              style={{ backgroundColor: color, color: "#FFFFFF" }}
            >
              <span className="w-5" />
              <span className="flex-1 text-center text-xs font-bold uppercase tracking-wide">
                {label}
              </span>
              <span className="w-5 text-right text-xs font-medium opacity-80">
                {stageItems.length}
              </span>
            </div>

            <div className="space-y-2 px-2.5 pb-2.5 pt-2.5">
              {stageItems.length === 0 && (
                <p className="py-4 text-center text-xs text-[var(--ink-soft)]">Empty</p>
              )}
              {stageItems.map((item) => {
                const client = clientById.get(item.client_id);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragItemId(item.id)}
                    onDragEnd={() => setDragItemId(null)}
                    className={`rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-2.5 shadow-sm active:cursor-grabbing ${
                      dragItemId === item.id ? "opacity-40" : ""
                    }`}
                  >
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                      {client && (
                        <span className="flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: client.color }}
                          />
                          <span className="truncate">{client.name}</span>
                        </span>
                      )}
                      {item.format && (
                        <span className="flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5 capitalize">
                          <Tag size={11} className="shrink-0" />
                          {item.format}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

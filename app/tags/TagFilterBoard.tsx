"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Tag as TagIcon, Trash2, X } from "lucide-react";
import { createTag, deleteTag, updateTag } from "./actions";
import { PRODUCTION_STAGE_SHORT_LABELS, PRODUCTION_STAGE_COLORS } from "@/lib/types";
import type { Client, ContentItem, Tag } from "@/lib/types";

export default function TagFilterBoard({
  tags,
  clients,
  items,
  tagMap,
}: {
  tags: Tag[];
  clients: Client[];
  items: ContentItem[];
  tagMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<"any" | "all">("any");
  const [newTagName, setNewTagName] = useState("");
  const [managing, setManaging] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const clientById = new Map(clients.map((c) => [c.id, c]));

  function toggleFilter(tagId: string) {
    setActiveTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId]
    );
  }

  const filteredItems = useMemo(() => {
    if (activeTagIds.length === 0) return items;
    return items.filter((item) => {
      const itemTags = tagMap[item.id] ?? [];
      return matchMode === "any"
        ? activeTagIds.some((t) => itemTags.includes(t))
        : activeTagIds.every((t) => itemTags.includes(t));
    });
  }, [items, tagMap, activeTagIds, matchMode]);

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const name = newTagName.trim();
    setNewTagName("");
    await createTag(name);
    router.refresh();
  }

  function handleSaveEdit(tagId: string) {
    startTransition(async () => {
      await updateTag(tagId, { name: editName });
      setEditingTagId(null);
      router.refresh();
    });
  }

  function handleDelete(tagId: string) {
    startTransition(async () => {
      await deleteTag(tagId);
      setActiveTagIds((prev) => prev.filter((x) => x !== tagId));
      router.refresh();
    });
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="rounded-xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Filter by tag</p>
          <button
            onClick={() => setManaging((m) => !m)}
            className="text-xs font-medium text-[var(--teal)] hover:underline"
          >
            {managing ? "Done" : "Manage tags"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tags.length === 0 && (
            <p className="text-xs text-[var(--ink-soft)]">
              No tags yet — add one from a post&apos;s drawer, or below.
            </p>
          )}
          {tags.map((t) => {
            const active = activeTagIds.includes(t.id);
            const isEditing = editingTagId === t.id;

            if (managing) {
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-1 rounded-full border border-[var(--ink)]/15 py-1 pl-2.5 pr-1.5 text-xs"
                >
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(t.id)}
                        className="w-20 bg-transparent outline-none"
                      />
                      <button onClick={() => handleSaveEdit(t.id)} className="p-0.5">
                        <Check size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                      <button
                        onClick={() => {
                          setEditingTagId(t.id);
                          setEditName(t.name);
                        }}
                        className="p-0.5 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-0.5 text-[var(--ink-soft)] hover:text-[var(--rust)]"
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              );
            }

            return (
              <button
                key={t.id}
                onClick={() => toggleFilter(t.id)}
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors"
                style={
                  active
                    ? { backgroundColor: t.color, borderColor: t.color, color: "#fff" }
                    : { borderColor: "rgba(26,26,26,0.15)", color: "var(--ink-soft)" }
                }
              >
                {active && <Check size={11} />}
                {t.name}
              </button>
            );
          })}

          {managing && (
            <div className="flex items-center gap-1.5">
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                placeholder="New tag…"
                className="w-24 rounded-full border border-[var(--ink)]/15 bg-[var(--paper)] px-2.5 py-1 text-xs outline-none"
              />
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="flex items-center gap-1 rounded-full border border-dashed border-[var(--ink)]/25 px-2.5 py-1 text-xs text-[var(--ink-soft)] hover:bg-black/5 disabled:opacity-40"
              >
                <Plus size={11} />
                Add
              </button>
            </div>
          )}
        </div>

        {!managing && activeTagIds.length > 1 && (
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--ink)]/8 pt-3">
            <span className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
              Match
            </span>
            <button
              onClick={() => setMatchMode("any")}
              className={`rounded-full px-2.5 py-1 text-xs ${
                matchMode === "any"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "border border-[var(--ink)]/15 text-[var(--ink-soft)]"
              }`}
            >
              Any tag
            </button>
            <button
              onClick={() => setMatchMode("all")}
              className={`rounded-full px-2.5 py-1 text-xs ${
                matchMode === "all"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "border border-[var(--ink)]/15 text-[var(--ink-soft)]"
              }`}
            >
              All tags
            </button>
          </div>
        )}

        {!managing && activeTagIds.length > 0 && (
          <button
            onClick={() => setActiveTagIds([])}
            className="mt-2 flex items-center gap-1 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            <X size={11} /> Clear filter
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mt-6 rounded-xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-[var(--ink)]/8 px-4 py-3">
          <p className="text-sm font-medium">
            {activeTagIds.length === 0 ? "All posts" : `${filteredItems.length} match${filteredItems.length === 1 ? "" : "es"}`}
          </p>
        </div>
        {filteredItems.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--ink-soft)]">Nothing matches yet.</p>
        ) : (
          <div className="divide-y divide-[var(--ink)]/6">
            {filteredItems.map((item) => {
              const client = clientById.get(item.client_id);
              const itemTags = (tagMap[item.id] ?? [])
                .map((id) => tags.find((t) => t.id === id))
                .filter(Boolean) as Tag[];
              return (
                <a
                  key={item.id}
                  href={`/clients/${item.client_id}`}
                  className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm hover:bg-black/[0.02]"
                >
                  {client && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: client.color }}
                    />
                  )}
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-[var(--ink-soft)]">{client?.name}</span>
                  {item.production_stage && item.production_stage !== "scheduled" && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: PRODUCTION_STAGE_COLORS[item.production_stage] }}
                    >
                      {PRODUCTION_STAGE_SHORT_LABELS[item.production_stage]}
                    </span>
                  )}
                  <span className="ml-auto flex flex-wrap items-center gap-1">
                    {itemTags.length === 0 && (
                      <span className="flex items-center gap-1 text-xs text-[var(--ink-soft)]">
                        <TagIcon size={11} /> none
                      </span>
                    )}
                    {itemTags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full px-1.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

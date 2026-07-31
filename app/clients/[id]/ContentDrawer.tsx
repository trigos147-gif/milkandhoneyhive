"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format as formatDate } from "date-fns";
import {
  Calendar,
  Check,
  FileImage,
  Hash,
  Loader2,
  Plus,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  attachContentFile,
  createContentSubtask,
  deleteContentItem,
  deleteTask,
  getContentFileUrl,
  getContentItemFiles,
  removeContentFile,
  toggleContentPosted,
  toggleTaskChecked,
  updateContentItem,
  updateContentItemTags,
} from "./actions";
import { createTag as createTagAction } from "@/app/tags/actions";
import { createClient } from "@/lib/supabase-browser";
import type {
  ContentFile,
  ContentItem,
  ContentPillar,
  ProductionStage,
  Tag as TagRecord,
  Task,
} from "@/lib/types";
import { PRODUCTION_STAGE_LABELS, stagePipelineForFormat } from "@/lib/types";

const FORMATS = ["Post", "Reel", "Story", "Carousel", "Video"];
const PLATFORMS = ["Instagram", "TikTok", "Facebook", "LinkedIn", "Pinterest", "YouTube", "X"];

export default function ContentDrawer({
  clientId,
  item,
  pillars,
  subtasks,
  allTags,
  itemTagIds,
  onClose,
}: {
  clientId: string;
  item: ContentItem;
  pillars: ContentPillar[];
  subtasks: Task[];
  allTags: TagRecord[];
  itemTagIds: string[];
  onClose: () => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(item.title);
  const [format, setFormat] = useState(item.format || "Post");
  const [productionStage, setProductionStage] = useState<ProductionStage>(
    item.production_stage ?? "research"
  );
  const [pillarId, setPillarId] = useState(item.pillar_id ?? "");
  const [platforms, setPlatforms] = useState<string[]>(item.platforms ?? []);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(itemTagIds);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [localTags, setLocalTags] = useState<TagRecord[]>(allTags);
  const [scheduledDate, setScheduledDate] = useState(item.scheduled_date ?? "");
  const [scheduledTime, setScheduledTime] = useState(item.scheduled_time ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [hashtags, setHashtags] = useState(item.hashtags ?? "");
  const [posted, setPosted] = useState(item.checked_off);
  const [postedAt, setPostedAt] = useState(item.checked_off_at);

  const [files, setFiles] = useState<ContentFile[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subtaskTitle, setSubtaskTitle] = useState("");
  const subtaskFormRef = useRef<HTMLFormElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [filesChanged, setFilesChanged] = useState(false);

  const dirty =
    title !== item.title ||
    format !== (item.format || "Post") ||
    productionStage !== (item.production_stage ?? "research") ||
    pillarId !== (item.pillar_id ?? "") ||
    JSON.stringify(platforms) !== JSON.stringify(item.platforms ?? []) ||
    JSON.stringify([...selectedTagIds].sort()) !== JSON.stringify([...itemTagIds].sort()) ||
    scheduledDate !== (item.scheduled_date ?? "") ||
    scheduledTime !== (item.scheduled_time ?? "") ||
    caption !== (item.caption ?? "") ||
    hashtags !== (item.hashtags ?? "") ||
    filesChanged;

  function refresh() {
    router.refresh();
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await Promise.all([
      updateContentItem(clientId, item.id, {
        title: title.trim(),
        format,
        productionStage,
        pillarId: pillarId || null,
        platforms,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        caption: caption || null,
        hashtags: hashtags || null,
      }),
      updateContentItemTags(clientId, item.id, selectedTagIds),
    ]);
    setSaving(false);
    setFilesChanged(false);
    refresh();
    onClose();
  }

  useEffect(() => {
    let cancelled = false;
    setLoadingFiles(true);
    getContentItemFiles(item.id).then(async (result) => {
      if (cancelled) return;
      setFiles(result as ContentFile[]);
      const urls: Record<string, string> = {};
      await Promise.all(
        result.map(async (f) => {
          const url = await getContentFileUrl(f.file_path);
          if (url) urls[f.id] = url;
        })
      );
      if (!cancelled) {
        setFileUrls(urls);
        setLoadingFiles(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function handleUpload(fileList: FileList) {
    setUploading(true);
    const supabase = createClient();
    for (const file of Array.from(fileList)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${clientId}/${item.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("content-media").upload(path, file, {
        contentType: file.type,
      });
      if (error) {
        alert(`Couldn't upload ${file.name}: ${error.message}`);
        continue;
      }
      await attachContentFile(clientId, item.id, path, file.name, file.type || null);
    }
    const result = await getContentItemFiles(item.id);
    setFiles(result as ContentFile[]);
    const urls: Record<string, string> = {};
    await Promise.all(
      result.map(async (f) => {
        const url = await getContentFileUrl(f.file_path);
        if (url) urls[f.id] = url;
      })
    );
    setFileUrls(urls);
    setUploading(false);
    setFilesChanged(true);
    refresh();
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId]
    );
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    const tag = await createTagAction(newTagName.trim());
    setCreatingTag(false);
    setNewTagName("");
    if (tag) {
      setLocalTags((prev) => [...prev, tag]);
      setSelectedTagIds((prev) => [...prev, tag.id]);
      refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => {
          if (dirty && !confirm("You have unsaved changes. Close without saving?")) return;
          onClose();
        }}
      />
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-y-auto border-l border-[var(--ink)]/10 bg-[var(--paper-raised)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--ink)]/10 px-5 py-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent font-display text-xl font-medium outline-none"
          />
          <div className="ml-3 flex items-center gap-3">
            <label
              className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[var(--ink-soft)]"
              title="Mark as posted"
            >
              <input
                type="checkbox"
                checked={posted}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setPosted(checked);
                  setPostedAt(checked ? new Date().toISOString() : null);
                  await toggleContentPosted(clientId, item.id, checked);
                  refresh();
                }}
                className="h-4 w-4 accent-[var(--sage)]"
              />
              {posted && postedAt ? `Posted ${formatDate(new Date(postedAt), "MMM d, h:mm a")}` : "Posted"}
            </label>
            <button
              onClick={async () => {
                if (!confirm(`Delete "${item.title}"? This can't be undone.`)) return;
                await deleteContentItem(clientId, item.id);
                onClose();
                router.refresh();
              }}
              className="text-[var(--ink-soft)] hover:text-[var(--rust)]"
              title="Delete content"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={() => {
                if (dirty && !confirm("You have unsaved changes. Close without saving?")) return;
                onClose();
              }}
              className="text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 py-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[340px_1fr]">
            {/* Media hero */}
            <div>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-[var(--ink)]/10 bg-[var(--paper)]">
                {loadingFiles ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-[var(--ink-soft)]" />
                  </div>
                ) : files.length === 0 ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--ink-soft)] hover:bg-black/[0.02] disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={22} className="animate-spin" />
                        <span className="text-xs">Uploading…</span>
                      </>
                    ) : (
                      <>
                        <Upload size={22} />
                        <span className="text-xs">Upload photos or graphics</span>
                      </>
                    )}
                  </button>
                ) : (
                  (() => {
                    const hero = files[Math.min(heroIndex, files.length - 1)];
                    const heroUrl = fileUrls[hero.id];
                    const isImage = hero.file_type?.startsWith("image/");
                    return heroUrl ? (
                      isImage ? (
                        <img
                          src={heroUrl}
                          alt={hero.file_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={heroUrl}
                          controls
                          className="h-full w-full bg-black object-contain"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-[var(--ink-soft)]" />
                      </div>
                    );
                  })()
                )}

                {files.length > 0 && (
                  <button
                    onClick={async () => {
                      const hero = files[Math.min(heroIndex, files.length - 1)];
                      if (!confirm("Remove this file?")) return;
                      await removeContentFile(clientId, hero.id, hero.file_path);
                      setFiles((prev) => prev.filter((x) => x.id !== hero.id));
                      setHeroIndex(0);
                      setFilesChanged(true);
                      refresh();
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {files.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setHeroIndex(i)}
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 bg-[var(--paper)] ${
                        i === heroIndex ? "border-[var(--ink)]" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {fileUrls[f.id] && f.file_type?.startsWith("image/") ? (
                        <img src={fileUrls[f.id]} alt={f.file_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FileImage size={14} className="text-[var(--ink-soft)]" />
                        </div>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--ink)]/25 text-[var(--ink-soft)] hover:border-[var(--ink)]/50 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => {
                      const newFormat = e.target.value;
                      setFormat(newFormat);
                      // Keep the stage picker's branch (filming vs. designing)
                      // consistent with whatever format is now selected.
                      const newPipeline = stagePipelineForFormat(newFormat);
                      if (!newPipeline.includes(productionStage)) {
                        const branch = newPipeline[3];
                        setProductionStage(branch);
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                    Purpose
                  </label>
                  <select
                    value={pillarId}
                    onChange={(e) => setPillarId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
                  >
                    <option value="">None</option>
                    {pillars.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  Production stage
                </label>
                <select
                  value={productionStage}
                  onChange={(e) => setProductionStage(e.target.value as ProductionStage)}
                  className="mt-1 w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
                >
                  {stagePipelineForFormat(format).map((stage) => (
                    <option key={stage} value={stage}>
                      {PRODUCTION_STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  Where this post starts (or currently sits) in the batching pipeline.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  <Tag size={11} /> Platforms
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        platforms.includes(p)
                          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                          : "border-[var(--ink)]/15 text-[var(--ink-soft)] hover:bg-black/5"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  <Hash size={11} /> Tags
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {localTags.map((t) => {
                    const active = selectedTagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTag(t.id)}
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
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                    placeholder="New tag…"
                    className="w-28 rounded-full border border-[var(--ink)]/15 bg-[var(--paper)] px-2.5 py-1 text-xs outline-none"
                  />
                  <button
                    onClick={handleCreateTag}
                    disabled={creatingTag || !newTagName.trim()}
                    className="flex items-center gap-1 rounded-full border border-dashed border-[var(--ink)]/25 px-2.5 py-1 text-xs text-[var(--ink-soft)] hover:bg-black/5 disabled:opacity-40"
                  >
                    <Plus size={11} />
                    {creatingTag ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  <Calendar size={11} /> Schedule
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption…"
                  className="mt-1 h-24 w-full resize-none rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  <Hash size={11} /> Hashtags
                </label>
                <textarea
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#hashtags"
                  className="mt-1 h-14 w-full resize-none rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                  Tasks
                </label>
                <div className="mt-1.5 space-y-1.5">
                  {subtasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-md bg-[var(--paper)] px-2 py-1.5 text-sm"
                    >
                      <label className="flex flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={t.checked_off}
                          onChange={async (e) => {
                            await toggleTaskChecked(clientId, t.id, e.target.checked);
                            refresh();
                          }}
                          className="h-4 w-4 accent-[var(--teal)]"
                        />
                        <span className={t.checked_off ? "text-[var(--ink-soft)] line-through" : ""}>
                          {t.title}
                        </span>
                        {t.checked_off && t.checked_off_at && (
                          <span className="text-[10px] text-[var(--ink-soft)]">
                            · ✓ {formatDate(new Date(t.checked_off_at), "MMM d, h:mm a")}
                          </span>
                        )}
                      </label>
                      <button
                        onClick={async () => {
                          await deleteTask(clientId, t.id);
                          refresh();
                        }}
                        className="text-[var(--ink-soft)] hover:text-[var(--rust)]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <form
                  ref={subtaskFormRef}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!subtaskTitle.trim()) return;
                    const t = subtaskTitle.trim();
                    setSubtaskTitle("");
                    await createContentSubtask(clientId, item.id, t);
                    refresh();
                  }}
                  className="mt-1.5 flex items-center gap-1.5"
                >
                  <input
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder="+ New task"
                    className="flex-1 rounded-md border border-[var(--ink)]/10 bg-[var(--paper)] px-2 py-1.5 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-[var(--ink)] px-2.5 py-1.5 text-xs font-medium text-[var(--paper)]"
                  >
                    <Plus size={13} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-[var(--ink)]/10 bg-[var(--paper-raised)] px-5 py-3">
          <span className="text-xs text-[var(--ink-soft)]">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : ""}
          </span>
          <button
            onClick={handleSave}
            disabled={!dirty || saving || !title.trim()}
            className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

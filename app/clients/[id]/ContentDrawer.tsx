"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
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
  deleteTask,
  getContentFileUrl,
  getContentItemFiles,
  removeContentFile,
  toggleTaskChecked,
  updateContentItem,
} from "./actions";
import { createClient } from "@/lib/supabase-browser";
import type { ContentFile, ContentItem, ContentPillar, Task } from "@/lib/types";

const FORMATS = ["Post", "Reel", "Story", "Carousel", "Video"];
const PLATFORMS = ["Instagram", "TikTok", "Facebook", "LinkedIn", "Pinterest", "YouTube", "X"];

function useDebouncedSave<T>(value: T, delay: number, save: (v: T) => void) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => save(value), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

export default function ContentDrawer({
  clientId,
  item,
  pillars,
  subtasks,
  onClose,
}: {
  clientId: string;
  item: ContentItem;
  pillars: ContentPillar[];
  subtasks: Task[];
  onClose: () => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(item.title);
  const [format, setFormat] = useState(item.format || "Post");
  const [pillarId, setPillarId] = useState(item.pillar_id ?? "");
  const [platforms, setPlatforms] = useState<string[]>(item.platforms ?? []);
  const [scheduledDate, setScheduledDate] = useState(item.scheduled_date ?? "");
  const [scheduledTime, setScheduledTime] = useState(item.scheduled_time ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [hashtags, setHashtags] = useState(item.hashtags ?? "");

  const [files, setFiles] = useState<ContentFile[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subtaskTitle, setSubtaskTitle] = useState("");
  const subtaskFormRef = useRef<HTMLFormElement>(null);

  function refresh() {
    router.refresh();
  }

  useDebouncedSave(title, 600, (v) => v.trim() && updateContentItem(clientId, item.id, { title: v.trim() }).then(refresh));
  useDebouncedSave(caption, 700, (v) => updateContentItem(clientId, item.id, { caption: v || null }).then(refresh));
  useDebouncedSave(hashtags, 700, (v) => updateContentItem(clientId, item.id, { hashtags: v || null }).then(refresh));

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
    refresh();
  }

  function togglePlatform(p: string) {
    setPlatforms((prev) => {
      const next = prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p];
      updateContentItem(clientId, item.id, { platforms: next }).then(refresh);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-[var(--ink)]/10 bg-[var(--paper-raised)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--ink)]/10 px-5 py-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent font-display text-xl font-medium outline-none"
          />
          <button onClick={onClose} className="ml-3 text-[var(--ink-soft)] hover:text-[var(--ink)]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value);
                  updateContentItem(clientId, item.id, { format: e.target.value }).then(refresh);
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
                Pillar
              </label>
              <select
                value={pillarId}
                onChange={(e) => {
                  setPillarId(e.target.value);
                  updateContentItem(clientId, item.id, { pillarId: e.target.value || null }).then(refresh);
                }}
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
              <Calendar size={11} /> Schedule
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  updateContentItem(clientId, item.id, { scheduledDate: e.target.value || null }).then(refresh);
                }}
                className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] p-2 text-sm outline-none"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => {
                  setScheduledTime(e.target.value);
                  updateContentItem(clientId, item.id, { scheduledTime: e.target.value || null }).then(refresh);
                }}
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

          <div>
            <label className="flex items-center gap-1.5 font-mono-data text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
              <FileImage size={11} /> Files
            </label>

            {loadingFiles ? (
              <p className="mt-2 text-xs text-[var(--ink-soft)]">Loading…</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {files.map((f) => (
                  <FileThumb
                    key={f.id}
                    file={f}
                    url={fileUrls[f.id]}
                    clientId={clientId}
                    onRemoved={() => {
                      setFiles((prev) => prev.filter((x) => x.id !== f.id));
                      refresh();
                    }}
                  />
                ))}
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
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--ink)]/20 py-3 text-xs text-[var(--ink-soft)] hover:border-[var(--ink)]/40 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload size={13} /> Upload photos or graphics
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileThumb({
  file,
  url,
  clientId,
  onRemoved,
}: {
  file: ContentFile;
  url: string | undefined;
  clientId: string;
  onRemoved: () => void;
}) {
  const isImage = file.file_type?.startsWith("image/");
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-[var(--ink)]/10 bg-[var(--paper)]">
      {url ? (
        isImage ? (
          <img src={url} alt={file.file_name} className="h-full w-full object-cover" />
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center text-[10px] text-[var(--ink-soft)]"
          >
            <FileImage size={16} />
            <span className="line-clamp-2">{file.file_name}</span>
          </a>
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 size={14} className="animate-spin text-[var(--ink-soft)]" />
        </div>
      )}
      <button
        onClick={async (e) => {
          e.preventDefault();
          await removeContentFile(clientId, file.id, file.file_path);
          onRemoved();
        }}
        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

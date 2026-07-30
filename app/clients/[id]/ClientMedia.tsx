"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { FileImage, Trash2 } from "lucide-react";
import { removeContentFile } from "./actions";
import { PHASE_LABELS } from "@/lib/types";
import type { ContentFile, ContentPhase } from "@/lib/types";

type MediaFile = ContentFile & {
  content_item_title: string;
  content_item_phase: string;
  signed_url: string | null;
};

export default function ClientMedia({
  clientId,
  files,
}: {
  clientId: string;
  files: MediaFile[];
}) {
  const router = useRouter();

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ink)]/10 bg-[var(--paper-raised)] p-10 text-center">
        <FileImage size={28} className="mx-auto text-[var(--ink-soft)]" />
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          No media uploaded yet. Files attached to any post will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {files.map((f) => (
        <div
          key={f.id}
          className="group relative overflow-hidden rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)]"
        >
          <div className="aspect-square bg-[var(--paper)]">
            {f.signed_url ? (
              f.file_type?.startsWith("image/") ? (
                <img src={f.signed_url} alt={f.file_name} className="h-full w-full object-cover" />
              ) : (
                <a
                  href={f.signed_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-[10px] text-[var(--ink-soft)]"
                >
                  <FileImage size={20} />
                  <span className="line-clamp-2">{f.file_name}</span>
                </a>
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--ink-soft)]">
                <FileImage size={20} />
              </div>
            )}
            <button
              onClick={async () => {
                if (!confirm(`Remove "${f.file_name}"?`)) return;
                await removeContentFile(clientId, f.id, f.file_path);
                router.refresh();
              }}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-medium">{f.content_item_title}</p>
            <p className="mt-0.5 truncate text-[10px] text-[var(--ink-soft)]">
              {PHASE_LABELS[f.content_item_phase as ContentPhase] ?? f.content_item_phase}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

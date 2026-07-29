"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addClient } from "./actions";

export default function AddClientForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)]"
      >
        <Plus size={15} />
        Add client
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addClient(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="flex items-center gap-2"
    >
      <input
        name="name"
        autoFocus
        required
        placeholder="Client name"
        className="rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]/30"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)]"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-[var(--ink-soft)]"
      >
        Cancel
      </button>
    </form>
  );
}

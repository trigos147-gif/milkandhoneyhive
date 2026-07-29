"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function AccountButton({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = (fullName || email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-[var(--paper)]"
        aria-label="Account settings"
      >
        {initial}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-[var(--paper-raised)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--ink)]/8 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-[var(--paper)]">
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-semibold">{fullName || "Your account"}</p>
                  <p className="text-xs text-[var(--ink-soft)]">{email}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-8 px-6 py-6">
              <ProfileSection initialName={fullName} />
              <SecuritySection />
              <ContactSection initialEmail={email} />
            </div>

            <div className="border-t border-[var(--ink)]/8 p-6">
              <LogOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileSection({ initialName }: { initialName: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div>
      <h3 className="font-display text-lg font-medium">Profile</h3>
      <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
        Update your display name.
      </p>
      <label className="mt-3 block text-xs font-medium text-[var(--ink-soft)]">
        Display Name
      </label>
      <div className="mt-1 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]/30"
        />
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-60"
        >
          {saving ? "…" : "Save"}
        </button>
      </div>
      {saved && <p className="mt-1 text-xs text-[var(--teal)]">Saved.</p>}
    </div>
  );
}

function SecuritySection() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function resetPassword() {
    if (!password) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated.");
      setPassword("");
    }
  }

  return (
    <div>
      <h3 className="font-display text-lg font-medium">Security</h3>
      <label className="mt-3 block text-xs font-medium text-[var(--ink-soft)]">
        New Password
      </label>
      <div className="mt-1 flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] px-3 py-2 pr-9 text-sm outline-none focus:border-[var(--ink)]/30"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button
          onClick={resetPassword}
          disabled={saving}
          className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-60"
        >
          {saving ? "…" : "Reset"}
        </button>
      </div>
      {message && <p className="mt-1 text-xs text-[var(--ink-soft)]">{message}</p>}
    </div>
  );
}

function ContactSection({ initialEmail }: { initialEmail: string }) {
  const supabase = createClient();
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function updateEmail() {
    if (!email || email === initialEmail) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ email });
    setSaving(false);
    setMessage(
      error ? error.message : "Confirmation links sent to both the old and new email."
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg font-medium">Contact</h3>
      <label className="mt-3 block text-xs font-medium text-[var(--ink-soft)]">
        Email
      </label>
      <div className="mt-1 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--ink)]/10 bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]/30"
        />
        <button
          onClick={updateEmail}
          disabled={saving}
          className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-60"
        >
          {saving ? "…" : "Update"}
        </button>
      </div>
      {message && <p className="mt-1 text-xs text-[var(--ink-soft)]">{message}</p>}
      <p className="mt-1 text-xs text-[var(--ink-soft)]">
        You&apos;ll need to confirm this from both your old and new inbox.
      </p>
    </div>
  );
}

function LogOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--ink)]/10 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper)]"
    >
      <LogOut size={15} />
      Log Out
    </button>
  );
}

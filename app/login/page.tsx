"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="The Milk and Honey Hive"
          className="mx-auto mb-6 h-20 w-auto"
        />
        <h1 className="mb-6 text-center font-display text-2xl font-medium">
          {mode === "signup" ? "Create your workspace" : "Welcome back"}
        </h1>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              required
              placeholder="Your name"
              className="w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]/30"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]/30"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-lg border border-[var(--ink)]/10 bg-[var(--paper-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--ink)]/30"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-xs text-[var(--rust)]">{error}</p>}
          {message && <p className="text-xs text-[var(--teal)]">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
            setMessage(null);
          }}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </main>
  );
}

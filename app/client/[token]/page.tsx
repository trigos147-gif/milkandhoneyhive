import { createClient } from "@/lib/supabase-server";

export default async function ClientLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("client_access_links")
    .select("*, clients(*)")
    .eq("token", token)
    .eq("revoked", false)
    .maybeSingle();

  if (!link) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--ink-soft)]">
          This link is invalid or has expired.
        </p>
      </main>
    );
  }

  const { data: items } = await supabase
    .from("content_items")
    .select("*")
    .eq("client_id", link.client_id)
    .in("phase", ["pending", "approved"])
    .order("scheduled_date", { ascending: true });

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
          Content for review
        </p>
        <h1 className="font-display text-2xl font-medium">
          {link.clients?.name ?? "Your content"}
        </h1>

        <div className="mt-6 space-y-3">
          {(items ?? []).length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              Nothing waiting on your review right now.
            </p>
          ) : (
            (items ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--ink)]/6 bg-[var(--paper-raised)] shadow-[var(--shadow-card)] p-4"
              >
                <p className="font-medium">{item.title}</p>
                {item.caption && (
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{item.caption}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

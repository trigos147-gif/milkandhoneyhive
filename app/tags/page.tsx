import AppShell from "@/components/AppShell";
import TagFilterBoard from "./TagFilterBoard";
import {
  getClients,
  getContentItemTagMap,
  getContentItems,
  getCurrentWorkspace,
  getTags,
} from "@/lib/queries";

export default async function TagsPage() {
  const [workspace, clients, items, tags, tagMap] = await Promise.all([
    getCurrentWorkspace(),
    getClients(),
    getContentItems(),
    getTags(),
    getContentItemTagMap(),
  ]);

  const openItems = items.filter((i) => i.phase !== "closed");

  return (
    <AppShell
      activePath="/tags"
      clients={clients}
      workspaceName={workspace?.name ?? "Client Flow"}
    >
      <p className="font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
        Tags
      </p>
      <h1 className="font-display text-3xl font-medium">Cut across clients, your way.</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Tag posts with whatever cuts across clients for you — a campaign, a shoot day, a
        client mood board — then pull a list by tag whenever you need it.
      </p>

      <div className="mt-6">
        <TagFilterBoard tags={tags} clients={clients} items={openItems} tagMap={tagMap} />
      </div>
    </AppShell>
  );
}

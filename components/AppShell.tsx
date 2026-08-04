import Sidebar, { NAV } from "./Sidebar";
import AccountButton from "./AccountButton";
import { getCurrentUser } from "@/lib/queries";
import type { Client } from "@/lib/types";
import { ChevronRight } from "lucide-react";

/* eslint-disable @next/next/no-img-element */

function resolveBreadcrumb(activePath: string, clients: Client[]) {
  if (activePath === "/") {
    return { section: "The Hive", detail: null as string | null };
  }

  if (activePath.startsWith("/clients/") && activePath !== "/clients") {
    const id = activePath.split("/")[2];
    const client = clients.find((c) => c.id === id);
    return { section: "Clients", detail: client?.name ?? null };
  }

  const match = [...NAV]
    .filter((item) => item.href !== "/")
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => activePath.startsWith(item.href));

  return { section: match?.label ?? "The Hive", detail: null as string | null };
}

export default async function AppShell({
  children,
  activePath,
  clients,
  workspaceName,
}: {
  children: React.ReactNode;
  activePath: string;
  clients: Client[];
  workspaceName: string;
}) {
  const user = await getCurrentUser();
  const { section, detail } = resolveBreadcrumb(activePath, clients);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar activePath={activePath} clients={clients} workspaceName={workspaceName} />

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex h-[76px] items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper-raised)] px-4 pl-16 sm:gap-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 font-mono-data text-xs uppercase tracking-wide text-[var(--ink-soft)]">
            <span className="hidden sm:inline">{workspaceName}</span>
            <ChevronRight size={12} className="hidden shrink-0 opacity-50 sm:inline" />
            <span className="truncate font-medium text-[var(--ink)]">{section}</span>
            {detail && (
              <>
                <ChevronRight size={12} className="shrink-0 opacity-50" />
                <span className="truncate normal-case tracking-normal text-[var(--ink-soft)]">
                  {detail}
                </span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <AccountButton
              email={user?.email ?? ""}
              fullName={user?.fullName ?? ""}
            />
            <img
              src="/logo.png"
              alt={workspaceName}
              className="h-10 w-auto shrink-0 sm:h-12 lg:h-16"
            />
          </div>
        </div>
        <div className="flex-1 bg-[var(--paper)] px-4 py-4 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

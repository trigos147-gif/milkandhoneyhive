import Sidebar from "./Sidebar";
import AccountButton from "./AccountButton";
import { getCurrentUser } from "@/lib/queries";
import type { Client } from "@/lib/types";

/* eslint-disable @next/next/no-img-element */

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

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar activePath={activePath} clients={clients} workspaceName={workspaceName} />

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex h-[76px] items-center justify-end gap-3 border-b border-[var(--line)] bg-[var(--paper-raised)] px-4 pl-16 sm:gap-4 lg:px-8">
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
        <div className="flex-1 bg-[var(--paper)] px-4 py-4 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

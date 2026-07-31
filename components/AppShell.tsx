import Link from "next/link";
import { Hexagon, LayoutGrid, Users, Layers, CalendarDays, DollarSign, Hash } from "lucide-react";
import SignOutButton from "./SignOutButton";
import AccountButton from "./AccountButton";
import { getCurrentUser } from "@/lib/queries";
import type { Client } from "@/lib/types";

/* eslint-disable @next/next/no-img-element */

const NAV = [
  { href: "/", label: "The Hive", icon: Hexagon },
  { href: "/dashboard", label: "Calendar", icon: LayoutGrid },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/batching", label: "Batching", icon: Layers },
  { href: "/tags", label: "Tags", icon: Hash },
  { href: "/planning", label: "Planning", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: DollarSign },
];

const STATUS_DOT: Record<string, string> = {
  lead: "#B85C42",
  onboarding: "#C08A2E",
  active: "#7C9A6E",
  paused: "#6b6b6b",
  archived: "#3a3a3a",
};

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
      <aside className="flex w-60 shrink-0 flex-col justify-between bg-[#161616] text-white/80">
        <div>
          <div className="flex h-[76px] items-center border-b border-white/10 px-5">
            <span className="truncate font-display text-base font-medium text-white">
              {workspaceName}
            </span>
          </div>
          <nav className="space-y-1 px-4 pt-5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/" || href === "/clients"
                ? activePath === href
                : activePath.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-white/10 font-medium text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white/90"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 px-4">
            <p className="px-3 font-mono-data text-[10px] uppercase tracking-wide text-white/35">
              Clients
            </p>
            <div className="mt-2 space-y-0.5">
              {clients.length === 0 ? (
                <p className="px-3 text-xs text-white/35">No clients yet</p>
              ) : (
                clients.map((c) => {
                  const clientActive = activePath === `/clients/${c.id}`;
                  return (
                    <Link
                      key={c.id}
                      href={`/clients/${c.id}`}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        clientActive
                          ? "bg-white/10 font-medium text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white/95"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_DOT[c.status] ?? c.color }}
                      />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="px-7 py-5">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex h-[76px] items-center justify-end gap-4 border-b border-[var(--ink)]/8 bg-[var(--paper)] px-8">
          <AccountButton
            email={user?.email ?? ""}
            fullName={user?.fullName ?? ""}
          />
          <img
            src="/logo.png"
            alt={workspaceName}
            className="h-16 w-auto shrink-0"
          />
        </div>
        <div className="flex-1 bg-[var(--paper)] px-8 py-8">{children}</div>
      </div>
    </div>
  );
}

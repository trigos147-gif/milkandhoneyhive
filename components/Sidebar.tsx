"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";
import type { Client } from "@/lib/types";
import { NAV } from "@/lib/nav";
import { Menu, X } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  lead: "#B85C42",
  onboarding: "#C08A2E",
  active: "#7C9A6E",
  paused: "#6b6b6b",
  archived: "#3a3a3a",
};

function SidebarContent({
  activePath,
  clients,
  workspaceName,
  onNavigate,
}: {
  activePath: string;
  clients: Client[];
  workspaceName: string;
  onNavigate?: () => void;
}) {
  return (
    <>
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
                onClick={onNavigate}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors sm:py-2 ${
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
                    onClick={onNavigate}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors sm:py-1.5 ${
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
    </>
  );
}

export default function Sidebar({
  activePath,
  clients,
  workspaceName,
}: {
  activePath: string;
  clients: Client[];
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever navigation actually happens.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop / iPad-landscape static sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between bg-[#161616] text-white/80 lg:flex">
        <SidebarContent activePath={activePath} clients={clients} workspaceName={workspaceName} />
      </aside>

      {/* Mobile / iPad-portrait hamburger trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-3 top-[18px] z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-[#161616] text-white/90 shadow-md lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile / iPad-portrait slide-over drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col justify-between bg-[#161616] text-white/80 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent
              activePath={activePath}
              clients={clients}
              workspaceName={workspaceName}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}

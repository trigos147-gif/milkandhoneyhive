"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "board", label: "Workflow" },
  { key: "calendar", label: "Calendar" },
  { key: "media", label: "Media" },
  { key: "contract", label: "Contract & Deliverables" },
  { key: "activity", label: "Activity" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ClientTabs({
  board,
  calendar,
  media,
  contract,
  activity,
}: {
  board: ReactNode;
  calendar: ReactNode;
  media: ReactNode;
  contract: ReactNode;
  activity: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("board");

  const panels: Record<TabKey, ReactNode> = { board, calendar, media, contract, activity };

  return (
    <div>
      <div className="-mx-4 flex items-center gap-1 overflow-x-auto border-x border-b border-[var(--ink)]/12 bg-[var(--paper-raised)] px-2 py-1.5 lg:-mx-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active === tab.key
                ? "bg-black/[0.06] text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:bg-black/[0.03] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={active === "calendar" ? "" : "mt-5"}>{panels[active]}</div>
    </div>
  );
}

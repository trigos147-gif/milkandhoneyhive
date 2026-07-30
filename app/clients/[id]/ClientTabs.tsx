"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "board", label: "Board" },
  { key: "contract", label: "Contract & Deliverables" },
  { key: "activity", label: "Activity" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ClientTabs({
  board,
  contract,
  activity,
}: {
  board: ReactNode;
  contract: ReactNode;
  activity: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("board");

  const panels: Record<TabKey, ReactNode> = { board, contract, activity };

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-[var(--ink)]/10">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
              active === tab.key
                ? "text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--teal)]" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">{panels[active]}</div>
    </div>
  );
}

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
      <div className="-mx-8 flex items-center gap-0.5 border-x border-b border-[var(--ink)]/12 bg-[var(--paper-raised)] px-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active === tab.key
                ? "border-[var(--teal)] text-[var(--ink)]"
                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">{panels[active]}</div>
    </div>
  );
}

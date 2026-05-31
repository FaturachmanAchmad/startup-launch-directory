"use client";

import { useState } from "react";
import { AdminProductTable } from "./admin-product-table";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logoUrl: string | null;
  status: string;
  featured: boolean;
  createdAt: Date;
  websiteUrl: string;
  category: { name: string; icon: string | null };
  user: { id: string; name: string | null; email: string; image: string | null };
  _count: { upvotes: number };
};

type TabsProps = {
  pending: Product[];
  approved: Product[];
  rejected: Product[];
};

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Tabs({ pending, approved, rejected }: TabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("pending");

  const counts = { pending: pending.length, approved: approved.length, rejected: rejected.length };
  const data = { pending, approved, rejected };

  const actions: Record<TabId, ("approve" | "reject" | "feature" | "delete")[]> = {
    pending: ["approve", "reject", "delete"],
    approved: ["reject", "feature", "delete"],
    rejected: ["approve", "delete"],
  };

  return (
    <div>
      {/* Tab headers */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold",
                activeTab === tab.id
                  ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AdminProductTable
        products={data[activeTab]}
        showActions={actions[activeTab]}
      />
    </div>
  );
}

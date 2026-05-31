"use client";

import { Package, Clock, Users, Mail } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-context";

export function AdminStats() {
  const { stats } = useAdmin();

  const items = [
    {
      label: "Live Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-emerald-500",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Pending Review",
      value: stats.pendingReview,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Subscribers",
      value: stats.newsletterSubs,
      icon: Mail,
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border bg-card p-4">
          <div
            className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${item.bg} mb-3`}
          >
            <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
          </div>
          <div className="text-2xl font-bold tabular-nums transition-all duration-300">
            {item.value}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
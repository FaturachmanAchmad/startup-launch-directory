"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Trash2, User as UserIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Role } from "@/lib/types";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  createdAt: Date;
  _count: { products: number };
};

export function AdminUserTable({ users: initialUsers }: { users: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRoleToggle(user: AdminUser) {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      toast.success(
        newRole === "ADMIN"
          ? `${user.name ?? user.email} is now an Admin`
          : `${user.name ?? user.email} role set to User`
      );
    } catch {
      toast.error("Failed to update role");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (
      !confirm(
        `Delete ${user.name ?? user.email}? This will also delete all their products and cannot be undone.`
      )
    )
      return;
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setLoadingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No users found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors"
        >
          {/* Avatar */}
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
            <AvatarFallback className="text-xs font-semibold">
              {user.name?.charAt(0).toUpperCase() ??
                user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">
                {user.name ?? "—"}
              </span>
              {user.role === "ADMIN" && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {user._count.products} product{user._count.products !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Toggle role */}
            <button
              onClick={() => handleRoleToggle(user)}
              disabled={loadingId === user.id}
              title={user.role === "ADMIN" ? "Revoke admin" : "Make admin"}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-muted-foreground hover:text-orange-500 transition-colors disabled:opacity-50"
            >
              {user.role === "ADMIN" ? (
                <UserIcon className="h-3.5 w-3.5" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDelete(user)}
              disabled={loadingId === user.id}
              title="Delete user"
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
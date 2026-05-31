"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdmin } from "@/components/admin/admin-context";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { ShieldCheck, User as UserIcon, Trash2, Pencil, X, Save, Search } from "lucide-react";

type AdminUser = {
  id: string; name: string | null; email: string; image: string | null;
  role: string; createdAt: Date; _count: { products: number };
};
type EditForm = { name: string; email: string };

export function AdminUserCRUD() {
  const { users, removeUser, updateUser } = useAdmin();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", email: "" });
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(user: AdminUser) {
    setEditingId(user.id);
    setEditForm({ name: user.name ?? "", email: user.email });
  }

  async function handleRoleToggle(user: AdminUser) {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ROLE", role: newRole }),
      });
      if (!res.ok) throw new Error();
      updateUser(user.id, { role: newRole });
      toast.success(newRole === "ADMIN" ? `${user.name ?? user.email} is now an Admin` : `${user.name ?? user.email} role set to User`);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleSaveEdit(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EDIT", ...editForm }),
      });
      if (!res.ok) throw new Error();
      updateUser(id, { name: editForm.name || null, email: editForm.email });
      setEditingId(null);
      toast.success("User updated");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      removeUser(deleteTarget.id);
      toast.success("User deleted");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user"
        description={deleteTarget ? `"${deleteTarget.name ?? deleteTarget.email}" and all their products will be permanently removed. This cannot be undone.` : ""}
        confirmLabel="Delete user"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">
          Users <span className="text-muted-foreground font-normal text-sm tabular-nums">({users.length})</span>
        </h2>
        <div className="relative w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-8 h-8 text-xs" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {search ? "No users match your search" : "No users found"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const isEditing = editingId === user.id;
            const isLoading = loadingId === user.id;
            return (
              <div key={user.id} className="rounded-xl border bg-card transition-colors">
                <div className="flex items-center gap-3 p-4">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                    <AvatarFallback className="text-xs font-semibold">
                      {(user.name ?? user.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{user.name ?? "—"}</span>
                      {user.role === "ADMIN" && (
                        <Badge variant="orange" className="gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" />Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      <span className="text-xs text-muted-foreground">{user._count.products} product{user._count.products !== 1 ? "s" : ""}</span>
                      <span className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isEditing ? (
                      <button onClick={() => startEdit(user)} disabled={isLoading}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleSaveEdit(user.id)} disabled={isLoading}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50" title="Save">
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors" title="Cancel">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleRoleToggle(user)} disabled={isLoading}
                      title={user.role === "ADMIN" ? "Revoke admin" : "Make admin"}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 text-muted-foreground hover:text-orange-500 transition-colors disabled:opacity-50">
                      {user.role === "ADMIN" ? <UserIcon className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => setDeleteTarget(user)} disabled={isLoading}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50" title="Delete user">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-4 pb-4 border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                      <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="h-8 text-xs" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
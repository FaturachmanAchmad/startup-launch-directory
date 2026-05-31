"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdmin } from "@/components/admin/admin-context";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  CheckCircle2, XCircle, Star, StarOff, Trash2,
  ExternalLink, ChevronUp, Pencil, X, Save,
} from "lucide-react";

type Category = { id: string; name: string; icon: string | null };
type Product = {
  id: string; name: string; slug: string; tagline: string; description: string;
  logoUrl: string | null; websiteUrl: string; twitterUrl: string | null;
  status: string; featured: boolean; createdAt: Date; category: Category;
  user: { id: string; name: string | null; email: string; image: string | null };
  _count: { upvotes: number };
};
type TabId = "pending" | "approved" | "rejected";
type EditForm = { name: string; tagline: string; websiteUrl: string; categoryId: string };

const TABS = [
  { id: "pending" as TabId, label: "Pending" },
  { id: "approved" as TabId, label: "Approved" },
  { id: "rejected" as TabId, label: "Rejected" },
];

export function AdminProductCRUD() {
  const { lists, categories, removeProduct, updateProduct } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", tagline: "", websiteUrl: "", categoryId: "" });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const counts = {
    pending: lists.pending.length,
    approved: lists.approved.length,
    rejected: lists.rejected.length,
  };

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditForm({ name: product.name, tagline: product.tagline, websiteUrl: product.websiteUrl, categoryId: product.category.id });
  }

  async function handleAction(id: string, action: "APPROVE" | "REJECT" | "FEATURE") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (action === "APPROVE") {
        // Move from pending → approved in context
        updateProduct(id, { status: "APPROVED" });
        toast.success("Product approved ✓");
      } else if (action === "REJECT") {
        // Move from pending → rejected in context
        updateProduct(id, { status: "REJECTED" });
        toast.success("Product rejected");
      } else {
        updateProduct(id, { featured: data.product.featured });
        toast.success(data.product.featured ? "Product featured ⭐" : "Removed from featured");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      removeProduct(deleteTarget.id);
      toast.success("Product deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSaveEdit(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EDIT", ...editForm }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newCat = categories.find((c) => c.id === editForm.categoryId);
      updateProduct(id, {
        name: data.product.name,
        tagline: data.product.tagline,
        websiteUrl: data.product.websiteUrl,
        category: newCat ?? data.product.category,
      });
      setEditingId(null);
      toast.success("Product updated");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setLoadingId(null);
    }
  }

  const current = lists[activeTab] as Product[];

  return (
    <section>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed. This cannot be undone.` : ""}
        confirmLabel="Delete product"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <h2 className="text-base font-semibold mb-4">Products</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-5">
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
            <span className={cn(
              "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold tabular-nums transition-all duration-300",
              activeTab === tab.id
                ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600"
                : "bg-muted text-muted-foreground"
            )}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">No products here</div>
      ) : (
        <div className="space-y-2">
          {current.map((product) => {
            const isEditing = editingId === product.id;
            const isLoading = loadingId === product.id;
            return (
              <div key={product.id} className="rounded-xl border bg-card transition-colors">
                <div className="flex items-start gap-3 p-4">
                  {/* Logo */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
                    {product.logoUrl ? (
                      <Image src={product.logoUrl} alt={product.name} width={40} height={40} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{product.name.charAt(0)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{product.name}</span>
                      {product.featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                      <span className="text-xs text-muted-foreground">{product.category.icon} {product.category.name}</span>
                      {product.status === "PENDING" && <Badge variant="warning">Pending</Badge>}
                      {product.status === "APPROVED" && <Badge variant="success">Approved</Badge>}
                      {product.status === "REJECTED" && <Badge variant="destructive">Rejected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.tagline}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={product.user.image ?? ""} />
                          <AvatarFallback className="text-[8px]">{product.user.name?.charAt(0) ?? "U"}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{product.user.name ?? product.user.email}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(product.createdAt)}</span>
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <ChevronUp className="h-3 w-3" />{product._count.upvotes}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Visit website">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {!isEditing ? (
                      <button onClick={() => startEdit(product)} disabled={isLoading}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleSaveEdit(product.id)} disabled={isLoading}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50" title="Save">
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors" title="Cancel">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {product.status !== "APPROVED" && (
                      <button onClick={() => handleAction(product.id, "APPROVE")} disabled={isLoading}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50" title="Approve">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {product.status !== "REJECTED" && (
                      <button onClick={() => handleAction(product.id, "REJECT")} disabled={isLoading}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50" title="Reject">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {product.status === "APPROVED" && (
                      <button onClick={() => handleAction(product.id, "FEATURE")} disabled={isLoading}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-muted-foreground hover:text-amber-500 transition-colors disabled:opacity-50"
                        title={product.featured ? "Remove featured" : "Feature"}>
                        {product.featured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(product)} disabled={isLoading}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div className="px-4 pb-4 border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Name</label>
                      <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Product name" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Category</label>
                      <select value={editForm.categoryId} onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.target.value }))}
                        className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Tagline</label>
                      <Input value={editForm.tagline} onChange={(e) => setEditForm((f) => ({ ...f, tagline: e.target.value }))} placeholder="Short tagline" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Website URL</label>
                      <Input value={editForm.websiteUrl} onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://..." className="h-8 text-xs" />
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
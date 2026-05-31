"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  XCircle,
  Star,
  StarOff,
  Trash2,
  ExternalLink,
  ChevronUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

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

type Props = {
  products: Product[];
  showActions?: ("approve" | "reject" | "feature" | "delete")[];
};

export function AdminProductTable({
  products: initialProducts,
  showActions = ["approve", "reject", "feature", "delete"],
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(
    id: string,
    action: "APPROVE" | "REJECT" | "FEATURE" | "DELETE"
  ) {
    setLoadingId(id);
    try {
      if (action === "DELETE") {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted");
      } else {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: data.product.status, featured: data.product.featured }
              : p
          )
        );
        const messages: Record<string, string> = {
          APPROVE: "Product approved ✓",
          REJECT: "Product rejected",
          FEATURE: data.product.featured ? "Product featured ⭐" : "Removed from featured",
        };
        toast.success(messages[action]);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No products here
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors"
        >
          {/* Logo */}
          <div className="flex-shrink-0 h-10 w-10 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
            {product.logoUrl ? (
              <Image
                src={product.logoUrl}
                alt={product.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">
                {product.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{product.name}</span>
              {product.featured && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {product.category.icon} {product.category.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {product.tagline}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={product.user.image ?? ""} />
                  <AvatarFallback className="text-[8px]">
                    {product.user.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {product.user.name ?? product.user.email}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(product.createdAt)}
              </span>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <ChevronUp className="h-3 w-3" />
                {product._count.upvotes}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
            <a
              href={product.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Visit website"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {showActions.includes("approve") && product.status !== "APPROVED" && (
              <button
                onClick={() => handleAction(product.id, "APPROVE")}
                disabled={loadingId === product.id}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-600 transition-colors disabled:opacity-50"
                title="Approve"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}

            {showActions.includes("reject") && product.status !== "REJECTED" && (
              <button
                onClick={() => handleAction(product.id, "REJECT")}
                disabled={loadingId === product.id}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                title="Reject"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}

            {showActions.includes("feature") && product.status === "APPROVED" && (
              <button
                onClick={() => handleAction(product.id, "FEATURE")}
                disabled={loadingId === product.id}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-muted-foreground hover:text-amber-500 transition-colors disabled:opacity-50"
                title={product.featured ? "Remove from featured" : "Feature product"}
              >
                {product.featured ? (
                  <StarOff className="h-3.5 w-3.5" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {showActions.includes("delete") && (
              <button
                onClick={() => {
                  if (confirm("Delete this product? This cannot be undone.")) {
                    handleAction(product.id, "DELETE");
                  }
                }}
                disabled={loadingId === product.id}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ChevronUp, ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeDate, CATEGORY_COLORS } from "@/lib/utils";
import type { ProductWithDetails } from "@/lib/types";
import toast from "react-hot-toast";

type ProductCardProps = {
  product: ProductWithDetails;
  rank?: number;
  showRank?: boolean;
};

export function ProductCard({ product, rank, showRank = false }: ProductCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(product._count.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(product.upvoted ?? false);
  const [loading, setLoading] = useState(false);

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/upvote`, {
        method: "POST",
      });

      if (res.status === 401) {
        toast.error("Sign in to upvote products");
        return;
      }

      if (!res.ok) throw new Error();

      const data = await res.json();
      setUpvoteCount(data.upvoteCount);
      setHasUpvoted(data.upvoted);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const categoryColor =
    CATEGORY_COLORS[product.category.slug] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-sm transition-all duration-200">
        {/* Rank */}
        {showRank && rank && (
          <span className="text-sm font-bold text-muted-foreground w-5 text-center flex-shrink-0">
            {rank}
          </span>
        )}

        {/* Logo */}
        <div className="flex-shrink-0 h-12 w-12 rounded-xl border bg-muted overflow-hidden flex items-center justify-center">
          {product.logoUrl ? (
            <Image
              src={product.logoUrl}
              alt={product.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {product.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm group-hover:text-orange-500 transition-colors truncate">
              {product.name}
            </h3>
            {product.featured && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                <Star className="h-3 w-3 fill-amber-500" />
                Featured
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {product.tagline}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                categoryColor
              )}
            >
              {product.category.icon && (
                <span className="mr-1">{product.category.icon}</span>
              )}
              {product.category.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(product.launchDate)}
            </span>
          </div>
        </div>

        {/* Upvote */}
        <button
          onClick={handleUpvote}
          disabled={loading}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-14 rounded-lg border-2 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95",
            hasUpvoted
              ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
              : "border-border hover:border-orange-300 text-muted-foreground hover:text-orange-500"
          )}
        >
          <ChevronUp
            className={cn(
              "h-4 w-4 transition-transform",
              loading && "animate-pulse"
            )}
          />
          <span className="text-xs font-semibold">{upvoteCount}</span>
        </button>
      </div>
    </Link>
  );
}

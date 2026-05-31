"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CategoryWithCount } from "@/lib/types";

type CategoryFilterProps = {
  categories: CategoryWithCount[];
  selectedSlug?: string;
};

export function CategoryFilter({ categories, selectedSlug }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleSelect(null)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
          !selectedSlug
            ? "bg-foreground text-background"
            : "border hover:border-foreground/30 text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleSelect(cat.slug)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            selectedSlug === cat.slug
              ? "bg-foreground text-background"
              : "border hover:border-foreground/30 text-muted-foreground hover:text-foreground"
          )}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.name}
          <span className="opacity-60">({cat._count.products})</span>
        </button>
      ))}
    </div>
  );
}

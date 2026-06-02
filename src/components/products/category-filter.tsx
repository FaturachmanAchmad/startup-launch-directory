"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { CategoryWithCount } from "@/lib/types";

type CategoryFilterProps = {
  categories: CategoryWithCount[];
  selectedSlug?: string;
};

export function CategoryFilter({ categories, selectedSlug }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
    setOpen(false);
  }

  // Sort categories by product count (most → least)
  const sorted = [...categories].sort(
    (a, b) => b._count.products - a._count.products
  );

  const selected = sorted.find((c) => c.slug === selectedSlug);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
          "hover:border-foreground/30 hover:text-foreground",
          open
            ? "border-foreground/30 text-foreground"
            : "text-muted-foreground"
        )}
      >
        {selected ? (
          <>
            {selected.icon && <span>{selected.icon}</span>}
            {selected.name}
            <span className="opacity-50">({selected._count.products})</span>
          </>
        ) : (
          "All Categories"
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border bg-popover shadow-lg overflow-hidden">
          <div className="max-h-72 overflow-y-auto p-1">
            {/* All option */}
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                !selectedSlug
                  ? "bg-foreground text-background"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <span>All Categories</span>
              <span className="opacity-50">
                {categories.reduce((sum, c) => sum + c._count.products, 0)}
              </span>
            </button>

            {/* Divider */}
            <div className="my-1 border-t" />

            {/* Sorted categories */}
            {sorted.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.slug)}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  selectedSlug === cat.slug
                    ? "bg-foreground text-background"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </span>
                <span className="opacity-50">{cat._count.products}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
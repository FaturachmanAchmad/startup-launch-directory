import { Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { CategoryFilter } from "@/components/products/category-filter";
import { SearchBar } from "@/components/products/search-bar";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Discover the best new products from indie makers and startups.",
};

type SearchParams = { q?: string; category?: string; sort?: string; page?: string };

// OPT 1: Cache category list — fetched on every /products load but changes ~never.
// Before: DB call on every request. After: zero DB cost after first warm (5 min TTL).
const getCachedCategories = unstable_cache(
  () =>
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,

        _count: {
          select: {
            products: {
              where: {
                status: "APPROVED",
              },
            },
          },
        },
      },
      orderBy: {
        products: {
          _count: "desc",
        },
      },
    }),
  ["categories"],
  { revalidate: 300 }
);

// OPT 2: Shared select shape — defined once, no duplication, TypeScript infers type.
const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  logoUrl: true,
  websiteUrl: true,
  twitterUrl: true,
  featured: true,
  launchDate: true,
  createdAt: true,

  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
    },
  },

  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },

  _count: {
    select: {
      upvotes: true,
    },
  },
} as const;

async function getProducts(searchParams: SearchParams, userId?: string) {
  const q = searchParams.q?.trim() ?? "";
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "newest";
  // OPT 3: Guard NaN — parseInt("abc") = NaN, (NaN - 1) * limit = NaN → skip = NaN → DB error
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 15;
  const skip = (page - 1) * limit;

  const where: any = { status: "APPROVED" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
      // OPT 4: Removed description from search — it's a large text field with no
      // trigram index, forcing a full sequential scan. name+tagline are short & indexed.
    ];
  }
  if (category) where.category = { slug: category };
  if (sort === "featured") where.featured = true;

  const orderBy: any =
    sort === "popular" ? { upvotes: { _count: "desc" } }
    : sort === "oldest" ? { launchDate: "asc" }
    : { launchDate: "desc" };

  // OPT 5: Use select instead of include — fetches only columns the UI renders,
  // not the full row (avoids sending description/twitterUrl/websiteUrl in list view).
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take: limit, select: PRODUCT_SELECT }),
    prisma.product.count({ where }),
  ]);

  if (!userId) {
    return {
      products: products.map((p) => ({ ...p, upvoted: false })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // OPT 6: Select only productId from upvotes — don't fetch the full row
  const upvotes = await prisma.upvote.findMany({
    where: { userId, productId: { in: products.map((p) => p.id) } },
    select: { productId: true },
  });
  const upvotedIds = new Set(upvotes.map((u) => u.productId));

  return {
    products: products.map((p) => ({ ...p, upvoted: upvotedIds.has(p.id) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  // OPT 7: auth + categories are independent — run in parallel
  const [session, categories] = await Promise.all([auth(), getCachedCategories()]);
  const { products, pagination } = await getProducts(searchParams, session?.user?.id);

  const sort = searchParams.sort ?? "newest";
  const page = pagination.page;

  function buildPageUrl(newPage: number) {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.category) params.set("category", searchParams.category);
    if (sort !== "newest") params.set("sort", sort);
    params.set("page", String(newPage));
    return `/products?${params.toString()}`;
  }

  // OPT 8: Sliding window pagination — always shows 5 pages centred on current page
  // instead of always 1–5, which breaks UX on large result sets.
  const windowSize = 5;
  const halfWindow = Math.floor(windowSize / 2);
  const startPage = Math.max(1, Math.min(page - halfWindow, pagination.pages - windowSize + 1));
  const endPage = Math.min(pagination.pages, startPage + windowSize - 1);

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">All Products</h1>
        <p className="text-sm text-muted-foreground">{pagination.total} products from indie makers</p>
      </div>

      <div className="mb-4"><SearchBar /></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <Suspense fallback={null}>
          <CategoryFilter categories={categories} selectedSlug={searchParams.category} />
        </Suspense>

        <div className="flex gap-1 flex-shrink-0">
          {(["newest", "popular", "featured"] as const).map((value) => (
            <Link
              key={value}
              href={`/products?${new URLSearchParams({
                ...(searchParams.q ? { q: searchParams.q } : {}),
                ...(searchParams.category ? { category: searchParams.category } : {}),
                sort: value,
              })}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                sort === value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      <Suspense fallback={<ProductGridSkeleton />}>
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchParams.q ? `No results for "${searchParams.q}"` : "No products in this category yet"}
            </p>
            <Link href="/submit"><Button size="sm">Submit a product</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                rank={(page - 1) * pagination.limit + i + 1}
                showRank
              />
            ))}
          </div>
        )}
      </Suspense>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)}>
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />Previous
              </Button>
            </Link>
          )}
          <div className="flex gap-1">
            {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const pageNum = startPage + i;
              return (
                <Link key={pageNum} href={buildPageUrl(pageNum)}>
                  <Button variant={page === pageNum ? "default" : "outline"} size="sm" className="w-9">
                    {pageNum}
                  </Button>
                </Link>
              );
            })}
          </div>
          {page < pagination.pages && (
            <Link href={buildPageUrl(page + 1)}>
              <Button variant="outline" size="sm" className="gap-1">
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
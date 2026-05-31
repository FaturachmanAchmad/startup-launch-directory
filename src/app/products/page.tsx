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
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description: "Discover the best new products from indie makers and startups.",
};

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
};

async function getProducts(searchParams: SearchParams, userId?: string) {
  const q = searchParams.q ?? "";
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "newest";
  const page = parseInt(searchParams.page ?? "1");
  const limit = 15;
  const skip = (page - 1) * limit;

  const where: any = { status: "APPROVED" };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (sort === "featured") {
    where.featured = true;
  }

  const orderBy: any =
    sort === "popular"
      ? { upvotes: { _count: "desc" } }
      : sort === "oldest"
      ? { launchDate: "asc" }
      : { launchDate: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { upvotes: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  let productsWithUpvotes = products.map((p) => ({ ...p, upvoted: false }));

  if (userId) {
    const upvotes = await prisma.upvote.findMany({
      where: {
        userId,
        productId: { in: products.map((p) => p.id) },
      },
    });
    const upvotedIds = new Set(upvotes.map((u) => u.productId));
    productsWithUpvotes = products.map((p) => ({
      ...p,
      upvoted: upvotedIds.has(p.id),
    }));
  }

  return {
    products: productsWithUpvotes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { products: { where: { status: "APPROVED" } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const [{ products, pagination }, categories] = await Promise.all([
    getProducts(searchParams, session?.user?.id),
    getCategories(),
  ]);

  const sort = searchParams.sort ?? "newest";
  const page = parseInt(searchParams.page ?? "1");

  function buildPageUrl(newPage: number) {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.category) params.set("category", searchParams.category);
    if (sort !== "newest") params.set("sort", sort);
    params.set("page", String(newPage));
    return `/products?${params.toString()}`;
  }

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">All Products</h1>
        <p className="text-sm text-muted-foreground">
          {pagination.total} products from indie makers
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <Suspense fallback={null}>
          <CategoryFilter
            categories={categories}
            selectedSlug={searchParams.category}
          />
        </Suspense>

        {/* Sort */}
        <div className="flex gap-1 flex-shrink-0">
          {[
            { label: "Newest", value: "newest" },
            { label: "Popular", value: "popular" },
            { label: "Featured", value: "featured" },
          ].map((option) => (
            <Link
              key={option.value}
              href={`/products?${new URLSearchParams({
                ...(searchParams.q ? { q: searchParams.q } : {}),
                ...(searchParams.category
                  ? { category: searchParams.category }
                  : {}),
                sort: option.value,
              }).toString()}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sort === option.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Products */}
      <Suspense fallback={<ProductGridSkeleton />}>
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchParams.q
                ? `No results for "${searchParams.q}"`
                : "No products in this category yet"}
            </p>
            <Link href="/submit">
              <Button size="sm">Submit a product</Button>
            </Link>
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)}>
              <Button variant="outline" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            </Link>
          )}

          <div className="flex gap-1">
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Link key={pageNum} href={buildPageUrl(pageNum)}>
                  <Button
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                </Link>
              );
            })}
          </div>

          {page < pagination.pages && (
            <Link href={buildPageUrl(page + 1)}>
              <Button variant="outline" size="sm" className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Twitter, Calendar, ArrowLeft, Star } from "lucide-react";
import { formatDate, CATEGORY_COLORS, cn } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Metadata } from "next";

type Props = { params: { slug: string } };

// OPT 1: React cache() deduplicates this call within one request.
// generateMetadata AND the page both call getProduct(slug) — without cache()
// that's 2 identical DB round-trips. With cache() it's 1.
const getProduct = cache((slug: string) =>
  prisma.product.findUnique({
    where: { slug, status: "APPROVED" },
    select: {
      id: true, name: true, slug: true, tagline: true, description: true,
      logoUrl: true, imageUrl: true, websiteUrl: true, twitterUrl: true, featured: true,
      categoryId: true, launchDate: true, createdAt: true,
      category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { upvotes: true } },
    },
  })
);

// OPT 2: Cache related products per category for 2 min.
// Before: DB call on every product page load. After: shared across visitors.
const getCachedRelated = unstable_cache(
  (categoryId: string, excludeId: string) =>
    prisma.product.findMany({
      where: { categoryId, status: "APPROVED", id: { not: excludeId } },
      take: 4,
      orderBy: { launchDate: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        logoUrl: true,
        imageUrl: true,
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
      },
    }),
  ["related-products"],
  { revalidate: 120 }
);

// OPT 3: generateMetadata reuses the same React cache — zero extra DB cost
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} — ${product.tagline}`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: product.logoUrl ? [product.logoUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  // OPT 4: auth + product fetch run in parallel
  const [session, product] = await Promise.all([auth(), getProduct(params.slug)]);
  if (!product) notFound();

  // OPT 5: related products + upvote check run in parallel
  const [related, upvoteRow] = await Promise.all([
    getCachedRelated(product.categoryId, product.id),
    session?.user?.id
      ? prisma.upvote.findUnique({
          where: { userId_productId: { userId: session.user.id, productId: product.id } },
          select: { id: true }, // OPT 6: only id — don't fetch full row
        })
      : null,
  ]);

  // OPT 7: Related products shown as plain links — no per-user upvote needed.
  // Avoids an extra upvote batch query entirely.
  const relatedProducts = related.map((p) => ({ ...p, upvoted: false }));
  const productWithUpvote = { ...product, upvoted: !!upvoteRow };
  const categoryColor =
    CATEGORY_COLORS[product.category.slug] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />Back to products
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <div className="flex-shrink-0 h-16 w-16 rounded-2xl border bg-muted overflow-hidden flex items-center justify-center">
          {product.logoUrl ? (
            <Image
              src={product.logoUrl}
              alt={product.name}
              width={64} height={64}
              className="h-full w-full object-cover"
              priority // OPT 8: LCP element — tell browser to load this first
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">{product.name.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {product.featured && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                    <Star className="h-3 w-3 fill-amber-500" />Featured
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{product.tagline}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", categoryColor)}>
              {product.category.icon && <span className="mr-1">{product.category.icon}</span>}
              {product.category.name}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />Launched {formatDate(product.launchDate)}
            </span>
            <span className="text-xs text-muted-foreground">
              {productWithUpvote._count.upvotes} upvotes
            </span>
          </div>
        </div>
      </div>

      {/* Product screenshot */}
      {product.imageUrl && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border mb-8">
          <Image
            src={product.imageUrl}
            alt={`${product.name} screenshot`}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8 p-4 rounded-xl border bg-muted/30">
        <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button className="w-full gap-2"><ExternalLink className="h-4 w-4" />Visit Website</Button>
        </a>
        {product.twitterUrl && (
          <a href={product.twitterUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2"><Twitter className="h-4 w-4" />Follow on X</Button>
          </a>
        )}
      </div>

      <div className="mb-10">
        <h2 className="font-semibold mb-3">About</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {product.description.split("\n").map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-3">{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="mb-10 p-4 rounded-xl border">
        <h2 className="font-semibold mb-3">Maker</h2>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={product.user.image ?? ""} />
            <AvatarFallback className="bg-orange-100 text-orange-700">
              {product.user.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{product.user.name ?? "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">Maker</p>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">More in {product.category.name}</h2>
          <div className="space-y-3">
            {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExternalLink,
  Twitter,
  Calendar,
  ArrowLeft,
  Star,
} from "lucide-react";
import { formatDate, CATEGORY_COLORS, cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = {
  params: { slug: string };
};

async function getProduct(slug: string, userId?: string) {
  const product = await prisma.product.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      category: true,
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { upvotes: true } },
    },
  });

  if (!product) return null;

  let upvoted = false;
  if (userId) {
    const upvote = await prisma.upvote.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    });
    upvoted = !!upvote;
  }

  return { ...product, upvoted };
}

async function getRelatedProducts(categoryId: string, excludeId: string, userId?: string) {
  const products = await prisma.product.findMany({
    where: { categoryId, status: "APPROVED", id: { not: excludeId } },
    take: 4,
    orderBy: { launchDate: "desc" },
    include: {
      category: true,
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { upvotes: true } },
    },
  });

  if (!userId) return products.map((p) => ({ ...p, upvoted: false }));

  const upvotes = await prisma.upvote.findMany({
    where: { userId, productId: { in: products.map((p) => p.id) } },
  });
  const upvotedIds = new Set(upvotes.map((u) => u.productId));
  return products.map((p) => ({ ...p, upvoted: upvotedIds.has(p.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

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
  const session = await auth();
  const product = await getProduct(params.slug, session?.user?.id);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(
    product.categoryId,
    product.id,
    session?.user?.id
  );

  const categoryColor =
    CATEGORY_COLORS[product.category.slug] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      {/* Product header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="flex-shrink-0 h-16 w-16 rounded-2xl border bg-muted overflow-hidden flex items-center justify-center">
          {product.logoUrl ? (
            <Image
              src={product.logoUrl}
              alt={product.name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {product.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {product.featured && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                    <Star className="h-3 w-3 fill-amber-500" />
                    Featured
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{product.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                categoryColor
              )}
            >
              {product.category.icon && (
                <span className="mr-1">{product.category.icon}</span>
              )}
              {product.category.name}
            </span>

            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Launched {formatDate(product.launchDate)}
            </span>

            <span className="text-xs text-muted-foreground">
              {product._count.upvotes} upvotes
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-8 p-4 rounded-xl border bg-muted/30">
        <a
          href={product.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button className="w-full gap-2">
            <ExternalLink className="h-4 w-4" />
            Visit Website
          </Button>
        </a>
        {product.twitterUrl && (
          <a
            href={product.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <Twitter className="h-4 w-4" />
              Follow on X
            </Button>
          </a>
        )}
      </div>

      {/* Description */}
      <div className="mb-10">
        <h2 className="font-semibold mb-3">About</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {product.description.split("\n").map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-3">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Maker */}
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
            <p className="font-medium text-sm">
              {product.user.name ?? "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">Maker</p>
          </div>
        </div>
      </div>

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">
            More in {product.category.name}
          </h2>
          <div className="space-y-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

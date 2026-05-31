import Link from "next/link";
import { ArrowRight, Zap, Star, TrendingUp, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { NewsletterSection } from "@/components/products/newsletter-section";
import { HeroSection } from "@/components/landing/hero-section";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LaunchDir — Discover the best new startups",
};

async function getFeaturedProducts(userId?: string) {
  const products = await prisma.product.findMany({
    where: { status: "APPROVED", featured: true },
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

async function getLatestProducts(userId?: string) {
  const products = await prisma.product.findMany({
    where: { status: "APPROVED" },
    take: 8,
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

async function getStats() {
  const [productCount, userCount] = await Promise.all([
    prisma.product.count({ where: { status: "APPROVED" } }),
    prisma.user.count(),
  ]);
  return { productCount, userCount };
}

async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: { where: { status: "APPROVED" } } } } },
    orderBy: { name: "asc" },
  });
}

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [featuredProducts, latestProducts, stats, categories] = await Promise.all([
    getFeaturedProducts(userId),
    getLatestProducts(userId),
    getStats(),
    getCategories(),
  ]);

  return (
    <div>
      {/* Animated hero */}
      <HeroSection
        productCount={stats.productCount}
        userCount={stats.userCount}
        isLoggedIn={!!session}
      />

      {/* Stats bar */}
      <section className="border-y bg-muted/30">
        <div className="container py-6">
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
            <div>
              <div className="text-2xl font-bold">{stats.productCount}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.userCount}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Makers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-xs text-muted-foreground mt-0.5">Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group p-4 rounded-xl border bg-card hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-sm hover:-translate-y-0.5 transition-all text-center"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">{cat.icon}</div>
              <div className="font-medium text-sm group-hover:text-orange-500 transition-colors">{cat.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{cat._count.products} products</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <h2 className="text-xl font-bold">Featured Products</h2>
            </div>
            <Link href="/products?sort=featured" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} rank={i + 1} showRank />
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold">Latest Launches</h2>
          </div>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {latestProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} rank={i + 1} showRank />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/products">
            <Button variant="outline" className="gap-2 hover:-translate-y-0.5 transition-all">
              View all products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-12">
        <div className="relative rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-8 md:p-12 text-white text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/5 translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to launch your product?</h2>
            <p className="text-orange-100 mb-8 max-w-md mx-auto">
              Join thousands of makers who have launched their products on LaunchDir.
              Get discovered by your first users today.
            </p>
            <Link href={session ? "/submit" : "/register"}>
              <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50 gap-2 shadow-xl hover:-translate-y-0.5 transition-all">
                <Rocket className="h-4 w-4" />
                {session ? "Submit Your Product" : "Get Started Free"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <NewsletterSection />
    </div>
  );
}
import Link from "next/link";
import { ArrowRight, Zap, Star, TrendingUp, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { NewsletterSection } from "@/components/products/newsletter-section";
import { HeroSection } from "@/components/landing/hero-section";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { StatsBar } from "@/components/landing/stats-bar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LaunchDir — Discover the best new startups",
};

// ─── Cached helpers ──────────────────────────────────────────────────────────

// OPT 1: Cache categories + stats for 5 min. These change rarely and are
// fetched on every page load. Before: 2 DB calls per request. After: 0 after
// first warm — served from Next.js data cache.
const getCachedMeta = unstable_cache(
  async () => {
    const [categories, productCount, userCount] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true, name: true, slug: true, icon: true,
          _count: { select: { products: { where: { status: "APPROVED" } } } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where: { status: "APPROVED" } }),
      prisma.user.count(),
    ]);
    return { categories, productCount, userCount };
  },
  ["home-meta"],
  { revalidate: 300 } // 5 min
);

// OPT 2: Use React cache() so auth() resolves once and is shared across
// this request (generateMetadata + page both call auth in some setups).
const getSession = cache(() => auth());

// OPT 3: Fetch featured + latest products in a single parallel Promise.all,
// then do ONE combined upvote lookup instead of two separate ones.
// Before: up to 5 DB calls (featured, featured-upvotes, latest, latest-upvotes, stats+cats)
// After: 3 DB calls (featured+latest parallel, 1 upvote lookup, meta cached)
async function getHomeProducts(userId?: string) {
  const productSelect = {
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

  const [featured, latest] = await Promise.all([
    prisma.product.findMany({
      where: { status: "APPROVED", featured: true },
      take: 4,
      orderBy: { launchDate: "desc" },
      select: productSelect,
    }),
    prisma.product.findMany({
      where: { status: "APPROVED" },
      take: 8,
      orderBy: { launchDate: "desc" },
      select: productSelect,
    }),
  ]);

  if (!userId) {
    return {
      featured: featured.map((p) => ({ ...p, upvoted: false })),
      latest: latest.map((p) => ({ ...p, upvoted: false })),
    };
  }

  // OPT 4: Deduplicate ids across both lists, one upvote query covers both.
  const allIds = [...new Set([...featured.map((p) => p.id), ...latest.map((p) => p.id)])];
  const upvotes = await prisma.upvote.findMany({
    where: { userId, productId: { in: allIds } },
    select: { productId: true }, // OPT 5: select only the field we need
  });
  const upvotedIds = new Set(upvotes.map((u) => u.productId));

  return {
    featured: featured.map((p) => ({ ...p, upvoted: upvotedIds.has(p.id) })),
    latest: latest.map((p) => ({ ...p, upvoted: upvotedIds.has(p.id) })),
  };
}

export default async function HomePage() {
  // OPT 6: auth + meta run fully in parallel — neither depends on the other
  const [session, meta] = await Promise.all([getSession(), getCachedMeta()]);
  const { featured, latest } = await getHomeProducts(session?.user?.id);

  return (
    <div>
      <HeroSection
        productCount={meta.productCount}
        userCount={meta.userCount}
        isLoggedIn={!!session}
      />

      {/* Stats bar */}
      <section className="border-y bg-muted/30">
        <div className="container py-6">
          <StatsBar
            productCount={meta.productCount}
            userCount={meta.userCount}
            categoryCount={meta.categories.length}
          />
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="text-xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {meta.categories.map((cat) => (
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

      {featured.length > 0 && (
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
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} rank={i + 1} showRank />
            ))}
          </div>
        </section>
      )}

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
          {latest.map((product, i) => (
            <ProductCard key={product.id} product={product} rank={i + 1} showRank />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/products">
            <Button variant="outline" className="gap-2 hover:-translate-y-0.5 transition-all">
              View all products <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="container py-12">
        <div className="relative rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-8 md:p-12 text-white text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/5 translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to launch your product?</h2>
            <p className="text-orange-100 mb-8 max-w-md mx-auto">
              Join thousands of makers who have launched their products on LaunchDir. Get discovered by your first users today.
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
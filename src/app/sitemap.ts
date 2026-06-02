import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// OPT: Remove force-dynamic. The sitemap doesn't need a fresh DB call on every
// Google/Bing crawl request. Revalidate every 12 hours instead.
export const revalidate = 43200;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://launchdir.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // OPT: select only the two fields we need — no extra columns transferred
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "APPROVED" },
      select: { slug: true, updatedAt: true }, // already minimal — kept as-is
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: now, changeFrequency: "daily",   priority: 1   },
    { url: `${BASE_URL}/products`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/submit`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/products?category=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
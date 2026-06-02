import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import slugify from "slugify";

const submitSchema = z.object({
  name: z.string().min(2).max(60),
  tagline: z.string().min(10).max(120),
  description: z.string().min(50).max(2000),
  websiteUrl: z.string().url(),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  // OPT: Guard NaN from parseInt
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  // OPT: Cap limit to prevent abuse — before limit was unbounded
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  const where: any = { status: "APPROVED" };
  if (q) {
    // OPT: Removed description from search — @db.Text field, no trigram index,
    // causes sequential full-table scan on large datasets. name+tagline are short.
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = { slug: category };
  if (sort === "featured") where.featured = true;

  const orderBy: any =
    sort === "popular" ? { upvotes: { _count: "desc" } }
    : sort === "oldest" ? { launchDate: "asc" }
    : { launchDate: "desc" };

  // OPT: select instead of include — skips description, twitterUrl in list response
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, orderBy, skip, take: limit,
      select: {
        id: true, name: true, slug: true, tagline: true,
        logoUrl: true, websiteUrl: true, featured: true, launchDate: true,
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { upvotes: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json(
    { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    {
      headers: {
        // OPT: Let CDN/browser cache public GET responses for 30s;
        // stale-while-revalidate serves cached while refreshing in background
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = submitSchema.parse(body);
    const slug = slugify(data.name, { lower: true, strict: true });

    // OPT: Before — findUnique + create = 2 round-trips + a race condition
    // (two concurrent submits of the same name both pass findUnique).
    // After — attempt create directly; catch P2002 unique violation and retry once.
    // Best case: 1 round-trip. Collision case: 2 round-trips (same as before, no race).
    try {
      const product = await prisma.product.create({
        data: {
          name: data.name, slug, tagline: data.tagline,
          description: data.description, websiteUrl: data.websiteUrl,
          twitterUrl: data.twitterUrl || null,
          categoryId: data.categoryId, logoUrl: data.logoUrl || null,
          imageUrl: data.imageUrl || null,
          userId: session.user.id, status: "PENDING",
        },
        select: { id: true, slug: true, name: true, status: true },
      });
      return NextResponse.json({ product }, { status: 201 });
    } catch (e: any) {
      if (e?.code !== "P2002") throw e;
      // Slug collision — retry with timestamp suffix
      const product = await prisma.product.create({
        data: {
          name: data.name, slug: `${slug}-${Date.now()}`,
          tagline: data.tagline, description: data.description,
          websiteUrl: data.websiteUrl, twitterUrl: data.twitterUrl || null,
          categoryId: data.categoryId, logoUrl: data.logoUrl || null,
          imageUrl: data.imageUrl || null,
          userId: session.user.id, status: "PENDING",
        },
        select: { id: true, slug: true, name: true, status: true },
      });
      return NextResponse.json({ product }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Submit product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
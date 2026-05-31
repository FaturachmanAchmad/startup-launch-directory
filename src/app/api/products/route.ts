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
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where: any = {
    status: "APPROVED",
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
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

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = submitSchema.parse(body);

    let slug = slugify(data.name, { lower: true, strict: true });

    // Ensure unique slug
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        tagline: data.tagline,
        description: data.description,
        websiteUrl: data.websiteUrl,
        twitterUrl: data.twitterUrl || null,
        categoryId: data.categoryId,
        logoUrl: data.logoUrl || null,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Submit product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

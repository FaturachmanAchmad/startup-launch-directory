import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = params;
  const userId = session.user.id;

  try {
    // OPT: Before — 3 sequential DB round-trips:
    //   1. findUnique (check existing)
    //   2. delete OR create
    //   3. count
    //
    // After — 2 round-trips using a transaction:
    //   1. findUnique (select only id — minimal payload)
    //   2. [$transaction] delete/create + count atomically
    //
    // The transaction also ensures the count is consistent with the mutation.

    const existing = await prisma.upvote.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true }, // OPT: only fetch id, not the full row
    });

    const [, upvoteCount] = await prisma.$transaction([
      existing
        ? prisma.upvote.delete({ where: { id: existing.id } })
        : prisma.upvote.create({ data: { userId, productId } }),
      prisma.upvote.count({ where: { productId } }),
    ]);

    return NextResponse.json(
      { upvoted: !existing, upvoteCount },
      { headers: { "Cache-Control": "no-store" } } // OPT: prevent CDN caching mutations
    );
  } catch (error) {
    console.error("Upvote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
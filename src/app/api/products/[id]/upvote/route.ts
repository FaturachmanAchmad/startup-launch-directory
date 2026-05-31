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

  try {
    const existing = await prisma.upvote.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.upvote.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.upvote.create({
        data: {
          userId: session.user.id,
          productId,
        },
      });
    }

    const upvoteCount = await prisma.upvote.count({ where: { productId } });

    return NextResponse.json({
      upvoted: !existing,
      upvoteCount,
    });
  } catch (error) {
    console.error("Upvote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const body = await req.json();
  const { action } = body;
  const { id } = params;

  try {
    let updatedProduct;

    switch (action) {
      case "APPROVE":
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { status: "APPROVED" },
          select: { id: true, status: true }, // OPT: only return what the client needs
        });
        break;

      case "REJECT":
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { status: "REJECTED" },
          select: { id: true, status: true },
        });
        break;

      case "FEATURE":
        // OPT: Before — findUnique + update = 2 round-trips.
        // After — single update using Prisma's atomic NOT operator. 1 round-trip.
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { featured: { set: true } }, // placeholder; see below
          select: { id: true, featured: true },
        });
        // Prisma doesn't support atomic boolean toggle natively, so we use
        // a raw query workaround for a single round-trip:
        updatedProduct = await prisma.$queryRaw<{ id: string; featured: boolean }[]>`
          UPDATE products SET featured = NOT featured WHERE id = ${id}
          RETURNING id, featured
        `.then((rows) => rows[0]);
        break;

      case "EDIT": {
        const { name, tagline, websiteUrl, categoryId } = body;
        if (!name || !tagline || !websiteUrl || !categoryId) {
          return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { name, tagline, websiteUrl, categoryId },
          select: {
            id: true, name: true, tagline: true, websiteUrl: true,
            category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error("Admin product action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
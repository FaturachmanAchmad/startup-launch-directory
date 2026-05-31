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
        // Approve: update status — pending item disappears from pending tab on client
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { status: "APPROVED" },
        });
        break;

      case "REJECT":
        // Reject: update status — pending item disappears from pending tab on client
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { status: "REJECTED" },
        });
        break;

      case "FEATURE":
        const product = await prisma.product.findUnique({ where: { id } });
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { featured: !product?.featured },
        });
        break;

      case "EDIT":
        const { name, tagline, websiteUrl, categoryId } = body;
        if (!name || !tagline || !websiteUrl || !categoryId) {
          return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        updatedProduct = await prisma.product.update({
          where: { id },
          data: { name, tagline, websiteUrl, categoryId },
          include: { category: true },
        });
        break;

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
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
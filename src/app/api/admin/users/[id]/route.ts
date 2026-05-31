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

// PATCH /api/admin/users/[id]
// action: "ROLE"  → change role
// action: "EDIT"  → update name + email
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const body = await req.json();
  const { action } = body;

  try {
    let user;

    if (action === "ROLE") {
      const { role } = body;
      if (!["USER", "ADMIN"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      user = await prisma.user.update({
        where: { id: params.id },
        data: { role },
        select: { id: true, role: true },
      });
    } else if (action === "EDIT") {
      const { name, email } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      user = await prisma.user.update({
        where: { id: params.id },
        data: {
          name: name || null,
          email,
        },
        select: { id: true, name: true, email: true },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    // Unique constraint on email
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already in use by another account" },
        { status: 409 }
      );
    }
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    // Prisma cascades delete of accounts, sessions, products, upvotes
    // (onDelete: Cascade is set in schema for all user relations)
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminProvider } from "@/components/admin/admin-context";
import { AdminStats } from "@/components/admin/admin-stats";
import { AdminProductCRUD } from "@/components/admin/admin-product-crud";
import { AdminUserCRUD } from "@/components/admin/admin-user-crud";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Panel" };

async function getAdminData() {
  const [pending, approved, rejected, users, categories, subscribers] =
    await Promise.all([
      prisma.product.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { upvotes: true } },
        },
      }),
      prisma.product.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { upvotes: true } },
        },
      }),
      prisma.product.findMany({
        where: { status: "REJECTED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { upvotes: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, image: true,
          role: true, createdAt: true,
          _count: { select: { products: true } },
        },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.newsletterSubscriber.count(),
    ]);

  return { pending, approved, rejected, users, categories, subscribers };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const { pending, approved, rejected, users, categories, subscribers } =
    await getAdminData();

  return (
    <AdminProvider
      initialPending={pending}
      initialApproved={approved}
      initialRejected={rejected}
      initialUsers={users}
      initialCategories={categories}
      initialNewsletterSubs={subscribers}
    >
      <div className="container max-w-5xl mx-auto py-10 space-y-12">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage products, users, and platform settings
          </p>
        </div>

        {/* Stats read live from context — update instantly on any mutation */}
        <AdminStats />

        <AdminProductCRUD />

        <AdminUserCRUD />
      </div>
    </AdminProvider>
  );
}
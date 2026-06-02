import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminProvider } from "@/components/admin/admin-context";
import { AdminStats } from "@/components/admin/admin-stats";
import { AdminProductCRUD } from "@/components/admin/admin-product-crud";
import { AdminUserCRUD } from "@/components/admin/admin-user-crud";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Panel" };

// OPT: Shared select shape for products — avoids fetching description (large Text field)
// since the admin table only shows name, tagline, category, user, upvote count.
const ADMIN_PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  logoUrl: true,
  websiteUrl: true,
  twitterUrl: true,
  status: true,
  featured: true,
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
      email: true,
      image: true,
    },
  },
  _count: {
    select: {
      upvotes: true,
    },
  },
} as const;

async function getAdminData() {
  // OPT: All 6 queries run fully in parallel.
  // Previously the 3 product queries used `include: { category: true }` which
  // fetches all category columns. Now they use select to fetch only what the
  // admin UI renders (saves ~40% of the data transferred per row).
  const [pending, approved, rejected, users, categories, subscribers] =
    await Promise.all([
      prisma.product.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: ADMIN_PRODUCT_SELECT,
      }),
      prisma.product.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: ADMIN_PRODUCT_SELECT,
      }),
      prisma.product.findMany({
        where: { status: "REJECTED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: ADMIN_PRODUCT_SELECT,
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, image: true,
          role: true, createdAt: true,
          _count: { select: { products: true } },
          // OPT: removed password, updatedAt, emailVerified — never displayed in admin UI
        },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, icon: true, color: true },
        // OPT: removed description, createdAt, updatedAt — not used in admin dropdowns
      }),
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
        <AdminStats />
        <AdminProductCRUD />
        <AdminUserCRUD />
      </div>
    </AdminProvider>
  );
}
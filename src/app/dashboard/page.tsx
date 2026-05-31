import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Rocket,
  LayoutDashboard,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getUserProducts(userId: string) {
  return prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      _count: { select: { upvotes: true } },
    },
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <Clock className="h-3.5 w-3.5" />
      Pending review
    </span>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const products = await getUserProducts(session.user.id);

  const stats = {
    total: products.length,
    approved: products.filter((p) => p.status === "APPROVED").length,
    pending: products.filter((p) => p.status === "PENDING").length,
    totalUpvotes: products.reduce((sum, p) => sum + p._count.upvotes, 0),
  };

  return (
    <div className="container max-w-3xl mx-auto py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={session.user.image ?? ""} />
            <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{session.user.name}</h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
        <Link href="/submit">
          <Button size="sm" className="gap-1.5 flex-shrink-0">
            <Plus className="h-3.5 w-3.5" />
            New Product
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Products", value: stats.total },
          { label: "Approved", value: stats.approved },
          { label: "Pending", value: stats.pending },
          { label: "Upvotes", value: stats.totalUpvotes },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Your Products</h2>
        </div>

        {products.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed">
            <Rocket className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Submit your first product and start getting discovered
            </p>
            <Link href="/submit">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Submit a product
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-start gap-4 p-4 rounded-xl border bg-card"
              >
                {/* Logo */}
                <div className="flex-shrink-0 h-12 w-12 rounded-xl border bg-muted overflow-hidden flex items-center justify-center">
                  {product.logoUrl ? (
                    <Image
                      src={product.logoUrl}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-muted-foreground">
                      {product.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{product.name}</span>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {product.tagline}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {product.category.icon} {product.category.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Submitted {formatDate(product.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ChevronUp className="h-3 w-3" />
                      {product._count.upvotes} upvotes
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {product.status === "APPROVED" && (
                    <Link href={`/products/${product.slug}`}>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

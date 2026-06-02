import { Product, Category, User, ProductStatus, Role } from "@prisma/client";

export type ProductWithDetails = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string;
  twitterUrl: string | null;
  featured: boolean;
  launchDate: Date; // <-- tambahkan

  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  };

  user: {
    id: string;
    name: string | null;
    image: string | null;
  };

  _count: {
    upvotes: number;
  };

  upvoted?: boolean;
};

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  _count: {
    products: number;
  };
};

export type SubmitProductInput = {
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  twitterUrl?: string;
  categoryId: string;
  logoUrl?: string;
};

export type AdminProductAction = "APPROVE" | "REJECT" | "FEATURE" | "DELETE";

export { ProductStatus, Role };

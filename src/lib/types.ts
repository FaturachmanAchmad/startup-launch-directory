import { Product, Category, User, ProductStatus, Role } from "@prisma/client";

export type ProductWithDetails = Product & {
  category: Category;
  user: Pick<User, "id" | "name" | "image">;
  _count: {
    upvotes: number;
  };
  upvoted?: boolean;
};

export type ProductCardProps = {
  product: ProductWithDetails;
  rank?: number;
};

export type CategoryWithCount = Category & {
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

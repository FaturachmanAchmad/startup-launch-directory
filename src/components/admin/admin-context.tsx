"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Category = { id: string; name: string; icon: string | null };

type Product = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string;
  twitterUrl: string | null;
  status: string;
  featured: boolean;
  createdAt: Date;
  category: Category;
  user: { id: string; name: string | null; email: string; image: string | null };
  _count: { upvotes: number };
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date;
  _count: { products: number };
};

type Lists = { pending: Product[]; approved: Product[]; rejected: Product[] };

type AdminContextType = {
  lists: Lists;
  users: AdminUser[];
  categories: Category[];
  newsletterSubs: number;

  // Stats derived live from state
  stats: {
    totalProducts: number;
    pendingReview: number;
    totalUsers: number;
    newsletterSubs: number;
  };

  // Product mutations
  removeProduct: (id: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;

  // User mutations
  removeUser: (id: string) => void;
  updateUser: (id: string, patch: Partial<AdminUser>) => void;
};

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}

type ProviderProps = {
  children: ReactNode;
  initialPending: Product[];
  initialApproved: Product[];
  initialRejected: Product[];
  initialUsers: AdminUser[];
  initialCategories: Category[];
  initialNewsletterSubs: number;
};

export function AdminProvider({
  children,
  initialPending,
  initialApproved,
  initialRejected,
  initialUsers,
  initialCategories,
  initialNewsletterSubs,
}: ProviderProps) {
  const [lists, setLists] = useState<Lists>({
    pending: initialPending,
    approved: initialApproved,
    rejected: initialRejected,
  });
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);

  const removeProduct = useCallback((id: string) => {
    setLists((prev) => ({
      pending: prev.pending.filter((p) => p.id !== id),
      approved: prev.approved.filter((p) => p.id !== id),
      rejected: prev.rejected.filter((p) => p.id !== id),
    }));
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setLists((prev) => {
      const update = (arr: Product[]) =>
        arr.map((p) => (p.id === id ? { ...p, ...patch } : p));

      // If status changed, move the product to the right list
      if (patch.status) {
        const allProducts = [...prev.pending, ...prev.approved, ...prev.rejected];
        const product = allProducts.find((p) => p.id === id);
        if (!product) return prev;
        const updated = { ...product, ...patch };
        return {
          pending: patch.status === "PENDING"
            ? [...prev.pending.filter((p) => p.id !== id), updated]
            : prev.pending.filter((p) => p.id !== id),
          approved: patch.status === "APPROVED"
            ? [...prev.approved.filter((p) => p.id !== id), updated]
            : prev.approved.filter((p) => p.id !== id),
          rejected: patch.status === "REJECTED"
            ? [...prev.rejected.filter((p) => p.id !== id), updated]
            : prev.rejected.filter((p) => p.id !== id),
        };
      }

      return {
        pending: update(prev.pending),
        approved: update(prev.approved),
        rejected: update(prev.rejected),
      };
    });
  }, []);

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<AdminUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }, []);

  // Stats derived entirely from live state — always in sync
  const stats = {
    totalProducts: lists.approved.length,
    pendingReview: lists.pending.length,
    totalUsers: users.length,
    newsletterSubs: initialNewsletterSubs,
  };

  return (
    <AdminContext.Provider
      value={{
        lists,
        users,
        categories: initialCategories,
        newsletterSubs: initialNewsletterSubs,
        stats,
        removeProduct,
        updateProduct,
        removeUser,
        updateUser,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rocket, Lock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    websiteUrl: "",
    twitterUrl: "",
    categoryId: "",
    logoUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 2)
      newErrors.name = "Name must be at least 2 characters";
    if (!form.tagline || form.tagline.length < 10)
      newErrors.tagline = "Tagline must be at least 10 characters";
    if (!form.description || form.description.length < 50)
      newErrors.description = "Description must be at least 50 characters";
    if (!form.websiteUrl)
      newErrors.websiteUrl = "Website URL is required";
    else {
      try {
        new URL(form.websiteUrl);
      } catch {
        newErrors.websiteUrl = "Enter a valid URL (including https://)";
      }
    }
    if (!form.categoryId) newErrors.categoryId = "Please select a category";
    if (form.twitterUrl) {
      try {
        new URL(form.twitterUrl);
      } catch {
        newErrors.twitterUrl = "Enter a valid URL";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      toast.success(
        "🚀 Product submitted! It'll be reviewed within 24 hours."
      );
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="container max-w-2xl mx-auto py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container max-w-2xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 mb-4">
          <Lock className="h-8 w-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to submit a product.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Rocket className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Submit your product</h1>
            <p className="text-sm text-muted-foreground">
              Share what you've built with the world
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Products are reviewed by our team before going live. This usually
            takes less than 24 hours.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Product Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g. LaunchDir"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={60}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <Label htmlFor="tagline">
            Tagline <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tagline"
            placeholder="A short, punchy description of what you built"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.tagline.length}/120
          </p>
          {errors.tagline && (
            <p className="text-xs text-destructive">{errors.tagline}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Tell the world what your product does, what problem it solves, and who it's for. Be specific!"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={6}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {form.description.length}/2000 (min 50)
          </p>
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.categoryId}
            onValueChange={(v) => setForm({ ...form, categoryId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-xs text-destructive">{errors.categoryId}</p>
          )}
        </div>

        {/* Website URL */}
        <div className="space-y-1.5">
          <Label htmlFor="websiteUrl">
            Website URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="websiteUrl"
            type="url"
            placeholder="https://yourproduct.com"
            value={form.websiteUrl}
            onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
          />
          {errors.websiteUrl && (
            <p className="text-xs text-destructive">{errors.websiteUrl}</p>
          )}
        </div>

        {/* Logo URL */}
        <div className="space-y-1.5">
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input
            id="logoUrl"
            type="url"
            placeholder="https://yourproduct.com/logo.png"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Direct link to your product logo (PNG/JPG, square recommended)
          </p>
        </div>

        {/* Twitter/X */}
        <div className="space-y-1.5">
          <Label htmlFor="twitterUrl">Twitter/X URL (optional)</Label>
          <Input
            id="twitterUrl"
            type="url"
            placeholder="https://twitter.com/yourhandle"
            value={form.twitterUrl}
            onChange={(e) => setForm({ ...form, twitterUrl: e.target.value })}
          />
          {errors.twitterUrl && (
            <p className="text-xs text-destructive">{errors.twitterUrl}</p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Submit Product
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            By submitting, you agree to our{" "}
            <Link href="#" className="underline">
              terms of service
            </Link>
            .
          </p>
        </div>
      </form>
    </div>
  );
}

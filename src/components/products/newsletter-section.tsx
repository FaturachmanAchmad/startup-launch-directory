"use client";

import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      toast.success("🎉 You're subscribed! Welcome aboard.");
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 mb-4">
          <Mail className="h-6 w-6 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Stay in the loop
        </h2>
        <p className="text-muted-foreground mb-6">
          Get weekly digests of the best new products, curated for indie makers
          and startup founders.
        </p>
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="gap-1.5">
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Subscribing...
              </>
            ) : (
              <>
                Subscribe
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          No spam. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-orange-100 dark:bg-orange-900/30 mb-6">
          <Rocket className="h-10 w-10 text-orange-500" />
        </div>
        <h1 className="text-6xl font-bold mb-3">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button>Go home</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline">Browse products</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

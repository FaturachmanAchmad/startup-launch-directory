import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="flex items-start gap-5 mb-8">
        <Skeleton className="h-16 w-16 rounded-2xl flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-80 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full mb-8 rounded-xl" />
      <Skeleton className="h-5 w-20 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

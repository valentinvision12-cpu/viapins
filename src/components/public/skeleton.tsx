import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100", className)}
      style={{ animation: "skeleton-shimmer 1.5s ease-in-out infinite" }}
    />
  );
}

export function DestinationCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 bg-white shadow-sm">
      <Skeleton className="h-52 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0">
        <Skeleton className="sm:w-52 h-44 sm:h-36 rounded-none flex-shrink-0" />
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-3 w-1/4" />
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CountryCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 bg-white shadow-sm">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
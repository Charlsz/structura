import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header skeleton */}
      <div className="border-b border-zinc-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Skeleton className="h-8 w-32 bg-zinc-100" />
          <Skeleton className="h-10 w-96 bg-zinc-100" />
          <Skeleton className="h-10 w-24 bg-zinc-100" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex">
        {/* Sidebar skeleton */}
        <div className="w-60 border-r border-zinc-200 p-4 space-y-4">
          <Skeleton className="h-6 w-40 bg-zinc-100" />
          <Skeleton className="h-4 w-full bg-zinc-100" />
          <Skeleton className="h-4 w-3/4 bg-zinc-100" />
          <div className="space-y-2 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-zinc-100" />
            ))}
          </div>
        </div>

        {/* Graph skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-3 text-center">
            <Skeleton className="h-48 w-48 rounded-full mx-auto bg-zinc-100" />
            <Skeleton className="h-4 w-32 mx-auto bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="bg-[var(--surface-container-low)] rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-[var(--surface-container)]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[var(--surface-container)] rounded w-3/4" />
        <div className="h-3 bg-[var(--surface-container)] rounded w-1/2" />
        <div className="flex items-center justify-between mt-4">
          <div className="w-6 h-6 bg-[var(--surface-container)] rounded-full" />
          <div className="w-8 h-8 bg-[var(--surface-container)] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

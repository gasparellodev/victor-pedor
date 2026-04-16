import { VideoGridSkeleton } from "@/components/dashboard/VideoCardSkeleton";

export default function DashboardLoading() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-[var(--surface-container)] rounded w-56" />
          <div className="h-4 bg-[var(--surface-container)] rounded w-80" />
        </div>
        <div className="h-10 bg-[var(--surface-container)] rounded-lg w-64 animate-pulse" />
      </div>
      <VideoGridSkeleton count={4} />
    </>
  );
}

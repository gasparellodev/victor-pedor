import { listVideos } from "@/lib/db/videos";
import { VideoGrid } from "@/components/dashboard/VideoGrid";

export default async function DashboardPage() {
  const videos = await listVideos();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-[var(--on-surface)] mb-2">
            Video Projects
          </h1>
          <p className="text-[var(--on-surface-variant)]">
            Manage your transcriptions and cinematic edits.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--outline)] group-focus-within:text-[var(--primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="bg-[var(--surface-container-low)] border-none rounded-lg pl-10 pr-4 py-2 w-full md:w-64 text-sm focus:ring-1 focus:ring-[var(--primary)] focus:bg-[var(--surface-bright)] transition-all text-[var(--on-surface)] placeholder:text-[var(--outline)]"
              placeholder="Search projects..."
              type="text"
            />
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <VideoGrid videos={videos} />
    </>
  );
}

"use client";

import Link from "next/link";
import type { Video } from "@/lib/db/schema";
import { VideoCard } from "./VideoCard";

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[var(--outline)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--on-surface)] mb-2">
          No projects yet
        </h3>
        <p className="text-[var(--on-surface-variant)] mb-8 max-w-sm">
          Upload your first video to start generating AI-powered subtitles.
        </p>
        <Link
          href="/videos/new"
          className="brand-gradient text-[var(--on-primary-container)] px-6 py-3 rounded-lg font-bold active:scale-95 duration-150"
        >
          Start New Video
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}

      {/* New project CTA card */}
      <Link
        href="/videos/new"
        className="group bg-[var(--surface-container-lowest)] border-2 border-dashed border-[var(--outline-variant)]/30 rounded-xl overflow-hidden hover:border-[var(--primary)]/50 transition-all duration-300 flex flex-col items-center justify-center min-h-[280px]"
      >
        <div className="w-12 h-12 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--outline)] group-hover:bg-[var(--primary-container)] group-hover:text-[var(--on-primary-container)] transition-all duration-300 mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="font-[family-name:var(--font-manrope)] font-bold text-[var(--on-surface-variant)] group-hover:text-[var(--primary)] transition-colors">
          Start New Video
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-[var(--outline)] mt-1">
          Upload mp4, mov, or webm
        </p>
      </Link>
    </div>
  );
}

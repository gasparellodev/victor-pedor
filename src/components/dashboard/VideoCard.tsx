"use client";

import Link from "next/link";
import type { Video } from "@/lib/db/schema";

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

interface StatusBadgeProps {
  status: Video["status"];
}

function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "ready":
      return (
        <div className="absolute top-2 left-2 px-3 py-1 bg-green-500/90 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
          Ready
        </div>
      );
    case "uploading":
    case "transcribing":
    case "correcting":
      return (
        <div className="absolute inset-0 bg-[var(--surface-container-low)]/60 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-1 bg-[var(--surface-container-highest)] rounded-full overflow-hidden mb-3">
            <div className="h-full brand-gradient animate-pulse-glow" style={{ width: status === "uploading" ? "33%" : status === "transcribing" ? "66%" : "90%" }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
            {status === "uploading" ? "Uploading..." : status === "transcribing" ? "Transcribing..." : "Correcting..."}
          </span>
        </div>
      );
    case "error":
      return (
        <div className="absolute inset-0 bg-[var(--error)]/10 flex flex-col items-center justify-center p-6 text-center">
          <svg className="w-8 h-8 text-[var(--error)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--error)]">
            Upload Failed
          </span>
        </div>
      );
  }
}

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const duration = formatDuration(video.durationMs);
  const timeAgo = formatRelativeTime(video.createdAt);

  return (
    <Link href={`/videos/${video.id}`}>
      <div className="group bg-[var(--surface-container-low)] rounded-xl overflow-hidden hover:ring-1 hover:ring-[var(--outline-variant)]/40 transition-all duration-300 cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-[var(--surface-container)]">
          {video.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={video.title}
              className="w-full h-full object-cover"
              src={video.thumbnailUrl}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--outline)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          )}
          <StatusBadge status={video.status} />
          {duration && video.status !== "error" && (
            <div className="absolute bottom-2 right-2 px-2 py-1 glass-panel rounded text-[10px] font-bold tracking-wider text-[var(--on-surface)]">
              {duration}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-[family-name:var(--font-manrope)] font-bold text-[var(--on-surface)] mb-1 group-hover:text-[var(--primary)] transition-colors truncate">
            {video.title}
          </h3>
          <p className="text-xs text-[var(--on-surface-variant)] uppercase tracking-widest">
            {timeAgo}
          </p>
          <div className="mt-4 flex items-center justify-between">
            {video.status === "error" ? (
              <span className="text-[10px] font-bold uppercase text-[var(--primary)] tracking-widest hover:underline">
                Retry Upload
              </span>
            ) : (
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border border-[var(--surface)] bg-slate-700" />
              </div>
            )}
            <button
              className="text-[var(--primary)] hover:bg-[var(--primary)]/10 p-2 rounded-lg transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

"use client";

import { useFFmpegExport } from "@/hooks/useFFmpegExport";
import type { Subtitle } from "@/types/subtitle";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";

interface ExportButtonProps {
  videoUrl: string;
  subtitles: Subtitle[];
  style: SubtitleStyle;
  videoTitle?: string;
}

export function ExportButton({ videoUrl, subtitles, style, videoTitle }: ExportButtonProps) {
  const { stage, progress, error, startExport, reset } = useFFmpegExport();

  const filename = videoTitle
    ? `${videoTitle.replace(/\.[^/.]+$/, "")}-subtitled.mp4`
    : "video-with-subtitles.mp4";

  const handleExport = async () => {
    await startExport({ videoUrl, subtitles, style, filename });
  };

  if (stage === "idle") {
    return (
      <button
        onClick={handleExport}
        className="px-4 py-2 text-sm font-medium rounded-lg brand-gradient text-[var(--on-primary-container)] active:scale-95 duration-150"
      >
        ↓ Export Video
      </button>
    );
  }

  if (stage === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--error)]">{error}</span>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:bg-[var(--surface-bright)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-green-500/15 text-green-400 ring-1 ring-green-400/30"
      >
        ✓ Exported
      </button>
    );
  }

  // loading or processing
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-container-high)]">
        <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--on-surface-variant)]">
          {stage === "loading" ? "Loading FFmpeg..." : `Processing ${progress}%`}
        </span>
      </div>
      {stage === "processing" && (
        <div className="w-24 h-1.5 bg-[var(--surface-container-highest)] rounded-full overflow-hidden">
          <div
            className="h-full brand-gradient rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

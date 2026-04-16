"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/preview/VideoPlayer";
import { SubtitleOverlay } from "@/components/preview/SubtitleOverlay";
import { SubtitleEditor } from "@/components/editor/SubtitleEditor";
import { StylePanel } from "@/components/editor/StylePanel";
import { useVideoSync } from "@/hooks/useVideoSync";
import { useSubtitleState } from "@/hooks/useSubtitleState";
import { useSubtitleStyle } from "@/hooks/useSubtitleStyle";
import { generateSrt } from "@/lib/srt/generator";
import type { Video } from "@/lib/db/schema";

type EditorTab = "text" | "style";

export default function VideoEditorPage() {
  const params = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTime = useVideoSync(videoRef);
  const [subtitles, dispatch] = useSubtitleState();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("text");

  // Fetch video data from DB
  useEffect(() => {
    async function fetchVideo() {
      try {
        const res = await fetch(`/api/videos/${params.id}`);
        if (!res.ok) {
          throw new Error("Video not found");
        }
        const data = await res.json();
        setVideo(data.video);

        if (data.video.subtitles) {
          dispatch({ type: "SET", subtitles: data.video.subtitles });
        }

        if (data.video.blobUrl) {
          setLocalVideoUrl(data.video.blobUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [params.id, dispatch]);

  const { style: subtitleStyle, updateStyle } = useSubtitleStyle({
    videoId: video?.id,
    initialStyle: video?.subtitleStyle,
  });

  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const handleDownloadSrt = useCallback(() => {
    const srtContent = generateSrt(subtitles);
    const blob = new Blob([srtContent], { type: "text/srt;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${video?.title?.replace(/\.[^/.]+$/, "") ?? "subtitles"}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [subtitles, video?.title]);

  // Save subtitles to DB on changes (debounced, skip initial load)
  const hasLoadedRef = useRef(false);
  const videoId = video?.id;
  useEffect(() => {
    if (!videoId || subtitles.length === 0) return;

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtitles }),
        });
        if (!res.ok) {
          console.error("Failed to auto-save subtitles:", res.status);
        }
      } catch (err) {
        console.error("Failed to auto-save subtitles:", err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [subtitles, videoId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg className="w-12 h-12 text-[var(--error)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="font-[family-name:var(--font-manrope)] font-bold text-lg mb-2">Video not found</h3>
        <p className="text-[var(--on-surface-variant)] mb-6">{error}</p>
        <Link href="/videos" className="text-[var(--primary)] hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/videos" className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
            ← Videos
          </Link>
          <span className="text-[var(--outline)]">/</span>
          <span className="text-[var(--on-surface)] font-medium truncate max-w-[200px]">{video.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {subtitles.length > 0 && (
            <button
              onClick={handleDownloadSrt}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:bg-[var(--surface-bright)] border border-[var(--outline-variant)]/20 transition-colors"
            >
              ↓ Download SRT
            </button>
          )}
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        {/* Left: Video Preview */}
        <div className="flex flex-col gap-4">
          {localVideoUrl && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <VideoPlayer src={localVideoUrl} videoRef={videoRef} />
              <SubtitleOverlay subtitles={subtitles} currentTime={currentTime} style={subtitleStyle} />
            </div>
          )}
          {!localVideoUrl && (
            <div className="aspect-video bg-[var(--surface-container)] rounded-xl flex items-center justify-center">
              <p className="text-[var(--on-surface-variant)] text-sm">Video preview unavailable</p>
            </div>
          )}
        </div>

        {/* Right: Editor with Tabs */}
        {subtitles.length > 0 && (
          <div>
            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 bg-[var(--surface-container-low)] rounded-lg p-1">
              <button
                onClick={() => setActiveTab("text")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === "text"
                    ? "bg-[var(--surface-container-high)] text-[var(--on-surface)] shadow-sm"
                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                }`}
              >
                Edit Text
              </button>
              <button
                onClick={() => setActiveTab("style")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === "style"
                    ? "bg-[var(--surface-container-high)] text-[var(--on-surface)] shadow-sm"
                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                }`}
              >
                Style
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "text" ? (
              <SubtitleEditor
                subtitles={subtitles}
                dispatch={dispatch}
                activeIndex={activeSubtitle?.index}
              />
            ) : (
              <div className="bg-[var(--surface-container-low)] rounded-xl p-5 border border-[var(--outline-variant)]/10">
                <StylePanel style={subtitleStyle} onUpdate={updateStyle} />
              </div>
            )}
          </div>
        )}

        {subtitles.length === 0 && video.status !== "ready" && (
          <div className="flex items-center justify-center bg-[var(--surface-container-low)] rounded-xl p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--on-surface-variant)] text-sm">
                {video.status === "transcribing" ? "Transcribing audio..." : video.status === "correcting" ? "Correcting grammar..." : "Processing..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/preview/VideoPlayer";
import { SubtitleOverlay } from "@/components/preview/SubtitleOverlay";
import { StylePanel } from "@/components/editor/StylePanel";
import { ExportButton } from "@/components/editor/ExportButton";
import { useVideoSync } from "@/hooks/useVideoSync";
import { useSubtitleState } from "@/hooks/useSubtitleState";
import { useSubtitleStyle } from "@/hooks/useSubtitleStyle";
import { generateSrt } from "@/lib/srt/generator";
import type { Video } from "@/lib/db/schema";
import type { Subtitle } from "@/types/subtitle";

type EditorTab = "text" | "style";

function formatTimecode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function VideoEditorPage() {
  const params = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTime = useVideoSync(videoRef);
  const [subtitles, dispatch] = useSubtitleState();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("text");
  const { style: subtitleStyle, updateStyle, setStyle: setSubtitleStyle } = useSubtitleStyle(video?.id);

  // Fetch video data from DB
  useEffect(() => {
    async function fetchVideo() {
      try {
        const res = await fetch(`/api/videos/${params.id}`);
        if (!res.ok) throw new Error("Video not found");
        const data = await res.json();
        setVideo(data.video);

        if (data.video.subtitles) {
          dispatch({ type: "SET", subtitles: data.video.subtitles });
        }
        if (data.video.subtitleStyle) {
          setSubtitleStyle(data.video.subtitleStyle);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    }
    fetchVideo();
  }, [params.id, dispatch, setSubtitleStyle]);

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

  // Auto-save subtitles to DB (debounced)
  const hasLoadedRef = useRef(false);
  const videoId = video?.id;
  useEffect(() => {
    if (!videoId || subtitles.length === 0) return;
    if (!hasLoadedRef.current) { hasLoadedRef.current = true; return; }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtitles }),
        });
        if (!res.ok) console.error("Auto-save failed:", res.status);
      } catch (err) { console.error("Auto-save failed:", err); }
    }, 2000);
    return () => clearTimeout(timer);
  }, [subtitles, videoId]);

  // Video stream URL (proxied through API to handle private blob)
  const videoStreamUrl = video ? `/api/videos/${video.id}/stream` : null;

  const handleSubtitleClick = (sub: Subtitle) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sub.startTime / 1000;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center">
        <svg className="w-12 h-12 text-[var(--error)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="font-[family-name:var(--font-manrope)] font-bold text-lg mb-2">Video not found</h3>
        <p className="text-[var(--on-surface-variant)] mb-6">{error}</p>
        <Link href="/videos" className="text-[var(--primary)] hover:underline">Back to projects</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 md:-m-10 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Main: Video Player */}
        <main className="flex-1 flex flex-col bg-[var(--surface-container-lowest)]/50 overflow-hidden">
          {/* Video Player */}
          <section className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden group">
              {videoStreamUrl ? (
                <>
                  <VideoPlayer src={videoStreamUrl} videoRef={videoRef} />
                  <SubtitleOverlay subtitles={subtitles} currentTime={currentTime} style={subtitleStyle} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--on-surface-variant)]">
                  Video preview unavailable
                </div>
              )}
            </div>
          </section>

          {/* Bottom Timeline */}
          <section className="h-48 md:h-56 bg-[var(--surface-container-low)] flex flex-col border-t border-[var(--outline-variant)]/10">
            {/* Timeline toolbar */}
            <div className="h-10 border-b border-[var(--outline-variant)]/10 flex items-center px-4 md:px-6 justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={handleDownloadSrt} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-[var(--primary)] transition-colors" title="Download SRT">
                  ↓ SRT
                </button>
                {videoStreamUrl && subtitles.length > 0 && (
                  <ExportButton
                    videoUrl={videoStreamUrl}
                    subtitles={subtitles}
                    style={subtitleStyle}
                    videoTitle={video.title}
                  />
                )}
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-500 tracking-widest">
                {formatTimecode(currentTime)}
              </div>
            </div>

            {/* Subtitle blocks */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden relative px-4 py-3">
              {/* Playhead */}
              <div
                className="absolute top-0 h-full w-px bg-[var(--tertiary)] z-20"
                style={{
                  left: `${subtitles.length > 0 ? Math.min(95, (currentTime / Math.max(1, subtitles[subtitles.length - 1]?.endTime ?? 1)) * 100) : 0}%`,
                  boxShadow: "0 0 8px var(--tertiary)",
                }}
              >
                <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 bg-[var(--tertiary)] rotate-45" />
              </div>

              {/* Subtitle track */}
              <div className="flex gap-1 h-10 min-w-max">
                {subtitles.map((sub) => {
                  const isActive = activeSubtitle?.index === sub.index;
                  const totalDuration = subtitles[subtitles.length - 1]?.endTime ?? 1;
                  const width = Math.max(60, ((sub.endTime - sub.startTime) / totalDuration) * 1500);

                  return (
                    <button
                      key={sub.index}
                      onClick={() => handleSubtitleClick(sub)}
                      className={`h-full rounded-md px-2 flex items-center border-l-2 transition-all shrink-0 ${
                        isActive
                          ? "bg-[var(--surface-container-highest)] border-[var(--primary)]"
                          : "bg-[var(--surface-container-highest)]/50 border-[var(--primary)]/30 hover:bg-[var(--surface-container-highest)]"
                      }`}
                      style={{ width: `${width}px` }}
                    >
                      <span className={`text-[10px] font-medium truncate ${isActive ? "text-[var(--primary)]" : "text-slate-400"}`}>
                        {sub.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Waveform placeholder */}
              <div className="h-16 mt-2 bg-[var(--surface-container-lowest)] rounded-xl overflow-hidden relative flex items-center min-w-max">
                <div className="absolute inset-0 flex items-center gap-0.5 px-2 opacity-30">
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[var(--primary-container)] rounded-full"
                      style={{ height: `${8 + Math.sin(i * 0.5) * 16 + Math.random() * 12}px` }}
                    />
                  ))}
                </div>
                <span className="absolute left-4 top-2 text-[8px] font-black uppercase tracking-tighter text-[var(--on-surface-variant)]/40">
                  Audio Track 1
                </span>
              </div>
            </div>
          </section>
        </main>

        {/* Right Sidebar: Edit Text / Style */}
        <aside className="hidden lg:flex w-80 bg-[var(--surface-container-low)] border-l border-[var(--outline-variant)]/10 flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[var(--outline-variant)]/10 shrink-0">
            <button
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === "text"
                  ? "text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5"
                  : "text-slate-500 hover:text-[var(--on-surface)]"
              }`}
            >
              Edit Text
            </button>
            <button
              onClick={() => setActiveTab("style")}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === "style"
                  ? "text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5"
                  : "text-slate-500 hover:text-[var(--on-surface)]"
              }`}
            >
              Style
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === "text" ? (
              /* Subtitle list — Stitch-style cards */
              subtitles.length > 0 ? (
                subtitles.map((sub) => {
                  const isActive = activeSubtitle?.index === sub.index;
                  return (
                    <button
                      key={sub.index}
                      onClick={() => handleSubtitleClick(sub)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[var(--surface-container-highest)] border-l-4 border-[var(--primary)] shadow-lg"
                          : "bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] group cursor-pointer"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${isActive ? "text-[var(--primary)]" : "text-slate-500"}`}>
                          {formatTimecode(sub.startTime)}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${isActive ? "text-[var(--on-surface)] font-medium" : "text-[var(--on-surface-variant)]"}`}>
                        {sub.text}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12 text-[var(--on-surface-variant)] text-sm">
                  No subtitles yet
                </div>
              )
            ) : (
              /* Style panel */
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Caption Style</h3>
                <StylePanel style={subtitleStyle} onUpdate={updateStyle} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

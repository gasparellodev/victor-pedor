"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/preview/VideoPlayer";
import { SubtitleOverlay } from "@/components/preview/SubtitleOverlay";
import { StylePanel } from "@/components/editor/StylePanel";
import { ExportButton } from "@/components/editor/ExportButton";
import { EditingSubtitleTextarea } from "@/components/editor/EditingSubtitleTextarea";
import { useVideoSync } from "@/hooks/useVideoSync";
import { useSubtitleState } from "@/hooks/useSubtitleState";
import { useSubtitleStyle } from "@/hooks/useSubtitleStyle";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useSidebar } from "@/contexts/SidebarContext";
import { generateSrt } from "@/lib/srt/generator";
import {
  DEFAULT_MAX_CHARS_PER_LINE,
  DEFAULT_MAX_LINES,
  type FormatOptions,
} from "@/lib/subtitle-format";
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { style: subtitleStyle, updateStyle, setStyle: setSubtitleStyle } = useSubtitleStyle(video?.id);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const { setCollapsed } = useSidebar();

  // Collapse left sidebar on editor mount, restore on unmount
  useEffect(() => {
    setCollapsed(true);
    return () => setCollapsed(false);
  }, [setCollapsed]);

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
          const loadOptions: FormatOptions = {
            maxCharsPerLine:
              data.video.subtitleStyle?.maxCharsPerLine ??
              DEFAULT_MAX_CHARS_PER_LINE,
            maxLines:
              data.video.subtitleStyle?.maxLines ?? DEFAULT_MAX_LINES,
          };
          dispatch({
            type: "REFORMAT_ALL",
            options: loadOptions,
            destructive: false,
          });
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

  // Active subtitle based on current video time
  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );
  const activeSubtitleIndex = activeSubtitle?.index ?? null;

  // Auto-scroll timeline to active subtitle block
  useAutoScroll({
    activeIndex: activeSubtitleIndex,
    containerRef: timelineScrollRef,
    behavior: "smooth",
    direction: "horizontal",
  });

  // Auto-scroll subtitle list to active card
  useAutoScroll({
    activeIndex: activeSubtitleIndex,
    containerRef: subtitleListRef,
    behavior: "smooth",
    direction: "vertical",
  });

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
        if (!res.ok) console.error("Auto-save failed:", res.status);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [subtitles, videoId]);

  // Keyboard shortcuts: Space = play/pause, ← → = seek ±5s
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        const v = videoRef.current;
        if (v) {
          if (v.paused) v.play();
          else v.pause();
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        const v = videoRef.current;
        if (v) v.currentTime = Math.max(0, v.currentTime - 5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        const v = videoRef.current;
        if (v) v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Video stream URL (proxied through API to handle private blob)
  const videoStreamUrl = video ? `/api/videos/${video.id}/stream` : null;

  const handleSubtitleClick = (sub: Subtitle) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sub.startTime / 1000;
    }
  };

  // Total duration from subtitles or video element
  const totalDuration = subtitles.length > 0
    ? subtitles[subtitles.length - 1].endTime
    : 1;

  // Stable waveform bars (memoized so they don't re-render every frame)
  const waveformBars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => {
        const base = 8 + Math.sin(i * 0.4) * 16;
        const noise = Math.sin(i * 2.7) * 8 + Math.sin(i * 5.1) * 4;
        return Math.max(3, base + noise);
      }),
    []
  );

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
        {/* ═══════════════════════════════════════════════════════ */}
        {/* Main Workspace — Video Player + Timeline              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col bg-[var(--surface)] relative overflow-hidden">

          {/* Video Player Canvas */}
          <section className="flex-1 flex items-center justify-center p-8 bg-[var(--surface-container-lowest)]/50">
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

          {/* ═══════════════════════════════════════════════════════ */}
          {/* Bottom Timeline — h-64 matching Stitch                */}
          {/* ═══════════════════════════════════════════════════════ */}
          <section className="h-64 bg-[var(--surface-container-low)] flex flex-col border-t border-[var(--outline-variant)]/10">

            {/* Timeline toolbar */}
            <div className="h-10 border-b border-[var(--outline-variant)]/10 flex items-center px-6 justify-between shrink-0">
              <div className="flex items-center gap-4">
                {/* Undo / Redo / History icons */}
                <button className="text-slate-400 hover:text-[var(--on-surface)] transition-colors" title="History">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" /></svg>
                </button>
                <button className="text-slate-400 hover:text-[var(--on-surface)] transition-colors" title="Undo">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" /></svg>
                </button>
                <button className="text-slate-400 hover:text-[var(--on-surface)] transition-colors" title="Redo">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" /></svg>
                </button>

                <div className="w-px h-5 bg-[var(--outline-variant)]/20 mx-1" />

                {/* SRT Download */}
                <button
                  onClick={handleDownloadSrt}
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-[var(--primary)] transition-colors"
                  title="Download SRT"
                >
                  ↓ SRT
                </button>

                {/* Export */}
                {videoStreamUrl && subtitles.length > 0 && (
                  <ExportButton
                    videoUrl={videoStreamUrl}
                    subtitles={subtitles}
                    style={subtitleStyle}
                    videoTitle={video.title}
                  />
                )}
              </div>

              {/* Zoom control */}
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zoom</span>
                <input
                  type="range"
                  className="w-32 accent-[var(--primary-container)] h-1 bg-[var(--surface-container-highest)] rounded-lg appearance-none cursor-pointer"
                  defaultValue={50}
                />
              </div>
            </div>

            {/* Scrollable timeline content */}
            <div ref={timelineScrollRef} className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar">
              <div className="min-w-[2000px] h-full p-4 space-y-3 relative">
                {/* Playhead — inside scrollable container */}
                <div
                  className="absolute top-0 h-full w-px bg-[var(--tertiary)] z-20 pointer-events-none"
                  style={{
                    left: `${subtitles.length > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
                    boxShadow: "0 0 8px #ffb786",
                  }}
                >
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[var(--tertiary)] rotate-45" />
                </div>

                {/* Subtitle Blocks Track */}
                <div className="flex gap-1 h-12">
                  {subtitles.map((sub, i) => {
                    const isActive = activeSubtitle?.index === sub.index;
                    const width = Math.max(60, ((sub.endTime - sub.startTime) / totalDuration) * 2000);

                    // Gap between previous subtitle and this one
                    const prevEnd = i > 0 ? subtitles[i - 1].endTime : 0;
                    const gapMs = sub.startTime - prevEnd;
                    const gapWidth = gapMs > 100 ? Math.max(12, (gapMs / totalDuration) * 2000) : 0;

                    return (
                      <div key={sub.index} className="flex gap-1 shrink-0" data-index={sub.index}>
                        {/* Silence gap */}
                        {gapWidth > 0 && <div style={{ width: `${gapWidth}px` }} />}

                        {/* Subtitle block */}
                        <button
                          onClick={() => handleSubtitleClick(sub)}
                          className={`h-full rounded-md p-2 flex items-center border-l-2 transition-all ${
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
                      </div>
                    );
                  })}
                </div>

                {/* Waveform Track */}
                <div className="h-20 bg-[var(--surface-container-lowest)] rounded-xl overflow-hidden relative flex items-center">
                  <div className="absolute inset-0 flex items-center gap-0.5 px-2 opacity-50">
                    {waveformBars.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[var(--primary-container)] rounded-full shrink-0"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span className="absolute left-4 top-2 text-[8px] font-black uppercase tracking-tighter text-[var(--on-surface-variant)]/40">
                    Audio Track 1
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* Right Sidebar — Edit Text / Style (Stitch w-80)       */}
        {/* ═══════════════════════════════════════════════════════ */}
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
          <div ref={subtitleListRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {activeTab === "text" ? (
              /* Transcription List — Stitch-style cards */
              subtitles.length > 0 ? (
                <div className="space-y-3">
                  {subtitles.map((sub) => {
                    const isActive = activeSubtitle?.index === sub.index;
                    const isEditing = editingIndex === sub.index;

                    return (
                      <div
                        key={sub.index}
                        data-index={sub.index}
                        onClick={() => {
                          handleSubtitleClick(sub);
                          if (!isActive) setEditingIndex(null);
                        }}
                        className={`p-3 rounded-lg transition-all duration-150 ${
                          isActive
                            ? "bg-[var(--surface-container-highest)] border-l-4 border-[var(--primary)] shadow-lg"
                            : "bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] cursor-pointer group"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-bold tracking-widest uppercase ${isActive ? "text-[var(--primary)]" : "text-slate-500"}`}>
                            {formatTimecode(sub.startTime)}
                          </span>

                          {/* Active card: more_horiz menu icon */}
                          {isActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingIndex(isEditing ? null : sub.index);
                              }}
                              className="text-slate-500 hover:text-[var(--on-surface)] transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                            </button>
                          )}

                          {/* Inactive card: edit icon on hover */}
                          {!isActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubtitleClick(sub);
                                setEditingIndex(sub.index);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-[var(--on-surface)]"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                            </button>
                          )}
                        </div>

                        {/* Text — editable textarea when editing, read-only p otherwise */}
                        {isEditing ? (
                          <EditingSubtitleTextarea
                            value={sub.text}
                            onChange={(e) => dispatch({ type: "UPDATE_TEXT", index: sub.index, text: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent text-sm leading-relaxed text-[var(--on-surface)] font-medium resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 rounded p-1 -m-1"
                          />
                        ) : (
                          <p className={`text-sm leading-relaxed ${isActive ? "text-[var(--on-surface)] font-medium" : "text-[var(--on-surface-variant)]"}`}>
                            {sub.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
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

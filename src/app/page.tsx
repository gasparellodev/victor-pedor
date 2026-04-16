"use client";

import { useRef, useCallback, useEffect } from "react";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { VideoPlayer } from "@/components/preview/VideoPlayer";
import { SubtitleOverlay } from "@/components/preview/SubtitleOverlay";
import { SubtitleEditor } from "@/components/editor/SubtitleEditor";
import { useProcessPipeline } from "@/hooks/useProcessPipeline";
import { useVideoSync } from "@/hooks/useVideoSync";
import { useSubtitleState } from "@/hooks/useSubtitleState";
import { generateSrt } from "@/lib/srt/generator";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTime = useVideoSync(videoRef);
  const pipeline = useProcessPipeline();
  const [subtitles, dispatch] = useSubtitleState();

  const handleFileSelect = useCallback(
    async (file: File) => {
      await pipeline.start(file);
    },
    [pipeline]
  );

  // Sync pipeline subtitles to editor state
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (pipeline.subtitles.length > 0 && !hasSyncedRef.current) {
      dispatch({ type: "SET", subtitles: pipeline.subtitles });
      hasSyncedRef.current = true;
    }
    if (pipeline.stage === "idle") {
      hasSyncedRef.current = false;
    }
  }, [pipeline.subtitles, pipeline.stage, dispatch]);

  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const handleDownload = useCallback(() => {
    const srtContent = generateSrt(subtitles);
    const blob = new Blob([srtContent], { type: "text/srt;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "legendas.srt";
    a.click();

    URL.revokeObjectURL(url);
  }, [subtitles]);

  const isProcessing = ["uploading", "transcribing", "correcting"].includes(pipeline.stage);
  const isEditing = pipeline.stage === "editing" || pipeline.stage === "done";

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2m0 16v2m0-2a2 2 0 01-2-2v-1a2 2 0 012-2 2 2 0 012 2v1a2 2 0 01-2 2M3 12h2m16 0h2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-[var(--text-primary)]">
                Victor Pedor
              </h1>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Legendas SRT com correção automática
              </p>
            </div>
          </div>

          {isEditing && subtitles.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={pipeline.reset}
                className="
                  px-3 py-1.5 text-[13px] font-medium rounded-lg
                  bg-[var(--bg-tertiary)] text-[var(--text-secondary)]
                  hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
                  border border-[var(--border-default)]
                  transition-colors duration-150
                "
              >
                Novo vídeo
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="
                  px-3 py-1.5 text-[13px] font-medium rounded-lg
                  bg-[var(--accent)] text-white
                  hover:bg-[var(--accent-hover)]
                  transition-colors duration-150
                "
              >
                Baixar SRT
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Upload Section */}
        {pipeline.stage === "idle" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                Gere legendas automaticamente
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] max-w-md">
                Envie um vídeo e receba um arquivo SRT com legendas transcritas e corrigidas em português.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <UploadDropzone onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {/* Progress Section */}
        {isProcessing && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <UploadProgress stage={pipeline.stage} progress={pipeline.progress} />
          </div>
        )}

        {/* Error Section */}
        {pipeline.stage === "error" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-fade-in max-w-sm w-full text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--danger-subtle)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-[15px] font-medium text-[var(--text-primary)] mb-1">
                Erro no processamento
              </p>
              <p className="text-[13px] text-[var(--text-secondary)] mb-5">
                {pipeline.error}
              </p>
              <button
                type="button"
                onClick={pipeline.reset}
                className="
                  px-4 py-2 text-[13px] font-medium rounded-lg
                  bg-[var(--bg-tertiary)] text-[var(--text-primary)]
                  hover:bg-[var(--bg-hover)]
                  border border-[var(--border-default)]
                  transition-colors duration-150
                "
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Editing Section */}
        {isEditing && subtitles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left: Video Preview */}
            <div className="flex flex-col gap-4">
              {pipeline.localVideoUrl && (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <VideoPlayer src={pipeline.localVideoUrl} videoRef={videoRef} />
                  <SubtitleOverlay
                    subtitles={subtitles}
                    currentTime={currentTime}
                  />
                </div>
              )}
            </div>

            {/* Right: Editor */}
            <div>
              <SubtitleEditor
                subtitles={subtitles}
                dispatch={dispatch}
                activeIndex={activeSubtitle?.index}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

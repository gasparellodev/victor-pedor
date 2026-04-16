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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Victor Pedor
          </h1>
          <p className="mt-2 text-gray-600">
            Gerador de legendas SRT com correção automática de português
          </p>
        </header>

        {/* Upload Section */}
        {pipeline.stage === "idle" && (
          <section className="max-w-xl mx-auto">
            <UploadDropzone
              onFileSelect={handleFileSelect}
              disabled={pipeline.stage !== "idle"}
            />
          </section>
        )}

        {/* Progress Section */}
        {["uploading", "transcribing", "correcting"].includes(pipeline.stage) && (
          <section className="max-w-xl mx-auto">
            <UploadProgress stage={pipeline.stage} progress={pipeline.progress} />
          </section>
        )}

        {/* Error Section */}
        {pipeline.stage === "error" && (
          <section className="max-w-xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700 font-medium">Erro no processamento</p>
              <p className="mt-2 text-red-600 text-sm">{pipeline.error}</p>
              <button
                type="button"
                onClick={pipeline.reset}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </section>
        )}

        {/* Editing Section */}
        {(pipeline.stage === "editing" || pipeline.stage === "done") &&
          subtitles.length > 0 && (
            <div className="space-y-6">
              {/* Video Preview */}
              {pipeline.blobUrl && (
                <section className="relative max-w-3xl mx-auto">
                  <VideoPlayer src={pipeline.blobUrl} videoRef={videoRef} />
                  <SubtitleOverlay
                    subtitles={subtitles}
                    currentTime={currentTime}
                  />
                </section>
              )}

              {/* Download Button */}
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Baixar SRT
                </button>
                <button
                  type="button"
                  onClick={pipeline.reset}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Novo vídeo
                </button>
              </div>

              {/* Subtitle Editor */}
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Editor de Legendas
                </h2>
                <SubtitleEditor
                  subtitles={subtitles}
                  dispatch={dispatch}
                  activeIndex={activeSubtitle?.index}
                />
              </section>
            </div>
          )}
      </div>
    </main>
  );
}

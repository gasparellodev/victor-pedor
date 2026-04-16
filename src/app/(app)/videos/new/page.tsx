"use client";

import { useProcessPipeline } from "@/hooks/useProcessPipeline";
import { useSubtitleState } from "@/hooks/useSubtitleState";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewVideoPage() {
  const { stage, progress, subtitles: pipelineSubtitles, videoId, error, start, reset } = useProcessPipeline();
  const [, dispatch] = useSubtitleState();
  const router = useRouter();

  // When editing stage is reached, redirect to the video editor
  useEffect(() => {
    if (stage === "editing" && videoId) {
      dispatch({ type: "SET", subtitles: pipelineSubtitles });
      router.push(`/videos/${videoId}`);
    }
  }, [stage, videoId, pipelineSubtitles, dispatch, router]);

  const handleFileSelect = async (file: File) => {
    await start(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-[var(--on-surface)] mb-2">
          Upload Content
        </h1>
        <p className="text-[var(--on-surface-variant)]">
          Add your video files to begin the transcription and editing process.
        </p>
      </div>

      {stage === "idle" && (
        <UploadDropzone onFileSelect={handleFileSelect} />
      )}

      {(stage === "uploading" || stage === "transcribing" || stage === "correcting") && (
        <UploadProgress stage={stage} progress={progress} />
      )}

      {stage === "error" && (
        <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-[var(--error)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-[family-name:var(--font-manrope)] font-bold text-[var(--error)] text-lg mb-2">
            Something went wrong
          </h3>
          <p className="text-[var(--on-surface-variant)] mb-6">{error}</p>
          <button
            onClick={reset}
            className="brand-gradient text-[var(--on-primary-container)] px-6 py-3 rounded-lg font-bold active:scale-95 duration-150"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

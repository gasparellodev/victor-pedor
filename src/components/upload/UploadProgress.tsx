"use client";

import type { PipelineStage } from "@/types/pipeline";

interface UploadProgressProps {
  stage: PipelineStage;
  progress: number;
}

const STEPS: { key: PipelineStage; label: string; icon: string }[] = [
  { key: "uploading", label: "Enviando", icon: "1" },
  { key: "transcribing", label: "Transcrevendo", icon: "2" },
  { key: "correcting", label: "Corrigindo", icon: "3" },
];

export function UploadProgress({ stage }: UploadProgressProps) {
  if (stage === "idle") return null;

  const currentIndex = STEPS.findIndex((s) => s.key === stage);

  return (
    <div className="animate-fade-in w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-8">
        {/* Steps */}
        <div className="flex items-center gap-3 w-full">
          {STEPS.map((step, i) => {
            const isActive = step.key === stage;
            const isCompleted = currentIndex > i;

            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium
                    transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-[var(--accent)] text-white"
                        : isActive
                          ? "bg-[var(--accent-subtle)] text-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={`text-[12px] font-medium ${
                    isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Animated progress bar */}
        <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
            style={{
              width: `${((currentIndex + 0.5) / STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Status text */}
        <p className="text-[13px] text-[var(--text-secondary)] animate-pulse-glow">
          {stage === "uploading" && "Enviando vídeo para processamento..."}
          {stage === "transcribing" && "Transcrevendo áudio com IA..."}
          {stage === "correcting" && "Corrigindo gramática portuguesa..."}
        </p>
      </div>
    </div>
  );
}

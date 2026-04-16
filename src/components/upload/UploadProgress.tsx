"use client";

import type { PipelineStage } from "@/types/pipeline";

interface UploadProgressProps {
  stage: PipelineStage;
  progress: number;
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: "Aguardando",
  uploading: "Enviando vídeo...",
  transcribing: "Transcrevendo áudio...",
  correcting: "Corrigindo gramática...",
  editing: "Pronto para edição",
  done: "Concluído",
  error: "Erro",
};

const STAGE_ORDER: PipelineStage[] = [
  "uploading",
  "transcribing",
  "correcting",
];

export function UploadProgress({ stage, progress }: UploadProgressProps) {
  if (stage === "idle") return null;

  const currentIndex = STAGE_ORDER.indexOf(stage);
  const label = STAGE_LABELS[stage];

  return (
    <div className="w-full mt-6">
      <div className="flex justify-between mb-2">
        {STAGE_ORDER.map((s, i) => {
          const isActive = s === stage;
          const isCompleted = currentIndex > i || stage === "editing" || stage === "done";

          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isCompleted
                    ? "bg-green-500"
                    : isActive
                      ? "bg-blue-500 animate-pulse"
                      : "bg-gray-300"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-blue-700 font-medium" : "text-gray-500"
                }`}
              >
                {STAGE_LABELS[s]}
              </span>
            </div>
          );
        })}
      </div>

      {stage !== "error" && stage !== "editing" && stage !== "done" && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      <p className="mt-2 text-sm text-center text-gray-600">{label}</p>

      {stage === "error" && (
        <p className="mt-2 text-sm text-center text-red-600">
          Ocorreu um erro. Tente novamente.
        </p>
      )}
    </div>
  );
}

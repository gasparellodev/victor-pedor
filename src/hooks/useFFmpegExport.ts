"use client";

import { useCallback, useState } from "react";
import type { Subtitle } from "@/types/subtitle";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import {
  exportVideoWithSubtitles,
  downloadBlob,
} from "@/lib/ffmpeg-export/client";

export type ExportStage = "idle" | "loading" | "processing" | "done" | "error";

interface UseFFmpegExportReturn {
  stage: ExportStage;
  progress: number;
  error: string | null;
  startExport: (options: {
    videoUrl: string;
    subtitles: Subtitle[];
    style: SubtitleStyle;
    filename?: string;
  }) => Promise<void>;
  reset: () => void;
}

export function useFFmpegExport(): UseFFmpegExportReturn {
  const [stage, setStage] = useState<ExportStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startExport = useCallback(
    async (options: {
      videoUrl: string;
      subtitles: Subtitle[];
      style: SubtitleStyle;
      filename?: string;
    }) => {
      try {
        setError(null);
        setProgress(0);
        setStage("loading");

        const outputFilename = options.filename ?? "video-with-subtitles.mp4";

        const data = await exportVideoWithSubtitles({
          videoUrl: options.videoUrl,
          subtitles: options.subtitles,
          style: options.style,
          outputFilename,
          onProgress: setProgress,
          onStage: setStage,
        });

        downloadBlob(data, outputFilename);
        setStage("done");
      } catch (err) {
        setStage("error");
        setError(
          err instanceof Error ? err.message : "Export failed"
        );
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStage("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { stage, progress, error, startExport, reset };
}

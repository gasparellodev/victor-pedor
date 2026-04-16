"use client";

import { useCallback, useRef, useState } from "react";
import type { Subtitle } from "@/types/subtitle";
import type { PipelineStage } from "@/types/pipeline";
import { captureVideoFrame, uploadThumbnail } from "@/lib/thumbnail/generator";

interface PipelineResult {
  stage: PipelineStage;
  progress: number;
  subtitles: Subtitle[];
  localVideoUrl: string | null;
  videoId: string | null;
  error: string | null;
  start: (file: File) => Promise<void>;
  reset: () => void;
}

export function useProcessPipeline(): PipelineResult {
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [progress, setProgress] = useState(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    setStage("idle");
    setProgress(0);
    setSubtitles([]);
    setLocalVideoUrl(null);
    setVideoId(null);
    setError(null);
  }, [localVideoUrl]);

  const start = useCallback(async (file: File) => {
    try {
      setError(null);

      // Create local video URL for preview (private blob URLs don't work as video src)
      const objectUrl = URL.createObjectURL(file);
      setLocalVideoUrl(objectUrl);

      // Step 1: Upload
      setStage("uploading");
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Upload failed");
      }

      const { blobUrl: url, videoId: vid } = await uploadRes.json();
      setVideoId(vid);
      setProgress(100);

      // Generate and upload thumbnail (non-blocking, saves to DB via API)
      captureVideoFrame(file).then((thumbBlob) =>
        uploadThumbnail(thumbBlob, vid).catch(() => {})
      );

      // Step 2: Submit transcription
      setStage("transcribing");
      setProgress(0);

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: url, videoId: vid }),
      });

      if (!transcribeRes.ok) {
        const data = await transcribeRes.json();
        throw new Error(data.error || "Transcription submission failed");
      }

      const { transcriptId } = await transcribeRes.json();

      // Step 3: Poll for completion
      let transcriptionDone = false;
      let rawSubtitles: Subtitle[] = [];

      while (!transcriptionDone) {
        await new Promise((r) => setTimeout(r, 2000));

        const statusRes = await fetch(
          `/api/transcription/${transcriptId}/status${vid ? `?videoId=${vid}` : ""}`
        );
        const statusData = await statusRes.json();

        if (statusData.status === "error") {
          throw new Error(statusData.error || "Transcription error");
        }

        if (statusData.status === "completed") {
          rawSubtitles = statusData.subtitles;
          transcriptionDone = true;
        }

        setProgress(statusData.status === "processing" ? 50 : 0);
      }

      setProgress(100);

      // Step 4: Correct grammar via SSE
      setStage("correcting");
      setProgress(0);

      const correctRes = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtitles: rawSubtitles, videoId: vid }),
      });

      if (!correctRes.ok) {
        throw new Error("Correction request failed");
      }

      const reader = correctRes.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;

          if (value) {
            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
              const dataLine = event
                .split("\n")
                .find((l) => l.startsWith("data: "));
              if (!dataLine) continue;

              const data = JSON.parse(dataLine.slice(6));

              if (data.subtitles) {
                setSubtitles(data.subtitles);
              }

              if (data.message) {
                throw new Error(data.message);
              }
            }
          }
        }
      }

      setProgress(100);
      setStage("editing");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }, []);

  return { stage, progress, subtitles, localVideoUrl, videoId, error, start, reset };
}

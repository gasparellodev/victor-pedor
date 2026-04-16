import type { Subtitle } from "@/types/subtitle";
import type { PipelineStage } from "@/types/pipeline";
import type {
  TranscribedWord,
  TranscriptionStatus,
} from "@/lib/assemblyai/client";

export interface PipelineDeps {
  uploadVideo: (file: File) => Promise<{ url: string }>;
  submitTranscription: (audioUrl: string) => Promise<string>;
  checkTranscriptionStatus: (id: string) => Promise<TranscriptionStatus>;
  wordsToSubtitles: (words: TranscribedWord[]) => Subtitle[];
  correctSubtitles: (subtitles: Subtitle[]) => Promise<Subtitle[]>;
}

export type ProgressCallback = (stage: PipelineStage, progress: number) => void;

interface PipelineOptions {
  pollingIntervalMs?: number;
}

export interface PipelineOrchestrator {
  process(file: File, onProgress: ProgressCallback): Promise<Subtitle[]>;
}

const DEFAULT_POLLING_INTERVAL_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createPipelineOrchestrator(
  deps: PipelineDeps,
  options?: PipelineOptions
): PipelineOrchestrator {
  const pollingInterval =
    options?.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS;

  return {
    async process(file, onProgress) {
      // Step 1: Upload
      onProgress("uploading", 0);
      const { url } = await deps.uploadVideo(file);
      onProgress("uploading", 100);

      // Step 2: Submit transcription
      onProgress("transcribing", 0);
      const transcriptId = await deps.submitTranscription(url);

      // Step 3: Poll for completion
      let status: TranscriptionStatus;
      do {
        status = await deps.checkTranscriptionStatus(transcriptId);

        if (status.status === "error") {
          throw new Error(status.error ?? "Transcription failed");
        }

        if (status.status !== "completed") {
          await delay(pollingInterval);
        }
      } while (status.status !== "completed");

      onProgress("transcribing", 100);

      // Step 4: Group words into subtitles
      const rawSubtitles = deps.wordsToSubtitles(status.words!);

      // Step 5: Correct grammar
      onProgress("correcting", 0);
      const correctedSubtitles = await deps.correctSubtitles(rawSubtitles);
      onProgress("correcting", 100);

      return correctedSubtitles;
    },
  };
}

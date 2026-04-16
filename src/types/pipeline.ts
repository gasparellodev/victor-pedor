import type { Subtitle } from "./subtitle";

export type PipelineStage =
  | "idle"
  | "uploading"
  | "transcribing"
  | "correcting"
  | "editing"
  | "done"
  | "error";

export interface PipelineState {
  stage: PipelineStage;
  progress: number; // 0-100
  blobUrl?: string;
  transcriptId?: string;
  subtitles?: Subtitle[];
  error?: string;
}

export interface JobInfo {
  jobId: string;
  blobUrl: string;
  transcriptId?: string;
  status: PipelineStage;
  subtitles?: Subtitle[];
  createdAt: Date;
}

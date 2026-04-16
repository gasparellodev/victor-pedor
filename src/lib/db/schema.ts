import { z } from "zod/v4";
import type { Subtitle } from "@/types/subtitle";

export const VIDEO_STATUSES = [
  "uploading",
  "transcribing",
  "correcting",
  "ready",
  "error",
] as const;

export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: "top" | "center" | "bottom";
}

export interface Video {
  id: string;
  title: string;
  blobUrl: string;
  thumbnailUrl: string | null;
  durationMs: number | null;
  status: VideoStatus;
  transcriptId: string | null;
  subtitles: Subtitle[] | null;
  subtitleStyle: SubtitleStyle | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateVideoSchema = z.object({
  title: z.string().min(1),
  blobUrl: z.url(),
  durationMs: z.number().int().positive().optional(),
});

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;

export const UpdateVideoSchema = z.object({
  status: z.enum(VIDEO_STATUSES).optional(),
  transcriptId: z.string().optional(),
  subtitles: z
    .array(
      z.object({
        index: z.number(),
        startTime: z.number(),
        endTime: z.number(),
        text: z.string(),
      })
    )
    .optional(),
  subtitleStyle: z
    .object({
      fontFamily: z.string(),
      fontSize: z.number(),
      fontColor: z.string(),
      backgroundColor: z.string(),
      position: z.enum(["top", "center", "bottom"]),
    })
    .optional(),
  errorMessage: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  durationMs: z.number().int().positive().optional(),
});

export type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>;

export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS videos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  blob_url       TEXT NOT NULL,
  thumbnail_url  TEXT,
  duration_ms    INTEGER,
  status         TEXT NOT NULL DEFAULT 'uploading',
  transcript_id  TEXT,
  subtitles      JSONB,
  subtitle_style JSONB,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
`;

export function mapRowToVideo(row: Record<string, unknown>): Video {
  return {
    id: row.id as string,
    title: row.title as string,
    blobUrl: row.blob_url as string,
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    durationMs: (row.duration_ms as number) ?? null,
    status: row.status as VideoStatus,
    transcriptId: (row.transcript_id as string) ?? null,
    subtitles: (row.subtitles as Subtitle[]) ?? null,
    subtitleStyle: (row.subtitle_style as SubtitleStyle) ?? null,
    errorMessage: (row.error_message as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

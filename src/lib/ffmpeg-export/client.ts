import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import type { Subtitle } from "@/types/subtitle";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { generateAssContent } from "./ass-generator";

let ffmpegInstance: FFmpeg | null = null;

export async function initFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  try {
    // Self-hosted ffmpeg-core files (no CDN dependency)
    const baseURL = "/ffmpeg";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
  } catch (err) {
    ffmpeg.terminate();
    throw err;
  }

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export function terminateFFmpeg(): void {
  if (ffmpegInstance) {
    ffmpegInstance.terminate();
    ffmpegInstance = null;
  }
}

export interface ExportOptions {
  videoUrl: string;
  subtitles: Subtitle[];
  style: SubtitleStyle;
  outputFilename?: string;
  onProgress?: (progress: number) => void;
  onStage?: (stage: "loading" | "processing" | "done") => void;
}

export async function exportVideoWithSubtitles({
  videoUrl,
  subtitles,
  style,
  outputFilename = "output.mp4",
  onProgress,
  onStage,
}: ExportOptions): Promise<Uint8Array> {
  onStage?.("loading");
  const ffmpeg = await initFFmpeg();

  // Register progress handler for this export
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.round(progress * 100));
  };
  ffmpeg.on("progress", progressHandler);

  onStage?.("processing");

  try {
    // Write input video
    const videoData = await fetchFile(videoUrl);
    await ffmpeg.writeFile("input.mp4", videoData);

    // Write ASS subtitle file
    const assContent = generateAssContent(subtitles, style);
    const encoder = new TextEncoder();
    await ffmpeg.writeFile("subtitles.ass", encoder.encode(assContent));

    // Run ffmpeg: burn subtitles into video
    await ffmpeg.exec([
      "-i", "input.mp4",
      "-vf", "ass=subtitles.ass",
      "-c:a", "copy",
      "-preset", "ultrafast",
      outputFilename,
    ]);

    // Read output
    const data = await ffmpeg.readFile(outputFilename);
    onStage?.("done");
    return data as Uint8Array;
  } finally {
    // Cleanup virtual FS and detach progress handler
    ffmpeg.off("progress", progressHandler);
    await ffmpeg.deleteFile("input.mp4").catch(() => {});
    await ffmpeg.deleteFile("subtitles.ass").catch(() => {});
    await ffmpeg.deleteFile(outputFilename).catch(() => {});
  }
}

export function downloadBlob(data: Uint8Array, filename: string): void {
  const blob = new Blob([data as BlobPart], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

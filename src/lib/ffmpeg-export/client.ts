import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import type { Subtitle } from "@/types/subtitle";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { generateAssContent } from "./ass-generator";

let ffmpegInstance: FFmpeg | null = null;

export async function initFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
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
  const ffmpeg = await initFFmpeg(onProgress);

  onStage?.("processing");

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

  // Cleanup
  await ffmpeg.deleteFile("input.mp4");
  await ffmpeg.deleteFile("subtitles.ass");
  await ffmpeg.deleteFile(outputFilename);

  onStage?.("done");
  return data as Uint8Array;
}

export function downloadBlob(data: Uint8Array, filename: string): void {
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(arrayBuffer).set(data);
  const blob = new Blob([arrayBuffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

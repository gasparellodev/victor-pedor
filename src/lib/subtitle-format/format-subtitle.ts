import type { Subtitle } from "@/types/subtitle";
import { breakTextIntoLines } from "./break-lines";
import { splitIntoTwoSubtitles } from "./split-subtitle";
import type { FormatOptions } from "./types";

export interface FormatResult {
  subtitles: Subtitle[];
  wasSplit: boolean;
}

export interface FormatModeOptions {
  destructive: boolean;
}

export function formatSubtitle(
  subtitle: Subtitle,
  opts: FormatOptions,
  mode: FormatModeOptions
): FormatResult {
  const broken = breakTextIntoLines(subtitle.text, opts);

  if (!mode.destructive || broken.overflow === null) {
    const combinedLines = broken.overflow
      ? [...broken.lines.slice(0, -1), `${broken.lines.at(-1) ?? ""} ${broken.overflow}`.trim()]
      : broken.lines;

    const text = combinedLines.join("\n");

    return {
      subtitles: [{ ...subtitle, text }],
      wasSplit: false,
    };
  }

  const normalized = subtitle.text.replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter((w) => w.length > 0);
  if (words.length < 2) {
    return {
      subtitles: [{ ...subtitle, text: normalized }],
      wasSplit: false,
    };
  }

  const pair = splitIntoTwoSubtitles(subtitle, opts);
  return { subtitles: pair, wasSplit: true };
}

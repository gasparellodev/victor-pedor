import type { Subtitle } from "@/types/subtitle";
import { formatSubtitle, type FormatModeOptions } from "./format-subtitle";
import type { FormatOptions } from "./types";

export function formatAllSubtitles(
  subtitles: Subtitle[],
  opts: FormatOptions,
  mode: FormatModeOptions
): Subtitle[] {
  if (subtitles.length === 0) return [];

  const next: Subtitle[] = [];
  for (const sub of subtitles) {
    const { subtitles: result } = formatSubtitle(sub, opts, mode);
    next.push(...result);
  }
  return next.map((s, i) => ({ ...s, index: i + 1 }));
}

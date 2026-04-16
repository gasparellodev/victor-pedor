import type { Subtitle } from "@/types/subtitle";

const TIMESTAMP_REGEX =
  /^(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;

function parseTimestamp(
  hours: string,
  minutes: string,
  seconds: string,
  millis: string
): number {
  return (
    parseInt(hours, 10) * 3600000 +
    parseInt(minutes, 10) * 60000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(millis, 10)
  );
}

export function parseSrt(content: string): Subtitle[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const blocks = normalized.split(/\n\n+/);
  const subtitles: Subtitle[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");

    if (lines.length < 3) {
      throw new Error(
        `Invalid SRT block: expected at least 3 lines, got ${lines.length}`
      );
    }

    const index = parseInt(lines[0], 10);
    if (isNaN(index)) {
      throw new Error(`Invalid subtitle index: "${lines[0]}"`);
    }

    const timestampMatch = lines[1].match(TIMESTAMP_REGEX);
    if (!timestampMatch) {
      throw new Error(`Invalid timestamp line: "${lines[1]}"`);
    }

    const startTime = parseTimestamp(
      timestampMatch[1],
      timestampMatch[2],
      timestampMatch[3],
      timestampMatch[4]
    );
    const endTime = parseTimestamp(
      timestampMatch[5],
      timestampMatch[6],
      timestampMatch[7],
      timestampMatch[8]
    );

    const text = lines.slice(2).join("\n");

    subtitles.push({ index, startTime, endTime, text });
  }

  return subtitles;
}

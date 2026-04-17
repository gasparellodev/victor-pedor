import type { Subtitle } from "@/types/subtitle";
import { breakTextIntoLines } from "./break-lines";
import type { FormatOptions } from "./types";

export function splitIntoTwoSubtitles(
  subtitle: Subtitle,
  opts: FormatOptions
): [Subtitle, Subtitle] {
  const normalized = subtitle.text.replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter((w) => w.length > 0);

  if (words.length < 2) {
    throw new Error("Cannot split subtitle with fewer than 2 words");
  }

  const splitPoint = Math.ceil(words.length / 2);
  const duration = subtitle.endTime - subtitle.startTime;
  const midTime =
    subtitle.startTime + Math.floor((duration * splitPoint) / words.length);

  const firstText = words.slice(0, splitPoint).join(" ");
  const secondText = words.slice(splitPoint).join(" ");

  const firstBroken = breakTextIntoLines(firstText, opts);
  const secondBroken = breakTextIntoLines(secondText, opts);

  const first: Subtitle = {
    index: 0,
    startTime: subtitle.startTime,
    endTime: midTime,
    text: firstBroken.lines.join("\n"),
  };

  const second: Subtitle = {
    index: 0,
    startTime: midTime + 1,
    endTime: subtitle.endTime,
    text: secondBroken.lines.join("\n"),
  };

  return [first, second];
}

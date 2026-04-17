import type { BreakResult, FormatOptions } from "./types";

function partLength(words: string[], from: number, to: number): number {
  if (from >= to) return 0;
  let len = 0;
  for (let i = from; i < to; i++) {
    len += words[i].length;
  }
  return len + (to - from - 1);
}

function packGreedyLine(
  words: string[],
  start: number,
  maxChars: number
): number {
  if (start >= words.length) return 0;
  let count = 1;
  let len = words[start].length;
  for (let i = start + 1; i < words.length; i++) {
    const newLen = len + 1 + words[i].length;
    if (newLen > maxChars) break;
    len = newLen;
    count++;
  }
  return count;
}

function findBalancedSplit(words: string[], maxChars: number): number | null {
  const n = words.length;
  if (n < 2) return null;

  let bestSplit: number | null = null;
  let bestDiff = Infinity;

  for (let k = 1; k < n; k++) {
    const line1 = partLength(words, 0, k);
    const line2 = partLength(words, k, n);
    if (line1 > maxChars || line2 > maxChars) continue;
    const diff = Math.abs(line1 - line2);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = k;
    }
  }

  return bestSplit;
}

export function breakTextIntoLines(
  text: string,
  opts: FormatOptions
): BreakResult {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized === "") {
    return { lines: [""], overflow: null };
  }

  const { maxCharsPerLine, maxLines } = opts;

  if (normalized.length <= maxCharsPerLine) {
    return { lines: [normalized], overflow: null };
  }

  const words = normalized.split(" ");

  if (words.length === 1) {
    return { lines: [normalized], overflow: null };
  }

  if (maxLines === 1) {
    const count = packGreedyLine(words, 0, maxCharsPerLine);
    const line1 = words.slice(0, count).join(" ");
    const rest = words.slice(count).join(" ");
    return { lines: [line1], overflow: rest.length > 0 ? rest : null };
  }

  const balanced = findBalancedSplit(words, maxCharsPerLine);
  if (balanced !== null) {
    return {
      lines: [
        words.slice(0, balanced).join(" "),
        words.slice(balanced).join(" "),
      ],
      overflow: null,
    };
  }

  const c1 = packGreedyLine(words, 0, maxCharsPerLine);
  const c2 = packGreedyLine(words, c1, maxCharsPerLine);
  const line1 = words.slice(0, c1).join(" ");
  const line2 = words.slice(c1, c1 + c2).join(" ");
  const rest = words.slice(c1 + c2).join(" ");

  return {
    lines: [line1, line2],
    overflow: rest.length > 0 ? rest : null,
  };
}

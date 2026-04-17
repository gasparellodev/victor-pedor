import { describe, it, expect } from "vitest";
import type { Subtitle } from "@/types/subtitle";
import { splitIntoTwoSubtitles } from "./split-subtitle";
import type { FormatOptions } from "./types";

const opts42x2: FormatOptions = { maxCharsPerLine: 42, maxLines: 2 };

function makeSubtitle(text: string, start = 1000, end = 5000): Subtitle {
  return { index: 1, startTime: start, endTime: end, text };
}

describe("splitIntoTwoSubtitles", () => {
  it("splits a long subtitle into two subs with proportional timestamps", () => {
    const text =
      "Uma legenda muito longa que nao cabe em duas linhas e precisa ser dividida em duas partes separadas";
    const sub = makeSubtitle(text, 1000, 9000);
    const [a, b] = splitIntoTwoSubtitles(sub, opts42x2);

    expect(a.text.length).toBeGreaterThan(0);
    expect(b.text.length).toBeGreaterThan(0);
    expect(a.startTime).toBe(1000);
    expect(b.endTime).toBe(9000);
    expect(a.endTime).toBeLessThan(b.startTime);
    expect(b.startTime - a.endTime).toBe(1);
  });

  it("preserves total word count across the two halves", () => {
    const text =
      "Uma legenda muito longa que nao cabe em duas linhas e precisa ser dividida em duas partes";
    const sub = makeSubtitle(text);
    const originalWords = text.split(" ").length;
    const [a, b] = splitIntoTwoSubtitles(sub, opts42x2);
    const combinedWords =
      a.text.replace(/\n/g, " ").split(" ").length +
      b.text.replace(/\n/g, " ").split(" ").length;
    expect(combinedWords).toBe(originalWords);
  });

  it("applies line-breaking to each resulting half", () => {
    const text =
      "Primeiro fragmento bastante razoavel aqui dentro segundo fragmento tambem razoavel aqui dentro mais algumas palavras extras que transbordam";
    const sub = makeSubtitle(text);
    const [a, b] = splitIntoTwoSubtitles(sub, opts42x2);
    for (const line of a.text.split("\n")) {
      expect(line.length).toBeLessThanOrEqual(42);
    }
    for (const line of b.text.split("\n")) {
      expect(line.length).toBeLessThanOrEqual(42);
    }
  });

  it("allocates time proportionally to the number of words in each half", () => {
    const text = "um dois tres quatro cinco seis sete oito nove dez";
    const sub = makeSubtitle(text, 0, 10000);
    const [a, b] = splitIntoTwoSubtitles(sub, opts42x2);
    const durationA = a.endTime - a.startTime;
    const durationB = b.endTime - b.startTime;
    const totalDuration = 10000;
    expect(durationA + durationB + 1).toBe(totalDuration);
    expect(Math.abs(durationA - durationB)).toBeLessThan(totalDuration / 2);
  });

  it("places the split at roughly the middle of the words", () => {
    const text = "a b c d e f g h i j";
    const sub = makeSubtitle(text, 0, 10000);
    const [a, b] = splitIntoTwoSubtitles(sub, opts42x2);
    const wordsA = a.text.replace(/\n/g, " ").split(" ").length;
    const wordsB = b.text.replace(/\n/g, " ").split(" ").length;
    expect(Math.abs(wordsA - wordsB)).toBeLessThanOrEqual(1);
  });

  it("returns the two subs with index 0 (reindex is caller's responsibility)", () => {
    const text = "um dois tres quatro cinco seis sete oito";
    const sub = makeSubtitle(text);
    const [a, b] = splitIntoTwoSubtitles(sub, opts42x2);
    expect(a.index).toBe(0);
    expect(b.index).toBe(0);
  });

  it("throws when the subtitle has fewer than 2 words", () => {
    const sub = makeSubtitle("palavraunica");
    expect(() => splitIntoTwoSubtitles(sub, opts42x2)).toThrow(
      /cannot split/i
    );
  });
});

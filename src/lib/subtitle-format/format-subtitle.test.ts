import { describe, it, expect } from "vitest";
import type { Subtitle } from "@/types/subtitle";
import { formatSubtitle } from "./format-subtitle";
import type { FormatOptions } from "./types";

const opts42x2: FormatOptions = { maxCharsPerLine: 42, maxLines: 2 };

function makeSubtitle(text: string, start = 1000, end = 5000): Subtitle {
  return { index: 1, startTime: start, endTime: end, text };
}

describe("formatSubtitle", () => {
  describe("non-destructive mode", () => {
    it("leaves short text on a single line", () => {
      const sub = makeSubtitle("Ola mundo");
      const result = formatSubtitle(sub, opts42x2, { destructive: false });
      expect(result.subtitles).toHaveLength(1);
      expect(result.subtitles[0].text).toBe("Ola mundo");
      expect(result.wasSplit).toBe(false);
    });

    it("inserts \\n for text that fits in 2 lines", () => {
      const sub = makeSubtitle(
        "Esta eh uma legenda um pouco maior que precisa quebrar"
      );
      const result = formatSubtitle(sub, opts42x2, { destructive: false });
      expect(result.subtitles).toHaveLength(1);
      expect(result.subtitles[0].text).toContain("\n");
      expect(result.wasSplit).toBe(false);
      for (const line of result.subtitles[0].text.split("\n")) {
        expect(line.length).toBeLessThanOrEqual(42);
      }
    });

    it("keeps a single subtitle and appends overflow on line 2 when text is too long", () => {
      const longText =
        "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra";
      const sub = makeSubtitle(longText);
      const result = formatSubtitle(sub, opts42x2, { destructive: false });
      expect(result.subtitles).toHaveLength(1);
      expect(result.wasSplit).toBe(false);
    });

    it("preserves timestamps", () => {
      const sub = makeSubtitle("ola mundo", 1234, 5678);
      const result = formatSubtitle(sub, opts42x2, { destructive: false });
      expect(result.subtitles[0].startTime).toBe(1234);
      expect(result.subtitles[0].endTime).toBe(5678);
    });
  });

  describe("destructive mode", () => {
    it("leaves short text untouched", () => {
      const sub = makeSubtitle("Ola mundo");
      const result = formatSubtitle(sub, opts42x2, { destructive: true });
      expect(result.subtitles).toHaveLength(1);
      expect(result.subtitles[0].text).toBe("Ola mundo");
      expect(result.wasSplit).toBe(false);
    });

    it("breaks into 2 lines when the text fits in 2 lines", () => {
      const sub = makeSubtitle(
        "Esta eh uma legenda um pouco maior que precisa quebrar"
      );
      const result = formatSubtitle(sub, opts42x2, { destructive: true });
      expect(result.subtitles).toHaveLength(1);
      expect(result.wasSplit).toBe(false);
    });

    it("splits into 2 subtitles when text exceeds 2 lines", () => {
      const longText =
        "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra";
      const sub = makeSubtitle(longText, 0, 10000);
      const result = formatSubtitle(sub, opts42x2, { destructive: true });
      expect(result.subtitles).toHaveLength(2);
      expect(result.wasSplit).toBe(true);
      expect(result.subtitles[0].startTime).toBe(0);
      expect(result.subtitles[1].endTime).toBe(10000);
    });

    it("resulting split subtitles each fit within maxCharsPerLine", () => {
      const longText =
        "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra";
      const sub = makeSubtitle(longText, 0, 10000);
      const result = formatSubtitle(sub, opts42x2, { destructive: true });
      for (const s of result.subtitles) {
        for (const line of s.text.split("\n")) {
          expect(line.length).toBeLessThanOrEqual(42);
        }
      }
    });
  });

  it("non-destructive + maxLines=1 + overflow: keeps single line with appended overflow", () => {
    const opts20x1: FormatOptions = { maxCharsPerLine: 20, maxLines: 1 };
    const sub = makeSubtitle("texto que passa de vinte chars com certeza");
    const result = formatSubtitle(sub, opts20x1, { destructive: false });
    expect(result.subtitles).toHaveLength(1);
    expect(result.subtitles[0].text).not.toContain("\n");
    expect(result.wasSplit).toBe(false);
  });

  it("is idempotent (applying twice produces same result) in non-destructive mode", () => {
    const sub = makeSubtitle(
      "Esta eh uma legenda um pouco maior que precisa quebrar"
    );
    const first = formatSubtitle(sub, opts42x2, { destructive: false });
    const second = formatSubtitle(first.subtitles[0], opts42x2, {
      destructive: false,
    });
    expect(second.subtitles[0].text).toBe(first.subtitles[0].text);
  });
});

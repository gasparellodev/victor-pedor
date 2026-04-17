import { describe, it, expect } from "vitest";
import type { Subtitle } from "@/types/subtitle";
import { formatAllSubtitles } from "./format-all";
import type { FormatOptions } from "./types";

const opts42x2: FormatOptions = { maxCharsPerLine: 42, maxLines: 2 };

describe("formatAllSubtitles", () => {
  it("returns empty array for empty input", () => {
    expect(formatAllSubtitles([], opts42x2, { destructive: false })).toEqual(
      []
    );
  });

  it("applies line-break across every subtitle (non-destructive)", () => {
    const subs: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 3000, text: "Curta" },
      {
        index: 2,
        startTime: 4000,
        endTime: 7000,
        text: "Esta eh uma legenda um pouco maior que precisa quebrar",
      },
    ];
    const result = formatAllSubtitles(subs, opts42x2, { destructive: false });
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Curta");
    expect(result[1].text).toContain("\n");
  });

  it("splits long subtitles into two when destructive=true and reindexes", () => {
    const subs: Subtitle[] = [
      {
        index: 1,
        startTime: 0,
        endTime: 10000,
        text: "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra",
      },
      { index: 2, startTime: 11000, endTime: 13000, text: "Curta" },
    ];
    const result = formatAllSubtitles(subs, opts42x2, { destructive: true });
    expect(result).toHaveLength(3);
    expect(result.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it("preserves subtitle order after split", () => {
    const subs: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 2000, text: "A" },
      {
        index: 2,
        startTime: 3000,
        endTime: 12000,
        text: "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra",
      },
      { index: 3, startTime: 13000, endTime: 14000, text: "B" },
    ];
    const result = formatAllSubtitles(subs, opts42x2, { destructive: true });
    expect(result[0].text).toBe("A");
    expect(result[result.length - 1].text).toBe("B");
  });
});

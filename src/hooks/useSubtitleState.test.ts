import { describe, it, expect } from "vitest";
import { subtitleReducer } from "./useSubtitleState";
import type { Subtitle } from "@/types/subtitle";
import type { FormatOptions } from "@/lib/subtitle-format";

const base: Subtitle[] = [
  { index: 1, startTime: 1000, endTime: 4000, text: "Primeira legenda" },
  { index: 2, startTime: 5000, endTime: 8000, text: "Segunda legenda" },
  { index: 3, startTime: 9000, endTime: 12000, text: "Terceira legenda" },
];

const opts42x2: FormatOptions = { maxCharsPerLine: 42, maxLines: 2 };

describe("subtitleReducer", () => {
  it("SET replaces all subtitles", () => {
    const newSubs: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 500, text: "New" },
    ];
    const result = subtitleReducer(base, { type: "SET", subtitles: newSubs });
    expect(result).toEqual(newSubs);
  });

  it("UPDATE_TEXT updates text for specific index", () => {
    const result = subtitleReducer(base, {
      type: "UPDATE_TEXT",
      index: 2,
      text: "Texto atualizado",
    });
    expect(result[1].text).toBe("Texto atualizado");
    expect(result[0].text).toBe("Primeira legenda");
  });

  it("UPDATE_START updates startTime", () => {
    const result = subtitleReducer(base, {
      type: "UPDATE_START",
      index: 1,
      startTime: 500,
    });
    expect(result[0].startTime).toBe(500);
  });

  it("UPDATE_END updates endTime", () => {
    const result = subtitleReducer(base, {
      type: "UPDATE_END",
      index: 1,
      endTime: 3500,
    });
    expect(result[0].endTime).toBe(3500);
  });

  it("DELETE removes subtitle and reindexes", () => {
    const result = subtitleReducer(base, { type: "DELETE", index: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].index).toBe(1);
    expect(result[1].index).toBe(2);
    expect(result[1].text).toBe("Terceira legenda");
  });

  it("INSERT adds subtitle after specified index", () => {
    const result = subtitleReducer(base, { type: "INSERT", afterIndex: 1 });
    expect(result).toHaveLength(4);
    expect(result[1].text).toBe("");
    expect(result[1].startTime).toBe(4100); // prev.endTime + 100
    expect(result[0].index).toBe(1);
    expect(result[1].index).toBe(2);
    expect(result[2].index).toBe(3);
    expect(result[3].index).toBe(4);
  });

  it("MERGE combines current with next subtitle", () => {
    const result = subtitleReducer(base, { type: "MERGE", index: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Primeira legenda Segunda legenda");
    expect(result[0].startTime).toBe(1000);
    expect(result[0].endTime).toBe(8000);
  });

  it("MERGE does nothing for last subtitle", () => {
    const result = subtitleReducer(base, { type: "MERGE", index: 3 });
    expect(result).toEqual(base);
  });

  it("SPLIT divides subtitle at word position", () => {
    const subs: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 5000, text: "Olá mundo bonito dia" },
    ];
    const result = subtitleReducer(subs, {
      type: "SPLIT",
      index: 1,
      splitAt: 2,
    });
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Olá mundo");
    expect(result[1].text).toBe("bonito dia");
    expect(result[0].index).toBe(1);
    expect(result[1].index).toBe(2);
  });

  it("SPLIT does nothing for single word", () => {
    const subs: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 2000, text: "Olá" },
    ];
    const result = subtitleReducer(subs, {
      type: "SPLIT",
      index: 1,
      splitAt: 1,
    });
    expect(result).toEqual(subs);
  });

  it("SHIFT_ALL offsets all timestamps", () => {
    const result = subtitleReducer(base, {
      type: "SHIFT_ALL",
      offsetMs: 500,
    });
    expect(result[0].startTime).toBe(1500);
    expect(result[0].endTime).toBe(4500);
    expect(result[1].startTime).toBe(5500);
  });

  it("SHIFT_ALL clamps to 0 for negative offset", () => {
    const result = subtitleReducer(base, {
      type: "SHIFT_ALL",
      offsetMs: -2000,
    });
    expect(result[0].startTime).toBe(0);
    expect(result[0].endTime).toBe(2000);
  });

  describe("FORMAT_TEXT", () => {
    it("inserts \\n in target subtitle text when it exceeds one line", () => {
      const subs: Subtitle[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 3000,
          text: "Esta eh uma legenda um pouco maior que precisa quebrar",
        },
      ];
      const result = subtitleReducer(subs, {
        type: "FORMAT_TEXT",
        index: 1,
        options: opts42x2,
      });
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain("\n");
    });

    it("leaves short text unchanged", () => {
      const result = subtitleReducer(base, {
        type: "FORMAT_TEXT",
        index: 1,
        options: opts42x2,
      });
      expect(result[0].text).toBe("Primeira legenda");
    });

    it("is a noop for invalid index", () => {
      const result = subtitleReducer(base, {
        type: "FORMAT_TEXT",
        index: 99,
        options: opts42x2,
      });
      expect(result).toEqual(base);
    });

    it("preserves timestamps", () => {
      const subs: Subtitle[] = [
        {
          index: 1,
          startTime: 1234,
          endTime: 5678,
          text: "Esta eh uma legenda um pouco maior que precisa quebrar",
        },
      ];
      const result = subtitleReducer(subs, {
        type: "FORMAT_TEXT",
        index: 1,
        options: opts42x2,
      });
      expect(result[0].startTime).toBe(1234);
      expect(result[0].endTime).toBe(5678);
    });

    it("never inserts or removes subtitles (non-destructive even with overflow)", () => {
      const subs: Subtitle[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 10000,
          text: "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra",
        },
      ];
      const result = subtitleReducer(subs, {
        type: "FORMAT_TEXT",
        index: 1,
        options: opts42x2,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("REFORMAT_ALL (non-destructive)", () => {
    it("applies line-break across every subtitle without splitting", () => {
      const subs: Subtitle[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 3000,
          text: "Esta eh uma legenda um pouco maior que precisa quebrar",
        },
        { index: 2, startTime: 4000, endTime: 6000, text: "Curta" },
      ];
      const result = subtitleReducer(subs, {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: false,
      });
      expect(result).toHaveLength(2);
      expect(result[0].text).toContain("\n");
      expect(result[1].text).toBe("Curta");
    });

    it("is idempotent (applying twice produces same result)", () => {
      const subs: Subtitle[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 3000,
          text: "Esta eh uma legenda um pouco maior que precisa quebrar",
        },
      ];
      const first = subtitleReducer(subs, {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: false,
      });
      const second = subtitleReducer(first, {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: false,
      });
      expect(second).toEqual(first);
    });

    it("is a noop for empty array", () => {
      const result = subtitleReducer([], {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: false,
      });
      expect(result).toEqual([]);
    });
  });

  describe("REFORMAT_ALL (destructive)", () => {
    it("splits a long subtitle into two and reindexes the array", () => {
      const subs: Subtitle[] = [
        {
          index: 1,
          startTime: 0,
          endTime: 10000,
          text: "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra",
        },
        { index: 2, startTime: 11000, endTime: 13000, text: "Curta" },
      ];
      const result = subtitleReducer(subs, {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: true,
      });
      expect(result).toHaveLength(3);
      expect(result.map((s) => s.index)).toEqual([1, 2, 3]);
      expect(result[2].text).toBe("Curta");
    });

    it("preserves the order of subtitles after reindex", () => {
      const subs: Subtitle[] = [
        { index: 1, startTime: 0, endTime: 2000, text: "A" },
        {
          index: 2,
          startTime: 2500,
          endTime: 12000,
          text: "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra",
        },
        { index: 3, startTime: 13000, endTime: 14000, text: "B" },
      ];
      const result = subtitleReducer(subs, {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: true,
      });
      expect(result).toHaveLength(4);
      expect(result[0].text).toBe("A");
      expect(result[3].text).toBe("B");
      expect(result.map((s) => s.index)).toEqual([1, 2, 3, 4]);
    });

    it("is a noop for empty array", () => {
      const result = subtitleReducer([], {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: true,
      });
      expect(result).toEqual([]);
    });

    it("does not split subtitles that fit within the limit", () => {
      const result = subtitleReducer(base, {
        type: "REFORMAT_ALL",
        options: opts42x2,
        destructive: true,
      });
      expect(result).toHaveLength(base.length);
    });
  });
});

import { describe, it, expect } from "vitest";
import { breakTextIntoLines } from "./break-lines";
import type { FormatOptions } from "./types";

const opts42x2: FormatOptions = { maxCharsPerLine: 42, maxLines: 2 };
const opts20x1: FormatOptions = { maxCharsPerLine: 20, maxLines: 1 };

describe("breakTextIntoLines", () => {
  it("returns text as single line when it fits in maxCharsPerLine", () => {
    const result = breakTextIntoLines("Ola mundo", opts42x2);
    expect(result.lines).toEqual(["Ola mundo"]);
    expect(result.overflow).toBeNull();
  });

  it("breaks into 2 lines respecting word boundaries when exceeds 1 line", () => {
    const text = "Esta eh uma legenda um pouco maior que precisa quebrar";
    const result = breakTextIntoLines(text, opts42x2);
    expect(result.lines).toHaveLength(2);
    expect(result.lines.every((l) => l.length <= 42)).toBe(true);
    expect(result.lines.join(" ")).toBe(text);
    expect(result.overflow).toBeNull();
  });

  it("never splits in the middle of a word", () => {
    const text = "palavraGigantona outra palavraGigantona mais uma";
    const result = breakTextIntoLines(text, opts42x2);
    for (const line of result.lines) {
      const words = line.split(" ");
      for (const w of words) {
        expect(text).toContain(w);
      }
    }
  });

  it("populates overflow when text exceeds maxCharsPerLine * maxLines", () => {
    const text =
      "Uma legenda muito muito longa que nao cabe em duas linhas do limite padrao e por isso sobra";
    const result = breakTextIntoLines(text, opts42x2);
    expect(result.lines).toHaveLength(2);
    expect(result.overflow).not.toBeNull();
    expect(result.overflow!.length).toBeGreaterThan(0);
    expect(result.lines.every((l) => l.length <= 42)).toBe(true);
  });

  it("accepts single long word on line 1 without splitting it (overflow visual)", () => {
    const text = "palavraabsurdamentelongaquenaocabeemlinhaalguma";
    const result = breakTextIntoLines(text, opts42x2);
    expect(result.lines[0]).toBe(text);
    expect(result.overflow).toBeNull();
  });

  it("returns single empty line for empty input", () => {
    const result = breakTextIntoLines("", opts42x2);
    expect(result.lines).toEqual([""]);
    expect(result.overflow).toBeNull();
  });

  it("normalizes multiple whitespace to single space", () => {
    const result = breakTextIntoLines("ola    mundo\n\nbonito", opts42x2);
    expect(result.lines).toEqual(["ola mundo bonito"]);
  });

  it("ignores pre-existing newlines and re-breaks from flat text", () => {
    const result = breakTextIntoLines("linha um\nlinha dois", opts42x2);
    expect(result.lines).toEqual(["linha um linha dois"]);
  });

  it("respects maxLines=1 configuration", () => {
    const result = breakTextIntoLines(
      "texto que passa de vinte chars com certeza",
      opts20x1
    );
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].length).toBeLessThanOrEqual(20);
    expect(result.overflow).not.toBeNull();
  });

  it("prefers balanced split closest to the middle for 2-line output", () => {
    const text = "aaaaa bbbbb ccccc ddddd eeeee fffff ggggg hhhhh";
    const result = breakTextIntoLines(text, opts42x2);
    expect(result.lines).toHaveLength(2);
    const diff = Math.abs(result.lines[0].length - result.lines[1].length);
    expect(diff).toBeLessThanOrEqual(6);
  });

  it("trims leading and trailing whitespace", () => {
    const result = breakTextIntoLines("   ola mundo   ", opts42x2);
    expect(result.lines).toEqual(["ola mundo"]);
  });
});

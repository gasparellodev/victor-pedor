import { describe, it, expect } from "vitest";
import { generateSrt } from "./generator";
import type { Subtitle } from "@/types/subtitle";

describe("generateSrt", () => {
  it("should generate valid SRT from subtitles", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 4000, text: "Olá mundo" },
      { index: 2, startTime: 5000, endTime: 8500, text: "Segunda legenda" },
    ];

    const result = generateSrt(subtitles);

    expect(result).toBe(
      `1\n00:00:01,000 --> 00:00:04,000\nOlá mundo\n\n2\n00:00:05,000 --> 00:00:08,500\nSegunda legenda\n`
    );
  });

  it("should re-index subtitles starting from 1", () => {
    const subtitles: Subtitle[] = [
      { index: 5, startTime: 1000, endTime: 2000, text: "A" },
      { index: 10, startTime: 3000, endTime: 4000, text: "B" },
    ];

    const result = generateSrt(subtitles);

    expect(result).toContain("1\n00:00:01,000");
    expect(result).toContain("2\n00:00:03,000");
  });

  it("should handle empty array", () => {
    const result = generateSrt([]);
    expect(result).toBe("");
  });

  it("should format timestamps correctly with padding", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 500, endTime: 1500, text: "Rápido" },
    ];

    const result = generateSrt(subtitles);

    expect(result).toContain("00:00:00,500 --> 00:00:01,500");
  });

  it("should handle large timestamps", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 5445123, endTime: 7200000, text: "Longo" },
    ];

    const result = generateSrt(subtitles);

    expect(result).toContain("01:30:45,123 --> 02:00:00,000");
  });

  it("should preserve multi-line text", () => {
    const subtitles: Subtitle[] = [
      {
        index: 1,
        startTime: 1000,
        endTime: 4000,
        text: "Primeira linha\nSegunda linha",
      },
    ];

    const result = generateSrt(subtitles);

    expect(result).toContain("Primeira linha\nSegunda linha");
  });

  it("should handle single subtitle", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 1000, text: "Único" },
    ];

    const result = generateSrt(subtitles);

    expect(result).toBe("1\n00:00:00,000 --> 00:00:01,000\nÚnico\n");
  });
});

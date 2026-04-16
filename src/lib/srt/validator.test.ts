import { describe, it, expect } from "vitest";
import { validateSrt } from "./validator";
import type { Subtitle } from "@/types/subtitle";

describe("validateSrt", () => {
  it("should return valid for correct subtitles", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 4000, text: "Olá" },
      { index: 2, startTime: 5000, endTime: 8000, text: "Mundo" },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect startTime >= endTime", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 4000, endTime: 1000, text: "Invertido" },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        index: 1,
        type: "invalid-timing",
      })
    );
  });

  it("should detect equal startTime and endTime", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 1000, text: "Zero" },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors[0].type).toBe("invalid-timing");
  });

  it("should detect overlapping timestamps", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 5000, text: "A" },
      { index: 2, startTime: 3000, endTime: 8000, text: "B" },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: "overlap",
      })
    );
  });

  it("should detect empty text", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 4000, text: "" },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: "empty-text",
      })
    );
  });

  it("should detect whitespace-only text", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 4000, text: "   " },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors[0].type).toBe("empty-text");
  });

  it("should detect unordered timestamps", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 5000, endTime: 8000, text: "B" },
      { index: 2, startTime: 1000, endTime: 4000, text: "A" },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: "unordered",
      })
    );
  });

  it("should return valid for empty array", () => {
    const result = validateSrt([]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return valid for single subtitle", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 1000, text: "Único" },
    ];

    const result = validateSrt(subtitles);
    expect(result.valid).toBe(true);
  });

  it("should detect negative timestamps", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: -1000, endTime: 1000, text: "Negativo" },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors[0].type).toBe("invalid-timing");
  });

  it("should collect multiple errors", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 4000, endTime: 1000, text: "" },
      { index: 2, startTime: 500, endTime: 2000, text: "  " },
    ];

    const result = validateSrt(subtitles);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

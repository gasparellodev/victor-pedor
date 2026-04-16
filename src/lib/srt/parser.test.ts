import { describe, it, expect } from "vitest";
import { parseSrt } from "./parser";

describe("parseSrt", () => {
  it("should parse a simple SRT string", () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Olá mundo

2
00:00:05,000 --> 00:00:08,500
Segunda legenda`;

    const result = parseSrt(srt);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      index: 1,
      startTime: 1000,
      endTime: 4000,
      text: "Olá mundo",
    });
    expect(result[1]).toEqual({
      index: 2,
      startTime: 5000,
      endTime: 8500,
      text: "Segunda legenda",
    });
  });

  it("should parse multi-line subtitle text", () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Primeira linha
Segunda linha`;

    const result = parseSrt(srt);

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Primeira linha\nSegunda linha");
  });

  it("should handle empty input", () => {
    const result = parseSrt("");
    expect(result).toEqual([]);
  });

  it("should handle whitespace-only input", () => {
    const result = parseSrt("   \n\n  ");
    expect(result).toEqual([]);
  });

  it("should parse timestamps with zero hours", () => {
    const srt = `1
00:00:00,000 --> 00:00:00,500
Rápido`;

    const result = parseSrt(srt);

    expect(result[0].startTime).toBe(0);
    expect(result[0].endTime).toBe(500);
  });

  it("should parse timestamps with large values", () => {
    const srt = `1
01:30:45,123 --> 02:00:00,000
Longo`;

    const result = parseSrt(srt);

    expect(result[0].startTime).toBe(5445123); // 1*3600000 + 30*60000 + 45*1000 + 123
    expect(result[0].endTime).toBe(7200000); // 2*3600000
  });

  it("should throw on invalid timestamp format", () => {
    const srt = `1
00:00:01 --> 00:00:04
Texto`;

    expect(() => parseSrt(srt)).toThrow();
  });

  it("should throw on missing arrow separator", () => {
    const srt = `1
00:00:01,000 00:00:04,000
Texto`;

    expect(() => parseSrt(srt)).toThrow();
  });

  it("should handle special characters in text", () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Café & Pão — "ótimo"`;

    const result = parseSrt(srt);
    expect(result[0].text).toBe('Café & Pão — "ótimo"');
  });

  it("should handle Windows-style line endings (CRLF)", () => {
    const srt = "1\r\n00:00:01,000 --> 00:00:04,000\r\nTexto\r\n";

    const result = parseSrt(srt);

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Texto");
  });

  it("should handle trailing newlines", () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Texto


`;

    const result = parseSrt(srt);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Texto");
  });
});

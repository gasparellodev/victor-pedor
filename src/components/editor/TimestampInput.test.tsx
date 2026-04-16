import { describe, it, expect } from "vitest";
import { formatTimestamp, parseTimestamp } from "./TimestampInput";

describe("formatTimestamp", () => {
  it("formats zero", () => {
    expect(formatTimestamp(0)).toBe("00:00:00,000");
  });

  it("formats simple seconds", () => {
    expect(formatTimestamp(5000)).toBe("00:00:05,000");
  });

  it("formats with milliseconds", () => {
    expect(formatTimestamp(1500)).toBe("00:00:01,500");
  });

  it("formats with hours", () => {
    expect(formatTimestamp(3661123)).toBe("01:01:01,123");
  });

  it("formats large values", () => {
    expect(formatTimestamp(7200000)).toBe("02:00:00,000");
  });
});

describe("parseTimestamp", () => {
  it("parses valid timestamp", () => {
    expect(parseTimestamp("01:30:45,123")).toBe(5445123);
  });

  it("parses zero", () => {
    expect(parseTimestamp("00:00:00,000")).toBe(0);
  });

  it("returns null for invalid format", () => {
    expect(parseTimestamp("invalid")).toBeNull();
  });

  it("returns null for missing milliseconds", () => {
    expect(parseTimestamp("00:00:01")).toBeNull();
  });

  it("returns null for wrong separator", () => {
    expect(parseTimestamp("00:00:01.000")).toBeNull();
  });
});

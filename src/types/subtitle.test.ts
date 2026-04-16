import { describe, it, expect } from "vitest";
import type { Subtitle } from "./subtitle";

describe("Subtitle type", () => {
  it("should create a valid subtitle object", () => {
    const subtitle: Subtitle = {
      index: 1,
      startTime: 0,
      endTime: 1000,
      text: "Olá mundo",
    };

    expect(subtitle.index).toBe(1);
    expect(subtitle.startTime).toBe(0);
    expect(subtitle.endTime).toBe(1000);
    expect(subtitle.text).toBe("Olá mundo");
  });
});

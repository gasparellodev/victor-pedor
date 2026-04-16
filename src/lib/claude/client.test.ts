import { describe, it, expect, vi, beforeEach } from "vitest";
import { correctSubtitles } from "./client";
import type { Subtitle } from "@/types/subtitle";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class {
      messages = { create: mockCreate };
    },
  };
});

describe("correctSubtitles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends subtitles to Claude and returns corrected text", async () => {
    const correctedData = [
      { index: 1, text: "Ele foi à loja." },
      { index: 2, text: "Comprou muitas coisas." },
    ];

    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify(correctedData),
        },
      ],
    });

    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 4000, text: "ele foi na loja" },
      { index: 2, startTime: 5000, endTime: 8000, text: "comprou muitas coisa" },
    ];

    const result = await correctSubtitles(subtitles);

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Ele foi à loja.");
    expect(result[1].text).toBe("Comprou muitas coisas.");
  });

  it("preserves original timestamps", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([{ index: 1, text: "Corrigido." }]),
        },
      ],
    });

    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1234, endTime: 5678, text: "original" },
    ];

    const result = await correctSubtitles(subtitles);

    expect(result[0].startTime).toBe(1234);
    expect(result[0].endTime).toBe(5678);
  });

  it("preserves original indices", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([{ index: 1, text: "Texto." }]),
        },
      ],
    });

    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 1000, text: "texto" },
    ];

    const result = await correctSubtitles(subtitles);
    expect(result[0].index).toBe(1);
  });

  it("calls Claude API with correct parameters", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "[]" }],
    });

    await correctSubtitles([]);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.stringContaining("claude"),
        max_tokens: expect.any(Number),
        system: expect.arrayContaining([
          expect.objectContaining({ type: "text" }),
        ]),
      })
    );
  });

  it("throws when Claude returns invalid JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "not valid json" }],
    });

    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 1000, text: "test" },
    ];

    await expect(correctSubtitles(subtitles)).rejects.toThrow();
  });

  it("throws when Claude returns mismatched subtitle count", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify([{ index: 1, text: "Only one" }]),
        },
      ],
    });

    const subtitles: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 1000, text: "A" },
      { index: 2, startTime: 2000, endTime: 3000, text: "B" },
    ];

    await expect(correctSubtitles(subtitles)).rejects.toThrow(
      "subtitle count mismatch"
    );
  });

  it("handles empty subtitles array", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "[]" }],
    });

    const result = await correctSubtitles([]);
    expect(result).toEqual([]);
  });
});

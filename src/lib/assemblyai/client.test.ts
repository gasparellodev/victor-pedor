import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitTranscription,
  checkTranscriptionStatus,
  wordsToSubtitles,
} from "./client";
import type { TranscribedWord } from "./client";

const { mockTranscribe, mockGet, mockUpload, mockBlobGet } = vi.hoisted(() => ({
  mockTranscribe: vi.fn(),
  mockGet: vi.fn(),
  mockUpload: vi.fn(),
  mockBlobGet: vi.fn(),
}));

vi.mock("assemblyai", () => ({
  AssemblyAI: class {
    transcripts = { transcribe: mockTranscribe, get: mockGet };
    files = { upload: mockUpload };
  },
}));

vi.mock("@vercel/blob", () => ({
  get: mockBlobGet,
}));

describe("submitTranscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads from Blob, uploads to AssemblyAI, and returns transcript ID", async () => {
    const mockBuffer = new ArrayBuffer(8);
    mockBlobGet.mockResolvedValue({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(mockBuffer));
          controller.close();
        },
      }),
    });
    mockUpload.mockResolvedValue("https://cdn.assemblyai.com/upload/abc123");
    mockTranscribe.mockResolvedValue({ id: "transcript_123", status: "queued" });

    const result = await submitTranscription("https://blob.vercel.com/video.mp4");

    expect(result).toBe("transcript_123");
    expect(mockBlobGet).toHaveBeenCalledWith("https://blob.vercel.com/video.mp4", { access: "private" });
    expect(mockUpload).toHaveBeenCalledOnce();
    expect(mockTranscribe).toHaveBeenCalledWith({
      audio_url: "https://cdn.assemblyai.com/upload/abc123",
      language_code: "pt",
      speech_models: ["universal-3-pro"],
    });
  });

  it("throws when blob not found", async () => {
    mockBlobGet.mockResolvedValue(null);

    await expect(
      submitTranscription("https://blob.vercel.com/video.mp4")
    ).rejects.toThrow("Failed to fetch video from storage: not found");
  });

  it("throws on API error", async () => {
    mockBlobGet.mockResolvedValue({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(8));
          controller.close();
        },
      }),
    });
    mockUpload.mockResolvedValue("https://cdn.assemblyai.com/upload/abc");
    mockTranscribe.mockRejectedValue(new Error("API Error"));

    await expect(
      submitTranscription("https://blob.vercel.com/video.mp4")
    ).rejects.toThrow("API Error");
  });
});

describe("checkTranscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns queued status", async () => {
    mockGet.mockResolvedValue({ status: "queued", words: null });

    const result = await checkTranscriptionStatus("transcript_123");

    expect(result).toEqual({ status: "queued" });
  });

  it("returns processing status", async () => {
    mockGet.mockResolvedValue({ status: "processing", words: null });

    const result = await checkTranscriptionStatus("transcript_123");

    expect(result).toEqual({ status: "processing" });
  });

  it("returns completed with words", async () => {
    mockGet.mockResolvedValue({
      status: "completed",
      words: [
        { text: "Olá", start: 1000, end: 1500, confidence: 0.95 },
        { text: "mundo", start: 1600, end: 2000, confidence: 0.9 },
      ],
    });

    const result = await checkTranscriptionStatus("transcript_123");

    expect(result.status).toBe("completed");
    expect(result.words).toHaveLength(2);
    expect(result.words![0].text).toBe("Olá");
  });

  it("returns error status with message", async () => {
    mockGet.mockResolvedValue({
      status: "error",
      error: "Audio too short",
      words: null,
    });

    const result = await checkTranscriptionStatus("transcript_123");

    expect(result.status).toBe("error");
    expect(result.error).toBe("Audio too short");
  });
});

describe("wordsToSubtitles", () => {
  it("groups words into subtitles", () => {
    const words: TranscribedWord[] = [
      { text: "Olá", start: 1000, end: 1500, confidence: 0.95 },
      { text: "mundo", start: 1600, end: 2000, confidence: 0.9 },
      { text: "como", start: 2100, end: 2400, confidence: 0.88 },
      { text: "vai?", start: 2500, end: 3000, confidence: 0.92 },
    ];

    const subtitles = wordsToSubtitles(words);

    expect(subtitles.length).toBeGreaterThanOrEqual(1);
    expect(subtitles[0].startTime).toBe(1000);
    expect(subtitles[0].text).toContain("Olá");
  });

  it("breaks on natural pauses (>500ms gap)", () => {
    const words: TranscribedWord[] = [
      { text: "Primeira", start: 1000, end: 1500, confidence: 0.9 },
      { text: "frase.", start: 1600, end: 2000, confidence: 0.9 },
      // 800ms gap — should break here
      { text: "Segunda", start: 2800, end: 3200, confidence: 0.9 },
      { text: "frase.", start: 3300, end: 3700, confidence: 0.9 },
    ];

    const subtitles = wordsToSubtitles(words);

    expect(subtitles).toHaveLength(2);
    expect(subtitles[0].text).toBe("Primeira frase.");
    expect(subtitles[1].text).toBe("Segunda frase.");
  });

  it("breaks on sentence-ending punctuation", () => {
    const words: TranscribedWord[] = [
      { text: "Isso", start: 1000, end: 1200, confidence: 0.9 },
      { text: "é", start: 1300, end: 1400, confidence: 0.9 },
      { text: "bom.", start: 1500, end: 1800, confidence: 0.9 },
      { text: "E", start: 1900, end: 2000, confidence: 0.9 },
      { text: "isso", start: 2100, end: 2300, confidence: 0.9 },
      { text: "também!", start: 2400, end: 2800, confidence: 0.9 },
    ];

    const subtitles = wordsToSubtitles(words);

    expect(subtitles).toHaveLength(2);
    expect(subtitles[0].text).toBe("Isso é bom.");
    expect(subtitles[1].text).toBe("E isso também!");
  });

  it("limits to 7 words per subtitle by default", () => {
    const words: TranscribedWord[] = Array.from({ length: 20 }, (_, i) => ({
      text: `palavra${i}`,
      start: i * 200,
      end: i * 200 + 150,
      confidence: 0.9,
    }));

    const subtitles = wordsToSubtitles(words);

    for (const sub of subtitles) {
      const wordCount = sub.text.split(" ").length;
      expect(wordCount).toBeLessThanOrEqual(7);
    }
  });

  it("breaks when accumulated chars exceed maxCharsPerLine * maxLines (default 84)", () => {
    const words: TranscribedWord[] = Array.from({ length: 5 }, (_, i) => ({
      text: "a".repeat(30),
      start: i * 200,
      end: i * 200 + 150,
      confidence: 0.9,
    }));

    const subtitles = wordsToSubtitles(words);

    for (const sub of subtitles) {
      expect(sub.text.length).toBeLessThanOrEqual(84);
    }
    expect(subtitles.length).toBeGreaterThanOrEqual(2);
  });

  it("respects custom maxCharsPerLine and maxLines", () => {
    const words: TranscribedWord[] = Array.from({ length: 10 }, (_, i) => ({
      text: "abcd",
      start: i * 200,
      end: i * 200 + 150,
      confidence: 0.9,
    }));

    const subtitles = wordsToSubtitles(words, {
      maxCharsPerLine: 20,
      maxLines: 1,
    });

    for (const sub of subtitles) {
      expect(sub.text.length).toBeLessThanOrEqual(20);
    }
  });

  it("does not produce empty subtitles even with a single oversize word", () => {
    const words: TranscribedWord[] = [
      {
        text: "palavragigantequepassadolimite".repeat(5),
        start: 0,
        end: 500,
        confidence: 0.9,
      },
      { text: "outra", start: 600, end: 800, confidence: 0.9 },
    ];

    const subtitles = wordsToSubtitles(words);

    expect(subtitles.every((s) => s.text.length > 0)).toBe(true);
    expect(subtitles).toHaveLength(2);
  });

  it("handles empty words array", () => {
    const subtitles = wordsToSubtitles([]);
    expect(subtitles).toEqual([]);
  });

  it("handles single word", () => {
    const words: TranscribedWord[] = [
      { text: "Olá", start: 1000, end: 1500, confidence: 0.9 },
    ];

    const subtitles = wordsToSubtitles(words);

    expect(subtitles).toHaveLength(1);
    expect(subtitles[0]).toEqual({
      index: 1,
      startTime: 1000,
      endTime: 1500,
      text: "Olá",
    });
  });

  it("assigns sequential indices starting from 1", () => {
    const words: TranscribedWord[] = [
      { text: "A.", start: 1000, end: 1500, confidence: 0.9 },
      { text: "B.", start: 3000, end: 3500, confidence: 0.9 },
      { text: "C.", start: 5000, end: 5500, confidence: 0.9 },
    ];

    const subtitles = wordsToSubtitles(words);

    subtitles.forEach((sub, i) => {
      expect(sub.index).toBe(i + 1);
    });
  });
});

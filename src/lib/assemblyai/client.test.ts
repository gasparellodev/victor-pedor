import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitTranscription,
  checkTranscriptionStatus,
  wordsToSubtitles,
} from "./client";
import type { TranscribedWord } from "./client";

const mockTranscribe = vi.fn();
const mockGet = vi.fn();
const mockUpload = vi.fn();

vi.mock("assemblyai", () => {
  return {
    AssemblyAI: class {
      transcripts = {
        transcribe: mockTranscribe,
        get: mockGet,
      };
      files = {
        upload: mockUpload,
      };
    },
  };
});

describe("submitTranscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches video, uploads to AssemblyAI, and returns transcript ID", async () => {
    const mockBuffer = new ArrayBuffer(8);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer),
    }));
    mockUpload.mockResolvedValue("https://cdn.assemblyai.com/upload/abc123");
    mockTranscribe.mockResolvedValue({ id: "transcript_123", status: "queued" });

    const result = await submitTranscription("https://blob.vercel.com/video.mp4");

    expect(result).toBe("transcript_123");
    expect(mockUpload).toHaveBeenCalledOnce();
    expect(mockTranscribe).toHaveBeenCalledWith({
      audio_url: "https://cdn.assemblyai.com/upload/abc123",
      language_code: "pt",
      speech_models: ["universal-3-pro"],
    });

    vi.unstubAllGlobals();
  });

  it("throws when video fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(
      submitTranscription("https://blob.vercel.com/video.mp4")
    ).rejects.toThrow("Failed to fetch video from storage: 404");

    vi.unstubAllGlobals();
  });

  it("throws on API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }));
    mockUpload.mockResolvedValue("https://cdn.assemblyai.com/upload/abc");
    mockTranscribe.mockRejectedValue(new Error("API Error"));

    await expect(
      submitTranscription("https://blob.vercel.com/video.mp4")
    ).rejects.toThrow("API Error");

    vi.unstubAllGlobals();
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

  it("limits to ~10 words per subtitle", () => {
    const words: TranscribedWord[] = Array.from({ length: 20 }, (_, i) => ({
      text: `palavra${i}`,
      start: i * 200,
      end: i * 200 + 150,
      confidence: 0.9,
    }));

    const subtitles = wordsToSubtitles(words);

    for (const sub of subtitles) {
      const wordCount = sub.text.split(" ").length;
      expect(wordCount).toBeLessThanOrEqual(10);
    }
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

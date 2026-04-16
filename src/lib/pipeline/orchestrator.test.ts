import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPipelineOrchestrator } from "./orchestrator";
import type { PipelineDeps } from "./orchestrator";
import type { PipelineStage } from "@/types/pipeline";

function createMockDeps(): PipelineDeps {
  return {
    uploadVideo: vi.fn().mockResolvedValue({ url: "https://blob.test/video.mp4" }),
    submitTranscription: vi.fn().mockResolvedValue("transcript_123"),
    checkTranscriptionStatus: vi.fn().mockResolvedValue({
      status: "completed",
      words: [
        { text: "Olá", start: 1000, end: 1500, confidence: 0.95 },
        { text: "mundo.", start: 1600, end: 2000, confidence: 0.9 },
      ],
    }),
    wordsToSubtitles: vi.fn().mockReturnValue([
      { index: 1, startTime: 1000, endTime: 2000, text: "Olá mundo." },
    ]),
    correctSubtitles: vi.fn().mockResolvedValue([
      { index: 1, startTime: 1000, endTime: 2000, text: "Olá, mundo." },
    ]),
  };
}

function createFile(): File {
  return new File([new ArrayBuffer(1024)], "video.mp4", { type: "video/mp4" });
}

describe("PipelineOrchestrator", () => {
  let deps: PipelineDeps;

  beforeEach(() => {
    deps = createMockDeps();
  });

  it("executes the full pipeline and returns corrected subtitles", async () => {
    const orchestrator = createPipelineOrchestrator(deps);
    const result = await orchestrator.process(createFile(), vi.fn());

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Olá, mundo.");
  });

  it("calls all pipeline steps in order", async () => {
    const callOrder: string[] = [];

    deps.uploadVideo = vi.fn().mockImplementation(async () => {
      callOrder.push("upload");
      return { url: "https://blob.test/video.mp4" };
    });
    deps.submitTranscription = vi.fn().mockImplementation(async () => {
      callOrder.push("submit");
      return "transcript_123";
    });
    deps.checkTranscriptionStatus = vi.fn().mockImplementation(async () => {
      callOrder.push("check");
      return {
        status: "completed",
        words: [{ text: "Teste.", start: 0, end: 500, confidence: 0.9 }],
      };
    });
    deps.wordsToSubtitles = vi.fn().mockImplementation(() => {
      callOrder.push("group");
      return [{ index: 1, startTime: 0, endTime: 500, text: "Teste." }];
    });
    deps.correctSubtitles = vi.fn().mockImplementation(async () => {
      callOrder.push("correct");
      return [{ index: 1, startTime: 0, endTime: 500, text: "Teste." }];
    });

    const orchestrator = createPipelineOrchestrator(deps);
    await orchestrator.process(createFile(), vi.fn());

    expect(callOrder).toEqual(["upload", "submit", "check", "group", "correct"]);
  });

  it("emits progress events for each stage", async () => {
    const stages: PipelineStage[] = [];
    const onProgress = vi.fn((stage: PipelineStage) => {
      stages.push(stage);
    });

    const orchestrator = createPipelineOrchestrator(deps);
    await orchestrator.process(createFile(), onProgress);

    expect(stages).toContain("uploading");
    expect(stages).toContain("transcribing");
    expect(stages).toContain("correcting");
  });

  it("polls transcription status when not completed", async () => {
    let callCount = 0;
    deps.checkTranscriptionStatus = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        return { status: "processing" };
      }
      return {
        status: "completed",
        words: [{ text: "OK.", start: 0, end: 500, confidence: 0.9 }],
      };
    });

    const orchestrator = createPipelineOrchestrator(deps, { pollingIntervalMs: 10 });
    await orchestrator.process(createFile(), vi.fn());

    expect(deps.checkTranscriptionStatus).toHaveBeenCalledTimes(3);
  });

  it("throws on upload failure with context", async () => {
    deps.uploadVideo = vi.fn().mockRejectedValue(new Error("Upload failed"));

    const orchestrator = createPipelineOrchestrator(deps);

    await expect(orchestrator.process(createFile(), vi.fn())).rejects.toThrow(
      "Upload failed"
    );
  });

  it("throws on transcription error", async () => {
    deps.checkTranscriptionStatus = vi.fn().mockResolvedValue({
      status: "error",
      error: "Audio too short",
    });

    const orchestrator = createPipelineOrchestrator(deps);

    await expect(orchestrator.process(createFile(), vi.fn())).rejects.toThrow(
      "Audio too short"
    );
  });

  it("throws on correction failure with context", async () => {
    deps.correctSubtitles = vi.fn().mockRejectedValue(new Error("API limit"));

    const orchestrator = createPipelineOrchestrator(deps);

    await expect(orchestrator.process(createFile(), vi.fn())).rejects.toThrow(
      "API limit"
    );
  });

  it("passes blob URL to submitTranscription", async () => {
    deps.uploadVideo = vi.fn().mockResolvedValue({ url: "https://blob.test/my-video.mp4" });

    const orchestrator = createPipelineOrchestrator(deps);
    await orchestrator.process(createFile(), vi.fn());

    expect(deps.submitTranscription).toHaveBeenCalledWith("https://blob.test/my-video.mp4");
  });
});

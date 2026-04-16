import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT, buildCorrectionPrompt } from "./prompts";
import type { Subtitle } from "@/types/subtitle";

describe("SYSTEM_PROMPT", () => {
  it("instructs to correct Portuguese grammar", () => {
    expect(SYSTEM_PROMPT).toContain("portuguesa");
    expect(SYSTEM_PROMPT).toContain("Gramática");
  });

  it("instructs to not alter meaning", () => {
    expect(SYSTEM_PROMPT).toContain("NÃO altere o sentido");
  });

  it("instructs to return JSON", () => {
    expect(SYSTEM_PROMPT).toContain("JSON");
  });

  it("instructs to return same number of subtitles", () => {
    expect(SYSTEM_PROMPT).toContain("EXATAMENTE o mesmo número");
  });
});

describe("buildCorrectionPrompt", () => {
  it("builds prompt with subtitle data as JSON", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 4000, text: "ele foi na loja" },
      { index: 2, startTime: 5000, endTime: 8000, text: "comprou muitas coisa" },
    ];

    const prompt = buildCorrectionPrompt(subtitles);

    expect(prompt).toContain('"index": 1');
    expect(prompt).toContain('"text": "ele foi na loja"');
    expect(prompt).toContain('"index": 2');
    expect(prompt).toContain("Corrija as legendas");
  });

  it("excludes timestamps from the prompt", () => {
    const subtitles: Subtitle[] = [
      { index: 1, startTime: 1000, endTime: 4000, text: "teste" },
    ];

    const prompt = buildCorrectionPrompt(subtitles);

    expect(prompt).not.toContain("startTime");
    expect(prompt).not.toContain("endTime");
  });

  it("handles empty subtitles", () => {
    const prompt = buildCorrectionPrompt([]);

    expect(prompt).toContain("[]");
  });
});

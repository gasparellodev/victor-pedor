import { describe, it, expect } from "vitest";
import {
  cssColorToAss,
  msToAssTimestamp,
  positionToAssAlignment,
  generateAssContent,
} from "./ass-generator";
import type { Subtitle } from "@/types/subtitle";
import { DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitle-style/presets";

describe("cssColorToAss", () => {
  it("converts opaque white #FFFFFF → &H00FFFFFF", () => {
    expect(cssColorToAss("#FFFFFF")).toBe("&H00FFFFFF");
  });

  it("converts opaque black #000000 → &H00000000", () => {
    expect(cssColorToAss("#000000")).toBe("&H00000000");
  });

  it("converts red #FF0000 → &H000000FF (BGR reversed)", () => {
    expect(cssColorToAss("#FF0000")).toBe("&H000000FF");
  });

  it("converts blue #0000FF → &H00FF0000 (BGR reversed)", () => {
    expect(cssColorToAss("#0000FF")).toBe("&H00FF0000");
  });

  it("converts semi-transparent black #00000080 → alpha inverted", () => {
    // Alpha 0x80 = 128, inverted = 255 - 128 = 127 = 0x7F
    expect(cssColorToAss("#00000080")).toBe("&H7F000000");
  });

  it("converts transparent → &H00000000", () => {
    expect(cssColorToAss("transparent")).toBe("&H00000000");
  });

  it("handles lowercase hex", () => {
    expect(cssColorToAss("#adc6ff")).toBe("&H00FFC6AD");
  });
});

describe("msToAssTimestamp", () => {
  it("converts 0ms → 0:00:00.00", () => {
    expect(msToAssTimestamp(0)).toBe("0:00:00.00");
  });

  it("converts 1000ms → 0:00:01.00", () => {
    expect(msToAssTimestamp(1000)).toBe("0:00:01.00");
  });

  it("converts 61500ms → 0:01:01.50", () => {
    expect(msToAssTimestamp(61500)).toBe("0:01:01.50");
  });

  it("converts 3661230ms → 1:01:01.23", () => {
    expect(msToAssTimestamp(3661230)).toBe("1:01:01.23");
  });

  it("pads minutes and seconds with zeros", () => {
    expect(msToAssTimestamp(5050)).toBe("0:00:05.05");
  });
});

describe("positionToAssAlignment", () => {
  it("maps bottom → 2", () => {
    expect(positionToAssAlignment("bottom")).toBe(2);
  });

  it("maps center → 5", () => {
    expect(positionToAssAlignment("center")).toBe(5);
  });

  it("maps top → 8", () => {
    expect(positionToAssAlignment("top")).toBe(8);
  });
});

describe("generateAssContent", () => {
  const sampleSubtitles: Subtitle[] = [
    { index: 1, startTime: 1000, endTime: 3500, text: "Hello, welcome" },
    { index: 2, startTime: 3500, endTime: 6200, text: "to our tutorial" },
  ];

  it("generates valid ASS header with Script Info", () => {
    const ass = generateAssContent(sampleSubtitles);
    expect(ass).toContain("[Script Info]");
    expect(ass).toContain("Title: SpeakChuk Video Export");
    expect(ass).toContain("ScriptType: v4.00+");
  });

  it("generates V4+ Styles section", () => {
    const ass = generateAssContent(sampleSubtitles);
    expect(ass).toContain("[V4+ Styles]");
    expect(ass).toContain("Style: Default,");
  });

  it("generates Events section with dialogue lines", () => {
    const ass = generateAssContent(sampleSubtitles);
    expect(ass).toContain("[Events]");
    expect(ass).toContain("Dialogue: 0,0:00:01.00,0:00:03.50,Default,,0,0,0,,Hello, welcome");
    expect(ass).toContain("Dialogue: 0,0:00:03.50,0:00:06.20,Default,,0,0,0,,to our tutorial");
  });

  it("applies font family from style", () => {
    const ass = generateAssContent(sampleSubtitles, {
      ...DEFAULT_SUBTITLE_STYLE,
      fontFamily: "Roboto Mono",
    });
    expect(ass).toContain("Style: Default,Roboto Mono,");
  });

  it("applies font size from style", () => {
    const ass = generateAssContent(sampleSubtitles, {
      ...DEFAULT_SUBTITLE_STYLE,
      fontSize: 36,
    });
    expect(ass).toContain(",36,");
  });

  it("applies bold for fontWeight >= 600", () => {
    const ass = generateAssContent(sampleSubtitles, {
      ...DEFAULT_SUBTITLE_STYLE,
      fontWeight: "700",
    });
    // Bold is -1 in ASS
    expect(ass).toMatch(/Style:.*,-1,0,0,0,/);
  });

  it("applies non-bold for fontWeight < 600", () => {
    const ass = generateAssContent(sampleSubtitles, {
      ...DEFAULT_SUBTITLE_STYLE,
      fontWeight: "400",
    });
    expect(ass).toMatch(/Style:.*,0,0,0,0,/);
  });

  it("applies position alignment", () => {
    const assTop = generateAssContent(sampleSubtitles, {
      ...DEFAULT_SUBTITLE_STYLE,
      position: "top",
    });
    // Alignment 8 = top-center
    expect(assTop).toContain(",8,40,40,40,1");

    const assCenter = generateAssContent(sampleSubtitles, {
      ...DEFAULT_SUBTITLE_STYLE,
      position: "center",
    });
    expect(assCenter).toContain(",5,40,40,40,1");
  });

  it("escapes newlines in subtitle text", () => {
    const subs: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 2000, text: "Line one\nLine two" },
    ];
    const ass = generateAssContent(subs);
    expect(ass).toContain("\\N");
    expect(ass).not.toContain("Line one\nLine two");
  });

  it("escapes curly braces in subtitle text", () => {
    const subs: Subtitle[] = [
      { index: 1, startTime: 0, endTime: 2000, text: "Use {bold} here" },
    ];
    const ass = generateAssContent(subs);
    expect(ass).toContain("\\{bold\\}");
  });

  it("uses DEFAULT_SUBTITLE_STYLE when no style provided", () => {
    const ass = generateAssContent(sampleSubtitles);
    expect(ass).toContain(`Style: Default,${DEFAULT_SUBTITLE_STYLE.fontFamily},`);
  });
});

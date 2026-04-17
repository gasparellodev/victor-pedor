import { describe, it, expect } from "vitest";
import { SubtitleStyleSchema, FONT_SIZE_MIN, FONT_SIZE_MAX, POSITION_OPTIONS } from "./types";
import {
  FONT_PRESETS,
  TEXT_COLOR_PRESETS,
  BG_COLOR_PRESETS,
  FONT_COLOR_PALETTE,
  OUTLINE_COLOR_PALETTE,
  DEFAULT_SUBTITLE_STYLE,
} from "./presets";

describe("SubtitleStyleSchema", () => {
  it("accepts a valid subtitle style", () => {
    const result = SubtitleStyleSchema.safeParse(DEFAULT_SUBTITLE_STYLE);
    expect(result.success).toBe(true);
  });

  it("rejects fontSize below minimum", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      fontSize: FONT_SIZE_MIN - 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects fontSize above maximum", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      fontSize: FONT_SIZE_MAX + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid position", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      position: "left",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid fontColor format", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      fontColor: "red",
    });
    expect(result.success).toBe(false);
  });

  it("accepts fontColor with alpha channel", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      fontColor: "#FFFFFF80",
    });
    expect(result.success).toBe(true);
  });

  it("accepts transparent backgroundColor", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      backgroundColor: "transparent",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty fontFamily", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      fontFamily: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid font weights", () => {
    for (const weight of ["400", "500", "600", "700"]) {
      const result = SubtitleStyleSchema.safeParse({
        ...DEFAULT_SUBTITLE_STYLE,
        fontWeight: weight,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("FONT_PRESETS", () => {
  it("has exactly 6 presets", () => {
    expect(FONT_PRESETS).toHaveLength(6);
  });

  it("each preset has required fields", () => {
    for (const preset of FONT_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.family).toBeTruthy();
      expect(preset.googleFont).toBeTruthy();
      expect(["sans-serif", "serif", "monospace"]).toContain(preset.category);
    }
  });
});

describe("COLOR_PRESETS", () => {
  it("all text colors are valid hex", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6,8}$/;
    for (const color of TEXT_COLOR_PRESETS) {
      expect(color).toMatch(hexRegex);
    }
  });

  it("all bg colors are valid hex or transparent", () => {
    const validRegex = /^#[0-9A-Fa-f]{6,8}$|^transparent$/;
    for (const color of BG_COLOR_PRESETS) {
      expect(color).toMatch(validRegex);
    }
  });
});

describe("DEFAULT_SUBTITLE_STYLE", () => {
  it("passes schema validation", () => {
    const result = SubtitleStyleSchema.safeParse(DEFAULT_SUBTITLE_STYLE);
    expect(result.success).toBe(true);
  });

  it("uses Manrope as default font", () => {
    expect(DEFAULT_SUBTITLE_STYLE.fontFamily).toBe("Manrope");
  });

  it("uses bottom position by default", () => {
    expect(DEFAULT_SUBTITLE_STYLE.position).toBe("bottom");
  });

  it("defaults maxCharsPerLine to 42", () => {
    expect(DEFAULT_SUBTITLE_STYLE.maxCharsPerLine).toBe(42);
  });

  it("defaults maxLines to 2", () => {
    expect(DEFAULT_SUBTITLE_STYLE.maxLines).toBe(2);
  });

  it("does not set anchor by default (keeps bottom-center fallback)", () => {
    expect(DEFAULT_SUBTITLE_STYLE.anchor).toBeUndefined();
  });

  it("defaults backgroundColor to transparent (no caption box)", () => {
    expect(DEFAULT_SUBTITLE_STYLE.backgroundColor).toBe("transparent");
  });

  it("defaults outlineWidth to 2 (visible stroke)", () => {
    expect(DEFAULT_SUBTITLE_STYLE.outlineWidth).toBe(2);
  });

  it("defaults outlineColor to black (#000000)", () => {
    expect(DEFAULT_SUBTITLE_STYLE.outlineColor).toBe("#000000");
  });
});

describe("FONT_COLOR_PALETTE", () => {
  it("exposes exactly 3 swatches: white, yellow, black", () => {
    expect(FONT_COLOR_PALETTE).toEqual(["#FFFFFF", "#FFD600", "#000000"]);
  });
});

describe("OUTLINE_COLOR_PALETTE", () => {
  it("exposes exactly 2 swatches: black, white", () => {
    expect(OUTLINE_COLOR_PALETTE).toEqual(["#000000", "#FFFFFF"]);
  });
});

describe("SubtitleStyleSchema outline fields", () => {
  it("accepts outlineWidth at boundaries (0 and 8)", () => {
    expect(
      SubtitleStyleSchema.safeParse({
        ...DEFAULT_SUBTITLE_STYLE,
        outlineWidth: 0,
      }).success
    ).toBe(true);
    expect(
      SubtitleStyleSchema.safeParse({
        ...DEFAULT_SUBTITLE_STYLE,
        outlineWidth: 8,
      }).success
    ).toBe(true);
  });

  it("rejects outlineWidth below 0", () => {
    expect(
      SubtitleStyleSchema.safeParse({
        ...DEFAULT_SUBTITLE_STYLE,
        outlineWidth: -1,
      }).success
    ).toBe(false);
  });

  it("rejects outlineWidth above 8", () => {
    expect(
      SubtitleStyleSchema.safeParse({
        ...DEFAULT_SUBTITLE_STYLE,
        outlineWidth: 9,
      }).success
    ).toBe(false);
  });

  it("rejects outlineColor in invalid format", () => {
    expect(
      SubtitleStyleSchema.safeParse({
        ...DEFAULT_SUBTITLE_STYLE,
        outlineColor: "black",
      }).success
    ).toBe(false);
  });

  it("accepts outline fields as optional (legacy styles still parse)", () => {
    const legacy = {
      fontFamily: "Manrope",
      fontSize: 24,
      fontWeight: "700",
      fontColor: "#FFFFFF",
      backgroundColor: "#00000080",
      position: "bottom",
    };
    expect(SubtitleStyleSchema.safeParse(legacy).success).toBe(true);
  });
});

describe("SubtitleStyleSchema backward compatibility", () => {
  it("accepts legacy style without maxCharsPerLine/maxLines/anchor", () => {
    const legacy = {
      fontFamily: "Manrope",
      fontSize: 24,
      fontWeight: "700",
      fontColor: "#FFFFFF",
      backgroundColor: "#00000080",
      position: "bottom",
    };
    const result = SubtitleStyleSchema.safeParse(legacy);
    expect(result.success).toBe(true);
  });

  it("rejects maxCharsPerLine below minimum", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      maxCharsPerLine: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxCharsPerLine above maximum", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      maxCharsPerLine: 80,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxLines other than 1 or 2", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      maxLines: 3,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid anchor", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      anchor: { xPercent: 50, yPercent: 85 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects anchor with xPercent out of range", () => {
    const result = SubtitleStyleSchema.safeParse({
      ...DEFAULT_SUBTITLE_STYLE,
      anchor: { xPercent: 120, yPercent: 50 },
    });
    expect(result.success).toBe(false);
  });
});

describe("POSITION_OPTIONS", () => {
  it("has exactly 3 options", () => {
    expect(POSITION_OPTIONS).toHaveLength(3);
  });

  it("contains top, center, bottom", () => {
    expect(POSITION_OPTIONS).toContain("top");
    expect(POSITION_OPTIONS).toContain("center");
    expect(POSITION_OPTIONS).toContain("bottom");
  });
});

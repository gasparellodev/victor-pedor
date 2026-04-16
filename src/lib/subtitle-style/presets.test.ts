import { describe, it, expect } from "vitest";
import { SubtitleStyleSchema, FONT_SIZE_MIN, FONT_SIZE_MAX, POSITION_OPTIONS } from "./types";
import {
  FONT_PRESETS,
  TEXT_COLOR_PRESETS,
  BG_COLOR_PRESETS,
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

import type { Subtitle } from "@/types/subtitle";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitle-style/presets";

/**
 * Convert CSS hex color (#RRGGBB or #RRGGBBAA) to ASS color format (&HAABBGGRR)
 */
export function cssColorToAss(cssColor: string): string {
  if (cssColor === "transparent") return "&H00000000";

  const hex = cssColor.replace("#", "");
  const r = hex.slice(0, 2);
  const g = hex.slice(2, 4);
  const b = hex.slice(4, 6);
  // CSS alpha: 00=transparent, FF=opaque; ASS alpha: 00=opaque, FF=transparent
  const cssAlpha = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 255;
  const assAlpha = (255 - cssAlpha).toString(16).padStart(2, "0").toUpperCase();
  return `&H${assAlpha}${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}`;
}

/**
 * Convert milliseconds to ASS timestamp format (H:MM:SS.cc)
 */
export function msToAssTimestamp(ms: number): string {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.round((totalSeconds % 1) * 100);

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

/**
 * Map SubtitleStyle position to ASS alignment code
 * ASS alignment (numpad layout): 1-3=bottom, 4-6=middle, 7-9=top
 * We use center-aligned: 2=bottom-center, 5=middle-center, 8=top-center
 */
export function positionToAssAlignment(position: SubtitleStyle["position"]): number {
  switch (position) {
    case "top": return 8;
    case "center": return 5;
    case "bottom": return 2;
  }
}

/**
 * Map fontWeight string to ASS bold flag
 */
function fontWeightToBold(weight: string): number {
  return parseInt(weight, 10) >= 600 ? -1 : 0;
}

/**
 * Escape special ASS characters in subtitle text
 */
function escapeAssText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\N")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

/**
 * Generate complete ASS file content from subtitles and style
 */
export function generateAssContent(
  subtitles: Subtitle[],
  style: SubtitleStyle = DEFAULT_SUBTITLE_STYLE
): string {
  const primaryColor = cssColorToAss(style.fontColor);
  const backColor = cssColorToAss(style.backgroundColor);
  const alignment = positionToAssAlignment(style.position);
  const bold = fontWeightToBold(style.fontWeight);

  const header = `[Script Info]
Title: SpeakChuk Video Export
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},${primaryColor},${primaryColor},&H00000000,${backColor},${bold},0,0,0,100,100,0,0,3,0,0,${alignment},40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const dialogueLines = subtitles.map((sub) => {
    const start = msToAssTimestamp(sub.startTime);
    const end = msToAssTimestamp(sub.endTime);
    const text = escapeAssText(sub.text);
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
  });

  return `${header}\n${dialogueLines.join("\n")}\n`;
}

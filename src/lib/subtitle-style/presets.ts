import type { SubtitleStyle } from "./types";

export interface FontPreset {
  name: string;
  family: string;
  googleFont: string;
  category: "sans-serif" | "serif" | "monospace";
}

export const FONT_PRESETS: FontPreset[] = [
  { name: "Manrope", family: "Manrope", googleFont: "Manrope:wght@400;500;600;700", category: "sans-serif" },
  { name: "Inter", family: "Inter", googleFont: "Inter:wght@400;500;600;700", category: "sans-serif" },
  { name: "Roboto Mono", family: "Roboto Mono", googleFont: "Roboto+Mono:wght@400;500;600;700", category: "monospace" },
  { name: "Montserrat", family: "Montserrat", googleFont: "Montserrat:wght@400;500;600;700", category: "sans-serif" },
  { name: "Playfair Display", family: "Playfair Display", googleFont: "Playfair+Display:wght@400;500;600;700", category: "serif" },
  { name: "Open Sans", family: "Open Sans", googleFont: "Open+Sans:wght@400;500;600;700", category: "sans-serif" },
];

export const TEXT_COLOR_PRESETS = [
  "#FFFFFF",
  "#E1E2EC",
  "#FFD700",
  "#00FF88",
  "#FF6B6B",
  "#ADC6FF",
];

export const BG_COLOR_PRESETS = [
  "#00000080",
  "#000000CC",
  "#000000",
  "transparent",
];

export const FONT_COLOR_PALETTE = ["#FFFFFF", "#FFD600", "#000000"] as const;

export const OUTLINE_COLOR_PALETTE = ["#000000", "#FFFFFF"] as const;

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: "Manrope",
  fontSize: 24,
  fontWeight: "700",
  fontColor: "#FFFFFF",
  backgroundColor: "transparent",
  position: "bottom",
  outlineWidth: 2,
  outlineColor: "#000000",
  maxCharsPerLine: 42,
  maxLines: 2,
};

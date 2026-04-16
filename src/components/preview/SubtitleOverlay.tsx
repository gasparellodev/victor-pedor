"use client";

import type { Subtitle } from "@/types/subtitle";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { FONT_PRESETS } from "@/lib/subtitle-style/presets";

interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  currentTime: number;
  style?: SubtitleStyle;
}

const positionClasses = {
  top: "top-6",
  center: "top-1/2 -translate-y-1/2",
  bottom: "bottom-12",
};

export function SubtitleOverlay({ subtitles, currentTime, style }: SubtitleOverlayProps) {
  const active = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  if (!active) return null;

  const posClass = positionClasses[style?.position ?? "bottom"];

  const fontPreset = FONT_PRESETS.find((p) => p.family === style?.fontFamily);
  const fallbackFamily = fontPreset?.category ?? "sans-serif";

  const inlineStyle: React.CSSProperties = style
    ? {
        fontFamily: `"${style.fontFamily}", ${fallbackFamily}`,
        fontSize: `${style.fontSize}px`,
        fontWeight: parseInt(style.fontWeight, 10),
        color: style.fontColor,
        backgroundColor: style.backgroundColor === "transparent" ? "transparent" : style.backgroundColor,
      }
    : {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "#FFFFFF",
      };

  return (
    <div className={`absolute ${posClass} left-0 right-0 flex justify-center pointer-events-none px-4`}>
      <span
        className="backdrop-blur-sm px-5 py-2.5 rounded-lg max-w-[85%] text-center whitespace-pre-line leading-relaxed shadow-lg"
        style={inlineStyle}
      >
        {active.text}
      </span>
    </div>
  );
}

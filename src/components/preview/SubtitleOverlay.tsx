"use client";

import type { Subtitle } from "@/types/subtitle";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { FONT_PRESETS } from "@/lib/subtitle-style/presets";

interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  currentTime: number;
  style?: SubtitleStyle;
}

export function SubtitleOverlay({ subtitles, currentTime, style }: SubtitleOverlayProps) {
  const active = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  if (!active) return null;

  const fontPreset = FONT_PRESETS.find((p) => p.family === style?.fontFamily);
  const fallbackFamily = fontPreset?.category ?? "sans-serif";

  const inlineStyle: React.CSSProperties = style
    ? {
        fontFamily: `"${style.fontFamily}", ${fallbackFamily}`,
        fontSize: `${style.fontSize}px`,
        fontWeight: parseInt(style.fontWeight, 10),
        color: style.fontColor,
      }
    : {
        color: "#FFFFFF",
      };

  const bgColor = style?.backgroundColor ?? "rgba(0, 0, 0, 0.4)";
  const showBg = bgColor !== "transparent";

  return (
    <div className="absolute bottom-12 left-0 right-0 flex justify-center px-12 pointer-events-none z-10">
      <p
        className={`text-2xl font-bold text-center px-4 py-2 rounded-lg font-headline tracking-tight max-w-[85%] whitespace-pre-line leading-relaxed ${
          showBg ? "backdrop-blur-sm border border-white/10" : ""
        }`}
        style={{
          ...inlineStyle,
          backgroundColor: showBg ? bgColor : "transparent",
        }}
      >
        {active.text}
      </p>
    </div>
  );
}

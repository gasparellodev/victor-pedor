"use client";

import { useRef } from "react";
import type { Subtitle } from "@/types/subtitle";
import type {
  SubtitleAnchor,
  SubtitleStyle,
} from "@/lib/subtitle-style/types";
import { FONT_PRESETS } from "@/lib/subtitle-style/presets";
import { useDraggableOverlay } from "@/hooks/useDraggableOverlay";

interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  currentTime: number;
  style?: SubtitleStyle;
  draggable?: boolean;
  onAnchorChange?: (anchor: SubtitleAnchor) => void;
}

export function SubtitleOverlay({
  subtitles,
  currentTime,
  style,
  draggable = false,
  onAnchorChange,
}: SubtitleOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { anchor, isDragging, onPointerDown } = useDraggableOverlay({
    containerRef,
    enabled: draggable,
    initialAnchor: style?.anchor,
    onChange: onAnchorChange,
  });

  const active = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const effectiveAnchor = anchor ?? style?.anchor ?? null;

  if (!active) {
    if (!draggable) return null;
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-10"
      />
    );
  }

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

  const containerClass = draggable
    ? "absolute inset-0 z-10"
    : "absolute inset-0 pointer-events-none z-10";

  const paragraphPositionClass = effectiveAnchor
    ? ""
    : "absolute bottom-12 left-0 right-0 flex justify-center px-12";

  const paragraphPositionStyle: React.CSSProperties = effectiveAnchor
    ? {
        position: "absolute",
        left: `${effectiveAnchor.xPercent}%`,
        top: `${effectiveAnchor.yPercent}%`,
        transform: "translate(-50%, -50%)",
      }
    : {};

  const paragraphCursorClass = draggable
    ? isDragging
      ? "cursor-grabbing"
      : "cursor-grab"
    : "";

  const paragraphPointerClass = draggable
    ? "pointer-events-auto select-none"
    : "pointer-events-none";

  return (
    <div ref={containerRef} className={containerClass}>
      {effectiveAnchor ? (
        <p
          onPointerDown={onPointerDown}
          className={`text-2xl font-bold text-center px-4 py-2 rounded-lg font-headline tracking-tight max-w-[85%] whitespace-pre-line leading-relaxed ${
            showBg ? "backdrop-blur-sm border border-white/10" : ""
          } ${paragraphCursorClass} ${paragraphPointerClass}`}
          style={{
            ...inlineStyle,
            backgroundColor: showBg ? bgColor : "transparent",
            ...paragraphPositionStyle,
          }}
        >
          {active.text}
        </p>
      ) : (
        <div className={paragraphPositionClass}>
          <p
            onPointerDown={onPointerDown}
            className={`text-2xl font-bold text-center px-4 py-2 rounded-lg font-headline tracking-tight max-w-[85%] whitespace-pre-line leading-relaxed ${
              showBg ? "backdrop-blur-sm border border-white/10" : ""
            } ${paragraphCursorClass} ${paragraphPointerClass}`}
            style={{
              ...inlineStyle,
              backgroundColor: showBg ? bgColor : "transparent",
            }}
          >
            {active.text}
          </p>
        </div>
      )}
    </div>
  );
}

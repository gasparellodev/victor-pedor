"use client";

import type { Subtitle } from "@/types/subtitle";

interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  currentTime: number;
}

export function SubtitleOverlay({ subtitles, currentTime }: SubtitleOverlayProps) {
  const active = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  if (!active) return null;

  return (
    <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none px-4">
      <span className="bg-black/80 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg text-[15px] font-medium max-w-[85%] text-center whitespace-pre-line leading-relaxed shadow-lg">
        {active.text}
      </span>
    </div>
  );
}

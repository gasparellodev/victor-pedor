"use client";

import type { Subtitle } from "@/types/subtitle";

interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  currentTime: number; // milliseconds
}

export function SubtitleOverlay({ subtitles, currentTime }: SubtitleOverlayProps) {
  const active = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  if (!active) return null;

  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
      <span className="bg-black/75 text-white px-4 py-2 rounded-lg text-lg font-medium max-w-[80%] text-center whitespace-pre-line">
        {active.text}
      </span>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitle-style/presets";

interface UseSubtitleStyleOptions {
  videoId?: string | null;
  initialStyle?: SubtitleStyle | null;
}

export function useSubtitleStyle({ videoId, initialStyle }: UseSubtitleStyleOptions = {}) {
  const [style, setStyle] = useState<SubtitleStyle>(
    () => initialStyle ?? DEFAULT_SUBTITLE_STYLE
  );

  // Auto-save to DB with debounce (skip initial load)
  const savedOnceRef = useRef(false);
  useEffect(() => {
    if (!videoId) return;

    if (!savedOnceRef.current) {
      savedOnceRef.current = true;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtitleStyle: style }),
        });
        if (!res.ok) {
          console.error("Failed to save subtitle style:", res.status);
        }
      } catch (err) {
        console.error("Failed to save subtitle style:", err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [style, videoId]);

  const updateStyle = useCallback((partial: Partial<SubtitleStyle>) => {
    setStyle((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetStyle = useCallback(() => {
    setStyle(DEFAULT_SUBTITLE_STYLE);
  }, []);

  return { style, updateStyle, resetStyle };
}

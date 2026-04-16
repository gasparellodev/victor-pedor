"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { SubtitleStyle } from "@/lib/subtitle-style/types";
import { DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitle-style/presets";

type Action =
  | { type: "SET"; style: SubtitleStyle }
  | { type: "UPDATE"; partial: Partial<SubtitleStyle> }
  | { type: "RESET" };

function reducer(state: SubtitleStyle, action: Action): SubtitleStyle {
  switch (action.type) {
    case "SET":
      return action.style;
    case "UPDATE":
      return { ...state, ...action.partial };
    case "RESET":
      return DEFAULT_SUBTITLE_STYLE;
  }
}

interface UseSubtitleStyleReturn {
  style: SubtitleStyle;
  updateStyle: (partial: Partial<SubtitleStyle>) => void;
  resetStyle: () => void;
  setStyle: (style: SubtitleStyle) => void;
}

export function useSubtitleStyle(videoId?: string | null): UseSubtitleStyleReturn {
  const [style, dispatch] = useReducer(reducer, DEFAULT_SUBTITLE_STYLE);

  // Auto-save to DB with debounce (skip initial renders)
  const renderCountRef = useRef(0);
  useEffect(() => {
    if (!videoId) return;

    renderCountRef.current++;
    if (renderCountRef.current <= 1) return;

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
    dispatch({ type: "UPDATE", partial });
  }, []);

  const resetStyle = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const setStyle = useCallback((s: SubtitleStyle) => {
    dispatch({ type: "SET", style: s });
  }, []);

  return { style, updateStyle, resetStyle, setStyle };
}

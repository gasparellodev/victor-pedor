"use client";

import { useReducer } from "react";
import type { Subtitle } from "@/types/subtitle";

export type SubtitleAction =
  | { type: "SET"; subtitles: Subtitle[] }
  | { type: "UPDATE_TEXT"; index: number; text: string }
  | { type: "UPDATE_START"; index: number; startTime: number }
  | { type: "UPDATE_END"; index: number; endTime: number }
  | { type: "DELETE"; index: number }
  | { type: "INSERT"; afterIndex: number }
  | { type: "MERGE"; index: number }
  | { type: "SPLIT"; index: number; splitAt: number }
  | { type: "SHIFT_ALL"; offsetMs: number };

function reindex(subtitles: Subtitle[]): Subtitle[] {
  return subtitles.map((s, i) => ({ ...s, index: i + 1 }));
}

export function subtitleReducer(
  state: Subtitle[],
  action: SubtitleAction
): Subtitle[] {
  switch (action.type) {
    case "SET":
      return action.subtitles;

    case "UPDATE_TEXT":
      return state.map((s) =>
        s.index === action.index ? { ...s, text: action.text } : s
      );

    case "UPDATE_START":
      return state.map((s) =>
        s.index === action.index ? { ...s, startTime: action.startTime } : s
      );

    case "UPDATE_END":
      return state.map((s) =>
        s.index === action.index ? { ...s, endTime: action.endTime } : s
      );

    case "DELETE":
      return reindex(state.filter((s) => s.index !== action.index));

    case "INSERT": {
      const afterIdx = state.findIndex((s) => s.index === action.afterIndex);
      if (afterIdx === -1) return state;

      const prev = state[afterIdx];
      const next = state[afterIdx + 1];

      const newStart = prev.endTime + 100;
      const newEnd = next ? next.startTime - 100 : prev.endTime + 2000;

      const newSubtitle: Subtitle = {
        index: 0,
        startTime: newStart,
        endTime: Math.max(newEnd, newStart + 500),
        text: "",
      };

      const result = [...state];
      result.splice(afterIdx + 1, 0, newSubtitle);
      return reindex(result);
    }

    case "MERGE": {
      const idx = state.findIndex((s) => s.index === action.index);
      if (idx === -1 || idx >= state.length - 1) return state;

      const current = state[idx];
      const next = state[idx + 1];

      const merged: Subtitle = {
        index: 0,
        startTime: current.startTime,
        endTime: next.endTime,
        text: `${current.text} ${next.text}`,
      };

      const result = [...state];
      result.splice(idx, 2, merged);
      return reindex(result);
    }

    case "SPLIT": {
      const idx = state.findIndex((s) => s.index === action.index);
      if (idx === -1) return state;

      const original = state[idx];
      const words = original.text.split(" ");

      if (words.length < 2) return state;

      const splitPoint = Math.min(action.splitAt, words.length - 1);
      const duration = original.endTime - original.startTime;
      const midTime =
        original.startTime + Math.floor((duration * splitPoint) / words.length);

      const first: Subtitle = {
        index: 0,
        startTime: original.startTime,
        endTime: midTime,
        text: words.slice(0, splitPoint).join(" "),
      };

      const second: Subtitle = {
        index: 0,
        startTime: midTime + 1,
        endTime: original.endTime,
        text: words.slice(splitPoint).join(" "),
      };

      const result = [...state];
      result.splice(idx, 1, first, second);
      return reindex(result);
    }

    case "SHIFT_ALL":
      return state.map((s) => ({
        ...s,
        startTime: Math.max(0, s.startTime + action.offsetMs),
        endTime: Math.max(0, s.endTime + action.offsetMs),
      }));

    default:
      return state;
  }
}

export function useSubtitleState(initial: Subtitle[] = []) {
  return useReducer(subtitleReducer, initial);
}

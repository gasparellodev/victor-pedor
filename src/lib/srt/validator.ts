import type { Subtitle } from "@/types/subtitle";

export interface ValidationError {
  index: number;
  type: "invalid-timing" | "overlap" | "empty-text" | "unordered";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateSrt(subtitles: Subtitle[]): ValidationResult {
  const errors: ValidationError[] = [];

  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];

    if (sub.startTime < 0 || sub.endTime < 0 || sub.startTime >= sub.endTime) {
      errors.push({
        index: sub.index,
        type: "invalid-timing",
        message: `Subtitle ${sub.index}: startTime (${sub.startTime}) must be less than endTime (${sub.endTime}) and both must be non-negative`,
      });
    }

    if (!sub.text.trim()) {
      errors.push({
        index: sub.index,
        type: "empty-text",
        message: `Subtitle ${sub.index}: text is empty`,
      });
    }

    if (i > 0) {
      const prev = subtitles[i - 1];

      if (sub.startTime < prev.startTime) {
        errors.push({
          index: sub.index,
          type: "unordered",
          message: `Subtitle ${sub.index}: starts before previous subtitle ${prev.index}`,
        });
      }

      if (sub.startTime < prev.endTime) {
        errors.push({
          index: sub.index,
          type: "overlap",
          message: `Subtitle ${sub.index}: overlaps with subtitle ${prev.index}`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

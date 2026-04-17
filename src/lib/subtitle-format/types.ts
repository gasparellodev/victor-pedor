import { z } from "zod/v4";

export const MAX_CHARS_PER_LINE_MIN = 20;
export const MAX_CHARS_PER_LINE_MAX = 60;
export const DEFAULT_MAX_CHARS_PER_LINE = 42;
export const DEFAULT_MAX_LINES = 2;

export const FormatOptionsSchema = z.object({
  maxCharsPerLine: z
    .number()
    .int()
    .min(MAX_CHARS_PER_LINE_MIN)
    .max(MAX_CHARS_PER_LINE_MAX),
  maxLines: z.union([z.literal(1), z.literal(2)]),
});

export type FormatOptions = z.infer<typeof FormatOptionsSchema>;

export interface BreakResult {
  lines: string[];
  overflow: string | null;
}

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  maxCharsPerLine: DEFAULT_MAX_CHARS_PER_LINE,
  maxLines: DEFAULT_MAX_LINES,
};

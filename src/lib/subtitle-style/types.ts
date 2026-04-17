import { z } from "zod/v4";
import {
  MAX_CHARS_PER_LINE_MAX,
  MAX_CHARS_PER_LINE_MIN,
} from "../subtitle-format/types";

export const FONT_SIZE_MIN = 16;
export const FONT_SIZE_MAX = 48;

export const POSITION_OPTIONS = ["top", "center", "bottom"] as const;

export const AnchorSchema = z.object({
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
});

export type SubtitleAnchor = z.infer<typeof AnchorSchema>;

export const SubtitleStyleSchema = z.object({
  fontFamily: z.string().min(1).regex(/^[a-zA-Z0-9 -]+$/),
  fontSize: z.number().int().min(FONT_SIZE_MIN).max(FONT_SIZE_MAX),
  fontWeight: z.enum(["400", "500", "600", "700"]),
  fontColor: z.string().regex(/^#[0-9a-fA-F]{6,8}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6,8}$|^transparent$/),
  position: z.enum(POSITION_OPTIONS),
  maxCharsPerLine: z
    .number()
    .int()
    .min(MAX_CHARS_PER_LINE_MIN)
    .max(MAX_CHARS_PER_LINE_MAX)
    .optional(),
  maxLines: z.union([z.literal(1), z.literal(2)]).optional(),
  anchor: AnchorSchema.optional(),
});

export type SubtitleStyle = z.infer<typeof SubtitleStyleSchema>;

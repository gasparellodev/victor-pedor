import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { generateSrt } from "@/lib/srt/generator";
import { validateSrt } from "@/lib/srt/validator";

const SubtitleSchema = z.object({
  index: z.number(),
  startTime: z.number(),
  endTime: z.number(),
  text: z.string(),
});

const RequestSchema = z.object({
  subtitles: z.array(SubtitleSchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Provide 'subtitles' array." },
        { status: 400 }
      );
    }

    const validation = validateSrt(parsed.data.subtitles);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid subtitles",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const srtContent = generateSrt(parsed.data.subtitles);

    return new Response(srtContent, {
      headers: {
        "Content-Type": "text/srt; charset=utf-8",
        "Content-Disposition": "attachment; filename=subtitles.srt",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SRT generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

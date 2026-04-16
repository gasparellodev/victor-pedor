import { z } from "zod/v4";
import { correctSubtitles } from "@/lib/claude/client";
import { updateVideo } from "@/lib/db/videos";

const SubtitleSchema = z.object({
  index: z.number(),
  startTime: z.number(),
  endTime: z.number(),
  text: z.string(),
});

const RequestSchema = z.object({
  subtitles: z.array(SubtitleSchema),
  videoId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request. Provide 'subtitles' array." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { videoId } = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        send("status", { stage: "correcting" });

        const corrected = await correctSubtitles(parsed.data.subtitles);

        if (videoId) {
          await updateVideo(videoId, {
            status: "ready",
            subtitles: corrected,
          });
        }

        send("result", { subtitles: corrected });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Correction failed";

        if (videoId) {
          await updateVideo(videoId, {
            status: "error",
            errorMessage: message,
          });
        }

        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { submitTranscription } from "@/lib/assemblyai/client";
import { updateVideo } from "@/lib/db/videos";

const RequestSchema = z.object({
  blobUrl: z.url(),
  videoId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Provide a valid 'blobUrl'." },
        { status: 400 }
      );
    }

    const transcriptId = await submitTranscription(parsed.data.blobUrl);

    if (parsed.data.videoId) {
      await updateVideo(parsed.data.videoId, {
        status: "transcribing",
        transcriptId,
      });
    }

    return NextResponse.json({ transcriptId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  checkTranscriptionStatus,
  wordsToSubtitles,
} from "@/lib/assemblyai/client";
import { updateVideo } from "@/lib/db/videos";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing transcript ID" },
        { status: 400 }
      );
    }

    const result = await checkTranscriptionStatus(id);

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (result.status === "error") {
      if (videoId) {
        await updateVideo(videoId, {
          status: "error",
          errorMessage: result.error ?? "Transcription failed",
        });
      }
      return NextResponse.json(
        { status: "error", error: result.error },
        { status: 200 }
      );
    }

    if (result.status === "completed" && result.words) {
      const subtitles = wordsToSubtitles(result.words);

      if (videoId) {
        await updateVideo(videoId, {
          status: "correcting",
          subtitles,
        });
      }

      return NextResponse.json({ status: "completed", subtitles });
    }

    return NextResponse.json({ status: result.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

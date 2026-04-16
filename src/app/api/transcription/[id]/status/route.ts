import { NextResponse } from "next/server";
import {
  checkTranscriptionStatus,
  wordsToSubtitles,
} from "@/lib/assemblyai/client";

export async function GET(
  _request: Request,
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

    if (result.status === "error") {
      return NextResponse.json(
        { status: "error", error: result.error },
        { status: 200 }
      );
    }

    if (result.status === "completed" && result.words) {
      const subtitles = wordsToSubtitles(result.words);
      return NextResponse.json({ status: "completed", subtitles });
    }

    return NextResponse.json({ status: result.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getVideoById } from "@/lib/db/videos";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const video = await getVideoById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const blobResult = await get(video.blobUrl, { access: "private" });

    if (!blobResult || !blobResult.stream) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    const contentType = blobResult.blob.contentType ?? "video/mp4";
    const size = blobResult.blob.size;

    return new Response(blobResult.stream as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        ...(size ? { "Content-Length": size.toString() } : {}),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stream failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

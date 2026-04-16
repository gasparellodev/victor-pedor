import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { getVideoById, updateVideo, deleteVideo } from "@/lib/db/videos";
import { UpdateVideoSchema } from "@/lib/db/schema";
import { deleteVideo as deleteBlobVideo } from "@/lib/blob/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid video ID format" }, { status: 400 });
    }

    const video = await getVideoById(id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid video ID format" }, { status: 400 });
    }

    const body = await request.json();

    const parsed = UpdateVideoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update data", details: z.prettifyError(parsed.error) },
        { status: 400 }
      );
    }

    const video = await updateVideo(id, parsed.data);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid video ID format" }, { status: 400 });
    }

    const video = await getVideoById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    await deleteBlobVideo(video.blobUrl);
    if (video.thumbnailUrl) {
      await deleteBlobVideo(video.thumbnailUrl).catch(() => {});
    }
    await deleteVideo(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

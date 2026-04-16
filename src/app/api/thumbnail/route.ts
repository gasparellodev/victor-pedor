import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { updateVideo } from "@/lib/db/videos";

const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const videoId = formData.get("videoId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      return NextResponse.json({ error: "Thumbnail too large. Max 2MB." }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    if (typeof videoId === "string" && UUID_REGEX.test(videoId)) {
      const updated = await updateVideo(videoId, { thumbnailUrl: blob.url });
      if (!updated) {
        console.warn(`Thumbnail uploaded but video ${videoId} not found in DB`);
      }
    }

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Thumbnail upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

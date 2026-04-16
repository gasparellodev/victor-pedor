import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { updateVideo } from "@/lib/db/videos";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const videoId = formData.get("videoId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Save thumbnail URL to DB if videoId provided
    if (typeof videoId === "string" && videoId.length > 0) {
      await updateVideo(videoId, { thumbnailUrl: blob.url });
    }

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Thumbnail upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

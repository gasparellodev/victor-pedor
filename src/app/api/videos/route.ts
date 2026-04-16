import { NextResponse } from "next/server";
import { listVideos } from "@/lib/db/videos";

export async function GET() {
  try {
    const videos = await listVideos();
    return NextResponse.json({ videos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

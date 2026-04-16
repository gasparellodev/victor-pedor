import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/videos";

export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database initialization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

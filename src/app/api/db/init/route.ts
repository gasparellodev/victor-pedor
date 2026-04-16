import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/videos";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.DB_INIT_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database initialization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
